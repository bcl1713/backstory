# Quiet refresh and continuous graph camera

Working-tree changes based on `cdd44da5b47d7fd65e1c24ea0605e5e1633b9a9f`,
on `fix/graph-mobile-open`. No merge or publication performed. Existing
`.codex-attachments/` was left untouched.

Periodic 15-second revalidation keeps the accepted status/map visible. Explicit
loading and failure feedback remain. Selection tracks a note independently of
the opening BFS root. Yaw/pitch/roll rotate at .011/.007/.003 radians per second,
with a three-second input delay and two-second ramp. Pause/reduced motion and
hidden/list/closed lifecycle stop ambient animation. Scene batches/materials and
available attribute capacity survive topology edits; only exhausted buffers grow.
Surviving physics identities and node drags are preserved.

## Focused verification

Selected checks establish projection/picking/render alignment, selected-center
tracking, incremental graphics allocation, interaction/lifecycle behavior, and
quiet fail-closed refresh. No full-suite or release-gate claim is made.

- `node tests/formatter/graph-continuity.test.mjs`: **6 passed**, final source.
  Initial red cases caught missing roll, idle motion, centering, batch retention,
  selected-centered fit, and same-scope restoration. An initial cyclic-object
  assertion exhausted Node's diagnostic heap; a bounded identity assertion fixed
  the test output before proceeding.
- `node tests/formatter/graph-frame-work.test.mjs`: **7 passed**, including
  independent Three.js projection agreement after roll and crossing a pole.
- `node tests/formatter/graph-renderer.test.mjs`: **7 passed**. Updated capacity
  checks use active draw ranges rather than assuming allocation equals membership.
- `node tests/formatter/graph-layout.test.mjs`: **13 passed**, including fit,
  anchored zoom, deterministic motion and physics identity preservation.
- Built the changed graph entry with:
  `node --input-type=module -e "import {build} from 'esbuild'; await build({entryPoints:['static/src/graph-controller.js'],outdir:'static',bundle:true,format:'esm',minify:true,logLevel:'info'});"`
  **Passed**, final generated `static/graph-controller.js` retained.
- Targeted Chromium command, with disposable runtime
  `/tmp/backstory-graph-continuity-final` and port 8874:
  `node_modules/.bin/playwright test tests/browser/graph-continuity.spec.js tests/browser/graph-snapshot.spec.js tests/browser/graph-exploration.spec.js tests/browser/graph-controls.spec.js tests/browser/graph-motion.spec.js --grep 'periodic refresh|idle camera|reduced motion|snapshot selection|cumulative exploration|opening-root BFS|1050-node.*1180' --reporter=line`:
  **8 passed, 1 failed** (30.3 seconds). The large-graph scenario found that
  hidden-tab restoration treated a restored selection as new input and recentered
  a paused manual camera. Fixed by restoring selection without centering.
- Reran only affected restoration scenarios, with runtime
  `/tmp/backstory-graph-continuity-restore` and port 8874:
  `node_modules/.bin/playwright test tests/browser/graph-motion.spec.js tests/browser/graph-snapshot.spec.js --grep '1050-node.*1180|snapshot selection' --reporter=line`:
  **2 passed** (12.7 seconds). This replaces the large-graph failure; unaffected
  earlier results are reused. Combined evidence covers **9 distinct scenarios**,
  not a new single full run. The optional selection argument leaves their normal
  selection path unchanged; only suspended same-scope presentation opts out.
- `git diff --check`: **passed**.

The nine browser scenarios cover held automatic refresh, added/removed nodes,
unchanged scene identities and camera, three-axis idle motion after solver
cooling, held-pointer pause, delayed resumption, hint mode, explicit pause,
reduced motion, dense 1180px/390px selection, cumulative exploration at both
widths, 1,050-node desktop motion/drag, same-scope hidden-tab restore, close cleanup
and 401 evidence removal. The large fixture published 76 complete steps across
120 measured frames, with 44 partial slices and zero partial-position changes.
Ambient rotation was suspended only during its solver redraw measurement.

First browser launch was sandbox-blocked at local port binding; the same targeted
command ran through approved execution. Initial gesture testing clicked a toolbar
over the map; corrected its coordinates and asserted pointer capture before the
motion check. Total verification remained under two minutes of command runtime.

Node 22.12.0, installed Playwright 1.64.1 and Three.js 0.183.2, existing Python
virtualenv and lockfile. Logs:
`/tmp/graph-continuity-browser{,-final,-restore}.log`; artifacts under the runtime
directories' `reports/browser-artifacts/`. Inspected the final idle desktop and
dense 390px screenshots: controls remain available and graph feedback is legible.

An independent read-only reviewer inspected buffer disposal/growth, draw ranges,
surviving gestures, projection alignment, idle lifecycle and quiet failure handling
without duplicating tests. No additional findings. The restoration issue was
subsequently fixed and regression tested. Real-device smoothness, GPU memory
profiling/context recovery and the exact-merge release gate were not verified.

## Initial focused build inputs (SHA-256)

```text
76567949eafb65fa7b3e5d1747206af681a3963efeed8d5aef58ede69ff524f5  static/src/graph-camera.js
e1329da1add5bd5b3e35b2e0734cb3537ab3838ae0f7535a11b487fd8af5221d  static/src/graph-view.js
e1ec9cba26c698916ca266c3a2f26f1d4b3746c9d582c35b242f9afa5ae08d83  static/src/graph-controller.js
c872d835e761bdedb6b54f7dd3f0da83ff4b81185d57be959f4cd0137b37f616  static/graph-controller.js
78cd6804a093266efe8790fd73cb40880ed6b1026a69cd53a8f2c96d11a13e10  package-lock.json
```

## Integration for the requested dev publication

Integrated current dev `329e4b0abf43990c3ae5a926fb85039584a897eb`, which adds
the physics worker and cached rendering. Kept its worker suspension/resumption,
fallback status, label cache and published-position invalidation. Resolved only
overlapping constructor, topology and tick changes; rebuilt the generated graph
bundle. Existing queue/controller gate code is byte-identical to this source.

The three affected formatter files (continuity, frame work, renderer) passed on
the integrated tree. New quiet-refresh, idle-interaction and reduced-motion
Chromium scenarios passed with the actual worker (12.9-second four-case run;
three passed and the existing drag scenario exposed an obsolete no-recenter
assertion). Updated that assertion to verify selected centering while retaining
zoom/orientation; the corrected drag scenario then passed separately (4.5 seconds),
including real spring tug, pointer cancellation and phone touch cancellation.
Logs/artifacts: `/tmp/graph-continuity-worker-browser.log` and
`/tmp/backstory-graph-continuity-worker/reports/browser-artifacts/`.
The affected-only rerun is retained in `/tmp/graph-continuity-worker-drag.log`.

Audited the remaining camera-equality assertions before landing. The direct
mobile opening cases also encoded the old no-recenter rule; they now assert
selected centering with preserved zoom/orientation. Both real-touch Chromium
scenarios passed at 390px/320px (5.3 seconds), log
`/tmp/graph-continuity-phone.log`, artifacts under
`/tmp/backstory-graph-continuity-phone/reports/browser-artifacts/`.
The first candidate run was gracefully interrupted early for this test correction;
it produced no usable receipt. A replacement candidate must run its own full gate.

The requested merge/publication must use a fresh exact proposed-merge candidate
and full release receipt; initial focused evidence is not transferred as that
receipt. Publication will consume the landed candidate receipt without retesting.
