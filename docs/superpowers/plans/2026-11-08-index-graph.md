# Index events and graph readability implementation plan

> Execute independent indexing and bloom tasks with parallel agents; implement labels inline. Retain independent review of the exact release candidate. Owner requested implementation, merge and publication of #118, #132 and #136.

**Goal:** Make external edits converge promptly with cheap unchanged reconciliation, strengthen the graph's active spring structure, and prevent dense mobile label collisions.

**Architecture:** Preserve the durable worker and safe storage contracts. Add bounded path invalidations, native Linux notification coverage with polling/reconciliation recovery, metadata batching and efficient yielding. Reuse directed spring eligibility for presentation. Place collision-aware labels independently of graph membership and physics.

**Tech stack:** Django/SQLite, Python, native Linux notifications, Three.js, canvas labels, Node tests and Playwright.

**Spec:** GitHub issues #118, #132 (including all acceptance criteria), #136 and #118's phase-disclosure comment, retrieved 2026-11-08. Local copies retained at /tmp/backstory-issue-{118,132,136}.md.

**Constraints:** Preserve no-follow policy, durable race protections, safe generation publication/deletion, periodic content verification, existing graph membership/forces/preferences and all accessibility fallbacks. Keep Actions disabled. Follow AGENTS.md proportional checks and exact-merge candidate publication.

**Review focus:** notification/read races; incomplete watcher coverage/storage changes; wide directories and unchanged metadata cost; all equal shortest-path springs; overlapping selected/focused/current labels and nearby node marks.

## Task 1: Indexing (#118)

- [x] Read worker/scanner/queue/projection/status contracts and existing focused regressions.
- [x] Add and observe failing tests for cheap unchanged reconciliation, dirty-path races/deletion/namespace refresh, overflow/restart fallback and bounded watcher/clock behavior.
- [x] Implement bounded metadata-only scanning and dependency writes; eliminate fixed per-20-item sleeps while preserving expensive-work bounds and priority.
- [x] Implement service-owned watcher with bounded coalesced durable invalidations, safe startup coverage, recovery and polling-only mode; preserve daily verification.
- [x] Add useful safe phase/status fields and document settings; run affected indexing/graph tests and one synthetic native-watch smoke, retaining exact commands/results.

## Task 2: Bloom and spring context (#132)

- [x] Add and observe failing directed diamond/cross/back/unreachable spring classification and intensity tests.
- [x] Share physics eligibility and use coherent per-edge opacity for lines/arrows/halos, with forced-colors protection.
- [x] Map Off/Default/High to 0/2/a visually selected stronger value, update all clamps and accessible control labels, retain adaptive quality and user adjustments.
- [x] Run relevant existing graph Node tests and retain results; coordinate visual check with Task 3.

## Task 3: Dense label placement (#136)

- [x] Reproduce distinct selected/focused/current collisions and labels crossing nearby node marks with synthetic geometry tests.
- [x] Add deterministic placement with stable alternatives, viewport containment, priority-label fallback and clear node association; keep full-title/list/touch/keyboard discovery.
- [x] Run affected label/renderer tests and inspect one phone-width dense synthetic graph after selection/zoom. Briefly inspect Task 2 default/high in light/dark themes plus accessibility fallback.
- [x] Integrate phase details behind disclosure while retaining concise primary graph status.

## Task 4: Review, merge, publish

- [ ] Record focused evidence and source state; commit and open PR against dev.
- [ ] Prepare exact proposed merge on trusted forge executor; run required full gate once. Report cumulative verification at 15 minutes; avoid optional campaigns.
- [ ] Retain independent code/UI/log review of that exact candidate; resolve blockers before landing.
- [ ] Land exact SHA atomically with source/base leases. Publish dev using its unchanged receipt/runtime; verify release and amd64/arm64 images without rerunning tests.

## Rulings and evidence

- Implementation choices follow the detailed issue acceptance and existing architecture; no design clarification blocks the owner's explicit implement/merge/publish request.
- Work in a new feature branch in the existing clean checkout; candidate isolation is supplied by the documented candidate queue.
- Bloom and labels share graph-view.js but touch separate methods; coordinate modifications and run focused combined graph tests after integration.

- Backend and UI source frozen after independent review resolved a transient deletion-grace race, counter accuracy and leader paint-order findings. Focused evidence is recorded in docs/testing/2026-11-08-index-events-evidence.md and 2026-11-08-index-graph-ui-evidence.md.
- Owner disliked the synthetic node grid; final browser fixture uses irregular clusters. Production force layout is unchanged.
- Development verification totaled about three minutes. Next required check is the complete exact-merge release gate; no broader discretionary campaign.
