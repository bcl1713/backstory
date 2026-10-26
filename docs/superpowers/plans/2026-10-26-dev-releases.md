# Dev Releases and CI Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add automatic dev prereleases/images and reduce CI waiting without dropping tests.

**Architecture:** One branch-aware release workflow calls parallel reusable CI.
Dev version tags remain separate from stable version selection; images build with
pinned tags before current-head channel aliases are updated.

**Tech Stack:** GitHub Actions, Python, pytest-xdist, Playwright, Docker Buildx/GHCR.

**Spec:** `docs/superpowers/specs/2026-10-26-dev-releases-design.md`

## Global Constraints

- Dev updates only `:dev`; main alone updates `:latest` and stable aliases.
- Publish linux/amd64 and linux/arm64 after all correctness checks pass.
- Do not cancel running image publication or modify published releases.
- Keep browser workers at one per isolated shard and preserve all tests.
- Leave unrelated storage and file-tree edits intact.

## Review Focus

- Dev retries must keep their version, even after creating a prerelease tag.
- Stable version selection must ignore dev tags and retain feature/breaking history.
- Draft retries must preserve channel flags and current source/image notes.
- Advancing branches must stop old runs from moving aliases backward.
- Failed/skipped test jobs must fail the aggregate correctness check.

### Task 1: Version and publication channels

Files: `scripts/release-version.py`, `.github/workflows/release.yml`,
`tests/unit/test_release_version.py`, `tests/unit/test_release_workflow.py`.

Interfaces: `release-version.py --channel stable|dev` emits version/tag/previous;
release steps consume those outputs plus `GITHUB_REF_NAME`.

- [x] Add and run failing tests for dev versions, retries, stable promotion,
  channel-specific image aliases, prerelease flags and stale-head rejection.
- [x] Extend version selection and release orchestration; preserve existing retries.
- [x] Run the release tests and validate YAML/shell syntax.

### Task 2: Parallel correctness

Files: `.github/workflows/ci.yml`, `pyproject.toml`, `uv.lock`,
`playwright.config.js`, `tests/browser/vertical-slice.spec.js`.

Interfaces: reusable CI completes successfully only when Python, formatter,
container, all four browser shards and branch policy succeed.

- [x] Record baseline: 921 Python tests pass locally in 92.88s; CI took 83.48s.
  CI Chromium install took 37s; browser execution took 2.3m with one URL race.
- [x] Add pytest-xdist; run Python with two processes and duration reporting.
- [x] Split independent jobs, add four isolated Playwright shards, caches and
  failure artifacts, aggregate required check, and cancellation for stale PR runs.
- [x] Replace immediate URL inspection with a waiting URL assertion.
- [x] Run full Python, browser and formatter suites and build assets.

### Task 3: Operator guidance and review

Files: `docs/releases.md`, `docs/development.md`, `README.md`.

- [x] Document feature → dev → main, pinned/moving tags, separate test/prod storage,
  server pull/redeploy, required checks, retry semantics and local parallel tests.
- [x] Verify/create dev from current main if missing; do not publish or merge work.
- [x] Validate workflows, inspect final diff, obtain independent review and report
  checks and any unavailable validation.

## Validation record

- Release regression tests: 32 passed after observed failing tests.
- Full parallel Python suite: 934 passed in 53.14s (serial baseline 92.88s).
- Formatter: 21 passed; asset build and actionlint 1.7.12 passed.
- CI aggregate failure handling and promotion policy exercised locally.
- Remote dev branch created from main; independent review returned no findings.
- Initial browser run exposed stale local fixture state and was stopped after 61
  passes, three failures and one interrupted test. The preserved runtime was moved
  aside; the complete clean-fixture run passed all 85 tests in 2.5 minutes.
- Docker build/startup execution unavailable: local daemon socket permission denied.
- Changes remain in the workspace for review; no implementation push or deployment.
