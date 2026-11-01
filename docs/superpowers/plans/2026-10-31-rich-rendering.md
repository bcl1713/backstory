# Rich Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement task-by-task.

**Goal:** Display local images, Mermaid diagrams and math without changing authoritative note source.
**Architecture:** Parser-aware CodeMirror widgets reuse the existing source-reveal interaction and authenticated link resolver. Separately loaded local renderer modules handle explicit fenced/math syntax, with bounded untrusted input and safe fallback.
**Tech Stack:** Django, markdown-it-py, CodeMirror 6, esbuild, Playwright; candidate Mermaid/KaTeX dependencies pinned after compatibility checks.
**Spec:** docs/superpowers/specs/2026-10-31-rich-rendering.md and issue #66.

## Global Constraints
- Rendering and mode switches never write source, format, save, execute code, or fetch remote resources.
- Keep authentication, exclusions, no-follow storage, CSP and source/draft/conflict semantics unchanged.
- No live deployment; independent review and CI before merge, coordinated with parent.
- Tests use synthetic wiki fixtures, isolated browser runtime/port, and bounded malformed/hostile input.

## Review Focus
- Selection and Vim navigation entering/leaving tall widgets must remain reliable.
- Late loads and async completions must not corrupt caret position or stale documents.
- Encoded/relative local paths and blocked remote URLs must use the shared policy consistently.
- Table cells, nested contexts, code literals and incomplete syntax must not be reinterpreted incorrectly.
- Mobile overflow, missing resources, malicious markup and renderer failure must keep editing usable.

## Task 1: Local image display
Files: new static/src/image-preview.js; static/src/editor.js, static/src/app.css; tests/formatter/image-preview.test.mjs; tests/browser/image-preview.spec.js; docs/preview.md. Add narrowly shared helper only if needed by tables/server preview.
- [ ] Write failing parser/model tests for ordinary and reference Markdown images; code/escaped/source-mode cases and no remote fetch.
- [ ] Write browser regressions proving visible local image, responsive layout, accessible enlargement, source reveal, exact source/undo/mode preservation, missing/denied image fallback and no external requests.
- [ ] Run red tests before implementation.
- [ ] Implement bounded parser-aware image widgets using /resolve/ and /attachments/; reuse existing policy and include source-entry navigation geometry. Images inside tables must either work or have an explicit tested/documented first-stage limit.
- [ ] Run focused Node/Python/browser tests, build, inspect screenshots; record scope limits; commit and obtain independent review before next stage.

## Task 2: Mermaid
Files: new static/src/diagram-preview.js and local render module; editor/build/package files; renderer tests and docs.
- [ ] Establish explicit mermaid-fence extraction/model tests and malicious/config/remote-URL negative tests; run red.
- [ ] Add pinned self-hosted dependency with strict, immutable security settings, safe output handling, complexity caps, bounded async/stale-result behavior and source fallback.
- [ ] Test editable source/undo, mobile overflow, accessible descriptions, errors, no outbound network and current CSP. Server-preview parity requires narrowly controlled integration, never global HTML/SVG trust.
- [ ] Build and run focused tests; commit and obtain independent review.

## Task 3: Math
Files: new static/src/math-preview.js and renderer; editor/build/package files; parser/browser tests and docs.
- [ ] Write failing explicit-delimiter tests, including currency/escaped punctuation, code/frontmatter exclusion, incomplete expressions and newlines.
- [ ] Add pinned self-hosted KaTeX candidate with trust false, finite maxExpand/maxSize, isolated macro state, escaped errors and accessible output.
- [ ] Verify editor and preview parity, source/undo/formatting safety, mobile overflow and no external fetches; document unsupported full-TeX features.
- [ ] Commit and obtain independent review.

## Release gate
- [ ] Full Python and Node suites, production asset build, isolated browser suite and final whole-branch review.
- [ ] Draft PR against current dev with staged evidence and issue checklist; resolve review/CI failures without weakening assertions.
- [ ] Notify parent before merge/publication; merge only after independent review and required checks. No deployment.
