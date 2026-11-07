# Test usefulness and repetition review

## Scope and conclusion

Static review on November 7, 2026, starting from `a1e2faa`. The inventory covered
179 test files: 22 Python unit, 59 Python integration, 45 JavaScript/formatter,
and 53 browser specs. Python files were inspected structurally and questionable
clusters read alongside implementation; JavaScript and browser suites were
reviewed separately. Parameterization and loops expand these files into more
cases. File counts are the pre-cleanup inventory, not executed-test counts.

The suite contains obsolete CI tests and several opportunities to replace
expensive setup with focused checks. Much of the apparent overlap is valuable:
parsing, HTTP authorization, source preservation, filesystem races, browser
sandbox enforcement, and packaged behavior protect different boundaries.
There is no basis to declare every current assertion necessary, or to delete
whole active feature suites based on names or counts alone.

No tests, browser installs, builds, or benchmarks were run for this review.
Runtime rankings and time savings have not been measured. Existing historical
records are evidence of previous executions, not current passing results.

## Changes made

1. Moved three obsolete test files into
   `docs/ci/retired-workflows/tests/`: `test_ci_evidence.py` (59 statically
   expanded cases), `test_release_workflow.py` (11), and
   `test_rich_rendering_artifacts.py` (1). These 71 cases exercise retired
   hosted workflows, their evidence verifier, and artifact upload configuration.
   The normal `testpaths = ["tests"]` no longer collects them. They remain
   available explicitly for historical investigation. Current local CI,
   release, publisher, and application tests remain in the active suite.
2. Updated development and release guidance to select affected tests, stop on
   passing evidence, and let the automatic publisher own the full release gate.
   The former development example listed two complete Python commands in a row.
   The runbooks also encouraged complete pre-merge acceptance followed by the
   publisher's separate complete run. The new examples are alternatives.

The obsolete references can be checked in
`docs/ci/retired-workflows/tests/test_release_workflow.py:9`,
`test_ci_evidence.py:151`, and `test_rich_rendering_artifacts.py:7`.
The active gate is `scripts/local_ci.py:55`; current receipt/publication
validation remains in `tests/unit/test_local_ci.py`, `test_local_release.py`,
and `test_local_publisher.py`.

## Remaining consolidation candidates

These findings are recommendations; active test implementations have not been
changed in this review. Preserve the listed properties when consolidating.

| Area | Evidence | Useful change |
| --- | --- | --- |
| Browser timeout matrix | `tests/browser/diagram-diagnostics.spec.js:8` crosses three engines, two widths, and two failures. Six hello failures wait the production 10-second watchdog in `static/src/mermaid-frame-parent.js` and `static/src/bounded-frame-parent.js`. | Keep real watchdog integration coverage per parent implementation; exercise the remaining viewport/fallback combinations with controlled timing. The configured waits total about 60 seconds in a successful sequential run, excluding other work; this is a code-derived delay, not a measured suite duration. |
| Fake worker timeout | `tests/formatter/bounded-worker.test.mjs:19` stubs Worker but waits the real 2-second production timer. | Use mock timers to verify the deadline and cleanup. Keep real infinite-worker termination and parent responsiveness coverage in `tests/browser/graphviz-frame.spec.js:47`. |
| Repeated formatter invocations | `tests/formatter/pipeline.test.mjs:211` formats nine alias fixtures twice, launching 18 CLI processes. `formatter/pipeline.mjs:15` already verifies fixed-point output inside a request. | Keep all input/output fixtures and representative repeat-CLI coverage; avoid repeating a fresh process for every fixed-point assertion. |
| Configuration rejection matrices | `tests/integration/test_configuration.py:54` launches 42 settings subprocesses. `tests/formatter/pipeline.test.mjs:73` launches seven configuration rejection requests. | Put exhaustive value-class checks at the parser/configuration layer; retain process-level cases for setting wiring, early refusal, unchanged source, redaction, and structured diagnostics. |
| Backup refusal setup | `tests/integration/test_backup_restore.py:69` runs three cases, each using `seed()` from `test_restart.py:83`. It creates a migrated database, users, sessions, saves, recovery, and index checkpoints. Refusal occurs before database access in `wiki/management/commands/backup_data.py:34`. | Use only disposable wiki/data roots for path refusals and assert the specific refusal. Preserve the fully seeded backup/restore roundtrip at `test_backup_restore.py:17`. |
| Oversized fixture setup | `tests/integration/test_preservation_corpus.py:30` creates 1,000 notes for each configuration, then inspects ten selected notes and one large note. | Extract an eleven-file fixture for preservation checks. Keep the genuine corpus-size and bounded restart coverage in `test_worker_lifecycle.py:50`. |
| Renderer geometry overlap | `tests/browser/diagram-preview.spec.js:82` has standalone fit checks, while `:117` repeats responsive resizing with request-count checks. Related cases live in `renderer-browser.spec.js` and `diagram-clipping.spec.js`. | Merge fit assertions into the stronger resize cases. Retain tall/branching diagrams, label containment, editor/preview distinctions, and checks that resizing does not make new renderer requests. |
| Unconditional visual evidence | `tests/browser/renderer-browser.spec.js:41`, `diagram-diagnostics.spec.js:16`, and `support/stock_firefox.py:128` save successful screenshots. There are no screenshot snapshot comparisons. | Keep representative captures and make the rest optional or failure-only. Screenshots support human review; the DOM assertions are the automatic checks. Do not remove geometry assertions along with screenshots. |
| Repeated browser login/setup | The renderer, clipping, and diagnostic specs each submit the login form before unrelated checks; `tests/browser/support/server.js:26` also initializes a separate synthetic server for each browser command. | Consider reusable authenticated state with isolated contexts. Retain independent login/session-expiry/anonymous scenarios, runtime isolation, and one worker for the shared mutable wiki. |
| Optional visual performance recording | `tests/browser/graph-visual.spec.js:60` samples animation frames; `:104` records measurements without a timing budget. Video is enabled at `:4`. | Separate structural maximum-size graph, escaping, responsive and forced-color assertions from discretionary video/performance evidence. This optional Chromium spec is outside the current release gate. |
| Source-text assertions | `tests/formatter/zen-first-paint.test.mjs:12` requires an exact minified CSS string. `editor-startup.test.mjs:5` checks raw template text. | Favor behavior checks already present in `tests/browser/zen-first-paint.spec.js:10` and `editor-first-paint.spec.js`. Keep runtime startup/failure checks. These browser specs are optional in the release gate, so preserve an appropriate owner for coverage before removing the cheap checks. |
| Repeated packaging assertions | The Mermaid, Graphviz, and Vega-Lite `tests/unit/test_*_compose_configuration.py` files repeat a harness for different variables. Timezone packaging also starts Compose for field transport. | Share fixtures and parameterize the renderer contracts; validate additional transported fields on existing rendered Compose results. Keep all distinct security/default cases. |

Bundle tests also overlap build-time dependency graph checks, but artifact
existence, manifest/hash linkage, and shipped script validity should remain
covered. The isolated Docker COPY asset-stage test checks something an ordinary
checkout asset build does not establish; removing it requires assigning that
property to another packaging check.

## Which browser checks run automatically

`scripts/local_ci.py:55` selects Firefox code preview and the five-file Firefox
renderer configuration, plus the stock Firefox probe. The default Chromium
command `npm run test:browser` selects all 53 browser specs and is optional;
do not add it to every task's verification sequence.

The selected Playwright sources statically expand to 69 cases, and
`tests/browser/support/stock_firefox.py:68` defines 34 stock-browser render
probes: 32 Mermaid profile/width/child-CSS-zoom combinations plus one Graphviz
and one Vega-Lite baseline. Those probes cover real browser/font/scale behavior;
their exhaustive matrix is a candidate for renderer/browser-change acceptance,
with a smaller routine smoke subset. Selecting that subset would change the
mandatory gate and has not been done here. Do not silently skip probes or
change receipts.

## Repeated runs remain the larger workflow concern

`docs/testing/graph-verification.md:15` records full Python, formatter, Chromium,
and focused Firefox commands followed by `local_ci.py`, which itself runs
Python, formatter, and focused Firefox again. This establishes overlapping
verification commands, not the duration of each recorded execution.

`scripts/local_publisher.py:96` creates a fresh checkout and full test run for
every attempt. `scripts/local_publisher.py:158` retries failures, including
publication failures, through that same method. Thus an upload failure can
repeat already-passing tests. The manual release runner already consumes an
exact-commit receipt (`scripts/local_release.py:112`). Reusing validated
evidence on automatic retries is a separate implementation improvement; the
publisher remains unchanged in this review.

For future work: run focused checks during development, reserve the full gate
for its chosen owner, and reuse applicable results. If prioritizing further
optimization, use retained `python.log` duration output and per-stage logs from
an already-needed release run. Do not launch a new full run just to time this
review.

## Validation of this cleanup

Structural verification passed: relocated files parse, their repository-root
references resolve, and their content matches the original apart from relocation
path depth. All 71 statically expanded cases lie outside configured normal
discovery. Changed documentation links resolve, whitespace checks passed, and
`git diff --check` passed. This verifies moves and documentation; it is not an
application or release acceptance result. Pytest is not installed in this
checkout's current interpreter; no dependencies were installed for this review.
