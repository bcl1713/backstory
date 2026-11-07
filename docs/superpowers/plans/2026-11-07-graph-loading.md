# Graph loading implementation plan

> Execute inline; retain one independent review of the exact merge candidate.

**Goal:** Implement #123 and #131, merge to dev and publish its prerelease.
**Spec:** GitHub issues #123 and #131, including their acceptance and lean checks.
**Architecture:** Preserve bounded outgoing traversal, eligibility and cursor contracts. Add a bounded small-neighborhood indexed path, falling back to resumable traversal without a membership ceiling. Separate progress from graph presentation and retain only coordinates/selection during depth revalidation.

## Constraints and review focus

- Keep SQL, response, eligibility and resumable work limits unchanged.
- Never retain old titles, edges or details as validated during scope changes.
- Check dirty/revoked witnesses, changed namespace/generation, replay and cancellation.
- Preserve camera control, drag, pause/reduced motion and equal BFS springs.
- Follow AGENTS.md: focused development checks; one full exact-merge gate.

## Task 1: Indexed neighborhood queries

- [x] Add a synthetic last-layer hub regression at depths 1–3; measure requests, SQL statements, eligibility checks and first usable output.
- [x] Confirm the regression exposes unnecessary out-of-scope work.
- [x] Add a bounded fast path for ordinary neighborhoods; use selective pair lookups for induced edges. Larger neighborhoods retain automatic resumable loading.
- [x] Reject known out-of-scope final-layer rows before filesystem eligibility in fallback traversal. Publish discovered nodes during longer discovery.
- [x] Run affected graph queries/traversal and diagnostic checks, preserving security/replay regressions.

## Task 2: Stable presentation

- [x] Add a focused browser sequence covering populated data, depth change, empty and duplicate pages, final topology, camera/selection/coordinates, pause, workspace bounds and invalidation.
- [x] Track presentation changes separately from progress in GraphPages/controller.
- [x] Restore permitted coordinates on every newly validated window and retain selected/focused paths until discovery completes. Clear incompatible state immediately.
- [x] Fit only first usable data unless camera control has begun. Reserve status, summary and loading-control space.
- [x] Run affected formatter/browser checks; inspect desktop and narrow normal/reduced-motion sequences.

## Task 3: Candidate, review, merge and publication

- [ ] Record focused evidence and commit implementation; push a PR against dev.
- [ ] Prepare the exact merge candidate on the existing trusted publisher executor.
- [ ] Run its full required gate once; retain independent code/UI review.
- [ ] Land with atomic expected leases, then reuse its receipt for automatic publication.
- [ ] Verify published source, immutable multiarch image/version and release assets.
