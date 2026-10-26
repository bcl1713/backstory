# Environment configuration implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement task by task. Steps use checkbox syntax for tracking.

**Goal:** Implement [issue #5](https://github.com/bcl1713/backstory/issues/5) on the current `feat/backstory-release-one` branch.

**Architecture:** Keep the existing environment interface and security defaults. Validate operator input before private-state creation, explicitly transport worker settings through the supplied manifests, and make `docs/configuration.md` the environment inventory. Setup guides contain minimal recipes and link to that reference.

**Tech stack:** Django settings, Python/pytest, Docker Compose, Markdown.

**Spec:** Issue #5, including the already implemented issue #4 marker migration.

## Global constraints

- No live configuration, permissions, services or deployment changes.
- Preserve authentication, exact host/origin and TCP peer trust, disjoint storage, marker readiness and safe writes.
- Do not introduce a configuration framework or new dependencies.
- Preserve existing defaults and names; remove redundant example entries rather than necessary operator decisions.
- Signing secrets remain generated in private application data; examples contain no credentials.

## Review focus

- Malformed, empty, non-finite and non-positive maintenance inputs must fail with named, redacted remedies before state creation.
- HTTPS hosts/origins must fail during settings load rather than later requests or checks.
- Private data failures must identify the setting and ownership/restore remedy without printing configured paths.
- Minimal Compose and Portainer inputs must render to the same intended storage and security settings; worker overrides must reach every manifest.
- Every consumed environment name must be documented, with application versus Compose roles and marker-hash migration clear.

### Task 1: Startup configuration validation

**Files:** `backstory/settings.py`, `backstory/configuration.py`, `tests/integration/test_configuration.py`.

**Interfaces:** `positive_integer(name, default)` and `positive_seconds(name, default)` read environment values and raise redacted `ImproperlyConfigured` errors. Settings validate before creating data or a signing secret.

- [x] Write subprocess checks for defaults, numeric overrides, invalid values, redacted remedies, exact HTTPS hosts/origins, and unavailable private data.
- [x] Run focused tests and observe failures from current behavior.
- [x] Implement strict numeric parsing and early host/origin/storage diagnostics, keeping existing rejection codes and trust boundaries.
- [x] Run focused configuration, proxy, storage-source and marker tests; expect all pass.

### Task 2: Deployment transport and operator documentation

**Files:** `compose.yaml`, `compose.portainer.yaml`, `compose.cloudflare.yaml`, `.env.example`, `cloudflare.env.example`, `README.md`, `docs/configuration.md`, `docs/setup.md`, `docs/reverse-proxy.md`, `docs/development.md`, Compose packaging tests.

**Interfaces:** Existing Compose substitutions plus the five existing `BACKSTORY_INDEX_*` environment settings; application defaults remain authoritative for native execution.

- [x] Add rendering checks for all worker overrides and minimal local/proxy recipes; observe missing worker transport.
- [x] Forward worker settings in each web manifest without changing security/storage defaults.
- [x] Write the complete inventory (purpose, requirement, accepted values, default, safe example, relationships, omission/error behavior and secret handling). Explain mount namespaces, ownership, account bootstrapping, fixed settings and deprecated marker hash.
- [x] Reduce examples and setup snippets to operator choices; link to the reference instead of duplicating the inventory.
- [x] Run focused configuration and Compose tests, then the Python suite and disposable Django local/deployment checks.
- [x] Request independent read-only review, address material findings and record verification below. Leave changes on the requested branch without deployment or push.

## Execution record

Implementation follows the issue's specified scope directly in the current branch. No worktree or separate design approval is needed for the already authorized implementation. Baseline commit: `b1bb889`.


Verification completed 2026-10-26:

- Observed 60 configuration regressions fail before implementation; observed all
  eight worker transport cases fail before manifest changes. The existing-secret
  / unwritable-data regression was separately observed failing, then passing.
- Final full Python suite: **773 passed** (`.venv/bin/pytest -q`).
- Independent read-only review: **96 configuration/Compose tests passed**, no
  material actionable findings. Additional origin parser probes rejected invalid
  ports, credentials, paths, query/fragment delimiters and control characters.
- Disposable Django checks passed for localhost, direct HTTPS and trusted-proxy
  HTTPS; deployment checks used `--deploy --fail-level WARNING`. Storage status
  reported `ready: marker_present` without hash configuration.
- Audited all 20 application environment names and every manifest substitution
  against the reference; none undocumented. Local documentation link targets and
  `git diff --check` passed.
- Preserved localhost origin-validation behavior from existing deployment checks;
  early exact-origin validation applies to HTTPS. Preserved all defaults and
  supported setting names. No deployment, push or live storage/config changes.
