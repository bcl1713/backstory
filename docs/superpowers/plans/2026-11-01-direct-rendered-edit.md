# Direct rendered editing implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task by task.

**Goal:** Enter math, image and diagram source by intentional click/tap without persistent edit buttons.

**Architecture:** A small parent-owned activation helper handles completed pointer gestures and supplies a native, focus-revealed keyboard edit button. Rendered content remains a semantic sibling of the button, preserving MathML and image accessibility. Diagram pointer events stay in the parent; the opaque renderer retains its existing protocol and sandbox.

**Tech stack:** CodeMirror, browser DOM, Playwright, Node tests, Django.

**Spec:** https://github.com/bcl1713/backstory/issues/71

## Global constraints

- Preserve source, supported syntax, rendering budgets, fallback and server/no-JS behavior.
- Preserve sandbox `allow-scripts` only and existing CSP; no child edit authority.
- Keep image enlargement separately labeled and retain modal focus/Escape behavior.
- Stop before merge; no deployment or configuration changes.

## Review focus

- Touch scroll or drag must not activate source.
- Source changed between pointer down and release must invalidate old activation.
- Reused image widgets must not retain stale source bounds.
- MathML remains exposed independently of button semantics.
- Diagram controls for capacity fallback must not also enter source.

## Tasks

- [ ] Add browser regressions for direct mouse/touch activation, repeat render/edit, keyboard activation and visible focus, source fidelity and native math semantics. Observe failure on the existing UI.
- [ ] Add shared activation helper in `static/src/preview-source-edit.js`; apply it in math/image widgets and live diagram views. Guard current source and disposed widgets; reject moved/cancelled gestures and nested controls.
- [ ] Move image enlargement to a compact sibling control in `image-preview.js`; preserve modal cleanup. Make live diagram frames skip keyboard focus and pointer hit testing without changing frame permissions or protocol.
- [ ] Style focus-revealed source buttons and compact enlargement in `static/src/app.css`; update existing interaction tests and preview documentation.
- [ ] Exercise actual touch scroll, stale activation, source edits/re-render, unsupported fallback, and separate enlargement. Run full Python/Node/build/browser checks and inspect desktop/mobile screenshots.
- [ ] Obtain independent review, address findings, create draft PR, verify exact remote SHA and CI. Return evidence without merging.
