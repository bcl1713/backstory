# Issue #116 implementation and focused evidence

Base: `eb57939796d841ec8c0c41d2b7582d91a54c39a0` in the isolated issue-116 clone.
The implementation commit containing this record is the reviewed working-tree
state; receipt tests use disposable Git origins and synthetic upload adapters.

Implemented:

- Real two-parent proposed merge, full gate before landing, exact source/tree
  receipt binding and retained independent exact-candidate review.
- Atomic source/target landing with two explicit leases. Real Git regressions
  reject concurrent head/base advancement and servers without atomic support.
- Main promotion synchronizes dev/main to the exact tested merge at landing;
  dev and stable publication run serially with one receipt and distinct success
  records. No later synchronization merge or duplicate full gate is needed.
- Receipt schema 3 captures tool/browser/OS/font/config provenance after dependency
  and browser installation, before checks; mismatch at completion/reuse fails.
- Publisher requires reviewed retained candidate evidence, creates fresh assets
  per upload retry, and never runs CI. Restart/crash recovery preserves receipts.
- Existing release runner retains immutable archive/version labels, both platform
  checks, digest recovery, origin/branch/freshness checks and immutable tag safety.

Selected checks and evidence:

1. `pytest tests/unit/test_local_candidate.py -q`: missing implementation failed
   first (8 setup errors), then 8 passed in 0.64 s.
2. Rewritten publisher tests failed against the old unconditional-CI publisher
   (3 failed, 8 passed); candidate/publisher/release files then passed 34 tests
   in 1.49 s after implementation.
3. `pytest tests/unit/test_receipt_inputs.py -q`: 2 tests failed for missing
   provenance helpers first. The five focused files (`test_local_candidate.py`,
   `test_local_publisher.py`, `test_local_release.py`, `test_local_ci.py`,
   `test_receipt_inputs.py`) subsequently passed 57 tests in 3.55 s after runtime
   input capture/compare, source-root and review checks were implemented.
4. After atomic dual-ref landing and dual-channel regression additions,
   candidate/publisher files passed 31 tests in 2.81 s.
5. Final affected checks after explicit malformed branch-policy refusal and
   additional relevant provenance selectors:
   `.venv/bin/python -m pytest tests/unit/test_local_candidate.py tests/unit/test_local_publisher.py tests/unit/test_receipt_inputs.py -q`
   passed **35 tests in 3.32 s**. The earlier passing CI/release file evidence is
   retained for unchanged behavior; this is combined focused evidence, not a fresh
   complete-suite pass.
6. `git diff --check`: passed. No application/browser/container full gate,
   publication, upload, remote landing, Actions or protection changes ran here.

Cumulative focused test execution was under 30 seconds. Dependencies were reused
from the provided Python 3.14 virtualenv; no package installation was needed.

Integration notes:

- Issue #117 changes Firefox lanes and introduces schema 2. Keep its lane changes
  and coverage, retain **RECEIPT_SCHEMA = 3** here, and preserve install order
  `dependencies`, `browser-install`, then checks. Tests derive lane sets from the
  current plan where appropriate. Combine the schema/receipt helper edits in
  `test_local_ci.py` and `test_local_release.py`.
- Gate validation uses the exact candidate source root, not controller dependency
  directories. Controller/source gate contracts must match; upgrade the trusted
  controller when updating the gate contract.
- Provenance is deliberately conservative and currently requires the trusted
  Debian/Ubuntu Linux executor's `dpkg-query` and fontconfig. Toolchain, installed
  package, font or selector changes invalidate evidence. A different executor is
  not assumed equivalent.
- Local review JSON and receipts are private operator evidence, not signed remote
  attestations. A trusted operator must retain actual independent review. Remote
  required reviews/protection still apply and can reject the atomic push; do not
  weaken them or fabricate hosted checks.
- Deployment migration is separate: stop the old publisher, retain existing state
  and evidence, update controller, and recover unpublished historical sources
  explicitly. Missing/legacy evidence fails closed; do not baseline it away.
- Independent cross-review is arranged by the parent before integration. No live
  rollout of the new controller has been performed.

## Review follow-up: installed dependency provenance

The first implementation bound source lockfiles and runtime/tool versions but did
not fingerprint installed ignored `.venv`/`node_modules` dependencies. Added
normalized SHA256 fingerprints of `uv pip freeze --no-cache --python <candidate>/.venv/bin/python`
and `npm ls --all --json` from the candidate root. Only digests enter receipts;
raw package lists, URLs, paths and credential-like metadata are not persisted.
Missing/incomplete installed dependency trees fail closed through the tool exit
status; existing receipts missing either fingerprint no longer compare equal.

The new Python/npm invalidation and ordering/privacy regressions first failed
(3 expected missing-helper/key failures). Final affected command:
`.venv/bin/python -m pytest tests/unit/test_receipt_inputs.py -q` passed 6 tests
in **0.04s** after adding the no-cache guard; `git diff --check` also passed. A direct local `dependency_inputs(ROOT)` probe succeeded
for both installed inventories (0.32s), without an install or network access.
The initial uv probe failed because its default cache is read-only; `--no-cache`
removes that unrelated cache-write requirement, verified by the successful probe.
No application, browser, publisher, release or full-gate tests were repeated.
