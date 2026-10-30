# Move, rename and archive

Choose **Move / Rename this note** in a note's controls, or **Move / Rename this
folder** in a folder listing. The main navigation also opens the move form.
Enter the complete root-relative destination path. Renaming changes the last
component; archival is an ordinary move, for example:

`01-Projects/sample-project` → `04-Archives/01-Projects/sample-project`

The destination parent must already exist. The feature does not create folders
implicitly. The wiki root, administrative files and folders containing protected
or unsupported descendants cannot be moved. Empty folders are supported; a
single file must keep a Markdown extension. Directory/filename case and path
policy remain significant.

**Preview move** inventories the source and shows exact link diffs across the
eligible wiki, including navigation notes. It repairs actual wikilink, Markdown,
reference and image destinations; aliases, raw fragments, front matter, BOM,
line endings and unrelated text are preserved. Relative outgoing asset links and
links within the moved tree are included. IDs and available revision/draft
associations follow the move, including history for missing descendants.
Relocation does not rearrange Active/Archived headings or make editorial edits.

Missing/ambiguous links retain their unresolved meaning. A new path that would
silently resolve or shadow unrelated links blocks the preview. Unsupported
required source rewrites and incomplete link extraction also block the move.
The preview uses a fresh bounded inventory rather than assuming the search index
is current. It stops after 10,000 eligible entries or 64 MiB of note/source-asset
bytes; it never silently continues with an incomplete tree. Unreadable notes,
symlinks/special entries in the moved tree and multiply linked source files also
block it. Outside protected folders are excluded, not read.

Confirm only after reviewing the inventory and diffs. Preview creates no wiki
files. Confirmation revalidates the eligible namespace, file identities,
revisions, destination absence, policy and relevant history. A preview expires
after 30 minutes. Changes require a new preview; destinations are never replaced.
A Linux no-clobber rename is required. Filesystems lacking that operation fail
with recovery available; there is no copy/delete fallback.

## Incomplete link inventory

If Markdown projection fails, preview reports `incomplete_link_inventory` and
identifies the first failing eligible note by its wiki-relative path, the parsing
phase, and a stable reason. A note outside the moved folder can block the preview
because its links also need to be inventoried. No move or link edits occur.

`link_structure_limit` means the note exceeded the supported link-structure
budget; `projection_recursion_limit` means parsing exceeded its recursion limit.
`projection_parse_failed` means the underlying cause is not yet known. Inspect
the identified note and resolve the parsing problem, then request a new preview;
additional failures may appear next. Diagnostics never include source text or
raw exception messages. Protected notes remain excluded.

This inventory reads wiki files directly. Waiting for or rebuilding the search
index does not resolve a parse refusal; corrected source is picked up by the
next preview without an index rebuild. Other inventory refusals, such as scan
budgets or unreadable files, retain their own reason codes.

## Drafts and other editor tabs

A note with unsaved changes blocks its move entry point and retains its source
and undo history. Save changes, or preserve the draft and explicitly reload,
before moving it. A move from another tab never replaces an editor's in-memory
source. Saving from that old revision/path is rejected, with the existing
base/current/draft comparison and copy/download tools. Compare with the
relocated note before explicitly saving. Creating a fresh note updates its move
link to the new canonical path.

## Interrupted operations

The operation page reports `preview`, `applying`, `completed`,
`recovery_required`, or `cancelled`. A journal in the protected application
database records the actor and exact original/replacement bytes before mutation.
Required revision backups must succeed before the rename. Application saves,
formatting, drafts and other moves share a write lock; new writes pause while
an operation needs recovery. Reads, copy/download and existing in-memory drafts
remain available. Use the account that started the operation to recover it.

Open **Move / Rename** or **Storage status** to find an interrupted operation.
**Resume move** verifies the full reviewed namespace and allowed intermediate
byte states, skips steps already applied, and completes the remaining changes.
**Roll back move** reverses only verified link changes and returns the original
tree using another no-clobber rename. An interrupted rollback resumes in the
rollback direction. New/changed descendants, unrelated destination content or
third-party edits cause a recovery conflict instead of an overwrite. Conflicting
eligible paths are shown where available; the reviewed diffs and inventory stay
accessible. Preserve and reconcile external edits before explicitly resuming.
Protected descendants remain blocked even during rollback.

A filesystem rename, multiple link replacements, history migration and index
scheduling cannot be one atomic transaction. Original bytes remain in the journal
until completion/cancellation; successful operations retain a compact receipt and
normal revision history. Retrying the same operation is idempotent. Terminal
receipts expire after 30 days; expired IDs return not-found and perform no move.
Abandoned previews are pruned after one hour. Pending recovery journals never
expire automatically. Journal JSON has a separate logical budget equal to
`BACKSTORY_REVISION_QUOTA_BYTES` (default 64 MiB); normal revision/draft quota
checks still apply independently. This is not a physical SQLite disk quota.

Application locks do not coordinate arbitrary external editors or filesystem
administrators. Descriptor-relative no-follow access, immediate checks and exact
byte verification narrow races; they do not create atomic filesystem CAS or
promise safety against an actor replacing the mount. See [storage](storage.md).

## Discovery after a move

Folder listings open the final paths immediately. A completed move schedules a
verification scan for search, indexed names and link discovery. `pending` means
scheduled; inspect the current index state on **Storage status**. Scheduling
failure is reported separately from filesystem success; use **Refresh index**
or **Rebuild index** after resolving the index problem. A lost response is not
permission to start a second move: reopen the operation URL and inspect its
recorded state first.

### Concurrent database writers

Relocation's backup/quota transaction and final history-association transaction
reserve SQLite write intent before reading dependent rows. Session renewal and
background index connections do not share wiki filesystem locks; a deferred
read-to-write upgrade could otherwise fail immediately with `SQLITE_BUSY_SNAPSHOT`
after another writer commits. Both reservations are short database-only sections:
reviewed source revalidation remains before backup preparation, and actual rename,
byte publication and filesystem sync remain outside the database transactions.

This does not eliminate every possible busy/database failure. Existing bounded
SQLite waits, explicit uncertain outcomes and journal-based recovery remain; the
application does not blindly retry a filesystem move. If the start transaction
cannot acquire its writer, the persisted preview and source bytes remain unchanged.
Inspect the operation before an explicit retry. Final-transaction failure still
uses the existing durable recovery journal rather than repeating backups or
unconditionally replaying file writes.

Disposable two-connection regressions cover a real competing session-table update
at each transaction's first history read, successful byte/journal convergence and
idempotent subsequent calls. They establish the race and the narrow fix, not the
unretained exception behind any specific historical CI or production request.

### Orphan staging cleanup and inventory

Relocation-owned cleanup removes registered orphan staging siblings under the
wiki-write lock before
preview captures the namespace and before confirmation revalidates it. Although
staging filenames are excluded, removing one changes its parent directory's
metadata. Cleanup must not occur between successful plan validation and the
pre-rename namespace check.

An older preview whose directory witnesses changed still requires a new preview;
the application never substitutes fresh witnesses into a reviewed plan. Resumed
operations and rollback retain guarded staging cleanup before recovery validation.
Real source or namespace changes still stop a move. Pre-rename conflicts identify
up to 20 currently authorized relative paths when available; a root-only change
may retain the generic conflict rather than exposing internal or protected paths.

Concurrent startup or maintenance cleanup can still cause a conservative stale
preview or recovery conflict; it does not bypass namespace verification.
