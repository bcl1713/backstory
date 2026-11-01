# Raster image uploads

Baseline: b1dc978166fbae631e9f6ed51eed60a7531d1739. Branch:
`feat/image-uploads`.

## Scope and authority

Authenticated active Backstory users can upload PNG, JPEG and static WebP into
the existing root `assets` directory. Existing session, CSRF, exclusions,
readiness and no-follow rules apply. No CSP, account, permission or deployment
change. No new directory creation, arbitrary destination or file manager.

## Proposed API and validation

`POST /tools/images/?note=<existing-note.md>&filename=<original-name>` accepts
raw image bytes with the exact image Content-Type and standard X-CSRFToken
header. Raw bounded reads avoid multipart buffering before view validation.
Exactly two bounded query fields; validate original query encoding with the
shared policy. Strict basename spelling, bounded length, supported extension;
reject separators, controls, hidden/reserved names and ambiguous suffixes.
The original filename is display metadata only, never a destination path.

Read at most 8 MiB + 1 bytes. Require extension, MIME, magic and Pillow decoded
format agreement. Permit only PNG/JPEG/WebP decoders, verify then reopen/load;
max dimension 4096, max 16 million pixels, one frame, valid RGB/RGBA/grayscale
input. Reject malformed/truncated/animated images. Canonically re-encode to
remove metadata and trailing payload, with an independent 8 MiB output cap.
Pillow 13.0.0 is the maintained release verified from official PyPI metadata;
pin it with uv lock and test architecture availability before adopting.

## Storage and retries

Use `assets/upload-<sha256-of-canonical-bytes>.<canonical-extension>` and return
the digest, byte/dimension metadata, authenticated attachment URL and relative
Markdown destination computed from the actual existing note path. Use generated
ASCII filenames and an empty alt text placeholder, avoiding Markdown injection.
Authorize both note and destination. Require readable existing note and assets.

Under existing wiki_write_lock, pin assets descriptor, check parent identity,
stage in a reserved no-follow exclusive temporary file, fsync, then hard-link
exclusively to final name. Reuse staging registry/cleanup with corresponding
note lock so cleanup cannot race upload. Never replace an existing entry.
An existing regular file must match full bytes/digest and inode readback before
returning already_exists; symlink/special/different files fail closed. Verify
parent and final file after publication and fsync. Post-publication failures
return uncertain with no success claim; exact retry is safe and may confirm.

Bound managed uploads to 1000 files and 256 MiB total, counted under write lock
with a finite immediate-directory scan (maximum 10000 entries, otherwise refuse).
No recursion or cleanup of pre-existing assets. Successful assets persist even
if unused; operator may remove explicitly after verifying note references.
Only registered unfinished temporaries receive existing startup cleanup.

## Browser experience

An Upload image control opens an accessible dialog with file selection, format
and size help, explicit Upload button, status and returned Markdown. Upload
never changes the note. A separate Insert into draft action appends to the end only
if source/path still match the captured state; otherwise retain a
copyable Markdown result and ask the user to choose an insertion location.
No auto-save, replacement of selected content, silent retry or lost draft on
reauthentication/error. Closing restores focus; Escape works. Plain textarea
fallback supported; new unsaved notes initially require saving a path first.

## Verification plan

Write failing API tests first: valid upload/readback, auth/CSRF, malformed names,
all MIME/format disagreements, active formats, truncation, encoded/pixel limits,
animation, symlink parents/targets, exclusions, quotas, duplicate simultaneous
requests, staged failures/uncertain publication and relative nested-note paths.
Test generated Markdown through existing resolver and source fidelity.
Browser tests cover desktop/mobile keyboard selection/upload/explicit insert,
unchanged draft before insertion, stale draft/path/selection, auth and network
failure/retry, repeat uploads, focus restoration and visible pixel inspection.
Run full Python, Node, build and browser suites, independent review, publish
draft PR and verify required CI for exact final SHA. Parent coordinates merge.

## Publication gate

Issue #75 was created before implementation after authorized parent retry.
