# Issue 141 — cumulative graph exploration

Implementation: feature branch `issue-141`, based on dev
`1547cd3ab8ad4d88a2c313bd343edca0a716bd6d`. This record describes the working tree
committed with it; exact merge identity and the mandatory full gate receipt are
retained separately in the candidate store. It is focused evidence, not a fresh
full-suite claim.

## Changed behavior

Local selection queues outgoing expansion from any loaded node while retaining
the opening root for directed BFS/springs. Server exploration retains adjacency
and accumulated membership; all directed aggregates remain deduplicated. Latest
checkpoint tokens, automatic continuation, interrupted-fetch revalidation and
explicit cancellation preserve the existing guarded read boundary.

Map `f` hints are prefix-free, favor immediate outbound neighbors and freeze
assignments during typing. Selected/neighbor labels take priority over quiet
secondary labels. Mesh and halo size follow world-space projection, while text,
hints, focus marks and pointer/touch targets remain usable in screen space.

## Selected checks and retained evidence

- Node: `node --test tests/formatter/graph-exploration.test.mjs
  tests/formatter/graph-bfs.test.mjs tests/formatter/graph-renderer.test.mjs
  tests/formatter/graph-labels.test.mjs` — all four files passed. After final hint
  sizing/code-generation changes, only exploration and labels were rerun and
  passed. BFS/renderer evidence was retained for unchanged code.
- Python: the three affected graph integration files passed 104 tests in 126.96s
  before independent review's witness correction. After replacing long-prefix
  caching with fully checked independent expansion anchors, 10 expansion/chain/
  batching cases, 19 existing witness/replay/diamond cases and 3 strengthened
  recovery/anchor-revocation cases passed. These combined focused results do not
  imply another complete affected-file run.
- A synthetic 93-node/278-edge neighborhood completed in **5 requests / 120 SQL
  statements**, versus 14 requests on the same local pre-change fixture. This is
  a bounded synthetic observation, not live latency or a numerical timing target.
  A 306-member chain, 620-leaf hubs, tiny response bounds, cycles, dirty/excluded
  paths and cursor revocation exercise completion and resource protections.
- Chromium: new desktop (1180px) and narrow (390px) exploration scenarios plus
  existing outgoing and dense-readability scenarios passed 4/4 in 12.2s. After
  final queue/hint fixes, the two changed exploration scenarios passed 2/2 in
  8.7s. They use real authenticated HTTP and WebGL, with explicit synthetic graph
  coordinates for deterministic interaction screenshots. The narrow case forces
  four-node/two-edge pages to check token advancement and full revalidation.
- The scenarios cover pointer/touch two-hop selection, hint expansion, rapid
  queued selections, mouse/touch hint-chip activation, unchanged root/positions/
  camera/pause, repeated selection without another neighborhood request, tab
  suspension/revalidation, search isolation, and shrinking projected mesh/halo
  footprints. Existing dense fixtures cover light/dark themes, bloom and forced
  colors. Build and whitespace checks passed.

Retained local logs: `/tmp/backstory-141-{frontend-focused,hints-final,build-fixed,
browser-r2,browser-r3}.log`; screenshots under
`/tmp/backstory-141-browser-r{2,3}/reports/browser-artifacts`; backend XML/report
at `/tmp/backstory-141-backend-tests.xml` and
`/tmp/backstory-141-backend-report.md`. Independent code/UI review is retained
outside source. The release candidate receives the repository's required full
local gate once; publication consumes that receipt without another test cycle.

## Review and limits

Review caught and corrected stale expansion tokens on continuation, an early
queue dequeue, hint-chip pointer capture, and interrupted action recovery. It also
rejected cached long ancestry checks: each selected expansion anchor is now fully
validated before admission, and every bounded witness is rechecked per response.

No live/private notes, settings or deployment were accessed. Synthetic browser
coverage does not establish real-device or screen-reader acceptance. Saved-index
results retain their documented reconciliation and non-atomic-filesystem limits.

## Paused-tab recovery correction

A final controller check found that hiding a tab while a multi-page expansion was
paused discarded its cursor but retained the action's original token. A new
narrow real-HTTP scenario held a committed continuation, paused, hid/showed the
tab and resumed; it reproduced the empty/error graph. Resume now revalidates the
complete accumulated exploration with the latest token after evidence suspension,
and retains the pending expansion identity until completion. The changed 390px
scenario passed in 7.2s, including the later no-refetch repeated selection. Log:
`/tmp/backstory-141-paused-green-r2.log`. Scoped independent review approved the
fix. Earlier unrelated focused evidence was retained.

The first proposed candidate's in-progress gate was interrupted safely before
merge/publication when this correction became necessary. It has failed status
and no accepted receipt. A replacement exact merge candidate receives the
required complete gate; receipts are not transferred between candidates.

## Headless formatter fixture correction

The corrected candidate passed all 1,632 Python tests, then stopped with 416/417
formatter assertions passing. The existing table-preview edit test assumed
CodeMirror's 20ms transaction parse slice had completed; headless EditorState has
no EditorView worker to complete a deferred parse. A deterministic scheduler-pause
clock reproduced the identical missing-decoration assertion. The test now finishes
the actual edited syntax tree and attaches it with a transaction before checking
its decoration. All 10 checks in that file passed. No application parser behavior
was changed. Logs: `/tmp/backstory-141-table-{red-diagnostic,green}.log`.

That candidate's failed receipt is not used for merge/publication. The final
candidate, including this test correction, must pass the complete required gate.
