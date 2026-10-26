# Editor links, modes and Zen implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task by task.

**Goal:** Complete issues #7, #8 and #1 in that order while leaving a simple color-token foundation for #3.

**Architecture:** Extend the existing CodeMirror document, parser and decorations. Reuse the authenticated safe resolver and rebuildable index; keep source/save/recovery logic authoritative. Add presentation state and a collapsible Zen navigation surface around the existing editor.

**Tech Stack:** Django, CodeMirror 6, plain JavaScript/CSS, pytest and Playwright.

**Spec:** `docs/superpowers/specs/2026-10-26-live-preview-links-design.md`, GitHub issues #8 and #1, and the user's session authorization to decide and proceed.

## Global constraints

- Inactive-line links navigate directly; caret/selection lines reveal source.
- Markdown, front matter, encoding and formatting configuration survive presentation changes.
- Reuse safe target rules; missing/ambiguous destinations stay non-navigable.
- Keep Save, Format, conflicts, errors and recovery accessible in Zen.
- Tokyo Night Night, self-hosted JetBrains Mono, 16px/1.5 and an 80ch content column; headings share the same grid.
- Color customization is deferred to #3; use shared CSS custom properties now.

## Review focus

- Async resolution must not attach a stale destination after source changes.
- Pointer activation must not first turn a rendered link into editable source.
- Fallback transitions and delayed startup must keep truthful states and exact source.
- Today uses an explicit browser timezone/date; absent or ambiguous notes are never created.
- Narrow screens, zoom and diagnostic panels must not overflow or hide critical state.

### Task 1: Safe live links (#7)

**Files:** `static/src/live-preview.js`, new `static/src/live-links.js`, `static/src/editor.js`, `tests/browser/live-links.spec.js`, existing live-preview/discovery tests, `docs/preview.md`.

**Interfaces:** Syntax extension recognizes WikiLink nodes; `createLiveLinksExtension({getPath})` renders links and resolves via `/resolve/`. The editor supplies a current path callback, including after creating a note.

- [ ] Add synthetic browser regressions for inactive alias links, active source lines, keyboard/touch navigation, unsafe/missing/ambiguous links, stale responses and source preservation. Run and confirm failure from absent rendering.
- [ ] Implement syntax-aware bounded resolution and accessible inline widgets. Keep ordinary links consistent, source selections unchanged, draft guards active and DOM text inert.
- [ ] Build assets and run focused link/preview/browser regressions; inspect output. Commit the independent change.

### Task 2: Honest editor presentations and navigation (#8)

**Files:** `static/src/editor.js`, `wiki/templates/wiki/note.html`, `static/src/shell.js`, `wiki/templates/wiki/shell.html`, new `wiki/navigation.py`, `wiki/views.py`, `wiki/urls.py`, browser and integration tests.

**Interfaces:** One mode state (`loading`, `live`, `source`, `plain`) controls selected buttons, readiness and visible surfaces. `/navigation/` returns Today resolution plus up to five recently modified indexed notes, revalidated against storage policy.

- [ ] Add failing browser tests for loading/ready, all three modes and complete long-note textarea access with unsaved source preserved. Add backend tests for date/timezone validation, missing/ambiguous Today and policy-checked recent notes.
- [ ] Implement presentation state and label the plain textarea as complete-document source. Use the browser's current local date and named timezone, shown explicitly. Today resolves the date-named existing note using the safe resolver; recently modified entries reuse index data, with freshness shown. No source is created by navigation.
- [ ] Run targeted browser, navigation, authorization and resolution tests. Commit the independent change.

### Task 3: Default Zen presentation (#1)

**Files:** CSS sources, note/shell templates, shell/editor JavaScript, self-hosted font/license files, browser accessibility/layout tests and user documentation.

**Interfaces:** Shared semantic CSS color tokens and shared note font metrics. A discoverable navigation/control toggle and keyboard shortcut reveal chrome, Escape returns to editing; persistent save status/errors remain outside hidden chrome.

- [ ] Add failing tests for default Zen, reveal/return focus, desktop 80ch column, heading semantics/grid, mobile no overflow, and visible conflict/error states.
- [ ] Fetch the official theme reference and JetBrains Mono font/license. Implement Tokyo Night tokens, font ligatures, semantic headings, responsive column and collapsible controls/navigation without changing document state.
- [ ] Build assets; run full Python, formatter and browser suites. Review desktop/mobile screenshots. Obtain a fresh final code review, fix material findings with regressions, and report any remaining limitations. Commit the independent change.
