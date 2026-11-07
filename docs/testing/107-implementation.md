# Issue 107 implementation evidence

Source base: `89f8832c7b4d9817591508f5d5065655d9d1ba68`; feature branch
`feat/107-graph-exploration`. Evidence describes the committed implementation's
unchanged application inputs; documentation/commit preparation did not rerun
passing checks. Synthetic wiki/account data only. No live wiki was redeployed.

## Results

| Selected checks | Result and what it establishes |
| --- | --- |
| `.venv/bin/pytest -q tests/integration/test_graph_index.py tests/integration/test_graph_queries.py` | 30 passed in 8.25s. No-op identities/cursors, provenance-only updates, affected/negative/ambiguous/exact-path dependencies, retained safe sources, policy version, high-degree one-hop/induced edges, filtered centers, empty dirty windows, starvation avoidance and publication cursor invalidation. |
| `.venv/bin/pytest -q tests/integration/test_indexing.py tests/integration/test_worker_concurrency.py tests/integration/test_worker_lifecycle.py::test_real_process_restart_resumes_full_representative_corpus` | 21 passed in 33.85s. Selected because resumable dependency verification and deletion share the worker scheduler. Includes queue overflow, serialization, deletion and real-process restart of 1,000 synthetic notes. |
| `tests/integration/test_graph_tools.py` | Combined focused evidence: 12 passed initially; the one failing no-JS provenance assertion passed in a targeted rerun after restoring its explanatory text inside About. Auth/read-only/no-store/schema bounds and shared canonical evidence preserved. |
| `node --test tests/formatter/graph-layout.test.mjs tests/formatter/graph-renderer.test.mjs` | 14 tests in two files passed. Finite 3D forces, 10,000-node bounded approximation, stable merge positions, perspective orbit/fit/zoom, hop falloff, bloom degradation/recovery/Off, real Three instanced/batched buffers and disposal. |
| `node --test tests/formatter/graph-pages.test.mjs` | Five tests passed. Canonical accumulation, repeated aggregate counts, empty continuations, incompatible epochs, client limits and page-local versus actual evidence incompleteness. |
| `npm run build` | Passed with pinned Three.js 0.183.2 bundled locally, including its MIT license. Rebuilt after affected source/CSS changes; final generated assets correspond to those inputs. |
| `playwright test tests/browser/graph-navigation.spec.js` | Six Chromium scenarios passed across focused runs. Keyboard/caret/Vim, dirty-draft guard, canonical list, evidence disclosure, reduced motion, phone graph-first/list fallback, missing WebGL, no-JS links and plain-text caret return. |
| `playwright test -c playwright.firefox.config.js tests/browser/graph-navigation.spec.js` | All six passed together in 12.2s. Same navigation/fallback contracts in Firefox. |
| `playwright test tests/browser/graph-visual.spec.js` | Seven Chromium scenarios passed across focused runs: 240 accumulated nodes/536 edges, disconnected node, empty continuing page, stable camera/selection, light/dark theme updates, bloom controls, context loss/restoration retaining the full list, escaped labels/no external requests, filter races, session/storage/policy revocation with late requests, orbit parallax, elastic neighbor motion, mouse/touch cancellation, refresh positions, list choice across reopen, and 200% text zoom reachability. |
| Selected existing accessibility, theme and homepage scenarios | Four passed in 19.8s combined initial integration run (which also included two graph scenarios). Desktop/phone primary navigation, collapsed secondary tools, keyboard disclosure, draft/history/theme preservation and Home identity. |
| Synthetic Django `makemigrations --check --dry-run` | No changes detected. Migration 0009 matches models. |

The browser commands used distinct `BACKSTORY_BROWSER_RUNTIME` synthetic roots and
ports 8867–8872, one worker; root-owned logs are `/tmp/107-*.log`. Runtime evidence:
`/tmp/107-index-evidence.md`, `/tmp/107-renderer-evidence.md`, and
`/tmp/107-review-evidence.md`, including backend/renderer SHA-256 inputs.
These are combined focused results, **not a fresh full-suite pass**.

## UI evidence and review

Inspected generated desktop dark/light and phone light/forced-colors screenshots,
then simplified the phone toolbar further. Inspected the final default phone graph
and 200% text-zoom list screenshots. The phone map remains principal at ordinary
text size; selected details sit below it, secondary controls fold, and Close stays
reachable. Light, dark and forced-colors labels/glyphs remain readable. Dense hubs
intentionally declutter labels; every loaded path remains in the list. Text zoom
is a browser-emulated accessibility check, not a real-device study.

Screenshots and task recordings are retained under:
- `/tmp/backstory-107-final-browser/reports/browser-artifacts/`
- `/tmp/backstory-107-focused-r3/reports/browser-artifacts/`
- `/tmp/backstory-107-zoom/reports/browser-artifacts/`

The [app-wide UX review](107-ux-review.md) inventories all requested journeys and
separates source-observed findings from design decisions. No user-research or
screen-reader study is claimed.

A fresh independent source review covered invalidation, retained-data privacy,
completeness, keyboard/focus and graphics lifecycle. It found and drove fixes for
candidate-page completeness, denial/in-flight response races, unavailable/policy
responses, filtered centers, raw dirty-window continuation and attachment shadowing.
Final review reported no remaining important findings; passing checks were reused.

## Failures resolved and limits

New meaningful regressions failed before their fixes. One tiny independent asset
probe confirmed the attachment-shadow defect before the bounded path verifier.
A browser run against a reused synthetic database stopped after three setup failures
because migration 0009 had changed during development; fresh final-schema databases
resolved that fixture problem. Two browser assertion failures were corrected: one
selector targeted multiple hidden code elements, and another omitted hidden folded
controls. The corrected affected scenarios passed; unrelated passing scenarios
were not repeated. The sandbox initially denied loopback binding; the same focused
server commands ran with approved execution permissions.

Source whitespace checks passed. The generated Three.js bundle preserves upstream
GLSL string whitespace; a raw `git diff --check` flags that vendor shader text.
No shader string rewriting or weakened application checks were introduced.

Backend reconciliation observes recorded dependency paths in bounded batches;
external-writer detection retains the existing reconciliation window. Requests do
not scan notes or attachment trees. A two-hop response can remain explicitly
limited; deliberate one-hop expansion and global pagination reach the remainder.
At the client memory budget, continuation explicitly starts a new partial window.

Actual assistant-host WebMCP invocation, a physical phone/assistive-technology study,
and operator deployment remain separate. No performance benchmark campaign was
added. The automatic publisher owns the required full release gate on the resulting
merge commit; no duplicate premerge complete gate was run and no receipt was borrowed
between commits.
