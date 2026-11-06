# Multiline Wikilink Aliases Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix issue #95 without weakening formatted-save safety.
**Architecture:** Normalize only parser-recognized wrapped aliases before each
active Prettier pass; teach the backend preservation parser the same wrapped
alias grammar and leave the exact fixed-point comparison intact.
**Tech Stack:** Node, existing Lezer Markdown parser, Python/Django tests.
**Spec:** `docs/superpowers/specs/2026-11-06-multiline-wikilink-aliases-design.md`

## Global Constraints

Retain literal targets and label text except soft line-break whitespace.
Keep original source on failure, config ignores, fixed-point and save guards.
Use synthetic content; publish dev artifacts, without deploying a server.

## Review Focus

- Escaped openers, code, front matter, HTML and math stay literal/protected.
- Blockquote markers must not become label text.
- Long labels and repeated aliases remain stable without truncation.
- Preserve CRLF/BOM and significant spaces outside line-break indentation.
- Malformed/over-budget input must not be partially rewritten or hang.

### Task 1: Parser-based normalization and regression coverage

**Files:** Create `formatter/wikilinks.mjs`; modify `formatter/pipeline.mjs`,
`tests/formatter/pipeline.test.mjs`, `tests/integration/test_saves.py`,
`tests/browser/live-links.spec.js`, `docs/preview.md`, `wiki/markdown.py`,
`wiki/formatting.py`, `tests/integration/test_formatting.py`; create
`tests/formatter/wikilink-format.test.mjs`.
**Interfaces:** `normalizeWrappedWikiAliases(source)` returns normalized source,
or null on incomplete bounded syntax verification; consumed by prettierPass.

- [x] Add packaged-helper cases for the reported list, ordered/nested/task/quoted
  variants, rich/literal labels, narrow widths, CRLF and repeated formatting.
- [x] Add a formatted create/update regression checking authoritative readback,
  target/label rendering, second-save no-op and stale-revision rejection.
- [x] Run the new regressions and observe failure before product changes.
- [x] Implement a bounded formatter-only inline parser; normalize only complete
  wrapped alias nodes and skip protected syntax. Keep all existing gates.
- [x] Verify focused formatter/save/browser regressions and full formatter suite.
- [x] Document explicit formatting behavior and commit the fix.

### Task 2: Review, release and publication

- [ ] Run the complete local correctness gate on the clean candidate commit.
  Expected: every stage passed and an exact-commit receipt.
- [x] Obtain independent whole-branch review and address material findings.
- [ ] Open and merge the reviewed PR into dev; preserve the original checkout.
- [ ] Observe the automatic publisher's resulting-commit gate and publication.
- [ ] Verify source tag, release assets/checksums and multiarch image labels and
  digest; report the published release URL and image tag.
