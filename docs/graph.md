# Wiki graph

Open **Menu → Graph**, **Local connections**, or type `g/` in Vim Normal mode
or a navigation control. `g/` starts a two-hop local view centered on the current note and focuses search; Escape returns to graph navigation,
then closes the graph and restores the editor caret. Browser Back also closes it.
Insert mode, composition, Tab and browser shortcuts keep their normal behavior.

The graph reads **indexed saved content**. Selection, filters, orbit, expansion and
node dragging never save, format or create notes. Opening a note uses the ordinary
draft/conflict navigation guard. Pending idle-save is cancelled on graph entry.

## Explore connections

Local starts at **two outgoing hops** when opened from a note.
The visible hop controls and `[` / `]` change depth from **one to eight hops** while
graph navigation has focus. Brackets remain ordinary input in search or the editor.
The note that opens a local exploration stays its **opening root**. Initially its
configured outgoing depth is loaded. Selecting any node, including one at the
outer hop level, adds that node's configured outgoing neighborhood to the graph.
Previously explored nodes and all eligible directed links stay loaded. Selection
changes emphasis, while directed BFS hops and equal shortest-parent springs stay
rooted at the opening note. New shorter paths update those depths and springs.
Selection never refits, recenters or reseeds the view. Surviving positions,
orientation, zoom, focus, pause and reduced motion remain intact.

Indexed outgoing adjacency is batched and retained in an expiring, stamp-bound
exploration session. Repeated completed selections need no new neighborhood
request. Continuations advance automatically for larger work; there is no fixed
graph-size ceiling. Refresh and returning from a hidden tab revalidate accumulated
evidence before showing it again. Changing root, filters or depth starts a new
scope. An incoming-only note does not join merely by linking into the graph.

SQL retains its emergency per-statement watchdog (2,000,000 VM steps or one
second). Per-response work, endpoint eligibility and automatic continuations
bound large traversals independently. Generation, mutation, relation and
eligibility changes revoke old exploration tokens and cursors.

**All notes** starts automatic loading of every eligible wiki component, including
disconnected notes. Bounded pages accumulate without repeated Load more clicks;
empty continuing pages advance too. Canonical nodes and directed aggregate edges
are deduplicated; repeated aggregate counts replace earlier counts. Local views
also follow continuations automatically. All eligible directed links between
included nodes remain visible, including same-depth, back and reciprocal links. Folder, exact
tag and literal path/title/name filters use the shared JSON/WebMCP service. Active
filters are shown beside the local/whole-wiki scope, including their values.

The summary shows loaded notes/links and Complete, Loading, Loading paused, or
Partial. Complete means all pages in the requested scope were exhausted with valid
evidence; counts are loaded counts, not invented whole-wiki totals. **Pause loading**
retains results and continuation; **Resume loading** continues automatically. Loading
pause is independent of **Pause motion**. Errors and expired/stalled cursors expose
**Restart loading**; authorization/storage/namespace failures clear retained evidence.
Scope/filter/depth changes cancel obsolete requests. Close releases pending work.
A request with a different index/eligibility version cannot mix with earlier pages.

**Graph settings → Forces** starts collapsed. Spring strength, Repulsion and
Gravity apply live from **0.25× to 4× default**, in quarter steps. Linked pairs use
equal springs regardless of repeated/reciprocal mentions. Springs gather linked
neighborhoods; gravity gently pulls toward the overall graph center. Changes reheat
from current positions without changing camera, selection or loaded relationships.
Pause motion and reduced motion remain in force; tuned values take effect on resume.
**Reset defaults** saves 1× for these three forces only. Versioned force settings are
saved for this site in this browser and survive close/reopen and reload. Invalid,
missing or obsolete values fall back safely. Storage denial keeps tuning page-local.
Only force settings are saved, never graph content, paths or topology.

Phone layouts open in graph mode where WebGL is supported; the full connection
list is one action away. An explicit list choice is preserved across scope changes
within the open graph. Filters, tuning and technical evidence begin collapsed.
Selected-note actions and incoming/outgoing groups remain available below/beside
the map. Revisions, epochs, timestamps and advisory locations live in disclosures.
The direct `/graph/` page has a server-rendered paged connection list without JS.

## 3D interaction and accessible alternatives

The lazy, locally bundled Three.js `WebGLRenderer` uses true xyz coordinates,
instanced nodes, shared line/arrow buffers and batched soft halos. No CDN or
external rendering service is used. Labels use a bounded canvas overlay; there
is no permanent DOM or draw call per node/edge. Hint mode temporarily mounts named
keyboard target buttons for visible nodes. All loaded nodes remain in the scene/list.

Drag the background to orbit around a stable focus; Shift-drag or two-finger drag
pans. Pinch/the wheel zooms. Drag a node to stretch its real link springs and tug
neighbors; release settles elastically. Movement thresholds distinguish taps from
drags, and pointer cancellation releases pins. Scroll outside the map to scroll
the page. Labeled Fit, Reset orientation, orbit, pan and zoom controls avoid
requiring gestures. Pause motion and reduced motion preserve navigation.

Arrow keys or h/j/k/l focus and inspect a visible node. Enter opens it; Space
expands its neighborhood; `/` searches; `?` shows help; `+`/`−` zoom; `[`/`]` adjust local depth. Tab leaves the map. The
connection list provides canonical paths, real links and ordinary keyboard actions
independent of changing coordinates. □ marks current, ◇ selected, and a reticle
focused. Arrows preserve direction. Position and size do not imply meaning.
Links in the opening root's outgoing shortest-path spring structure stand out;
every equal shortest-path parent participates. Other directed links remain faint
context, including cross-links, backward links and unreachable components. This
distinction follows the opening root and loaded topology even while motion is paused.
Forced colors keeps all links legible.

One-hop outbound destinations use the theme's green accent and a circle cue.
Their title labels show the actual `f <code>` shortcut before hint mode is opened.
One hop means an outgoing link from the **selected note**; the opening root still
controls BFS and springs independently.

Choose the always-visible **Node hints (f)** control or press `f` while the map has
focus, then type a code to select and expand a node. The same assignments supply
the advertised shortcuts and active hint mode; immediate outbound destinations
receive the easiest codes. Codes are prefix-free and stay assigned to the same nodes throughout an
in-progress sequence, even during movement or appended results. Backspace edits;
Escape cancels; Tab leaves hint mode. Search and editor typing are unaffected.

Only the selected note and its immediate outbound destinations have title labels.
Two-hop, incoming-only and more distant titles are hidden. Density and collision
rules still bound simultaneous labels; full titles remain accessible through
named hint targets, selected-note evidence and the existing connection list.
Mesh radii and soft glow are world-space geometry:
zooming out shrinks their footprints. Text, hint codes and focus feedback remain
readable in screen space; pointer/touch picking keeps its independent target size.
Lines and arrowheads meet the projected world-space node boundaries.


Physics uses unique-pair springs, damping, collision/repulsion, weak centering,
bounded timesteps/catch-up, deterministic neighbor seeding and cooling. Large
layouts use a bounded spatial approximation. Simulation stops when settled or at
the work budget; hidden/list/closed graphs stop animation. Reduced motion starts
without animation and keeps camera changes immediate. DPR and label work are capped.

Installed theme semantic colors and typography update without replacing graph
state. Forced colors removes decoration and retains readable glyphs. Selection is
the strongest bloom source; brightness falls with shortest explicit-link hops in
**loaded eligible edges**, with edges using their farther endpoint's tier. Cycles,
reciprocal edges, occurrence counts and screen proximity cannot amplify emission.
Default uses the former High intensity; High adds stronger bloom above it.
Non-spring links and their halos remain quiet at either setting.
Off is a true Off. Adaptive quality reduces decorative cost with hysteresis and
recovers when frames improve, while respecting forced colors and user Off.

WebGL initialization failure and context loss retain the same loaded connection
list, filters and navigation. Retry map or context restoration recovers graphics;
restoration does not start duplicate loops. Resource teardown disposes graphics,
listeners and observers. No graphics capability is required to open a note.

## Evidence, incremental indexing and bounds

The worker stores raw occurrences, resolution dependencies and canonical relations
in SQLite. An unchanged revision refreshes scan/stat bookkeeping without recreating
raw or resolved rows, changing the completed epoch, or invalidating graph cursors.
Body/provenance edits preserve occurrence identities when link semantics are equal
and refresh source revision/positions without re-resolving the whole vault.

Known name/path changes dirty affected sources, including dependencies on absent
and ambiguous names and higher-priority exact paths. Recorded exact-path fingerprints, including absent
paths and attachments, are verified at most 20 per reconciliation batch without
scanning attachment trees. A new extensionless file can therefore safely shadow
an alias without requiring a global relation rebuild. A dirty source is withheld
while bounded staged work runs; independent safe completed sources remain usable.
Publication checks source/dependency versions and namespace atomically. Unrelated
edits do not restart a large source's resumable work. Policy, storage identity,
resolver/migration uncertainty retain a conservative bounded rebuild path; old
namespace evidence is never used across an unknown eligibility boundary.

Both endpoints and ambiguity choices are revalidated before they affect results
or counts. Denied, deleted, symlinked, changed or unverifiable endpoints are
withheld. Client requests compare an opaque eligibility version as well as index
identity; authorization/storage failures clear cached map, titles, counts and detail
panels and cancel older requests. Leaving/closing the graph releases private state.
No private graph contents are persisted in browser storage.

Each response remains bounded to 200 nodes, 500 directed aggregate edges, 100 link
items and 512 KiB JSON. Paths/cursors are at most 4096 characters, search/tag 256;
candidate, SQL instruction/time and depth budgets remain enforced. Queries never
scan the vault or parse/read note bodies. Signed continuations bind query, limits,
policy/storage namespace and index/publication versions, and expire after an hour.

Results are advisory: `authoritative: false`, `untrusted_content: true`, freshness,
observation time and completeness accompany them. Source locations are advisory,
fragments unchecked, assets/images references rather than invented note springs.
Incomplete parsing/resolution cannot establish missing links or isolation. External
writers and same-stat changes remain bounded by normal reconciliation; this index
is not an atomic filesystem snapshot.

## Verification

Current issue 107 checks and limitations are recorded in
[implementation evidence](testing/107-implementation.md) and the
[app-wide UX review](testing/107-ux-review.md). Earlier measurements in
[graph verification](testing/graph-verification.md) describe the previous SVG
implementation, not this renderer. No new benchmark or device matrix is required.

Actual assistant-host WebMCP discovery/invocation remains a separate, authorized
post-deployment check. Browser registration stubs do not establish host acceptance.
Publication builds/releases artifacts; it does not redeploy a live wiki.

Dense maps place labels around nearby node and focus marks, rather than drawing
important titles over one another. Selected, focused and current-note identities
get placement priority; a short leader ties an offset label to its node. Fewer
ordinary labels appear where the map is crowded. Titles may be shortened on the
map; the connection list and selected-note details retain full titles. These
choices affect labels only, not loaded notes, links or outgoing-hop membership.

Open **Index progress** for the active indexing phase, checked metadata and
dependencies, parsed notes, queued changes, last reconciliation/content
verification, and notification health. Progress is refreshed only while this
disclosure and the page are open. An empty queue or equal discovered/processed
counts does not mean dependency checks or relationship projection have finished.
