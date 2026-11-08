// Authorized graph evidence lives only in this mounted graph's memory. Rendering
// and selection operate on an outgoing adjacency index, never another query.
export class GraphSnapshot {
  constructor(origin) { this.origin = origin; this.clear(); }
  clear() {
    this.scope = null; this.root = null; this.seeds = new Set(); this.visiblePaths = []; this.suspend();
  }
  suspend() {
    this.data = null; this.nodes = new Map(); this.outgoing = new Map(); this.incoming = new Map();
  }
  accept(data) {
    try {
      if (!data || data.schema_version !== 1 || data.untrusted_content !== true || data.authoritative !== false ||
          typeof data.scope !== 'string' || !data.scope || data.scope.length > 4096 ||
          typeof data.snapshot_id !== 'string' || !data.snapshot_id || data.snapshot_id.length > 4096 || data.next_cursor !== null ||
          !data.freshness || typeof data.freshness.state !== 'string' || typeof data.projection_complete !== 'boolean' ||
          !Array.isArray(data.limiting_reasons) || !data.limiting_reasons.every(reason => typeof reason === 'string') ||
          !Array.isArray(data.nodes) || !Array.isArray(data.edges)) throw new Error('invalid_response');
      const nodes = new Map(), outgoing = new Map(), incoming = new Map(), pairs = new Set();
      for (const node of data.nodes) {
        if (!node || typeof node.path !== 'string' || !node.path || typeof node.title !== 'string' ||
            typeof node.revision !== 'string' || typeof node.href !== 'string' || nodes.has(node.path)) throw new Error('invalid_response');
        const url = new URL(node.href, this.origin);
        if (url.origin !== this.origin || !url.pathname.startsWith('/notes/') || decodeURIComponent(url.pathname.slice(7)) !== node.path ||
            url.search || url.hash || url.username || url.password) throw new Error('invalid_response');
        nodes.set(node.path, node); outgoing.set(node.path, []); incoming.set(node.path, []);
      }
      for (const edge of data.edges) {
        if (!edge || !nodes.has(edge.source) || !nodes.has(edge.destination) ||
            !Number.isSafeInteger(edge.occurrence_count) || edge.occurrence_count <= 0) throw new Error('invalid_response');
        const key = JSON.stringify([edge.source, edge.destination]);
        if (pairs.has(key)) throw new Error('invalid_response'); pairs.add(key);
        outgoing.get(edge.source).push(edge); incoming.get(edge.destination).push(edge);
      }
      const sameScope = this.scope === data.scope;
      if (!sameScope) { this.seeds.clear(); this.visiblePaths = []; }
      else for (const seed of this.seeds) if (!nodes.has(seed)) this.seeds.delete(seed);
      this.scope = data.scope; this.data = data; this.nodes = nodes; this.outgoing = outgoing; this.incoming = incoming;
      return sameScope;
    } catch {
      this.clear(); throw new Error('invalid_response');
    }
  }
  get complete() { return Boolean(this.data?.projection_complete && !this.data.limiting_reasons.length); }
  expand(path) { if (this.nodes.has(path)) this.seeds.add(path); }
  explore(root, depth = 2) {
    if (!this.data) return null;
    root = root || null;
    if (root !== this.root) { this.seeds.clear(); this.visiblePaths = []; this.root = root; }
    if (!root) return this.data;
    this.expand(root);
    const hops = Math.max(1, Math.min(8, Number(depth) || 1));
    const distances = new Map([...this.seeds].filter(path => this.nodes.has(path)).map(path => [path,0]));
    const queue = [...distances.keys()];
    for (let i = 0; i < queue.length; i++) {
      const source = queue[i], distance = distances.get(source);
      if (distance >= hops) continue;
      for (const edge of this.outgoing.get(source)) if (!distances.has(edge.destination)) {
        distances.set(edge.destination, distance + 1); queue.push(edge.destination);
      }
    }
    const retained = this.visiblePaths.filter(path => distances.has(path));
    const seen = new Set(retained);
    for (const node of this.data.nodes) if (distances.has(node.path) && !seen.has(node.path)) retained.push(node.path);
    this.visiblePaths = retained;
    return {...this.data, nodes:retained.map(path => this.nodes.get(path)),
      edges:this.data.edges.filter(edge => distances.has(edge.source) && distances.has(edge.destination))};
  }
  connections(path) { return {incoming:this.incoming.get(path) || [], outgoing:this.outgoing.get(path) || []}; }
}
