# Bloom and directed spring context (#132)

Focused implementation evidence, 8 November 2026. Shared working tree based on
`516be5967d1e95ded307abfc1dfc93294c05c563`; not an exact release-candidate receipt.
Node v22.12.0, installed Three.js 0.183.2. No application or full release gate was
run for this task; candidate integration owns that gate.

The directed fixture contains both diamond parents, same-level and backward
edges, a reciprocal record, and an unreachable component. It exercises real
GraphPhysics and Three.js batch buffers through GraphView selection/topology
updates while paused. Every directed record remains displayed. Non-spring line,
arrow and halo alpha is positive and at most .15; spring alpha is 1. Forced
colors restores context alpha to 1. Quiet halos do not brighten when changing
Default to High. The bloom test checks old High emission as the new default,
stronger nonsaturating High, Off and clamping.

Red observed before implementation: the shared spring classifier was absent;
default emission was .77 instead of required former High 1.54. Existing renderer
coverage passed. The `node --test` child runner suppressed detailed failure
output in this environment, so direct Node execution supplied complete TAP.

| Command | Result |
| --- | --- |
| `node tests/formatter/graph-renderer.test.mjs` | 6 passed, 35.5 ms |
| `node tests/formatter/graph-bfs.test.mjs` | 6 passed, 415.0 ms |
| `node tests/formatter/graph-forces.test.mjs` | 2 passed, 37.7 ms |
| `node tests/formatter/graph-layout.test.mjs` | 13 passed, 460.6 ms |
| `git diff --check` | Passed |

Four final focused test commands ran independently in parallel after the final
test edit. Cumulative automated verification, including red and first green,
took under two seconds. No broad test campaign or duplicate passing rerun.

Tested source fingerprints (SHA-256; later integration changes need affected
checks only):

```text
b3618fb9c4bec94e3bc6fe6fb8a78cabfcfb5c3fb6aa56fe4c654c8bd3a0c259  static/src/graph-physics.js
38ce149c0cbd42482f75b5b28a70893390047941674d7af921a995f0d32ed605  static/src/graph-layout.js
d544a2fbd31039879fd125af31894a53994c2b98d67cf4719ae2a534fa5d86d7  static/src/graph-view.js
448bf89601cca71fa233d37e99c73cb7e346205827e3cfa5dc498aa1c6816f5b  static/src/graph-controller.js
2708d9f2c817ced0cb41b491bbe413dccb67eeb2a128c242dae6d5b41ceede48  wiki/templates/wiki/graph-panel.html
ff84e50463ddf83817aedbe3dce9b060ae3e5b0a43105ad7bf5dd0d5219cd31b  tests/formatter/graph-renderer.test.mjs
```

The renderer uses actual intensities Off=0, Default=2, High=4. High=4 is
provisional pending the integrating agent's visual comparison in light/dark
themes at desktop/narrow widths. These Node checks inspect material/buffer
behavior, not compiled WebGL pixels. Browser shader compilation, visible quiet
arrows, default/high washout, accessible slider labels and forced-color/list
fallback are delegated to that integration check; record its evidence separately.

Integration visual review retained High4 after actual phone-width light/dark
Default/High WebGL screenshots. See `2026-11-08-index-graph-ui-evidence.md` for
compiled shader, accessibility and final UI evidence. The provisional visual gap
above is now resolved by that separate evidence.
