# Authorized graph snapshot (#142)

The requested architecture in GitHub issue #142 is the design authority. Reuse the merged #141 controller, renderer, fixed-root physics and canonical derived index. Notes remain authoritative and read-only throughout graph use.

Expose an authenticated private/no-store bulk snapshot at `/tools/graph/snapshot/`, with optional `folder`, `tag`, `query` filters. Return existing GraphPage node/edge evidence and freshness fields plus `schema_version: 1`, opaque `scope` and `snapshot_id`; `next_cursor` is null. The scope binds session/user, storage identity and namespace/policy. Snapshot identity binds published index generation/mutation/relation epoch/publication and graph evidence/freshness. Check endpoint eligibility and index stamps before delivery; incomplete index evidence remains explicitly partial. Resource failures fail honestly, never truncate.

The browser stores this snapshot only in memory, independently of the visible exploration. An indexed outgoing adjacency map drives local BFS. Preserve all previously selected expansion seeds, recompute the accumulated subset from those seeds on reconciliation, and pass only this subset to the existing renderer with the opening root. Keep unique canonical edges and occurrence counts. Selection details use snapshot evidence without another neighborhood query.

Refresh every 15 seconds while visible and on explicit refresh/return. The existing maintained index watcher and polling recovery observe external edits; no graph request parses bodies. Failed revalidation or a changed authorization/storage scope clears private evidence. Hidden/pagehide/close abort work and clear snapshot evidence; late responses are fenced by cancellation and request sequence. Same-scope successful refresh preserves surviving coordinates, camera, selection, focus and motion controls.

Alternatives: repeated neighborhood fetching conflicts with the requested local traversal; a new graph database duplicates authority and link semantics. A single compact transfer reuses the indexed model and avoids artificial tiny continuation windows; real resource errors show recovery rather than a false complete graph.
