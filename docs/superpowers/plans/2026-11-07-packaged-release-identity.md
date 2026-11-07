# Packaged Release Identity Implementation Plan

**Goal:** Deliver issue 70's artifact-local identity in authenticated status.

**Architecture:** Docker generates bounded, validated JSON beside a standard-library
module. Status reads it through that module; no runtime environment or Git lookup.

**Tech stack:** Python, Django, Docker, pytest. No added dependencies.

**Spec:** `docs/superpowers/specs/2026-11-07-packaged-release-identity.md`

## Constraints and review focus

- Preserve authentication, no-store, public health and all read-only boundaries.
- No runtime configuration, credentials, network queries or deployment changes.
- Missing/invalid metadata must not hide other status observations or leak input.
- Local source copies must not carry stale identity into an image.
- Stable/dev versions must agree with the current local publisher's formats.

## Task 1: Package and expose identity

Files: `wiki/build_identity.py`, `wiki/tool_status.py`, `Dockerfile`, `.gitignore`,
`.dockerignore`, `tests/unit/test_build_identity.py`,
`tests/integration/test_tool_status.py`, `docs/webmcp.md`, `docs/releases.md`,
`docs/operations.md`.

Interface: `application_identity() -> dict` returns only `name`, `build`, `version`.
`python -m wiki.build_identity VERSION REVISION` writes the module-relative JSON.

- [x] Run existing status/publisher tests as a baseline.
- [x] Add a packaged-status regression expecting the supplied full SHA and version;
  run it and confirm the existing unconditional unknown fails that expectation.
- [x] Add metadata validation/fallback and real CLI round-trip tests; confirm RED.
- [x] Implement the module, status integration and Docker generation. Exclude the
  generated file from Git and Docker contexts; default absent build args to unknown.
- [x] Run focused status/identity/publisher tests. Expected: all pass.
- [x] Document fields, validation, fallback, provenance limits and later read-only
  deployment verification. Keep formatter log environment semantics distinct.
- [x] Run broader checks available in this environment and retain exact results.
- [x] Obtain independent review, resolve material findings, prepare the
  commit for a draft PR to dev. Do not merge or deploy.

## Validation before commit

- Baseline: 28 status/publisher tests passed.
- RED: packaged-status regression returned unknown instead of the packaged fields.
- Focused final identity/status/publisher/diagnostics/container checks: 96 passed.
- Full Python suite: 1,490 passed with two xdist workers.
- Asset build passed with Node 22.23.4; formatter suite: 369 passed.
- Browser tool suite: 15 passed on generated data.
- Docker build and network-disabled runtime check passed: packaged identity wins
  over runtime environment overrides, UID 10001 reads root-owned metadata and
  cannot write it.
- Independent review found no issues; reviewer separately ran 74 identity/status
  tests. Publishing and live deployment were outside the review scope.
- The sandbox-only formatter run exited without child diagnostics; the complete
  unrestricted run passed. Full exact-commit local CI follows this commit and its
  receipt is retained outside the source tree.
