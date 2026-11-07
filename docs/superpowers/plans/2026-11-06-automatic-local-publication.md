# Automatic Local Publication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make merges automatically validate and publish the correct release on forge.

**Architecture:** A persistent local polling service wraps the existing correctness
and publication scripts. One state lock and private per-attempt clones isolate
work; atomic status supports restart, retry and branch advancement.

**Tech Stack:** Python standard library, Git, user systemd, existing uv/Node,
Docker Buildx, GitHub CLI and GHCR.

**Spec:** `docs/superpowers/specs/2026-11-06-automatic-local-publication-design.md`

## Global Constraints

- GitHub Actions stays disabled; builds remain local.
- Full exact-commit gate precedes publication. Never synthesize a receipt.
- Preserve dev/stable aliases, immutable version digests and existing user edits.
- Use forge and existing authentication; never print or mint credentials.

## Review Focus

- Restart after partial upload must not mark a failed source published.
- A newer branch head must supersede stale work before aliases move.
- One failing channel must not permanently block the other channel.
- Initialization must not accidentally publish the historical main branch.
- Service stop must permit an active publication to finish.

### Task 1: Publisher orchestration

Files: `scripts/local_publisher.py`, `tests/unit/test_local_publisher.py`.

- [x] Write tests using a real temporary bare Git origin and controlled external
  gate/release scripts: automatic dev publication, restart deduplication, stable
  channel, retry, malformed receipts, stale head, dirty source and process lock.
- [x] Run tests red, implement the polling publisher, run tests green.
- [x] Record state before attempts and publication only after successful upload;
  retain all attempt logs and use a fixed five-minute failure backoff.

### Task 2: Persistent service and runbook

Files: `scripts/systemd/backstory-publisher.service`, `docs/ci/README.md`,
`docs/releases.md`, `docs/development.md`.

- [x] Add a user service with restart, private file modes, drain-on-stop and
  configurable non-secret environment selectors.
- [x] Replace manual-publication instructions with automatic merge behavior;
  document bootstrap baseline, status, recovery and service maintenance.
- [x] Run full Python/formatter suites, syntax/service validation and independent
  whole-branch review. Fix blocking findings before committing/merging.

### Task 3: Activate and prove publication

- [ ] Install the reviewed controller, pinned local tools/fonts and dedicated
  multiarch builder on forge using existing authentication.
- [ ] Merge the correction to dev. Baseline only historical main and start the
  persistent service so current dev is automatically caught up.
- [ ] Observe the real full gate and upload, verify registry platforms/labels,
  version/dev tags and GitHub prerelease assets, and confirm the service remains
  active for subsequent merges.
