# Complete Graph and BFS Implementation Plan

> **For agentic workers:** Use focused parallel implementation for independent backend discovery and BFS physics; root owns client loading/integration. Follow AGENTS.md over broader skill testing defaults.

**Goal:** Resolve #123, #126 and the approved #127 experiment.
**Architecture:** Bounded resumable backend discovery feeds the existing paged graph envelope. Automatic client accumulation preserves all records with bounded display work. Selected-root outgoing BFS determines equal active springs without changing membership.
**Tech Stack:** Django/SQLite, JavaScript/Three.js, pytest, Node tests, Playwright.
**Spec:** `docs/superpowers/specs/2026-11-07-complete-graph-bfs-design.md`; GitHub issues #123/#126/#127.

## Global Constraints

- Keep existing SQL, eligibility, privacy and response bounds.
- All chosen-hop available evidence must be discoverable through continuations.
- Equal unique-pair springs only when directed depth advances by one; no invented root.
- Preserve all records, surviving positions/camera, explicit motion/loading pause, cancellation and stale protection.
- AGENTS.md proportional testing and release rules govern. No merge/publication requested here.

## Review Focus

- A high-degree intermediate frontier must resume without omitted neighbors.
- Dirty/revoked bridges cannot expose otherwise unreachable paths.
- Retried/concurrent cursors must not silently skip work or mix generations.
- Empty continuation pages and stale responses cannot stall or contaminate the UI.
- Appended shortcuts/reselection must recompute springs without teleporting or unpausing.

### Task 1: Resumable graph discovery (#123/#126 backend)

Files: `indexing/graph.py`, focused traversal module/models/migration if needed, `tests/integration/test_graph_queries.py`.
Interface: Preserve `query_graph(...)` and GraphPage response/cursor contract.
- [x] Add failing synthetic regressions for >300 deeper membership, high-degree intermediate frontier, bounded completion, filtering/eligibility and cursor invalidation/replay.
- [x] Implement bounded resumable membership and efficient page queries under unchanged SQL/request budgets.
- [x] Run relevant graph/diagnostic/tool tests, recording precise evidence and any residual failure.

### Task 2: Directed BFS springs (#127)

Files: `static/src/graph-physics.js`, `static/src/graph-view.js`, optional focused BFS module, Node graph tests.
Interface: `GraphPhysics.setGraph(nodes, edges)` continues to preserve positions; add selected-root update integrated with GraphView selection.
- [x] Add failing directed diamond/order/cycle/inbound/unreachable/absent/stale-root/shortcut tests.
- [x] Cache BFS per topology/root change and deduplicate active springs; retain display/highlight behavior.
- [x] Run focused Node graph physics/layout tests and record evidence.

### Task 3: Automatic scalable accumulation (#126 frontend)

Files: `static/src/graph-controller.js`, `static/src/graph-pages.js`, templates/CSS as needed, relevant Node/browser tests.
- [x] Add regressions for automatic local/whole/empty continuations, pause/resume, stale cancellation, deduplicated accumulation beyond former ceilings.
- [x] Remove manual graph Load more/window action; preserve bounded paged loading and honest completion states.
- [x] Bound list/render work without losing accumulated records; coordinate map resource handling with physics.
- [x] Build once for browser checks, run focused desktop/portrait behavior and inspect images.

### Task 4: Integrated review and evidence

- [x] Review complete diff independently and resolve material findings.
- [x] Reuse unchanged test evidence; rerun only checks affected by fixes.
- [x] Record commands/results/tested state under docs/testing and report remaining release gaps.

## Completion record

Implemented in the shared working tree on `fix/123-126-127-complete-graph-bfs`, based on `90efc8cc61938cef1a0d6efff0d53d036da07421`. At the initial implementation handoff, no commit, merge, push or publication had been performed.

Independent review approved the final source/UI with no unresolved Critical or Important findings. The soft-deadline forward-progress finding and loaded-list keyboard focus issue were fixed and covered by only affected checks. Evidence is retained under `docs/testing/2026-11-07-{complete-graph-backend,complete-graph-client,bfs-springs}-evidence.md` and `docs/testing/2026-11-07-complete-graph-review.md`. Combined focused evidence is not a full-suite/candidate gate receipt. No application test was rerun solely for this completion record.

Follow-up: continuing with a feature commit and PR against `dev`, reusing the unchanged focused evidence. The candidate gate remains required before merge; no deployment is part of this change.
