import { DEFAULT_FORCES, validateForces } from './graph-preferences.js';
// Presentation-only forces; topology and occurrence counts carry no weights.
export const PHYSICS = Object.freeze({ step: 1 / 60, catchUp: 4, restLength: 90,
  stiffness: 8, repulsion: 1200000, softening: 144, forceCap: 300,
  collisionRadius: 22, collisionStrength: 20, center: .04, damping: 4.8,
  speedCap: 600, maxSteps: 720, restSpeed: 2, restSteps: 45,
  visits: 192, chunkSize: 64, frameChunks: 32, frameMilliseconds: 6 });
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
// A depth-bounded octree aggregates coincident leaves instead of comparing every
// overlapping pair. Each target has a fixed visit budget; remaining cells are
// evaluated at their center of mass when the budget is nearly exhausted.
function* treeFor(all) {
  let radius = 1;
  let work = 0;
  for (const n of all) {
    radius = Math.max(radius, Math.abs(n.x), Math.abs(n.y), Math.abs(n.z));
    if (++work % PHYSICS.chunkSize === 0) yield;
  }
  const root = { x: 0, y: 0, z: 0, radius: radius + 1, count: 0, sx: 0, sy: 0, sz: 0 };
  for (const n of all) {
    let cell = root;
    for (let depth = 0; ; depth++) {
      cell.count++; cell.sx += n.x; cell.sy += n.y; cell.sz += n.z;
      if (depth === 16 || cell.radius < .1) break;
      cell.children ||= Array(8);
      const index = (n.x >= cell.x ? 1 : 0) | (n.y >= cell.y ? 2 : 0) | (n.z >= cell.z ? 4 : 0);
      const r = cell.radius / 2;
      cell = cell.children[index] ||= { x: cell.x + (index & 1 ? r : -r),
        y: cell.y + (index & 2 ? r : -r), z: cell.z + (index & 4 ? r : -r),
        radius: r, count: 0, sx: 0, sy: 0, sz: 0 };
    }
    if (++work % PHYSICS.chunkSize === 0) yield;
  }
  return root;
}
export class GraphPhysics {
  constructor(nodes = [], edges = [], selected = null) { this.nodes = new Map(); this.forces = { ...DEFAULT_FORCES }; this.root = selected; this.selected = selected; this.setGraph(nodes, edges); }
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
    this.all = [...this.nodes.values()]; this.updateSprings(); this.reheat();
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
  reheat() { this.pendingStep = null; this.active = true; this.steps = 0; this.quiet = 0; this.accumulator = 0; this.limitReached = false; }
  pin(path, x, y, z = this.nodes.get(path)?.z ?? 0) {
    const node = this.nodes.get(path);
    if (!node || ![x, y, z].every(Number.isFinite)) return;
    Object.assign(node, { x, y, z, vx: 0, vy: 0, vz: 0, pinned: true }); this.reheat();
  }
  unpin(path) { const node = this.nodes.get(path); if (node) { node.pinned = false; node.vx = node.vy = node.vz = 0; this.reheat(); } }
  releaseAll() { for (const node of this.all) node.pinned = false; }
  step() {
    if (!this.active) return;
    const work = this.pendingStep || this.stepWork();
    while (!work.next().done) { /* Synchronous small-layout/manual settling. */ }
    this.pendingStep = null;
  }
  *stepWork() {
    const all = this.all; this.interactions = 0;
    let work = 0;
    for (const n of all) {
      n.fx = -n.x * PHYSICS.center * this.forces.gravity; n.fy = -n.y * PHYSICS.center * this.forces.gravity; n.fz = -n.z * PHYSICS.center * this.forces.gravity;
      if (++work % PHYSICS.chunkSize === 0) yield;
    }
    const repel = (a, x, y, z, count, salt) => {
      let dx = x - a.x, dy = y - a.y, dz = z - a.z, distance = Math.hypot(dx, dy, dz);
      if (distance < .01) { const offset = seed(a.path + '\0' + salt); dx = offset.x; dy = offset.y; dz = offset.z; distance = Math.hypot(dx, dy, dz); }
      const force = Math.min(PHYSICS.forceCap * Math.sqrt(count), PHYSICS.repulsion * this.forces.repulsion * count / (distance * distance + PHYSICS.softening)) + Math.max(0, PHYSICS.collisionRadius * 2 - distance) * PHYSICS.collisionStrength;
      a.fx -= dx / distance * force; a.fy -= dy / distance * force; a.fz -= dz / distance * force;
      this.interactions++;
    };
    if (all.length <= 256) {
      for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
        const a = all[i], b = all[j], before = [a.fx, a.fy, a.fz];
        repel(a, b.x, b.y, b.z, 1, b.path);
        b.fx -= a.fx - before[0]; b.fy -= a.fy - before[1]; b.fz -= a.fz - before[2];
      }
    } else {
      const root = yield* treeFor(all);
      for (const a of all) {
        const stack = [root]; let visits = 0;
        while (stack.length) {
          const c = stack.pop(); visits++;
          const contains = Math.abs(a.x - c.x) <= c.radius && Math.abs(a.y - c.y) <= c.radius && Math.abs(a.z - c.z) <= c.radius;
          const count = c.count - (contains ? 1 : 0);
          if (count <= 0) continue;
          const x = (c.sx - (contains ? a.x : 0)) / count, y = (c.sy - (contains ? a.y : 0)) / count, z = (c.sz - (contains ? a.z : 0)) / count;
          if (c.children && visits + stack.length + 8 < PHYSICS.visits && (contains || c.radius * 2 / Math.max(1, Math.hypot(x - a.x, y - a.y, z - a.z)) > .9)) {
            for (const child of c.children) if (child) stack.push(child);
          } else repel(a, x, y, z, count, 'cell');
        }
        if (++work % PHYSICS.chunkSize === 0) yield;
      }
    }
    for (const [a, b] of this.springs) {
      const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, distance = Math.max(.01, Math.hypot(dx, dy, dz));
      const spring = PHYSICS.stiffness * this.forces.spring * (distance - PHYSICS.restLength) / distance;
      a.fx += dx * spring; a.fy += dy * spring; a.fz += dz * spring;
      b.fx -= dx * spring; b.fy -= dy * spring; b.fz -= dz * spring;
      if (++work % PHYSICS.chunkSize === 0) yield;
    }
    let maxSpeed = 0, anyPinned = false;
    const dt = PHYSICS.step, damping = Math.exp(-PHYSICS.damping * dt), cooling = Math.max(.08, 1 - this.steps / PHYSICS.maxSteps);
    for (const n of all) {
      if (++work % PHYSICS.chunkSize === 0) yield;
      if (n.pinned) { anyPinned = true; continue; }
      n.vx = (n.vx + n.fx * dt * cooling) * damping; n.vy = (n.vy + n.fy * dt * cooling) * damping; n.vz = (n.vz + n.fz * dt * cooling) * damping;
      const speed = Math.hypot(n.vx, n.vy, n.vz), factor = Math.min(1, PHYSICS.speedCap / Math.max(1, speed));
      n.vx *= factor; n.vy *= factor; n.vz *= factor;
      n.x += n.vx * dt; n.y += n.vy * dt; n.z += n.vz * dt;
      maxSpeed = Math.max(maxSpeed, Math.min(speed, PHYSICS.speedCap));
    }
    this.steps++; this.quiet = maxSpeed < PHYSICS.restSpeed && !anyPinned ? this.quiet + 1 : 0;
    if (this.steps >= PHYSICS.maxSteps || this.quiet >= PHYSICS.restSteps || !all.length) {
      this.limitReached = this.steps >= PHYSICS.maxSteps;
      for (const n of all) { n.vx = n.vy = n.vz = 0; if (++work % PHYSICS.chunkSize === 0) yield; }
      this.active = false;
    }
  }
  advance(elapsed) {
    if (!Number.isFinite(elapsed) || elapsed <= 0) return this.active;
    this.accumulator = Math.min(PHYSICS.step * PHYSICS.catchUp, this.accumulator + elapsed);
    if (this.all.length > 256) {
      // All records participate, but a large fixed step spans frames. Both the
      // chunk count and time budget bound work, independent of graph size.
      const deadline = performance.now() + PHYSICS.frameMilliseconds;
      this.pendingStep ||= this.active && this.accumulator >= PHYSICS.step ? this.stepWork() : null;
      for (let chunks = 0; this.pendingStep && chunks < PHYSICS.frameChunks; chunks++) {
        if (this.pendingStep.next().done) { this.pendingStep = null; this.accumulator -= PHYSICS.step; break; }
        if (performance.now() >= deadline) break;
      }
      return this.active;
    }
    let steps = 0;
    while (this.accumulator >= PHYSICS.step && this.active && steps++ < PHYSICS.catchUp) { this.step(); this.accumulator -= PHYSICS.step; }
    return this.active;
  }
  settle(maxSteps = 240) {
    for (let i = 0; i < Math.min(maxSteps, PHYSICS.maxSteps) && this.active; i++) this.step();
    this.pendingStep = null; this.active = false; this.releaseAll(); for (const n of this.all) n.vx = n.vy = n.vz = 0;
  }
  destroy() { this.pendingStep = null; this.releaseAll(); this.active = false; this.nodes.clear(); this.outgoing.clear(); this.depths.clear(); this.all = []; this.springs = []; }
}
