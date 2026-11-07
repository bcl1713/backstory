# Issue 123 backend evidence — 2026-11-07

## Scope and environment

Backend investigation and focused verification only. The live wiki was not
opened or changed. Tests use disposable synthetic storage and SQLite databases.
Base commit: `846f2773cc568780dc468f0b49f52282e70ca3b4`.
Python 3.14.4, Django 5.2.18, SQLite 3.46.1, repository `.venv`.
SQLite request limits remain 200,000 VM steps and 0.1 seconds; no budget or clock
override is used by the representative neighborhood regression.

The minimum selected checks were `test_graph_queries.py` for neighborhood depth,
filters, privacy, bounded pagination and the reported failure, together with
`test_index_diagnostics.py` for redacted error classification. Passing these
establishes those contracts; it does not establish a full-suite or release pass.

## Diagnosis and change

Depth greater than one first traversed eligible endpoints, then executed one
`IndexedNote` existence query per reached path to apply display filters. Those
queries all shared the same request SQL deadline. Shrinking the eventual response
did not shrink that traversal/filter work.

A hub with 290 linked neighbors, each linking to eight following neighbors,
reproduced `graph_query_limited` with `depth=2,node_limit=2,edge_limit=1`.
A temporary execute wrapper recorded 305 SQL statements before interruption;
the last was the bounded membership-to-note-ID selection following the repeated
existence queries. The temporary SQL tracer was removed. A smaller 161-note
fixture did not reproduce the failure. Replacing per-path filter queries with a
single bulk filtered-node query made the previously failing request succeed.
Existing endpoint filesystem eligibility checks and traversal through filtered
bridges remain in place.

The final regression adds one further endpoint behind the dense neighborhood,
for 292 notes and 2,611 relations. Bounded incident-pair collection can omit its
membership. Such truncation now reports `state=incomplete`,
`projection_complete=false`, and `neighborhood_limit` together with
`edge_candidate_limit`. Occurrence pagination cannot restore omitted membership;
one-hop traversal is the practical recovery. Default response limits and the
small two-node/one-edge response both return usable evidence.

The graph wrapper now observes the existing budget's `triggered` flag. A real
budget interruption retains `graph_query_limited`; unrelated SQLite operational
errors return `graph_database_error`. Redacted diagnostics allow operation
`graph`, reason `graph_budget_exceeded` or the existing database reason, SQLite
error code/name and `budget_triggered`. They retain no paths, SQL, titles,
exception messages or tracebacks. Tests exercise real SQLite interruption and a
real nonexistent-table error, including recovery after the interrupted query.

## Commands and results

Exploratory fixture-size changes and diagnostic instrumentation were each run to
answer a new question; no unchanged failing command was repeated without a
diagnostic change.

| Command | State and result | Test duration |
| --- | --- | --- |
| `.venv/bin/python -m pytest tests/integration/test_graph_queries.py::test_two_hop_linked_neighborhood_works_with_small_response_limits -q` | Initial 161-note probe: passed; too small to reproduce | 3.62s |
| Same selected test after increasing to 291 notes | Before fix: failed with `graph_query_limited` | 6.78s |
| Same selection with `-q -s`, execute-error tracer | Failed; established interruption occurred during result consumption rather than execute | 6.85s |
| Same selection with `-q -s`, last-statement tracer | Failed; recorded 305 SQL statements and membership-ID selection as last SQL | 6.73s |
| Same selection with `-q -s`, after bulk filter change | Passed under unchanged budget | 6.49s |
| `.venv/bin/python -m pytest tests/integration/test_index_diagnostics.py::test_graph_budget_has_source_free_diagnostic tests/integration/test_index_diagnostics.py::test_graph_database_failure_is_not_budget_exhaustion -q` | Before diagnostics fix: both failed, missing diagnostic and mislabeled database error respectively | 0.56s |
| `.venv/bin/python -m pytest tests/integration/test_graph_queries.py tests/integration/test_index_diagnostics.py -q` | 51 passed, including both diagnostic regressions | 15.66s |
| Selected dense-neighborhood test after adding incomplete-state assertion | Before truncation-status fix: failed because state was `ok` | 6.45s |
| `.venv/bin/python -m pytest tests/integration/test_graph_queries.py -q` | Final graph code and 292-note fixture: 36 passed | 14.60s |

Total selected-test execution time: approximately 68 seconds. The final graph
run covers the later traversal-status change. Diagnostics implementation and
tests were unchanged after the 51-test run, so its 15 diagnostic results are
reused; the combined evidence is not a fresh full-suite pass. The candidate
release gate, browser validation and independent review belong to the parent
task and are not claimed here.

Final tested file SHA-256 values:

```text
39fb00cab55a6ee7f589b695cbe9a052a1f3385466c0afd2b1c2b6c90236cf3a  indexing/graph.py
b14cfe719fbe3811916897db7908298b1e769de9d8a9b237d22293bac04047d2  indexing/diagnostics.py
010611a227a7dd99e9048b779f0e42737f165e06e3bf994fcf9d372f9e3afe21  tests/integration/test_graph_queries.py
ff9ff8e7aa5760d1f8fcd08f0a0b9df92aac017da440ee854549957bc42cf880  tests/integration/test_index_diagnostics.py
```

No application check was repeated merely to write this evidence. No commit,
branch, merge or publication action was performed by this backend subtask.
