# Arbitrary attachment uploads — issue 160

Canonical acceptance: https://github.com/bcl1713/backstory/issues/160, live read
2026-11-19, updated 2026-11-09T17:25:45Z, zero comments. All issue requirements
apply. Brian's enrollment authorization supersedes filing-only text. Synthetic
storage only; private-wiki access remains held. Actual assistant-host acceptance
after deployment remains OPEN and cannot be established by a registration stub.

## Intent and approach

Upload arbitrary exact bytes to the existing root assets directory without a
saved note, then explicitly copy a link or insert into a draft. Keep the existing
validated raster flow. Reusing raster decoding would destroy bytes; retaining
arbitrary suffixes would confuse note/config and inline delivery. Instead use a
separate opaque attachment identifier and the existing authorization, locks,
readiness, no-follow IO and exclusive publication conventions. This is the
implementer's supported choice under the user's no-readiness-stop direction.

## Storage contract

Use `assets/file-<sha256>-<base64url UTF-8 display name>.attachment`. Accept
nonempty names up to 120 UTF-8 bytes, including Unicode/punctuation and reserved
original names; reject separators, controls and malformed Unicode. No name is a
path or suffix. The longest component is 241 bytes. The reversible bounded name
allows safe original download names without an unbounded metadata store.
Same name/content deduplicates after exact readback; different names or bytes
have different identities. Existing conflicting identities fail without overwrite.

Raw UI API: POST `/tools/files/?filename=...&sha256=...` with optional authorized
existing Markdown `note`; body is octet-stream. Client computes the digest before
sending, retaining a status identity even after cancellation/lost response.
GET `/tools/files/inspect/` accepts the same bounded identity and optional note;
no directory enumeration or body return. Reports confirmed, absent, conflict or
unavailable, with bounded hash readback. Upload reports created/already_exists/
uncertain, authoritative flag, path, href, original_filename, bytes, sha256 and
ordinary safely escaped Markdown. No automatic retries or asset deletion.

Chosen initial limits: 8 MiB/file (also lowered by attachment download setting),
256 MiB managed assets, 1000 managed files, 10000 examined directory entries;
count both raster and attachment managed names. One receiver per wiki using
nonblocking cooperative lock. Read/write/hash in 64 KiB chunks with a 30-second
receive budget and finite blocking-read transport timeout in supported runtime.
Enforce byte and quota bounds while streaming, independent of Content-Length.
Stage registered temporary siblings, fsync and link exclusively under wiki-write,
per-path and receiver locks; clean only registered incomplete staging. Verify
identity/bytes and readiness before authoritative acknowledgement. External
noncooperating filesystem races remain documented, never presented as FS CAS.

Attachments always download with octet-stream, safe original Content-Disposition,
nosniff, private/no-store; opaque suffix prevents note indexing, editing and inline
preview on every existing route. Existing raster/PDF behavior stays available for
ordinary existing assets and validated image uploads.

## UI and assistant contract

Discoverable Upload file on shell and persistent note controls, responsive modal,
pending/progress, cancellation, failure/quota and uncertain states. Upload works
without note. Explicit Copy link and Insert into draft; no saves. Insertion uses
the captured selection, one undo transaction, exact source/path and composition
guards; stale navigation/draft disables insertion. Keep result/status identity
after dismissal and do not enable blind retry after uncertain publication.

WebMCP `upload_file` is consequential and shares existing document write
serialization; `inspect_upload` is read-only. Strict base64 transport: at most
256 KiB decoded / 349528 base64 characters, a conservative application bound,
not a measured host limit. No invented local path, remote fetch, credentials or
new remote MCP server. The actual host's argument limit is currently unavailable;
unsupported/too-small hosts must fail clearly and ordinary file UI stays usable.
Cancellation after sending is uncertain with retained inspect identity; no replay.

## Verification and delivery

First vertical slice: RED backend exact-byte upload/download, GREEN service and
early real local desktop/mobile UI journey on synthetic files. Then representative
PDF/ZIP/audio/video/text/source/SVG/HTML/unknown/extensionless/empty round trips,
escaped nested links, draft/selection/undo and reachable explicit issue boundaries
(session/CSRF/recovery/no-follow/replacement/quota/length/concurrency/uncertainty).
Reuse relevant raster coverage. No equivalent adversarial permutation campaign.
Distinct fresh-context exact final-source/candidate review must retain its own
verdict and UI/test evidence. Real PR → two-parent local candidate → eight-stage
gate → exact leased land → manual AMD64 dev publication, under unchanged trusted
runtime, no hosted Actions. Pepper owns publication verification and deployment
assignment. Do not close issue: actual-host discovery/upload/download stays OPEN.
