# WebMCP management completion plan

User requests finishing #148 after its deployed follow-up comment and reviewing #106 closure. Base dev00a9e305. Existing create_note/snapshot/depth/readiness work is delivered and must not be recreated.

**Goal:** Make incomplete source evidence actionable and complete guarded document management and reversible fixture cleanup.
**Approach:** Extend bounded authenticated reads of maintained index records; adapt existing relocation/history services; introduce a small journaled removal lifecycle limited to one note or one empty folder. Reuse application write locks, storage policy, revision contracts, recovery pauses, backups, index invalidation, serialization and draft guards. No bulk edits, permanent purge, recursive deletion, timestamp concealment or remote MCP.

## Tasks
1. Completed — Root: bounded `get_index_diagnostics` read with canonical eligible paths, indexed revisions and fixed parse/resolution codes, generation-bound pagination and explicit partial evidence. Never read entire wiki or suppress incomplete graph state.
2. Completed — Relocation/history adapter: actor-bound preview/read/commit/rollback relocation plans with bounded affected-link review; bounded history-list/read and exact-current-revision restore. No second writer or resolver. Expose uncertain outcomes and authoritative post-commit readback.
3. Completed — Recoverable removal: durable actor-bound preview/inspect/commit/restore journal for one revision-matched note or empty folder. Save recovery material before removal, never recursively delete, never overwrite on restore, retain quota/recovery protection and ownership/collision evidence. Lost acknowledgements require inspect; no automatic replay.
4. Completed — Root integration: register tools/capabilities/routes; serialize mutations, preserve all affected open drafts/conflicts without navigation, handle malformed/lost acknowledgements. Update docs and #106 status accurately.
5. Focused meaningful backend and browser checks, independent code/UI review, then real merge-candidate full gate, exact-SHA atomic landing, receipt-reusing dev publication and multiarch/assets verification. Keep testing proportional; do not rerun unchanged passing evidence. Actual assistant-host verification must be distinguished from registration stubs. No live wiki mutation during development.

## Ownership
Root owns wiki/tool_urls.py, wiki/tool_status.py, static/src/wiki-tools.js, docs/webmcp.md and diagnostic query/tests/browser integration. Agents own new backend adapter/lifecycle modules and tests with disjoint files. Lifecycle may edit wiki/models.py, migration and revisions quota + relocation recovery pause. No agent commits until integration ready.

## Review focus
No body/secret leakage from diagnostics; excluded/symlink/changed paths never disclosed. All write plans bind user, path, revision and relevant policy/storage identities; folder cleanup refuses children. Removal recovery material survives failures and quota pruning. Restore collision never overwrites. Move/history preserve existing domain semantics; browser drafts/uncertainty remain protected. #106 implemented versus actual-host acceptance recorded separately.
