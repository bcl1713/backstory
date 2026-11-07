# Wiki graph implementation plan

> **For agentic workers:** Use superpowers:executing-plans, implementing and testing each task in order.

**Goal:** Implement issue 107's saved-content relationship queries and keyboard-first elastic vector graph.

**Architecture:** One typed canonical resolver, rebuildable resolved occurrence projection and bounded query service feed HTML, JSON and WebMCP. App-owned SVG renders a bounded force simulation; the synchronized connection list stays available independently.

**Tech Stack:** Django/SQLite, vanilla JavaScript/esbuild, SVG, Node tests and Playwright.

**Spec:** ../specs/2026-11-07-wiki-graph-design.md (issue 107, retrieved 2026-11-07).

## Global constraints

- Markdown stays authoritative; read-only queries never parse note bodies or save drafts.
- Paths identify nodes. Directions, occurrences, advisory locations and source revisions remain evidence.
- Maximum 200 nodes, 500 edges, 100 link/diagnostic items, 512 KiB serialized responses; paths/cursors 4096 and queries 256 characters.
- Signed cursors bind all parameters, policy, generation and mutation/relation epoch. Incomplete evidence never proves absence.
- No deployment, remote MCP transport, new credentials or policy relaxation.
- Use installed theme tokens; preserve editor state, navigation guards, shortcuts, Tab and reduced motion.

## Review focus

- Namespace changes can invalidate previously unique aliases: invalidate all projected relations in bounded worker batches.
- Storage/policy changes during a query must withhold denied/stale evidence and reject mixed epochs.
- Parser failure and capped scans must never imply missing links or isolation.
- Pointer cancellation, pending searches and repeated graph close/open must clean up pins, requests and frames.
- Keyboard selection must retain canonical identity during motion/theme/filter changes; Insert text stays untouched.

### Task 1: Typed extraction and shared canonical resolver

Files: wiki/links.py, wiki/contracts.py, wiki/metadata.py; tests/unit/test_links.py, tests/integration/test_resolution.py.
Interfaces: resolve_relation(source_path, target, kind) returns structured state/path/type and existing rendering attributes; resolve_link retains the existing public contract. Extraction adds occurrence_kind and position_precision.

- [x] Add failing extraction/resolution tests (images, reference links, fragments, roots/relative paths, aliases, encoded/literal percent, code/front matter).
- [x] Confirm failure, implement structured results without parsing rendered URLs, run resolver/formatter/relocation regressions.

### Task 2: Relation projection and bounded queries

Files: indexing/models.py, migrations, worker.py, graph_projection.py, graph_contracts.py, graph.py; tests/integration/test_graph_index.py, test_graph_queries.py.
Interfaces: query_links(path, direction, cursor=None, limit=50), query_graph(path=None, depth=1, folder='', tag='', query='', cursor=None, node_limit=200, edge_limit=500), query_link_issues(folder='', issue='missing', cursor=None, limit=50), returning typed pages.

- [x] Add failing projection tests for exact-path precedence, alias collisions, deletion, policy changes, restarts and parser failure.
- [x] Implement monotonic generation mutations and relation epochs; worker builds resumable bounded occurrence batches and publishes only unchanged versions.
- [x] Add failing query tests for provenance, inverse lookup, caps, cursor/filter epochs, privacy, no body reads and honest partial results.
- [x] Implement shared eligible queries under SQL/candidate/payload budgets; run index/search/query regressions.

### Task 3: JSON and WebMCP

Files: wiki/graph_views.py, tool_urls.py, tool_status.py, static/src/wiki-tools.js, docs/webmcp.md; graph tool tests.
Interfaces: GET /tools/links/, /tools/graph/, /tools/link-issues/ strictly validate schemas and call Task 2; tools get_note_links, get_note_graph, find_link_issues use existing transport.

- [x] Add failing tests for read-only parity, strict arguments, auth/revocation, no-store and cursor restart.
- [x] Implement thin adapters/capabilities; test host rejection/cancellation and no write side effects.

### Task 4: Accessible experience and elastic map

Files: graph.html, graph-panel.html, graph-controller.js, graph-view.js, graph-physics.js, graph-layout.js, graph-camera.js, graph.css; shell/note/urls/build/vim integration; Node and browser graph tests.
Interfaces: graph controller loads Task 3 results, keeps path-based focus/selection, delegates actual opens to real note links and existing draft guards. Physics consumes canonical nodes/edges, never changes evidence.

- [x] Add failing Node tests for unique springs, finite coincident nodes, bounded timestep/sleep/drag, shortest-hop emission and farther-endpoint edge tiers.
- [x] Implement bounded 60 Hz physics, at most four catch-up steps, world-space drag, smooth camera, persistent positions and theme-token SVG with true bloom Off.
- [x] Add failing browser tests for local/global/list, g/ search/Escape, Insert safety, draft preservation, selection, reduced motion, touch/cancellation and theme changes.
- [x] Implement server-rendered list/direct route plus lazy overlay; verify keyboard, list and canvas parity, recording elastic motion with synthetic data.

### Task 5: Verification, evidence and docs

Files: docs/graph.md, docs/editor.md, fixture/benchmark scripts and current test gates.

- [ ] Measure bounded 100/1000/10000-note query fixtures and 200-node/500-edge layout/bloom costs, recording environment and actual values.
- [ ] Run Python, Node, build, Chromium/Firefox and repository local-CI checks; inspect light/dark/mobile/reduced-motion evidence.
- [ ] Independently review projection invalidation, privacy/completeness, keyboard/focus and tools. Fix substantive findings and rerun relevant checks.
- [ ] Record actual-host acceptance as pending without authorized deployment/host access.

## Execution notes

Existing issue supplies the approved design and six-step implementation sequence. Native execution is used. Work is isolated on codex/issue-107 from origin/dev d9f8fd6; the original dirty checkout is preserved. Preflight interfaces agree: structured resolver → projection → typed query pages → JSON/UI adapters → renderer; renderer coordinates never enter evidence.

Final execution: rebased to origin/dev 7bdc1a1. Backend/UI independent reviews completed; findings have focused regressions. Exact-tree CI runs against the final committed tree using the inherited session Docker socket, with logs/receipt outside the checkout. No security-policy changes or deployment. Actual-host acceptance remains explicitly pending.
