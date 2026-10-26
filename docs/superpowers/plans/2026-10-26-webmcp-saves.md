# Issue 10 remainder: guarded browser saves

The issue and its 2026-10-26 actual-host verification comment define the scope.
Read-only discovery/search/read/list succeeded in the intended host. Implement
Stage 2 with the existing session, policy and formatted conditional-save service.
Work in the provided clean checkout on codex/safe-relocation-and-webmcp.

1. Add failing integration coverage for authenticated, CSRF-protected replacement
   saves requiring a strong read revision; reject creation, recovery modes,
   malformed inputs and unsafe paths. Exercise exact saved readback, formatting,
   backup attribution, no-op, conflicts, storage failures and uncertain outcomes.
2. Implement POST /tools/save/ accepting only path, source and revision. Reuse
   save_note in formatted mode. Return saved source/revision, diagnostics/diff,
   current readback and index status. No retry or source-recovery bypass.
3. Add failing browser coverage, then register save_note with write annotations,
   fixed same-origin POST, DOM CSRF and conservative uncertain-result handling.
   Preserve all open editor source, history and base revision: a subsequent human
   Save uses the original revision and the existing comparison/merge UI. Refuse a
   tool save if that same note has unsaved edits or an operation in progress;
   hold editor operations while its tool write is pending. Edits during a tool
   write remain drafts with their original base. Other tabs retain their draft
   and base and encounter ordinary revision conflicts.
4. Update documentation with the comment's actual-host evidence, precise save
   contract, external-writer limitations, and the remaining real-host write check.
   Rebuild tracked assets. Run Python, formatter and browser suites and review.

Review focus: missing/stale preconditions; no implicit create or formatting
recovery; lost/malformed acknowledgements never replay; concurrent human edits;
readback failure after successful publication never reported as ordinary failure.

## Execution and review

- Implemented the endpoint and optional browser save adapter over the shared
  service, with no schema or authentication changes.
- Added 30 focused server cases and browser coverage for the complete
  read/save/readback flow, drafts, conflicts and uncertain acknowledgements.
- Independent read-only code review found no Critical, Important or Minor issues.
- A final regression check reproduced a host synchronously rejecting the save
  registration and suppressing read registration. Each registration now captures
  its own synchronous failure; a browser regression test covers usable reads.
- Actual-host Stage 2 acceptance and atomic coordination with arbitrary external
  writers remain the documented external verification/locking boundaries.
- Final Python suite: 921 passed; formatter suite: 21 passed; asset build passed.
- Repeated browser runs exposed existing synthetic-index accumulation:
  `representative search reports partial state, then opens current disk content
  after indexing` hit the search work limit. Read-only diagnosis found 13,754
  FTS matches versus 299 current daily notes and 224,000 VM steps, exceeding the
  unchanged 200,000-step budget. The reusable synthetic runtime was archived
  intact and the full suite rerun with a fresh fixture. No production search
  limits or unrelated indexing behavior were changed.
- Final clean-fixture browser suite: 81 passed (including all 12 WebMCP cases).
  `git diff --check` passed. Changes remain in the provided checkout for review;
  no deployment, live note changes or issue closure were performed.
