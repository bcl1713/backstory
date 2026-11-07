// Layout coordinates are presentation only. No inferred links or semantic weights.
export const PHYSICS = Object.freeze({ step: 1 / 60, catchUp: 4, restLength: 90,
  stiffness: 8, repulsion: 1200000, softening: 144, forceCap: 300,
  collisionRadius: 22, collisionStrength: 20, center: .04, damping: 4.8,
  speedCap: 600, maxSteps: 720, restSpeed: 2, restSteps: 45 });

function hash(path) {
  let value = 2166136261;
  for (const char of path) value = Math.imul(value ^ char.codePointAt(0), 16777619);
  return value >>> 0;
}
function seed(path) {
  const h = hash(path), angle = h / 4294967296 * Math.PI * 2;
  const radius = 60 + h % 240;
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
}

export class GraphPhysics {
  constructor(nodes = [], edges = []) {
    this.nodes = new Map();
    this.setGraph(nodes, edges);
  }
  setGraph(nodes, edges) {
    if (nodes.length > 200 || edges.length > 500) throw new RangeError('Graph budget exceeded');
    const previous = this.nodes;
    this.nodes = new Map(nodes.map(node => [node.path, previous.get(node.path) || {
      path: node.path, ...seed(node.path), vx: 0, vy: 0, pinned: false,
    }]));
    const pairs = new Set();
    this.springs = [];
    for (const edge of edges) {
      const a = this.nodes.get(edge.source), b = this.nodes.get(edge.destination);
      if (!a || !b || a === b) continue;
      const key = JSON.stringify([edge.source, edge.destination].sort());
      if (pairs.has(key)) continue;
      pairs.add(key);
      this.springs.push([a, b]);
      // New notes enter close to an existing linked neighbor, with a stable
      // offset. Existing positions survive refreshes, filtering and expansion.
      for (const [node, neighbor] of [[a, b], [b, a]]) {
        if (!previous.has(node.path) && previous.has(neighbor.path)) {
          const offset = seed(node.path);
          node.x = neighbor.x + offset.x * .3; node.y = neighbor.y + offset.y * .3;
        }
      }
    }
    this.reheat();
  }
  reheat() { this.active = true; this.steps = 0; this.quiet = 0; this.accumulator = 0; this.limitReached = false; }
  pin(path, x, y) {
    const node = this.nodes.get(path);
    if (!node || !Number.isFinite(x) || !Number.isFinite(y)) return;
    node.x = x; node.y = y; node.vx = node.vy = 0; node.pinned = true;
    this.reheat();
  }
  unpin(path) {
    const node = this.nodes.get(path);
    if (node) { node.pinned = false; node.vx = node.vy = 0; this.reheat(); }
  }
  releaseAll() { for (const node of this.nodes.values()) node.pinned = false; }
  step() {
    if (!this.active) return;
    const all = [...this.nodes.values()];
    const forces = new Map(all.map(node => [node, { x: -node.x * PHYSICS.center, y: -node.y * PHYSICS.center }]));
    const apply = (a, b, x, y) => { forces.get(a).x += x; forces.get(a).y += y; forces.get(b).x -= x; forces.get(b).y -= y; };
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
      const a = all[i], b = all[j];
      let dx = b.x - a.x, dy = b.y - a.y;
      let distance = Math.hypot(dx, dy);
      if (distance < .01) {
        const angle = hash(a.path + '\0' + b.path) / 4294967296 * Math.PI * 2;
        dx = Math.cos(angle) * .01; dy = Math.sin(angle) * .01; distance = .01;
      }
      const repel = Math.min(PHYSICS.forceCap, PHYSICS.repulsion / (distance * distance + PHYSICS.softening));
      const collision = Math.max(0, PHYSICS.collisionRadius * 2 - distance) * PHYSICS.collisionStrength;
      apply(a, b, -dx / distance * (repel + collision), -dy / distance * (repel + collision));
    }
    for (const [a, b] of this.springs) {
      const dx = b.x - a.x, dy = b.y - a.y, distance = Math.max(.01, Math.hypot(dx, dy));
      const spring = PHYSICS.stiffness * (distance - PHYSICS.restLength);
      apply(a, b, dx / distance * spring, dy / distance * spring);
    }
    let maxSpeed = 0;
    const dt = PHYSICS.step, damping = Math.exp(-PHYSICS.damping * dt);
    for (const node of all) {
      if (node.pinned) continue;
      const force = forces.get(node);
      node.vx = (node.vx + force.x * dt) * damping;
      node.vy = (node.vy + force.y * dt) * damping;
      const speed = Math.hypot(node.vx, node.vy);
      if (speed > PHYSICS.speedCap) { node.vx *= PHYSICS.speedCap / speed; node.vy *= PHYSICS.speedCap / speed; }
      node.x += node.vx * dt; node.y += node.vy * dt;
      maxSpeed = Math.max(maxSpeed, Math.min(speed, PHYSICS.speedCap));
    }
    this.steps++;
    this.quiet = maxSpeed < PHYSICS.restSpeed && !all.some(node => node.pinned) ? this.quiet + 1 : 0;
    if (this.steps >= PHYSICS.maxSteps || this.quiet >= PHYSICS.restSteps || !all.length) {
      this.limitReached = this.steps >= PHYSICS.maxSteps;
      this.active = false;
      for (const node of all) node.vx = node.vy = 0;
    }
  }
  advance(elapsed) {
    if (!Number.isFinite(elapsed) || elapsed <= 0) return this.active;
    this.accumulator = Math.min(PHYSICS.step * PHYSICS.catchUp, this.accumulator + elapsed);
    let steps = 0;
    while (this.accumulator >= PHYSICS.step && this.active && steps++ < PHYSICS.catchUp) {
      this.step(); this.accumulator -= PHYSICS.step;
    }
    return this.active;
  }
  settle(maxSteps = 240) {
    for (let i = 0; i < Math.min(maxSteps, PHYSICS.maxSteps) && this.active; i++) this.step();
    this.active = false;
    this.releaseAll();
    for (const node of this.nodes.values()) node.vx = node.vy = 0;
  }
  destroy() { this.releaseAll(); this.active = false; this.nodes.clear(); this.springs = []; }
}
