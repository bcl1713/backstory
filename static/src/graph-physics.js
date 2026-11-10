import { DEFAULT_FORCES, validateForces } from './graph-preferences.js';
// Presentation-only forces; topology and occurrence counts carry no weights.
export const PHYSICS = Object.freeze({ step: 1 / 60, catchUp: 4, restLength: 90,
  stiffness: 8, repulsion: 1200000, softening: 144, forceCap: 300,
  collisionRadius: 22, collisionStrength: 20, center: .04, damping: 4.8,
  speedCap: 600, maxSteps: 720, restSpeed: 2, restSteps: 45,
  visits: 192, chunkSize: 64, frameMilliseconds: 6 });
function hash(path) {
  let value = 2166136261;
  for (const char of path) value = Math.imul(value ^ char.codePointAt(0), 16777619);
  return value >>> 0;
}
function seed(path) {
  const h = hash(path), angle = h / 4294967296 * Math.PI * 2;
  const z = (hash(path + '\0z') / 4294967296 * 2 - 1), radius = 60 + h % 240;
  return { x: Math.cos(angle) * Math.sqrt(1 - z * z) * radius,
    y: Math.sin(angle) * Math.sqrt(1 - z * z) * radius, z: z * radius };
}
// Lazy singleton leaves split only on collision. Cells, child indices and the
// traversal stack survive steps; coincident buckets stop at the depth/radius cap.
class Octree {
  constructor() { this.cells = []; this.stack = new Int32Array(PHYSICS.visits); }
  cell(x, y, z, radius) {
    const index = this.used++;
    const c = this.cells[index] ||= { children: new Int32Array(8) };
    Object.assign(c, { x, y, z, radius, count: 0, sx: 0, sy: 0, sz: 0, point: -1, split: false, childCount: 0 });
    c.children.fill(-1); return index;
  }
  octant(n, c) { return (n.x >= c.x ? 1 : 0) | (n.y >= c.y ? 2 : 0) | (n.z >= c.z ? 4 : 0); }
  insert(all, point, index, depth) {
    const n = all[point], c = this.cells[index];
    c.count++; c.sx += n.x; c.sy += n.y; c.sz += n.z;
    if (c.count === 1) { c.point = point; return; }
    if (depth === 16 || c.radius < .1) return;
    if (!c.split) { c.split = true; this.child(all, c.point, c, depth); c.point = -1; }
    this.child(all, point, c, depth);
  }
  child(all, point, c, depth) {
    const octant = this.octant(all[point], c), r = c.radius / 2;
    let index = c.children[octant];
    if (index < 0) {
      index = c.children[octant] = this.cell(c.x + (octant & 1 ? r : -r),
        c.y + (octant & 2 ? r : -r), c.z + (octant & 4 ? r : -r), r);
      c.childCount++;
    }
    this.insert(all, point, index, depth + 1);
  }
  *build(all, chunkSize) {
    let radius = 1, work = 0; this.used = 0;
    for (const n of all) {
      radius = Math.max(radius, Math.abs(n.x), Math.abs(n.y), Math.abs(n.z));
      if (chunkSize && ++work % chunkSize === 0) yield;
    }
    this.cell(0, 0, 0, radius + 1);
    for (let i = 0; i < all.length; i++) {
      this.insert(all, i, 0, 0);
      if (chunkSize && ++work % chunkSize === 0) yield;
    }
    for (let i = 0; i < this.used; i++) {
      const c = this.cells[i]; c.mx = c.sx / c.count; c.my = c.sy / c.count; c.mz = c.sz / c.count;
      if (chunkSize && ++work % chunkSize === 0) yield;
    }
  }
}
function repel(sim, a, dx, dy, dz, squared, count, salt, b = null) {
  if (squared < .0001) {
    const offset = seed(a.path + '\0' + salt);
    dx = offset.x; dy = offset.y; dz = offset.z; squared = dx * dx + dy * dy + dz * dz;
  }
  const distance = Math.sqrt(squared);
  const scale = (Math.min(PHYSICS.forceCap * Math.sqrt(count), PHYSICS.repulsion * sim.forces.repulsion * count / (squared + PHYSICS.softening))
    + Math.max(0, PHYSICS.collisionRadius * 2 - distance) * PHYSICS.collisionStrength) / distance;
  const fx = dx * scale, fy = dy * scale, fz = dz * scale;
  a.fx -= fx; a.fy -= fy; a.fz -= fz;
  if (b) { b.fx += fx; b.fy += fy; b.fz += fz; }
  sim.interactions++;
}
export class GraphPhysics {
  constructor(nodes = [], edges = [], selected = null) { this.tree = new Octree(); this.positionVersion = 0; this.version = 0; this.staged = new Float64Array(0); this.nodes = new Map(); this.forces = { ...DEFAULT_FORCES }; this.root = selected; this.selected = selected; this.setGraph(nodes, edges); }
  setGraph(nodes, edges) {
    const previous = this.nodes;
    this.nodes = new Map(nodes.map(node => [node.path, previous.get(node.path) || {
      path: node.path, ...seed(node.path), vx: 0, vy: 0, vz: 0, pinned: false,
    }]));
    this.outgoing = new Map([...this.nodes.keys()].map(path => [path, new Set()]));
    for (const edge of edges) {
      const a = this.nodes.get(edge.source), b = this.nodes.get(edge.destination);
      if (!a || !b || a === b) continue;
      this.outgoing.get(edge.source).add(edge.destination);
      for (const [node, neighbor] of [[a, b], [b, a]]) if (!previous.has(node.path) && previous.has(neighbor.path)) {
        const offset = seed(node.path);
        node.x = neighbor.x + offset.x * .3; node.y = neighbor.y + offset.y * .3; node.z = neighbor.z + offset.z * .3;
      }
    }
    this.all = [...this.nodes.values()];
    if (!this.all.length) { this.staged.fill(0); this.staged = new Float64Array(0); }
    else if (this.staged.length < this.all.length * 6) this.staged = new Float64Array(this.all.length * 6);
    if (!this.all.length) this.tree = new Octree();
    this.positionVersion++; this.updateSprings(); this.reheat();
  }
  setSelection(selected) {
    if (selected === this.selected) return;
    this.selected = selected;
  }
  setRoot(root) {
    if (root === this.root) return;
    this.root = root; this.updateSprings(); this.reheat();
  }
  // Opening root and topology own this cache. A full outgoing BFS keeps every
  // shortest-path parent rather than the first parent discovered by traversal.
  updateSprings() {
    this.depths = new Map([...this.nodes.keys()].map(path => [path, Infinity]));
    const queue = [];
    if (this.nodes.has(this.root)) { this.depths.set(this.root, 0); queue.push(this.root); }
    for (let i = 0; i < queue.length; i++) {
      const source = queue[i], depth = this.depths.get(source) + 1;
      for (const destination of this.outgoing.get(source)) if (this.depths.get(destination) === Infinity) {
        this.depths.set(destination, depth); queue.push(destination);
      }
    }
    this.springs = [];
    for (const source of queue) for (const destination of this.outgoing.get(source)) {
      if (this.isSpringEdge(source, destination)) this.springs.push([this.nodes.get(source), this.nodes.get(destination)]);
    }
    // Each adjacency is unique. Reciprocal records cannot both advance depth,
    // so every active unordered pair has exactly one equal-strength spring.
  }
  // Shared with rendering: rest, pause, occurrence counts and visual hop tiers
  // do not affect the opening-root directed shortest-parent structure.
  isSpringEdge(source, destination) {
    const depth = this.depths.get(source);
    return Number.isFinite(depth) && this.depths.get(destination) === depth + 1;
  }
  setForces(value) { this.forces = validateForces(value); this.reheat(); }
  cancelPending() { this.version++; this.pendingStep = null; this.accumulator = 0; }
  pause() {
    this.cancelPending(); this.active = false;
    let changed = false;
    for (const n of this.all) { changed ||= n.vx !== 0 || n.vy !== 0 || n.vz !== 0; n.vx = n.vy = n.vz = 0; }
    if (changed) this.positionVersion++;
  }
  reheat() { this.cancelPending(); this.active = true; this.steps = 0; this.quiet = 0; this.accumulator = 0; this.limitReached = false; }
  pin(path, x, y, z = this.nodes.get(path)?.z ?? 0) {
    const node = this.nodes.get(path);
    if (!node || ![x, y, z].every(Number.isFinite)) return;
    Object.assign(node, { x, y, z, vx: 0, vy: 0, vz: 0, pinned: true }); this.positionVersion++; this.reheat();
  }
  unpin(path) { const node = this.nodes.get(path); if (node) { node.pinned = false; node.vx = node.vy = node.vz = 0; this.positionVersion++; this.reheat(); } }
  releaseAll() {
    this.cancelPending();
    let changed = false;
    for (const node of this.all) { changed ||= node.pinned; node.pinned = false; }
    if (changed) this.positionVersion++;
  }
  step() {
    if (!this.active) return;
    const work = this.pendingStep || this.stepWork();
    while (!work.next().done) { /* Synchronous small-layout/manual settling. */ }
    this.pendingStep = null;
  }
  // Capture the epoch at creation, including generators retained before first next().
  stepWork(chunkSize = PHYSICS.chunkSize) { return this.integrateStep(this.version, chunkSize); }
  *integrateStep(version, chunkSize) {
    if (version !== this.version) return;
    const all = this.all, staged = this.staged; this.interactions = 0;
    let work = 0;
    for (const n of all) {
      n.fx = -n.x * PHYSICS.center * this.forces.gravity; n.fy = -n.y * PHYSICS.center * this.forces.gravity; n.fz = -n.z * PHYSICS.center * this.forces.gravity;
      if (chunkSize && ++work % chunkSize === 0) { yield; if (version !== this.version) return; }
    }
    if (all.length <= 64) {
      for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
        const a = all[i], b = all[j], dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
        repel(this, a, dx, dy, dz, dx * dx + dy * dy + dz * dz, 1, b.path, b);
        if (chunkSize && ++work % chunkSize === 0) { yield; if (version !== this.version) return; }
      }
    } else {
      const tree = this.tree, build = tree.build(all, chunkSize);
      while (!build.next().done) { yield; if (version !== this.version) return; }
      for (const a of all) {
        const stack = tree.stack; let length = 1, visits = 0; stack[0] = 1;
        while (length) {
          // Positive indices own the target; only its actual insertion octant
          // inherits ownership. Adjacent split-boundary cells never subtract it.
          const entry = stack[--length], owns = entry > 0, c = tree.cells[Math.abs(entry) - 1]; visits++;
          const count = c.count - (owns ? 1 : 0);
          if (count <= 0) continue;
          const x = owns ? (c.sx - a.x) / count : c.mx;
          const y = owns ? (c.sy - a.y) / count : c.my;
          const z = owns ? (c.sz - a.z) / count : c.mz;
          const dx = x - a.x, dy = y - a.y, dz = z - a.z, squared = dx * dx + dy * dy + dz * dz;
          if (c.split && visits + length + c.childCount <= PHYSICS.visits
              && (owns || c.radius * c.radius * 4 > .81 * Math.max(1, squared))) {
            const octant = owns ? tree.octant(a, c) : -1;
            for (let i = 0; i < 8; i++) if (c.children[i] >= 0) stack[length++] = (c.children[i] + 1) * (i === octant ? 1 : -1);
          } else repel(this, a, dx, dy, dz, squared, count, 'cell');
        }
        if (chunkSize && ++work % chunkSize === 0) { yield; if (version !== this.version) return; }
      }
    }
    for (const [a, b] of this.springs) {
      const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, distance = Math.max(.01, Math.hypot(dx, dy, dz));
      const spring = PHYSICS.stiffness * this.forces.spring * (distance - PHYSICS.restLength) / distance;
      a.fx += dx * spring; a.fy += dy * spring; a.fz += dz * spring;
      b.fx -= dx * spring; b.fy -= dy * spring; b.fz -= dz * spring;
      if (chunkSize && ++work % chunkSize === 0) { yield; if (version !== this.version) return; }
    }
    let maxSpeed = 0, anyPinned = false;
    const dt = PHYSICS.step, damping = Math.exp(-PHYSICS.damping * dt), cooling = Math.max(.08, 1 - this.steps / PHYSICS.maxSteps);
    for (let i = 0; i < all.length; i++) {
      const n = all[i], offset = i * 6;
      let vx = n.vx, vy = n.vy, vz = n.vz;
      if (n.pinned) anyPinned = true;
      else {
        vx = (vx + n.fx * dt * cooling) * damping;
        vy = (vy + n.fy * dt * cooling) * damping;
        vz = (vz + n.fz * dt * cooling) * damping;
        const speed = Math.hypot(vx, vy, vz), factor = Math.min(1, PHYSICS.speedCap / Math.max(1, speed));
        vx *= factor; vy *= factor; vz *= factor;
        maxSpeed = Math.max(maxSpeed, Math.min(speed, PHYSICS.speedCap));
      }
      staged[offset] = n.x + (n.pinned ? 0 : vx * dt);
      staged[offset + 1] = n.y + (n.pinned ? 0 : vy * dt);
      staged[offset + 2] = n.z + (n.pinned ? 0 : vz * dt);
      staged[offset + 3] = vx; staged[offset + 4] = vy; staged[offset + 5] = vz;
      if (chunkSize && ++work % chunkSize === 0) { yield; if (version !== this.version) return; }
    }
    const steps = this.steps + 1, quiet = maxSpeed < PHYSICS.restSpeed && !anyPinned ? this.quiet + 1 : 0;
    const resting = steps >= PHYSICS.maxSteps || quiet >= PHYSICS.restSteps || !all.length;
    // One non-yielding publication keeps every public node on the same step.
    if (version !== this.version) return;
    for (let i = 0; i < all.length; i++) {
      const n = all[i], offset = i * 6;
      n.x = staged[offset]; n.y = staged[offset + 1]; n.z = staged[offset + 2];
      n.vx = resting ? 0 : staged[offset + 3];
      n.vy = resting ? 0 : staged[offset + 4];
      n.vz = resting ? 0 : staged[offset + 5];
    }
    this.steps = steps; this.quiet = quiet; this.positionVersion++;
    if (resting) { this.limitReached = steps >= PHYSICS.maxSteps; this.active = false; }
  }
  advance(elapsed) {
    if (!Number.isFinite(elapsed) || elapsed <= 0 || !this.active) return this.active;
    this.accumulator = Math.min(PHYSICS.step * PHYSICS.catchUp, this.accumulator + elapsed);
    const deadline = performance.now() + PHYSICS.frameMilliseconds;
    let completed = 0;
    while (this.active && completed < PHYSICS.catchUp && (this.pendingStep || this.accumulator >= PHYSICS.step)) {
      this.pendingStep ||= this.stepWork();
      if (this.pendingStep.next().done) {
        this.pendingStep = null;
        this.accumulator = Math.max(0, this.accumulator - PHYSICS.step);
        completed++;
      }
      if (performance.now() >= deadline) break;
    }
    return this.active;
  }
  settle(maxSteps = 240) {
    this.cancelPending();
    for (let i = 0; i < Math.min(maxSteps, PHYSICS.maxSteps) && this.active; i++) this.step();
    this.pause(); this.releaseAll();
    for (const n of this.all) n.vx = n.vy = n.vz = 0;
    this.positionVersion++;
  }
  destroy() { this.pause(); this.releaseAll(); this.staged.fill(0); this.staged = new Float64Array(0); this.positionVersion++; this.tree = new Octree(); this.nodes.clear(); this.outgoing.clear(); this.depths.clear(); this.all = []; this.springs = []; }
}
