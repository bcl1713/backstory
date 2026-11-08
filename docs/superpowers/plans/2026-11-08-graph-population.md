# Graph population implementation plan

> Execute inline with superpowers:executing-plans; retain one independent review of the exact merge candidate.

**Goal:** Return connected two-hop evidence promptly and finish the full outgoing scope, then merge and publish through the candidate queue.

**Architecture:** Retain private resumable BFS state. Emit discovered pairs using full indexed aggregates immediately. For final-layer sources, compare indexed source fanout with membership size and choose raw-source paging or indexed member-pair paging. Use a graph-specific per-statement SQL watchdog rather than charging filesystem/setup time to SQL.

**Spec:** `docs/superpowers/specs/2026-11-08-graph-population-design.md`

**Constraints:** Preserve response bounds, full directed induced edges, shortest outgoing membership, eligibility/ancestry revalidation, rollback/replay, cursor binding, honest incomplete evidence and error distinctions. Follow AGENTS.md proportional testing; run the full gate only on the proposed merge SHA.

**Review focus:** Filtered bridges; aggregate counts across raw windows; final-layer hubs; stale/lost continuation replay; SQL errors versus filesystem latency.

## Task 1: Streaming population and SQL watchdog

- [x] Add failing regressions in `tests/integration/test_graph_traversal.py`: representative 93/278 neighborhood with a 12,000-occurrence final-layer hub must produce connections in the first response, finish in a small number of advancing requests, and retain exact nodes/pairs. Add a slow-stat regression using a virtual budget clock, and keep genuine SQL interruptions distinct from database errors.
- [x] Replace `small_page` fallback in `indexing/graph.py` with the unified resumable traversal for depth > 1. Bump local membership cursor version.
- [x] In `indexing/graph_traversal.py`, store each discovered pair once, track pending emission, aggregate selected pairs before publication, and adapt final-layer source/member seeks to avoid outside fanout and quadratic sparse scans.
- [x] Add `indexing/graph_budget.py` with reset-at-statement graph SQL work limits and progress-handler cleanup; preserve independent search behavior. Update affected diagnostic tests to target the graph watchdog.
- [x] Run focused traversal, graph-query and diagnostic checks. Resolve affected failures, record command/state/results and commit.

## Task 2: Browser evidence and release

- [x] Add/run one real default two-hop browser fixture with the final-layer hub, then focused retry/depth-change behavior. Capture first-connected timing and screenshots without private content. Reuse unaffected client checks.
- [ ] Update graph documentation/evidence and commit; push feature branch and create PR against dev.
- [ ] Prepare real merge candidate with `scripts/local_candidate.py`, run its full gate once on the trusted forge executor, and retain independent exact-SHA code/UI/evidence review.
- [ ] Land the reviewed SHA with the queue's atomic head/base leases. Let the publisher reuse its receipt; verify the published dev version and both image architectures. Do not rerun application tests for upload retries.

## Progress / rulings

- Owner approved implementation, merge and publication on 2026-11-08.
- Baseline advanced from inspected `41a35e2` to current dev `3190a25`; the newer small fast path still falls back above 32 members. Preserve its one-hop behavior through the existing one-hop SQL path; replace deeper fallback and fast path together.
- Existing focused depth/cycle check passed on the earlier state; new affected checks will validate the current implementation. No broad baseline rerun.
- Task 1 complete: red→green regression evidence, 93 passing focused checks plus 3 affected one-hop checks after restoring its existing fast path. Details and exact commands/results in the investigation record. No repeated full-suite development runs.
- Independent initial reviewer `/root/review_population` found no code blockers. Historical documentation status has been updated/explicitly labeled; screenshots establish connection-list population and controls, while map rendering remains outside this backend change's fresh evidence. Exact-candidate review follows its gate.
