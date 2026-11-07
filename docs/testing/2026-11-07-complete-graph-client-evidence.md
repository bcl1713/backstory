# Complete graph client evidence — 2026-11-07

Working tree based on `90efc8cc61938cef1a0d6efff0d53d036da07421`, branch
`fix/123-126-127-complete-graph-bfs`. Node 22.12.0, existing frozen npm tree,
Playwright 1.64.1 (Firefox 1555 and Chromium 1248). Disposable synthetic browser
roots only; no live notes or settings were read or modified.

## Selected scope

Graph page unit checks establish deduplicated incremental accumulation beyond
10,000 nodes, 30,000 edges and 10,000 continuing pages, cursor cycle/mixed stamp
rejection, and honest handling of incomplete index vs transient discovery.
Browser controls/recovery checks establish automatic local/whole/empty-page
continuation, loading pause vs motion pause, obsolete depth/filter/closed-view
protection, resource/error distinctions, force settings and camera preservation.
Lists display at most 250 notes/links per local window; all accumulated records
remain accessible. List navigation makes no server requests.

| Command / state | Result |
| --- | --- |
| `node --test tests/formatter/graph-pages.test.mjs` before accumulation fix | Generic child `ERR_TEST_FAILURE` in this sandbox; direct invocation used to obtain assertions |
| `node tests/formatter/graph-pages.test.mjs` before fix | 5 pass, 2 expected failures at former node/edge and page ceilings (0.45s) |
| Same direct command after incremental accumulation fix | 7 passed (0.04s) |
| `node --test --experimental-test-isolation=none --test-name-pattern='empty discovery work does not' tests/formatter/graph-pages.test.mjs` after adding transient discovery test | 1 passed (0.014s); earlier seven unchanged results reused |
| `npm run build` before red browser probe | Passed; stale built controller and newly removed template controls made that probe unsuitable as a behavior regression |
| Focused Firefox automatic-local red probe | Initial server sandbox denied process startup. Approved outer execution ran; failed with empty summary from old bundled controller/new template mismatch. This is not claimed as an intended behavioral red test |
| `npm run build` after final client/physics integration | Passed (under 1s); built graph assets retained |
| `BACKSTORY_BROWSER_RUNTIME=/tmp/backstory-123-126-127-ui BACKSTORY_BROWSER_PORT=8888 npx playwright test --config=playwright.firefox.config.js --project=firefox tests/browser/graph-controls.spec.js tests/browser/graph-query-recovery.spec.js` | 15 passed (26.8s) |
| `BACKSTORY_BROWSER_RUNTIME=/tmp/backstory-123-126-127-chromium BACKSTORY_BROWSER_PORT=8889 npx playwright test tests/browser/graph-controls.spec.js tests/browser/graph-visual.spec.js -g 'selected-root BFS\|progressive 3D graph'` | 3 passed (8.7s) |
| `BACKSTORY_BROWSER_RUNTIME=/tmp/backstory-123-126-127-map-review BACKSTORY_BROWSER_PORT=8890 npx playwright test tests/browser/graph-controls.spec.js tests/browser/graph-visual.spec.js -g 'selected-root BFS\|obsolete filter\|retained graph is cleared\|orbit changes\|phone map'` | 7 passed (11.6s). Dense screenshots rerun because filters/controls were collapsed to reveal full map; added privacy/cancellation checks address automatic continuation integration risk |

Total client verification under two minutes. No full-suite or release gate was
run. Backend evidence is separate. The focused BFS/physics evidence is retained
in `2026-11-07-bfs-springs-evidence.md` and reused without another unit run.

## Visual review

Firefox lacks WebGL here; its list fallback screenshots and interaction
assertions passed. Chromium exercised real WebGL, progressive append, context
loss/restore, orbit/drag, themes and portrait behavior. Actual desktop/portrait
BFS and previous-all-pairs comparison screenshots were inspected from
`/tmp/backstory-123-126-127-map-review/reports/browser-artifacts/`.
The two-hub fixture retains all 120 notes / 237 directed records: selected root
activates 119 equal springs, second hub activates 118, with paused coordinates
and camera unchanged during reselection. The experiment still displays dense
hub topology; it does not claim to remove screen clutter or manufacture groups.

The renderer retains all records in shared GPU batches; preparation/upload is
O(nodes + edges). Real browser/GPU memory limits remain possible and are explicit
rather than a fixed product cutoff. Large physics steps yield across frames.
No claim is made about performance on the owner's physical phone or live vault.

## Tested client hashes
79f477484a201f8748d520b570313db11fcb9bfd10458f91f80a25ec4bcadd5b  static/src/graph-controller.js
cdf520f3d5467ec59b32da1c11593561f66730649a11c23152920de54dcdcf8e  static/src/graph-pages.js
cb642c42f44051a77f5e2c7561cf1a2e3cd6800d9f119a0e8762e18c317f78ee  static/src/graph-physics.js
f146773a2714aecff649764798af1cd2ca066c959a5d33d13970f1d578f2e8c9  static/src/graph-view.js
044dbe7264809f1d06af1242f84e1b2383a482bda298b8002b9eb2148d6d87e8  static/src/graph.css
deaffe0e2ed1ac0f14d53f10c0ddb718b6c4218e04217792b0e4e7fc940b5d9c  static/graph-controller.js
304aae7d3de1b4ae25465cfd489a0d7cc3a7d959b33dc467a0d36469ace4ce9c  static/graph.css
df1798ec80a3001be7fd371737427a0fb2af71baaaa832e6a3fa2d35ea49b8ec  wiki/templates/wiki/graph-panel.html
a472137e5a6d686fb42dd8d9c64312467e94479a3d494676455c214aca31e008  tests/browser/graph-controls.spec.js
8c98cf2b18f407cb71f9a085080f70aee347b80f9d149b6b679fc1d2cbe43683  tests/browser/graph-visual.spec.js
9da0abc8c96aa111d2d9c8723af6542d310f135a6a4d661bb4b726f16acf910d  tests/formatter/graph-pages.test.mjs

## Real backend/browser integration

After migration 0010 and the new traversal source were available, the following
focused real-HTTP scenarios were selected because earlier controls scenarios
mocked graph responses. This establishes navigation/tool agreement, ordinary
small two-hop output, dirty-draft guards, keyboard/caret restoration,
no-JavaScript output, missing-WebGL fallback and phone controls/layout.

```sh
BACKSTORY_BROWSER_RUNTIME=/tmp/backstory-123-126-127-integrated \
BACKSTORY_BROWSER_PORT=8891 npx playwright test \
  --config=playwright.firefox.config.js --project=firefox \
  tests/browser/graph-navigation.spec.js tests/browser/graph-mobile.spec.js
```

**9 passed (18.4s).** These normal-path results predate the subsequent targeted
backend soft-deadline forward-progress correction; they cover unchanged ordinary
HTTP/UI behavior. The backend worker's new slow-setup regression covers that
correction. They are combined focused evidence, not a fresh whole-suite pass.
No client source/build changed after the recorded asset build and browser runs.

## Keyboard focus correction

The new loaded-list navigation initially replaced its focused Next button with
a disabled Next button on reaching the last window, losing keyboard focus.
A new assertion reproduced this failure in the desktop automatic-local scenario
(`/tmp/backstory-123-126-127-focus-red`, 7.1s). Navigation now retains the user's
direction across DOM replacement and focuses the enabled opposite button when
the preferred button is disabled. This also preserves nav focus during appends.

After this source change, `npm run build` passed (under 1s), then only the two
affected desktop/portrait scenarios were rerun:

```sh
BACKSTORY_BROWSER_RUNTIME=/tmp/backstory-123-126-127-focus-fixed \
BACKSTORY_BROWSER_PORT=8893 npx playwright test \
  --config=playwright.firefox.config.js --project=firefox \
  tests/browser/graph-controls.spec.js -g 'local scope automatically'
```

**2 passed (6.5s).** Earlier loader, BFS, navigation and recovery evidence is
reused for unchanged behavior. Final controller/bundle/test hashes supersede
those three entries above; other tested hashes remain unchanged.

```text
859ed03be4a8478caf2f436076b7719a588002947acb033fc46b31ce0c35f8df  static/src/graph-controller.js
b3b47efc529c1c48860d3c8fe98629c5811c0d773e2a9fee343a97fa0b1682b0  static/graph-controller.js
ba516fc858a8ee2717ee06b440fe090dee7628f661a3656944cff534b2ecadc1  tests/browser/graph-controls.spec.js
```
