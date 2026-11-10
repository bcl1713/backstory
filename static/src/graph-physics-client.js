import { GraphPhysics } from './graph-physics.js';
import { validateForces } from './graph-preferences.js';

// Public node records remain the coherent rendering/picking state. Only topology
// changes send identities/springs; ordinary frames return one positions buffer.
export class WorkerGraphPhysics extends GraphPhysics {
  constructor({ onStatus } = {}) {
    super();
    this.onStatus = onStatus;
    this.generation = 0; this.epoch = 0; this.pinSerial = 0; this.command = 0;
    this.overrides = new Map(); this.pinUpdates = new Map();
    try {
      this.worker = new Worker(new URL('./graph-physics-worker.js', import.meta.url), { type: 'module' });
      this.worker.onmessage = event => this.receive(event.data);
      this.worker.onerror = event => { event.preventDefault(); this.fallback(); };
      this.worker.onmessageerror = () => this.fallback();
      this.setMode('starting'); this.graphDirty = true; this.changed();
    } catch { this.fallback(); }
  }
  setMode(mode) {
    if (this.mode === mode) return;
    this.mode = mode; this.onStatus?.(mode);
  }
  changed(graph = false, epoch = false) {
    if (!this.worker) return;
    if (graph) { this.generation++; this.graphDirty = true; this.overrides.clear(); this.pinUpdates.clear(); }
    if (epoch) this.epoch++;
    this.dirty = true;
    if (!this.flushQueued) {
      this.flushQueued = true;
      queueMicrotask(() => { this.flushQueued = false; this.flush(); });
    }
  }
  flush() {
    if (!this.worker || this.inFlight || !this.dirty) return;
    const packet = { type: 'control', command: ++this.command, generation: this.generation,
      epoch: this.epoch, heat: this.heat, serial: this.pinSerial, running: !this.suspended && this.active,
      paused: !this.active, forces: this.forces, pins: [...this.pinUpdates.values()] };
    const transfer = [];
    if (this.graphDirty) {
      this.indices = new Map(this.all.map((n, i) => [n.path, i]));
      const positions = new Float64Array(this.all.length * 3), pinned = new Uint8Array(this.all.length);
      this.all.forEach((n, i) => { positions.set([n.x, n.y, n.z], i * 3); pinned[i] = Number(n.pinned); });
      const springs = new Int32Array(this.springs.length * 2);
      this.springs.forEach(([a, b], i) => { springs[i * 2] = this.indices.get(a.path); springs[i * 2 + 1] = this.indices.get(b.path); });
      packet.graph = { paths: this.all.map(n => n.path), positions, pinned, springs };
      transfer.push(positions.buffer, pinned.buffer, springs.buffer);
      packet.pins = [];
    }
    // Pin records use indices from the current displayed topology only.
    else packet.pins = packet.pins.map(pin => ({ ...pin, index: this.indices.get(pin.path), path: undefined }));
    this.inFlight = packet.command; this.dirty = this.graphDirty = false; this.pinUpdates.clear();
    try { this.worker.postMessage(packet, transfer); } catch { this.fallback(); }
  }
  receive(packet) {
    if (!this.worker) return;
    if (packet.type === 'ack') {
      if (packet.command === this.inFlight) { this.setMode('worker'); this.inFlight = null; this.flush(); }
    } else if (packet.type === 'positions') {
      if (packet.generation !== this.generation || packet.epoch !== this.epoch || this.suspended || !this.active) this.recycle(packet);
      else this.snapshotPacket = packet;
    }
  }
  recycle(packet) {
    if (!this.worker) return;
    try { this.worker.postMessage({ type: 'recycle', generation: packet.generation, buffer: packet.positions.buffer }, [packet.positions.buffer]); }
    catch { this.fallback(); }
  }
  fallback() {
    this.worker?.terminate(); this.worker = null; this.snapshotPacket = null;
    this.pinUpdates?.clear(); this.overrides?.clear(); this.indices?.clear(); this.inFlight = null;
    // Resume from the last coherent public positions, never a partial result.
    super.cancelPending(); this.setMode('fallback');
  }
  setGraph(nodes, edges) { super.setGraph(nodes, edges); this.changed(true); }
  setRoot(root) { if (root === this.root) return; super.setRoot(root); this.changed(true); }
  setForces(value) {
    const forces = validateForces(value);
    if (Object.keys(forces).every(key => this.forces[key] === forces[key])) return;
    super.setForces(forces); this.changed(false, true);
  }
  reheat() { super.reheat(); if (!this.changingPin) { this.heat = (this.heat || 0) + 1; this.changed(false, true); } }
  pause() { super.pause(); this.changed(false, true); }
  pin(path, x, y, z = this.nodes.get(path)?.z ?? 0) {
    if (!this.nodes.has(path) || ![x, y, z].every(Number.isFinite)) return;
    this.changingPin = true; super.pin(path, x, y, z); this.changingPin = false;
    this.recordPin(path);
  }
  unpin(path) {
    this.changingPin = true; super.unpin(path); this.changingPin = false;
    this.recordPin(path);
  }
  recordPin(path) {
    const n = this.nodes.get(path); if (!this.worker || !n) return;
    const pin = { path, x: n.x, y: n.y, z: n.z, pinned: n.pinned, serial: ++this.pinSerial };
    this.overrides.set(path, pin); this.pinUpdates.set(path, pin); this.changed();
  }
  releaseAll() { super.releaseAll(); if (this.worker) for (const n of this.all) this.recordPin(n.path); }
  suspend() {
    if (this.suspended) return;
    this.suspended = true; this.changed(false, true);
    if (this.snapshotPacket) { this.recycle(this.snapshotPacket); this.snapshotPacket = null; }
  }
  resume() { if (this.suspended) { this.suspended = false; this.changed(false, true); } }
  advance(elapsed) {
    if (!this.worker) return this.suspended ? this.active : super.advance(elapsed);
    const packet = this.snapshotPacket; this.snapshotPacket = null;
    if (!packet) return this.active;
    if (packet.generation === this.generation && packet.epoch === this.epoch && this.active && !this.suspended) {
      const positions = packet.positions;
      if (positions.length !== this.all.length * 3 || !positions.every(Number.isFinite)) { this.fallback(); return this.active; }
      for (let i = 0; i < this.all.length; i++) {
        const n = this.all[i], pin = this.overrides.get(n.path);
        // Old drag coordinates never overwrite local input. A release keeps its
        // last position until a complete worker step includes that release.
        if (pin && (pin.pinned || pin.serial > packet.serial)) continue;
        this.overrides.delete(n.path);
        n.x = positions[i * 3]; n.y = positions[i * 3 + 1]; n.z = positions[i * 3 + 2];
      }
      this.steps = packet.steps; this.limitReached = packet.limitReached;
      // A newer pin control can reheat a worker whose old packet says rested.
      if (packet.serial >= this.pinSerial) this.active = packet.active;
      this.positionVersion++;
    }
    this.recycle(packet); return this.active;
  }
  destroy() {
    this.worker?.terminate(); this.worker = null; this.snapshotPacket = null;
    this.overrides?.clear(); this.pinUpdates?.clear(); this.indices?.clear(); this.onStatus = null; super.destroy();
  }
}
