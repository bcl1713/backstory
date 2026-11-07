// API budgets bound a response, not the graph accumulated by an exploration.
const stamp = data => JSON.stringify([data.generation, data.mutation, data.relation_epoch, data.eligibility_version]);
const pagingReasons = new Set(['page_limit', 'node_limit', 'edge_limit', 'candidate_limit']);
export class GraphPages {
  constructor({ maxNodes = 10000, maxEdges = 30000 } = {}) {
    this.maxNodes = maxNodes; this.maxEdges = maxEdges; this.clear();
  }
  clear() { this.data = null; this.limited = false; this.reasons = new Set(); this.evidenceIncomplete = false; }
  get complete() {
    return Boolean(this.data && !this.limited && !this.data.next_cursor && this.data.projection_complete && !this.reasons.size);
  }
  accept(data, append = false) {
    if (append && this.data && stamp(data) !== stamp(this.data)) throw new Error('restart_required');
    const nodes = new Map((append ? this.data?.nodes || [] : []).map(n => [n.path, n]));
    const edges = new Map((append ? this.data?.edges || [] : []).map(e => [JSON.stringify([e.source, e.destination]), e]));
    for (const node of data.nodes) nodes.set(node.path, node);
    // Each response reports the full aggregated directed count. Repeated pairs
    // across occurrence pages must replace, never add to that count.
    for (const edge of data.edges) edges.set(JSON.stringify([edge.source, edge.destination]), edge);
    if (nodes.size > this.maxNodes || edges.size > this.maxEdges) { this.limited = true; return false; }
    if (!append) { this.reasons.clear(); this.evidenceIncomplete = false; }
    for (const reason of data.limiting_reasons || []) if (!pagingReasons.has(reason)) this.reasons.add(reason);
    const reasons = data.limiting_reasons || [];
    if (!data.projection_complete && (!reasons.length || reasons.some(reason => !pagingReasons.has(reason)))) this.evidenceIncomplete = true;
    this.limited = false;
    this.data = { ...data, nodes: [...nodes.values()], edges: [...edges.values()],
      projection_complete: !this.evidenceIncomplete,
      boundary_connections: data.boundary_connections || Boolean(append && this.data?.boundary_connections) };
    return true;
  }
}
