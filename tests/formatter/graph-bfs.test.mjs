import test from 'node:test';
import assert from 'node:assert/strict';
import { GraphPhysics } from '../../static/src/graph-physics.js';

const nodes = (...paths) => paths.map(path => ({ path }));
const edge = (source, destination, occurrence_count = 1) => ({ source, destination, occurrence_count });
const pairs = sim => sim.springs.map(pair => pair.map(n => n.path).sort().join(':')).sort();

test('outgoing BFS retains every shortest diamond parent independent of record order', () => {
  const all = nodes('a', 'b', 'c', 'd', 'e', 'inbound', 'isolated');
  const edges = [edge('d', 'e'), edge('c', 'd'), edge('a', 'c'), edge('b', 'd'), edge('a', 'b'),
    edge('b', 'c'), edge('d', 'a'), edge('inbound', 'a'), edge('e', 'b'), edge('d', 'd'),
    edge('a', 'b', 90), edge('b', 'a', 200)];
  for (const records of [edges, edges.toReversed()]) {
    const sim = new GraphPhysics(all, records, 'a');
    assert.deepEqual(pairs(sim), ['a:b', 'a:c', 'b:d', 'c:d', 'd:e']);
    assert.deepEqual([...sim.depths], [['a', 0], ['b', 1], ['c', 1], ['d', 2], ['e', 3], ['inbound', Infinity], ['isolated', Infinity]]);
    assert.equal(sim.nodes.size, all.length);
    assert.equal(records.length, 12, 'display records are untouched');
  }
});

test('missing, stale and disconnected selected roots never invent springs', () => {
  for (const selected of [undefined, null, 'removed', 'isolated']) {
    const sim = new GraphPhysics(nodes('a', 'b', 'isolated'), [edge('a', 'b')], selected);
    assert.deepEqual(pairs(sim), []);
  }
});

test('shortcut pages, removals and selection changes refresh cached BFS without moving survivors', () => {
  const all = nodes('a', 'b', 'c', 'd');
  const edges = [edge('a', 'b'), edge('b', 'c'), edge('c', 'd')];
  const sim = new GraphPhysics(all, edges, 'a');
  sim.pin('b', 21, 34, 55);
  const b = sim.nodes.get('b'), position = [b.x, b.y, b.z];
  const initialDepths = sim.depths;
  sim.step();
  sim.setForces({ spring: 2, repulsion: 1, gravity: 1 });
  sim.setSelection('a');
  assert.equal(sim.depths, initialDepths, 'ticks, force controls and unchanged selection reuse BFS');
  sim.setGraph(all, [...edges, edge('a', 'c')]);
  assert.deepEqual(pairs(sim), ['a:b', 'a:c', 'c:d']);
  assert.equal(sim.nodes.get('b'), b);
  assert.deepEqual([b.x, b.y, b.z], position);
  sim.setSelection('b');
  assert.deepEqual(pairs(sim), ['a:b', 'a:c', 'c:d'], 'selection preserves opening root');
  sim.setRoot('b');
  assert.deepEqual(pairs(sim), ['b:c', 'c:d']);
  assert.deepEqual([b.x, b.y, b.z], position);
  sim.setGraph(nodes('a', 'b', 'c'), edges);
  assert.deepEqual(pairs(sim), ['b:c']);
  sim.setGraph(nodes('a', 'c'), edges);
  assert.deepEqual(pairs(sim), []);
});

test('ineligible records add no spring force and eligible duplicate pairs have equal force', () => {
  const all = nodes('a', 'b', 'c', 'inbound');
  const base = [edge('a', 'b'), edge('b', 'c')];
  const sim = new GraphPhysics(all, base, 'a');
  const extra = new GraphPhysics(all, [...base, edge('a', 'b', 999), edge('b', 'a'), edge('c', 'a'), edge('inbound', 'a'), edge('b', 'b')], 'a');
  for (const physics of [sim, extra]) physics.all.forEach((n, i) => Object.assign(n, { x: 100 * i, y: 50 * i, z: 30 * i }));
  sim.step(); extra.step();
  assert.deepEqual(extra.all, sim.all);
});

test('loaded records beyond former physics caps remain present and advance in bounded chunks', () => {
  const all = Array.from({ length: 10001 }, (_, i) => ({ path: `n${i}` }));
  const edges = Array.from({ length: 30001 }, (_, i) => edge('n0', `n${1 + i % 10000}`));
  const sim = new GraphPhysics(all, edges, 'n0');
  assert.equal(sim.nodes.size, 10001);
  assert.equal(sim.springs.length, 10000);
  sim.advance(1 / 60);
  assert.equal(sim.steps, 0, 'large step yields before completing all work');
  assert.ok(sim.active);
  for (let i = 0; i < 1000 && sim.steps === 0; i++) sim.advance(1 / 60);
  assert.ok(sim.steps > 0, 'every retained node participates in resumed physics');
  assert.ok(sim.all.every(n => [n.x, n.y, n.z].every(Number.isFinite)));
});

test('resumed large steps produce the same forces and positions as a complete fixed step', () => {
  const all = Array.from({ length: 300 }, (_, i) => ({ path: `n${i}` }));
  const edges = all.slice(1).map(n => edge('n0', n.path));
  const sliced = new GraphPhysics(all, edges, 'n0'), complete = new GraphPhysics(all, edges, 'n0');
  complete.step();
  // Isolate resumed numerical equivalence from the intentionally variable number
  // of cheap steps that fit a real frame budget. This clock yields once per call.
  const descriptor = Object.getOwnPropertyDescriptor(performance, 'now'); let tick = 0;
  Object.defineProperty(performance, 'now', {configurable:true,value:()=>tick++ * 6});
  try { for (let i = 0; i < 1000 && sliced.steps === 0; i++) sliced.advance(1 / 60); }
  finally { if (descriptor) Object.defineProperty(performance,'now',descriptor); else delete performance.now; }
  assert.equal(sliced.steps, 1);
  assert.deepEqual(sliced.all, complete.all);
});
