# Firefox runtime consolidation implementation plan

**Goal:** Resolve #117 with one supported, pinned automatic Firefox runtime and
preserve the stock probe's distinct geometry regressions.

**Architecture:** Keep Playwright's patched Firefox, selected by the exact
Playwright dependency and lockfile. Move all 32 Mermaid profile combinations to
its renderer lane; share synthetic fixtures with the optional stock compatibility
probe and existing renderer suite. Keep the three-engine stock smoke opt-in.
Replacing Playwright's executable with stock Firefox is unsupported and rejected;
keeping both complete suites would preserve unnecessary installs and probes.

**Constraints:** Synthetic data only; retain required screenshots, traces and
bounded diagnostics; no blanket Chromium gate; no publication or dependency
installation; #116 owns publication orchestration. User authorized implementation
without further planning approval. AGENTS.md requires focused, reusable evidence.

- [x] Inventory concrete assertions and existing publisher runtime/install cost.
- [x] Update local CI contract tests to require the consolidated lanes and reject
  legacy receipts; observe expected failure before changing the runner.
- [x] Share fixtures; implement profile coverage with direct active-frame zoom
  measurements, including stale-message/remount regression coverage.
- [x] Preserve the fixed exponent-coordinate tests and all existing automatic
  code, preview, clipping, navigation and boundary cases. Keep pinned stock tools
  and checksums available for explicit compatibility investigation.
- [x] Run affected Python contract tests and the two selected Firefox lanes once.
  Passing proves the new receipt contract and selected browser coverage; it does
  not establish a fresh full gate, browser-chrome zoom or original-note acceptance.
- [x] Record exact inputs, commands, timings, results and material gaps, then commit.
