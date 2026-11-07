# Wiki graph

Open **Menu → Graph**, **Local connections**, or type `g/` in Vim Normal mode
or a navigation control. Graph search receives focus. Escape leaves search for
the map first; the next Escape closes the graph and restores the editor caret.
Insert mode, other text fields, composition, quick open, `gf`, `gh`, browser
shortcuts and Tab retain their existing behavior. Browser Back closes the overlay.

The graph uses **indexed saved content**. Unsaved editor buffers are excluded.
Opening it cancels a pending idle-save timer; selection, searching, recentering
and dragging never save, format or create notes. Opening a note is a separate
action and uses the ordinary draft/conflict navigation guard.

## Evidence and navigation

The local map starts with incoming/outgoing one-hop links. Choose Two hops to
expand, or Overview for a bounded global view. Folder, exact tag and literal
path/title/name search filters share the tool service's semantics. A boundary
message distinguishes eligible connections outside the filters. Excluded paths
are never disclosed as boundary nodes.

Arrow keys or h/j/k/l on the focused map focus and inspect the nearest visible
node in that direction. Enter opens it; Space centers it; `/` focuses search;
`?` shows help; `+`/`−` zoom. Fit, pan, zoom, previous-center and filter actions
also have labeled buttons. Tab leaves the map normally. The list has real note
links, canonical paths, inspect/center controls and stable path ordering.
Mobile defaults to the list. The direct `/graph/` page provides a server-rendered
connection/direction list and filter form without JavaScript.
Filters and additional map controls fold on small screens; Pause and the list
toggle stay available. `g/` expands and focuses search; Escape reveals navigation.

□ marks the current note, ◇ the selection, and corner brackets the focused note.
Inspecting a note shows incoming/outgoing occurrences, original target spelling,
syntax/image classification, fragment, indexed source revision and advisory
line/column. Reference-link positions may identify the containing line rather
than the definition. Locations are not edit ranges; fragments are not verified.
An arrow means that one saved note explicitly references another, not agreement,
importance or factual support. External links and assets stay references rather
than note nodes; images/embeds and self-heading links do not add map springs.

## Motion, theme and bloom

The app-owned SVG map uses the installed semantic palette. Theme changes update
strokes, labels, focus and halos through CSS without restarting the simulation.
Light palettes reduce halo opacity; forced colors removes decorative halos.

Physics uses one symmetric spring per unique note pair, regardless of repeated
mentions or reciprocal arrows. Dragging pins only that node and tugs linked
neighbors; release/cancellation clears the pin without throwing the node. Drag
the background to pan. Touch users can scroll outside the map and use labeled
pan/zoom controls. Positions are presentation, never semantic distance.

Final constants live in `static/src/graph-physics.js`: 60 Hz fixed steps, at most
four catch-up steps, spring rest length 90, stiffness 8, repulsion 1,200,000 with
softening 144/cap 300, collision radius 22/strength 20, center pull .04,
elapsed-time damping 4.8 and speed cap 600. The simulation sleeps after 45 steps
below speed 2 or at 720 total steps. A work-limit message explains forced rest.
Slow frames suppress halos and reduce catch-up work. Hidden tabs, list mode,
closed graphs and navigation stop frame work. Reduced motion settles at most
240 steps without animation and uses immediate camera changes. Pause motion
freezes the current map while keeping all navigation/evidence available.

Bloom is strongest at the selected note, falling monotonically with shortest
explicit-link hops **inside this displayed graph**; edge tiers use the farther
endpoint. Direction remains in arrows and evidence. Disconnected nodes remain at
baseline. Intensity is Off, Restrained or High; Off removes the halo layer.
Emission is `intensity × (.12 + .65 × .52^hop)`, with disconnected baseline `.08`.
Selection changes recompute rings once and never move the camera or reheat physics.
Labels, hit targets and selection/focus glyphs retain readable screen sizes when
zooming out. Overlapping labels declutter with selected/focused notes first;
the list always retains every returned path.

## Bounds, freshness and continuation

Responses contain at most 200 nodes, 500 directed aggregated edges, 100 link or
diagnostic items and 512 KiB of JSON. Depth is 1 or 2, paths/cursors at most 4096
characters, query/tag at most 256. Candidate and SQLite instruction/time budgets
also apply. Isolation examines a continuing 20-note window because endpoint
eligibility includes filesystem checks. An empty page can have a continuation.

Graph pages first page explicit occurrences with both endpoints included, then
page indexed nodes so disconnected notes remain discoverable. Nodes can repeat
between pages. A local page retains its eligible center. A one-node limit cannot
represent an edge and discloses that limit; use links or a larger node limit.
All cursors bind the full query/limits, policy/storage namespace, generation,
mutation and relation epoch, expire after one hour and require an explicit
restart after invalidation. Numeric checkpoints keep tokens bounded for long paths.

The worker keeps raw occurrences and a separately indexed forward/inverse
canonical projection. Every indexed source/name/path mutation invalidates the
whole relation epoch. Policy, storage-root identity and resolver version changes
also invalidate it. Re-resolution resumes in batches of at most 20 occurrences;
no request scans/parses the vault or reads note bodies. Indexed parse-completeness
flags avoid scanning metadata while holding the writer lock. Existing indexes
are rebuilt in the background after migration to classify image occurrences.

`authoritative: false`, `untrusted_content: true`, freshness, epochs, observation
time, limiting reasons and projection completeness accompany each result. Both
endpoints and ambiguous choices are checked against current policy and no-follow
storage eligibility before they affect returned relationships/counts. Changed,
deleted, symlinked or known unindexed endpoints withhold completeness. Failed
parsing, unfinished resolution and capped work cannot establish missing links or
isolation. “No indexed connections observed” never proves the disk is unchanged;
external writers and same-stat edits remain bounded by normal reconciliation.

Only the theme preference persists in the browser. Private graph results,
positions and the small navigation trail remain in memory. No remote images,
scripts, raw note HTML/SVG, telemetry, new credentials, CORS changes or remote
MCP server are involved.

## Verification and remaining acceptance

See [graph verification](testing/graph-verification.md) for commands, measured
synthetic corpus/query/layout results and environment limitations. The fixture
generator is `tests/fixtures/graph.py`; the query benchmark is
`python scripts/benchmark_graph.py --output /tmp/graph-results.json` and refuses
existing fixture destinations. Use generated data only.

Actual assistant-host discovery/invocation remains a separate, post-deployment
acceptance step: discover the three tools, query links/backlinks/graphs/issues,
follow continuations, navigate and rediscover, then authoritative-read a source.
Browser registration stubs do not establish host acceptance. This work does not
deploy or change a live wiki.
