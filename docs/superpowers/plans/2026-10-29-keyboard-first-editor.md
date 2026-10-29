# Keyboard-first Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add safe Vim caret-link navigation and desktop keyboard-ready startup.

**Architecture:** Reuse CodeMirror's syntax-tree link parser and server resolver. Register one normal-only Vim action with editor-local callbacks; retain existing anchor draft guards. Isolate browser-local Vim defaults and focus policy in a small helper.

**Tech Stack:** CodeMirror 6, @replit/codemirror-vim, browser JavaScript, Playwright, Node tests.

**Spec:** docs/superpowers/specs/2026-10-29-keyboard-first-editor-design.md

## Global Constraints
- Keep Ctrl/Cmd+Space completion unchanged; separate shortcut PR owns toggle-key replacement.
- No automatic saves, file creation, account settings, merge or deployment.
- Phone default stays ordinary editing and no startup focus.

## Review Focus
- A pending resolution must not navigate after caret/source/mode changes.
- Dirty drafts must keep existing confirmation and missing-note behavior.
- Preferences must survive navigation but tolerate blocked/corrupt storage.
- Startup must not steal focus or override fragment positions.
- Code/images/frontmatter and nonlinks must not become navigation targets.

## Tasks
1. Add failing Node tests for browser-local Vim preference/default and startup-focus policy in tests/formatter/editor-preferences.test.mjs; run them red. Implement static/src/editor-preferences.js and wire editor.js. Add browser desktop/phone/manual override/fragment/focus tests.
2. Add failing browser tests for normal-mode gf wiki/Markdown ranges, nonlinks, Insert mode, dirty cancellation and stale results. Export linksIn from live-links.js, add editor-local follow command and Vim action registration with cleanup. Reuse safe resolver and connected anchor activation.
3. Build assets; run Node/Python/browser tests as supported, independently review diff, resolve findings, publish draft PR and verify exact-head CI. Document any blocked checks rather than claim success.

## Execution record

- Implemented desktop preference helper, shared parsed caret selection, normal-only
  gf/gh callbacks, connected anchor navigation, and stripe removal.
- Unit regressions cover parser boundaries, defaults/overrides/storage failure,
  unsafe/unavailable destinations and stale-result cancellation.
- Independent review found away-and-back stale selection and repeated browser
  preference seeding; both corrected and regression cases added.
- Browser execution is blocked locally by Chromium socket sandbox restrictions;
  PR CI must pass before merge. Local Python: 958 passed, 53 Docker-only skipped.
