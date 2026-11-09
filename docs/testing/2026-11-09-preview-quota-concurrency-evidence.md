# Preview quota concurrency evidence

## Change and limits

Move and removal previews reserve SQLite's writer before their short capacity
and quota transaction reads, using a no-op UPDATE on the prospective journal
UUID. The filesystem scan, link planning, existing locks, exact-target guards,
quotas and explicit commit remain in place. The reservation follows the existing
move-commit and index-queue pattern. No UI, assets, database mode, deployment
permissions, timeouts or automatic mutation retries change.

The latest native acceptance report on #148 observed an application-level
`move_storage_unavailable`, followed by `removal_unavailable` during fixture
cleanup. This change fixes a locally reproduced race capable of producing
those failures; it does not establish their exact live cause. Live move/archive
acceptance and recoverable cleanup of
`notes/webmcp-148-ui-move-20261108.md` remain required after deployment.
Previously passing creation, graph, history-restore and empty-folder cleanup
acceptance remains valid; #106 stays closed.

## Focused verification

Baseline: `c21262bd4f7877b2829e244776987cf6f2e6f49a`. Tested working tree:
`wiki/relocations.py`, `wiki/removals.py` and
`tests/integration/test_relocation_concurrency.py` in this change. Interpreter:
existing locked `.venv`; public executor selectors from
`/tmp/backstory-128-runtime.sh`. All storage and databases were disposable
synthetic fixtures; no live data was accessed.

- Before the fix, the original two-case WAL concurrency probe failed for both
  move and removal preview. Expanded regression coverage failed all six cases:
  move, note-removal and folder-removal previews in WAL and DELETE modes. A
  second real SQLite connection commits a session update in WAL mode or starts
  a writer in DELETE mode after the first quota read. The preview then fails on
  journal INSERT with `database is locked` or `removal_unavailable`.
- After the fix, ran:
  `python -m pytest tests/integration/test_relocation_concurrency.py tests/integration/test_relocations.py tests/integration/test_removal_tools.py tests/integration/test_management_tools.py -q --tb=short`.
  **107 passed in 3.75 seconds.** A competing writer is serialized during quota
  reads and can update immediately after the preview transaction. Preview
  leaves the source bytes/folder intact and destination absent.
- `git diff --check`: passed.

Retained focused log: `/tmp/backstory-148-preview-focused.log`. The required
exact-merge gate, independent review and publication identities are retained in
the candidate store and release task handoff; publication consumes that gate
receipt rather than rerunning application checks. Unchanged prior UI evidence
is applicable because this patch changes no UI/rendering code. No fresh live
acceptance or full-suite pass is claimed by these focused results.
