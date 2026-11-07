# Wikilink Completion Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete existing-note wikilinks without changing the editor/save model.

**Architecture:** Query the bounded indexed-name projection through an authenticated
JSON endpoint. A CodeMirror completion source applies one isolated source edit;
its key handling precedes Vim only while suggestions are active.

**Tech Stack:** Django, SQLite, CodeMirror 6 autocomplete 6.20.4, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-27-wikilink-completion-design.md`

## Global Constraints

- Limit query text to 256 characters, returned notes to 20, candidates to 300,
  and display titles/labels to 512 characters.
- Preserve literal Markdown, newline metadata, undo, save/conflict and recovery.
- No whole-index downloads, filesystem scans, body reads, new services or schema.
- Work in the isolated feature checkout; preserve the original dirty workspace.
- Commit, PR and merge into dev only after verification, following owner preference.

## Review Focus

- Duplicate aliases and grammar-delimiter filenames cannot insert a wrong target.
- In-flight replies after typing, mode changes or sign-out cannot mutate drafts.
- Escape dismisses completion before Vim; Tab still reaches ordinary controls.
- Existing fragments/labels/closing delimiters survive acceptance and undo.
- Long labels and sticky banners cannot hide the popup or caret on small screens.

### Task 1: Indexed completion discovery

**Files:** Create `indexing/completions.py`, `tests/integration/test_completions.py`;
modify `wiki/tool_views.py`, `wiki/tool_urls.py`.

**Interfaces:** `complete_notes(query: str) -> CompletionPage`, whose `items`
contain `path`, `title`, `label`, with `freshness` and `truncated`. GET
`/tools/complete/?query=...` uses the existing JSON/session boundary.

- [x] Write endpoint tests for path/title/alias/Unicode matching, duplicate names,
  literal wildcard characters, unsafe grammar, bounds, stale/deleted/excluded
  files, missing storage, partial index and expired sessions.
- [x] Run `.venv/bin/python -m pytest tests/integration/test_completions.py -q`;
  expect missing endpoint failures before implementation.
- [x] Implement bounded name-only lookup and current-file/policy rechecks.
- [x] Run the new tests and existing indexing/tool tests; expect all pass.

### Task 2: Editor completion and accessible controls

**Files:** Create `static/src/link-completion.js`, `tests/browser/completion.spec.js`;
modify `static/src/editor.js`, `static/src/vim-bindings.js` if needed,
`static/src/app.css`, `wiki/templates/wiki/note.html`, package/lock and build output.

**Interfaces:** `createLinkCompletionExtension()` provides the completion source,
popup and keymap. Completion requests consume Task 1's response. A toolbar button
starts completion in the focused enhanced editor; fallback leaves typing ordinary.

- [x] Write browser acceptance tests using real indexed synthetic notes. Verify
  failure before adding the extension.
- [x] Add the pinned direct autocomplete dependency, context parsing, abortable
  requests, response validation, one-edit application, key priority and controls.
- [x] Cover standard/Vim Live/Raw, exact undo/newlines, preserved suffixes, code
  exclusion, escaped syntax, obsolete replies, fallback, mobile and sticky bounds.
- [x] Build once and run focused completion/editor/save/browser-tool regressions.

### Task 3: Verification, documentation and publication

**Files:** Update `docs/editor.md`, `docs/preview.md`, spec/plan checkboxes as needed.

- [x] Document syntax, labels, keys, fallback, indexed freshness and limitations.
- [x] Run Python and browser suites against disposable storage and formatter tests.
- [x] Obtain independent code review and address significant findings with regressions.
- [ ] Commit only feature files, push, create a PR against dev, wait for required
  correctness checks, merge and verify the remote contains the feature commit.

## Execution notes

Review regressions cover adjacent wikilinks, nested label/fragment openers,
unrepresentable generated labels and Unicode code-point bounds. The existing
caret fix was integrated with tooltip clipping through a shared viewport helper.
A final regression also ensures pending non-link queries cannot consume Vim Escape.
The known intermittent same-revision recovery test is recorded in the PR; a clean
remote correctness run remains required before merge.
