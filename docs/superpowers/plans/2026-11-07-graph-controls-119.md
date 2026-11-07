# Graph Controls and Loading Implementation Plan

**Goal:** Complete issue #119: saved live forces, current-note two-hop entry and bounded depth adjustment, automatic whole-wiki accumulation.
**Architecture:** Extend existing equal-pair GraphPhysics, GraphPages canonical accumulator and cancellable controller. Keep all query/security/work budgets; permit one to eight real BFS hops, with explicit partial evidence when traversal budgets prevent completion. Store only versioned relative force settings in browser preferences.
**Tech stack:** Django/SQLite, JavaScript/Three.js, esbuild, Playwright.
**Spec:** [Issue #119](https://github.com/bcl1713/backstory/issues/119), authoritative consolidated requirements supplied on 7 November 2026.

## Constraints and review focus

No graph cache or note writes. Preserve camera/positions/selection across tuning and depth/page updates. Deliberate pause and reduced motion win over force changes. Continuation loops, empty pages, mixed epochs, stale responses, auth/storage failures and genuine resource limits must remain honest and bounded. Parent owns independent review and publication; do not run the full release gate.

## Tasks

- [x] Add regression-first validated relative force preferences and simulation live application; retain unique-pair weighting and existing stability evidence.
- [x] Add regression-first bounded backend BFS through eight hops, retain eligibility and SQL limits, expose depth bounds in API/tool schema and accessible toolbar.
- [x] Reset note entry to current note/two hops/search focus; handle bracket keys only in navigation; preserve surviving scope state.
- [x] Automate bounded page requests, yield between them, detect repeated cursors, expose progress/pause/resume/restart, cancel obsolete work and never mix generations.
- [x] Add collapsed settings with meaningful force ranges, reset and browser-scope explanation; document changed behavior.
- [x] Build changed graph/shell/tool assets, run focused Python and Node files and synthetic desktop/narrow browser checks. Record commands, results, time and limitations in `docs/testing/119-implementation.md`.
