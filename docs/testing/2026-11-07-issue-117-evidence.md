# Issue #117: one automatic Firefox runtime

Base: `eb57939796d841ec8c0c41d2b7582d91a54c39a0` (`dev`). Isolated
implementation checkout: `/tmp/backstory-parallel-20261107/issue-117`.
Synthetic test notes only; no original-user-note acceptance or live wiki access.

## Coverage inventory and decision

Keep the supported Playwright-managed Firefox for the automatic gate. The exact
`@playwright/test` **1.64.1** dependency and `package-lock.json` select patched
Firefox **157.0**, browser revision **1555**, on this Linux x86_64 executor.
Playwright's patched browser protocol is part of its integration: substituting
stock Firefox through `executablePath` does not preserve its supported behavior.
Keep the normal installer, `npx playwright install firefox`, with the locked
package; no system-browser substitution or blanket Chromium run is introduced.

| Existing suite | Concrete failure modes / assertions | Consolidated owner |
| --- | --- | --- |
| `code-preview.spec.js` (9 cases) | Highlighted inactive code, literal unknown/tilde/unfinished fences, inert script/image payloads, no external requests, exact source entry, arrow/Vim entry from both directions, selection/edit/undo, raw mode, phone overflow, tall-block pointer editing. | Unchanged `firefox-code` lane, same runtime. |
| `renderer-browser.spec.js` (7 cases) | Tall, tiny, branching and converging Mermaid; tall/tiny Graphviz; Vega-Lite baseline. Ready protocol, sandbox exactly `allow-scripts`, SVG/label containment at 390/1180, no host overflow, connected iframe survives resizing, exact source after entry and re-render. Synthetic stages, screenshots and failed SVG evidence. | Unchanged renderer lane; converging Mermaid input now shared with profile and stock probes. This subsumes stock Graphviz/Vega ready/sandbox baseline probes. |
| `diagram-preview.spec.js` (19 cases) | Fixed local frame URLs/assets, no private-canary/external request or unsolicited save; unsupported source retained; source/raw/plain/edit/undo/navigation cleanup; Vim/arrows and count/delete boundaries; max-two-frame allocation/replacement and scrolling remount; GET/draft preview hydration; disabled/failure source fallback without retries; editor/preview geometry; delayed-bootstrap cancellation, format rewrite refusal, 32-diagram generation replacement; responsive sizing without renderer requests; resize-observer cleanup. | Retained without removing overlapping fit checks; those remain distinct behavior assertions. |
| `diagram-clipping.spec.js` (6 cases) | Mermaid/Graphviz/Vega in editor and preview, 390/1180; bottom/right/document/main containment; tall final label visible, same iframe on resize, centering/host fit and margin, pointer source entry and fidelity. JSON geometry and viewport captures. | Retained renderer lane. |
| `diagram-diagnostics.spec.js` (20 cases) | Three engines, 390/1180, missing hello and sanitizer failures; bounded diagnostic code without private exception/URL leakage, cached fallback, keyboard source fidelity, no iframe after failure. Six rejected Mermaid attribute classes. Two captured Firefox exponent-coordinate fixtures become exact canonical viewBox/transform decimals with sandbox and source fidelity. | Retained renderer lane, including #85/#89 exponent regression. |
| `graph-navigation.spec.js` (6 cases) | Graph/search keyboard and Escape/caret/Vim restoration without saves; dirty-draft guards; canonical tools/list edges and technical disclosure; reduced motion/mobile/no-JS; missing-WebGL fallback; plain-text caret restoration. | Retained renderer lane. |
| Stock probe: 32 Mermaid combinations | Default DPR: widths 390/1180/2000; DPR 1.25:1180; DPR 1.5:1180/2000; DPR 2:1180; document fonts disabled:1180. Each crosses child CSS zoom 1/.9/.8/.7. Actual browser ready/sandbox; parent CSS zoom stays 1; active child's measured CSS zoom equals request. Schema/stage diagnostics and screenshot per case. | All 32 combinations move to five Playwright projects in `firefox-profiles.spec.js`. Separate processes retain Firefox preferences; device scaling is explicitly asserted in parent and child. Every row, screenshot and bounded schema is retained, with failed trace/diagnostics. SVG containment strengthens the old status checks. |
| Stock direct measurement regression (#90/#91) | `renderer_css_zoom` enters the supplied active iframe and restores parent even on failure, independent of stale messages. | Existing Python regression remains for optional Selenium helper. New mandatory browser regression removes/replaces the iframe while stale parent values remain and measures .7 directly in the new active child. |
| Stock runtime itself | Unpatched Firefox 155.0.1 / geckodriver 0.37.1 may differ from patched Firefox. | Explicit opt-in three-engine compatibility smoke at child CSS zoom .7, width1180. One profile, synthetic fixtures, ready/sandbox/direct child zoom, screenshots, schema/stages and cleanup remain. No second automatic install/suite. |
| HTTP sandbox/CSP boundaries | Authenticated fixed nonce shell, opaque `sandbox allow-scripts`, exact parent origin, denied non-shell/errors/disabled/revoked sessions, renderer opt-in independence, manifest/static boundary. | Existing `test_mermaid_frame.py`, `test_graphviz_frame.py`, `test_vega_lite_frame.py` remain in full Python gate. Browser suites retain sandbox, fixed URLs, no external requests and source/fallback checks. |

Counts refer to this base's selected files: 9 code + 58 renderer cases; the old
review's static count of 69 is superseded by the retained publisher's actual 67.
New profile coverage is five tests containing 32 asserted combinations. The two
old stock Graphviz/Vega baseline probes add no unique assertions to those already
selected; they remain useful in the optional unpatched-browser smoke.

Automated child CSS zoom and DPR/preferences do **not** establish Firefox browser
chrome/page zoom or acceptance of the original user's note. Those remain separate
work in #85. Chromium history diagnosis (#92) is also separate.

## Existing cost evidence (no benchmark campaign)

Reused source-identical successful publisher evidence:
`/home/oracle-worker/.local/state/backstory-publisher/jobs/dev-eb57939796d8-6gb3m827/evidence/`.
Its receipt covers `eb57939796d841ec8c0c41d2b7582d91a54c39a0`, started
18:11:51 UTC and completed 18:17:48 UTC on November 7 (357 seconds total).
These are historical baseline results, not tests of this implementation.

- `firefox-code.log`: **9 passed (13.1s)**.
- `firefox-renderers.log`: **58 passed (2.8m)**.
- `stock-firefox.log`: **34 renderer probes passed**. Adjacent stage file birth
  times and last-write times place install at roughly **5s**, stock execution at
  roughly **40s**. These filesystem-derived coarse intervals include orchestration
  and are not precise internal timers.
- `browser-install.log` is empty: Playwright's runtime was already cached; that
  run provides **no cold Playwright download duration**. Installed revision1555
  occupies approximately **310 MiB** on this executor.
- The retained stock install downloaded **87,372,544 bytes** of Firefox archive,
  **2,348,355 bytes** of geckodriver archive, and **551,210 bytes** of SHA256SUMS
  (about 90.3MB total), with **408 MiB** of retained tools/archive footprint.
  Selenium 4.52.0 was separately resolved by uv; its cold install cost is unknown.

Consolidation removes those automatic stock downloads, extraction, driver and
Selenium dependency. It retains the 32 geometry probes on the existing runtime;
it does not claim to save the entire old 40-second execution cost. Browser setup
and fixtures are shared rather than maintaining a second automation stack.

## Pins, updates and compatibility operation

Update the exact `@playwright/test` version and npm lockfile together. Inspect the
new locked `playwright-core/browsers.json` revision, install through its supported
installer, and run these selected Firefox lanes once for that browser update.
Record the revision/version, changed inputs and evidence. The lockfile retains
npm integrity hashes; browser archives use Playwright's revision-pinned official
installer, as before. Do not claim that npm's integrity hash hashes the Firefox
archive. A browser/renderer compatibility concern warrants the opt-in smoke;
ordinary unrelated publication retries do not warrant a duplicate browser run.

The optional stock probe keeps fixed version URLs, Mozilla's SHA256SUMS check,
a repository-pinned Firefox archive SHA256 and the pinned geckodriver SHA256.
Update installer URLs, digests and runtime version assertion together after
verifying the new upstream artifacts. Selenium remains explicitly pinned in the
opt-in command. The stock hash was derived from the retained verified artifact,
without another download.

```sh
bash scripts/install-stock-firefox.sh /new/external/stock-firefox-tools
BACKSTORY_BROWSER_RUNTIME=/new/external/stock-firefox-smoke \
BACKSTORY_BROWSER_PORT=18718 \
STOCK_FIREFOX_BINARY=/new/external/stock-firefox-tools/firefox/firefox \
GECKODRIVER_BINARY=/new/external/stock-firefox-tools/geckodriver \
uv run --no-project --with selenium==4.52.0 python tests/browser/support/stock_firefox.py
```

Use a new external directory and unused port; keep logs and reports. The helper
retains its scoped server/driver shutdown and cleanup errors fail the probe.
Automatic receipts use schema2 and require exactly the consolidated gates; legacy
schema1, missing, failed, extra or wrong-source evidence is rejected. Publication
and runtime-input-reuse changes belong to #116.

## Implementation verification

Selected checks establish the changed gate contract, exact-source receipt checks,
optional Selenium measurement restoration, and all selected Firefox behavior once.
No dependency installations, asset builds, full gate, Chromium suite or publication
are needed: application source and checked-in built assets are unchanged.

- Contract RED: `pytest tests/unit/test_local_ci.py -k 'plan_uses or receipt_' -q`
  produced three expected failures (old automatic stock stages/schema1), one pass.
- Focused Python: `.venv/bin/python -m pytest tests/unit/test_local_ci.py tests/unit/test_local_release.py tests/unit/test_stock_firefox_measurement.py -q`:
  **29 passed in 1.25s**.
- Browser initialization initially could not bind localhost in the restricted
  sandbox; authorized execution outside that sandbox resolved that environment
  restriction. Initial collection then rejected worker-scoped `launchOptions` in
  a describe group. Moved profile options into separate supported projects; no
  browser assertions had run in that failed collection.
- Firefox renderer lane:
  `BACKSTORY_BROWSER_RUNTIME=/tmp/backstory-117-renderers BACKSTORY_BROWSER_PORT=18717 npx playwright test --config=playwright.firefox.config.js`:
  **63 passed (3.3m)**. This is the 58 retained cases plus five profile tests
  asserting all **32** migrated combinations (12 default, 4 DPR1.25, 8 DPR1.5,
  4 DPR2, 4 document-fonts-off). Retained reports contain **32 per-case schema
  JSON files, 32 matrix screenshots, five measurement JSON files and the active
  replacement-frame screenshot**. Inspected the latter: synthetic flowchart
  is visible and source/editor status is unchanged.
- Firefox code lane:
  `BACKSTORY_BROWSER_RUNTIME=/tmp/backstory-117-code BACKSTORY_BROWSER_PORT=18719 npx playwright test --config=playwright.code.config.js`:
  **9 passed (12.4s)**.
- Reduced opt-in stock smoke, using binaries from the historical evidence above
  and `uv run --no-project --offline --with selenium==4.52.0` (same script and
  isolated runtime `/tmp/backstory-117-stock-smoke`, port18718): **3 passed**,
  one Mermaid/Graphviz/Vega-Lite at child CSS zoom .7. No downloads, installations
  or shared dependency changes. Screenshot/schema/row/stage evidence remains in
  that runtime's reports. Existing browser/driver cleanup completed successfully.
- `bash -n scripts/install-stock-firefox.sh` and `git diff --check`: passed.

Logs: `/tmp/backstory-parallel-20261107/issue-117-{renderers,code,stock-smoke}.log`;
collection diagnostic preserved as `issue-117-collection-failure.log` alongside
those logs. Runtime is the existing project Python3.14.4 virtualenv, Node22.12.0,
Playwright1.64.1/Firefox157 revision1555, original checked-in application assets.
Cumulative verification was under five minutes; no 15-minute checkpoint needed.
These focused results are **not** a new full-gate receipt. Local Node22.12.0
is within the application engine range; the release gate separately enforces
Node22.23.4. Browser/runtime packages were unchanged.

After the browser run, added `graph-controls.spec.js` to the main project's
selection to preserve concurrently implemented #119 acceptance. That file is
absent in this isolated #117 checkout, so this does not change the selected cases
verified here. #119 owns its new graph-control evidence; reuse it when combining
branches. No application assets or browser test bodies changed after the passing
runs. #116 will integrate the README runtime/gate passage and runtime-input
fingerprint changes; review schema2 and dynamic receipt helpers together.

Final staged non-documentation diff SHA256:
`5b24a9b80ee0216b53034d08ab1ab9d97c439ffb9a93a067be306a050570b557`.
Only this evidence record changed after that digest was taken.
