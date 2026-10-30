# Index diagnostics and queue write intent implementation plan

> **For agentic workers:** Use systematic debugging and test-driven development for each task.

**Goal:** Diagnose intermittent indexing degradation without conflating durable note writes with index availability.

**Architecture:** Keep authoritative saves and the disposable index separate. Add privacy-safe structured server diagnostics at existing failure boundaries; keep current failure state distinct from retained log history. Distinguish actual SQLite budget cancellation from other database failures. Reproduce the queue's deferred SQLite snapshot upgrade and acquire write intent before its reads if demonstrated.

**Tech Stack:** Django, SQLite/WAL, pytest, existing Python logging.

**Spec:** GitHub issue #47 and parent-approved bounded design, October 30, 2026.

## Constraints and alternatives

No content replay, index rebuild, production mutation, blanket retries, timeout increase, credential/policy change or unsupported production-cause claim. Structured logs avoid adding database writes during database failure; durable diagnostic retention follows deployment log retention. Database history would itself fail during contention and is outside this narrow patch. Existing bounded worker backoff remains. Queue-only write intent avoids global transaction-mode changes and keeps read-only search/read transactions unchanged.

## Review focus

- Actual SQLite exceptions are wrapped by Django; retain only allowlisted numeric/code metadata, never exception messages or paths.
- Logging must not turn successful content publication into a failed save.
- Normal partial/stale indexing is not an error; recovered status must clear normally.
- Queue acquisition must remain short and contain no note filesystem/formatting calls.
- Search failure must not look like definitive absence or falsely advise narrowing for database contention.

## Tasks

- [x] Add failing integration tests for enqueue diagnostics, worker filesystem/database/persistence failures, search budget/database distinction and healthy recovery. Implement safe logging and additive search reasons only after expected failures.
- [x] Add a real file-backed two-connection WAL queue regression. Verify baseline snapshot-upgrade failure. Acquire queue write intent before reads; verify coalescing, overflow and convergence remain intact. Do not change content-write path.
- [x] Document safe diagnostic interpretation and deliberate read-only retry/background recovery.
- [ ] Run complete Python/formatter suites and relevant browser coverage. Request independent review; fix findings and rerun exact final head. Report verified limits before draft PR publication. No merge/deployment.

## Verification ledger

- Six initial regressions failed for missing diagnostics/reasons and the real SQLite queue race; targeted tests passed after implementation.
- Dedicated logger required a separate allowlisted handler because the existing root redactor deliberately discards all messages. Root/request/security filtering remains unchanged. Descendant logger bypass was caught by an additional failing regression, then fixed with an idempotent handler filter.
- Independent review found no blocking findings. Its exact-second timestamp edge case was reproduced and fixed; all 13 new integration tests pass.
- Final Python run: `pytest -n 2 --dist loadfile -q -rs`: 1,009 passed, 59 skipped (Docker Compose unavailable).
- `npm run build` passed; `npm run test:formatter`: 122 passed.
- Seven indexed-discovery browser tests could not launch because Chromium headless shell 1248 is absent. Standard download to disposable `/tmp` failed with invalid/truncated archives. No browser application assertion ran; pinned CI browser/container gates remain required.
- Local runtime Python 3.13 / Node 24.22.1 differs from CI Python 3.14 / Node 22.23.4. No manifest/toolchain changes made.
- Original production cause remains unknown. This patch establishes diagnostic evidence and fixes one verified local queue race; it does not establish that production incident's root cause.
