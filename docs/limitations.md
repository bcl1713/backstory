# Filesystem and save limitations

Notes remain ordinary UTF-8 files. Opening, previewing, changing editor modes and
indexing do not rewrite them. Existing BOMs survive edits, and explicit source
recovery preserves the submitted newline sequence. Formatting is an explicit
transformation governed by approved configuration; it does not serialize parsed
front matter. New notes start without a BOM and use the editor's LF default.
The administrator's configured storage identity file cannot be edited through
Backstory. Revalidate that file outside the application after an intentional
administrator change.

Every changed save first stores exact original bytes and submitted UTF-8 source
in the protected local application SQLite database. The default revision quota
is 64 MiB (`BACKSTORY_REVISION_QUOTA_BYTES`) and retention is 30 days
(`BACKSTORY_REVISION_RETENTION_DAYS`); expired entries are pruned on changed saves.
Insufficient quota or backup I/O refuses the write. Keep the application data
directory private and back it up consistently with SQLite's backup API or while
stopped. Formatting recovery grants expire after 30 minutes and bind the actor,
path, original revision, draft digest and diagnostics. Grants never refresh a
stale base or bypass storage/path/size/backup protections.

Writes use a uniquely named `.backstory-tmp-` sibling, fsync its contents, and
publish within the same directory. The application syncs the directory after
publication. These reserved hidden names cannot be served as content. A bounded
registry outside the wiki supports startup cleanup without recursively scanning
the wiki; active application writers are skipped. Cleanup failures do not turn a
confirmed publication into a failed save; retain the registry for the next
startup. Missing parent folders are never automatically created. Create requires
an exclusive hard link and refuses filesystems that cannot support this strategy;
there is no overwrite fallback. Existing files retain their basic permission bits.
New notes use private mode 0600 (further restricted by the process umask). Configure
compatible UID/group access deliberately if external editors need new-note access;
Backstory does not change live ownership or permissions for that purpose.

Replacement creates a new inode, with the application's ownership and filesystem
default ACLs. Existing ownership, ACLs, extended attributes, hard links and other
inode metadata are not copied. Open handles may continue reading the previous
inode. No-op saves preserve the file inode, mtime and revision history. Per-path
application locks coordinate Backstory web processes only. Fresh byte hashes and
pinned directory checks reduce races but cannot provide atomic compare-and-swap
against external editors that ignore these locks. A writer can change a file in
the final hash-to-replace interval. Hostile local users able to replace the mount
itself are outside the supported trust boundary.

A successful local test does not establish TrueNAS/NFS durability, cache behavior,
mount stability or visibility across clients. The read-only identity check is a
readiness signal, not proof against a mount changing immediately afterward.
Actual filesystem operations can fail after it succeeds. A hung NFS syscall may
require mount/operator intervention; a request timeout cannot safely cancel it.
When publication has an uncertain acknowledgement, Backstory re-reads disk and
reports the observed revision or uncertainty without retrying the write. If bytes
match the staged candidate but directory durability cannot be confirmed, save
success includes a durability warning. No failed draft is replayed automatically.

Until the persistent indexing queue is installed, changed disk saves report
`saved_index_delayed` (or `saved_source_index_delayed`). The `enqueue_note(path,
revision)` boundary may fail without turning a completed disk save into failure.
Discovery is not yet available; known notes can still open/save directly.
