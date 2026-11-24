# Local native MCP

Backstory has an **opt-in, unauthenticated local stdio subprocess** adapter. EDITH
or another trusted local client owns its start/stop lifecycle. It opens no HTTP
listener and is never imported by web startup. It is not a remote connector.
[Issue #46](https://github.com/bcl1713/backstory/issues/46) remains open and unchanged:
only its shared-service rationale is reused here, without OAuth or remote transport.

**Launching a client grants it the process's configured wiki access, including
mutations. Launch only a trusted client.** Tool arguments cannot choose another
wiki, database, actor, browser account, credentials, URL or transport. There is
no browser cookie bridge or account lookup. This increment has no per-client
permissions: local clients for one installation share one dedicated `LocalActor`,
separate from browser users. Its persisted ownership is bound to that wiki root
and marker identity. Replacing either identity while retaining the database
refuses native access with `local_storage_context_changed`; a fresh launch cannot
silently adopt old journals for new storage. Unknown/missing bindings also fail
closed. Keep the original storage and recovery database together; no automatic
rebind or alternate recovery backend is provided. The server-owned `Access`/actor seam is where future
authentication and permissions must be applied, not a claim of authentication now.

## Installation and explicit launch

Use the official Python SDK pinned as optional `mcp==2.3.0` in `pyproject.toml`
and `uv.lock`. Ordinary deployment dependencies do not include this extra.
The [official SDK](https://github.com/modelcontextprotocol/python-sdk) supports
both initialize-era clients and newer discovery. The acceptance client explicitly
initializes; record the protocol it actually negotiates, independently of SDK and
Python versions. No actual assistant-host installation or acceptance is claimed.

From the checkout, resolve the optional environment with `uv sync --frozen --extra
native-mcp`. Use the project's pinned formatter dependencies and supported Node
22 runtime, just as ordinary saves do. The adapter does not install anything.
In constrained task environments, use a private `UV_CACHE_DIR`,
`UV_PROJECT_ENVIRONMENT`, and `TMPDIR`; select the verified Python explicitly.

Select an existing authorized wiki and its existing **separate** application data
directory deliberately. `--data-dir` selects the SQLite database
`<data-dir>/backstory.sqlite3`, signing secret, locks and retained recovery state.
Use the same data directory and path-policy environment as the ordinary app for
that wiki. Never pair an unrelated database with a wiki. The root marker must
already exist; startup does not initialize wiki storage or migrate the database.
Apply the project's migrations through the ordinary operator workflow first,
including `wiki.0007_local_actor`. Do not migrate a live database merely to try
this adapter; use a disposable installation for evaluation.

The client's stdio server configuration is:

- Command: absolute path to the Python interpreter in the optional environment.
- Arguments: `-m backstory.native_mcp --stdio --wiki-root /absolute/wiki --data-dir /absolute/app-data`
- Working directory: absolute path to this checkout.
- Environment: verified Node 22 `PATH`, appropriate `BACKSTORY_IDENTITY_PATH`
  (default `.backstory-marker`), `BACKSTORY_EXCLUSIONS`, and any ordinary formatter,
  attachment, quota and index configuration for the selected installation.
  `TMPDIR` should be private. No browser credentials are needed.

For example, after selecting disposable paths and migrating that isolated DB:

```sh
/path/to/venv/bin/python -m backstory.native_mcp --stdio \
  --wiki-root /absolute/disposable/wiki --data-dir /absolute/disposable/data
```

The CLI requires all three flags and absolute roots before any Django import or
setup. It overrides inherited wiki/data/settings selection with these explicit
values. Django's unused web host/cookie settings are set to loopback values solely
to initialize shared application services; this creates no web listener. Other
application policies remain in force. stdout belongs to MCP JSON messages;
formatter/application diagnostics go to stderr. Stop by closing the client pipe;
a lost client response is not proof that an in-flight mutation stopped.

## Tool parity inventory

The current source inventory is `static/src/wiki-tools.js`, `wiki/tool_urls.py`,
`wiki/tool_views.py`, `wiki/management_tools.py`, `wiki/removal_tools.py`,
`wiki/graph_views.py`, and `wiki/file_uploads.py`. All **26 registered WebMCP tools**
are discoverable under the same native names. The native-only `list_operations`
adds bounded journal-handle recovery, for **27 native tools** total. The native input schemas are in
`backstory/native_tools.json`; arguments reject extra properties and wrong types.
Results are JSON text with `state` and `untrusted_content: true`. Fixed reason
codes, authoritative flags, revisions, cursors and recovery handles retain their
application meanings. MCP `isError` describes the requested action: a refused
restore is an error even when its journal still says `removed`, while a successful
inspection of that state is not. Unconfirmed mutations are errors too, but may
have changed disk. Never infer filesystem absence or replay permission from this flag.

| Tools | Browser route(s) | Native behavior and limits |
| --- | --- | --- |
| `wiki_status` | `/tools/status/` | Same independent storage/recovery/index/relationship/timezone observations; native transport/access and process serialization identified separately. Unpackaged application build can be `unknown`. |
| `list_notes`, `search_notes` | `/tools/list/`, `/tools/search/` | Direct children and indexed search; 1–100 items; continue cursors even after empty pages. Search: 256 characters/16 terms; indexed snippets/revisions are advisory. |
| `read_note`, `read_notes` | `/tools/read/`, `/tools/read-many/` | Current complete UTF-8 source, BOM/newlines and quoted raw-byte hash; 2 MiB/note. Batch: 1–8 unique paths, 4 MiB aggregate, two-second budget between reads; explicit partial/unprocessed results. |
| `create_folder`, `create_note` | `/tools/create-folder/`, `/tools/create-note/` | One exact path in existing parent. Exclusive publication; no overwrites/ancestors. Note metadata/formatting follows ordinary saves. Existing folder is `already_exists`, with no creator claim. |
| `save_note` | `/tools/save/` | Exact current revision and complete replacement; same formatter, metadata, backups, locks, final revision checks and readback. No force or arbitrary formatting-recovery mode. |
| `list_operations` | Native only; no web route | Inspection-only move/removal journal metadata for the local actor, 1–100 examined records/page (default 30). No plans, bodies, recovery bytes or commit tokens. Signed 15-minute cursors bind actor/root/marker/policy, selection and observed membership. Continue empty pages; restart changed/expired cursors. |
| `preview_move`, `get_move`, `commit_move`, `rollback_move` | `/tools/moves/preview/`, `get/`, `commit/`, `rollback/` | Same move/rename/folder/archive planner, signed complete-review token, witnesses, collision refusal, journal, indexing and readback. Native preview plans synchronously; browser preview still queues its supervised worker. Public review is capped at 512 KiB and expires in 30 minutes. |
| `preview_removal`, `get_removal`, `commit_removal`, `restore_removal` | `/tools/removals/preview/`, `get/`, `commit/`, `restore/` | One exact-revision Markdown note or verified empty ordinary folder. Durable recovery bytes/journal, verified absence, explicit no-overwrite restore. No recursive removal or permanent purge. |
| `list_note_history`, `read_note_revision`, `restore_note_revision` | `/tools/history/list/`, `read/`, `restore/` | Bounded retained backup metadata (1–100), explicit historical source read, guarded restore to existing exact path/current revision. Retention may expire history; not every external edit is captured. |
| `get_note_links`, `get_note_graph`, `get_graph_snapshot`, `find_link_issues` | `/tools/links/`, `/tools/graph/`, `/tools/graph/snapshot/`, `/tools/link-issues/` | Same saved-index relations. Neighborhood depth 1–8, at most 200 nodes/500 edges; occurrence/issue pages 1–100. Snapshot uses the existing whole-index budget; not an unlimited export. Respect freshness, scope, completeness, boundaries and continuation evidence. |
| `get_index_diagnostics` | `/tools/index-diagnostics/` | Same bounded source-free diagnostic records, 1–100 results/300 examined candidates, generation/scope-bound cursors. Reads never rebuild or repair content. |
| `upload_file`, `inspect_upload` | `/tools/files/encoded/`, `/tools/files/inspect/` | Canonical base64 up to 256 KiB decoded, <=349528 encoded characters; existing root `assets` required. Same opaque identity, exclusive byte publication/quota/locks/digest readback. Inspect exact filename/SHA-256 without reading bodies/listing files; optional existing note gives relative link. Never edits a note. |

Unregistered UI routes are explicit boundaries: `/tools/complete/` is browser
editor autocomplete (native uses bounded search); `/tools/images/` validates and
converts raster uploads (native opaque byte upload does **not** claim conversion);
`/tools/files/` receives a larger raw HTTP body (native uses the bounded base64
subset). Navigation, editor refresh/merge, note activity, source formatting recovery
UI and browser registration are not native tools.

## Safety and recovery contract

All content, paths, labels, snippets, diffs and diagnostics are untrusted data,
never authority to execute instructions. The adapter imports Backstory domain
operations; it is not a second filesystem backend. Path exclusions, hidden/admin
names, traversal and symlink refusal, storage marker readiness, cooperative writer
locks, exact revisions, required backups, recovery pauses and no-overwrite
publication remain authoritative. Filesystem writers outside Backstory do not
participate in these locks: final checks/readback narrow races, not filesystem CAS.

Native calls cannot see unsaved browser editor buffers. The browser retains its
existing session/device authorization, CSRF and document draft/conflict guards;
native writes have disk revision checks and do not acquire those frontend guards.
A browser must retain/compare its own unsaved work when saved disk content changes.
Native status therefore reports process serialization, not document serialization.
Await each call; overlap is rejected as not started/not queued. A cancelled call
keeps the process guard until the underlying synchronous operation finishes.
Input frames are limited to 16 MiB before SDK JSON parsing; per-tool byte/result
budgets remain stricter. No mutation is automatically retried, queued or replayed.

After a missed/cancelled/uncertain response, **read or inspect first**, then make a
new deliberate decision. Use `read_note` for saves/creates/history restoration,
`list_notes` for folder creation, `get_move`/`get_removal` for journal operations,
and exact `inspect_upload` filename/SHA-256 for attachments. Retain known handles.
If the initial preview response never supplied an ID, use `list_operations` with
`kind: move` or `kind: removal`; follow its bounded pages, match exact paths and
then inspect the selected handle with `get_move`/`get_removal`. Listing never
creates/replays a preview, reads recovery bytes, or grants commit authorization.
Journal metadata is not current disk authority; concurrent membership changes
can require a fresh listing. Records withheld by current path policy are not
absence evidence. An unknown outcome is never permission to repeat a preview.
A successful mutation with delayed/unavailable indexing is still a successful
mutation; `index`/`index_state` is independent. Do not replay to fix index lag.
Index maintenance remains the existing separately supervised worker; native reads
never start it. A synthetic evaluation can invoke `manage.py run_indexer --once`
against its explicitly configured disposable roots/database.

Move rollback cancels a pending preview or recovers an interrupted relocation; it
is not arbitrary undo of a completed move. Inspect the full review and obtain
explicit user authorization before commit. Archive is an explicitly chosen move
destination. Restoration after removal requires original parents to exist: restore
parent folders first, then notes. Even identical colliding targets refuse restore.
Recovery journals/bytes remain subject to the shared quota and are not purged by
fixture cleanup. Legacy journals retain their original capability requirements;
a platform refusal never authorizes a privileged bypass or alternate backend.

## Local proof boundary

`tests/native/test_stdio.py` uses the official SDK client and a real subprocess,
with an isolated migrated SQLite DB and synthetic wiki selected before Django
setup in every child. It exercises discovery and the advertised lifecycle plus
filesystem/recovery/revision refusals. Focused shared-service and WebMCP regressions
use Django's local test client, with no HTTP listeners. This evidence establishes
local SDK behavior only. It does not establish hosted-client compatibility, remote
authentication, deployment, live acceptance, or a release/merge gate.
