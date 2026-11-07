# Independent complete-graph and BFS review — 2026-11-07

Reviewed the working tree on `fix/123-126-127-complete-graph-bfs`, based on
`90efc8cc61938cef1a0d6efff0d53d036da07421`, against the approved design and
implementation plan. This is independent source and UI review, not a release
gate receipt. No merge or publication was requested or performed.

## Findings

**Resolved Important — cooperative deadline could repeatedly return a fresh cursor
with no work completed.** The original `_discover` checked its 25 ms deadline before
processing the first row after witness, adjacency and filtering setup. `_emit`
likewise checked before its first fetched candidate. If that setup repeatedly
used the soft slice while remaining within the hard SQL budget, automatic
loading could keep receiving empty pages without advancing membership or output.
The cursor revision changed, so client cycle detection could not catch it.

Reproduction: a three-note root/bridge/leaf graph, depth two, node limit two and
edge limit one, with the traversal's local monotonic clock advancing 30 ms per
sample while the real SQLite hard-budget clock remains unchanged. The new
`test_slow_setup_soft_deadline_still_advances_discovery_and_output` failed before
the fix after 40 continuations. The backend worker confirmed this reproduction.

The fix at `indexing/graph_traversal.py:165` and
`indexing/graph_traversal.py:221` gates cooperative deadline checks on completed
progress. At least one bounded row, skipped candidate or empty frontier advances
before yielding. I independently reviewed the updated guards, including filtered
rows, empty windows, candidate exhaustion and the discovery-to-output transition.
The production 100 ms / 200,000-step SQL budget remains unchanged. The worker's
affected post-fix run passed **11 tests, 43 deselected (37.34 s)**, including the
new regression, high-degree completion, cross-window counts, replay/rollback and
deeper shortest membership. Exact commands and source hashes are retained in
`docs/testing/2026-11-07-complete-graph-backend-evidence.md`.

**Resolved minor accessibility finding (identified by root):** list navigation
could lose keyboard focus when Next reached the final window and its replacement
was disabled. I reviewed the final fix at
`static/src/graph-controller.js:135`: it captures focus/direction before DOM
replacement and restores the preferred button or enabled opposite button. The
added assertion failed before the fix; both affected desktop/portrait scenarios
then passed (6.5 s). This also preserves navigation focus during automatic appends.

No unresolved Critical or Important source or UI defect remains in the reviewed
implementation. Independent source/UI review is approved for this working tree;
this is not authorization or evidence to bypass the candidate release gate.

## Reviewed behavior

- Local discovery uses breadth-first frontier order, checks both eligible
  endpoints, and leaves display filters out of traversal membership. All final
  layer members exist before their outgoing edges are aggregated; only outgoing
  scans count occurrences, retaining induced edges without doubling counts.
- Private expiring scratch state retains bounded indexed frontier windows;
  continuations bind query, generation, mutation, relation publication/epoch and
  eligibility policy. Transactions serialize progress and roll back exceptions.
  The immediately prior response can replay without consuming another page.
  Output and replay revalidate witness ancestors as well as endpoints.
- The client automatically follows local and whole-wiki cursors, including empty
  discovery pages, and separates loading pause from motion pause. Request tickets,
  aborts and stamp checks prevent stale responses from contaminating retained UI.
  Authentication/policy failures revoke retained evidence.
- Accumulation and physics no longer have fixed total record/page ceilings. List
  DOM work is windowed to 250 rows. Every retained node participates in resumed
  large physics steps. Resource failures remain visible and recoverable.
- Spring eligibility follows directed shortest depths from the actual selected
  root, retains every shortest-path parent, excludes non-advancing/unreachable
  edges, and uses equal unique-pair parameters. All display records and undirected
  highlight semantics remain. Selection/topology refresh preserves surviving
  positions, camera, explicit pause and reduced-motion behavior.

The existing shared GPU batches still prepare/upload O(nodes + edges) buffers;
they do not discard records. BFS and topology rebuilding also remain linear.
The list sorts the accumulated nodes on refresh even though DOM output is bounded.
Incremental ordering/cached rebuilding could be a future optimization, but no
measured blocking performance defect is asserted here and no additional
presentation changes are requested.

## UI inspection and reused verification

I opened all four actual Chromium screenshots, desktop 1180 px and portrait
390 px, under:

`/tmp/backstory-123-126-127-map-review/reports/browser-artifacts/graph-controls-selected-ro-*/`

Files inspected: `dense-bfs-1180.png`,
`dense-all-pairs-comparison-1180.png`, `dense-bfs-390.png`, and
`dense-all-pairs-comparison-390.png`. The maps keep their dense two-hub records;
BFS changes their spring layout without hiding nodes/links or inventing groups.
Portrait controls fit the viewport and the map/sidebar remain usable. Dense
overlap remains visible, consistent with the experiment's stated limits. Firefox
fallback images were not substituted for this WebGL inspection.

Reused the focused results documented in
`docs/testing/2026-11-07-bfs-springs-evidence.md` and
`docs/testing/2026-11-07-complete-graph-client-evidence.md`. Compared current
SHA-256 values for the four principal client source modules and built JS/CSS
against those records; they match, including the final controller/bundle hashes
after the focus correction. I did not rerun passing tests or a build. Also read
`docs/testing/2026-11-07-complete-graph-backend-evidence.md` and confirmed final
backend source/migration/traversal-test hashes. The initial **83-test** combined
focused pass is reused for unaffected backend paths, supplemented by the
**11-test** affected rerun; these are not described as a new combined/full pass.
The client's **9** real-HTTP navigation/mobile scenarios and **2** focus-correction
scenarios are documented in its evidence record.

Final principal reviewed hashes:

```text
5349b7a289bb1f8d4f49fa86c01b9132c3d98ed92131e5a072109664ce5f4a80  indexing/graph_traversal.py
859ed03be4a8478caf2f436076b7719a588002947acb033fc46b31ce0c35f8df  static/src/graph-controller.js
b3b47efc529c1c48860d3c8fe98629c5811c0d773e2a9fee343a97fa0b1682b0  static/graph-controller.js
```

This review does not claim physical-phone/live-vault performance, an
actual simultaneous-request stress test, or a full release-gate pass.
