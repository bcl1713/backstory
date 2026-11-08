# Cumulative Graph Implementation Plan

> For agentic workers: use the implementation and independent review skills; retain proportional evidence per AGENTS.md.

**Goal:** Deliver issue 141 and merge/publish the tested candidate to dev.
**Architecture:** Extend existing indexed traversal with reusable exploration; keep controller root/selection separate; extend the existing renderer.
**Tech Stack:** Django/SQLite, JavaScript modules, Three.js, Node tests, pytest, Playwright.
**Spec:** docs/superpowers/specs/2026-11-08-cumulative-graph-design.md and issue 141.

## Global Constraints

Preserve authorization, eligibility, storage, generation/cursor invalidation and privacy checks. No graph size ceiling or manual load-more. Preserve camera, surviving positions and deliberate pause. No neighbor list. Existing dark/light, mobile, guarded navigation and reduced motion remain supported. Follow AGENTS.md: focused evidence first, full candidate gate once, reuse unchanged passing evidence.

## Review Focus

Expansion while another request is pending; stale exploration after mutation or visibility return; cross-neighborhood directed links; hint assignments while results arrive; tiny projected marks with usable touch targets.

### Task 1: Backend exploration

- [x] Add focused regressions for efficient complete 93-node neighborhoods, cumulative chain/diamond/cycle expansion, cached repeated selection, cross-neighborhood links and stale token rejection.
- [x] Extend indexing/graph_traversal.py, graph.py, graph_contracts.py and wiki/graph_views.py with guarded reusable exploration state, batching and automatic response continuations.
- [x] Interface: ordinary local query opens exploration. Response `exploration` is an opaque token. A later query keeps original `path`, configured `depth` and filters, and supplies `expand=<selected path>&exploration=<token>`. Continuations retain those parameters plus cursor. Response arrays may be deltas; every edge carries endpoints. Repeated aggregate edges replace counts. Original no-token clients remain compatible.
- [x] Run affected integration tests and record evidence.

### Task 2: Controller and renderer

- [x] Focused regression first for fixed root, cumulative expansion, prefix-free stable hints, labels and perspective geometry.
- [x] Modify static/src/graph-controller.js and graph-pages.js to accumulate expansion deltas, queue selections safely and retain camera/pause, using Task 1 interface.
- [x] Modify graph-view.js, graph-physics.js, graph-labels.js and focused helper modules to keep opening-root BFS separate from visual selection; add graph-scoped f hints; prioritize neighbor labels; use world-scaled geometry/glow and aligned endpoints.
- [x] Update help/template and graph documentation; run selected Node and browser checks. Record screenshots from synthetic desktop/narrow fixtures.

### Task 3: Review, candidate and publish

- [ ] Independent code/UI review and resolve material findings, without repeating unchanged tests.
- [ ] Commit/push feature PR to dev; prepare actual candidate through trusted local executor.
- [ ] Run required full gate once, retain exact-candidate independent approval, land exact SHA with atomic leases.
- [ ] Publisher consumes receipt; verify dev multiarch digest, release identity/assets, close issue and report material limitations.
