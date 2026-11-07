# Graph Improvements Implementation Plan

**Goal:** Deliver issue 107's current graph and interface requirements.
**Architecture:** Reuse safe indexed queries; incrementally publish dependency-safe relations,
accumulate bounded pages, and render 3D with locally bundled Three.js.
**Tech Stack:** Django/SQLite, JavaScript, Three.js, esbuild, Playwright.
**Spec:** docs/superpowers/specs/2026-11-07-graph-improvements-design.md

## Global constraints
No note writes from graphs, no private fixtures, unchanged API/security budgets, no external
rendering/CDN, no fake completeness, no duplicate premerge full gate.

## Review focus
Negative and ambiguous resolution dependencies; policy revocation of retained state;
empty continuing pages and duplicate aggregates; request races on scope changes;
context loss, reduced motion and stable keyboard selection.

## Tasks
- [x] 1. Backend: regression-first no-op/provenance updates, affected-source dependency
  resolution, bounded rebuild fallback and safe retained evidence. Files indexing/worker.py,
  graph_projection.py, graph.py, models/migrations as needed; graph index/query tests.
- [x] 2. Renderer: regression-first 3D force layout, perspective orbit camera, instanced/batched
  WebGL map, bounded labels/picking, adaptive theme bloom and context recovery. Files
  static/src/graph-{view,physics,camera,layout}.js, package manifests and focused Node tests.
- [x] 3. Controller/UX: accumulated canonical pages, explicit continuation/cancellation,
  expandable depth, safe scope/session recovery, simplified toolbar/details and app menus.
  Files graph-controller.js, graph-panel.html, graph.css, shell.html and focused browser tests.
- [x] 4. Integrate/build once, run affected Python/Node and brief graph browser checks,
  inspect synthetic screenshots, obtain independent code review, resolve findings.
- [ ] 5. Record actual evidence, commit, create and merge PR to dev; observe publisher's
  required gate and verify resulting release/source identity without redeploying servers.

Each task adds meaningful failing regressions before implementation and records commands,
results and relevant inputs. Stop selected checks when passing. Reuse unaffected evidence.
