# WebMCP creation and audit implementation plan

> Implement #106 and #148 from dev 5a99ee74bd5d. User authorizes implementation, merge and dev publication.

**Goal:** Guarded explicit note creation, truthful relationship readiness, consistent depth contracts and discoverable complete authorized graph evidence.
**Architecture:** Extend the existing save service with a create-only adapter; reuse the existing graph projection and snapshot service. Keep exact-revision save semantics, authenticated document tools, CSRF, draft guards and uncertain-outcome handling.
**Scope:** #148 requests triage of relocation, recoverable cleanup and history exposure, rather than wholesale implementation of those new mutation APIs. Record service reuse, prerequisites and bounded future contracts. Actual-host acceptance must be distinguished from stub tests; synthetic fixtures only for mutation checks.

## Task 1: Create note
- [x] Add endpoint regressions for success/readback, validation, collision at publication, two creators, formatter failure, security/storage/recovery guards and uncertainty.
- [x] Add explicit `create_note` route over `save_note(..., None)` and shared authoritative response handling; advertise capability.
- [x] Register consequential browser tool with save serialization, timezone initialization and editor guards. Verify drafts, busy and lost/malformed acknowledgements without replay.

## Task 2: Graph audit
- [x] Diagnose incomplete projection with controlled fixtures and source-free state; fix proven cause while retaining partial evidence.
- [x] Expose relationship progress independently from source indexing and an honest retry/completion path.
- [x] Reconcile status/schema/runtime maximum depth using existing effective limit 8 and a focused contract test.
- [x] Expose existing authorized snapshot as a read-only tool; define directed reachability and weak-component analysis, filtered boundary and incomplete-result limits.

## Task 3: Review and release
- [x] Update WebMCP docs and evidence, including management-gap triage and external writer limits.
- [x] Run focused Python and browser/adapter tests; stop when relevant checks pass. Keep exact commands/results in evidence.
- [ ] Obtain independent code/UI review, create PR against dev, prepare exact merge candidate and run required full gate once on it.
- [ ] Retain exact candidate review, land with atomic expected leases and publish dev using unchanged receipt/runtime. Verify release and both image architectures. Do not rerun tests for upload retries.

## Review focus
Create never overwrites an existing/concurrent target; uncertainty never becomes safe replay; editor drafts/conflicts survive; ready source index never implies complete relations; whole-index snapshots never claim disk authority or include ineligible endpoints.
