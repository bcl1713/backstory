# Graph focus recovery evidence

Development source based on dev `58dc67b53262f7ddfbb420d6bde682d74596e723`.
The controller now suspends presentation identities and physics coordinates when
the document hides or enters the back/forward cache. It clears all displayed
graph/detail evidence immediately. Existing load validation restores coordinates
only for returned paths in the same evidence namespace; failed authentication,
changed namespaces and removed selected roots cannot resurrect old evidence.

The new Firefox regression first reproduced the reported failure: selected
`B.md` became null, two selected-root springs became zero, and positions reset.
After the fix, the regression retains selection, focus, springs, camera,
paused state and exact coordinates through a held revalidation response.
Additional scenarios exercise overlapping visibility/page lifecycle events,
eligibility changes and authentication failure. Removed roots lose selection.

Focused checks on forge with pinned Node 22.23.4 and Playwright 1.64.1:

- `npm run build`: passed with isolated frozen npm dependencies. An initial
  symlinked dependency tree failed the Mermaid asset path guard; installing the
  worktree's own frozen dependencies resolved that environment issue.
- `node --test tests/formatter/graph-bfs.test.mjs tests/formatter/graph-forces.test.mjs tests/formatter/graph-pages.test.mjs`:
  three test files passed (0.38 s).
- `npx playwright test tests/browser/graph-controls.spec.js --config=playwright.firefox.config.js --project=firefox`:
  16 passed, one new namespace scenario failed because its detail-response fixture
  incorrectly used the old eligibility stamp (33 s). After correcting that
  fixture, the isolated `-g 'namespace change'` run passed (4.8 s). Passing
  unaffected scenarios were reused, not rerun as a claimed fresh full-file pass.
- Chromium `-g 'returning to the graph|graph resume discards'`: three passed
  (5.8 s), covering actual WebGL as well as the Firefox accessible fallback.
- The recovery screenshot was subsequently fitted/scrolled into view, with the
  single Chromium recovery scenario rerun for that artifact.
- Candidate `0549d88e570d6cbcd7b664a3f031e09f293ab965` passed 1,620 Python
  tests, formatter tests and the Firefox code lane. The renderer lane passed
  86 scenarios but failed the new recovery screenshot's unconditional scroll:
  Firefox's accessible fallback hides the map. The screenshot scroll now runs
  only when the map is visible; recovery assertions still run in both modes.
  That failed candidate is retained without a success receipt. Its successor
  must run the complete gate on its own exact SHA.
- `git diff --check`: passed.

Logs: `/tmp/backstory-graph-focus-{build,browser,namespace,chromium,visual}.log`.
Synthetic screenshots and failure traces are under
`/tmp/backstory-graph-focus-{red,green,namespace,chromium,visual}/reports/browser-artifacts/`.
No private-vault or physical-browser performance claim. Development verification
remained below two minutes; the mandatory full release gate belongs to the exact
proposed merge and is retained separately in the publisher candidate store.

Final production SHA-256 fingerprints:

```text
f2021befa2db9f84b10249a25f6edf9a421f823b1a4d7d2b51b8cb8a6c304140  static/src/graph-controller.js
e63ca7ba59d1f2ff568ab480f9d8babe5a1600bee4acd8bf1433db8771cb24ef  static/graph-controller.js
```
