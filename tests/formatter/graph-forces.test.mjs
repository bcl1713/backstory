import test from 'node:test';
import assert from 'node:assert/strict';
import { GraphPhysics } from '../../static/src/graph-physics.js';

const preferences = () => import('../../static/src/graph-preferences.js');
test('force preferences validate version, finite numbers, bounds and step; persist settings only and reset', async () => {
  const { DEFAULT_FORCES, validateForces, loadForces, saveForces } = await preferences();
  const saved = new Map(); const storage = { getItem: k => saved.get(k), setItem: (k, v) => saved.set(k, v) };
  assert.deepEqual(loadForces(storage), DEFAULT_FORCES);
  assert.deepEqual(validateForces({ spring: 0, repulsion: Infinity, gravity: '2' }), DEFAULT_FORCES);
  assert.deepEqual(validateForces({ spring: .25, repulsion: 4, gravity: 1.37 }), { spring: .25, repulsion: 4, gravity: 1.25 });
  saveForces(storage, { spring: 2, repulsion: .5, gravity: 4, path: 'private' });
  assert.deepEqual(loadForces(storage), { spring: 2, repulsion: .5, gravity: 4 });
  assert.equal([...saved.values()][0].includes('private'), false);
  saved.set('backstory.graph.forces.v1', '{"version":0,"spring":4}');
  assert.deepEqual(loadForces(storage), DEFAULT_FORCES);
  saveForces(storage, DEFAULT_FORCES); assert.deepEqual(loadForces(storage), DEFAULT_FORCES);
  assert.deepEqual(loadForces({ getItem() { throw Error(); } }), DEFAULT_FORCES);
  assert.doesNotThrow(() => saveForces({ setItem() { throw Error(); } }, DEFAULT_FORCES));
});
test('live force tuning retains identity and positions, reheats, and remains finite through low/default/high settling', async () => {
  const nodes = ['a', 'b', 'c'].map(path => ({ path }));
  const sim = new GraphPhysics(nodes, [{ source: 'a', destination: 'b' }, { source: 'b', destination: 'a', occurrence_count: 99 }, { source: 'b', destination: 'c' }], 'a');
  sim.settle(); const a = sim.nodes.get('a'), before = [a.x, a.y, a.z];
  sim.setForces({ spring: 2, repulsion: .5, gravity: 4 });
  assert.equal(sim.nodes.get('a'), a); assert.deepEqual([a.x, a.y, a.z], before);
  assert.equal(sim.springs.length, 2); assert.equal(sim.active, true); assert.equal(sim.steps, 0);
  const distances = [];
  for (const value of [.25, 1, 4]) {
    const tuned = new GraphPhysics(nodes, [{ source: 'a', destination: 'b' }], 'a');
    tuned.setForces({ spring: 1, repulsion: value, gravity: 1 }); tuned.settle(720);
    const b = tuned.nodes.get('b'), c = tuned.nodes.get('a'); distances.push(Math.hypot(c.x-b.x,c.y-b.y,c.z-b.z));
    assert.equal(tuned.active, false);
    assert.ok(tuned.all.every(n => [n.x,n.y,n.z,n.vx,n.vy,n.vz].every(Number.isFinite)));
  }
  assert.ok(distances[0] < distances[1] && distances[1] < distances[2]);
});
