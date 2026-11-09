import { GraphPhysics, PHYSICS } from './graph-physics.js';

// One persistent solver and one transferable positions packet. While the UI
// owns the packet the worker keeps integrating; recycling publishes the latest
// completed state rather than queueing intermediate simulation frames.
let simulation = new GraphPhysics(), generation = -1, epoch = -1, serial = 0, heat = -1;
let running = false, timer = null, nextStep = 0, nextPublish = 0;
let buffer = null, outstanding = false, pending = null, publishedVersion = -1;
function schedule(delay = 0) {
  if (timer === null && (running || pending)) timer = setTimeout(run, delay);
}
function apply(packet) {
  const newGraph = !!packet.graph;
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
  else if (packet.heat !== heat) simulation.reheat();
  heat = packet.heat;
  for (const pin of packet.pins) {
    const n = simulation.all[pin.index]; if (!n) continue;
    const transition = n.pinned !== pin.pinned;
    Object.assign(n, { x: pin.x, y: pin.y, z: pin.z, pinned: pin.pinned, vx: 0, vy: 0, vz: 0 });
    simulation.positionVersion++;
    if ((transition || !simulation.active) && !packet.paused) simulation.reheat();
  }
  serial = packet.serial; epoch = packet.epoch;
  if (packet.running && !running) nextStep = performance.now();
  running = packet.running && simulation.active;
  self.postMessage({ type: 'ack', command: packet.command });
}
function publish(now) {
  if (!buffer || outstanding || now < nextPublish || publishedVersion === simulation.positionVersion) return;
  if (buffer.length !== simulation.all.length * 3) buffer = new Float64Array(simulation.all.length * 3);
  simulation.all.forEach((n, i) => { buffer[i * 3] = n.x; buffer[i * 3 + 1] = n.y; buffer[i * 3 + 2] = n.z; });
  publishedVersion = simulation.positionVersion; outstanding = true; nextPublish = now + 1000 / 60;
  self.postMessage({ type: 'positions', generation, epoch, serial, positions: buffer,
    active: simulation.active, steps: simulation.steps, limitReached: simulation.limitReached }, [buffer.buffer]);
  buffer = null;
}
function run() {
  timer = null;
  if (pending && !simulation.pendingStep) { const packet = pending; pending = null; apply(packet); }
  const start = performance.now(), deadline = start + 8;
  // Fixed dt throughout; cap only abandoned wall-clock backlog after suspension
  // or overload, never multiply displacement or wait for a display callback.
  nextStep = Math.max(nextStep, start - 250);
  while (running && simulation.active && performance.now() >= nextStep) {
    simulation.pendingStep ||= simulation.stepWork();
    if (simulation.pendingStep.next().done) {
      simulation.pendingStep = null; nextStep += PHYSICS.step * 1000;
      if (pending) { const packet = pending; pending = null; apply(packet); }
    }
    if (performance.now() >= deadline) break;
  }
  running &&= simulation.active;
  publish(performance.now());
  if (pending || running) schedule(Math.max(0, Math.min(16, nextStep - performance.now())));
}
self.onmessage = ({ data }) => {
  if (data.type === 'recycle') {
    if (!outstanding) return;
    outstanding = false; buffer = new Float64Array(data.buffer);
    // Even a resting solver must return its final state after buffer backpressure.
    publish(performance.now());
    if (publishedVersion !== simulation.positionVersion && timer === null) timer = setTimeout(run, Math.max(0, nextPublish - performance.now()));
  } else if (data.type === 'control') {
    // Hard epoch/topology changes may discard old work. Transient dragging waits
    // for a safe step boundary, so repeated input cannot starve completed steps.
    if (data.graph || data.epoch !== epoch) simulation.cancelPending();
    pending = data; schedule();
  }
};
