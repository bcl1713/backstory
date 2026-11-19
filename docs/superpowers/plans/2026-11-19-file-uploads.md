# Arbitrary attachment uploads Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Exact arbitrary-byte uploads and explicit draft links through UI and WebMCP.

**Architecture:** Separate attachment service with opaque identities, shared by raw
and bounded encoded APIs. Existing authentication, filesystem locking, download
and editor services remain the integration points.

**Tech Stack:** Django/Python 3.14, browser JavaScript/CodeMirror, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-19-file-uploads-design.md`

## Global Constraints

- Synthetic fixtures only; no private wiki access; actual-host acceptance OPEN.
- 8 MiB/file, 256 MiB managed storage, 1000 files, 10000 scan entries, 64 KiB chunks, 30-second receive budget.
- 120 UTF-8 byte display names; opaque `.attachment` storage; no overwrite/delete/import.
- WebMCP 256 KiB decoded / 349528 encoded characters; host limit unknown.
- Node 22.23.4, uv 0.12.19, `/usr/bin/python3.14`; task caches and retained Docker route only.
- Exact tested two-parent candidate and independent review before AMD64 dev publication.

## Review Focus

- Lost acknowledgement: retained digest/name must support inspection without replay.
- Nested punctuation/Unicode links: ordinary links resolve without source corruption.
- Misleading/reserved original names: downloads never become notes/config/inline content.
- Selection, undo and navigation during upload: only explicit guarded insertion edits draft.
- Streaming and quota races: reachable concurrent uploads cannot overwrite or exceed bounds.

### Task 1: Shared backend and early UI vertical slice

**Files:** create `wiki/file_uploads.py`, `tests/integration/test_file_uploads.py`,
`static/src/file-upload.js`, `wiki/templates/wiki/file-upload.html`,
`tests/browser/file-upload.spec.js`; modify `wiki/tool_urls.py`,
`wiki/attachments.py`, `static/src/editor.js`, `static/src/shell.js`, shell/note templates and CSS.

**Interfaces:** `upload_file(request)` raw POST and `inspect_upload(request)` GET;
`mountFileUpload({editor,getPath})` accepts optional guarded editor adapter.

- [x] Write `test_exact_upload_download_without_note` asserting byte/digest/name/path and safe delivery; run RED existing baseline.
- [x] Implement bounded streaming, opaque identity, exclusive publish/readback, inspection and download name.
- [x] Write browser normal upload/download and explicit insertion tests, run RED, implement accessible UI and selection adapter.
- [x] Run focused Python and early real local desktop/mobile UI; inspect screenshots.
- [ ] Commit the vertical slice and ledger exact commands/state/results.

### Task 2: Explicit issue boundaries and WebMCP parity

**Files:** extend backend/browser tests; modify `static/src/wiki-tools.js`,
`tests/formatter/wiki-tools.test.mjs`; update shared service as evidence requires.

**Interfaces:** `upload_file` JSON encoded endpoint delegates same service;
`inspect_upload` uses name/digest, optional note; outputs untrusted identity metadata.

- [x] Add focused REDs for representative file round trips, nested escaped links,
  auth/CSRF/recovery, no-follow/special files/parent replacement, size/quota/length,
  concurrency, cancellation and lost acknowledgement. Group tests by consequence.
- [x] Implement missing required boundaries; retain existing raster path coverage.
- [x] Add WebMCP upload/inspection definitions, strict bounded base64 validation,
  shared document serialization and retained inspect identity on uncertainty.
- [x] Run affected Python, formatter adapter and UI draft/selection/undo/cancellation checks; record results.
- [ ] Document limits, original names, retention, transport constraints and exact OPEN host acceptance steps; commit.

### Task 3: Review, exact candidate gate and dev publication

**Files:** task run evidence/ledger/review records, release assets outside source.

**Interfaces:** repository `local_candidate.py prepare/test/land`; `local_release.py --receipt --channel dev --assets --publish`.

- [ ] Inspect fresh Actions settings/triggers/active runs/protections before push/merge; preserve disabled Actions.
- [ ] Commit final source, push feature and create ordinary PR referencing issue160 without closure keywords.
- [ ] Prepare real two-parent candidate; run configured eight-stage gate exactly once unless changed inputs/failure justify more.
- [ ] Dispatch distinct fresh-context reviewer with required TDD skill, canonical spec, exact candidate source/tree/parents, focused evidence and UI screenshots. Retain actual reviewer-authored verdict.
- [ ] Resolve material findings with focused RED/GREEN and distinct final-byte coverage; no new general hunt.
- [ ] Land exact reviewed/tested candidate using atomic leases, manual local AMD64 dev publish with valid receipt; reconcile any partial effects before retry.
- [ ] Retain immutable image/version/source/platform/aliases/release/assets/checksums and return substantive result to Pepper. Host acceptance remains OPEN; no production or issue closure.

Execution hold: first checkpoint `git add` failed with read-only canonical Git
worktree index.lock (exit 128); commit did not run. No alternate Git route or retry.
Local documentation/checks and distinct working-source review are retained; PR,
candidate gate, landing and publication require resolution by the original owner.
