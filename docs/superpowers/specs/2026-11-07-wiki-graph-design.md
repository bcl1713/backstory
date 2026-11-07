# Keyboard-first vector wiki graph and WebMCP implementation plan

**Goal:** Make Backstory's existing note relationships explorable by people and assistants: a console-like vector map, an equally capable accessible connection list, and bounded read-only WebMCP queries over the same evidence.

**Architecture:** Extend the rebuildable Django/SQLite index and canonical link resolver, then expose one graph-query service to HTML/JSON and the browser WebMCP adapter. Keep Markdown authoritative. Render a fully drawn, animated force-directed vector graph with an early-console / early-3D feel. Linked neighborhoods pull together, dragged nodes tug their neighbors, and the layout settles elastically. Keep semantic selection stable while positions move.

**Tech stack:** Existing Django, SQLite, Markdown parser, vanilla JavaScript/esbuild, CodeMirror integration and Playwright. Use a bounded force-layout module and app-owned rendering (SVG is a candidate; choose Canvas only if measurement justifies it, with the same accessible list); do not introduce a general graph database, remote rendering service or heavyweight 3D framework.

**Spec:** The design and contracts below are the specification for this issue. This issue is the requested planning deliverable, not a report that implementation exists.

## Intent and design decisions

The requested direction is an Obsidian-like relationship view that contrasts with the Vim text interface while retaining an early-console / early-3D vector-graphics feel and keyboard control. The owner also explicitly requested useful WebMCP architecture.

**Direction update, 2026-11-07:** Following the interactive design study, the owner requested: “There should be gravity pulling more closely related notes together like obsidian does. And it shouldn't feel so rigid. More elastic and fluid”. This supersedes the original rigid layered-layout recommendation. The requirements below describe the interaction directly; no private demo link is needed to implement or review it.

Required design:
- A fully rendered and animated console graph using existing theme tokens and monospace type: thin vector edges, geometric nodes, crisp labels, a strong focus reticle and restrained depth/perspective cues. It should feel like a responsive early-3D instrument, not a rigid diagram or a static wireframe placeholder. Preserve legibility and spatial orientation.
- Local view starts at the current note with one-hop incoming/outgoing links. An explicit two-hop action expands it. Global view is an intentionally bounded overview with folder/tag/search filters and disclosed limits, not an unreadable all-vault hairball.
- Keep the current note, focused node and selected node visually distinct. Details show canonical path, incoming/outgoing directions, link occurrences and freshness. Hover is optional; every operation works by keyboard and touch.
- Selecting a node inspects it; a separate action opens it. Recentering preserves a small in-memory navigation trail. Escape exits focused graph search back to graph navigation first; a subsequent Escape closes the graph and restores editor focus/caret. Opening a note uses existing draft/conflict navigation protections.
- Map and list are interchangeable presentations of the same result. The list is a first-class way to use the feature, including without graphics or JavaScript where practical.
- The graph is indexed saved content. An unsaved editor buffer is explicitly not included; do not silently save it or blend draft edges with persisted evidence.

Approaches and revised choice:
1. Full free-camera 3D/WebGL remains deferred: occlusion and camera orientation should not obstruct keyboard navigation. The early-3D visual treatment does not require unconstrained 3D flight.
2. A rigid directed/layered layout was the initial recommendation. It is **superseded** by the owner's request for a fluid, Obsidian-like force graph.
3. **Chosen direction:** bounded, animated force-directed layout with link springs, repulsion, gentle centering and damping. Deterministic seeding and persistent node identity aid reproducibility, but nodes must be free to move and react elastically. Coordinates are presentation, never semantic distance.

No embeddings, inferred relationships, automatic note edits, auto-linking, link creation, bulk repair, deployment, new credentials, security-policy relaxation or remote MCP server are included. Shared tags/folders are filters, not proof of a relationship. Node size/degree does not mean importance or truth.

## Verified repository baseline

Inspected `dev` at [b62c6da6faf8637ea6d3944ce21ace9e4ecf1315](https://github.com/bcl1713/backstory/commit/b62c6da6faf8637ea6d3944ce21ace9e4ecf1315), 2026-11-07. This is source inspection, not deployment verification.

- [indexing/models.py](https://github.com/bcl1713/backstory/blob/b62c6da6faf8637ea6d3944ce21ace9e4ecf1315/indexing/models.py): `IndexedNote` already stores path/revision/title/IDs/aliases/tags; `LinkEdge` stores target spelling, kind, fragment and position. It does **not** store a canonical destination or distinguish image syntax from other Markdown links.
- [wiki/links.py](https://github.com/bcl1713/backstory/blob/b62c6da6faf8637ea6d3944ce21ace9e4ecf1315/wiki/links.py): parser-based extraction excludes code, includes Markdown images, and retains advisory source positions. Resolver semantics include root-first wikilinks, source-relative paths, omitted .md, literal percent signs for wikilinks versus URL decoding for Markdown, and bounded indexed aliases/IDs.
- [wiki/metadata.py](https://github.com/bcl1713/backstory/blob/b62c6da6faf8637ea6d3944ce21ace9e4ecf1315/wiki/metadata.py) offsets positions past front matter and can produce incomplete projections. An empty edge set after parser failure is not evidence of no links.
- [indexing/worker.py](https://github.com/bcl1713/backstory/blob/b62c6da6faf8637ea6d3944ce21ace9e4ecf1315/indexing/worker.py) maintains active/building generations, priority jobs and bounded reconciliation. The active generation is updated incrementally: generation ID alone is **not** an immutable snapshot token.
- [indexing/search.py](https://github.com/bcl1713/backstory/blob/b62c6da6faf8637ea6d3944ce21ace9e4ecf1315/indexing/search.py) already supplies SQL/candidate budgets, policy-bound signed cursors, freshness and safe eligibility checks. Reuse these conventions.
- [static/src/wiki-tools.js](https://github.com/bcl1713/backstory/blob/b62c6da6faf8637ea6d3944ce21ace9e4ecf1315/static/src/wiki-tools.js) and [docs/webmcp.md](https://github.com/bcl1713/backstory/blob/b62c6da6faf8637ea6d3944ce21ace9e4ecf1315/docs/webmcp.md) expose seven session-bound tools, but no links/backlinks/graph queries. Tool content is untrusted; indexed discovery is not authoritative.
- Existing Vim `gf` follows links and `gh` goes home. Quick open uses Ctrl+Alt+O, excluding AltGraph. Preserve these, browser shortcuts, Tab navigation and editor modes.

Duplicate search covered issues and PRs for graph, graph view, knowledge graph, backlink/backlinks and links. No matching graph-navigation issue found. Related, not duplicates: #2 / #53 (keyboard discovery), #7 / #11 (link parity), #66 (embedded diagrams), #46 (separate remote-MCP feasibility), #106 (explicit note creation). Reliability work such as #94 remains separate.

## Shared data and query contract

### Canonical relation model

Create a transport-neutral graph service, proposed `indexing/graph.py`, with typed contracts in `indexing/graph_contracts.py`.

- Node identity is exact root-relative Markdown path within the wiki, not title, alias, database PK or an invented persistent UUID. Paths may change on relocation.
- Store occurrences separately from aggregated visual edges. A directed visual edge A → B means “indexed source A explicitly links to resolved note B.” Repeated occurrences contribute an occurrence count, not duplicate visual edges.
- Preserve original target spelling, syntax kind, fragment, source path, indexed source revision, source line/column and position precision. Existing columns/reference positions are advisory; label them accordingly. Do not turn them into edit ranges or imply fragment existence was verified.
- Distinguish ordinary links and image/embed occurrences during extraction without breaking formatter preservation comparisons or relocation logic. Default note graph excludes external URLs and non-note assets. They may appear as separately classified outgoing references, never false note nodes.
- Same-note heading links belong in details but do not add a visual self-loop by default. Preserve explicit self-links in query evidence with the documented classification.
- Resolution states include resolved, missing, ambiguous and unavailable/unconfirmed. Missing/ambiguous references are optional diagnostics, not fabricated destination nodes. Return bounded eligible ambiguity choices only. Never infer missing from stale names, failed parsing, unavailable storage or a capped query.
- Refactor shared resolution internals to return canonical path/type as structured data while preserving the public `resolve_link` behavior. Do not reverse-engineer paths from rendered hrefs or implement a second resolver.

### Efficient inverse lookup and correctness

Add a rebuildable resolved-relation projection with indexed canonical destination for incoming queries. Preserve the raw occurrence index as evidence. Do not implement backlinks by scanning/parsing every note during a request.

Resolution depends on the whole eligible names/path namespace: a newly created exact path can supersede an alias; an alias collision can invalidate a formerly unique target. A source-only update is insufficient.

Implement bounded background invalidation/re-resolution when notes, paths, aliases/IDs, policy or parser/resolver version change. A conservative full relation pass is acceptable **in bounded worker batches**, while marking the projection incomplete; request-time whole-vault scans are not. Choose dependency-based invalidation later only if its correctness is covered. Publish a completed relation epoch only for the namespace/source revisions it evaluated. Increment mutation/version metadata for active-generation changes and reject/restart obsolete cursors. Recheck policy/storage eligibility for both source and target at query time, including ambiguous candidates; filter before aggregate counts so denied names, edges or existence cannot leak. Do not call a mutable active generation an atomic disk snapshot.

### Proposed interfaces and bounds

Domain interfaces:
- `query_links(path, direction, cursor=None, limit=50) -> LinkPage`, direction outgoing/incoming/both.
- `query_graph(path=None, depth=1, folder="", tag="", query="", cursor=None, node_limit=200, edge_limit=500) -> GraphPage`.
- `query_link_issues(folder="", issue="missing", cursor=None, limit=50) -> LinkIssuePage`, issue missing/ambiguous/isolated.

These are proposed new interfaces, not existing APIs. Keep filtering semantics identical between UI and tools. For a folder-filtered view, distinguish hidden-by-filter boundary connections from absent connections without exposing excluded content.

First-release limits:
- Links/diagnostics: 1–100 items per page; bounded examined candidates and SQL work using existing budget conventions.
- Map: at most 200 nodes and 500 aggregated edges per response; local depth 1 or 2 only. No unbounded recursion or “fetch everything” flag.
- Strings/cursors use existing 4096-character path/cursor and 256-character query bounds; cap serialized responses at 512 KiB and return explicit limiting reasons.
- Return deterministic ordering and signed query/filter/direction/policy/relation-epoch-bound cursors. Empty filtered pages can still have continuation. Expired/inconsistent cursor returns explicit restart, not silently mixed results.
- Responses include `authoritative: false`, `untrusted_content: true`, freshness, generation/relation epoch, projection completeness, limits/truncation reasons, continuation and observation time. Counts are exact only when actually complete; otherwise lower bounds or unknown.
- “No backlinks” / “isolated” is permitted only for complete eligible evidence. Prefer “no indexed connections observed” where filesystem freshness cannot be guaranteed. Do not present index completeness as proof that external writers cannot have changed disk.

## WebMCP deliverable

Add read-only tools `get_note_links`, `get_note_graph` and `find_link_issues` as thin adapters to the shared service, in the existing browser session. Use proposed endpoints `/tools/links/`, `/tools/graph/`, `/tools/link-issues/`; validate exact schemas server-side and in the adapter.

- `get_note_links`: exact path, direction, limit/cursor. Enables “what links here?”, outward context gathering and explaining where an explicit relationship came from.
- `get_note_graph`: bounded local neighborhood or filtered overview, with canonical nodes and occurrence-backed edges. No source bodies and no arbitrary URL fetches.
- `find_link_issues`: bounded, filterable curation candidates for missing/ambiguous links or notes with no observed indexed connections. Diagnostics are suggestions for human review, not permission to repair or evidence that a note is useless.
- Return source locations and indexed revisions so an assistant can explain a connection and then use existing `read_note` / `read_notes` for authoritative context. Before proposing a repair, re-read the relevant source and target; before a separately authorized write, use the current strong revision with existing guarded save.
- Register `readOnlyHint: true` and `untrustedContentHint: true`; maintain private no-store same-origin JSON, active-session/device authorization, redirect rejection, cancellation and optional-host failure isolation. Update capability reporting and documentation.
- Titles, aliases, paths, snippets and diagnostics remain untrusted data. Links establish textual references, not factual agreement, endorsement or instructions for the assistant.
- No remote MCP transport, token setup, wider CORS, background autonomous mutations or extra persistent access. Actual-host discovery/invocation is a distinct acceptance step, not proven by a registration stub.

## Physics and motion contract

The following implementation choices turn “gravity” and “elastic” into testable behavior; tune numerical constants against synthetic fixtures and record the final values. These are layout forces over explicit links, not inferred semantic similarity.

- **Link springs:** Each unique resolved note pair contributes a spring with a rest length and bounded stiffness. For displacement along the edge, force is proportional to distance minus rest length. Attraction pulls long links together; short links resist collapse. Apply equal-and-opposite forces. Start with equal spring strength for each unique pair; repeated mentions and reciprocal arrows must not silently multiply strength or claim stronger meaning. Preserve directed arrows as evidence even though the layout spring is symmetric.
- **Repulsion and collision:** Nodes repel with a softened distance denominator and capped force so coincident nodes cannot produce infinities. Add node-radius collision separation. Dense groups should occupy readable space instead of collapsing into one point. Label decluttering is a rendering concern, not an excuse to remove evidence.
- **Center gravity:** Apply a weak pull toward the layout center to keep disconnected components in a usable area. Link springs, rather than arbitrary central pull, make interconnected neighborhoods gather. Several interconnected groups with sparse bridges should form recognizable clusters. Do not fabricate extra edges, embeddings, or tag-based attraction.
- **Damping and time:** Integrate velocity with elapsed-time-aware damping and a fixed/substepped timestep; cap catch-up steps and speed after long frames. Aim for visible yielding and a small smooth rebound, then rest, without buzzing or endless oscillation. Keep physics world coordinates separate from camera transforms so zoom does not change force strength.
- **Drag:** Pointer-down on a node temporarily pins only that node to the pointer in world coordinates. Dragging stretches its real springs and visibly pulls connected neighbors, with propagation through their links; unrelated nodes respond only through general layout forces. On release unpin it and let the neighborhood settle. Avoid an uncontrolled throw; cap or clear release velocity. Pointer cancellation, leaving the view, touch cancellation and component teardown must always release the pin/capture.
- **Interaction distinction:** A small movement threshold separates click selection from drag; dragging must not accidentally open the note. Background dragging pans the camera. Preserve a touch scrolling/gesture route and labeled non-drag alternatives for navigation.
- **Heating and sleep:** Reheat a bounded simulation on initial load, topology/filter changes and dragging. Cool toward rest and stop frame work when settled; restart on meaningful interaction. Pause in hidden tabs and tear down on graph close. Animation should be fluid while it has a purpose, not continuously churn while idle.
- **Continuity:** Keep surviving nodes' positions when switching local/global views, expanding neighborhoods or refreshing evidence where feasible. Seed new nodes near connected neighbors with deterministic small offsets. Do not randomize the whole map after every query, selection or keystroke. Discard stale asynchronous layout work.
- **Smooth camera:** Pan, zoom and recenter interpolate with restrained easing and no overshoot. Zoom around the pointer or focused node. Selection must not constantly chase the moving layout or trigger repeated auto-fit; explicit Fit and recenter are deliberate actions. Preserve selected/focused node by canonical identity, not its index or current screen position.
- **Reduced motion:** Honor the OS setting and provide a visible Pause motion control. Reduced-motion mode presents a bounded settled layout with immediate camera changes, no animated spring rebound or perspective movement; keep all links, search, list, selection and opening available. Frozen presentation is an accessibility mode, not the default design.
- **Budgets:** Retain the 200-node/500-edge response caps. Bound per-frame work, iterations, catch-up and total settling time; if the limit is reached, freeze the current usable layout and report the limit without losing navigation. Start with a 60 Hz simulation step and at most four catch-up steps per rendered frame as implementation defaults, then measure on the reference device. Aim for smooth 60 fps on the reference desktop, with explicit lower-work behavior on slower devices. These are targets to verify, not performance claims.

Acceptance fixture: two densely linked groups joined by one bridge, a chain, a high-degree hub, isolated notes and overlapping initial positions. On load the linked groups form visible neighborhoods; dragging one group member deforms connected edges and pulls its neighbors; releasing it produces a restrained elastic settle. A node must remain selected throughout. The same graph evidence and directionality must appear in the list and WebMCP outputs, independent of the renderer's coordinates.

## UI, keyboard and accessibility contract

Add Menu → Graph and an accessible local-connections entry for the current note; keep default Zen chrome quiet. The map opens without changing editor source or its Vim state.

Implement the sequential `g` then `/` command (`g/`) in the appropriate navigation/Vim Normal context to open the graph with its search input focused. It is not a simultaneous key chord and must not consume typed text in Insert mode, other inputs, composition or browser shortcuts. Integrate with existing `gf` / `gh` prefix handling rather than adding a competing global listener; cancel an incomplete prefix cleanly. Menu → Graph remains the discoverable alternative.

Within the **focused graph canvas only**:
- Arrow keys or h/j/k/l move focus to the nearest visible node in that direction with deterministic tie-breaking computed when the key is pressed. The focused node identity remains stable as physics moves it; it must never jump selection just because another node crosses its former position. Keep a stable, non-geometric traversal order in the synchronized list.
- Enter opens the focused note through existing guarded navigation; Space recenters the local graph; / focuses graph search; ? shows help. Escape from the focused search field cancels pending search work/typing focus and returns to graph navigation with the current selection retained; it does not immediately close the graph. Dismiss help or other subordinate UI first, then Escape from graph navigation closes the graph and restores the editor. Keep an explicit Clear search action instead of ambiguously clearing results on Escape.
- +/− zoom; an explicit Fit button resets the viewport. Pan/zoom also have labeled controls and pointer/touch support.
- Tab/Shift+Tab always leave the canvas normally. Ignore bindings in inputs, contenteditable, composition, AltGraph or modified browser shortcuts. No global capture of editor keystrokes.
- Test `g/` from supported navigation contexts and audit existing shortcut handling; do not override browser Find, quick open, `gf`, `gh`, Tab or Vim Insert behavior.

Provide a visible list toggle, real links, readable path disambiguation, selected-node details and incoming/outgoing groups. Screen-reader users must perform every navigation/filter action without interpreting coordinates. Use concise polite status announcements for selection/results, not every animation tick. Focus has a non-color-only indicator; missing/ambiguous states use text/icons, not color alone.

Honor reduced motion and all current themes; no constant rotation, flashing, scanline effects or mandatory glow. Keep readable labels and sufficient contrast. Default mobile/small screens to a list or compact local view, with no viewport overflow or hover-only details. No thousands of tabbable SVG nodes. The synchronized list has stable path/title ordering and ordinary keyboard link navigation independent of geometric layout; it remains usable if SVG rendering or layout fails. Escape and browser Back preserve drafts and return to a predictable location.

## Production theme integration

**Explicit owner requirement, 2026-11-07:** “It wouldn't be there in the demo, but the final product should obviously utilize the installed color scheme as well”.

The production graph must use Backstory's installed, currently active color scheme. The demonstration's palette is not a production requirement. This section specifies work to implement and verify; it does not claim that graph theme integration already exists.

- Derive the graph background, node fills/outlines, edges, labels, selection/focus reticle, hover states, incoming/outgoing highlights, search matches and any bloom/glow from the active Backstory theme's semantic tokens/palette. No fixed demo neon palette or separate graph-only theme preference.
- Inspect and reuse the current theme integration in `static/src/theme-palette.js` and `static/src/themes.js`; map graph visual roles to existing tokens. If additional derived tokens are needed, define and document them in that same theme system rather than hard-coding RGB values throughout the renderer.
- Any bloom/glow is a restrained theme-derived presentation effect. Derive its hue from the corresponding active highlight/node/edge color and tune opacity/radius for the background. Reduce or disable it where it washes out text, obscures edge direction or degrades contrast, especially on light themes. Readability must not depend on bloom. The adjustable bloom feature is required by the approved refinement below, but its visible effect remains optional through a true Off setting.
- Honor theme changes while the graph is open, including any existing system-theme behavior. Update both the visual renderer and synchronized list/controls without resetting the graph, camera, selection, keyboard focus or physics state. For Canvas, explicitly redraw with the updated palette; CSS token changes alone are insufficient.
- Preserve contrast for essential labels, controls, edges and focus indicators across supported light/dark and installed schemes. Use the underlying text/stroke colors for contrast, not the surrounding glow. Distinguish current/selected/focused nodes and missing/ambiguous states with shape, stroke, labels or icons as well as color.
- Keep accessible high-contrast/forced-colors and reduced-motion/list fallbacks functional; decorative glow must never hide focus or carry the only indication of state.

Acceptance:
- [ ] Add a theme-role mapping test proving nodes, lines, highlights and bloom derive from active theme values rather than fixed demo colors.
- [ ] Exercise at least two substantially different installed schemes plus light/dark backgrounds, long labels and overlapping highlighted edges; inspect screenshots for readability and verify text/UI contrast against the project's accessibility criteria.
- [ ] Change the active theme while the graph is open and animated. Assert every graph/list/control role updates, selection/camera/focus remain unchanged, and no duplicate simulation or event listeners are created.
- [ ] Test bloom reduced/disabled, forced-colors and reduced-motion modes; all actions and state distinctions remain usable.

## Selected-note bloom and hop falloff

**Approved design refinement:** The owner requested bloom on nodes and lines with the highlighted note most emissive, its neighbors/connections a little less, and subsequent neighbors/connections progressively less, then explicitly approved adding the experiment to this issue.

Implement this adjustable visual feature alongside the theme and physics contracts. The prototype's Canvas approximation demonstrates the desired appearance; it does not mandate Canvas, HDR rendering, WebGL, a post-processing pipeline or a specific library.

- **Selection is the light source:** The selected note has the strongest emission. One-hop nodes are dimmer, two-hop nodes dimmer again, continuing with a monotonic falloff to a restrained baseline. This is not a heat map of importance or semantic confidence.
- **Use shortest link-hop distance:** Compute a bounded breadth-first traversal over the currently loaded, eligible explicit-note graph, treating incoming/outgoing links as undirected for this visual distance only. Preserve directionality in arrows, details and WebMCP. Distances follow links, not screen proximity or force-layout coordinates. Cycles, reciprocal links and repeated mentions must not amplify brightness.
- **Edges follow the same rings:** Give a visible edge the falloff tier of its farther endpoint, so selected-to-neighbor lines are tier 1 and neighbor-to-next-ring lines are tier 2. This is a proposed deterministic mapping for the approved effect; keep edge direction and source evidence unchanged. Self-links, if shown, use their node tier. Unreachable nodes/edges stay at baseline without inferred connections.
- **Bounded evidence:** Apply the effect only to the returned graph, without recursively fetching more notes. Missing/ambiguous references do not become resolved bloom paths. With truncated/filtered data, describe distances as hops within this displayed graph, not shortest paths through the whole wiki.
- **User control:** Provide a labeled, keyboard-accessible Bloom intensity control including a true Off setting. Off removes the decorative bloom pass while retaining crisp nodes, lines, selected-state indicators and all navigation. Start with restrained intensity; keep intensity, radius and overall opacity bounded so dense hubs do not saturate the view. Follow existing preference conventions if storing the setting; never persist private graph contents.
- **Theme-aware rendering:** Derive emissive hues from the active installed theme as specified above, not from the demo palette. Keep crisp foreground strokes and labels over soft halos, with stronger selection than successive rings at nonzero intensity. Tone down or suppress halos in themes/forced-colors modes where they harm readability. Glow cannot be the sole selection, focus, direction or hop indicator.
- **Selection changes:** Recompute distances only when selection or eligible topology changes, not every physics tick. Keep the selected identity, keyboard focus and camera stable while recomputing. Clear the previous selection's emission reliably; if selection disappears, show baseline until a deliberate valid selection exists. A brief non-flashing transition is optional; reduced-motion mode switches immediately.
- **Performance:** Reuse the existing graph caps and frame budget. Cache bounded halo assets/layers where useful, bound blur sizes and render-target resolution/device-pixel ratio, and avoid unbounded per-edge filters. Pause hidden/settled work and degrade decorative bloom before reducing navigation responsiveness. Benchmark bloom Off versus normal/max supported intensity on the synthetic high-degree fixture. This effect must not keep a settled graph continuously animating.

Acceptance additions:
- [ ] Unit-test shortest-hop tiers on chains, cycles, reciprocal/duplicate links, disconnected nodes and the two-cluster bridge fixture. Assert monotonic node emission and the farther-endpoint edge mapping; spatially adjacent but unlinked nodes must not brighten as neighbors.
- [ ] Change selection by pointer and keyboard while physics is moving and after it settles. Verify the new selection becomes brightest, old halos update, selection/focus/camera do not jump and stale asynchronous work cannot restore the previous lighting.
- [ ] Test local/global changes, filtering, removed selected nodes, partial graph responses and disconnected components without claiming whole-wiki distances or triggering extra note fetches.
- [ ] Verify intensity adjustment and true Off via keyboard and pointer, active-theme changes, reduced motion and forced-colors. Non-color selection/focus cues and readable labels/edges remain available.
- [ ] Inspect screenshots and a short selection-change recording at normal/max intensity in substantially different installed light/dark schemes. Measure added frame/memory cost with 200 nodes/500 edges; demonstrate that dense halos do not obscure labels, arrows or focus.

## Implementation sequence and tests

For each task: add the named failing cases, confirm they fail for the intended reason, implement the smallest passing change, rerun focused regressions, then commit a reviewable increment. Rebase file paths against current dev before starting.

### 1. Typed extraction and canonical resolution
Files: modify `wiki/links.py`, `wiki/metadata.py`, `indexing/models.py`; add migrations as needed; test `tests/unit/test_links.py`, `tests/unit/test_metadata.py`, `tests/integration/test_resolution.py`.
- [ ] Define relation-kind and source-position precision without changing authoritative source bytes.
- [ ] Add tests for inline/reference Markdown, images versus links, aliases/IDs, extensionless/root/relative paths, fragments, Unicode/literal percent versus encoded Markdown, code fences/spans, front matter and wrapped aliases.
- [ ] Add structured resolution result shared with existing link rendering; prove old navigation/formatter/relocation contracts still pass.
- [ ] Cover parser-limit failure as incomplete evidence, not zero links.

### 2. Rebuildable relation index and bounded service
Files: create `indexing/graph.py`, `indexing/graph_contracts.py`, `indexing/graph_projection.py`; modify worker/models/migrations; add `tests/integration/test_graph_index.py` and `test_graph_queries.py`.
- [ ] Implement raw-to-resolved projection, destination indexes, namespace invalidation, bounded resume/rebuild and relation mutation epochs.
- [ ] Test A→B via alias, then create an exact A-target path / duplicate alias / rename / delete / exclude target; incoming results must change or explicitly become incomplete, never remain falsely authoritative.
- [ ] Test concurrent source edits, active-generation updates, rebuild promotion, worker restart, failed parsing, delayed indexing, policy changes and storage identity/unavailability.
- [ ] Implement all three domain interfaces and enforce bounds before expensive work; prove no request parses the vault or loads note bodies.
- [ ] Test stable paging, empty continuing pages, invalid/reused filter cursors, old epochs, high-degree nodes, repeated edges, cycles, disconnected notes and truthful capped counts.

### 3. Read-only JSON/WebMCP access
Files: create `wiki/graph_views.py`; modify `wiki/tool_urls.py`, `static/src/wiki-tools.js`, `wiki/tool_status.py`, `docs/webmcp.md`; add graph tool integration/browser tests.
- [ ] Wire the shared interfaces to strict bounded schemas and safe response envelopes.
- [ ] Test session expiry/revocation, malformed parameters, path traversal/symlinks/exclusions, no-store, unsupported/rejected host registration, cancellation, stale responses and safe diagnostic output.
- [ ] Assert UI service and tool calls yield the same canonical edges, statuses, filters and continuation semantics.
- [ ] Verify curation results remain read-only and cannot call save/create/relocate or leak hidden candidates through counts, titles or ambiguity lists.

### 4. Accessible connections experience
Files: create `wiki/templates/wiki/graph.html`, `static/src/graph-controller.js`; modify relevant shell/note templates and `wiki/urls.py`; add `tests/browser/graph-navigation.spec.js`.
- [ ] Ship local/global controls, filters, details, real-link list, stale/incomplete/loading/error states and focus return before graphics.
- [ ] Reuse existing draft/navigation guards; test dirty note, pending conflict, Vim Insert/Normal, Escape, Back, mouse/touch and direct graph URL entry.
- [ ] Cover complete keyboard-only traversal and screen-reader semantics, including `g/` → focused search → Escape → graph navigation → Escape → editor, and no interception in Insert mode. Assert animated node movement does not change selected/focused identity. Selection/recentering must never save or reformat source.

### 5. Elastic force-directed vector map
Files: create `static/src/graph-layout.js`, `static/src/graph-physics.js`, `static/src/graph-camera.js`, `static/src/graph-view.js` and graph stylesheet; integrate through `scripts/build-assets.mjs`; add Node layout tests and browser visual tests.
- [ ] Implement the physics contract above: link springs, softened/capped repulsion, collision separation, weak center gravity, timestep-aware damping and bounded reheating/cooling. Use deterministic seeds for reproducibility, not fixed layered positions.
- [ ] Implement fully rendered local/global views, pointer capture with pin/drag/release, stable node selection/hit targets, labels, smooth camera pan/zoom/Fit and console/early-3D treatment. Preserve positions across incremental updates.
- [ ] Add physics unit tests for finite coincident-node behavior, force symmetry, unique-pair spring weighting, time-step stability, damping/settling, cancellation and caps. Test the two-cluster/bridge fixture and dragging a chain so neighboring nodes visibly follow without inventing semantic weights.
- [ ] Bound per-frame work and settling; stop when cooled, pause while hidden, cancel obsolete layouts and detach listeners/animation on close/navigation. Add reduced-motion and Pause motion paths with feature parity. Lazy-load graph-only assets.
- [ ] Test cycles, many equal titles, long labels, high-degree hubs, zero/one node, interrupted fetch/layout and repeated open/close with no listener or memory growth.
- [ ] Inspect synthetic screenshots and short interaction recordings in light/dark themes, desktop/mobile and reduced motion. Verify elastic drag/release, camera smoothness, idle sleep, pointer cancellation, stable keyboard focus, visible focus/contrast, 200% zoom and no clipping. Still images alone do not verify physics or motion.

### 6. Integrated verification and documentation
Files: add `docs/graph.md`, update WebMCP/editor docs and fixture generator; extend current repository test gates rather than adding a parallel release process.
- [ ] Synthetic 100 / 1,000 / 10,000-note corpora demonstrate request work bounds; measure query time, payload bytes, layout duration and memory on a recorded environment. Proposed UX target: common local graph becomes usable within one second after response on the reference desktop; this is a measured target, not a claim today. Never sacrifice correctness or silently raise caps to pass.
- [ ] Network-observation tests show no external fetches from labels/URLs; text is escaped, no raw note HTML/SVG, no telemetry of note content, no browser-persistent private graph cache, no CSP relaxation.
- [ ] Run focused Python/Node/Chromium/Firefox tests, `npm run build`, `npm run test:formatter`, full Python/browser gates and the repository's current exact-tree local-CI/release checks. Record actual commands/environment/results; do not reuse historical pass counts.
- [ ] Independently review resolver/index invalidation, privacy, completeness claims, keyboard/focus and WebMCP contracts. Use only synthetic material in public evidence.
- [ ] After an authorized deployment, rediscover the three tools in the actual assistant host, query links/backlinks/neighborhood/diagnostics on synthetic notes, follow cursors, navigate and rediscover, then authoritative-read a source. Distinguish this from stub tests and leave it explicitly pending if deployment/host access is unavailable.

## Definition of done

A user can open a fluid console-style local/global graph with `g/`, search immediately, Escape back to graph navigation, drag a node and see its linked neighborhood stretch and settle elastically, navigate entirely by keyboard with stable selection, inspect incoming/outgoing evidence, use a fully capable list/reduced-motion view and return to editing without losing work. An assistant can retrieve exactly the same bounded relationships and curation candidates through WebMCP, with provenance and honest stale/partial/missing/ambiguous distinctions. Security, source fidelity and existing keyboard/navigation behavior remain intact.

Filing this issue changes no code, live wiki content, credentials or deployment.

