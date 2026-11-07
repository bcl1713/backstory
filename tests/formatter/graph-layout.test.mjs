import { test } from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';

const modules = async () => {
  try { return { ...(await import('../../static/src/graph-physics.js')), ...(await import('../../static/src/graph-layout.js')), ...(await import('../../static/src/graph-camera.js')) }; }
  catch (error) { assert.fail(`graph layout modules are missing: ${error.message}`); }
};
const nodes = paths => paths.map(path => ({ path, title: path }));
const edge = (source, destination, occurrence_count = 1) => ({ source, destination, occurrence_count });

test('graph visual roles alias the installed semantic theme tokens', async () => {
  const { GRAPH_THEME_ROLES } = await import('../../static/src/theme-palette.js');
  assert.deepEqual(GRAPH_THEME_ROLES, { background: 'surface', node: 'link', edge: 'muted', highlight: 'heading-3', label: 'foreground', focus: 'focus', bloom: 'link' });
});

test('springs use unique undirected pairs, preserve symmetry and finite coincident forces', async () => {
  const { GraphPhysics } = await modules();
  const sim = new GraphPhysics(nodes(['a', 'b']), [edge('a', 'b'), edge('b', 'a', 80), edge('a', 'b', 50)]);
  assert.equal(sim.springs.length, 1);
  const a = sim.nodes.get('a'), b = sim.nodes.get('b');
  a.x = b.x = 0; a.y = b.y = 0;
  sim.step();
  assert.ok([a.x, a.y, b.x, b.y, a.vx, b.vx].every(Number.isFinite));
  assert.ok(Math.abs(a.vx + b.vx) < 1e-8 && Math.abs(a.vy + b.vy) < 1e-8);
  assert.ok(Math.hypot(a.x - b.x, a.y - b.y) > 0);
});

test('drag stretches real springs and neighbors follow; release settles and preserves identity', async () => {
  const { GraphPhysics } = await modules();
  const sim = new GraphPhysics(nodes(['a', 'b', 'c']), [edge('a', 'b'), edge('b', 'c')]);
  sim.settle();
  const b = sim.nodes.get('b'), before = { x: b.x, y: b.y };
  const a = sim.nodes.get('a');
  sim.pin('a', a.x + 250, a.y + 150);
  for (let i = 0; i < 90; i++) sim.step();
  assert.ok(Math.hypot(b.x - before.x, b.y - before.y) > 20);
  sim.unpin('a');
  for (let i = 0; i < 1000 && sim.active; i++) sim.advance(1 / 60);
  assert.equal(sim.active, false);
  assert.equal(sim.nodes.get('b'), b);
  assert.ok([...sim.nodes.values()].every(n => Math.hypot(n.vx, n.vy) <= 600));
  sim.pin('b', 20, 30); sim.releaseAll();
  assert.equal(b.pinned, false);
});

test('fixed catch-up, topology continuity and total settling work are bounded', async () => {
  const { GraphPhysics } = await modules();
  const sim = new GraphPhysics(nodes(['a', 'b']), [edge('a', 'b')]);
  sim.advance(60);
  assert.ok(sim.steps <= 4);
  const a = sim.nodes.get('a');
  const position = [a.x, a.y];
  sim.setGraph(nodes(['a', 'b', 'c']), [edge('b', 'c')]);
  assert.deepEqual([sim.nodes.get('a').x, sim.nodes.get('a').y], position);
  sim.settle();
  assert.equal(sim.active, false);
  assert.throws(() => sim.setGraph(nodes(Array.from({ length: 201 }, (_, i) => String(i))), []), RangeError);
});

test('shortest explicit hops handle cycles, duplicates, disconnected nodes and farther edge tiers', async () => {
  const { hopTiers, emission } = await modules();
  const all = nodes(['a', 'b', 'c', 'd', 'unlinked']);
  const edges = [edge('a', 'b'), edge('b', 'a', 99), edge('b', 'c'), edge('c', 'd'), edge('d', 'b')];
  const tiers = hopTiers(all, edges, 'a');
  assert.deepEqual([...tiers.nodes.values()], [0, 1, 2, 2, Infinity]);
  assert.deepEqual(tiers.edges, [1, 1, 2, 2, 2]);
  assert.ok(emission(0) > emission(1) && emission(1) > emission(2) && emission(2) > emission(Infinity));
  assert.equal(emission(0, 0), 0);
  assert.equal(hopTiers(all, edges, 'removed').nodes.get('a'), Infinity);
});

test('directional focus resolves ties by path and is evaluated from current positions', async () => {
  const { nearestNode } = await modules();
  const positions = new Map([['a', { x: 0, y: 0 }], ['c', { x: 20, y: -5 }], ['b', { x: 20, y: 5 }]]);
  assert.equal(nearestNode(positions, 'a', 'right'), 'b');
  positions.get('c').x = 10;
  assert.equal(nearestNode(positions, 'a', 'right'), 'c');
  assert.equal(nearestNode(positions, 'a', 'left'), 'a');
});

test('camera zoom anchors world coordinates and eased motion never overshoots', async () => {
  const { GraphCamera } = await modules();
  const camera = new GraphCamera();
  const point = { x: 600, y: 350 };
  const before = camera.world(point);
  camera.zoom(1.5, point, true);
  const after = camera.world(point);
  assert.ok(Math.hypot(before.x - after.x, before.y - after.y) < 1e-8);
  const initial = camera.x;
  camera.pan(100, 0);
  for (let i = 0; i < 100; i++) camera.tick(1 / 60);
  assert.ok(camera.x <= initial + 100 / camera.scale && camera.x > initial);
});

test('bounded two-cluster fixture gathers neighborhoods, chain and hub remain usable', async () => {
  const { GraphPhysics } = await modules();
  const ids = ['a', 'b', 'c', 'd', 'e', 'f'];
  const sim = new GraphPhysics(nodes(ids), [edge('a', 'b'), edge('a', 'c'), edge('b', 'c'), edge('d', 'e'), edge('d', 'f'), edge('e', 'f'), edge('c', 'd')]);
  sim.settle(720);
  const distance = (a, b) => Math.hypot(sim.nodes.get(a).x - sim.nodes.get(b).x, sim.nodes.get(a).y - sim.nodes.get(b).y);
  assert.ok(distance('a', 'b') < distance('a', 'f'));
  const dense = new GraphPhysics(nodes(Array.from({ length: 200 }, (_, i) => String(i))), Array.from({ length: 500 }, (_, i) => edge(String(i % 200), String((i * 7 + 1) % 200))));
  const started = performance.now();
  dense.settle(240);
  assert.equal(dense.nodes.size, 200);
  assert.ok([...dense.nodes.values()].every(n => Number.isFinite(n.x) && Number.isFinite(n.y)));
  console.log(`synthetic 200-node/500-edge 240-step layout: ${(performance.now() - started).toFixed(1)} ms`);
});
