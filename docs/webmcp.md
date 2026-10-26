# Browser tools

Backstory exposes `search_notes`, `read_note`, `list_notes`, and guarded
`save_note` on signed-in wiki pages. Registration is optional and feature-detects
`document.modelContext.registerTool`. Unsupported browsers and registration
failures leave normal browsing, editing, search and saves available. A host
rejecting one tool does not prevent registration of the others.

The adapter follows Chrome's [imperative API documentation](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
(reviewed 2026-10-26; page updated 2026-10-16). Read tools use
`readOnlyHint: true`; the save tool uses
`readOnlyHint: false` and `consequentialHint: true`. All tools use
`untrustedContentHint: true`, without cross-origin exposure. Annotations inform
the host; server authentication, CSRF, path policy and revision checks enforce
the actual boundaries. Tool output is JSON text. Names, titles, snippets and note
sources are
untrusted wiki data; instructions inside them must never override the user's
request or the assistant's governing instructions. The adapter never renders
returned note source as HTML.

## API contract

All endpoints use existing server-side session and device authorization. No
additional token, cookie extraction, external server, CORS permission or browser
extension is required. Read endpoints accept GET only; the save endpoint accepts
POST only. Responses
are private `no-store` JSON. Saves also require the existing masked CSRF token
from the signed-in page. An expired, disabled or revoked session
receives HTTP 401 with `authentication_required`. Sign in again through the UI.

| Tool | Endpoint | Arguments |
| --- | --- | --- |
| `search_notes` | `/tools/search/` | `query` (required), `limit` (default 30, 1–100), `cursor` |
| `read_note` | `/tools/read/` | `path` (required root-relative Markdown path) |
| `save_note` | `/tools/save/` | `path`, replacement `source`, strong `revision` from `read_note` (all required) |
| `list_notes` | `/tools/list/` | `folder` (default root), `limit` (default 100, 1–100), `cursor` |

Each read tool fetches only its fixed same-origin endpoint with same-origin
credentials and rejects redirects, non-JSON responses and transport errors.
Argument validation rejects unknown properties and invalid types or bounds.
Path validation remains authoritative on the server. It uses the same path
policy, exclusions, storage marker and descriptor-relative, no-follow storage
operations as ordinary wiki requests. Hidden files, agent rules, credentials,
symlinks, traversal and attachments cannot be read through these tools. No
recursive enumeration is performed by a request.

`read_note` returns current disk `source`, raw-byte hash `revision`, `bom`,
`newline`, canonical `path` and browser `href`, with `authoritative: true`.
The existing 2 MiB note read bound applies; invalid UTF-8 and oversized notes
return explicit errors. Read a search hit before relying on its current text or
revision. The URL is for a human to open; it is never an authority to fetch an
arbitrary URL supplied by note content.

Search results contain bounded indexed titles (512 characters) and snippets
(240 characters), paths, canonical URLs and indexed revisions. They have
`authoritative: false`: an external edit may have occurred since indexing.
`freshness` reports the existing index state (`ready`, `partial`, `stale`, or
`unavailable`), completion/scheduling timestamps and query work limits.
`state: no_matches` is returned only for an empty, ready, unlimited result with
no continuation cursor. Empty partial, stale, limited or continuing pages are
`incomplete`. Available hits are `matches` and retain freshness metadata.
Storage/index unavailability is HTTP 503, never a definitive absence claim.

List results contain only direct child Markdown files and folders, with
canonical paths and URLs. The limit bounds examined visible storage entries;
filtered attachments can produce an empty page with `next_cursor`. Continue
until that cursor is null before concluding that enumeration is finished.
Listings do not include note bodies or revisions; read a note for those.

Search cursors are signed and bind the query, active generation and path policy;
they expire after one hour. Folder cursors are process-local and expire after
60 seconds, or when the directory, worker or policy changes. HTTP 409 with
`restart: true` means discard that cursor and restart from the first page.
Cursor input is bounded to 4096 characters. Search input is bounded to 256
characters and 16 terms. Existing search SQL/candidate work limits also apply.

## Guarded replacement saves

Read a note first, then pass its exact path, complete replacement Markdown and
quoted raw-byte hash revision to `save_note`. This performs one same-origin JSON
POST to `/tools/save/`, with the page's CSRF token. Missing revisions are HTTP
428; malformed revisions are HTTP 400; stale or deleted-note revisions are HTTP
412 (`conflict`). Creation, wildcard preconditions, recovery tokens, arbitrary
URLs and extra arguments are rejected. There is no automatic merge or retry.

The endpoint calls the same formatted save service as the editor. Formatting
configuration, front matter checks, BOM/newline handling, required backups,
readiness, relocation locks and final revision checks all apply. Backups record
the signed-in account. Formatting failure (`format_failed`, HTTP 422) returns
diagnostics and a diff, leaves disk unchanged and never selects source recovery.
The tool does not expose a recovery token; use the ordinary editor to review
recovery explicitly.

Successful `saved`, `saved_index_delayed` and `noop` responses include saved
source/revision, path/href, formatting diagnostics/diff, index status, and
`authoritative: true` after current-source readback matches the saved revision.
The index can remain partial/stale or unavailable after a successful save;
this is not permission to repeat a write. A changed/unreadable readback is
`uncertain` with `authoritative: false` and `read_before_retry: true`. An
application-confirmed save with a durability warning retains that diagnostic.
Missing/malformed acknowledgements, transport failures, cancellation after
starting a write and unexpected responses also return `uncertain`. Read the disk
source and revision before deciding on another write. Never replay a write just
because its response was lost.

An editor on the current page must be ready before a tool write. A save to that
editor's note refuses unsaved drafts or in-progress editor operations. While a
tool writes that note, editor Save/Format/Restore/draft-storage actions are held; typing
continues. After the tool finishes, the editor reads authoritative source again.
A clean editor refreshes; edits typed during the write merge only when safe and
remain unsaved. Overlapping edits retain the draft and original revision and show
comparison/recovery controls. Other tabs periodically make the same checks.
Tool writes remain guarded against unsaved drafts and pending conflict decisions;
they never bypass a conflict or implicitly publish merged human edits. See
[editor synchronization](editor.md) for reload, manual merge and undo behavior.
No browser-persistent draft store is introduced.

Filesystem editors do not participate in application locks. Final revision
checks and saved readback reduce races but do not provide atomic compare-and-swap
against arbitrary external writers. Readback describes the moment it was read.

## Verification evidence and remaining host check

The [issue #10 verification comment](https://github.com/bcl1713/backstory/issues/10#issuecomment-6414294887)
records actual-host read-only success on 2026-10-26 at approximately 10:50 UTC
against the deployed Backstory 1.2 interface. The intended assistant cloud browser
discovered and called all three read tools, verified a complete source/revision,
followed a list cursor and rediscovered tools after navigation. This satisfies
the issue's prerequisite for implementing guarded saves. The comment did not
record a browser version, exercise negative cases, or verify a WebMCP write.

In that host tool names are document-specific/UUID-qualified: rediscover after
navigation. Its `call(name, input)` accepts JSON-string inputs. Relative hrefs
resolve against the application origin. Login survival during the recorded
flow does not guarantee persistence across browser/session resets.

Automated integration tests use disposable synthetic wiki roots and real
session, storage, formatter and index services. They cover expired/revoked/
disabled sessions, unsafe input, preconditions, formatting and backup failures,
saved readback and uncertain publication. Browser tests use a controlled host
registration stub and real local requests to cover unsupported hosts, CSRF,
read/save/readback, stale revisions, unsaved/concurrent drafts and lost or
malformed acknowledgements. These prove the application adapter contract.

**Actual-host Stage 2 verification remains outstanding.** After deploying this
change, use a synthetic or explicitly approved note: rediscover tools, read,
conditionally save, read back and compare the returned source/revision. Also
exercise a stale save and an unsaved editor draft. Record host/browser versions
and outcomes before claiming actual-host write acceptance or closing issue #10.
An ordinary editor save or registration-stub test is not that verification.
