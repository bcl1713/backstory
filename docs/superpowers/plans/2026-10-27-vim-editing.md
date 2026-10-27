# Optional Vim Editing Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Deliver issue #2's approved first slice of optional Vim editing.

**Architecture:** Add Vim bindings through a compartment independent of editor
presentation. Keep all text and history in the existing EditorView; connect a
persistent toggle/status to the optional bindings and suspend them in fallback.

**Tech Stack:** CodeMirror 6, @replit/codemirror-vim 6.4.0, Django, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-27-vim-editing-design.md`

## Global Constraints

- Standard editing remains the default on each page load; no persisted preference.
- Reuse existing authoritative Markdown, newline metadata, save and draft behavior.
- Completion and wider navigation mappings remain subsequent increments.
- Preserve existing uncommitted work. Publish only the Vim changes from an isolated
  feature worktree based on current dev, as subsequently authorized by the owner.

## Review Focus

- Escape from an Insert-mode editor with menu/proposal open respects UI priority.
- Switching to fallback never strands a user in modal state.
- Undo restores original mixed line endings after mode reconfiguration.
- Browser shortcuts and Tab navigation remain reachable when Vim is enabled.
- Formatting, save conflicts and enhancement failure retain recoverable source.

### Task 1: Modal editor integration

**Files:** Create `static/src/vim-bindings.js`, `tests/browser/vim.spec.js`;
modify `static/src/editor.js`, `wiki/templates/wiki/note.html`, `package.json`,
`package-lock.json`; generate `static/editor.js`.

**Interfaces:** Vim controller exposes `extension`, `setEnabled(view, enabled)`
and `destroy()`. Editor exposes `setVimEnabled(enabled)`; mode notifications flow
through `onVimModeChange(mode)`. Presentation changes keep one EditorView.

- [x] Write browser cases for default/off, modes, visual selection, Live/Raw
  reconfiguration, fallback suspension and exact newline undo. Run to see missing
  Vim toggle fail: `npm run test:browser -- tests/browser/vim.spec.js`.
- [x] Install exact Vim/search dependencies and retain MIT license in build output.
- [x] Implement compartment, mode reporting, persistent controls and suspension.
- [x] Build and run new tests; expect passing modal editor cases.

### Task 2: Shortcut integration and verification

**Files:** Modify `static/src/navigation.js`, `static/src/shell.js`,
`static/src/vim-bindings.js`, `tests/browser/vim.spec.js`, `docs/editor.md`;
regenerate `static/editor.js`, `static/shell.js`.

**Interfaces:** Existing document handlers own Save, proposal Escape and Zen;
Vim owns modal keys only within its enhanced editor.

- [x] Add failing tests for Save in Normal/Insert, Escape priority, Tab exit,
  browser shortcut defaults, mobile off control, enhancement failure and conflicts.
- [x] Route existing shortcuts before Vim; preserve browser defaults and controls.
- [x] Document supported mappings, per-page opt-in, fallback, Escape order,
  deliberate browser conflicts and deferred completion.
- [x] Build and run focused Vim tests, then existing editor/Zen/accessibility/
  preview/recovery/vertical-slice/browser-tools suites. Expect no new failures.
- [x] Review the scoped diff independently and address significant findings;
  commit the isolated Vim changes, open a PR to dev, and merge after checks pass.

## Publication integration

The owner subsequently requested commit, PR and merge into `dev`. Apply only the
Vim patch over current `dev`, keeping its newer autosave/source-sync behavior.
Add acceptance cases for Insert-mode autosave and undoable authoritative refresh;
run all suites on the integrated tree and require successful PR correctness checks.
Completion remains deferred; this PR implements the first increment of #2.
