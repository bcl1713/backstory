import test from 'node:test';
import assert from 'node:assert/strict';
import { GraphPhysics, PHYSICS } from '../../static/src/graph-physics.js';

const fixture = (count = 1050) => {
  const nodes = Array.from({ length: count }, (_, i) => ({ path: `n${i}` }));
  return new GraphPhysics(nodes, nodes.slice(1).map(n => ({ source: 'n0', destination: n.path })), 'n0');
};
const positions = sim => sim.all.map(n => [n.x, n.y, n.z, n.vx, n.vy, n.vz]);
const samePositions = (actual, expected) => {
  assert.equal(actual.length, expected.length);
  actual.forEach((position, i) => assert.deepEqual(position, expected[i], `node ${i}`));
};
function clock(now, run) {
  const descriptor = Object.getOwnPropertyDescriptor(performance, 'now');
  Object.defineProperty(performance, 'now', { configurable: true, value: now });
  try { run(); } finally {
    if (descriptor) Object.defineProperty(performance, 'now', descriptor);
    else delete performance.now;
  }
}

test('1050-node cheap steps can consume more than 32 yields and catch up within one budget', () => {
  const sim = fixture(); let chunks = 0;
  const original = sim.stepWork.bind(sim);
  sim.stepWork = function* () { for (const value of original()) { chunks++; yield value; } };
  const version = sim.positionVersion;
  clock(() => 0, () => sim.advance(PHYSICS.step * 2));
  assert.ok(chunks > 32, `consumed ${chunks} yields`);
  assert.equal(sim.steps, 2);
  assert.equal(sim.positionVersion, version + 2);
});

test('each partial advance preserves all published positions and velocities until complete publication', () => {
  const sim = fixture(), complete = fixture(), before = positions(sim), identities = [...sim.all];
  complete.step(); let tick = 0, partial = 0;
  const version = sim.positionVersion;
  clock(() => tick++ * PHYSICS.frameMilliseconds, () => {
    while (sim.steps === 0 && partial < 500) {
      sim.advance(PHYSICS.step);
      if (sim.steps === 0) {
        partial++;
        samePositions(positions(sim), before);
        assert.equal(sim.positionVersion, version);
      }
    }
  });
  assert.ok(partial > 32);
  assert.equal(sim.steps, 1);
  samePositions(positions(sim), positions(complete));
  assert.equal(sim.positionVersion, version + 1);
  assert.ok(sim.all.every((n, i) => n === identities[i]));
});

test('pairwise small graphs yield to the same frame time budget', () => {
  const sim = fixture(128), before = positions(sim); let tick = 0;
  clock(() => tick++ * PHYSICS.frameMilliseconds, () => sim.advance(PHYSICS.step));
  assert.equal(sim.steps, 0);
  assert.ok(sim.pendingStep);
  samePositions(positions(sim), before);
  const work = sim.pendingStep;
  let yields = 0;
  while (!work.next().done) yields++;
  assert.ok(yields > 100, `pairwise forces yielded ${yields} times`);
});

for (const [name, control] of [
  ['reheat', sim => sim.reheat()],
  ['pin', sim => sim.pin('n0', 10, 20, 30)],
  ['unpin', sim => sim.unpin('n0')],
  ['release', sim => sim.releaseAll()],
  ['topology', sim => sim.setGraph([{ path: 'n0' }, { path: 'new' }], [])],
  ['pause', sim => sim.pause()],
  ['settle', sim => sim.settle(0)],
  ['destroy', sim => sim.destroy()],
]) test(`${name} prevents retained pending work from publishing stale positions`, () => {
  const sim = fixture();
  sim.pin('n0', 1, 2, 3);
  const work = sim.stepWork();
  // Reach staged integration, including a partially integrated suffix/prefix.
  for (let i = 0; i < 86; i++) assert.equal(work.next().done, false);
  control(sim);
  const before = positions(sim), version = sim.positionVersion, steps = sim.steps;
  while (!work.next().done) { /* Retained work must have no effect. */ }
  samePositions(positions(sim), before);
  assert.equal(sim.positionVersion, version);
  assert.equal(sim.steps, steps);
});

test('unstarted work is invalidated and direct pins publish immediately with monotonic revisions', () => {
  const sim = fixture(2), work = sim.stepWork(), version = sim.positionVersion;
  const node = sim.nodes.get('n0');
  sim.pin('n0', 11, 22, 33);
  assert.deepEqual([node.x, node.y, node.z], [11, 22, 33]);
  assert.ok(sim.positionVersion > version);
  const pinnedVersion = sim.positionVersion;
  while (!work.next().done) {}
  assert.equal(sim.steps, 0);
  assert.equal(sim.positionVersion, pinnedVersion);
  sim.setGraph([{ path: 'n0' }], []);
  assert.ok(sim.positionVersion > pinnedVersion);
  assert.equal(sim.nodes.get('n0'), node);
});

test('cheap integration catches up at most four fixed steps and agrees at 30 and 60 fps', () => {
  const a = fixture(3), b = fixture(3), bounded = fixture(3);
  clock(() => 0, () => {
    bounded.advance(60);
    assert.equal(bounded.steps, PHYSICS.catchUp);
    for (let i = 0; i < 30; i++) a.advance(1 / 30);
    for (let i = 0; i < 60; i++) b.advance(1 / 60);
  });
  assert.equal(a.steps, 60);
  assert.equal(b.steps, 60);
  assert.deepEqual(positions(a), positions(b));
});

test('cancelPending preserves cooling and published motion while pause stops velocities', () => {
  const sim = fixture(3);
  sim.step();
  const before = positions(sim), steps = sim.steps, quiet = sim.quiet, version = sim.positionVersion;
  const work = sim.stepWork();
  sim.cancelPending();
  assert.equal(sim.active, true);
  assert.equal(sim.steps, steps);
  assert.equal(sim.quiet, quiet);
  assert.equal(sim.positionVersion, version);
  while (!work.next().done) {}
  samePositions(positions(sim), before);
  sim.pause();
  assert.equal(sim.active, false);
  assert.ok(sim.all.every(n => n.vx === 0 && n.vy === 0 && n.vz === 0));
  assert.ok(sim.positionVersion > version);
});

test('empty topology and destruction release private staged workspace capacity',()=>{
 const sim=fixture(3);sim.step();const old=sim.staged;
 assert.ok(old.some(value=>value!==0));sim.setGraph([],[]);
 assert.equal(sim.staged.length,0);assert.ok(old.every(value=>value===0));
 sim.setGraph([{path:'other'}],[]);sim.step();const next=sim.staged;
 sim.destroy();assert.equal(sim.staged.length,0);assert.ok(next.every(value=>value===0));
});
