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
export const emission = (tier, intensity = 1) => intensity === 0 ? 0 : Math.min(2, Math.max(0, intensity)) * (Number.isFinite(tier) ? .12 + .65 * .52 ** tier : .08);

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
