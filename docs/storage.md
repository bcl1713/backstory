# Confined storage and direct reads

The administrator configures an existing non-secret wiki-relative identity file
and its SHA-256 outside the wiki. Startup and every note/folder access read that
regular file with a hard 64 KiB cap. Missing, unreadable, excluded, oversized or
mismatching identity means unavailable storage. Backstory never creates the wiki,
repairs identity configuration or enrolls an empty directory. Login and the
signed-in shell/status remain available; `python manage.py storage_status`
reports only state, reason code and check time.

Wiki and application roots are canonicalized and must be disjoint. Files open
relative to pinned directory descriptors with Linux `O_NOFOLLOW` on every wiki
path component; regular-file checks reject devices, FIFOs and sockets. All hidden
components and `.backstory-tmp-*` siblings are excluded. Non-hidden default denies
include agent rule files (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `SKILL.md`),
agent/dependency directories, backup/sync internals, credential/secret/config/auth
files, token and key files, SSH credentials, and private-key/container suffixes.
The maintained list is in `wiki/policy.py`. `BACKSTORY_EXCLUSIONS` adds
comma-separated root-relative glob patterns or directory prefixes. No allowlist
can bypass these content denies. The future privileged formatting-config reader
uses a separate narrow purpose; hidden configuration is never browsable content.

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
wait for parsing, formatting or indexing. Identity checks cannot eliminate a
mount changing afterward, NFS caching, uncoordinated external edits, or blocking
filesystem calls. A hostile local actor who can replace the mount itself is
outside the supported boundary. Real NFS behavior is not established by local
disposable-fixture tests.
