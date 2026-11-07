# Directed BFS spring evidence — 2026-11-07

Task 2 of `docs/superpowers/plans/2026-11-07-complete-graph-bfs.md`.
Tested working tree based on `90efc8cc61938cef1a0d6efff0d53d036da07421`,
branch `fix/123-126-127-complete-graph-bfs`; no commit or publication performed.
Node v22.12.0, installed package-lock below, existing Three.js 0.183.2.

## Scope and results

Selected focused checks establish outgoing shortest-depth eligibility (including
both diamond parents), order independence, cycles/back/same-depth/inbound/self
exclusion, equal pair force independent of duplicates/counts, no invented root,
shortcut append/removal/reselection, retained XYZ identity, cached BFS on ticks,
force controls and unchanged selection, plus paused view/camera/focus/highlight
continuity. Existing layout checks cover 3D pinning, settling, catch-up,
perspective camera and adaptive quality. Renderer buffers and physics retain
10,001 nodes / 30,001 edges beyond the former ceilings. A resumable large step
matches a synchronous fixed step's forces and positions.

- Initial `node --test tests/formatter/graph-bfs.test.mjs` failed with a generic
  subprocess `ERR_TEST_FAILURE` (0.053 s). Direct `node tests/formatter/graph-bfs.test.mjs`
  exposed all five intended preimplementation failures: old all-edge springs,
  no root suppression, missing selection API, extra link force and old size cap
  (0.019 s reported test time). This environment requires in-process test isolation.
- `node --test --experimental-test-isolation=none tests/formatter/graph-bfs.test.mjs`
  passed the first five new tests after implementation (0.342 s).
- Focused combined command below passed 21/21 (0.776 s), then 23/23 after adding
  paused-view and resumed-step integration assertions (0.780 s).
- Final affected rerun after preserving fixed-time accumulation and ensuring
  terminal velocity cleanup completes before the active flag clears: **23/23
  passing**, **0.829 s** reported test time / **0.731 s** tool wall time.

```sh
node --test --experimental-test-isolation=none \
  tests/formatter/graph-bfs.test.mjs \
  tests/formatter/graph-forces.test.mjs \
  tests/formatter/graph-layout.test.mjs \
  tests/formatter/graph-renderer.test.mjs
```

`git diff --check --` for the six changed source/test paths passed. Total selected
verification was under five seconds. No full suite, build or browser run by this
worker; root owns integrated browser verification. Evidence above is focused
working-tree evidence and must not be represented as a release gate receipt.

## Runtime behavior and practical limits

BFS/adjacency rebuilds on every `setGraph` (including in-place array appends) and
on changed selected roots, never on physics ticks. Display/highlight records stay
intact and highlight tiers retain their undirected semantics. Roots absent from
the loaded nodes activate zero springs. The physics caps are removed; large
steps yield after bounded 64-item work chunks, with at most 32 chunks or roughly
6 ms per frame (a chunk/GC may exceed the time target). Small layouts retain
fixed-step catch-up. All retained nodes participate as steps resume.

The existing renderer still prepares/uploads O(nodes + edges) buffers and uses
five GPU draw batches; it does not discard records. GPU memory and actual
allocation/context failures remain real environment limits. This worker did not
redesign that renderer path; root owns user-facing resource error handling.

## Tested input SHA-256

```text
cb642c42f44051a77f5e2c7561cf1a2e3cd6800d9f119a0e8762e18c317f78ee  static/src/graph-physics.js
f146773a2714aecff649764798af1cd2ca066c959a5d33d13970f1d578f2e8c9  static/src/graph-view.js
edfa630396f19a75e515926f5bfd883910e544384a3df877091a2a30db25e842  static/src/graph-layout.js
7e04fa2d5180e54865292f8c6a7b150af60ed7617a8fa96d49c5b2f4fbe9bb54  static/src/graph-camera.js
85d18811522d624816ade65ccd7bb16cedae2a3cacbffb809cfef5501bc791b4  static/src/graph-preferences.js
9cc6ca35052dc97c96efa524d1f5f3706e761734e0e04d04083823dc4f00447c  tests/formatter/graph-bfs.test.mjs
0487894bd8d7feb4e046c3308876360924e33d07bd5e570333dd34f2c7611d9d  tests/formatter/graph-forces.test.mjs
4500c0f91e11eab2d2bf3ca611df44aff097125b29393de413c23cadfd547479  tests/formatter/graph-layout.test.mjs
cfb0eb83e11f2658bf770b7c910074514d2444d2aab41dabfb63856a5a7be51e  tests/formatter/graph-renderer.test.mjs
78cd6804a093266efe8790fd73cb40880ed6b1026a69cd53a8f2c96d11a13e10  package-lock.json
```
