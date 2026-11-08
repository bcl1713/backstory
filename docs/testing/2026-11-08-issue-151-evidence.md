# Issue #151: immersive graph workspace

Implemented on `issue-151` over `c21262bd4f7877b2829e244776987cf6f2e6f49a`.
The [input manifest](2026-11-08-issue-151-inputs.json) identifies the source,
templates, packaged assets, tests, lockfiles and browser configuration used.
Environment: Node 22.12.0, Python 3.14.4, Playwright 1.64.1; existing dependencies.
Every browser run used a distinct disposable synthetic root and loopback port.
No live notes/settings, remote branch protection or Actions configuration changed.

## Result

- Viewport canvas with compact Find/Controls/Evidence/list actions and concise
  selected identity, scope/count/status. Controls, source evidence/index progress
  and Help use dismissible layers; phone sheets occupy at most 52svh.
- `/` and `g/` find in the authorized loaded snapshot. Typing/cancelling does not
  filter, request data, change selection or opening root. A result expands and
  selects locally, including notes outside the current local exploration.
- Filter form edits remain drafts until Apply; refresh, brackets and scope
  controls use committed parameters. Truthful partial/boundary/error reporting
  remains. Find exposes its loaded/filtered/incomplete scope and bounds results.
- Layers have visible dismissal, focus return, graph-scoped `o`/`e` toggles and
  Escape precedence. Hints retain `f` and their existing alphabet. Back, guarded
  note opening, editor caret/mode, list fallback and reduced motion remain.
- Labels avoid marks, other labels and crossing leaders, retain valid previous
  slots, and bound leaders to 100 screen pixels. Omitted titles never remove
  graph records. Selection remains named in the compact status if the local
  canvas is too crowded for its title. Coincident state roles share one outline
  with focus/current/root accents and explicit accessible role descriptions.
- Evidence paths/counts/actions occupy separate rows in one scrolling sheet.
  Source disclosures and keyboard focus survive successful revalidation; hidden
  Find results and selected-path attributes clear on suspension/revocation.

## Checks and reused evidence

These are combined focused results, **not a fresh full-suite or release-gate pass**.
Passing checks were not rerun merely for review, commit or this report.

| Check | Actual result |
| --- | --- |
| `npm run build` | Passed after final source/CSS changes; committed graph/controller, graph CSS and lazy launcher shell assets rebuilt. |
| `node --experimental-test-isolation=none --test tests/formatter/graph-labels.test.mjs tests/formatter/graph-renderer.test.mjs` | 14 passed, 0 failed. Reused after subsequent controller/template/CSS-only edits; label/renderer sources stayed unchanged. |
| Chromium: `graph-immersive`, `graph-readability`, `graph-navigation`, `graph-mobile`, `graph-outgoing`, `graph-exploration`, `graph-query-recovery`, `graph-controls` | Initial run: 36 passed, 4 failed in 1.2m. The three focus/selector assumptions and old all-priority-label expectation were corrected. Unaffected passes retained. |
| Chromium focused follow-up, `-g 'immersive layers\|Find never\|Find expands\|revalidation preserves\|selected identity\|Inspect returns\|hidden Find\|cumulative exploration\|dense phone\|local depth changes'` across the affected four files | 13 passed in 26.6s, including all four prior failures and four new review regressions. |
| Chromium: `graph-snapshot.spec.js graph-visual.spec.js` | 7 passed, 1 failed in 24.4s. The keyboard fixture assumed an arbitrary seeded target was always right of the root; fixed by giving that synthetic fixture explicit screen positions. |
| Final Chromium: immersive layers at 1280/390/320, direct phone no-WebGL, pointer/orbit/drag/cancel scenario | All 5 passed in 13.3s after shorter sheets/native return link and fixture change. Other passing behavior evidence above remains applicable. |
| Firefox: immersive 1280/390 and mobile Menu/direct fallback | Both mobile/fallback scenarios passed. Both rendered-map attempts found no WebGL and failed on hidden-map bounds; this is the executor's previously documented Firefox limitation, not evidence for rendered Firefox output. Map-only tests now explicitly declare that prerequisite. |
| Firefox, repository Firefox config: `graph-controls.spec.js -g 'local depth changes'` | 1 passed in 6.0s; brackets preserve coordinates/camera through the supported list fallback. |
| `git diff --check` | Passed. |

The first Node test command with default subprocess isolation was blocked by the
sandbox without useful child diagnostics. In-process Node test isolation exposed
the intended regressions: distant leaders and stacked coincident boxes both
failed, then passed after changes. Browser server startup initially required
approved outer execution to bind localhost; no policy change was made.

Review regressions independently reproduced lost source disclosure/focus on
refresh, a detached Inspect opener, hidden result identities after suspension,
and missing persistent selected identity before their fixes. The corresponding
focused follow-up passed. The visual-viewport test simulates keyboard height
changes and checks unchanged canvas bounds, camera, coordinates and selection;
it is not a physical mobile keyboard test.

Logs and traces are retained at `/tmp/backstory-151-{accept,followup,remaining,
layout-final,firefox,firefox-depth,review-red,review2-red}*`. There are 52 distinct
Chromium browser scenarios with applicable passing evidence across these focused
runs, plus three Firefox fallback scenarios. Motion benchmark tests and backend
suites were not run: physics, traversal and transport schemas were unchanged.
No merge candidate, full release gate, merge or publication is claimed.

## Synthetic visual evidence

| View | Before | After |
| --- | --- | --- |
| Desktop, 1280 × 900 | [Before](../screenshots/graph/issue-151/desktop-before.png) | [After](../screenshots/graph/issue-151/desktop-after.png) |
| Phone, 390 × 900 | [Before](../screenshots/graph/issue-151/phone-before.png) | [After](../screenshots/graph/issue-151/phone-after.png) |

Also retained: [320px canvas](../screenshots/graph/issue-151/phone-320-after.png),
[desktop evidence](../screenshots/graph/issue-151/evidence-desktop.png), and
[phone evidence](../screenshots/graph/issue-151/evidence-phone.png). These contain
only generated notes. Before images use the unchanged `c21262b` graph sources in
`/tmp/backstory-151-before-src` with the same synthetic topology and camera
operations. Its app/graph bundles built successfully; an unrelated Mermaid
builder rejected symlink-resolved vendor paths, so already-built unchanged
renderer assets were copied for the screenshot host. This is screenshot setup,
not a baseline full-build receipt. After screenshots use final graph assets.

## Independent review

A separate reviewer read the implementation and inspected synthetic desktop and
phone images. It found three P2 issues: hidden Find identities after invalidation,
a removed Inspect focus destination, and the missing selected-title fallback.
All were fixed and covered by the regressions above. It also confirmed readable
evidence rows and recovered canvas width. Review did not run tests. Final small
CSS/standalone-link adjustments were checked by the author and affected browser
scenarios; no claim of independent exact-merge review is made.

Remaining limits: no physical software-keyboard test, no Firefox WebGL in this
executor, and no release/candidate validation. These do not replace the required
candidate gate and independent review before a future merge.
