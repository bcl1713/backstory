# Issue 119 implementation evidence

Source: uncommitted #119 changes against `dev` `eb57939796d841ec8c0c41d2b7582d91a54c39a0`, 7 November 2026. Parent owns integration and release. Requirements: https://github.com/bcl1713/backstory/issues/119 . Fixtures contain synthetic content only.

## Changes and deliberate bounds

- Graph settings → Forces stores only versioned browser/site presentation multipliers. Spring, repulsion and gravity each accept 0.25×–4× in quarter steps, default 1×; malformed/obsolete preferences fall back safely. Reset touches only these forces. Applying values retains positions, camera, selection and topology and respects deliberate pause/reduced motion.
- From a note, graph entry resets current center, two hops and search focus. Escape flushes a pending search then returns to navigation; the existing guarded close restores the note/editor. Navigation-only brackets and labeled touch buttons change one-to-eight real shortest eligible explicit-link hops. Filters affect output membership, not the distance through eligible bridge notes. Existing SQL/candidate/eligibility limits remain; incomplete traversal is a sticky partial state.
- Whole wiki automatically follows bounded continuations, including empty pages; nodes and directed aggregate identities merge without adding repeated counts. The controller yields between requests and retains camera/layout. Loading pause/resume is independent of motion. Retry/restart, repeated/cyclic cursor detection, incompatible version rejection, cancellation and explicit partial states remain visible.
- Client limits remain 10,000 notes/30,000 edges, with an additional 10,000-continuing-page work bound. Unconsumed continuation can open a new explicitly partial window or filters can narrow the scope. No private graph data is persisted.

## Smallest meaningful verification and results

The selected checks establish preference validation and live stable forces, real bounded depth/security, canonical accumulation, cancellation/lifecycle, and usable desktop/narrow controls. No full application/release gate was run.

| Command | Observed result and scope |
| --- | --- |
| `.venv/bin/pytest tests/integration/test_graph_queries.py tests/integration/test_graph_tools.py -q` | 48 passed, 9.69s. Existing security, storage, epoch, paging and query limits plus new chain/cycle depth and filtered eligible-bridge coverage. |
| `.venv/bin/pytest tests/integration/test_graph_tools.py::test_graph_depth_http_bounds_and_tool_schema tests/integration/test_graph_tools.py::test_graph_tools_reject_invalid_arguments_before_querying -q` | 11 passed, 0.78s. Later-added HTTP depth 1/3/8 acceptance and 0/9 rejection. Earlier unaffected Python evidence retained. |
| `node --test --experimental-test-isolation=none tests/formatter/graph-forces.test.mjs tests/formatter/graph-pages.test.mjs tests/formatter/graph-layout.test.mjs tests/formatter/graph-renderer.test.mjs` | 22 passed, 0.46s. Preferences, persistence/reset/storage denial, live reheat/coordinate identity, unique pairs, finite extremes, existing stability/spatial budgets, camera and renderer batches. |
| `node --test --experimental-test-isolation=none tests/formatter/graph-pages.test.mjs` | Seven passed after adding the explicit continuing-page work limit. Reuses unchanged force/layout/renderer evidence; combined evidence covers 23 distinct Node tests. |
| `BACKSTORY_BROWSER_RUNTIME=/tmp/backstory-119-browser BACKSTORY_BROWSER_PORT=8779 node_modules/.bin/playwright test tests/browser/graph-controls.spec.js tests/browser/graph-navigation.spec.js tests/browser/graph-visual.spec.js` | 19 passed, one existing refresh-position regression failed; 40.2s. New controls seven and existing editor/navigation six all passed; renderer/security six passed. |
| Same Chromium runner, `tests/browser/graph-visual.spec.js --grep 'orbit changes'` | One passed, 4.2s after correcting pending eligibility-version fallback for older synthetic fixtures lacking that field. Reused the other 19 unchanged passing scenarios; this is combined focused evidence, not a fresh full-suite pass. |
| Same Chromium runner, `tests/browser/graph-controls.spec.js --grep 'loading pause\|rapid scopes' --output /tmp/backstory-119-lifecycle` | Two passed, 6.2s after strengthening in-flight close/reopen and automatic-loading camera/selection assertions. |
| Same Chromium runner, `tests/browser/graph-controls.spec.js --grep 'live low' --output /tmp/backstory-119-final-screenshots` | Two passed, 7.5s after moving tuning into the existing desktop sidebar. Both viewport widths exercised paused preservation, live individual force effects, reset, persistence and reduced motion. |
| `BACKSTORY_BROWSER_RUNTIME=/tmp/backstory-119-firefox BACKSTORY_BROWSER_PORT=8780 node_modules/.bin/playwright test --config playwright.firefox.config.js tests/browser/graph-controls.spec.js` | Seven passed, 17.1s. Firefox has no WebGL in this environment; this checks accessible list/navigation, loading, real simulation tuning and saved preferences rather than claiming Firefox graphics acceptance. |
| Same Firefox runner, `tests/browser/graph-controls.spec.js --grep 'live low\|loading pause\|rapid scopes' --output /tmp/backstory-119-final-firefox` | Four passed, 12.3s after the final sidebar layout and strengthened in-flight lifecycle assertions. Retained unchanged Firefox evidence for the other cases. |
| Same Firefox runner, existing `tests/browser/graph-navigation.spec.js` within the earlier graph run | Six passed. Evidence remains applicable; those test inputs did not change. The earlier run also showed three new tests incorrectly assuming WebGL; they were adapted to the existing list fallback and the subsequent seven-test result above resolved those failures. |

The new browser cases cover current note/two-hop entry, typing brackets in search, Escape, expansion/contraction, stable center/camera/selection, delayed superseded depths, automatic disconnected/duplicate/empty pages, loading pause/resume, expired/repeated cursors, mixed versions, in-flight close/reopen, and persistence after reload. Existing editor/browser checks preserve ordinary Insert text, no graph note writes, draft guards, exact caret return, no-JavaScript output, touch cancellation, hidden/context cleanup and private evidence revocation.

Low/default/high UI tuning changes each force independently, settles with the existing bounded algorithm and records finite coordinates plus link distance/graph radius. Both widths verify stronger springs shorten linked distances, stronger repulsion increases distance and stronger gravity reduces radius. Paused tuning preserves exact coordinates; camera remains unchanged. Screenshots and JSON measurements are synthetic.

## Build inputs and environment

Used existing `node_modules` and `.venv`; no dependencies changed. Local Node is v22.12.0, Three.js0.183.2, Playwright1.64.1. The repository release gate separately requires its pinned Node version. Node child-test isolation was not functional in this sandbox; the explicit non-isolated Node runner executed the actual named tests. Browser servers required approved execution outside the filesystem sandbox for local sockets.

Built only affected entries with the existing esbuild package: graph-controller.js/graph.css as bundled minified ESM; shell.js/wiki-tools.js as existing bundled minified script entries. Checked JavaScript syntax and `git diff --check`. Full renderer asset build and release gate remain publisher-owned; existing unchanged renderer artifacts were reused.

## Visual review and remaining limits

Graph settings moved into the existing selected-note sidebar so desktop force tuning stays alongside the graph. Narrow layout keeps settings below the map, uses full-width controls and scrolls without horizontal overflow. Final synthetic force screenshots are retained under `/tmp/backstory-119-final-screenshots`; earlier immutable lifecycle evidence is under `/tmp/backstory-119-lifecycle`.

Synthetic Chromium WebGL establishes this local desktop/narrow behavior, not real-device performance or deployed-wiki validation. Firefox uses the accessible fallback in this environment. Resource-limited neighborhoods/windows remain explicitly partial; whole-wiki response limits and authorization were not relaxed. No publication, production graph, real note data, full gate or new benchmark campaign was used.

Cumulative verification remained below 15 minutes (approximately five minutes including startup, observed failures and focused fixes). Passing evidence was reused for unchanged inputs.

Independent read-only review of the final tracked and untracked changes found
no critical, important or minor findings requiring a change. The reviewer checked
the backend eligibility/budget boundaries, controller cancellation and scope,
canonical paging, forces/preferences, generated bundles, tests and retained
desktop/narrow screenshots. The coordinating agent also inspected the final
screenshots. Real-device/private-wiki performance, Firefox WebGL appearance and
the publisher's subsequent full release gate remain outside this focused review.
Combined focused evidence covers 50 distinct Python, 23 JavaScript, 20 Chromium
and 13 Firefox scenarios; it is not a fresh complete-suite pass.
