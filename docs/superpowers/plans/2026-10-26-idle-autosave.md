# Idle Autosave Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Save user edits after five idle seconds and safely format exited blocks.

**Architecture:** Keep the current server formatting/save pipeline. Add a small idle scheduler and syntax-based block exit detector, integrating both with the existing editor action gate and external synchronization.

**Tech Stack:** JavaScript, CodeMirror 6, Playwright, Django, existing Prettier/markdownlint.

**Spec:** `docs/superpowers/specs/2026-10-26-idle-autosave-design.md`

## Global Constraints

- Exactly five seconds without user changes; no countdown or keystroke saves.
- Retain full formatting and validation on persistence; no new formatter.
- Preserve newer typing, revision safety, IME, undo, selection, scroll and recovery.
- External reloads/merges never initiate autosave; conflicts require explicit action.
- Preserve unrelated checkout changes and target `dev`; no live wiki or deployment.

## Review Focus

- Composition begins after a request was submitted: never replace composing text.
- Format output overlaps newer typing: retain it and require explicit review.
- An external merge arrives before idle timeout: cancel automatic persistence.
- Protected/historical drafts and invalid new filenames: no implicit publication.
- Ambiguous blocks and global formatter changes: defer safely to full Save.

### Task 1: Idle scheduling and persistence

**Files:** Create `static/src/idle-autosave.js`, `tests/formatter/idle-autosave.test.mjs`; modify `static/src/navigation.js`, `static/src/editor.js`; create `tests/browser/autosave.spec.js`.

**Interfaces:** `createIdleAutosave({getState, save, delay=5000})` returns `edited()`, `cancel()`, `pause()`, `resume()`, `flush()` and `destroy()`. State exposes `dirty`, `blocked`, `composing`, `enabled`. Editor changes supply `{user}`; mapped formatting uses a programmatic transaction.

- [x] Write/run failing scheduler tests: reset, clean no-op, coalescing while blocked, pause until explicit resume, composition, cancellation.
- [x] Implement scheduler and verify `node --test tests/formatter/idle-autosave.test.mjs` passes.
- [x] Write/run failing browser tests for idle persistence and edits during delayed saves, failures/conflicts/authentication, IME, external merge cancellation, protected/historical drafts, new filenames and no-op writes.
- [x] Integrate scheduler with action gate; capture draft generation; merge formatting against newer typing conservatively. Preserve attention messages and prevent replay on failures. Map selection/scroll for save output.
- [x] Run `npm run build` and focused browser tests; verify authoritative stored source and status.

### Task 2: Context-safe block formatting

**Files:** Create `static/src/block-format.js`, `tests/formatter/block-format.test.mjs`, `tests/browser/block-format.spec.js`; modify `static/src/editor.js`, `static/src/navigation.js`.

**Interfaces:** `markdownBlock(state, position)` returns an eligible top-level structural range or null. `blockFormattingChanges(before, after, block)` returns safe changes or null. `blockExitExtension(onExit)` observes actual edited structural exits; navigation owns async formatting and stale-result checks.

- [x] Write/run failing tests for paragraph/list/table identity, multiline Enter, front matter/fences/wikilinks, and guarded full-document formatting diffs.
- [x] Implement syntax-based detection, changed-block tracking and conservative diff validation; run unit tests.
- [x] Write/run failing browser tests for exit formatting, active-block protection, stale replies, selection/scroll/undo, composition and plain fallback.
- [x] Integrate full-document format requests behind the operation gate; apply only unchanged-snapshot safe results as isolated mapped transactions.
- [x] Rebuild and run both focused browser specs and formatter suite.

### Task 3: Regression review and delivery

**Files:** Update `docs/editor.md`, committed `static/editor.js`, and this plan.

- [x] Document autosave, explicit recovery, block fallback and external-merge behavior.
- [x] Run Python suite, formatter suite, and editor/recovery/sync/tool/browser regression tests using synthetic storage only.
- [x] Obtain an independent whole-branch review and address material findings with regression tests.
- [x] Verify diff/assets, commit, push the feature branch and create a PR against `dev`; do not merge or deploy.
