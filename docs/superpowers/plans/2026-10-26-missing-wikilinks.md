# Missing Wikilinks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Activate missing wikilinks through the existing guarded Create Note flow.

**Architecture:** Extend shared resolution with a separate action URL and bounded
destination information; existing-note href semantics stay intact. A read-only
entry point revalidates resolution and prefills the regular editor. Frontend
activation preserves dirty source tabs and refreshes link resolution on return.

**Tech Stack:** Django, Python, CodeMirror, Playwright; existing dependencies only.

**Spec:** `docs/superpowers/specs/2026-10-26-missing-wikilink-design.md` (approved).

## Global Constraints

- Use the existing Django backend, CodeMirror editor, preview sanitizer, and synthetic test fixtures.
- No live wiki changes, new storage system, automatic folder creation, new editor, or unrelated Markdown rewriting.
- Target a new branch from `dev` and a PR against `dev`; preserve the original checkout.
- Creation uses existing authentication, path policy, formatting and atomic no-overwrite publication.

## Review Focus

- Literal percent signs and encoded delimiters must survive URLs without double decoding.
- A folder or denied exact target must never become a new Markdown file with an invented suffix.
- A stale lookup completing after refresh must not overwrite fresh resolution results.
- Creation conflicts must never enable revision adoption and overwriting of the existing note.
- A dirty source must survive popup blocking and keyboard/mobile activation.

### Task 1: Shared link resolution and actionable preview

**Files:** `wiki/links.py`, `wiki/contracts.py`, `wiki/markdown.py`, `tests/integration/test_missing_links.py`.

**Interfaces:** `resolve_link(source_path, target, kind) -> LinkResult` retains
`state/href/label` and adds `action_href`, `create_path`, and `choices` with empty
defaults. `action_href` opens `/new/link/?source=...&target=...`; `href` remains an
existing destination. Missing creation candidates and ambiguous eligible choices
are available only after authoritative path and index checks.

- [x] Write tests for path/alias/fragment prefill, literal percent filenames,
  root/relative resolution, existing headings/attachments, ambiguity, incomplete
  index, denied targets, folders, symlinks and missing parents; rendering changes
  neither original bytes nor filesystem entries.
- [x] Run `.venv/bin/python -m pytest tests/integration/test_missing_links.py -q`;
  expect failures for absent action metadata and noninteractive missing previews.
- [x] Extend shared candidate resolution and render sanitized semantic anchors
  with missing/ambiguous styling and accessible action descriptions.
- [x] Run the new tests and existing preview/search/link suites; expect green.
- [x] Commit the resolver and preview change with its tests.

### Task 2: Revalidated creation entry point

**Files:** `wiki/creation.py`, `wiki/urls.py`, `wiki/templates/wiki/link_destination.html`,
`wiki/templates/wiki/note.html`, `tests/integration/test_missing_links.py`.

**Interfaces:** `linked_note(request)` is authenticated and GET-only. It consumes
Task 1's resolution, renders the existing editor with `filename` and
`link_fragment`, or an explicit choice/open-existing page. `new_note` stays
compatible. The optional chosen path is validated as an explicit user choice.

- [x] Write and run failing HTTP tests for prefilled creation, chooser, explicit
  new-path choice, concurrent target appearance, strict query encoding, auth,
  forbidden folders and storage unavailable. GET must write no wiki files.
- [x] Implement the revalidating GET entry point and templates; enforce existing
  parent folders and Markdown path policy. Existing targets get an Open action.
- [x] Verify explicit `If-None-Match: *` saves, collision refusal, formatting,
  indexing delay, and source-byte preservation using real synthetic storage.
- [x] Run creation and save-security suites; expect green; commit.

### Task 3: Live activation, retained drafts and refresh

**Files:** `static/src/live-links.js`, `static/src/navigation.js`, generated
`static/editor.js`, `tests/browser/missing-links.spec.js`, `tests/browser/live-links.spec.js`, `docs/editor.md`.

**Interfaces:** Live link widgets consume Task 1's `action_href`. Creation links
are recognized by their same-origin `/new/link/` URL. Dirty source activation
opens a separate tab; blocked popups leave an explicit new-tab link. On focus,
pageshow or visible return, invalidate the bounded resolution cache. Ignore old
responses whose cache entry is no longer current.

- [ ] Write and run failing browser tests for keyboard and mobile activation,
  filename prefill, explicit create and open-original-link round trip, ambiguous
  choices, draft/undo retention, popup blocking, collision actions without
  overwrite, fragment handling, delayed indexing and stale-response refresh.
- [ ] Implement live action styling, draft-preserving activation, bounded cache
  refresh, and creation-conflict Open actions that never adopt a revision.
- [ ] Build assets with `npm run build`; expect exit zero. Run focused browser
  tests and full Python/formatter suites; then browser regressions for shared
  editor and link behavior. Record output and any limitations.
- [ ] Document the creation behavior and commit implementation plus tests.
- [ ] Request one fresh whole-branch review, fix significant findings with
  regression tests, verify, then push the feature branch and open the dev PR.
