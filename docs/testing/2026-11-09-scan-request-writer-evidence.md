# Scan-request writer reservation

Baseline: `b3ff4cbbd21f7ae9306dbe4c9f58df9fb9a9d6f1` (dev271).

The native #148 cycle now passed durable preparation, WebMCP move/archive and
recoverable cleanup. Both timed-out commit acknowledgements were recovered by
known-ID inspection with authoritative storage/readback. The archive retained
`index_state=failed`; final status was still discovering/updating without index
errors. The report does not identify the exact historical enqueue failure.

## Design and selected verification

`request_scan` still read scan priority before reserving SQLite's writer. Follow
the existing queue/reconciliation/preview pattern: one no-op UPDATE reserves
write intent before get-or-create and priority reads in its existing short
transaction. It works for an absent singleton row too. Preserve priority
coalescing, explicit errors, transaction rollback and the configured busy timeout.
No note, relocation, UI or transport behavior changes; genuine contention can
still fail safely rather than pretending a scan was queued.

- Initial new-test run encountered a missing imported `reader` fixture (setup
  error, not a product reproduction); added the existing fixture import.
- RED: `python -m pytest tests/integration/test_worker_concurrency.py -k scan_request_reserves_writer -q --tb=short`:
  **4 failed in 1.02s**, all with `database is locked`. A second real SQLite
  connection updates an unrelated session after the priority SELECT, invalidating
  the scan request before INSERT/UPDATE. Covers WAL and DELETE modes and both
  missing and existing ScanState singleton. Log:
  `/tmp/backstory-148-scan-request-red.log`.
- GREEN: `python -m pytest tests/integration/test_worker_concurrency.py tests/integration/test_index_events.py tests/integration/test_index_diagnostics.py tests/integration/test_relocations.py tests/integration/test_management_tools.py -q --tb=short`:
  **115 passed in 16.24s**. The competing writer is serialized, can proceed
  afterward, and lower-priority requests cannot downgrade a retained stronger
  request. Existing index/relocation/management behavior passed. Log:
  `/tmp/backstory-148-scan-request-focused.log`.
- `git diff --check`: passed.

All tests used disposable synthetic wiki/SQLite fixtures, existing locked repo
`.venv` and public selectors from `/tmp/backstory-128-runtime.sh`. No live note
or deployment setting was changed. These focused results prove a code defect
capable of the observed scheduling warning, not its exact live cause.

Independent review and the exact proposed-merge full gate are retained in the
candidate store/task handoff. Publication reuses that receipt. The previous live
move/archive/cleanup acceptance and unchanged visual evidence remain applicable;
no further mutation lifecycle or full graph audit is required merely for this
three-line scheduling fix. A fresh read-only native status observation was
requested to establish whether background indexing settled after cleanup. A
historical failed index receipt is not rewritten or treated as a failed storage
operation, and synchronous commit acknowledgement remains a host limitation.
