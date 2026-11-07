# Formatter timeout evidence implementation plan

> **For agentic workers:** Use superpowers:executing-plans for implementation and superpowers:requesting-code-review before integration.

**Goal:** Make intermittent helper timeouts diagnosable without disclosing note content or pretending an unobserved cause is fixed.

**Architecture:** The isolated Node worker reports fixed stage identifiers to its parent. The parent emits bounded source-free progress on stderr; Python drains both pipes, discards arbitrary stderr, and emits one schema-filtered diagnostic per helper invocation. Image builds embed the tested source SHA for internal diagnostics. Existing JSON results, ten-second deadlines, process termination, scratch cleanup, recovery and publication rules remain intact.

**Tech stack:** Python/Django, Node worker threads, existing local CI/publisher.

**Spec:** Issue #94 (https://github.com/bcl1713/backstory/issues/94).

## Constraints and decisions

- No larger deadline, omitted fixed-point pass, write replay, live-note experiment or formatter bypass.
- Source-free evidence: fixed stage, monotonic millisecond offset, total helper duration, source UTF-8 byte count, timeout origin (python/node/none), result category and validated build SHA/version. Never raw stderr, body, path, config, exception or credentials.
- Keep original incident unresolved without a reproduction. Prefer instrumentation plus a synthetic probe over guessing at a performance fix or changing budgets.
- All code review, full exact-commit local gates and multiarch publication remain required. Ordinary PR targets dev; automatic publisher owns post-merge upload.

## Review focus

Malformed/flooded stderr must stay bounded and private; helper timeout must preserve draft and kill descendants; telemetry/log failure must not invalidate success; returned failed results must remain failed; image identity must describe the built source, not the controller checkout.

## Tasks

- [x] 1. Write failing tests for real helper progress, safe logging, timeout-stage retention, stderr flooding and broken logging sink. Implement the fixed stage channel and filtered Python diagnostic. Verify formatter and formatting/save integration suites.
- [x] 2. Add internal Docker revision/version identity and pass the immutable SHA from local_release. Add a synthetic probe for identical retries, warm in-process pipeline calls, structure/size and four-way helper load; exercise create/existing save readback and failure/no-publication independently of indexing. Record baseline and investigation limits.
- [ ] 3. Commit candidate, request independent review, resolve findings, run complete local gate on final clean candidate, open/review/merge dev PR, then wait for exact merge gate and publication. Verify platforms, labels, digest and release assets. Keep issue #94 open if original cause remains unknown.
