# Graph Presentation and Activity Design

## Intent and issue traceability

Implement GitHub #170's graph-only presentation with truthful fullscreen and Screen Wake Lock lifecycle, and #171's brief node cue for successfully observed note reads and writes. The canonical requests are the full issue bodies at [#170](https://github.com/bcl1713/backstory/issues/170) and [#171](https://github.com/bcl1713/backstory/issues/171); run snapshots `issue-170.json` and `issue-171.json` retain the fetched body/comment receipts.

## Goals

- #170: deliberate entry from the graph; hide all application chrome in presentation; use native fullscreen where available and an honest graph-only fallback; provide Escape and invoked touch/keyboard controls; manage wake lock acquire/release, visibility and unsupported/denied states; preserve graph, theme, camera, selection, exploration and editor draft.
- #171: emit activity only after successful supported content reads or confirmed writes; deliver canonical path and kind to the already-open graph; pulse one node with finite decay, repeated-event coalescing and reduced-motion/forced-colors handling; never change graph topology, camera, selection or note contents. Explicit Pause motion also suppresses the cue to preserve that existing control's meaning.
- Implemented coverage is limited to operations observed by authenticated app browser code: foreground note-page loads, successful WebMCP reads, confirmed editor saves, and confirmed WebMCP writes. Same-origin messaging has no retained history and does not replay old events after reconnect. Graph refresh and failed or metadata-only operations emit nothing. Direct external API clients are excluded by this transport choice even though their authenticated server responses are observable boundaries; the existing 15-second graph revalidation is metadata-only and cannot deliver those content events. Issue #171's lean one-path acceptance is demonstrated by the real supported app path; this exclusion is a coverage boundary, not evidence of intrinsic unobservability or inactivity. External filesystem reads remain unobserved; no read tracing or inference from timestamps is added.

## Non-goals and anti-goals

No OS lock override, machine-wide tracing, note-reading audit database, note-body event payloads, fake/periodic activity, layout redesign, new rendering framework, graph reset, PWA conversion, or production rollout. Existing graph navigation, camera controls, draft guards and themes remain authoritative.

## Approaches considered

1. Use same-origin `BroadcastChannel` from successful browser operation responses. It is transient, body-free, cross-tab, and uses existing browser authentication/session context; it cannot report an API operation that was not initiated by an app browser context. **Chosen** for the bounded requested browser acceptance and absence of existing server push infrastructure.
2. Add server-side event storage or a streaming service. This broadens deployment/runtime requirements and risks creating reading history, so it does not fit #171's no-history and reuse constraints.
3. Infer from index/watcher changes or graph refresh. These cannot detect reads and would mislabel metadata refresh as activity, so they are rejected.

## Design calls

- Presentation is a class/state on the existing graph panel, with browser fullscreen requested only on deliberate entry. If rejected/unavailable, the same graph panel fills the viewport and chrome is hidden. A temporary invoked control sheet holds exit and wake-lock controls; it hides after action/timeout.
- Wake Lock state reflects API availability and promise result. A visibility return reacquires only while presentation and user preference remain active. Exit and teardown release the sentinel.
- Successful reads include rendered note/source content and explicit application content-read tools/revision reads. Successful writes require a confirmed saved response and canonical path. Metadata graph queries, graph refreshes, failed/conflicted/cancelled writes and unsuccessful reads do not broadcast.
- Activity is kept in graph view state only. Renderer emission adds a short bounded term on top of existing baseline emission; it remains distinct from selection bloom. Repeated same-node events extend a capped decay window.
- Browser tests will perform real synthetic note read/write operations in a second same-origin page while the graph stays open, and assert only the matching node changes and then returns to baseline.

## Open implementation detail

Use the existing graph panel/controller and renderer boundaries. Determine whether activity metadata can be threaded into current emission/color code without per-frame allocations; keep storage bounded by visible graph node count.
