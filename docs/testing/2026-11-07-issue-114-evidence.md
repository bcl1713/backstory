# Issue #114 focused verification

Base: `8b28c19fbf3c9052b05c84ae66cc0499d2bc0e08` on `origin/dev`.
Worktree: `/tmp/backstory-114`, branch `fix/114-scan-relation-visibility`.
Runtime: existing frozen project virtualenv, Python 3.14.4, Linux x86_64;
real SQLite and disposable synthetic wiki roots created by pytest fixtures.
No live notes, worker settings or deployment were changed.

## Selected checks and results

- New core regression selection:
  `/home/oracle-worker/Work/backstory/.venv/bin/python -m pytest tests/integration/test_graph_index.py -k 'unchanged_scans_keep or scheduler_transition' -q`.
  After correcting the controlled-time fixture to use `run_batch(now=...)`
  instead of changing the clock used by signed cursor expiry, all four cases
  failed against the original implementation for the expected visibility and
  scheduler-transition errors. After the production fix: **4 passed** (1.35s).
- Focused integration selection:
  `/home/oracle-worker/Work/backstory/.venv/bin/python -m pytest tests/integration/test_graph_index.py tests/integration/test_graph_queries.py tests/integration/test_graph_tools.py tests/integration/test_graphviz_frame.py -q`.
  **69 passed, 4 failed** (11.68s). The failures were incorrect new safety-test
  expectations: denied incoming paths raise `PathDenied`; an unknown stored
  projection namespace withholds relations without necessarily expiring a
  continuation. Production code needed no further change.
- After correcting those expectations, reran the affected safety selection only:
  `/home/oracle-worker/Work/backstory/.venv/bin/python -m pytest tests/integration/test_graph_queries.py -k reconciliation_retains -q`.
  **14 passed, 19 deselected** (2.00s).
- `git diff --check`: passed.

- Whole-branch review found one important finish-time race: a scan starting
  during a request could leave missing/ambiguous/isolation claims in an
  incomplete response. Four additional regression cases all failed as expected
  before the finalizer correction (0.87s). After fixing finalization, reran the
  three affected index/query/tool files:
  `/home/oracle-worker/Work/backstory/.venv/bin/python -m pytest tests/integration/test_graph_index.py tests/integration/test_graph_queries.py tests/integration/test_graph_tools.py -q`.
  **66 passed** (11.86s). This includes all four review regressions and all
  fourteen safety cases. Reused the **11 passing frame tests** from the earlier
  wider run: the finalizer edit does not affect their frame/session checks.

The combined focused evidence covers **77 distinct passing tests**. This is
not a fresh full-suite pass. Total development test execution was under one
minute. Final production/test diff against the base has SHA-256
`2497a2a21661d11f16985c945e6009f1eb644f6c37ae82c72f2693c61a4552c3`.
Only this evidence record and the plan changed after the final passing run.

## Established behavior

Unchanged incremental, verify and controlled-time scheduled scans retain outgoing
links, backlinks and local/global graph edges while queued and after their first
batch. Responses report actual scan freshness and conservative incomplete status.
Link and graph continuations survive freshness-only transitions. Relation rows,
occurrence identities and epoch are preserved, with no new resolution work.
Scheduler transitions during a request retain safe evidence.

Queued/running safety cases withhold changed and dirty sources, deleted and
denied endpoints, unavailable storage and mismatched namespace/mutation evidence.
Independent clean relations remain visible when the affected evidence can be
isolated. Policy and storage boundaries remain conservative. A real rebuild
expires a prior-generation continuation; existing tests retain mutation,
publication, endpoint, authentication and no-store checks.

## Review and release ownership

Independent read-only whole-branch review found no critical or minor issues.
Its one important finding was fixed and verified RED→GREEN as recorded above;
there were no other blockers. Canvas behavior and scan duration remain outside
this fix's scope; publication readiness remains the publisher's responsibility.
Existing signed cursors restart once across this change because their identity
format changes; subsequent freshness-only transitions preserve pagination.

The automatic publisher owns
the complete release gate on the resulting dev merge commit, followed by image
and prerelease publication. No duplicate premerge full gate, browser benchmark
campaign or deployment is part of this fix.
