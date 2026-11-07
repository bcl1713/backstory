# Issues 123 and 131: graph loading evidence

Base: `41a35e2316e0751e7677efd10aaf6dd5c40e230d`. Synthetic data only.
Implementation source and generated assets are committed together. The exact merge
candidate's receipt/review/publication records live in the existing publisher
state store; this development record does not claim a full release pass.

## Diagnosis and behavior

The existing bounded traversal scanned a busy final layer's unrelated outgoing
occurrences and eligibility-checked their endpoints. The synthetic fixture has
400 out-of-scope targets and only 2–4 selected members. Before the fix, depth 2/3
first pages were empty and checked 99 endpoints; depth 1 returned an incomplete
page. First-request SQL statement counts were 20/26/30 at depths 1/2/3.

A bounded small-neighborhood path now discovers outgoing membership, then drives
exact composite-index induced-pair lookups. The 32-member optimization threshold
is not a graph cap: larger/raw-heavy neighborhoods fall back to the original
resumable traversal, with its existing budgets. Final-layer fallback rows outside
membership skip endpoint eligibility; longer discovery emits validated nodes
before full edge aggregation. Complete occurrence counts and witness revocation
remain required. The traversal query version changes to reject old checkpoints.

After: one complete request at every depth; SQL statements 19/22/25, eligibility
operations 2/3/4, first responses 10.3/7.8/9.1 ms respectively. These are a small
local synthetic example, not a live-vault benchmark or a latency guarantee.
The larger fallback case retains all 37 members and the induced last-layer link,
returns useful first-page nodes and never stats its 110 out-of-scope targets.

Progress/duplicate pages no longer replace graph batches, restart physics or
rebuild connection-list rows. Empty discovery keeps coordinate/selection-only
bookkeeping until each returning path is validated under the same generation,
mutation, epoch and eligibility namespace. Authentication/storage failures clear
it. Empty graphs do not consume initial fit; prior camera control suppresses
automatic fit. Loading controls, summary and workspace have stable space; detailed
live status sits below the workspace so small phones keep useful graph space.

## Focused checks actually run

- Backend new last-layer regression: 3 failures before the fix, then 3 passes
  (15.03 s); real production SQLite budgets enabled.
- Graph traversal/query/diagnostics files: 88 passed, 3 failed (82.92 s). The
  scratch-I/O regression required an explicit fallback-sized page because the
  new fast path needs no scratch file; two save diagnostics encountered the
  incomplete development dependency copy. Those three selected tests then
  passed (1.35 s) after the fixture/dependency correction. Unaffected results
  are reused, not described as a fresh full-suite pass.
- Added resumable-discovery/final-layer regression: 1 passed (2.97 s).
- GraphPages formatter tests: new progress test failed before flags were added;
  all 9 passed afterward. Renderer tests: both new empty-fit/camera-control
  tests failed before the change; all 4 passed afterward.
- New Firefox progress scenario: 2 failures before fixed framing; 2 passed after
  the change (7.4 s). Existing graph controls/mobile cases: 14 passed, 1 failed
  (30.3 s), exposing too much space above the map on a 320px phone. After moving
  detailed status below the workspace, only affected new scenarios plus that
  phone scenario were rerun: 3 passed (9.4 s).
- Chromium software WebGL: both desktop/narrow progress scenarios passed (6.2 s).
  Inspected actual rendered-map screenshots and Firefox list fallback, with
  normal and reduced motion. Synthetic screenshots retained under
  `/tmp/graph-123-131-webgl-final/reports/browser-artifacts` and
  `/tmp/graph-123-131-browser-frame-final/reports/browser-artifacts`.
- Pinned Node 22.23.4 asset build passed; `git diff --check` passed.

Logs are `/tmp/graph-123-131-*.log`. Development Python uses the repository's
Python 3.14 environment; browser tests use isolated synthetic server roots/ports
8871/8872, Playwright 1.64.1 and Firefox revision 1555. Chromium uses explicit
SwiftShader flags only for supplemental rendered-map inspection. No production
wiki, settings, deployment or persistent browser graph cache was changed.

Only focused checks were selected during development. The mandatory candidate
release gate remains separate, and publication must reuse its exact receipt.
