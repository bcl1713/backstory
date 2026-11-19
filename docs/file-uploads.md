# Upload files

Use **Upload file** on the home page or in a note's persistent controls. Choose
any file (empty files are valid), then Upload. Bytes are preserved exactly;
content is never decoded, extracted, imported, executed or formatted. The result
shows the original display name, canonical root asset path through its download
link/Markdown, byte count, SHA-256 and confirmation. Uploading does not save a
note. Copy link and Insert into draft are separate explicit actions.

Insertion replaces the selection captured when opening the dialog, as one undo
operation. Changing the draft, note/navigation or editor composition makes the
snapshot stale; copy the link and choose a new insertion point. Existing drafts
and disk notes remain untouched by upload. Validated **Upload image** remains
available for the raster decoding/metadata-removal/inline-image workflow.
For a note not yet saved, insertion uses its already-authorized destination
folder. Inspecting a retained upload after navigation generates a link for the
current receiving draft, rather than reusing the previous note's relative link.

## Names and delivery

Files go only into the already-existing authorized root `assets/` directory.
No parent directory is created. Display names are 1–120 UTF-8 bytes; Unicode,
spaces, percent signs and Markdown punctuation are accepted. Separators,
ASCII controls, `.` and `..` are rejected. Reserved originals such as `AGENTS.md`,
`.prettierrc`, HTML, SVG and forged PNG/PDF names are safe attachments.

Storage names are `file-<sha256>-<base64url-display-name>.attachment` (at most
241 bytes per component). The encoded name is metadata, never a path/suffix or
an instruction. Same name and same bytes confirm an existing file; different
bytes or display names have different identities. Existing conflicting files
are never replaced. Returned names/metadata are untrusted data.

Downloads require an active session and authorization, including administrator
exclusions. They use `application/octet-stream`, safe original filename
Content-Disposition, `nosniff`, and `Cache-Control: private, no-store`. Opaque
attachments cannot be opened through note/source/preview routes or indexed as
Markdown. No new inline renderer is provided. Existing ordinary raster/PDF assets
and validated raster uploads retain their previous delivery behavior.

With an existing authorized note context the ordinary Markdown link is relative
to that note. Otherwise it identifies the root asset. Labels escape Markdown
punctuation; storage destinations need no original filename interpolation. A root
identity can always be downloaded through the supplied authenticated href.

## Limits, storage and uncertain outcomes

- 8 MiB per file, lowered further by `BACKSTORY_ATTACHMENT_MAX_BYTES`. Attachment
  delivery's hard ceiling is 64 MiB with an 8 MiB single-range ceiling; accepted
  uploads are retrievable under the configuration used at acceptance. A later
  administrator limit/policy change may restrict them.
- 1000 managed files / 256 MiB published managed bytes shared by raster uploads
  and arbitrary attachments. At most 10000 directory entries are examined. This
  is a managed-upload quota, not a quota on pre-existing unrelated wiki assets.
- One arbitrary receiver per wiki, nonblocking admission, 64 KiB IO chunks and
  byte/quota enforcement as bytes arrive. No trust in Content-Length. A single
  extra staging file is bounded by the same 8 MiB cap. Request bodies are not
  buffered wholesale by the raw service; the UI hashes at most 8 MiB in memory.
- A 30-second receive budget checks between reads; in the supported pinned
  Gunicorn runtime a request socket deadline also interrupts blocked body reads.
  Buffered test/development WSGI inputs lack that socket and use between-read
  checks. Production must use the documented pinned runtime. Finite directory
  and hash work is bounded by entry/file caps; filesystem IO still depends on the
  mount, like the rest of the application.

The service uses session/CSRF, storage readiness, recovery pauses, cooperative
wiki/per-path locks and descriptor-relative no-follow operations. It revalidates
session/account state after receipt, stages a registered sibling, fsyncs and links
exclusively, and hashes stored bytes before authoritative success. Cooperative
writers are serialized; arbitrary external writers are not filesystem CAS, and
readback reports the observed moment. No existing asset is automatically deleted.
Incomplete registered stages are removed on normal failure/cancellation and by
the existing startup cleanup after interruption. Unavailable storage can defer
cleanup; retained registrations are not permission to delete unrelated files.

Cancellation, network loss or a malformed/lost acknowledgement can occur after
publication. The dialog retains a bounded filename/digest/note inspection identity
in this tab's session storage (in memory if browser storage is unavailable).
Upload stays disabled until **Inspect upload status** deliberately confirms the
file or reports absence. Inspection never uploads bytes, lists the directory or
deletes anything. Busy, denied, changed or unavailable is not absence. Only an
authoritative absence enables a new deliberate upload. No automatic retry.

## API and WebMCP transfer

`POST /tools/files/?filename=...&sha256=...` accepts raw octet-stream bytes with an
optional `note` query. `GET /tools/files/inspect/` accepts the same bounded
identity and optional note, hashes at most one file and returns confirmed/absent
or a truthful error. Successful publication returns created/already_exists;
unconfirmed publication returns uncertain with `inspect_before_retry`. Results
include path, authenticated href, original_filename, bytes, sha256, ordinary
Markdown, authoritative and untrusted_content. They never contain file bodies.

WebMCP `upload_file` accepts `filename`, canonical `data_base64`, and optional
existing `note`. The browser computes SHA-256 before sending JSON to
`POST /tools/files/encoded/`, which uses the same shared storage service. Strict
encoding is limited to **256 KiB decoded**, **349528 base64 characters**, and a
**360 KiB JSON body** including metadata/escaping. Encoding overhead is 4×ceil(n/3).
Oversized, malformed or noncanonical encodings fail before publication. Do not
split a file into chunks through repeated uploads. `inspect_upload` accepts
`filename`, `sha256`, optional `note` and returns the same bounded inspection.

The upload tool is consequential and participates in the existing browser-document
write serialization. Pre-send cancellation is not started; cancellation/loss after
sending is uncertain with an `inspection` identity. Await the active write and
inspect deliberately. Upload grants no permission to save a note. There is no
local-path capability, remote URL fetch, credential extraction or remote MCP server.

**Host limits are not measured.** No supported staged-file reference contract or
actual assistant-host argument ceiling is available in this authorized local
session. The 256 KiB bound is a conservative application limit, not a claim that
every host can carry it. Hosts without WebMCP registration or crypto/base64 support,
or with a smaller argument ceiling, must report unsupported/too-large clearly;
the ordinary UI remains usable. Local tests use a controlled registration stub
with real local HTTP, which proves adapter/service integration, not host transfer.

## Postdeployment actual-host acceptance — OPEN

The private wiki hold forbids login/unlock/browser attempts and private reads.
Pepper first verifies immutable publication and owns deployment assignment.
After deployment, obtain separately authorized disposable wiki/fixture access:

1. Discover `upload_file` and `inspect_upload` through the real assistant host;
   record host/version, registration and its actual argument ceiling if exposed.
   Keep an unavailable host ceiling explicitly unknown.
2. Transfer one synthetic byte fixture via canonical base64 within both the
   application bound and the host's supported limit. Do not invent a local path
   or staging reference. Record the actual invocation/result.
3. Inspect the returned identity using the actual host, then download through the
   authenticated URL. Compare every byte, count and digest to the fixture. Confirm
   attachment disposition/no execution and unchanged note/draft.
4. Record any actual smaller host bound and an explicit unsupported/oversize result;
   do not infer transfer support from registration alone or retry uncertain writes.

This acceptance remains OPEN. Local synthetic evidence does not close issue 160.
