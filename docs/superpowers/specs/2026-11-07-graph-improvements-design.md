# Issue 107: graph improvements and interface review

The current requirements on issue 107 supersede the original wiki-graph design.
Implementation is authorized by the owner's request to implement, merge and publish.

Reuse SQLite projections, canonical resolution, bounded signed queries, draft guards,
theme tokens and the accessible list. Separate no-op/source freshness updates from
namespace changes; track affected resolution dependencies including missing and ambiguous
references. Publish affected source work atomically and retain independently safe evidence.
Policy/storage/resolver uncertainty retains a fail-closed bounded rebuild path.

Accumulate bounded pages by canonical path and directed pair, replacing aggregate counts
rather than adding them. Keep camera, positions and selection. Expose Load more / Cancel
in either presentation, with honest complete/partial/update states and no implied totals.
Expand local neighborhoods deliberately beyond two hops; global includes disconnected notes.

Use pinned locally bundled Three.js WebGLRenderer, instanced nodes and batched edges,
3D force coordinates and orbit/pan/zoom. Theme-derived batched halos give hop falloff
without full-screen postprocessing. Bound simulation, picking, labels and DPR; support
context loss and list fallback, reduced motion and hidden/settled sleep.

Alternatives considered: extending SVG cannot satisfy real WebGL 3D; replacing the
resolver/database would duplicate established safety contracts; automatic unbounded
loading would undermine request and client budgets. Incremental reuse with explicit
progressive continuation is the chosen implementation approach.

## Navigation and representative wireframes

Desktop: Browse [Open note · Home · Search · Graph] | file tree | Recent.
A collapsed Settings and tools group contains theme/timezone/status/session management;
note-specific actions stay with the note. Safety and conflict decisions remain visible.
Graph: [Local · All notes · List · Load more] [Filters ▸] [View options ▸]
       concise loaded/update state
       large 3D map                         selected-note details
       optional technical evidence disclosure

Phone: Browse disclosure; same primary destinations. Graph opens visually first:
       [Local · All notes · List] [Load more]
       concise status
       3D map (principal viewport)
       compact selected-note details, optional evidence
       Filters / View options collapsed, reachable Close and reset.

## App-wide review, observed source findings and acceptance

P1 browsing/search: main navigation mixes daily tasks with administrative tools
(shell.html); group rare actions in Settings and tools while preserving real links.
P1 graph: expanded filters, camera controls and technical caveats crowd the map;
collapse secondary controls, graph-first phone, concise state and explicit continuation.
P1 selection: hashes, epochs and timestamps compete with note actions; disclose evidence
separately and retain actionable unavailable/authentication messages.
P2 settings/themes: theme import occupies persistent sidebar space; group it with settings.
P2 recent notes: browser-timezone explanation persists during ordinary use; disclose help.
Editing/saving: retain editor toolbar, draft/conflict warnings, caret restoration and guards.
Creation/folders: retain contextual creation links and collision decisions.
Upload/relocation: retain destination confirmation and failure/recovery choices.
Sync/recovery: retain protected-draft/session links and actionable connectivity state.
Keyboard/Vim: preserve g/, Escape search→map→editor, Tab, real-link list and focus return.
Touch/accessibility: wrap controls, maintain reachable hit targets, respect reduced motion,
provide labeled non-drag alternatives and a full list when WebGL is unavailable.
These are source-observed findings and design decisions, not user-research validation.

Focused regression evidence and inspected synthetic desktop/mobile screenshots will be
recorded with limitations. The automatic publisher owns the complete release gate.
Actual assistant-host WebMCP and real-phone validation remain separate from local smoke checks.
