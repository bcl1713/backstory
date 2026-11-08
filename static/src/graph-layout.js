// Topological light rings are computed on selection/topology changes only.
export function hopTiers(nodes, edges, selected) {
  const distances = new Map(nodes.map(node => [node.path, Infinity]));
  const adjacent = new Map(nodes.map(node => [node.path, new Set()]));
  for (const { source, destination } of edges) {
    if (!adjacent.has(source) || !adjacent.has(destination)) continue;
    adjacent.get(source).add(destination); adjacent.get(destination).add(source);
  }
  const queue = [];
  if (distances.has(selected)) { distances.set(selected, 0); queue.push(selected); }
  for (let index = 0; index < queue.length; index++) {
    const path = queue[index];
    for (const neighbor of adjacent.get(path)) if (distances.get(neighbor) === Infinity) {
      distances.set(neighbor, distances.get(path) + 1); queue.push(neighbor);
    }
  }
  return { nodes: distances, edges: edges.map(edge => Math.max(distances.get(edge.source) ?? Infinity, distances.get(edge.destination) ?? Infinity)) };
}
export const BLOOM_DEFAULT = 2;
export const BLOOM_HIGH = 4;
export const emission = (tier, intensity = BLOOM_DEFAULT) => intensity === 0 ? 0 : Math.min(BLOOM_HIGH, Math.max(0, intensity)) * (Number.isFinite(tier) ? .12 + .65 * .52 ** tier : .08);

export function nearestNode(positions, current, direction) {
  const origin = positions.get(current);
  if (!origin) return [...positions.keys()].sort()[0] || null;
  const vectors = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
  const [dx, dy] = vectors[direction];
  let best = current, score = Infinity;
  for (const [path, node] of [...positions].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) {
    const x = node.x - origin.x, y = node.y - origin.y;
    const forward = x * dx + y * dy;
    if (forward <= 0) continue;
    const candidate = Math.hypot(x, y) + Math.abs(x * dy - y * dx) * 2;
    if (candidate < score) { best = path; score = candidate; }
  }
  return best;
}

// Six slow frames to degrade, ninety good frames to recover. Never discard
// graph records to reduce rendering work: only halos, labels and DPR change.
export class AdaptiveQuality {
  constructor() { this.level = 0; this.slow = 0; this.good = 0; }
  sample(elapsed) {
    if (!Number.isFinite(elapsed) || elapsed <= 0) return false;
    const previous = this.level;
    if (elapsed > .04) { this.slow++; this.good = 0; }
    else if (elapsed < .025) { this.good++; this.slow = 0; }
    else { this.good = this.slow = 0; }
    if (this.slow >= 6) { this.level = Math.min(2, this.level + 1); this.slow = 0; }
    if (this.good >= 90) { this.level = Math.max(0, this.level - 1); this.good = 0; }
    return previous !== this.level;
  }
  bloom(intensity, forcedColors = false) { return forcedColors ? 0 : intensity * [1, .5, 0][this.level]; }
  get labels() { return [48, 28, 12][this.level]; }
  get dpr() { return [1.5, 1.25, 1][this.level]; }
}
