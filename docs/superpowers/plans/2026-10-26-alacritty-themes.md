# Alacritty Themes Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import Alacritty TOML palettes and restore the default for issue #3.

**Architecture:** Parse locally into validated semantic colors; apply only known
CSS variables. A small menu controller manages browser-local persistence.

**Tech Stack:** JavaScript, smol-toml 1.9.1, CSS, Django templates, Node tests, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-26-alacritty-themes-design.md`

## Global Constraints

- Base branch: `dev`; preserve the current checkout's unrelated changes.
- Preserve fixed typography, 80ch column, drafts, undo history and saved bytes.
- Local parsing only; do not follow imports or upload theme files.
- Limit files to 256 KiB and require a readable primary color pair (4.5:1).
- Retain Tokyo Night defaults and existing CSP.

## Review Focus

- Valid TOML with comments, dotted/quoted keys and inline tables must work.
- Light theme accents and selections must remain readable on derived surfaces.
- Invalid or stale stored data must never inject CSS or break navigation.
- Disabled storage must allow a session-only import and an immediate reset.
- Importing while editing must preserve unsaved source and undo history.

### Task 1: Palette conversion

**Files:** `static/src/theme-palette.js`, `tests/formatter/theme.test.mjs`,
`package.json`, `package-lock.json`.

**Interfaces:** `parseAlacrittyTheme(source: string)` returns a whitelist of
semantic hex colors plus `color-scheme`; `contrast(a, b)` returns their ratio.

- [x] Write and run failing tests for real TOML forms, dark/light palettes,
  optional colors, CellForeground/CellBackground, invalid colors, invalid syntax,
  import-only files, contrast and bounded input.
- [x] Implement conversion with smol-toml and explicit dependency pin.
- [x] Run `node --test tests/formatter/theme.test.mjs`; expect all passing.

### Task 2: Import controls and persistence

**Files:** `static/src/themes.js`, `static/src/shell.js`, `static/src/app.css`,
`assets/app.css`, `wiki/templates/wiki/shell.html`, `tests/browser/themes.spec.js`,
`docs/editor.md`, generated static bundles.

**Interfaces:** `mountThemes()` loads validated preferences, attaches import/reset
handlers and reports status without changing editor state.

- [x] Add browser tests and run before implementation; expect missing controls.
- [x] Implement accessible menu controls, browser persistence, reset, readable
  selection styles, storage-error feedback and stored-value validation.
- [x] Build assets and run the theme browser tests; expect all passing.
- [x] Document supported files, browser-local preference and reset.
- [x] Run formatter, Python and browser suites; inspect results and review diff.

Deliver through a feature branch PR against `dev`, referencing issue #3.

## Validation

- 934 Python tests passed.
- 28 formatter/import tests passed, including 7 palette checks.
- 91 browser tests passed, including 6 theme workflows.
- Asset build and `git diff --check` passed.
- Imported upstream Dracula, Gruvbox Dark and Solarized Light palette files.
- Independent review identified selection contrast issues; browser regressions
  reproduced them and passed after fixes for active controls, current-file hover
  and native selection over opaque raw blocks. The resulting screenshot was
  visually inspected.
