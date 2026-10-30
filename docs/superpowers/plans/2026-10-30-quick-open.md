# Keyboard Note Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Open existing notes without mouse use or permanent toolbar clutter.
**Architecture:** A shell-mounted native dialog queries existing completion API and presents guarded internal anchors. No editor-state mutation.
**Tech Stack:** JavaScript, native dialog, Django templates, Node tests, Playwright.
**Spec:** ../specs/2026-10-30-quick-open.md

## Global Constraints
- Keep authoritative Markdown, undo and selection unchanged.
- No extra dependencies, no new backend endpoint, no Starlink work.
- Menu fallback, honest index status, existing navigation guard.

## Review Focus
- Untrusted/malformed paths cannot create external or traversing links.
- Slow old query cannot replace newer results.
- Escape preserves Vim mode and caret even when Menu is open.
- Rejected dirty navigation leaves draft intact.
- Mobile and shortcut-intercepting browsers retain an accessible fallback.

### Task 1: Quick-open chooser
**Files:** create static/src/quick-open.js, tests/formatter/quick-open.test.mjs, tests/browser/quick-open.spec.js; modify static/src/shell.js, static/src/app.css, wiki/templates/wiki/shell.html, docs/editor.md; rebuild static assets.
**Interfaces:** mountQuickOpen() installs the dialog. isQuickOpenShortcut(event) returns boolean; noteHref(path) returns safe internal URL or null.
- [x] Write unit tests for shortcut exclusions and unsafe paths; browser tests for opening, keyboard results, Escape/focus, failure and dirty-navigation protection.
- [x] Run unit tests and record expected red; browser execution blocked by missing executable.
- [x] Implement chooser and mount it before shell Escape handler; add menu/dialog and restrained CSS.
- [ ] Run unit/build/browser suites and document approved scope and limitations.
- [ ] Independent review, commit, publish PR and verify exact-head CI before parent-coordinated dev merge.
