# Preview quota concurrency implementation plan

**Goal:** Prevent a concurrent session/index writer from invalidating move/removal preview quota transactions between their initial reads and journal INSERT.

**Design:** Follow the existing relocation commit/queue pattern: reserve SQLite's writer with a no-op UPDATE on the prospective journal UUID before any reads in the short quota transaction. Keep the filesystem scan and link planning before this transaction, and preserve wiki-write/revision-quota locks, capacity/quota checks, durable journal creation and explicit commit. The UPDATE normally matches zero rows but obtains write intent; never use an ORM-empty queryset, which would omit SQL. Real pre-existing writer contention remains a bounded unavailable result. Do not globally change database modes, deadlines, retry mutations or relax inventories.

**Evidence:** On deployed source c21262b, the new real file-backed SQLite WAL regression injects a session update after the first quota read. Move preview fails on INSERT with OperationalError; removal preview returns removal_unavailable. Exact live error cause remains unknown; native UI now independently observed move_storage_unavailable, so transport-only diagnosis was insufficient.

**Implementation:**
- [x] Cover move, note-removal and folder-removal previews against a second real SQLite session writer; include WAL snapshot invalidation and rollback-journal writer contention.
- [x] Construct move journal object before its quota transaction; reserve writer on its UUID, then quota-check and force INSERT. Reserve removal writer before its initial capacity query.
- [x] Run focused concurrency + removal + management/relocation integration checks. Keep unchanged prior UI evidence; no interface/asset changes.
- [ ] Retain independent code/candidate review; prepare exact proposed merge, run required candidate gate once, atomic-land that SHA and publish using its receipt.
- [ ] Record actual checks and release identity; request bounded live move/archive/fixture-cleanup acceptance on the published version. Do not close #148 based only on a synthetic reproduction.

**Validation:** Passing focused tests establish that a second connection cannot take write ownership between quota reads and journal publication, and that normal explicit lifecycle/recovery checks still work. They do not establish live TrueNAS cause or native-host transport acceptance.
