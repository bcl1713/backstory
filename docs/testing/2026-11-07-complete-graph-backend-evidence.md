# Complete graph backend evidence — 2026-11-07

Scope: backend issues #123/#126, Task 1 of the approved complete-graph plan. No commit, merge, publication, full suite, or release gate was performed. All graph data used here is synthetic; no live note content was read or included in diagnostics.

## Implementation and limits

- Depths 2–8 now use a private, expiring SQLite traversal database under `BACKSTORY_DATA_DIR/graph-traversals`. Indexed membership/frontier and directed-pair tables avoid loading the accumulated graph into each request. Breadth-first queue ordering establishes undirected shortest-hop membership. Display filters apply after eligible traversal, so filtered bridges remain traversable; dirty source relations and ineligible endpoints do not create paths.
- Each request processes at most 100 raw adjacency rows and 16 frontier operations before yielding, plus bounded output windows. Soft 25ms discovery/output slices cooperate with the unchanged hard Django SQLite budget: **0.1 seconds / 200,000 VM steps**, at most **300 endpoint eligibility checks**, **200 response nodes / 500 edges / 512KiB**, and **4096-character cursors**. Soft slices guarantee one state-advancing bounded operation before yielding. There is no total membership cap.
- Migration `0010_relation_adjacency_pages` adds source/target occurrence-order indexes. Adjacency windows seek by endpoint and occurrence ID before filtering dirty/non-note rows, avoiding full-generation or whole-hub aggregation. Outgoing scans aggregate each occurrence once across work units; incoming scans discover membership. Last-layer induced edges are retained.
- Signed cursors bind query, generation, mutation, namespace, relation epoch/completeness/publication, session and revision. Transactions roll back failed requests. The immediately prior response is cached for lost-response/pause/resume retries; graph evidence and next cursor replay identically after endpoint/witness revalidation. Older checkpoints, expired/missing state, and revoked ancestry explicitly expire. Concurrent state lock/resource failures return `graph_traversal_unavailable`, without advancing state. Files expire after one hour and bounded cleanup is amortized across requests.
- Stored shortest-path witnesses recheck bridge filesystem eligibility before emitting descendants. Public errors and existing diagnostic records contain no private paths, SQL, or source text. Ordinary one-hop and whole-wiki paging retain their prior paths; a one-hop two-node-page stall on neighbor-to-neighbor edges was also reproduced and fixed.
- Empty pages carry `discovery_pending` and a usable continuation. Final available evidence remains incomplete when the index/policy/evidence is incomplete. A one-node response cannot represent an edge; the existing explicit `node_limit`/boundary behavior is retained.

## Test selection and results

The selected checks establish complete high-degree/deeper membership and occurrence counts, paging under default/small output bounds, shortest-hop/cycle/inbound behavior, filtered and revoked bridges, query/stamp/session expiry, replay/rollback, redacted failures, and existing graph/tool contracts. Tests use production budgets, without increasing them. Approximate cumulative pytest execution: **149 seconds**; no expensive discretionary campaign was added.

1. Red regression: `.venv/bin/pytest -q tests/integration/test_graph_traversal.py -x` — **1 failed, 7.93s**, expected: old implementation permanently omitted hundreds of members of a 620-leaf second-hop intermediate.
2. Initial implementation: `.venv/bin/pytest -q tests/integration/test_graph_traversal.py tests/integration/test_graph_queries.py -x` — **39 passed, 1 failed, 38.72s**. Failure was the former regression explicitly expecting immediate dense first-page output and `neighborhood_limit`; updated it to follow continuations and assert complete membership instead. Small early implementation cleanup was applied during this exploratory run; it is not the final-state receipt.
3. Retry red: `.venv/bin/pytest -q tests/integration/test_graph_traversal.py::test_retry_of_lost_continuation_response_preserves_page_and_following_cursor` — **1 failed, 0.78s**, expected consumed-cursor failure, before adding bounded response replay.
4. Retry + dense completion: `.venv/bin/pytest -q tests/integration/test_graph_traversal.py::test_retry_of_lost_continuation_response_preserves_page_and_following_cursor tests/integration/test_graph_queries.py::test_two_hop_linked_neighborhood_works_with_small_response_limits` — **2 passed, 12.14s**. Dense fixture: 292 nodes, 2,611 directed pairs; late `far.md` now included.
5. Added invalidation and transactional behavior: `.venv/bin/pytest -q tests/integration/test_graph_traversal.py -k 'revokes or eight_hop or interrupted'` — **9 passed, 5 deselected, 1.65s**.
6. One-hop stall red/green: `.venv/bin/pytest -q tests/integration/test_graph_traversal.py::test_one_hop_small_page_does_not_stall_on_neighbor_to_neighbor_edge` — **failed 0.64s**, then **passed 0.51s** after allowing the neighbor pair to occupy the two-node response.
7. Query-plan diagnostic: temporary synthetic `_probe_graph_plan.py`, `.venv/bin/pytest -s -q tests/integration/_probe_graph_plan.py` — **1 passed, 0.50s** with 2 occurrence IDs, then **1 passed, 0.59s** with the changed 100-ID window. Both with and without redundant `state='resolved'`, `EXPLAIN QUERY PLAN` selected `relation_page (generation_id=? AND epoch=? AND occurrence_id=?)` plus primary-key edge/note lookups; no `relation_issues` scan. Removed the redundant state predicate consistent with the projector's `resource_type='note'` guarantee. Temporary probe removed.
8. Combined focused check: `.venv/bin/pytest -q tests/integration/test_graph_queries.py tests/integration/test_graph_traversal.py tests/integration/test_graph_tools.py tests/integration/test_index_diagnostics.py` — **83 passed, 46.98s**.
9. Independent review identified a cooperative deadline that could yield before any state advanced. New red regression: `.venv/bin/pytest -q tests/integration/test_graph_traversal.py::test_slow_setup_soft_deadline_still_advances_discovery_and_output` — **1 failed, 0.69s**. The traversal-local test clock exceeds each soft slice while leaving the hard SQLite clock unchanged; 40 requests made no progress before the fix.
10. After the progress-guarantee fix, reran only affected discovery/output cases: `.venv/bin/pytest -q tests/integration/test_graph_traversal.py tests/integration/test_graph_queries.py -k 'slow_setup or depth or two_hop or high_degree or occurrence_counts or retry or interrupted or eight_hop'` — **11 passed, 43 deselected, 37.34s**. Existing tools/diagnostic and unaffected cursor-binding results from item 8 are reused; this is combined focused evidence, not a fresh full-suite pass. Independent reviewer confirmed the guards preserve hard limits and handle empty/filtered windows.
11. Migration consistency using disposable test configuration:
   ```python
   import tests.conftest
   from django.core.management import call_command
   call_command('makemigrations', 'indexing', check=True, dry_run=True, verbosity=1)
   ```
   `.venv/bin/python` — **exit 0, 0.10s**, `No changes detected in app 'indexing'`.
12. `git diff --check -- indexing/graph.py indexing/models.py tests/integration/test_graph_queries.py` — **exit 0**.

## Tested source and runtime

Base HEAD: `90efc8cc61938cef1a0d6efff0d53d036da07421`, shared uncommitted working tree. Runtime: Python 3.14.4, SQLite 3.46.1, Django 5.2.18. Tests create disposable wiki/data/database fixtures through `tests/conftest.py`; migration 0010 is applied by test database setup.

The 83-test result used traversal hash `22e4fc94c86a0f6fb69872b6594598de6a66fa681ed965e2a12eeaac0a8a148a` and traversal-test hash `a36fc2b090a0dad2280ad95343b56a7866941345bfad67cf62d80d0442a2717c`. The final targeted 11-test result covers the subsequent soft-yield fix and added regression. Other hashes below are unchanged between those runs.

Final SHA-256 (`sha256sum`):

```text
675b8efa91e952569aa7f27974bf379c7a2aea7c1533160764ee4fd4eb25ee29  indexing/graph.py
5349b7a289bb1f8d4f49fa86c01b9132c3d98ed92131e5a072109664ce5f4a80  indexing/graph_traversal.py
4d6e7cc677d3a7a93d1ceeebfa110972cde60f631fb147be19be4aeaaf6435e6  indexing/models.py
e8601e6254366338725b9500045a5b8e0911f89980fcc55ff6f99e5d0d623989  indexing/migrations/0010_relation_adjacency_pages.py
9ee3b8793e71aac51db0978fd6251d1ed7127403d41911a684ddf3ce4a29250e  indexing/search.py
ce4a0190354ef7ac43c8088de137db590160abb811a234347ecab4d3d25f6d7e  tests/integration/test_graph_queries.py
736326ac1b25e57bd1b64a1afb04f894f479c4473338b7580a6f52a415f40e2b  tests/integration/test_graph_traversal.py
6de6a8b837b5062a9e646d8ec842a6f00b5bcd085f88a05d0b32aa5d0552029f  tests/integration/test_graph_tools.py
ff9ff8e7aa5760d1f8fcd08f0a0b9df92aac017da440ee854549957bc42cf880  tests/integration/test_index_diagnostics.py
```

## Remaining boundaries

Frontend/browser review evidence belongs to the parent task. No release candidate or publication receipt exists for this work; the candidate queue still owns the full gate before merge/publication. Expiry and bounded cleanup are request-driven, so an idle service retains abandoned state until later graph activity. Actual disk exhaustion/contention is surfaced explicitly, not converted into an apparently complete graph.
