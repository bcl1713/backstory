# Exact tested release candidates implementation plan

> Execute inline with the executing-plans and test-driven-development skills.

Goal: test a proposed merge once, land that exact commit after review, and reuse
its private evidence for publication and retries. Issue #116 is the specification.

Architecture: a local candidate controller prepares a two-parent merge in its own
clone, tests it, then uses one atomic push with leases on both source and target refs to land it. The publisher
consumes the candidate store in its state directory and never runs the gate.
Actions, branch protection and immutable image recovery remain unchanged.

1. Add `scripts/local_candidate.py` and real disposable-Git regressions for
   candidate identity, failed/missing receipts, head/base changes, current PR
   review, exact landing and concurrent target updates. Candidate metadata is
   atomic private operator evidence, not a hosted check.
2. Update `scripts/local_publisher.py` and its regressions: missing evidence fails
   closed, valid exact evidence publishes, restart/upload retry preserves the
   receipt without CI; freshness and release-runner validation stay mandatory.
3. Update AGENTS.md, development/release/CI guidance and record focused evidence.

Checks: candidate + publisher + release unit files. These establish orchestration,
receipt identity, stale-result refusal and retry behavior against disposable Git
origins/mocked uploads; they do not establish full application/browser/container
acceptance. The eventual candidate gate owns that acceptance once per candidate.

Review focus: mutable PR heads at landing; stale bases; candidate-store tampering;
failed validation preserving no successful state; crash after remote advancement;
receipt reuse after upload failure; source/branch/image/version consistency.

Ruling: use the explicit user authorization to proceed without design/plan approval
pauses. Keep publication/remote landing disabled in this implementation session.

Ruling: atomic source/target advancement is required to eliminate stale-head races.
Main promotion synchronizes dev/main at landing; the publisher handles both
channels from one reviewed receipt. Parent explicitly selected this design.

Ruling: schema 3 additionally binds conservative executor/toolchain provenance.
Dependencies/browser install before fingerprint capture; unchanged fingerprints
are required at gate completion, landing and publication.
