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
  a.x = b.x = 0; a.y = b.y = 0; a.z = b.z = 0;
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
  assert.throws(() => sim.setGraph(nodes(Array.from({ length: 10001 }, (_, i) => String(i))), []), RangeError);
});

test('equal elapsed time at 30 and 60 fps produces the same fixed-step state', async () => {
  const { GraphPhysics } = await modules();
  const a = new GraphPhysics(nodes(['a', 'b', 'c']), [edge('a', 'b'), edge('b', 'c')]);
  const b = new GraphPhysics(nodes(['a', 'b', 'c']), [edge('a', 'b'), edge('b', 'c')]);
  for (let i = 0; i < 30; i++) a.advance(1 / 30);
  for (let i = 0; i < 60; i++) b.advance(1 / 60);
  for (const path of ['a', 'b', 'c']) {
    assert.ok(Math.abs(a.nodes.get(path).x - b.nodes.get(path).x) < 1e-8);
    assert.ok(Math.abs(a.nodes.get(path).y - b.nodes.get(path).y) < 1e-8);
  }
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
  const distance = (a, b) => Math.hypot(sim.nodes.get(a).x - sim.nodes.get(b).x, sim.nodes.get(a).y - sim.nodes.get(b).y, sim.nodes.get(a).z - sim.nodes.get(b).z);
  assert.ok(distance('a', 'b') < distance('a', 'f'));
  const dense = new GraphPhysics(nodes(Array.from({ length: 200 }, (_, i) => String(i))), Array.from({ length: 500 }, (_, i) => edge(String(i % 200), String((i * 7 + 1) % 200))));
  const started = performance.now();
  dense.settle(240);
  assert.equal(dense.nodes.size, 200);
  assert.ok([...dense.nodes.values()].every(n => Number.isFinite(n.x) && Number.isFinite(n.y)));
  console.log(`synthetic 200-node/500-edge 240-step layout: ${(performance.now() - started).toFixed(1)} ms`);
});

test('force simulation evolves z, pins in xyz and preserves all coordinates on merge', async () => {
  const { GraphPhysics } = await modules();
  const sim = new GraphPhysics(nodes(['a', 'b']), [edge('a', 'b')]);
  const a = sim.nodes.get('a'), b = sim.nodes.get('b');
  a.x = b.x = a.y = b.y = 0; a.z = -150; b.z = 150;
  sim.step();
  assert.ok(a.vz > 0 && b.vz < 0);
  sim.pin('a', 20, 30, 180); sim.step();
  assert.deepEqual([a.x, a.y, a.z], [20, 30, 180]);
  sim.setGraph(nodes(['a', 'b', 'c']), [edge('b', 'c')]);
  assert.equal(sim.nodes.get('a'), a);
  assert.deepEqual([a.x, a.y, a.z], [20, 30, 180]);
});

test('large coincident hubs use bounded spatial approximation without dropping nodes', async () => {
  const { GraphPhysics } = await modules();
  const all = nodes(Array.from({ length: 10000 }, (_, i) => `n${i}`));
  const sim = new GraphPhysics(all, all.slice(1).map(n => edge('n0', n.path)));
  for (const n of sim.nodes.values()) n.x = n.y = n.z = 0;
  sim.step();
  assert.equal(sim.nodes.size, 10000);
  assert.ok(sim.interactions <= 10000 * 256, `bounded interactions: ${sim.interactions}`);
  assert.ok([...sim.nodes.values()].every(n => [n.x, n.y, n.z, n.vx, n.vy, n.vz].every(Number.isFinite)));
  assert.ok([...sim.nodes.values()].some(n => n.z !== 0));
  assert.throws(() => sim.setGraph(nodes(Array.from({ length: 10001 }, (_, i) => String(i))), []), RangeError);
});

test('perspective orbit changes projected depth and fit/reset preserve a usable frame', async () => {
  const { GraphCamera } = await modules();
  const camera = new GraphCamera(900, 500);
  const all = new Map([['a', { x: -200, y: 20, z: -400 }], ['b', { x: 150, y: -80, z: 500 }]]);
  camera.fit(all, true);
  const before = camera.screen(all.get('b'));
  camera.orbit(.8, .3, true);
  const after = camera.screen(all.get('b'));
  assert.ok(Math.abs(before.x - after.x) > 1);
  camera.fit(all, true);
  for (const n of all.values()) {
    const p = camera.screen(n);
    assert.ok(p.visible && p.x > 0 && p.x < 900 && p.y > 0 && p.y < 500);
  }
  camera.resetOrientation(true);
  assert.equal(camera.yaw, 0); assert.equal(camera.pitch, 0);
});

test('adaptive bloom degrades with hysteresis, recovers and respects a real off state', async () => {
  const { AdaptiveQuality, emission } = await modules();
  const quality = new AdaptiveQuality();
  for (let i = 0; i < 5; i++) quality.sample(.06);
  assert.equal(quality.level, 0);
  quality.sample(.06); assert.equal(quality.level, 1);
  for (let i = 0; i < 6; i++) quality.sample(.06);
  assert.equal(quality.level, 2);
  for (let i = 0; i < 89; i++) quality.sample(.01);
  assert.equal(quality.level, 2);
  quality.sample(.01); assert.equal(quality.level, 1);
  assert.equal(quality.bloom(0), 0);
  assert.equal(quality.bloom(2, true), 0);
  assert.ok(emission(20) > emission(Infinity));
});
