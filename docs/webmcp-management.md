# Guarded WebMCP management

The browser tools use the existing active session, path policy, no-follow storage,
CSRF, readiness and cooperative writer locks. All returned text is untrusted.
Nothing here authorizes a bulk cleanup or treats graph isolation as permission to
remove a note. See [browser tools](webmcp.md) for general transport rules.

## Find the source of incomplete graph evidence

`get_index_diagnostics({folder?, limit?, cursor?})` reads
`/tools/index-diagnostics/`. It selects only eligible maintained indexed records
with parsing limitations, pending relation work or incomplete relation evidence.
Each item has canonical `path`/`href`, indexed `source_revision`, fixed
`diagnostic_codes`, `parsing_complete`, `pending` and `resolution_complete`.
It reads the diagnostic JSON key and safe file metadata, never note bodies,
full YAML metadata, arbitrary exception text or an entire wiki export.

Unknown stored codes become `index_diagnostic_unknown`. A parser failure can also
make resolution incomplete on the same note; two counters do not mean two notes
or independent failures. `relation_evidence_incomplete` identifies unresolved
published evidence when parsing itself was complete; it does not disclose a link
target or prove that a link is missing. Read the specific note authoritatively
before proposing a separately authorized repair. Normal saves/reconciliation
schedule indexing; diagnostic reads never repair content or suppress warnings.

Pages examine at most 300 indexed candidates and return 1–100 eligible items
(default 30). Follow signed continuations even after empty pages. Cursors bind the
full query, session authorization scope, generation, mutation, relation publication
and path policy; expired/incompatible cursors require a fresh enumeration.
`enumeration_complete` concerns exhausting this diagnostic selection only.
It never upgrades `projection_complete`, and incomplete graph evidence remains
inconclusive about absence, disconnected components or directed reachability.
Changed, excluded, missing or symlink sources are withheld, never disclosed as
current authoritative records. A quota/query-budget failure is explicit.

## Review and commit a move, rename or archive

1. `preview_move({source, destination})` queues an actor-owned preview and
   returns HTTP 202 with `state=preparing`, a durable `operation_id`,
   `next_action=get_move` and `poll_after_ms`. Retain that ID. Both paths are exact
   root-relative names; the destination parent must exist. This request performs
   bounded preflight only, so whole-wiki planning does not have to fit inside a
   browser-host evaluation deadline. It does not move content.
2. Deliberately inspect `get_move({operation_id})` after the suggested delay.
   Preparation runs in the separately supervised application worker. GET never
   starts or resumes planning, and remains inspectable while that worker plans.
   While `state=preparing`, no review token or partial inventory is available.
   Do not reissue `preview_move` to poll.
3. When `state=preview`, review the entire `inventory`, affected-link
   `changes`/diffs and `affected_paths`. The public review is bounded to 512 KiB;
   larger plans fail closed and cannot be committed through this adapter. No
   recovery bytes or filesystem witnesses are returned. The completed plan uses
   exactly the same operation ID as its preparation handle. A deliberate archive
   destination is a reviewed move, never an inferred copy/delete rewrite.
4. After explicit authorization, call `commit_move({operation_id, review_token})`.
   The signed token binds actor, operation, policy and the complete public review.
   The domain writer still revalidates filesystem/revision witnesses, collisions
   and plan age. Preparing/failed jobs cannot commit; receiving a token is not
   user authorization.
5. Inspect `get_move` after uncertainty. `rollback_move({operation_id})` explicitly
   cancels queued/running preparation or a ready preview, or rolls back interrupted
   recovery through the existing guarded service. Cancellation during planning
   cannot be overwritten by publication of a ready plan. It is not an arbitrary
   undo of a completed move.

Preparation failures remain inspectable as `preview_failed` with a fixed reason
code and no commit token. Changed source/storage context, policy, expiry,
quota/capacity and interrupted preparation fail closed. A worker crash does not
automatically replay planning or any content mutation. Cancellation of preparation
acknowledges its journal state, without claiming a source-content readback.

The production supervisor already runs the worker. A development installation
using only `manage.py runserver` must also run `manage.py run_indexer` for queued
previews to progress. A waiting preview is not permission to increase request
timeouts, replay a write or bypass the worker's guards. The existing ordinary UI
and Python domain preview remain synchronous; these preparation states describe
the WebMCP response lifecycle.

Previews expire after 30 minutes. Recovery journals pause ordinary writes.
Completion includes authoritative note readback, or verified directory identity,
with index lag separate. A lost/malformed acknowledgement is `uncertain` and
retains the operation handle when known. Never automatically replay commit or
rollback. Re-read changed sources before deciding what to do next.

The browser inspects the current affected paths before sending a mutation. It
protects an open editor containing a rewritten incoming link, as well as new
unsaved children under moved folders. Save/Format/Restore/draft-storage actions
are held while the affected mutation runs; typing remains possible. Completion
checks source synchronization without changing navigation or discarding drafts.
Other documents and filesystem writers require server witnesses and revisions;
the document guard is not a cross-tab lock.

## Read history and restore a revision

`list_note_history({path, limit?, cursor?})` returns retained local backup metadata
without bodies or account identifiers. The page limit is 1–100 (default 30), and
signed continuations bind actor, path, policy and history membership. Retention,
relocation or new backups can invalidate them. This is application backup history,
not a promise to capture every external writer's intermediate edit.

`read_note_revision({revision_id})` returns that selected revision's complete
original source, BOM/newline information, path and raw-byte revision. Historical
text is non-authoritative for current disk and never permission to restore.

After comparison and authorization, use
`restore_note_revision({path, revision_id, revision})`, where `revision` is the
current strong `read_note` revision. The explicit path is required so a concurrent
relocation cannot change the browser's guarded target. The existing history
restore and writer revalidate the revision record/path under the write lock,
retain required backups, preserve exact original bytes and use their existing
history restoration grant. Arbitrary new source cannot select that grant.
Missing notes are not implicitly recreated by history restore. Success is
`saved_source`, `saved_source_index_delayed` or `noop` after authoritative readback.
After uncertainty, read the current note before any deliberate retry.

## Recoverably remove one note or one empty folder

The removal service retains an actor-owned durable database journal and exact
original note bytes. It exposes no permanent purge or recursive deletion.
An existing folder's creator is not inferred; removal still needs explicit user
authorization, even when the folder is empty.

1. Read a note, then call `preview_removal({path, kind: "note", revision})` with
   its exact strong revision. For one ordinary empty folder use
   `preview_removal({path, kind: "folder"})`, omitting revision.
2. Review the returned operation/path/kind and authorize that exact removal.
   `commit_removal({operation_id})` revalidates the note's bytes and identity, or
   the folder's identity and emptiness. It persists intent before unlink/rmdir,
   and verifies absence/durability afterward. Stale notes, symlinks, hardlinked
   notes, protected paths, missing parents or nonempty folders are refused.
3. Inspect `get_removal({operation_id})` after uncertainty. Inspection never
   replays deletion or restoration. `removed` is authoritative only when current
   absence was verified; a new colliding entry is not claimed as this operation's.
4. `restore_removal({operation_id})` explicitly restores to the original absent
   path. Existing destinations conflict even when bytes are identical. Staged
   inode ownership and exact bytes are verified before exclusive publication;
   BOM and ordinary permission bits are preserved. Missing parents are never
   created implicitly.

A preview expires after 30 minutes. Restoring a preview cancels it without a wiki
mutation. In-progress/crashed writes report `recovery_required` and pause other
writes until explicitly recovered. Failed terminal database acknowledgement can
return `uncertain` with an operation handle even after filesystem publication.
Never interpret that as safe-to-retry or automatically resume it.

To undo note-and-folder cleanup, restore the parent folder first, then the note.
A changed parent inode is accepted only through a completed same-actor folder
restoration journal proving the exact old and new identities and unchanged
storage marker/root/policy. An unrelated replacement folder is not adopted.
If a parent was separately relocated, deliberately restore its original path
through the relocation workflow first; removal journals do not silently retarget.

Removal previews/recovery material, history/drafts and move journals share
`BACKSTORY_REVISION_QUOTA_BYTES`. At most 1,024 removal journals can be retained.
Removal bytes/journals are **not** automatically pruned, including cancelled or
restored previews. Cleanup removes wiki fixture entries, not audit/history
residue or retained recovery material. Quota/capacity exhaustion fails closed;
there is no casual purge shortcut to make a mutation test appear residue-free.

## Operator recovery for an unowned reserved stage

Filesystem creation and a database inode-proof update are not one transaction.
A crash after creating a random `.backstory-tmp-*` stage but before its identity
is durably recorded can leave an entry that cannot be proven owned. Restoration
refuses to adopt or delete it and keeps original bytes plus the recovery pause.
An equal byte sequence alone is not ownership proof.

The safe exceptional procedure is a deliberate storage-operator action:

1. Stop web/index workers and take consistent backups of the wiki and application
   database. Retain the removal UUID, actor, original path, state and plan. Inspect
   those records privately; never paste private source or database contents into
   logs or a public issue.
2. Verify the configured root, marker and parent identities against the journal,
   and inspect the exact reserved stage without following symlinks. Also verify
   that the final live target is absent or still independently protected. Do not
   edit journal state, claim an unknown inode, or overwrite an existing target.
3. If the operator explicitly authorizes moving that **unknown** entry, preserve
   it in a new private quarantine on the same filesystem using a no-overwrite
   rename. Record the operation UUID, old/new locations and filesystem identity
   in private recovery evidence. Keep it intact; do not recursively delete it or
   assume it is disposable merely because its name resembles a stage. If its
   identity, kind, children or storage relationship is unclear, stop for storage
   investigation instead of manufacturing ownership proof.
4. With the reserved name now absent and the original storage context intact,
   restart services and deliberately call `restore_removal` for the retained UUID.
   The service creates a new owned stage and verifies publication. Inspect the
   final result; ordinary writes resume only after all recovery journals resolve.
   Keep the quarantined entry and backups until separately reviewed retention
   work authorizes their disposition.

External non-cooperating filesystem writers can still replace names/ancestors
between final checks and publication. Cooperative locks, exclusive restore,
identity checks and readback narrow this residual race; they do not provide a
filesystem compare-and-swap or establish permanent future ownership.

## Acceptance and issue status

The #148 follow-up verified deployed creation/snapshot registration, depth eight,
independent readiness and all nine prior read tools on build `00a9e305`. It did
not test actual creation or identify/repair the private incomplete source.
The diagnostic tool now enables targeted investigation without a whole-wiki read.
No private live wiki was changed while implementing this work.

Local tests use real HTTP/domain/storage/editor services with a controlled
`document.modelContext` registration stub. They cover a synthetic
create/read/edit/history-restore/remove/parent-remove/parent-restore/note-restore
cycle, final wiki fixture cleanup, draft protection, collisions and uncertainty.
These establish application behavior, not actual assistant-host invocation.

#106's implementation was delivered by #149. Its remaining acceptance is an
actual-host synthetic create/read/edit cycle, now with an explicit recoverable
cleanup route. After deploying this follow-up, a compatible attached assistant
host can run that deliberately authorized fixture lifecycle and record discovery,
source/revision readback and cleanup. Do not close it by claiming that registration
alone proves creation worked. Repeat affected #148 diagnostic/management smoke
tests on that host before claiming live acceptance or a repaired private source.
