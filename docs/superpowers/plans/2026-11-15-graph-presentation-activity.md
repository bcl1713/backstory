# Graph Presentation and Activity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement issue #170 presentation lifecycle and issue #171 live node activity cues while preserving existing graph/editor state.

**Architecture:** Presentation stays within the existing graph panel/controller and uses native fullscreen and Screen Wake Lock APIs with a graph-only fallback. Successful note operations publish minimal path/kind/time metadata over a transient same-origin `BroadcastChannel`; graph view state drives bounded renderer activity emission without changing selection or topology.

**Traceability:** Canonical acceptance is independently defined by full source receipts `issue-170.json` and `issue-171.json` in the run directory. #170 acceptance covers deliberate entry/exit, desktop/mobile graph-only state, fullscreen/fallback, wake lock lifecycle and state/draft preservation. #171 covers successful real note read and write while graph remains open, correct node only, finite decay, negative metadata/failure cases, repetition/reconnect and reduced motion. External filesystem reads are outside observed coverage.

## Files

- `wiki/templates/wiki/graph-panel.html`, `static/src/graph-controller.js`, `static/src/graph.css`: entry/exit/wake-lock controls, presentation state and status.
- `static/src/note-activity.js`, `static/src/navigation.js`, `static/src/wiki-tools.js`, relevant Django read adapters: publish only success-boundary metadata for supported browser operations.
- `static/src/graph-view.js` and `static/src/graph-layout.js`: bounded, finite per-node cue layered distinctly over baseline bloom.
- `tests/formatter/graph-presentation.test.mjs`, `tests/formatter/note-activity.test.mjs`, `tests/browser/graph-presentation.spec.js`, `tests/browser/graph-activity.spec.js`: focused lifecycle and real full-path regressions.
- `docs/graph.md`: exact observable source coverage and limitations.

## Task 1 — Presentation and wake-lock lifecycle (#170)

- [ ] Add failing focused tests for presentation state, fallback, wake-lock denial/release/visibility reacquisition and teardown.
- [ ] Add graph entry action and temporary invoked controls, preserve Escape/navigation semantics, restore focus/state on exit.
- [ ] Apply graph-only viewport styling and distinguish native fullscreen from in-page fallback.
- [ ] Run focused formatter regression and browser presentation scenarios at desktop and narrow width, including an unsaved editor draft.

## Task 2 — Activity source observation and delivery (#171)

- [ ] Add failing tests for a transient canonical identity/kind message and no emission on failed or metadata-only operations.
- [ ] Publish after successful content reads and after confirmed note write/readback only; publish no source/body, credentials or persisted history.
- [ ] Subscribe only while graph is open; ignore malformed, stale or out-of-snapshot identities; do not replay on reconnect.
- [ ] Run the closest formatter and backend adapter checks.

## Task 3 — Finite renderer cue and end-to-end acceptance (#171)

- [ ] Add failing renderer regressions for event targeting, finite decay, repeated-event cap and reduced-motion behavior.
- [ ] Implement per-node bounded activity state layered over baseline emission, separate from selection/hover/hop bloom.
- [ ] Browser scenario: keep graph open, perform successful note read then write through supported app paths, assert only corresponding visible canonical node pulses automatically; cover failed/metadata-only negative paths, repeated event, reconnect and reduced motion.
- [ ] Update `docs/graph.md` with exact read/write sources and unobserved sources.
- [ ] Run selected focused browser specs and local asset build; capture independent UI/source review evidence.

## Final review

- [ ] Re-read live issues #170/#171 including comments and record any new decisions.
- [ ] Run a fresh distinct-context source review, fix material findings, and retain reviewer-authored verdict, reviewed source hashes and public identity.
- [ ] Record checks, exits, elapsed verification time, review artifacts, evidence limits, and implementation versus release/deployment state. No commit, stage, push, PR, release or deployment in this task.
