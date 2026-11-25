# Local native MCP

The shipped stdio option below remains available. A separate explicit
[authenticated private LAN HTTPS process](native-mcp-https.md) is opt-in,
requires TLS, a bearer file and an explicit LAN subnet or exact Forge peer, and changes no WebMCP or
default web startup behavior.

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
adds bounded journal-handle recovery, and native-only `edit_note` adds a guarded
literal-span edit, for **28 native tools** total. The native input schemas are in
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
| `edit_note` | Native only; no web route | One exact-match literal span and strong current revision; old/new text at most4096 UTF-8 bytes each, old nonempty, overlaps count. Same normal save path; refuses when metadata/formatting would alter any other bytes. Compact verified revision/index outcome, no body/diff. See safe steps below. |
| `list_operations` | Native only; no web route | Inspection-only move/removal journal metadata for the local actor, 1–100 examined records/page (default 30). No plans, bodies, recovery bytes or commit tokens. Signed 15-minute cursors bind actor/root/marker/policy, selection and observed membership. Continue empty pages; restart changed/expired cursors. |
| `preview_move`, `get_move`, `commit_move`, `rollback_move` | `/tools/moves/preview/`, `get/`, `commit/`, `rollback/` | Same move/rename/folder/archive planner, signed complete-review token, witnesses, collision refusal, journal, indexing and readback. Native preview plans synchronously; browser preview still queues its supervised worker. Public review is capped at 512 KiB and expires in 30 minutes. |
| `preview_removal`, `get_removal`, `commit_removal`, `restore_removal` | `/tools/removals/preview/`, `get/`, `commit/`, `restore/` | One exact-revision Markdown note or verified empty ordinary folder. Durable recovery bytes/journal, verified absence, explicit no-overwrite restore. No recursive removal or permanent purge. |
| `list_note_history`, `read_note_revision`, `restore_note_revision` | `/tools/history/list/`, `read/`, `restore/` | Bounded retained backup metadata (1–100), explicit historical source read, guarded restore to existing exact path/current revision. Retention may expire history; not every external edit is captured. |
| `get_note_links`, `get_note_graph`, `get_graph_snapshot`, `find_link_issues` | `/tools/links/`, `/tools/graph/`, `/tools/graph/snapshot/`, `/tools/link-issues/` | Same saved-index relations. Neighborhood depth 1–8, at most 200 nodes/500 edges; occurrence/issue pages 1–100. Snapshot uses the existing whole-index budget; not an unlimited export. Respect freshness, scope, completeness, boundaries and continuation evidence. |
| `get_index_diagnostics` | `/tools/index-diagnostics/` | Same bounded source-free diagnostic records, 1–100 results/300 examined candidates, generation/scope-bound cursors. Reads never rebuild or repair content. |
| `upload_file`, `inspect_upload` | `/tools/files/encoded/`, `/tools/files/inspect/` | Canonical base64 up to 256 KiB decoded, <=349528 encoded characters; existing root `assets` required. Same opaque identity, exclusive byte publication/quota/locks/digest readback. Inspect exact filename/SHA-256 without reading bodies/listing files; optional existing note gives relative link. Never edits a note. |

## Small lossless edits on large notes

After this revision is deliberately shipped, a native client can use registered
`edit_note` without constructing or resubmitting the complete note. A worker must
first discover that tool; an older27-tool runtime has no equivalent small-edit
workflow. Do not use shell, execute_code, another bridge, source-recovery mode or
an automatic whole-replacement fallback as a job method.

1. Call `read_note` with `{"path":"notes/daily.md"}`. Require authoritative=true;
   retain the returned exact quoted revision and select the precise literal text.
   Existing read_note returns the body; the job does not submit that body again.
2. Call `edit_note` with path, that revision copied verbatim, old_text and new_text.
   For example the argument shape is:

```json
{
  "path": "notes/daily.md",
  "revision": "\"<64 lowercase hex characters copied from read_note>\"",
  "old_text": "One unique existing sentence.",
  "new_text": "One corrected sentence."
}
```

The revision above is a placeholder: copy the actual entire read_note.revision
string, including its quote characters; never hash a search snippet or use a
wildcard. old_text must be nonempty. Each text is limited to4096 UTF-8 bytes and
4096 Unicode characters; new_text may be empty. Matching is exact/case-sensitive,
not regex/normalized/fuzzy. Exactly one occurrence is required, counting overlaps:
`aaa` in `aaaa` is ambiguous and refuses. No multi-edit language or actor argument.

The server checks current revision under the existing wiki/note locks, builds
the splice internally and runs ordinary metadata+formatter processing. It requires
the resulting source to equal the requested splice exactly before staging, with
one narrow exception: the normal server-computed wiki date may replace the value
of one existing, safely identified frontmatter `modified` scalar outside the
original span. The field must have a plain block key and one unwrapped single-line
string value; its entire line (including key/comment/newline) must be untouched
by the caller. No missing field, caller-created/overlapped field, flow mapping,
tag, anchor or reference is eligible. Quote style, comments, BOM and newlines
must remain exact. The server captures its configured wiki date once; no client
date or metadata authority is accepted.

Additional formatting *inside* the span is still conservatively refused. A
title/alias update, CRLF normalization, wrapping or unrelated formatting change
therefore returns `edit_would_change_other_content` without publication/backup.
Formatter/metadata failure is `edit_format_unavailable`; no recovery grant or raw
bypass is offered. Use a separately authorized editor workflow when normalization
is needed; do not broaden the unattended job's permissions or retry automatically.

On success, every byte outside the span and that optional existing scalar value,
including encoding BOM/newlines, is preserved. Supported LF and configured
formatter-stable BOM+CRLF are tested on synthetic large dated notes. Existing
notes without a modified field, or whose normal metadata is already current and
unchanged, keep the exact-splice behavior. An ineligible modified field still
refuses if normal processing would change it. No formatter configuration or other
unmanaged content is normalized. Submit a canonical literal replacement with the
note's exact newline sequence and surrounding blank lines; no whole-note
reconstruction or separate metadata call is needed for an eligible stale date.

The compact result includes state, verified revision/authoritative flag and
independent indexing status, with no full source/diff/formatter messages or
literal echoes. `saved`/`saved_index_delayed` with authoritative=true means readback
matched the new raw-byte hash. `indexing.state=queued` is not an indexed/ready
claim; index.state is the separate current observation. `noop` leaves bytes and
backup unchanged. A normal published edit has the usual original/submitted
backup and ownership. Known stale, missing/ambiguous and normalization refusals
leave note bytes/backup count unchanged. Final config/revision/parent checks run
before the targeted backup. As with all saves, unrelated external filesystem
writers do not honor cooperative locks; this is not filesystem compare-and-swap.

After a missed reply, uncertain readback or unconfirmed durability, read current
source/revision (and inspect normal history if necessary) before any deliberate
next decision. A backup or queued index does not authorize replay. Reusing the
pre-edit revision after successful publication refuses as stale. Native clients
still cannot see unsaved editor buffers. No WebMCP tool or existing complete-save
schema/behavior changes; the new tool is additive across shared native transports.

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
