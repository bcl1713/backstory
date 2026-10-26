# Backstory: first-release design and staged delivery

> Storage readiness update: [issue #4](https://github.com/bcl1713/backstory/issues/4)
> supersedes this document's identity-file/hash requirements. The release branch
> now uses a presence-only root `.backstory-marker`, excluded from wiki content.
> See [current storage policy](../../storage.md) and
> [migration guidance](../../setup.md#migrate-from-a-visible-marker-and-hash).

Status: implementation authorized by the owner after the planning baseline.
Tasks 1–12 and their scoped reviews are complete on the feature branch. The
environment-driven setup, trusted HTTPS proxy and optional tunnel follow-up passed
scoped independent review at `27d7b26` and synthetic corrected-image verification.
The owner's subsequent editor
direction supersedes the earlier source-plus-separate-preview primary UI.
Implementation remains limited to disposable synthetic storage and localhost;
production deployment, public exposure and live-storage changes are unauthorized.

## Purpose and boundaries

Backstory is a small, self-hosted browser and Markdown editor for one existing
Markdown directory. Named people and a separately revocable assistant account
share the same files. Plain files and existing paths remain authoritative.
Other tools may edit them. The browser fetches only requested folders, notes,
attachments and bounded search results; it has no whole-wiki synchronization,
offline wiki cache, browser index, automatic backlinks or graph work. Backlinks
may be requested explicitly against server-indexed edges; their UI is optional
and never gates note opening.

Development uses generated, disposable content only. The supplied collection
statistics guide synthetic fixtures; no private snapshot, authentication file,
or live note becomes test content. No production deployment, mount/permission
changes, live Cloudflare account/tunnel/DNS/Access changes, migration or changes
to existing tools are authorized. Optional tunnel packaging is implemented for
the owner's first-class Cloudflare request; it does not authorize activation.
Delete, rename, bulk operations, attachment upload, rich-text/HTML round-trip
editing or WYSIWYG feature parity, MCP, collaboration
CRDTs and graph UI are outside the first release.

## Approaches and selected default

1. **Django, SQLite FTS5, templates and CodeMirror 6 (selected by the builder).**
   Django provides maintained authentication, database sessions and CSRF
   foundations. Python handles filesystem confinement and indexing. A fixed
   Node helper runs Prettier and markdownlint-cli2. This uses two runtimes in one
   image, but avoids constructing the authentication foundation from parts.
2. **TypeScript server, SQLite and CodeMirror.** Shares a runtime with Markdown
   tools, but requires more integration choices for accounts, sessions and
   account administration. No existing code favors this approach.

Use supported Django 5.2 LTS, a supported Python release, and a supported Node
LTS compatible with the chosen formatter versions. Pin exact dependencies and
commit lockfiles during implementation. No Redis, external database, cloud
service, mandatory CDN, or frontend framework is required.

One application Compose service runs supervised web and background-index processes, sharing
an image and local application volume. It exposes localhost only by default.
The production server does not use Django's development server. Process failures
propagate to the container; SIGTERM stops both processes cleanly. Keep deployment
and worker code small enough to operate and test independently.

Deployment configuration lives in environment values. Local HTTP, generic trusted
HTTPS proxies and existing Cloudflare Tunnel connectors share the same file and
account model. Proxy brands do not select different application behavior.
An explicitly selected standalone tunnel manifest may add a pinned `cloudflared`
connector on an isolated origin network, without publishing an app port. Only
that optional connector receives a token-file mount; existing connectors require
no new token or service. Application login remains mandatory, including behind
an optional Cloudflare Access gate. See [tunnel setup](../../cloudflare.md).

## Storage and trust boundaries

- `BACKSTORY_WIKI_ROOT`: mounted existing wiki directory. Mark wiki readiness
  unavailable if missing; never create a replacement root. Compose bind mounts use `create_host_path:
  false`; directory existence alone is insufficient evidence of storage readiness.
- `BACKSTORY_DATA_DIR`: separate local persistent directory for SQLite, accounts,
  sessions, index state, revisions, locks and recovery drafts. Reject overlapping
  roots. SQLite must not reside on NFS. Backups contain private note content and
  need the same protection as the wiki.
- Optional root formatting files are admin-controlled inputs, accessible only
  through a dedicated config reader. They are never browsable wiki content.
- All content routes, previews, link resolvers, attachments, search, index status,
  recovery and history require authentication. All first-release accounts share
  read/create/edit access to the wiki; account administration is a separate CLI
  or explicitly authorized admin role. No per-note access-control system.

### Mounted wiki availability

Use a small, read-only storage identity check: an administrator selects an
existing stable, non-secret regular file in the intended wiki and records its
relative path and expected SHA-256 in trusted application configuration outside
the wiki. The file must pass path/symlink checks and a small read-size cap; never
use authentication files, secrets or agent rules. Read and compare its bytes at
startup, before wiki reads/writes, before final write replacement, and before
accepting a scan's deletion reconciliation or index-generation replacement.
A missing, unreadable or mismatching check file means unavailable or uncertain
storage, even if the root directory exists. Do not automatically enroll whatever
directory is visible, reset the expected hash, or treat an empty mountpoint as a
new wiki. Intentional changes to the check file require administrator revalidation.

This adds no file to the wiki: use an approved existing file. If no suitable
file is available, keep writes disabled until the administrator configures the
check or separately approves a marker. Fixture tests may create their own
synthetic marker; never add one to the live wiki or change a mount automatically.

On failure, mark wiki readiness unavailable, clearly explain the check failure
to authenticated users, retain in-memory/protected recovery drafts and the last
useful index, and refuse all wiki writes and destructive index reconciliation.
Do not display old index data as current. Keep login, status and draft recovery
available. Retry checks with backoff or an explicit Retry action. Once the check
succeeds, resume background reconciliation; saving a preserved draft still
requires a fresh disk revision check and explicit user action. Never auto-replay
failed saves or purge notes on apparent mass disappearance. Test loss, mismatch,
unreadability and recovery using disposable storage, including a directory that
still exists while its check file is absent.

This is a simple readiness signal, not proof against NFS caching or a mount
changing immediately afterward. Continue handling real I/O failures and checking
revisions at the write boundary; a successful check cannot guarantee writability.

### Content confinement and exclusions

Centralize authorization and path policy rather than implementing it per route.
Reject absolute paths, traversal outside root, NULs and malformed encodings.
Decode URLs once and resolve relative links against their source note. Reject
symlinks anywhere in an accessed path, including in-root symlinks, as the simple
first-release rule. Use Linux directory-relative operations and no-follow opens
for reads and writes, not just a string-prefix check. Reject special files.
Document that hostile local users able to replace the mount itself are outside
the supported trust boundary.

Content defaults deny all hidden components and sensitive non-hidden names:
`.silverbullet.auth.json`, `.git`, `.obsidian`, `.syncthing*`, `.stfolder`,
`.stversions`, `.env*`, credential/key/config files, dependency trees, backup and
sync internals, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `SKILL.md` and agent-rule
directories. Use a documented built-in deny policy plus admin exclusions. Markdown
extension alone never grants access. Any future allowlist cannot bypass sensitive
denies. Apply exclusions again when serving an indexed hit, so stale rows do not
reveal excluded content. Do not log note text, search terms, passwords, cookies,
tokens or sensitive request bodies/URLs.

## Read, edit, format and save

Read one bounded UTF-8 file directly from disk, preserving its original bytes,
newline convention and optional BOM. Return a content-derived revision/ETag.
Source access remains available when metadata or Markdown parsing fails.
Default note limit is 2 MiB, comfortably above the 699 KB sample maximum. Show
an explanatory size/encoding diagnostic rather than truncating an editable file.

Release one uses Obsidian-style **inline live preview** as the primary editing
experience, with an explicit **Raw source** toggle. CodeMirror's Markdown text
is the authoritative document in both modes. Source-preserving decorations and
small inert widgets change presentation only; rendered HTML never becomes an
editor document and is never serialized back to Markdown. Keep the existing
safe server preview as a secondary read/inspection option and retain its
security tests and attachment handling. A separate preview pane is not the
primary editing layout.

### Inline interaction and source fidelity

Use CodeMirror 6 with its Markdown syntax tree and a small decoration extension;
this builds on the selected editor rather than adding an editor framework or
service. This implementation choice follows the owner's inline direction.
Decorate familiar headings, emphasis, inline code, list markers and link labels
when inactive. Reveal the original syntax for the active cursor/selection
context; when a selection intersects a decorated block, reveal that whole
relevant block instead of leaving partially hidden syntax. Keep ordinary clicks
for placing the cursor and selection; activating a link is a deliberate action.
Keyboard movement, selection across markup and undo/redo must stay predictable.

The Raw source toggle reconfigures presentation on the same document/selection
and preserves undo history. Opening a note, changing mode, moving the selection
or computing decorations must dispatch no document changes, create no dirty
state and invoke neither formatting nor saving. Only explicit edits, accepted
Format output, confirmed reload or manual merge replace source. Unedited mode
round trips retain original bytes/revision, including BOM/newline handling at
the established server boundary. An explicit source/plain-text fallback remains
available if CodeMirror or its decorations fail.

Treat front matter, tables, code fences and unfamiliar constructs conservatively.
Keep front matter accessible as verbatim source (a visually distinct source
region is sufficient), without a metadata form. Initially keep tables and code
fences as visible, styled source rather than introducing interactive replacement
widgets. Unsupported or ambiguous syntax remains visible and editable verbatim.
Small link widgets must use escaped text/inert DOM; they never render raw HTML,
execute document code or automatically load remote images. Resolve navigation
through the existing authenticated path/link policy only on explicit activation.
No cursor/decoration work requests backlinks, scans, or whole-wiki data.

Before expanding the editing UI, demonstrate a small synthetic-note slice with
front matter, headings/emphasis, wikilinks/aliases/fragments, relative links, a
table and fenced code. Browser evidence must show live/source toggling without
document/byte changes, active syntax reveal, multi-line selections, ordinary
navigation, undo/redo and unsupported-source fallback. Then integrate the same
editor with the established Format/Save/create/conflict/recovery contracts and
verify those outcomes are independent of presentation mode. No numerical
performance targets, editor-parity project or storage-model change is introduced.

Keep front matter in the editor. Parse it into a separate typed projection for
indexing, with a safe YAML parser and bounded depth/aliases/input. Never serialize
that projection back to the document. Preserve unknown keys, nested values and scalar types;
date-like text is not automatically converted into a date. Report parse issues
with positions and continue indexing available body/path/title text.

Root `.prettierrc` and `.markdownlint-cli2.jsonc` files are optional.
Honor them when present, including applicable
ignore files, safe nested config and approved data-only references. Never modify
them.

Proposed absent-config defaults: Prettier `printWidth: 80`, `proseWrap: always`,
`endOfLine: auto`; markdownlint default rules with MD013 disabled. These are
application defaults, not replacements written to the wiki. An existing config
takes precedence. Respect `.prettierignore`, configured gitignore behavior,
markdownlint ignores and relevant `.editorconfig` settings. A deliberately ignored
note remains editable and is identified as skipped by the relevant tool.

Pin Prettier and markdownlint-cli2 during implementation. Proposed pipeline:
Prettier -> markdownlint-cli2 supported fixes -> Prettier -> lint diagnostics.
Run the identical pipeline again to verify a fixed point. Bound execution time,
input/output sizes and diagnostics. Read approved configuration as data, reject
JS configs/plugins/custom rules/module loading and unauthorized external config
references with an actionable diagnostic. Do not call a shell or discover/install
packages from wiki content. Run only packaged tools against one staged note in
application storage; preserve the original relative path for config/ignore
semantics. Root globs must never cause the helper to process other notes.

Explicit Save applies this pipeline to edited content; explicit Format previews
its result and diagnostics without touching disk. Opening, indexing and preview
do not format. Compare metadata meaning/scalar tags before and after formatting;
detect changes to link destinations and unsupported constructs in representative
tests. Exact equivalence of every Markdown dialect cannot be guaranteed. On a
detected preservation conflict, malformed input that prevents formatting, or a
non-convergent pipeline, retain edits, show the exact diagnostic/diff, and avoid
writing the transformed file. Preserve the user's unformatted source and show
the diagnostics. Offer an explicit **Save source without formatting** recovery
action after formatting failure; never select it automatically. It saves the
user's source without formatter/linter rewrites, retaining the established file
encoding/BOM and line-ending handling. Keep diagnostics visible and label the
result as saved without formatting, rather than claiming formatting/lint success.
Source access, copying and draft download also remain available. Non-fixable
lint warnings alone do not prevent a normal safe save and remain visible afterward.

The source-save action skips only the failed formatting transformations. It uses
the same authorization, CSRF, path/exclusion, size, storage-readiness, conflict,
revision, backup and safe-write checks as normal Save, including the original
base revision and a fresh disk comparison when recovery is requested. An external
edit still returns a conflict; unavailable/unwritable storage, backup failures
and real I/O errors remain failures. This action cannot turn those failures into
success. Normal saves continue to honor optional `.prettierrc` and
`.markdownlint-cli2.jsonc` configuration.

Save protocol:

1. Require authentication, authorization, CSRF protection and an explicit base
   revision (`If-Match` for edits; create uses an absent-file precondition).
   Enforce path/exclusion policy, size limits and the storage-readiness check.
2. Hold an application lock keyed by canonical path, shared across web processes.
   Read and hash current bytes; reject a stale base before formatting.
3. Format staged content for normal Save, or use preserved source only when the
   user explicitly requests the formatting-failure recovery action. Preserve
   newline/BOM behavior as described above. For either action, store bounded
   recoverable original/submitted versions outside the wiki before a changed
   write; if required backup storage fails, refuse the write and retain the draft.
4. Recheck storage readiness, then re-open and re-hash the current file after
   staging and immediately before replacement. Reject a changed revision.
   Identical resulting bytes are a no-op:
   do not change mtime or create a redundant revision.
5. Write a uniquely named, reserved transient sibling, flush/fsync, replace within
   the same directory and sync the directory where supported. Preserve basic file
   mode; document inode, ACL, ownership and extended-attribute limits. New notes
   need a create-if-absent strategy that cannot overwrite an existing name.
   Temp files are excluded from all content routes and cleaned on failure/startup.
   No persistent metadata, index files, backups or sidecars are placed in the wiki.
6. Return saved bytes, revision and diagnostics. Queue the changed note for index
   refresh. If indexing fails after writing, report saved-with-index-delay, not an
   ambiguous failed save. Re-read saved revision after uncertain write outcomes.

Conflicts return HTTP 412 and current revision with recovery actions: compare
base/current/draft, download/copy draft, reload with confirmation, manually merge
and save against the new revision. Never silently retry with a fresh ETag or
provide an unconditional overwrite action.

Application locks coordinate Backstory processes only. Hash checks and same-dir
replacement reduce races but cannot provide atomic compare-and-swap against an
uncoordinated external writer, especially on NFS. NFS caching, open file handles
and mount semantics can affect visibility/durability. Document residual races;
do not claim perfect cross-client atomicity or add distributed locks that external
editors would ignore. A missing/unwritable mount produces an actionable error
while preserving browser edits; a hung NFS syscall may require mount/operator
intervention and cannot be made safely cancellable by a request timeout alone.

## Indexing and search

SQLite holds rebuildable FTS5 documents and relational projections for path,
title, existing IDs, aliases, tags, selected typed metadata and link edges.
Duplicate IDs/aliases produce ambiguity, never arbitrary target selection.
Original values and raw front matter stay in the file. Index standard Markdown
links and wikilinks using syntax-aware parsing; ignore code fences/inline code.

The server indexes the entire authorized Markdown collection, including link
edges, in the background. Only browser-side whole-wiki indexing is prohibited.
Use one low-priority worker and an internal scheduler, not an additional queue
service. The worker owns a persistent, coalescing bounded queue and never starts
overlapping scans. The schedule and batch limits below are configurable defaults;
keep scheduling simple and adjust only if ordinary use shows obvious contention.

- Initial setup queues one complete background build; opening the application
  does not trigger another build. On restart, resume interrupted work.
- Each successful Backstory save queues just that note for prompt asynchronous
  refresh; save success never waits for indexing. Successful disk reads can also
  queue a stale note. These jobs take precedence over bulk maintenance.
- Every five minutes, a scheduled incremental scan checks paths and filesystem
  metadata in small batches and reads/reindexes only apparently changed notes.
- Once per day, a rolling content-verification job reads all eligible Markdown
  files in batches to catch changes missed by metadata checks. It is not a
  destructive index rebuild and does not inspect attachment contents.
- A manual Refresh queues the incremental scan; a separate deliberate Rebuild
  recreates the index. Repeated requests coalesce instead of adding duplicate work.

Process small batches (initial proposal: up to 20 files), yield for one second
between maintenance batches, and use short SQLite transactions. Lower worker CPU
scheduling priority where supported; do not rely on OS priority alone to limit
NFS I/O. Keep SQLite local
with WAL mode so normal reads can proceed during index writes. Slow filesystem
calls can still stall; yielding between batches does not guarantee that an NFS
read can be interrupted. Back off on mount/database errors rather
than retrying aggressively. Watchers are optional acceleration hints and are
disabled by default for the NFS-oriented configuration: scheduled reconciliation
provides correctness. Requests never scan the whole tree. Rebuilds use generations;
interrupted or failed mount scans must not erase the last index or falsely delete
all notes. Only a completed, error-free scan with a successful storage check can
reconcile deletions or replace the last useful index generation.

Expose initial indexing/running/idle/error, processed/discovered counts, pending
jobs, last completed scan and per-document indexed revision. Do not claim a
percentage before total discovery is known. Search explicitly indicates partial
or stale results. Display the next scheduled scan and any maintenance backoff.
External changes normally become searchable after the next incremental scan
finishes, with mount caching and backlog affecting that delay; metadata-invisible
changes can wait for daily verification. Direct note reads and save revision
checks consult disk regardless of index freshness and never wait for indexing.

Folder navigation enumerates one authorized directory lazily, with bounded pages
and a cursor/cache for large individual directories. No recursive tree payload.
Search uses FTS and indexed filename/title lookup, not file reads. Default page
30, maximum 100; cap query length (256 characters), term count (16), snippet length
and execution work (SQLite progress deadline). Use bound parameters and literal
terms rather than accepting arbitrary FTS expressions. Escape snippets as text;
highlight with controlled markup. Use stable cursors and bounded work for paging.
Revalidate candidate policy/existence before returning results without rereading
the entire matching corpus. Opening a result always reads disk again.

Backlink edges are indexed in the worker, but no backlink traversal or graph
rendering occurs on opening a note. Backlink/graph UI can be deferred entirely.

## Links, preview and attachments

Resolve `[[folder/note|label]]`, optional `.md`, `#heading` fragments and existing
ID/alias targets through disk path policy and indexed names. Prefer exact
root-relative wiki paths, then source-relative paths, then unambiguous indexed
IDs/aliases/basenames. Ordinary Markdown links are source-relative. Existing
`../` relative links within root are valid after resolution. Fragments use a
documented heading-slug convention with duplicate-heading handling. Preserve
all original link text on disk. Missing, excluded and ambiguous targets show
clear UI states without disclosing excluded targets or creating notes implicitly.

Use a maintained CommonMark/GFM renderer with raw HTML disabled, plus an allowlist
sanitizer and a restrictive Content Security Policy. No executable scripts,
unsafe URL schemes, inline event handlers, or raw SVG execution. Serve authorized
raster images/PDFs with safe content types and `nosniff`; unknown/active attachment
types download rather than execute in the app origin. Prevent external embedded
images from silently contacting third parties; external links remain ordinary
labeled navigation. Missing excluded assets show a useful placeholder and do not
make the note inaccessible. Bound attachment streaming/range requests.

## Accounts, sessions and deployment

Interactive management commands bootstrap accounts with hidden password input;
no default password or password command-line argument. Use Django password
hashing with Argon2, password validation and generic login errors. A maintained
login-throttling integration uses account and trusted-client-IP limits; forged
forwarded headers must not evade limits. No self-registration by default.

Use server-side sessions, rotate on login/privilege changes, invalidate on logout,
and check revocation/disabled account on each authenticated request. An account
session registry supports revoke-one-device/revoke-all and assistant revocation.
Cookies are HttpOnly and SameSite=Lax, Secure in HTTPS mode. Mutations require
CSRF tokens and Origin/Host validation. Authenticated note responses use
`Cache-Control: no-store`; no service worker, IndexedDB/localStorage note cache,
or persistent bearer credentials. Drafts remain in memory unless a user explicitly
downloads or stores a recovery draft in protected application storage.

Proposed configurable session defaults: ordinary sessions idle 12 hours,
absolute 24 hours; remembered sessions idle 14 days, absolute 90 days. Renewal
extends idle expiry only up to the absolute cap. Browser resets can require
login again. Cleanup expired records. Explicit local-development cookie settings
are separate from production, which fails configuration checks if insecure.

Trust proxy headers only in explicitly configured deployment mode where the
proxy overwrites them and direct origin access is restricted. Restrict allowed
hosts/origins. Cloudflare Tunnel supplies connectivity; Cloudflare Access is a
separate optional authentication gate. Retain application accounts even behind
Access. Do not trust a bare Access email header as application authentication.
No Tunnel/Access configuration or public exposure is part of local development.

Follow-up integration status (2026-10-25): the original Stage 4 baseline was
reviewed; the later generic HTTPS proxy implementation passed its separate
combined security/image acceptance gate at `27d7b26`. The explicit contract is vendor-neutral:
`BACKSTORY_PROXY_MODE=trusted`, HTTPS cookies, exact allowed hosts/HTTPS origins,
an allowlist of actual TCP peer IPs/CIDRs, preserved Host and a proxy-overwritten
single `X-Forwarded-Proto: https`. The optional selected client-IP header must
contain one overwritten literal IP; default `none` uses the TCP peer. The guard
covers every route, including health, before HTTPS handling. Forwarded host and
proxy/Access identity do not grant app authentication. Default Compose remains
loopback/localhost/proxyoff, and env-based origin publication requires independent
network restrictions. Host wiki/data roots must be verified canonical and disjoint
outside the build context; distinct container mount targets do not prove that.
See [proxy setup](../../reverse-proxy.md) for the operator contract. This follow-up
does not authorize changing live proxies, firewalls, mounts or deploying a server.

Run non-root with minimum filesystem access. Required write permissions and NFS
UID/GID considerations are documented, not changed automatically. Health checks
distinguish process health, wiki readiness and index freshness without exposing
private paths or content. Account/session DB, revisions and generated secret
material persist across restart in the application volume; no secrets in source,
logs, URLs, prompts or checked-in environment examples.

## Interface and accessibility

Desktop: folder sidebar, search and note title/breadcrumb, one primary inline
live-preview editor, a labeled Raw source toggle, and persistent Save/Format/status
controls. Safe server preview is a secondary option, not a required split pane.
Mobile: collapsible navigation and one primary editing pane with the same raw
source escape hatch. Use a calm, readable design with visible focus,
adequate contrast, semantic forms, explicit labels and touch targets. Provide
skip navigation, keyboard folder/search/note access, Escape to close dialogs and
focus restoration. Markdown editor and mode controls have accessible labels and a plain-textarea
fallback. Mode changes preserve focus, selection and undo; decorative widgets
never trap keyboard or touch navigation. Do not require drag/drop or icon interpretation.

States: clean, dirty, formatting/saving, saved, warning, error and conflict.
Expose status via a polite live region. Warn on browser unload and intercept
in-app navigation/logout while dirty. Keep edits after failed save or expired
authentication, and allow reauthentication without discarding them. Keyboard
Save uses Ctrl/Cmd+S; a visible button provides the same behavior. Formatting
failures expose the labeled Save source without formatting action and retained
diagnostics. Unavailable storage shows readiness/retry guidance and draft recovery;
neither normal Save nor source-save recovery can override it.

## Staged implementation plan and evidence

1. **Foundation and local vertical slice.** Scaffold Django, locked dependencies,
   disposable fixture generator and separate storage; interactive accounts,
   protected lazy browsing, a demonstrated CodeMirror inline-live-preview/source
   slice, explicit
   conflict-checked save and create. Include the read-only storage identity check,
   formatting helper and explicit source-save recovery before claiming the save
   flow is complete. Demonstrate login -> open -> edit -> save -> reopen,
   two-editor conflict, no-op save and failed-format recovery with diagnostics.
   Live/source mode changes must not alter any save outcome or disk bytes.
   Keep an immediately runnable localhost workflow.
2. **Preservation and indexed discovery.** Expand fixtures to at least 1,000
   notes in the supplied directory structure, 299 dailies and a roughly 699 KB
   note; include synthetic front matter, tables, nested lists, Unicode, CRLF,
   malformed YAML, IDs/aliases, wikilinks and missing attachments. Implement FTS,
   background generations, typed projection, link edges, resolution, diagnostics,
   progress and bounded refresh. For successfully formatted notes, verify a
   second identical pipeline makes zero additional byte changes with and without
   optional configs. For formatting failures, verify explicit source-save recovery
   preserves submitted content and retains diagnostics.
3. **Recovery, sessions and security.** Complete device renewal/revocation,
   throttling, revision retention and conflict comparison. Test external edits
   during formatting, symlink/path attacks across every content route, exclusions,
   XSS/unsafe links, unavailable/unwritable wiki and index failure after save.
   Exercise both save actions against stale revisions, denied paths, oversize
   content, backup failures and real storage errors. Test storage loss and return,
   including an existing empty mountpoint: retain drafts/index, refuse writes and
   deletion reconciliation, and resume only after successful readiness checks.
4. **Polish and delivery.** Browser tests for desktop/mobile and keyboard paths;
   exercise ordinary browsing, indexed search, note opening, editing and recovery
   with the representative synthetic wiki, including the large note. Check bounded
   payloads, no full-wiki browser requests/storage and that background indexing
   does not gate note opening. Fix obvious hangs or unusable behavior. Provide
   Dockerfile, runnable Compose, secret-free `.env.example`, short README,
   backup/recovery guide, limitations and a disposable-note walkthrough. Validate
   restart persistence for accounts/sessions/index/history and rebuild recovery.

Keep performance work practical: no numerical latency targets, percentile gates,
benchmark suites or optimization milestones. Retain resource/security caps and
simple background scheduling; add no complexity for marginal speed gains.
Correctness, security and data-preservation tests remain required.

Tests must exercise real workflows, not mirror implementation details. Use
pytest/Django tests for filesystem, metadata, concurrency and authorization;
real packaged formatter subprocesses for preservation/idempotence; Playwright
for two browser contexts, live/source byte fidelity, selection/undo, responsive
layouts, keyboard control, safe preview and
no whole-wiki browser storage/network. Record executed commands/results and
explicitly identify checks unavailable in the environment. Real TrueNAS/NFS
durability/latency and uncoordinated-writer guarantees cannot be established by
local fixtures; document that deployment boundary honestly.

## Recovery and operations deliverables

Document consistent SQLite backup through its backup API (or stopped app),
wiki backup separately, protected revision/draft retention (proposed 30 days,
bounded by a configurable storage quota), and secret material needed for restore.
Restore to a disposable location first, recover individual note revisions through
the same conflict-safe save path, and rebuild the search projection from files.
Index rebuild never resets accounts or sessions. Walkthrough creates synthetic
human and assistant users interactively, tests login/search/read/edit/conflict,
revokes the assistant and removes the disposable environment safely.

## Remaining decisions

No unresolved product decisions block this documentation revision. Keep the
architecture and staged delivery above, with the owner's inline-live-preview
revision applied; routine implementation details remain with the builder. A stable existing storage-check file and its expected hash must
be configured before enabling writes against a real wiki; that is a deployment
prerequisite, not permission to inspect or alter live storage now. This revision
does not authorize deployment, public service exposure or changes to live notes
or mounts. Implementation authorization is active for the staged local work.

## Primary references consulted

- Django authentication: https://docs.djangoproject.com/en/5.2/topics/auth/default/
- Django sessions: https://docs.djangoproject.com/en/5.2/topics/http/sessions/
- Django support: https://www.djangoproject.com/download/
- SQLite FTS5: https://sqlite.org/fts5.html
- SQLite WAL: https://sqlite.org/wal.html
- Linux inotify limitations: https://man7.org/linux/man-pages/man7/inotify.7.html
- Prettier config: https://prettier.io/docs/configuration
- Prettier options: https://prettier.io/docs/options
- markdownlint-cli2: https://github.com/DavidAnson/markdownlint-cli2
- Cloudflare Tunnel: https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/
- Cloudflare Access: https://developers.cloudflare.com/cloudflare-one/access-controls/
