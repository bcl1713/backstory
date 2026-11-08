# Graph motion implementation plan

**Goal:** Implement #144, review, merge through the exact-candidate queue and publish dev.
**Spec:** docs/superpowers/specs/2026-11-08-graph-motion-design.md
**Constraints:** AGENTS.md proportional testing and candidate gate apply; no note writes, membership caps, new release gates or security-policy changes.

- [x] Solver: stage positions/velocities in reusable work buffers, publish complete steps atomically, maintain positionVersion, invalidate stale generators on controls/topology. Replace fixed chunk/one-step limits with time-budgeted multi-step catch-up. Add focused1050-node cheap-clock scheduling, partial-publication, cancellation/pin/topology and root-force regressions; reuse relevant graph-layout/BFS tests.
- [x] Geometry: add reusable output storage for connectionGeometry, keep backward-compatible allocating convenience calls, write directly into shared edge buffers without per-edge arrays. Test unchanged endpoints/arrows/halos and scratch reuse.
- [x] View: remove synchronous graph-install settling; pass bounded actual elapsed time; draw on actual solver/camera/style/etc changes, avoid unchanged geometry/projection uploads; ensure paused/hidden/reopened/motion and immediate drag retain coherent positions. Add focused real-browser desktop/mobile lifecycle/input/timing check.
- [x] Integration and review: build assets, record a small representative before/after solver cadence and render-work comparison, review actual UI and findings, run affected checks only. Reassess worker need from observed results; no FPS promise or broad matrix.
- [ ] Release: feature PR to dev, prepare actual merge candidate, full required gate once, independent exact-candidate review; atomic lease land; publish using same receipt/toolchain, verify source/version/both image platforms and release assets. Close144 after successful publication.
