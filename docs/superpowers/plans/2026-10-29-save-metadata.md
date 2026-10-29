# Save Metadata Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Maintain existing modified dates and initialize new-note identity on save.
**Architecture:** A bounded pure source transformation before normal formatting in
save_note, under existing revision and write locks. Exact recovery bypasses it.
**Tech Stack:** Python, Django, restricted PyYAML node parser, pytest.
**Spec:** docs/superpowers/specs/2026-10-29-save-metadata-design.md

## Global Constraints
Configured wiki timezone dates, YYYY-MM-DD; no changes to Jarvis or task history schema.
## Review Focus
- YAML aliases/anchors must not accidentally rewrite another field.
- Existing custom metadata and comments must survive.
- Source recovery and restores must remain byte-exact.
- Conflicts must not publish stale metadata.
- New headers change authoritative responses and existing create tests.

### Task 1: Source transformation
- [x] Write failing tests for existing modified, new fields, aliases, malformed YAML,
  multiline/flow styles, quoting, anchors, old notes and Chicago midnight.
- [x] Implement wiki/save_metadata.py using validated node spans.
- [x] Run unit tests and verify green.
### Task 2: Guarded writer integration
- [x] Write failing UI/WebMCP create/save/recovery/conflict/readback tests.
- [x] Integrate preparation before format_source, retaining original recovery source.
- [x] Run full Python and frontend suites; update create expectations only as required.
- [x] Independently review and fix findings.
- [ ] Publish PR and verify remote/CI.

Local full Python: 984 passed, 53 skipped; focused metadata after final edge cases: 29 passed.
JS tests: 87 passed; build passed. Local Chromium cannot start because sandbox
blocks its singleton socket; browser verification requires GitHub CI.
