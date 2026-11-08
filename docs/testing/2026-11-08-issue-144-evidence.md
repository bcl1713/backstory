# Coherent graph motion — issue #144

Built on dev `289d188252f44420616dc22faa88f61ba71e9dc7`, including delivered #141
and the #142 snapshot architecture. Only the displayed/explored subset is passed
to physics. No note data, storage settings or security policies changed.

## Chosen architecture and observations

Kept the existing cooperative main-thread solver after measuring its corrected
scheduling and checking actual input. Persistent worker isolation was considered;
it would add topology/control generations, buffer transfer, backpressure and drag
synchronization. A worker is not required by the issue. Completed-step staging,
time-budgeted scheduling and reduced display work address the confirmed defects
without that protocol or interpolation delay. This is not a promise of arbitrary
vault capacity or a particular device's frame rate.

The same synthetic 1,050-node star and 120 simulated 1/60-second animation inputs,
run with Node22.23.4 on this executor, produced these solver-only observations:

| Observation | Baseline | Changed solver |
| --- | --- | --- |
| Completed fixed steps | 22 | 50 |
| Generator yields consumed | 2,199 | 4,904 |
| Mean solver slice | 3.46 ms | 6.79 ms |
| Maximum observed slice | 9.14 ms | 9.59 ms |

This is about 2.27× completed publications; real force work still limits cadence.
The six-millisecond deadline is checked between chunks, so one chunk can overrun.
The baseline deliberately underused that budget because of its 32-yield ceiling.
The focused cheap-clock regression separately proves that more than32 yields and
multiple fixed steps can complete in one call when actual work fits the budget.

Real Chromium synthetic browser runs at1180px and390px each recorded120 animation
frames,76 completed solver steps,77 draws and44 partial solver slices. No sampled
published xyz changed during an unfinished slice; all-node xyz/velocity atomicity
is verified separately by the solver regression. Mean solver slices were6.21 and
6.23ms, maxima8.0 and8.1ms. These browser numbers use their own fixture and include
actual frame scheduling; they are not a controlled browser before/after benchmark.

## Focused checks

- Solver `graph-motion.test.mjs`:15/15 final pass; expected failures observed
  before implementation and before empty/destroy workspace cleanup. Covers
  coherent complete publication,1050-node throughput scheduling, four-step catchup,
  stable30/60Hz integration, small pairwise yielding, retained-generator epochs,
  pin/unpin, forces, pause, topology, destroy and private workspace release.
- Existing numerical/behavior evidence: graph-layout13,graph-bfs6,graph-forces2
  passed. BFS's resumed-equivalence test now uses a deterministic yielding clock
  rather than assuming exactly one completion fits a real machine's budget.
- View `graph-frame-work.test.mjs`:7/7 pass after observed regressions. Covers
  skipped unchanged partial frames, independent camera/style/publication redraw,
  actual elapsed-time delivery, no synchronous install warmup, stationary node
  buffers on camera-only draw, reusable projection outputs and final camera snap.
- Existing renderer7 and one-hop destination3 checks passed after view changes.
  Geometry3 and existing exploration5 checks passed after reusable geometry work.
  These are combined affected-file results, not a fresh exhaustive suite.
- `npm run build` passed with locked dependencies. Focused Chromium command ran
  graph-motion.spec.js and graph-exploration.spec.js:4/4 passed in27.8s. Actual
  mouse/touch drag/pin/release, camera/zoom/keyboard hints, paused topology refresh,
  same-scope hidden return, positions/camera continuity and close cleanup passed.
  Atomicity is not inferred from screenshots; core tests compare every node.

Logs and synthetic browser artifacts are retained under `/tmp/issue144-evidence`
and `/tmp/issue144-motion-runtime` on the executor. Existing #141 labels/hints/zoom
coverage was reused. No broad benchmark, real-device or assistive-technology claim
is made. No private note titles or content were used.

Before landing, the actual proposed merge must pass the repository's full local
candidate gate and independent exact-candidate code/UI review. Publication must
reuse that receipt with unchanged runtime provenance, verify both architectures
and immutable digest, and must not repeat the gate merely to upload artifacts.
