# Storage marker implementation plan

**Goal:** Implement [issue #4](https://github.com/bcl1713/backstory/issues/4) on `feat/backstory-release-one`.

**Architecture:** Keep `BACKSTORY_IDENTITY_PATH` as the configured root filename,
with `.backstory-marker` as its default. A dedicated descriptor-relative,
read-only/no-follow open and fstat checks existence, readability and regular-file
type without reading contents. Central policy excludes the marker from all other
purposes. Maintenance removes only matching marker index rows (including FTS,
names, edges and queued work), preserving useful unrelated rows on storage loss.

**Constraints:** No live wiki/mount changes, marker enrollment or deployment.
Keep safe-save, conflict, draft and final readiness checks. Presence cannot prove
write permissions, share health or filesystem authenticity.

- [x] Add regression tests for hidden markers, contents never read, absence,
  unreadability, symlink/directory/FIFO rejection, policy and route exclusions,
  stale index cleanup, and loss/recovery. Run to confirm the old behavior fails.
- [x] Implement dedicated marker checks, central exclusions and targeted worker
  cleanup. Remove required hash and old size cap; preserve content revision hashes.
- [x] Update disposable fixtures and existing tests to use presence checks;
  preserve ordinary Home.md corpus coverage and update browser loss simulations.
- [x] Update all Compose examples and setup/storage/status/deployment guidance,
  including explicit owner-controlled migration from visible marker/hash.
- [x] Run Python, formatter, browser and configuration checks; review the diff
  against issue #4 and record results. Leave changes on the requested branch.

Verification: 692 Python tests, 21 formatter tests and 48 Chromium browser tests
passed. Django system and HTTPS production checks passed without marker/hash
configuration (using the default marker in disposable storage). Independent
read-only review found no actionable issues. No deployment or live wiki changes.
