# Live Code Blocks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render ordinary fenced code as readable highlighted code in Live preview, revealing fences on edit without changing the document.

**Architecture:** Add a focused source-backed CodeMirror extension for ordinary code block decorations and known-language highlighting. Integrate through the existing live-presentation compartment and theme CSS, leaving diagram renderers and raw/plain presentations intact.

**Tech Stack:** Existing CodeMirror 6/Lezer Markdown, JavaScript, CSS, Django test fixture and Playwright.

**Spec:** `docs/superpowers/specs/2026-11-02-live-code-blocks-design.md`

## Global Constraints

- No source execution, remote language fetch, silent formatting or deployment.
- Preserve source bytes through mode switches, native selection, keyboard/Vim navigation and undo.
- Unknown languages remain plain readable code; existing diagram fences retain their owner.
- Follow repository pinned Node 22/Python 3.14 runtime and test commands.

## Review Focus

- A caret entering from either side must reveal fences without skipping the block.
- Cross-block and multi-range selections must not conceal selected source.
- Empty, unfinished, nested and unknown-language fences must remain reachable and editable.
- Literal HTML/script and Markdown-looking text inside code must not become active markup.
- Long lines and tall blocks on phone width must not clip content or overflow the page.

## Task 1: Source-backed code rendering and regression coverage

**Files:** Create `static/src/code-preview.js` and focused browser tests; modify `static/src/editor.js`, `static/src/live-preview.js`, `static/src/app.css`, package lockfiles only for required local language parsers, and `docs/editor.md`.

**Interfaces:** `codePreview` is a CodeMirror extension consumed by the existing live-presentation compartment. Syntax nodes/source positions remain authoritative; no replacement editor API.

- [ ] Write failing browser tests for hidden inactive fences, visible highlighted code, source reveal from above/below, unchanged source and unknown-language fallback. Include literal script text, tilde/unfinished fences, cross-block selection, phone wrapping and reserved diagram fence behavior.
- [ ] Run the focused tests on the unchanged baseline and confirm failures express the missing feature.
- [ ] Implement the smallest extension and theme integration, using bounded local language support and palette tokens. Do not rework unrelated diagram code.
- [ ] Run focused Chromium/Firefox tests and inspect actual desktop/mobile screenshots. Check keyboard and Vim entry/exit, edit/undo, mode switches and repeated selection.
- [ ] Run repository Python, formatter, build and required browser suites, disclose unrelated failures accurately, and update user documentation.
- [ ] Obtain independent final diff review, fix findings and rerun affected checks. Open draft PR, verify remote exact commit and required CI, mark ready and merge dev only after passing. Verify resulting release image and no deployment.
