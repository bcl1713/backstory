# Issue 148 — relationship evidence and management audit

This record covers the working tree based on dev
`5a99ee74bd5d2b5e6fdbd0914adefaad6e88d959`. Fixtures contain only synthetic notes.
Focused evidence below is separate from the exact proposed merge candidate's
release gate and publication receipt.

## Diagnosis and repair

A ready source index is not a complete relationship projection. The graph query
requires a matching generation mutation and policy/storage namespace, a completed
relation pass, and complete per-source parsing/resolution evidence. Each graph
request also rechecks endpoint eligibility and final publication identity.
Returning `projection_incomplete` while `index.state == ready` can be correct.

Controlled reproduction found a persistent aggregate consistency bug: malformed
front matter sets a source's parsing evidence incomplete. After that source is
removed and a verification scan finishes, `record_mutation` updates relation
completion but previously retained `RelationState.evidence_complete == false`.
With no dirty sources, the worker returns immediately and never repairs it.
All three paged graph operations consequently remain incomplete even though the
remaining source evidence is complete. The fix recomputes aggregate evidence from
retained per-source flags during a known mutation. A completed worker pass also
repairs the old stale aggregate, allowing already-affected installations to recover
without a global rebuild or source edit. Regression tests retain the epoch, raw
occurrence IDs and resolved relation IDs; the legacy repair does zero resolutions.

This is a proven synthetic cause, not a claim that every observed live incomplete
response has that cause. Incompleteness is preserved while any retained source
has metadata/body parsing limitations or unavailable/unconfirmed resolution.
Malformed metadata may hide aliases and IDs, so treating its diagnostics as
irrelevant would create unsupported absence claims. An unsupported `file:` link
is a separate fixture demonstrating finished-but-incomplete resolution.

`wiki_status.relationships` now reports independent, source-free observations:

- `state`, `reason_code`, `projection_complete`, and its indexed-content scope;
- generation, mutation, relation epoch and publication sequence;
- total, pending and published source counts, plus incomplete parsing/resolution
  source counts (these categories can overlap);
- `retry.action` and `retry.automatic`, distinguishing worker progress from a
  source/link problem that another identical graph request cannot resolve.

`published_sources` means sources no longer dirty, including sources whose
published evidence is incomplete. It is not a count of complete graph nodes.
`relation_projection_pending`, `relation_namespace_changed` and
`relation_index_updating` advise waiting for the existing worker. Source-index
backoff details remain in `index`; waiting is not a promised completion deadline.
`relation_parse_incomplete` advises source repair and reindexing;
`relation_resolution_incomplete` advises inspecting links and reindexing.
`relation_storage_unavailable` requires storage restoration. No status read
queues work, opens note bodies, changes flags or reveals paths/target text.

Repairing a note through ordinary save schedules indexing; external repairs use
the normal watcher/polling reconciliation. Operators can use the existing status
page's verification/rebuild action when deliberate reindexing is appropriate.
Repeated graph reads are observations, not a repair API. Snapshot polling's
15-second interval is not a bound on index-worker completion.

The status graph capability now derives its limits from `indexing.graph.LIMITS`,
including the effective depth of eight. The browser schema also advertises eight;
a focused adapter check retains that contract. The bulk snapshot is separately
advertised as `get_graph_snapshot`; legacy page limits describe paged operations.

## Whole graph semantics

`get_graph_snapshot` reuses `/tools/graph/snapshot/`, the existing authenticated,
read-only whole-index endpoint. It returns every eligible indexed node, including
isolates, and every eligible directed canonical aggregate between selected
endpoints. Duplicate occurrences contribute an edge count, not extra graph nodes.
No request scans disk, reparses note bodies or expands authority beyond the
current authenticated session and policy. Scope/snapshot identifiers are opaque;
session, storage and policy changes revoke compatibility with prior evidence.

Directed reachability from A follows edges `source -> destination` for the
chosen hop depth. For `A -> B <- C`, A reaches B but cannot reach C by following
outgoing links. A weakly connected component ignores edge direction and includes
all three. A disconnected region is a weak component of the selected graph;
a node unreachable from A need not be in a different weak component. Weak
components and directed reachability can be computed from a complete snapshot;
there is no new endpoint that invents a stronger relationship claim.

Folder, exact-tag and literal path/title/name filters select nodes before transfer.
Only edges with both endpoints selected are emitted. `boundary_connections`
reports eligible connections crossing this filter boundary; it does not enumerate
or authorize the excluded endpoints. Components of a filtered snapshot describe
that induced subgraph, not necessarily components of the whole wiki. Local paged
queries remain bounded and can require signed continuation. The snapshot has no
artificial node/edge membership cap and no continuation; SQL watchdog or memory
failure is an explicit failed request, never a complete prefix.

A graph can be incomplete because source indexing or projection is unfinished,
parsing/resolution evidence is incomplete, a file changed, an endpoint became
unverifiable/ineligible, or a legacy query exhausted resource bounds. Generation,
mutation, namespace or publication races expire the read instead of mixing
snapshots. Missing/isolated issues are withheld for incomplete evidence; safe
positive links from independent clean sources remain usable. Complete means
complete eligible indexed saved content at observation, never an atomic disk
snapshot or semantic knowledge beyond explicit links.

## Management gaps and service reuse

Relocation already has a reviewed, journaled service:
`wiki.relocations.preview_move`, `commit_move`, and `rollback_move`, exposed in
`/move/`. It checks actor ownership, exact filesystem/revision witnesses,
collisions, policy, link rewrite plans and expiry; recovery can pause ordinary
writes. A future WebMCP adapter should return a bounded preview and opaque
actor-bound operation ID, require explicit consequential commit, preserve draft
and uncertain-outcome guards, and report index lag separately. It must reuse this
service rather than implementing rename or link rewrites in the browser.

Recoverable cleanup has no trash/delete service or deletion journal today.
`SavedRevision` and `RecoveryDraft` are bounded retention material; they do not
provide a durable reversible delete contract. `cleanup_staged_saves` is internal
save recovery, not user-content cleanup. A future cleanup operation needs an
explicit preview, revision-bound selection, actor-bound quarantine journal,
collision-safe restore, quotas/retention and recovery/write-lock rules before
exposing a destructive tool. Graph isolation is advisory and must never be an
automatic deletion criterion, especially across filters or incomplete evidence.
This issue does not add broad cleanup mutation surfaces.

History already has `/history/<path>`, revision retrieval and
`wiki.revisions.restore_revision`, with policy/recovery checks and exact current
save preconditions. A future read adapter can expose bounded revision metadata
and explicitly selected revision content. A restore adapter must require an
explicit revision and current base revision, reuse `restore_revision`, preserve
source-recovery/backup quotas and draft guards, and reconcile an uncertain write
through readback instead of replay. History is local application backup history;
it does not promise capture of every external writer's intermediate edit.

## Verification and limits

The smallest regression selection first established five failures: stale aggregate
completeness, status depth 2 versus runtime 8, and absent independent relationship
status (three cases). After implementation, those five passed in 0.76 seconds.
Two additional fixtures for legacy repair and permanent resolution limitation
passed in 0.62 seconds. Adding the requested `note_creation` capability first
failed the existing private-status check for the missing field (0.48 seconds).

The affected-file command and final outcome are recorded below after completion.
No full suite is claimed here. No source/body/log inspection or mutations were
performed against a private live wiki. Available document-control tool metadata
supports office document surfaces, not a Backstory WebMCP session; actual assistant
host discovery, schema acceptance and invocation remain a post-deployment check.
Local browser registration/adapter fixtures are not evidence of actual host
acceptance. Publication does not itself redeploy a connected live wiki.

Affected-file verification (Python 3.14.4, repository `.venv`, real synthetic
SQLite/storage fixtures):

```text
.venv/bin/python -m pytest tests/integration/test_graph_index.py tests/integration/test_graph_queries.py tests/integration/test_graph_tools.py tests/integration/test_graph_snapshot.py tests/integration/test_tool_status.py -q
108 passed in 28.28s
```

After that pass, the removal regression was strengthened to check
`query_links`, `query_graph` and `query_link_issues` before/after removal rather
than only the graph response. Only that changed test was rerun:

```text
.venv/bin/python -m pytest tests/integration/test_graph_index.py::test_removing_only_incomplete_source_restores_projection_without_unrelated_rebuild -q
1 passed in 0.57s
```

The other passing evidence is retained for unchanged code; these are combined
focused results, not a fresh full-suite pass. Cumulative pytest execution time
was approximately 32 seconds. Logs: `/tmp/backstory-148-focused.log` and
`/tmp/backstory-148-all-three.log`. Focused whitespace validation passed.

Verified production-file SHA-256 values (the final test-only strengthening did
not change these inputs):

```text
430a222214a5dcbcc5806afd143cefee9c39e7f104332440f8d2090de2941b74  indexing/graph_projection.py
08f6253990879d95f58bc6e72881e73f09260aeaded1e6533629c206d5d1ef50  wiki/tool_status.py
```
