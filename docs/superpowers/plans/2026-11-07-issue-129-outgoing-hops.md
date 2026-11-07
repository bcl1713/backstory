# Outgoing local graph hops implementation plan

> Execute inline using the executing-plans and test-driven-development skills; retain one independent review before landing.

**Goal / spec:** Implement [#129](https://github.com/bcl1713/backstory/issues/129): local depth 1–8 means shortest outgoing-link distance from the current root. The issue supplies the requested behavior and acceptance criteria; implementation, merge and publication are authorized.

**Design:** Keep the indexed one-hop SQL path and resumable deeper BFS. Remove incoming membership from both. Deeper discovery scans outgoing occurrence windows once per member, including the last layer to collect all induced directed edges. BFS ordering settles last-layer membership before those sources are scanned. Preserve existing eligibility, filters, budgets, replay, errors and UI. Bind local cursors to the new membership semantics so pre-upgrade undirected sessions cannot be reused. Whole-wiki and backlink queries remain independent.

**Alternatives:** Frontend filtering cannot establish complete membership. Replacing both backend paths with a new traversal would expand risk without improving this correction. Use the existing backend paths with the direction correction.

## Task 1: Directed membership and focused regressions

- [x] Extend `tests/integration/test_graph_traversal.py`: hand-checked directed chain at every depth and recentering; diamond/cycle/same-depth/reciprocal occurrence records; one-hop and deeper high-degree continuation with incoming-only distractors; global/backlink independence; rejection of legacy local cursors. Correct the old eight-hop fixture's undirected expectation.
- [x] Run new directed regressions before implementation; expect inbound-node and legacy-cursor failures.
- [x] Update `indexing/graph.py` one-hop SQL and cursor semantics, and `indexing/graph_traversal.py` outgoing-only frontier iteration. No new total caps or frontend/layout changes.
- [x] Run the two affected Python test files and existing graph tools/diagnostics, plus `tests/formatter/graph-bfs.test.mjs` and `graph-pages.test.mjs`. Passing establishes membership/edge completeness, cursor/error/eligibility behavior, and preserved springs/accumulation. Reuse unaffected prior browser evidence; inspect a focused real-HTTP UI scenario for the changed membership.
- [ ] Record commands, source identities, results and limitations in `docs/testing/2026-11-07-issue-129-evidence.md`; commit and open PR against dev.

## Task 2: Reviewed exact candidate and publication

- [ ] Prepare the real merge candidate with the trusted local controller. Run its required full gate once, using the same executor/runtime for testing, landing and publication.
- [ ] Have an independent reviewer inspect the exact merge, focused UI and retained gate evidence. Resolve blockers and retain the review record outside source.
- [ ] Land exactly the tested SHA with atomic expected leases. Publish dev using its existing receipt; verify version/dev digests, both architectures, source labels and release assets. Keep Actions disabled and branch protections intact. No live-server redeployment or stable promotion.

**Review focus:** Last-layer cross/back edges must survive; incoming-only hubs must never become frontiers; duplicate occurrence windows must aggregate once; old undirected checkpoints must expire; global/backlinks must retain inbound/disconnected notes. Existing interruption/stale/filtered-bridge checks remain relevant. Follow AGENTS.md: focused development checks, one required candidate gate, no test repeats for upload failures or handoff.
