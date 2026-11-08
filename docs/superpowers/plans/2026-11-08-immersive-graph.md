# Immersive Graph Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement in this session. Follow repository proportional-testing instructions.

**Goal:** Deliver issue #151's graph-first workspace without changing traversal or physics.
**Architecture:** Absolute canvas with compact actions/status and one active dismissible overlay. Explicit committed filter state; Find selects from the existing snapshot. Local collision-aware labels and combined state cues.
**Tech Stack:** Django templates, CSS, native JavaScript, Three.js, Playwright, node:test.
**Spec:** docs/superpowers/specs/2026-11-08-immersive-graph-design.md

## Global Constraints

- Preserve opening-root traversal, cumulative expansion, pause/reduced motion, hints, guarded navigation and list fallback.
- Use synthetic data only; focused tests, no broad release gate.
- Keep all nodes/edges; label budgets affect presentation only.

## Review Focus

- Filter drafts must not leak into automatic refresh or local depth actions.
- Escape and focus return must work from inputs, hints, overlays and standalone graph.
- Phone keyboard/safe-area handling must not resize or reseed the canvas.
- Dense labels must stay local without losing selection identity or revealing distant titles.
- Diagnostics and list fallback must remain usable with WebGL unavailable.

### Task 1: Canvas, layers and explicit search/filter interaction

Files: graph-panel.html, graph-dialog.html, graph.html, graph.css,
graph-controller.js, graph-launcher.js; new graph-overlays.js;
tests/browser/graph-immersive.spec.js and affected existing graph browser specs.

- [x] Write a dense synthetic desktop/phone scenario proving useful canvas space,
  unchanged bounds/camera/positions on layer changes, focus return, Find isolation,
  explicit filters, list fallback and reduced motion. Capture synthetic screenshots.
- [x] Run the new scenario against baseline; retain the expected failure and before image.
- [x] Implement layers with visible close buttons and graph-scoped o/e shortcuts;
  preserve f, /, ?, [ and ]. Keep viewport/keyboard sizing confined to sheets.
- [x] Separate draft filters from active scope. Find results call existing expansion
  and selection, never root navigation. Format evidence rows with separate elements.
- [x] Run the affected browser scenarios; fix findings and retain evidence.

### Task 2: Local labels and restrained role cues

Files: graph-labels.js, graph-view.js, tests/formatter/graph-labels.test.mjs,
tests/browser/graph-readability.spec.js.

- [x] Add regression fixtures that expose distant/crossing leaders and stacked roles;
  run them before changes.
- [x] Bound placements to local slots and reject crossing leaders; keep label budgets,
  collision handling, hint assignments and previous-slot stability.
- [x] Combine coincident role marks and expose readable accessible role text.
- [x] Run focused labels/renderer/outgoing tests and inspect synthetic screenshots.

### Task 3: Review and evidence

- [x] Review the complete diff, resolve relevant findings and record commands,
  working-tree state, results, synthetic artifact locations and material gaps in
  docs/testing/2026-11-08-issue-151-evidence.md. Reuse passing evidence.
