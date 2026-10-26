# Open-note Synchronization Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Safely keep the open editor current with external note changes.

**Architecture:** Reuse authoritative read snapshots and conditional saves. A pure
bounded line diff supports safe three-way merging and precise editor updates.
A synchronization controller owns polling and stale-response checks; existing
note actions own base adoption, conflict review and operation guards.

**Tech Stack:** JavaScript, CodeMirror 6, Django's existing read endpoint, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-26-open-note-sync-design.md`

## Global Constraints

- Work against `dev`, in the separate `/tmp/backstory-issue-16` checkout.
- Synthetic notes only; never implicitly save/publish a merged draft.
- Keep conditional saves, source fidelity, recovery, and guarded tool writes.
- Failed reads never represent an empty source.

## Review Focus

- Pending source reads must not apply across an intervening Save or tool write.
- A conflict action must not discard typing or adopt an outdated comparison.
- Undo restores text without restoring stale revision bookkeeping.
- BOM and mixed newline metadata must remain consistent after adoption.
- Historical revision previews must retain their intentional snapshot.

### Task 1: Bounded source diff and merge

**Files:** `static/src/source-merge.js`, `tests/formatter/source-merge.test.mjs`.
**Interfaces:** `sourceChanges(before, after)` returns `{from,to,insert}[]`;
`mergeSources(base, local, external)` returns merged string or `null` on conflict.

- [x] Write literal cases for disjoint edits, insertions/deletions, identical and
  overlapping edits, mixed endings/Unicode, and a large bounded-work fallback.
- [x] Run `node --test tests/formatter/source-merge.test.mjs`; observe failure.
- [x] Implement bounded Myers line alignment with exact source offsets and conservative overlap.
- [x] Rerun the merge tests; expect all pass.

### Task 2: Synchronize the editor and conflict review

**Files:** `static/src/note-sync.js`, `static/src/navigation.js`,
`static/src/editor.js`, `wiki/templates/wiki/note.html`,
`tests/browser/note-sync.spec.js`, `tests/browser/wiki-tools.spec.js`.
**Interfaces:** `mountNoteActions` owns current base and busy state;
`editor.applyExternalSource(source)` maps selection and preserves scrolling;
controller callbacks read state and adopt a confirmed snapshot synchronously.

- [x] Add browser acceptance tests before implementation; observe clean-refresh
  and disjoint-merge failures against existing behavior.
- [x] Implement serialized polling/focus checks, operation epochs, authoritative
  snapshot validation, conflict/read-failure UI, and guarded fresh-read actions.
- [x] Add precise editor update transactions and fallback selection preservation.
- [x] Update the old tool-save stale-view test to assert safe refresh instead.
- [x] Run focused browser tests including deferred reads, newest comparison,
  deletion/outage/auth, tool writes, source fidelity, cursor/undo/scroll.

### Task 3: Verify and prepare the pull request

**Files:** generated `static/editor.js`, `docs/editor.md`, `docs/webmcp.md` if applicable.

- [x] Document synchronization and undo/recovery semantics; rebuild assets.
- [x] Run `pytest`, `npm run test:formatter`, and the full browser suite.
- [x] Review diff for races, accidental overwrites, and operation coordination.
- [x] Commit and push the feature branch; open a PR targeting `dev`, referencing #16.
