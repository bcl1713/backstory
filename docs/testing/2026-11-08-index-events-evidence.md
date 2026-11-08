# Issue 118 focused indexing evidence

Working tree on `feat/118-132-136-index-graph`, based on
`516be5967d1e95ded307abfc1dfc93294c05c563`. Python 3.14.4, Django 5.2.18,
repository-pinned `.venv/bin/pytest`; disposable SQLite/filesystem fixtures only.
No live note changes, deployments, git mutations or release gates by indexing agent.
Combined focused evidence below is not a fresh full-suite pass. Cumulative
verification, including observed failures, approximately 2.2 minutes.

## Behavior and bounds

- Native Linux inotify service owns one bounded watcher lease. Parent watches are
  registered before enumeration; startup, completed coverage, directory changes,
  overflow, failure, unsupported setup and changed namespace/storage identity
  leave durable verification intent. Poll-only mode retains periodic metadata and
  content verification. A failed setup retries after 30 seconds without repeatedly
  restarting the repair scan during its cooldown.
- Durable path jobs have independent version UUIDs, coalesced debounce with maximum
  wait, and conditional acknowledgements. Source bytes are authoritative. Missing
  paths first persist an observed-absence timestamp; replacement grace starts from
  that observation even for old coalesced edits. Missing parents or uncertain
  storage require reconciliation. Source files are never deleted by indexing.
- Separate metadata/content budgets; bounded metadata field queries and batched
  seen updates. Unchanged bodies, content projections, FTS, relation resolution,
  completed graph evidence and dependency rows remain untouched. Directory cursor
  cache prevents repeated prefix traversal, while cache loss charges replay to
  the enumeration budget. Rebuild candidate body validation remains intact.
- Service wakes on native events and checks due foreground jobs within 0.1 seconds
  of idle wait; cheap batches have no fixed one-second-per-20 delay. Native calls,
  content work, queue writes, elapsed quanta, handles and in-memory path sets are
  bounded. No production millisecond throughput guarantee is inferred.
- Active phase/counters, last reconciliation and verification, watcher mode/health
  and allowlisted fallback reasons extend `/index/status/`. Graph disclosure UI
  is owned and tested by the parent task.

## Commands and outcomes

| Command | Result and applicability |
| --- | --- |
| `.venv/bin/pytest -q tests/integration/test_index_events.py` (test-first baseline) | 5 expected failures in 12.41s: fixed content-sized warm batches and missing invalidation API. |
| `.venv/bin/pytest -q tests/integration/test_index_watcher.py` (test-first baseline) | 4 expected failures in 0.47s: missing watcher. |
| `.venv/bin/pytest -q tests/integration/test_scanner_efficiency.py` | Scanner agent: 4 passed in 0.30s after observed wide-directory/replay failures. Linear wide enumeration, restart replay bound, concurrent mutation and descriptor cap. Source unchanged since this pass. |
| `.venv/bin/pytest -q tests/integration/test_index_watcher.py tests/integration/test_indexing.py tests/integration/test_index_events.py tests/integration/test_scanner_efficiency.py` | 29 passed in 14.77s after fixing native iterator fd ownership. Includes Linux native atomic replacement and new-directory smoke in a disposable fixture. |
| `.venv/bin/pytest -q tests/integration/test_index_events.py tests/integration/test_index_watcher.py tests/integration/test_graph_index.py tests/integration/test_worker_concurrency.py tests/integration/test_index_diagnostics.py tests/integration/test_configuration.py` | 121 passed, 2 failed in 22.99s. Graph/index diagnostics passed. Both failures: direct concurrency tests' minimal synthetic `_finish` checkpoint omitted `kind`; compatible lookup fixed and concurrency rerun below. |
| `.venv/bin/pytest -q tests/integration/test_index_events.py tests/integration/test_index_watcher.py tests/integration/test_worker_concurrency.py tests/integration/test_configuration.py tests/integration/test_compose_env.py` | 144 passed in 22.14s. Actual parse/sparse dependency counts, watcher cooldown recovery, safe deletion/move, same-stat edits, alias collision, unreadable invalidation, configuration validation and Compose forwarding. Reused for unchanged watcher/configuration/Compose behavior. |
| `.venv/bin/pytest -q tests/integration/test_index_events.py tests/integration/test_indexing.py` | 26 passed in 14.88s after final priority elapsed budget and controlled-clock metadata check. |
| `.venv/bin/pytest -q tests/integration/test_index_events.py tests/integration/test_indexing.py tests/integration/test_worker_concurrency.py` | Final affected check: 32 passed in 15.04s after review fixes. Adds fresh absence grace for old coalesced edits and persistence of actual parse counters when priority jobs fill a batch; rechecks migrations/queue writer reservation, stale-revision protection, same-stat daily verification, overflow reconciliation and generation safety. |
| `.venv/bin/pytest -q tests/integration/test_index_events.py -k 'missing or absence or reappearance or delete'` | Final deletion-race refinement: 5 passed, 8 deselected in 0.75s. Reappearance clears old absence grace and a file-to-missing race cannot reuse the old deletion permission. |
| `.venv/bin/python -m compileall -q indexing backstory/settings.py` and `git diff --check` | Passed before final deletion-guard refinement; final `git diff --check` also passed. The last focused pytest imported/executed the refined worker. |

Independent scanner-agent review confirmed safe no-follow traversal, version ACKs,
writer reservations, recovery and attachment existence handling. Its missing-path
grace finding is resolved by `missing_since` plus the final regression above.
Parent independent review's full-priority-batch counter finding is also resolved.
Its final reappearance/old-grace race is covered by the last focused check.

Directory structural events deliberately trigger conservative content verification;
directory-heavy edits can read unrelated bodies. Ordinary single-file edits and
non-note exact-path invalidations remain path-only. Unsupported filesystems use
polling; native smoke validates this Linux environment only. Full release gate,
exact-candidate independent review, landing and publication remain parent-owned.

## Final backend source SHA-256

```text
b2cfefb75539c0adbfa35b07c49a74d4a904f165d75a0a01aca45216c20a9709  indexing/models.py
a50aa55c2bcc9e558582f309e368219d7f08ef043734d6902dc16c8a445fd749  indexing/queue.py
4b24b5841352a0316681a740c6d41c619eb5260d40bd4cbb806a17e34c664ee3  indexing/scanner.py
bb5b0a8c4b312965c5c6efd2de334cb00ab8147da3dd0f01d6fc9f61da117fdb  indexing/worker.py
3f56d91c19a8f99ceb65e8585fcb9f60af2e3bf1c61468d6ed5c0711f84683aa  indexing/watcher.py
1de83f4f8a778c91cc4c7086e17226b59614911bf61f8b256a1b03d192530866  indexing/graph_projection.py
4bcc02a5510d6503d97603fcffe426ae51344cb4861f8004379d40830bdfc220  indexing/management/commands/run_indexer.py
94ccebc00c3b7002cb97cac115a199349e0c1e88f4cedb358ea9d129bec0f0b0  indexing/migrations/0011_path_invalidations.py
e9366d7e8f404362a19af051eb258eb721db6db95d1b9d792bcaea0a4bc6b5c4  backstory/settings.py
```
