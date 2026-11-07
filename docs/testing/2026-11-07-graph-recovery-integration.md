# Graph recovery integration evidence — 7 November 2026

Base: `846f2773cc568780dc468f0b49f52282e70ca3b4`. Working branch:
`fix/123-124-graph-recovery-mobile`. Backend and mobile reproduction/results are
recorded in the adjacent issue-123 and issue-124 evidence files.

## Recovery checks

Selected three Firefox browser scenarios for truthful query-limit/database-error
messages, absence of misleading preparation text, local one-hop recovery that
preserves center/search filters, and bounded partial evidence with recovery.
These exercise real controller UI with synthetic bounded API responses; backend
query behavior is established separately by the integration tests.

- Initial default-sandbox browser launch failed because the synthetic server's
  loopback socket was prohibited. Retried with the authorized external executor.
- `BACKSTORY_BROWSER_RUNTIME=/tmp/backstory-issue-123-recovery-red
  BACKSTORY_BROWSER_PORT=8873 node_modules/.bin/playwright test
  --config=playwright.firefox.config.js tests/browser/graph-query-recovery.spec.js`:
  two expected failures, both exposing the old generic error message.
- After controller error/recovery changes, the same file in fresh runtime
  `/tmp/backstory-issue-123-recovery-green`: two passed in 5.9 seconds.
- After adding the bounded-partial regression, selected `-g 'bounded partial'`
  in `/tmp/backstory-issue-123-partial-red`: expected failure because partial
  traversal had an empty status and no recovery action.
- After adding its message/recovery, the entire three-scenario file in
  `/tmp/backstory-issue-123-recovery-final`: three passed in 6.8 seconds.

Build inputs: Node 22.12.0, locked local node_modules, Playwright 1.64.1 and patched
Firefox; Python 3.14.4 synthetic server. `npm run build` passed. Controller-only
rebuilds during development used esbuild, with the final generated artifact
rebuilt using the canonical bundle/minify/ESM options without a target override.
No focused checks were repeated solely for that equivalent generated syntax.
The required candidate gate uses pinned Node 22.23.4 and checks the committed
canonical artifacts on the actual merge source. `git diff --check` passed.

## Review and release boundary

Independent reviewer `/root/review_graph_fixes` found no code blockers after
reviewing filtering equivalence, unchanged eligibility/SQL/response bounds,
honest partial state, stale requests, source-free diagnostics and frontend
recovery. It inspected synthetic phone portrait, landscape and fallback images.
The parent also inspected the before obstruction and the final populated
390-pixel map. Physical phone, Safari, dynamic browser bars and actual software
keyboard behavior remain unverified; touch and viewport changes are emulated.

No source changes to `indexing/search.py` or its numeric cutoffs were made.
Those cutoffs originate in Codex-authored commit `ed120e1` (25 October 2026),
not a new owner-selected budget for this task. The owner questioned their
provenance during this work; the existing issue acceptance asks to retain them.

The full gate runs only on the exact prepared merge candidate. Its SHA, retained
gate logs/receipt, independent exact-merge approval and publication record live
under `/home/oracle-worker/.local/state/backstory-publisher/candidates/<sha>/`.
This working-tree evidence is not a release receipt. Publication consumes the
successful exact-merge receipt and does not rerun application tests.
