// API budgets bound a response, not the graph accumulated by an exploration.
const stamp = data => JSON.stringify([data.generation, data.mutation, data.relation_epoch, data.eligibility_version]);
const pagingReasons = new Set(['page_limit', 'node_limit', 'edge_limit', 'candidate_limit', 'discovery_pending']);
export class GraphPages {
  constructor() { this.clear(); }
  clear() {
    this.cursors = new Set(); this.data = null; this.reasons = new Set(); this.evidenceIncomplete = false;
    this.nodeIndex = new Map(); this.edgeIndex = new Map();
  }
  get complete() {
    return Boolean(this.data && !this.data.next_cursor && this.data.projection_complete && !this.reasons.size);
  }
  accept(data, append = false) {
    if (append && this.data && stamp(data) !== stamp(this.data)) throw new Error('restart_required');
    if (append && data.next_cursor && this.cursors.has(data.next_cursor)) throw new Error('continuation_stalled');
    if (!append) this.clear();
    // Update only the incoming window. Rebuilding maps/arrays from the entire
    // graph for each small page made accumulation quadratic in loaded records.
    const nodes = this.data?.nodes || [], edges = this.data?.edges || [];
    for (const node of data.nodes) {
      if (this.nodeIndex.has(node.path)) nodes[this.nodeIndex.get(node.path)] = node;
      else { this.nodeIndex.set(node.path, nodes.length); nodes.push(node); }
    }
    // Counts are full directed aggregates. Repeated pairs replace, never add.
    for (const edge of data.edges) {
      const key = JSON.stringify([edge.source, edge.destination]);
      if (this.edgeIndex.has(key)) edges[this.edgeIndex.get(key)] = edge;
      else { this.edgeIndex.set(key, edges.length); edges.push(edge); }
    }
    for (const reason of data.limiting_reasons || []) if (!pagingReasons.has(reason)) this.reasons.add(reason);
    const reasons = data.limiting_reasons || [];
    if (!data.projection_complete && (!reasons.length || reasons.some(reason => !pagingReasons.has(reason)))) this.evidenceIncomplete = true;
    if (data.next_cursor) this.cursors.add(data.next_cursor);
    this.data = { ...data, nodes, edges, projection_complete: !this.evidenceIncomplete,
      boundary_connections: data.boundary_connections || Boolean(append && this.data?.boundary_connections) };
    return true;
  }
}
