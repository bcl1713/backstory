# Issue 129 — outgoing local hop membership

Base `b19cc6940241ff47d34b648dfb8f8e164b3f76d1`; isolated branch
`fix/129-outgoing-local-hops`, working tree `/tmp/backstory-129`.
Only synthetic notes were used. No live wiki or deployment was changed.

The indexed one-hop query now selects the root and outgoing destinations only.
Depths 2–8 scan outgoing frontiers once, in BFS order, retaining all induced
eligible directed records, including final-layer back/cross edges and repeated
occurrence counts. Local query identity now includes `membership: outgoing-v1`,
expiring old undirected continuations. Global and backlink query identities and
frontend code are unchanged. Existing budgets, errors, replay and eligibility
checks remain; no total membership cap was introduced.

## Focused checks

Selected checks establish directed membership at every depth and after
recentering, all induced records/provenance independent of traversal order,
620-neighbor completion under default and small response bounds, exclusion of
incoming-only hubs, cursor/replay/interruption safety, and independent global
and backlink access. Tests run with production SQL/eligibility budgets.

- RED: `.venv/bin/python -m pytest -q tests/integration/test_graph_traversal.py -k 'local_membership_counts or legacy_undirected'` — **10 failed**, 27 deselected, 1.98s. All eight depths included inbound notes; both legacy cursors remained accepted.
- Focused backend: `.venv/bin/python -m pytest -q tests/integration/test_graph_traversal.py tests/integration/test_graph_queries.py tests/integration/test_graph_tools.py tests/integration/test_index_diagnostics.py` — **97 passed, 6 failed**, 67.66s. All six failures were in the new provenance assertion using nonexistent `first_occurrence_id`; membership/count assertions had passed. Corrected test to the public `occurrence_id` field.
- Affected rerun only: `.venv/bin/python -m pytest -q tests/integration/test_graph_traversal.py -k outgoing_diamond` — **6 passed**, 31 deselected, 1.69s. The preceding 97 passes remain applicable. This combined focused evidence is not a fresh full-suite pass.
- `node --test tests/formatter/graph-bfs.test.mjs tests/formatter/graph-pages.test.mjs` — **both files passed**, 0.38s. Equal shortest-path parents, duplicate pairs and continuation accumulation remain intact.
- Real HTTP UI: with the existing publisher runtime selectors and `BACKSTORY_BROWSER_RUNTIME=/tmp/backstory-129-browser BACKSTORY_BROWSER_PORT=19529`, `node_modules/.bin/playwright test tests/browser/graph-outgoing.spec.js` — **1 passed**, 4.4s. Covers two/one-hop membership, incoming details without expansion, recentering and global inbound/disconnected membership. Screenshots: `reports/browser-artifacts/graph-outgoing-local-outgo-ae134-whole-wiki-stay-independent/{outgoing-one-hop,whole-wiki}.png` beneath that runtime. Chromium connection-list UI was inspected; this check does not assert WebGL or phone rendering.
- `git diff --check` — passed.

Development verification took about 76 seconds. Python 3.14.4; Node 22.12.0
for selected formatter files, pinned Node 22.23.4 for browser execution. Existing
unchanged frontend source/UI evidence in `2026-11-07-complete-graph-review.md`,
`2026-11-07-bfs-springs-evidence.md` and
`2026-11-07-complete-graph-client-evidence.md` is reused for unaffected layout,
mobile, cancellation and accumulation behavior; no repeat browser campaign.

Tested source SHA-256:

```text
5a77be61ec90a596e28a3afa43dc0e2a6a5ccde2420ed19dbd6e1601385b0a5a  indexing/graph.py
7f0ac6870b86fce037033bb60b232c136843dd2eee09dc61d5faab461766d218  indexing/graph_traversal.py
5c07cef3a1a020c7b00d509ae5e020675d22757e9bea4c1e5c7691cdae939ef7  tests/integration/test_graph_traversal.py
8eaec77b448fb0cf01dc46772fa321566d0717a174f2383d6d1ddffd47882545  tests/browser/graph-outgoing.spec.js
```

## Release boundary

The exact merge candidate still requires its full gate and independent retained
review before landing. Those external receipts and publication evidence belong
to the trusted candidate store, never a different commit. No focused test result
here substitutes for that gate. No stable promotion or live-server redeploy.
