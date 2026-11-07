# Synchronization read and recovery fixes (#23, #24)

**Goal:** Read authoritative snapshots across proxy header transformations and
clear only resolved read failures, preserving drafts and guarded writes.

**Authority:** GitHub issues #23 and #24 supply the behavior and regression
requirements. Existing Django/JavaScript architecture remains in place.

**Baseline:** `dev` at `cd2d78a`; isolated checkout under
`/tmp/backstory-issues-23-24` preserves the primary checkout's uncommitted work.
Formatter baseline: 59 passed. Sandbox Node subprocess restrictions require
running formatter/browser checks with escalation.

## Task 1: Authoritative read contract

- [x] Add failing snapshot regressions for weakened/missing transport ETags,
  malformed fields, empty source and safe diagnostic classification.
- [x] Keep strong application revisions, validate each contract field, separate
  HTTP/JSON/transport failures, and treat HTTP ETags as transport metadata.
- [x] Run snapshot tests and retain existing stale-write rejection tests.

## Task 2: Scoped recovery

- [x] Add failing browser regressions for same/new revision recovery, typing
  during recovery, repeated cycles and unrelated error/conflict pauses.
- [x] Track read attention separately from operation attention. A valid read
  clears its own failure and resumes eligibility only without another pause.
  Resuming cancels old work; recovery never starts an automatic write.
- [x] Verify source/base/revision and strict If-Match on the next eligible save.

## Task 3: Verification and delivery

- [x] Rebuild committed assets; run formatter, Python and browser regressions.
- [x] Review the diff, document diagnosis and remaining live verification.
- [x] Commit focused changes and make them available for review.

## Review focus and limits

Malformed snapshots never become empty notes. Genuine conflicts, authentication,
formatting and uncertain writes retain their own pause. Stale responses cannot
adopt obsolete bases. Programmatic external merges remain unsaved until a new
user edit or explicit Save. No live note or deployment changes.

The full deployed image SHA remains unconfirmed. After implementation, the
public bundle was identified and owner-supplied authenticated metadata confirmed
the live ETag mismatch: HTTP 200 authoritative JSON with a strong application
revision, but a weak transport ETag equal to `W/` plus that revision.

## Verification record

- `npm run build`: passed; committed browser asset rebuilt.
- `npm run test:formatter`: 85 passed, including 26 snapshot cases.
- `.venv/bin/python -m pytest -n 2 --dist loadfile`: 975 passed.
- Full isolated browser run: 160 passed. Final focused recovery run after
  the review fix: 13 passed, including the added protected-draft regression.
- `git diff --check`: passed.
- Independent review identified one important finding: protected storage success
  must not promote a read warning to an unrelated permanent pause. Reproduced
  with a failing browser test, fixed, and verified with the final recovery suite.
  No critical or minor findings remained.
- The diagnosis guide records the served asset identity and confirmed
  authenticated ETag mismatch, excluding private note contents and credentials.
  Full container identity and attribution of the transforming proxy hop remain
  unconfirmed; neither is required to establish the observed validation defect.
- After the owner's authenticated evidence, reran all 26 snapshot tests and
  the proxy-weakened-ETag browser regression: all passed. The browser check
  confirms exact source preservation and rejection of a subsequent stale write.

## Delivery

The tested changes are committed locally. Automatic approval review rejected
uploading the generated source bundle to the public `bcl1713/backstory`
repository because it requires explicit authorization for public disclosure.
Repository ownership and push permissions were verified. The owner subsequently
explicitly authorized pushing the branch, opening a PR against dev, and merging
when tests and reviews pass. Publication and CI verification follow that approval.
