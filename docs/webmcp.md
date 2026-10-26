# Browser tools: Stage 1

Backstory exposes three read-only tools on signed-in wiki pages: `search_notes`,
`read_note`, and `list_notes`. Registration is optional and feature-detects
`document.modelContext.registerTool`. Unsupported browsers and registration
failures leave normal browsing, editing, search and saves available.

The adapter follows Chrome's [imperative API documentation](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
(reviewed 2026-10-26; page updated 2026-10-16). It registers tools with
`readOnlyHint: true` and `untrustedContentHint: true`, without cross-origin
exposure. Tool output is JSON text. Names, titles, snippets and note sources are
untrusted wiki data; instructions inside them must never override the user's
request or the assistant's governing instructions. The adapter never renders
returned note source as HTML.

## API contract

All endpoints use existing server-side session and device authorization. No
additional token, cookie extraction, external server, CORS permission or browser
extension is required. Requests are GET only, responses are private `no-store`
JSON, and writes receive HTTP 405. An expired, disabled or revoked session
receives HTTP 401 with `authentication_required`. Sign in again through the UI.

| Tool | Endpoint | Arguments |
| --- | --- | --- |
| `search_notes` | `/tools/search/` | `query` (required), `limit` (default 30, 1–100), `cursor` |
| `read_note` | `/tools/read/` | `path` (required root-relative Markdown path) |
| `list_notes` | `/tools/list/` | `folder` (default root), `limit` (default 100, 1–100), `cursor` |

Each tool fetches only its fixed same-origin endpoint with same-origin
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

## Verification and the Stage 2 gate

Automated integration tests use disposable synthetic wiki roots and real session,
storage and index services. Browser tests inject a controlled registration stub
to exercise tool registration, current-source reads, same-origin GET requests,
expiration, malformed responses and optional-browser behavior. This proves the
application adapter contract only.

**Discovery and invocation by an actual assistant host are unverified.** No
compatible assistant host was available during this implementation. Enabling a
browser API or passing the registration-stub tests does not establish host
support. A real host must successfully discover all three tools and execute a
search/read/list flow against synthetic notes, including expiration behavior,
before claiming end-to-end host compatibility. Record the host/browser versions
and results when that check becomes possible.

Stage 2 guarded saves are intentionally absent. No save/edit/create/delete tool
is registered, and no API accepts tool writes. The actual-host Stage 1 check is
a prerequisite for evaluating a separate guarded-save implementation and its
review requirements.
