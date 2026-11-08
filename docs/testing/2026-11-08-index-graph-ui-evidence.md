# Graph readability and index progress evidence

8 November 2026; development working tree based on dev
`516be5967d1e95ded307abfc1dfc93294c05c563`. This is focused development evidence;
release acceptance belongs to the exact merge-candidate receipt.

The label implementation has screen-space collision checks for all labels and
all visible node/state marks, stable candidate slots, bounded ordinary-label
candidates, near alternate placements and nearest available margin placement for
priority identities. A backed identity chip with a leader is a last resort when
the entire viewport is filled with marks. State marks are drawn independently
of label availability. Full titles remain in the existing list/details.

New label tests first failed because the placement module was absent; five
regressions then passed: distinct overlapping selected/focused/current nodes,
ordinary label over a second node, slot stability across a small motion/append,
93-node dense phone placement after selection/zoom, and state marks with zero
label budget. `node tests/formatter/graph-labels.test.mjs` final run: 5 passed,
18.6 ms. `node tests/formatter/graph-index-status.test.mjs`: 2 passed, 29.5 ms after
adding the backend's final enum vocabulary; unknown strings never echo private
paths/titles. These direct runs use pinned Node22.23.4. Earlier Node22.12 focused
bloom evidence is retained in `132-bloom-springs.md`; its unchanged physics,
classification and material checks remain applicable.

Two source changes justified the final affected reruns: nearest margin placement
replaced first-top-margin placement, and status received final watcher enums and
hidden-page cancellation. No broad development suite was run. Asset build
`npm run build` passed using pinned Node22.23.4. The browser test itself was
adjusted to capture the map beneath the sticky dialog header.

Final Chromium command (trusted forge executor):

```sh
PATH=/home/oracle-worker/.local/share/backstory-publisher/tools/node_modules/.bin:/home/oracle-worker/.local/bin:/usr/local/bin:/usr/bin:/bin \
BACKSTORY_BROWSER_RUNTIME=/tmp/backstory-index-graph-clusters \
BACKSTORY_BROWSER_PORT=8874 \
FONTCONFIG_FILE=/home/oracle-worker/.local/share/backstory-publisher/fonts/fonts.conf \
npx playwright test tests/browser/graph-readability.spec.js
```

**1 passed in 5.8s**, scenario 2.4s. First combined run before the final source
changes also passed in 5.8s; not represented as the final source check. Total UI
verification including red/green/build/browser work stayed below one minute.
Full logs: `/tmp/index-graph-{labels,status,browser}-final.log` and
`/tmp/index-graph-build-final.log`.

Artifacts under
`/tmp/backstory-index-graph-clusters/reports/browser-artifacts/graph-readability-dense-ph-7ab95--and-disclosed-index-phases/`:

- `label-geometry.json`: all priority identities are present; no label-label or
  label-node/state-mark overlaps for the dense synthetic fixture.
- `phone-dark-default.png`, `phone-dark-high.png`, `phone-light-default.png`,
  `phone-light-high.png`: actual WebGL pixels. Inspected all four: readable
  separated priority titles, clear direction arrows, faint context links, and
  visibly stronger high bloom without hiding labels. High 4 was retained after
  this small visual comparison. Default 2 is the former High's exact intensity.
- `phone-light-selected-zoom.png`: selection/zoom updates retain graph records.
- `phone-forced-colors-list.png`: complete 93-note list and250-link first window
  of 278 links, full titles and keyboard/touch controls retained.

The scenario also checks real shader execution without page/shader errors,
spring/context per-vertex alpha parity, adaptive degradation/recovery, forced
colors restoring context alpha and disabling halos, reduced-motion pause, and
lazy dependency-phase disclosure (zero queued changes is shown without implying
completion). No private data, physical-phone or live-vault performance claim.

Independent graph reviewer found no blockers in source or screenshots. A minor
leader-crossing observation was resolved by painting every leader before every
backed label. Graph reopen now resets the lazy progress disclosure. The final
affected label/build/browser commands above cover those source adjustments;
status formatting tests are reused unchanged. No extra broad checks were added.

Final tested source SHA-256 fingerprints:

```text
5cfd8ce97c01e0fdd174fd349a29fea593cd1b4a36789a7a4414947c79fac6a7  static/src/graph-labels.js
191c153c9e00425a3750cb502f05eb23156dc96f8a6c1c0cb0e7d273ee68b7c2  static/src/graph-index-status.js
292d11ff2cebebb77d41fd4e263b753b2b597baaeaba83df68e5fec954659899  static/src/graph-view.js
38ce149c0cbd42482f75b5b28a70893390047941674d7af921a995f0d32ed605  static/src/graph-layout.js
b3618fb9c4bec94e3bc6fe6fb8a78cabfcfb5c3fb6aa56fe4c654c8bd3a0c259  static/src/graph-physics.js
9884c09fb3ba65aef7a3a0d26a11145716ac52aeadc38304fb5f6d485aa9439f  static/src/graph-controller.js
f36181ac985f90aa718d1cd6cabfdbbd69d01205b662d587fc695f8b3b979a99  wiki/templates/wiki/graph-panel.html
2aa32f4fa7c40ea6c359ef3bfc051a7304eb8e7baf79b32457bce80a57517eef  static/graph-controller.js
```

Owner clarification: visible node rows in the earlier screenshots were imposed
only by the synthetic fixture. The final visual fixture uses irregular crowded
clusters and passed the same focused scenario. Production retains its existing
free 3D force layout; no grid alignment or visual grid was added. App source and
its recorded hashes were unchanged by this fixture-only adjustment.
