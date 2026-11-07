# Headless syntax fixture parsing implementation plan

> **For agentic workers:** Use superpowers:executing-plans for this single test-only task.

**Goal:** Resolve #103 by making headless syntax assertions independent of CodeMirror's initial 20 ms parse budget.
**Architecture:** A test-only state factory completes the real syntax tree and applies an empty transaction to attach it before assertions. Use it in syntax-recognition fixtures; preserve browser/incremental parsing tests and production deadlines.
**Tech Stack:** Node test runner, CodeMirror 6.
**Spec:** https://github.com/bcl1713/backstory/issues/103

## Global constraints

No production code/deadline changes, retries, skipped fixtures or weakened model/source assertions. Preserve selection and extensions. Full local acceptance and independent review precede merge into dev; verify automatic publication afterward.

## Review focus

Verify empty transactions attach the completed tree and refresh preview fields; preserve explicit large-document parse budgets and browser lifecycle coverage. Restore controlled clocks even on failure. Keep the fixture helper out of production.

### Task 1: Complete headless fixture parsing

- [x] Reproduce incomplete initial parsing with a controlled clock and assert literal expected math models/source/ranges.
- [x] Add a shared test-only state factory, first leaving its old immediate-return behavior; observe the controlled regression fail.
- [x] Complete parsing with ensureSyntaxTree and assert success, then return an empty transaction's state.
- [x] Audit adjacent headless syntax fixture factories and use the helper where assertions require complete syntax; preserve deliberate partial-parse tests.
- [ ] Run focused tests, the full formatter suite and complete local CI gate on the committed clean candidate.
- [ ] Obtain independent review, address substantive findings, create and merge the PR; verify resulting automatic prerelease and multiarch image identity.
