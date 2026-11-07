# Issue 124 mobile graph evidence — 2026-11-07

## Scope and diagnosis

Base commit: `846f2773cc568780dc468f0b49f52282e70ca3b4`; shared working tree
on `fix/123-124-graph-recovery-mobile`. No live wiki was opened or changed.
Browser fixtures, index and SQLite storage were isolated under
`/tmp/backstory-issue-124` and `/tmp/backstory-issue-124-firefox` on ports 8874
and 8876. Node 22.12.0, Python 3.14.4, Playwright 1.64.1, managed Linux.

Before changing application code, the new phone regression reproduced the
owner's Menu → Graph overlay at 390×844 with touch enabled. Computed graph
sidebar properties were `position:fixed`, `z-index:6`, `padding-top:112px`,
width 352px and height 844px. The screenshot showed the opaque sidebar covering
the map and most of Close graph. The test failed on the sidebar's fixed
position. The responsible selector was `.note-page.chrome-open aside`, which
applied the navigation drawer's layout to the graph's semantic aside.

All shell navigation-aside rules now target `.app-layout > aside`. The graph
sidebar remains normal document flow. On the final populated Chromium fixture
at 390×844 it was `position:static`, `z-index:auto`, `padding-top:0px`, width
372px and height 305.3125px. At 320×568 its width was 302px. Height depends on
the selected note's evidence and is no longer tied to the screen.

## User-visible behavior

The existing control strip is inside a native Graph controls disclosure. It
starts collapsed on narrow or short screens and open on desktop. Filters,
Map controls and Graph settings/Forces retain their native disclosures. Scope,
local depth, status and the Connection list button remain outside the collapsed
controls. The fallback button stays available for focus after leaving search;
without JavaScript it stays hidden. Disclosure summaries have 44px minimum
touch targets. Scope/depth/filter controls, loading actions, retry and motion
behavior remain available inside the control disclosure. Existing graph
header positioning already kept Close graph sticky once the erroneous overlay
was removed; no dialog close/history/editor guard behavior was changed.

## Selected verification

The smallest meaningful checks were the new mobile browser scenarios, followed
by existing graph controls/navigation scenarios because the new disclosure and
scope/list placement affect their shared markup. Passing these establishes
phone layout, touch access, close hit testing, fallback focus and those existing
graph interactions. This is focused evidence, not a full-suite/release pass.

Commands used the following prefix (Firefox used its corresponding runtime and
port):

```sh
BACKSTORY_BROWSER_RUNTIME=/tmp/backstory-issue-124 BACKSTORY_BROWSER_PORT=8874 node_modules/.bin/playwright test
```

| Selection / change prompting the run | Result | Duration |
| --- | --- | --- |
| `tests/browser/graph-mobile.spec.js --grep 'at 390px'`, before application fix | Expected failure: sidebar is fixed | 0.886s test |
| `tests/browser/graph-mobile.spec.js`, first disclosure/selector fix | 3 passed | 6.4s |
| `tests/browser/graph-mobile.spec.js tests/browser/graph-controls.spec.js tests/browser/graph-navigation.spec.js`, after moving Connection list outside disclosure | 16 passed | 27.0s |
| `tests/browser/graph-mobile.spec.js --config=playwright.firefox.config.js --project=firefox`, first cross-browser check | 1 passed, 2 assertion failures: Firefox represented a 44px target as 43.999998px | 10.5s |
| Same Firefox selection after rounding the target measurement and indexing the synthetic two-note fixture | 3 passed | 8.6s |
| `tests/browser/graph-mobile.spec.js`, final indexed fixture and assertions | 3 passed | 7.6s |

Cumulative selected browser execution: approximately 61 seconds, plus local
server setup. An initial sandbox server start failed with `Operation not
permitted`; the isolated browser servers then ran with approved sandbox
escalation. An initial Firefox invocation used ambiguous `--project firefox`
argument syntax and selected no tests; corrected to `--project=firefox`.

The final three mobile scenarios cover 390×844 and 320×568 portrait, 844×390
landscape, Menu → Graph and direct `/graph/`, indexed saved notes, closing after
opening filters/map/force settings and scrolling, target hit testing, collapsing
controls, lack of horizontal overflow, editor focus restoration and direct-page
WebGL failure with connection-list keyboard focus. Chromium exercised the map;
managed Firefox exercised its automatic connection-list fallback. Each test
uses `hasTouch:true` and taps the disclosures and close control.

The 13 existing Chromium controls/navigation results are reused after the final
mobile-test-only fixture/assertion refinement. They cover dirty-draft guarded
navigation, caret/mode restoration, two-Escape behavior, reduced motion,
no-JavaScript server evidence, force settings, depth, continuation, scope and
request supersession. They were not rerun just to prepare this handoff.

Application assets were built before browser testing. The parent initially
compiled the graph controller with `target=es2020`, then restored the canonical
build without that optional target; application source remained unchanged.
Candidate release evidence must use the canonical build and exact candidate
commit rather than treating these focused working-tree results as a release
receipt. The parent owns that gate, independent review, merge and publication.

Physical phones, Safari/iOS, browser address-bar expansion and an on-screen
keyboard were not available. Desktop touch/viewport emulation does not establish
those behaviors.

## Retained artifacts and source state

Before screenshot and trace:
`/tmp/backstory-issue-124/evidence-before/menu-graph.png` and `trace.zip`.

Final Chromium screenshot directory:
`/tmp/backstory-issue-124/reports/browser-artifacts/graph-mobile-Menu-graph-le-085c0-reachable-controls-at-390px/`
contains `menu-graph.png`, `landscape-graph.png` and
`sidebar-computed-style.json`. Other test output directories retain the small
phone and direct connection-list screenshots. Firefox output is under
`/tmp/backstory-issue-124-firefox/reports/browser-artifacts/`.
These images contain only disposable synthetic notes.

Final tested source SHA-256 values:

```text
48e94d164378ee5cd4633b5e4af764c4e4e2ac672e0cec7c9f83d3d6c8e355d8  static/src/app.css
42d249151c2297265d8848e4cad8306d710ed44fa3477ff5876903fb4d1b21ea  static/src/graph.css
e5773ab1afc88649e827866a340997d43cf9f5aac4337db3f2d199950bf5fd95  static/src/graph-controller.js
7667635354ea4e86d221f3f507d84695aabfc965e29efd29281c2e54bc599eee  wiki/templates/wiki/graph-panel.html
500a9d18c38f8a52e5ddfdf215cd9f7db750dcc8d7e869c23ebe07f30e1e44a1  tests/browser/graph-mobile.spec.js
50b68318fdd4adc25f2402475094cd3dedd5b40ec0c66cfbc5320d1b2b6420b7  tests/browser/graph-controls.spec.js
```

`git diff --check` passed. No commit, branch, merge or publication action was
performed by this mobile subtask.
