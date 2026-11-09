import { GraphPhysics } from './graph-physics.js';

// One persistent solver and one transferable positions packet. While the UI
// owns the packet the worker keeps integrating; recycling publishes the latest
// completed state rather than queueing intermediate simulation frames.
let simulation = new GraphPhysics(), generation = -1, epoch = -1, serial = 0, heat = -1;
// Solver iterations are layout relaxation, not a wall-clock simulation. Keep
// each event-loop turn bounded and allow only a small complete-state lead over
// published motion so a fast worker cannot collapse the layout in one frame.
const STEPS_PER_TURN = 4, STEPS_AHEAD = 8, TURN_MILLISECONDS = 12;
const turns = new MessageChannel();
let running = false, queued = false, publishTimer = null, nextPublish = 0, stepsAhead = 0;
turns.port1.onmessage = run;
let buffer = null, outstanding = false, pending = null, publishedVersion = -1;
function schedule() {
  if (!queued && (pending || running && stepsAhead < STEPS_AHEAD)) {
    queued = true; turns.port2.postMessage(null);
  }
}
function apply(packet) {
  const newGraph = !!packet.graph, reheated = packet.heat !== heat;
  if (newGraph) {
    const { paths, positions, pinned, springs } = packet.graph;
    simulation.setGraph(paths.map(path => ({ path })), []);
    simulation.all.forEach((n, i) => {
      n.x = positions[i * 3]; n.y = positions[i * 3 + 1]; n.z = positions[i * 3 + 2]; n.pinned = !!pinned[i];
    });
    simulation.springs = [];
    for (let i = 0; i < springs.length; i += 2) simulation.springs.push([simulation.all[springs[i]], simulation.all[springs[i + 1]]]);
    generation = packet.generation; publishedVersion = -1;
    // An older topology may still have its sole packet at the UI. Allocate the
    // replacement only after it returns, keeping buffer ownership bounded.
    if (!outstanding) buffer = new Float64Array(simulation.all.length * 3);
  }
  simulation.forces = packet.forces;
  if (packet.paused) simulation.pause();
  else if (reheated) simulation.reheat();
  heat = packet.heat;
  for (const pin of packet.pins) {
    const n = simulation.all[pin.index]; if (!n) continue;
    const transition = n.pinned !== pin.pinned;
    Object.assign(n, { x: pin.x, y: pin.y, z: pin.z, pinned: pin.pinned, vx: 0, vy: 0, vz: 0 });
    simulation.positionVersion++;
    if ((transition || !simulation.active) && !packet.paused) simulation.reheat();
  }
  serial = packet.serial; epoch = packet.epoch;
  running = packet.running && simulation.active;
  self.postMessage({ type: 'ack', command: packet.command });
}
function publish(now) {
  if (!buffer || outstanding || publishedVersion === simulation.positionVersion) return;
  if (now < nextPublish) {
    // This timer paces visual publication only, including the final resting
    // state; solver turns continue independently while capacity remains.
    publishTimer ??= setTimeout(() => {
      publishTimer = null; publish(performance.now()); schedule();
    }, nextPublish - now);
    return;
  }
  clearTimeout(publishTimer); publishTimer = null;
  stepsAhead = 0;
  if (buffer.length !== simulation.all.length * 3) buffer = new Float64Array(simulation.all.length * 3);
  simulation.all.forEach((n, i) => { buffer[i * 3] = n.x; buffer[i * 3 + 1] = n.y; buffer[i * 3 + 2] = n.z; });
  publishedVersion = simulation.positionVersion; outstanding = true; nextPublish = now + 1000 / 60;
  self.postMessage({ type: 'positions', generation, epoch, serial, positions: buffer,
    active: simulation.active, steps: simulation.steps, limitReached: simulation.limitReached }, [buffer.buffer]);
  buffer = null;
}
function run() {
  queued = false;
  if (pending && !simulation.pendingStep) { const packet = pending; pending = null; apply(packet); }
  const deadline = performance.now() + TURN_MILLISECONDS;
  let completed = 0;
  while (running && simulation.active && completed < STEPS_PER_TURN && stepsAhead < STEPS_AHEAD) {
    // Ordinary layouts complete a step without generator yields. Exceptionally
    // large graphs use coarse checkpoints so hard invalidations can interrupt
    // them between bounded force/tree phases instead of waiting for a full step.
    simulation.pendingStep ||= simulation.stepWork(simulation.all.length <= 2048 && simulation.springs.length <= 16384 ? 0 : 512);
    if (simulation.pendingStep.next().done) {
      simulation.pendingStep = null; completed++; stepsAhead++;
      if (pending) { const packet = pending; pending = null; apply(packet); }
    }
    if (performance.now() >= deadline) break;
  }
  running &&= simulation.active;
  publish(performance.now()); schedule();
}
self.onmessage = ({ data }) => {
  if (data.type === 'recycle') {
    if (!outstanding) return;
    outstanding = false; buffer = new Float64Array(data.buffer);
    // Even a resting solver must return its final state after buffer backpressure.
    publish(performance.now());
    schedule();
  } else if (data.type === 'control') {
    // Hard epoch/topology changes may discard old work. Transient dragging waits
    // for a safe step boundary, so repeated input cannot starve completed steps.
    if (data.graph || data.epoch !== epoch) simulation.cancelPending();
    pending = data; schedule();
  }
};
