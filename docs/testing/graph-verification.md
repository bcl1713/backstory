# Issue 107 verification

Work is isolated on `codex/issue-107`, rebased onto `dev` at `7bdc1a1`.
The original checkout and its unrelated edits are preserved.

## Environment and gates

Linux x86_64, Python 3.14.4, Django 5.2.18, uv 0.12.19, Node 22.23.4 (official
tarball/checksum, installed under `/tmp`), locked npm/Python dependencies and
Playwright 1.64.1. All fixtures/accounts are generated synthetic material.

Commands used for the final source verification:

```sh
uv run pytest -n 2 --dist loadfile --durations=20
npm run build
npm run test:formatter
BACKSTORY_BROWSER_RUNTIME=/tmp/graph-final-chromium-3 BACKSTORY_BROWSER_PORT=18765 npm run test:browser
BACKSTORY_BROWSER_RUNTIME=/tmp/graph-final-firefox BACKSTORY_BROWSER_PORT=18766 npx playwright test --config=playwright.firefox.config.js
python scripts/benchmark_graph.py --output /tmp/graph-benchmark-final.json
TMPDIR=/home/oracle-worker/Work/issue-107-test-tmp python scripts/local_ci.py --base dev --head codex/issue-107 --report /home/oracle-worker/Work/issue-107-ci-reviewed
```

Use the session's own rootless test daemon through its inherited
`DOCKER_HOST=unix:///run/user/1002/docker.sock`. The default system daemon is not
used. No socket permissions, security policy or service configuration were
changed. The exact-tree runner writes its final source identity, per-gate logs
and receipt outside the checkout at `/home/oracle-worker/Work/issue-107-ci-reviewed`; this keeps the
tested commit immutable. Individual gates are not a substitute for that receipt.
Release publication and actual-host WebMCP acceptance require separate deployment
authorization. No deployment was requested or performed.

## Query and renderer measurements

Measured synthetic query results on this executor (milliseconds):

| Notes | Local | Two hops | Overview | Incoming links | Isolation page |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 100 | 13.37 | 22.22 | 15.35 | 7.03 | 47.14 |
| 1,000 | 14.14 | 22.47 | 21.21 | 7.59 | 47.72 |
| 10,000 | 13.90 | 22.39 | 20.28 | 8.96 | 46.75 |

All fifteen responses succeeded within their unchanged budgets. Payloads were
827–104,640 bytes; local payloads were 2,615–2,629 bytes. Indexing took .59, 5.34
and 53.89 seconds respectively. These are single-run observations on a shared
executor, not latency guarantees. Process RSS includes indexing; full results
and environment metadata are in `/tmp/graph-benchmark-final.json`.

The standalone Node physics benchmark measured 288 ms for 240 fixed steps on
200 nodes/500 edges. Nine graph/layout/theme tests passed; the complete Node
gate passed 378 tests. The complete Python gate passed 1,527 tests, including projection-publication
cursor and unindexed/denied requested-path regressions. Eight focused Chromium graph tests passed, including
drag/cancel/sleep, g/ and Insert safety, draft guards, list/tool parity, theme
updates, reduced motion, mobile/no-JavaScript, bfcache and Bloom Off.

The maximum renderer fixture is separate from the real-file query benchmark:
200 synthetic nodes/500 edges, consistent stubbed occurrence details, light/dark
installed palettes, forced colors, mobile list, Bloom Off/normal/high, selection
changes and drag/release video. Screenshots and raw frame/heap measurements are
under the Chromium report's `graph-visual-*` artifact directory. Inspected earlier
screenshots led to fixed screen-size labels/hit targets, label decluttering,
a sticky Close control and compact mobile filters. Both screenshots and a short
recording are retained; still images alone do not establish elastic behavior.

Query limits stay at 200,000 SQLite VM
steps / .1 second and 300 examined candidates; measured failures were fixed by
selective forward/inverse/pair indexes and bounded point lookups, not by raising
the budgets. RSS measurements include indexing and are process high-water values,
not isolated per-query allocation claims. The 60 fps and one-second usable-map
targets are recorded as targets; raw browser measurements do not establish a
general hardware guarantee.

## Independent review

Separate read-only reviewers inspected backend correctness/privacy and browser
state/lifecycle. Regressions cover cross-page edges and the local center,
endpoint-aware isolation, unindexed/asset/symlink destinations, bounded indexed
parse-completeness checks, long-path cursors, exclusion of unused metadata from
occurrence selects, bfcache remount and persistent Bloom Off. Additional tests
cover CR/LF front-matter source offsets, Menu/Escape focus ownership and return
to the visible plain-text fallback with its caret retained. Firefox no-script
coverage transfers session cookies without initializing origin localStorage.

Review scope exclusions are explicit: no deployed-host testing, no claim of
detecting arbitrary external writes before reconciliation, and no general hardware performance guarantee from
the synthetic reference environment. Visual and motion evidence uses synthetic
labels only.

## Chromium regression follow-up

The complete Chromium run exposed an existing Graphviz typography failure:
`tests/browser/graphviz-frame.spec.js:59` reports text x = -5.03125 where
shape x + padding = 6. The identical failure was reproduced in an isolated
checkout of unchanged `origin/dev` (`7bdc1a1`), using the same locked runtime and
a fresh synthetic wiki. Baseline log: `/tmp/graphviz-dev-baseline.log`. Graphviz
frame source and its tests are unchanged by issue 107.

Three existing browser setup loops allowed only 500 worker batches. The shared
representative wiki has about 1,060 notes and 8,000 occurrences: the new bounded
20-occurrence relation phase needs about 400 additional batches after note
discovery/validation. Those loops now allow 2,000 batches and retain their
explicit completion assertion and timeout. Production query and worker limits
are unchanged. All 15 affected search, live-link, representative-wiki and maximum-graph visual
cases passed with `/tmp/graph-final-chromium-fixes` as their disposable runtime.

The maximum renderer fixture became usable in 449 ms in the complete Chromium run.
Mean/p95 frame times were 16.43/16.7 ms with Bloom Off, 26.89/49.9 ms at normal
intensity and 28.16/49.9 ms at high intensity; reported JS heap was 16.1 MB
for all three. This
shared headless executor therefore measured about 60 fps with bloom off and
35–37 fps with bloom enabled, below the 60 fps target. These browser timings
include the headless compositor and shared-executor scheduling. Bloom Off and the
connection list remain user controls; no 60 fps guarantee is claimed. The
light/dark/forced-colors/mobile screenshots and drag/release recording were
inspected, and raw values are in `graph-renderer-measurements.json` beside them.

The catch-all Chromium run completed all 449 scheduled cases: 441 passed,
three failed and five were blocked by the live-link setup failure. The focused
15-case follow-up passed both corrected failures and all five blocked cases,
leaving the reproduced baseline Graphviz typography failure as the only
unresolved Chromium case. All eight graph navigation cases and the maximum
visual fixture passed in the complete run. Full log:
`/tmp/graph-chromium-final-3.log`; corrected-case log:
`/tmp/graph-chromium-fixes.log`. This is not a claim of one uninterrupted green
catch-all run. The current repository CI gate uses the focused Firefox suites.

A final receipt refresh under `/tmp/graph-exact-tree-ci-reviewed` hit this
executor's per-user tmpfs quota during stock Firefox installation/startup,
causing synthetic login to time out. Its failure logs are preserved. The
receipt refresh uses the disk-backed report and TMPDIR paths shown above,
without changing application code, browser options, socket permissions or
production policy. Completed synthetic runtime copies and verified download
archives were removed; screenshots, recordings, measurements and logs remain.
