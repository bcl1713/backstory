# Confined storage and direct reads

For the sequential Compose walkthrough, including an existing wiki rehearsal,
see [initial setup](setup.md). This page explains the underlying storage policy.

The administrator reserves a non-secret regular file in the wiki root. The
configured filename is `BACKSTORY_IDENTITY_PATH`, default `.backstory-marker`.
No `BACKSTORY_IDENTITY_SHA256` is required or used. Startup and readiness checks
open the marker read-only, relative to a pinned root descriptor with
`O_NOFOLLOW` and `O_NONBLOCK`, and check its regular-file type with `fstat`.
Contents are never read or hashed, and there is no marker content-size limit.
An empty file works. A missing or unreadable marker, directory, FIFO, socket,
device or symlink means unavailable storage (`marker_missing`,
`marker_unreadable` or `root_missing`). Only this exact root marker has the narrow
hidden-name exception; it cannot select a formatter configuration, credential,
sync file, agent rule or reserved transient file.

The marker is administrative metadata. All content purposes deny it, including
listings, indexing/search, links, previews, attachments, editing, formatting,
create/save, history and draft recovery. Policy is reapplied to stale indexed
hits and old recovery records. The worker removes matching index rows, FTS,
names, edges and queued jobs across generations, including during an outage;
it does not remove unrelated notes on an uncertain mount.

Backstory never creates the wiki or marker, modifies marker contents, repairs
configuration or enrolls an empty directory. Only the owner may deliberately
create/move/remove a live marker after verifying the intended mount; see
[migration](setup.md#migrate-from-a-visible-marker-and-hash). Login, status and
protected drafts for ordinary notes remain available during storage loss.
Keep the last useful index and drafts, withhold unavailable results, and refuse
writes and destructive scan reconciliation until readiness returns. Restoring
storage never replays a save: the user must compare revisions and save explicitly.
`python manage.py storage_status` reports state, reason code and check time;
`ready: marker_present` means the presence check passed.

Wiki and application roots are canonicalized and must be disjoint. Files open
relative to pinned directory descriptors with Linux `O_NOFOLLOW` on every wiki
path component; regular-file checks reject devices, FIFOs and sockets. All hidden
components and `.backstory-tmp-*` siblings are excluded. Non-hidden default denies
include agent rule files (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `SKILL.md`),
agent/dependency directories, backup/sync internals, credential/secret/config/auth
files, token and key files, SSH credentials, and private-key/container suffixes.
The maintained list is in `wiki/policy.py`. `BACKSTORY_EXCLUSIONS` adds
comma-separated root-relative glob patterns or directory prefixes. No allowlist
can bypass these content denies. The formatting-config reader uses a separate
narrow purpose for supported data configuration; hidden configuration is never
browsable content.

Paths arrive from Django already URL-decoded once. Literal percent sequences,
Unicode and `#` in filenames are preserved; their links are URL-quoted. The
original Gunicorn URI is checked for malformed percent escapes/UTF-8 before
content authorization without decoding the filesystem path a second time. Other
WSGI servers must preserve `RAW_URI` or `REQUEST_URI` to retain that distinction.
Traversal, empty path components, control characters, backslashes and malformed
Unicode are denied. Source reads are capped at 2 MiB and require valid UTF-8;
errors return fixed diagnostics, never partial editable source. Snapshots retain
exact original bytes, BOM, newline style and a quoted SHA-256 revision.

Folder requests enumerate one directory, never descendants: maximum 100 returned
entries and 1,000 inspected directory entries per page. Ordering follows the
filesystem. The process retains at most 32 iterators for 60 seconds; cursors
contain no filenames. Mutation, policy changes, expiry, a consumed cursor, or a
process restart requests a fresh listing (HTTP 409). No persistent tree cache or
whole-wiki request is used. Run one Gunicorn process with four threads (the image
default) so successive requests share the bounded cursor cache. Multiple
independent web processes require sticky routing or a different shared cursor
strategy. This does not remove the need for shared cross-process save locks.

Authenticated responses use `Cache-Control: no-store`. Direct source reads never
wait for parsing, formatting or indexing. Marker presence does not prove write permissions, share health or a uniquely
authenticated filesystem. Checks cannot eliminate a
mount changing afterward, NFS caching, uncoordinated external edits, or blocking
filesystem calls. A hostile local actor who can replace the mount itself is
outside the supported boundary. Real NFS behavior is not established by local
disposable-fixture tests.
