# Issue 134: graph population investigation

Inspected working tree: clean `41a35e2` before this evidence file was added.
No application code, live wiki, settings, branches or deployment were changed.
All measurements below use disposable synthetic notes and index rows.
Runtime: Python 3.14.4, Django 5.2.18, SQLite 3.46.1, repository `.venv`.

## Initial findings, before implementation

`indexing/graph_traversal.py::_discover` scans outgoing raw occurrences for
every member, including members at the requested maximum depth. Their outgoing
targets do not enlarge membership, but still consume raw-row windows,
hydration queries, filters and endpoint eligibility checks. A final-layer hub
therefore makes the requested neighborhood's cost depend on links outside it.

`_emit` returns connections only after discovery has completely finished.
Already confirmed root-to-neighbor connections remain in the private scratch
database while the client repeatedly receives empty discovery responses.
The slice is 100 raw rows or 16 frontiers, with a cooperative 25ms deadline.
`static/src/graph-controller.js::scheduleAutomatic` adds 40ms between responses.

`indexing/graph.py::_bounded` applies `indexing/search.py::sqlite_budget` to the
entire request: 200,000 VM steps or 100ms elapsed. Elapsed time includes Python,
filesystem validation and scratch-database setup. The next SQLite progress
callback can therefore interrupt a cheap statement after unrelated slow work.
The callback runs every 1,000 VM instructions, not at every statement boundary.

## Synthetic evidence

The reproduction contains a root with seven outgoing first-layer notes and 85
second-layer notes. Its induced graph has 93 nodes and 278 directed pairs.
One second-layer note has 12,000 additional occurrences pointing to an eligible
note outside the selected two-hop scope. Repeated occurrences were inserted
using the worker's real model schema after indexing the small note corpus, to
avoid spending diagnostic time repeatedly resolving the same spelling. This is
synthetic index construction, not a measurement of worker ingestion performance.
Matching the reported counts is deliberate fixture construction, not evidence
that the deployed topology or failing statement is the same.

A temporary Python execute wrapper counted operations by fixed function labels.
A temporary progress handler used the unchanged 200,000-step / 100ms limits and
recorded only threshold, cumulative instructions, elapsed time and operation.
Neither SQL text nor note identities/content were logged.

| Measurement | Result |
| --- | --- |
| Requests through completion | 140 |
| First response containing a connection | Request 129 |
| Responses with no connections | 130 |
| Final membership / directed pairs | 93 / 278, complete |
| Server time through first connected response | 1,145.62ms |
| Server time through completion | 1,457.32ms |
| Django SQL operations through completion | 2,981 |
| Operation counts | 442 adjacency, 221 discovery filtering, 636 priming, 1 initial eligibility, 1,681 setup/finalization |
| Additional minimum client timer delay before first connection | 128 × 40ms = 5,120ms |

These are cumulative direct server timings on this executor. They exclude HTTP,
browser rendering and tool overhead, but include the lightweight diagnostic
wrappers. The client timer contribution is calculated from source; it was not a
browser timing measurement. No broad benchmark matrix was run.

A second diagnostic injected one 110ms delay into the first endpoint stat check.
The request failed with `graph_query_limited` after 26 Django SQL operations;
the callback recorded the wall-time threshold at 127.97ms and only 1,000
cumulative VM steps, during `_adjacent`. This establishes a reproducible
wall-clock failure mechanism, not the failing operation in the live deployment.
The source-free database-error/budget distinction remains unchanged.

## Checks run

- `.venv/bin/python -m pytest tests/integration/test_graph_queries.py::test_local_depth_traverses_shortest_eligible_links_and_shrinks_cycles -q`:
  1 passed, 0.59s. Existing one-/two-/three-/eight-hop membership and cycle
  behavior passes on the inspected application state.
- `.venv/bin/python -m pytest -c pyproject.toml /tmp/probe_graph_134.py -q -s`:
  1 passed, 4.26s. Diagnostic collected complete synthetic results and the delay
  above; passing means the observation ran, not that issue 134 is fixed.
- The same probe with one injected slow stat, selected with `-k True`:
  1 passed, 1 deselected, 3.15s. Diagnostic caught and reported the expected
  request failure. This does not count as a successful graph load.
- The slow-stat selection after refining adjacency labels: 1 passed, 1
  deselected, 2.95s. This rerun answered which adjacency operation failed:
  relation-row hydration, at 128.26ms and 1,000 cumulative VM steps. Operation
  counts were 5 ID seeks, 5 hydration queries, 4 priming, 4 discovery filtering,
  1 initial eligibility and 7 setup/finalization operations.
- `git diff --check`: passed. No application tests were repeated for these
  documentation additions. Cumulative selected test execution was 10.95s.

The temporary diagnostic remains at `/tmp/probe_graph_134.py` in this executor;
the fixture, limits and instrumentation are described above so that the evidence
does not depend on that temporary file surviving.

At that investigation checkpoint, no release gate, browser check, fresh
full-suite pass or independent review was claimed. Prior passing evidence was
consulted for context, not transferred to a new commit. Implementation had not
started; its subsequent evidence follows.

## Implementation and focused evidence

The paragraphs above record the initial investigation. After owner authorization,
implementation started from current dev `3190a2516be3c60722755e7ead549153344e230f`.
Its newer <=32-member optimization still fell back to full discovery for the
representative neighborhood. The permanent fixture is now
`tests/fixtures/graph.py::populate_two_hop_hub`; no private vault was consulted.

Two new regressions failed before implementation in 4.20s. On this current base,
the fixture took 139 requests, first connected request 128, 1,428.51ms cumulative
server time, 2,727 Django SQL operations and 886 eligibility operations. The
virtual filesystem-delay reproduction raised `graph_query_limited`.

The implementation retains private resumable state, publishes each discovered
directed pair once using its full indexed aggregate, and keeps bounded pending
output through replay/rollback. Final-layer sources compare bounded indexed
fanout with membership size and choose the smaller raw-source/member-pair domain.
Depth > 1 no longer has a separate small-size path or redundant fallback scan.
The existing one-hop fast path and SQL fallback remain intact. A versioned cursor
query stamp rejects old scratch schemas. Search's watchdog is unchanged; graph
SQL resets its emergency 2,000,000-instruction / one-second guard per statement,
retaining it through fetch and removing it on exit.

- New regressions after implementation: 2 passed in 3.18s. Representative result:
  13 requests, **first connected request 1**, first response 95.55ms, cumulative
  server work 561.79ms, 821 Django SQL operations, 384 eligibility operations,
  exact 93 members / 278 directed pairs, complete, no outside-target stat.
- Focused traversal/query/diagnostic files: 93 passed, 1 failed in 87.65s.
  The failure identified removal of the one-hop fast path; that path was restored.
- After restoration, the affected one-hop hub, two-node one-hop paging and
  one-/two-/three-/eight-hop cycle checks: 3 passed in 5.39s. Other 93 focused
  results remain applicable; this is combined focused evidence, not a full suite.
- Fresh Firefox real-HTTP default two-hop hub plus refresh/depth-change scenario:
  1 passed, test 7.4s, command 10.4s. First response contained connections and
  automatic loading reached 93/278 Complete. Refresh while changing to one hop
  reached 8/7 Complete, then returning to two hops reached 93/278 Complete.
  Browser timing output is retained by the candidate gate; these direct server
  timings exclude browser/HTTP/tool cost. No UI timing claim is inferred from them.
- The initial sandbox browser server could not bind loopback; the authorized
  external executor ran the passing scenario. Runtime:
  `/tmp/backstory-134-browser`, port 8884, repository locked dependencies,
  Python 3.14.4 and Playwright Firefox. Two synthetic screenshots were retained
  under that runtime's `reports/browser-artifacts` and inspected: correct complete
  counts and connection-list fallback; WebGL was unavailable in this browser.
  Rendering code is unchanged. A later test-only change removes its response
  listener before intentional cancellation and prints timing metrics; the exact
  candidate gate validates that final test version.

The merge candidate must pass its own full gate and independent exact-SHA review.
Publication will reuse that receipt without another application-test run.
