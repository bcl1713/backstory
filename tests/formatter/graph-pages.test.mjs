import test from 'node:test';
import assert from 'node:assert/strict';
import { GraphPages } from '../../static/src/graph-pages.js';
const node = path => ({ path, title: path, href: '/notes/' + path, revision: 'r' });
const edge = (source, destination, occurrence_count = 1) => ({ source, destination, occurrence_count });
const page = (nodes, edges = [], next_cursor = null, extra = {}) => ({ nodes: nodes.map(node), edges, next_cursor,
  generation: 1, mutation: 1, relation_epoch: 1, projection_complete: true, freshness: { state: 'ready' }, limiting_reasons: [], ...extra });

test('continuations retain disconnected nodes and merge directed aggregate identity without inflating counts', () => {
  const pages = new GraphPages();
  pages.accept(page(['a', 'b', 'alone'], [edge('a', 'b', 3)], 'two'));
  pages.accept(page(['b', 'c'], [edge('a', 'b', 3), edge('b', 'a'), edge('b', 'c')], 'three'), true);
  pages.accept(page([], [], 'four'), true);
  pages.accept(page(['d']), true);
  assert.deepEqual(pages.data.nodes.map(n => n.path), ['a', 'b', 'alone', 'c', 'd']);
  assert.equal(pages.data.edges.length, 3);
  assert.equal(pages.data.edges[0].occurrence_count, 3);
  assert.equal(pages.complete, true);
});
test('reject mixed epochs atomically and explicit scopes replace accumulated results', () => {
  const pages = new GraphPages();
  pages.accept(page(['a'], [], 'two'));
  assert.throws(() => pages.accept(page(['b'], [], null, { relation_epoch: 2 }), true), /restart_required/);
  assert.deepEqual(pages.data.nodes.map(n => n.path), ['a']);
  pages.accept(page(['b'], [], null, { relation_epoch: 2 }));
  assert.deepEqual(pages.data.nodes.map(n => n.path), ['b']);
});
test('accumulation exceeds former product ceilings without discarding records or continuation', () => {
  const pages = new GraphPages();
  for (let i = 0; i < 101; i++) {
    const paths = Array.from({ length: 100 }, (_, j) => `n${i * 100 + j}`);
    const links = paths.flatMap((path, j) => [edge(path, paths[(j+1)%100]), edge(path, paths[(j+2)%100]), edge(path, paths[(j+3)%100])]);
    assert.equal(pages.accept(page(paths, links, i < 100 ? `p${i+1}` : null), i > 0), true);
  }
  assert.equal(pages.data.nodes.length, 10100);
  assert.equal(pages.data.edges.length, 30300);
  assert.equal(pages.complete, true);
});
test('more pages, unavailable evidence and non-pagination limits cannot report complete', () => {
  const pages = new GraphPages();
  pages.accept(page(['a'], [], 'more'));
  assert.equal(pages.complete, false);
  pages.accept(page(['a'], [], null, { projection_complete: false }));
  assert.equal(pages.complete, false);
  pages.accept(page(['a'], [], null, { limiting_reasons: ['edge_candidate_limit'] }));
  assert.equal(pages.complete, false);
});

test('exhausted candidate-bounded pages can complete without certifying genuinely incomplete evidence', () => {
  const pages = new GraphPages();
  pages.accept(page(['a'], [], 'two', { projection_complete: false, limiting_reasons: ['candidate_limit'] }));
  assert.equal(pages.complete, false);
  pages.accept(page(['b']), true);
  assert.equal(pages.complete, true);
  pages.accept(page(['a'], [], 'two', { projection_complete: false, limiting_reasons: ['projection_incomplete'] }));
  pages.accept(page(['b']), true);
  assert.equal(pages.complete, false);
});

test('non-advancing and cyclic continuations fail before changing accumulated evidence', () => {
  const pages = new GraphPages();
  pages.accept(page(['a'], [], 'two'));
  assert.throws(() => pages.accept(page(['bad'], [], 'two'), true), /continuation_stalled/);
  assert.deepEqual(pages.data.nodes.map(n => n.path), ['a']);
  pages.accept(page([], [], 'three'), true);
  assert.throws(() => pages.accept(page(['bad'], [], 'two'), true), /continuation_stalled/);
  pages.clear(); pages.accept(page(['new'], [], 'two'));
  assert.equal(pages.data.nodes.length, 1);
});

test('empty discovery work can exceed the former page ceiling and still complete', () => {
  const pages = new GraphPages();
  pages.accept(page(['a'], [], 'p0'));
  for (let i = 1; i <= 10001; i++) pages.accept(page([], [], `p${i}`), true);
  pages.accept(page(['b']), true);
  assert.equal(pages.complete, true);
  assert.deepEqual(pages.data.nodes.map(n => n.path), ['a', 'b']);
});

test('empty discovery work does not turn exhausted ready evidence into a permanent partial graph', () => {
  const pages = new GraphPages();
  pages.accept(page([], [], 'discover', { projection_complete: false, limiting_reasons: ['discovery_pending'] }));
  assert.equal(pages.complete, false);
  pages.accept(page(['found']), true);
  assert.equal(pages.complete, true);
  assert.equal(pages.data.nodes[0].path, 'found');
});

test('progress and repeated evidence do not change presentation or topology', () => {
  const pages = new GraphPages();
  pages.accept(page(['a','b'], [edge('a','b')], 'two'));
  assert.equal(pages.changed, true); assert.equal(pages.topologyChanged, true);
  pages.accept(page([], [], 'three', { limiting_reasons: ['discovery_pending'] }), true);
  assert.equal(pages.changed, false); assert.equal(pages.topologyChanged, false);
  pages.accept(page(['a','b'], [edge('a','b')], 'four'), true);
  assert.equal(pages.changed, false); assert.equal(pages.topologyChanged, false);
  pages.accept(page(['a'], [edge('a','b', 2)], 'five'), true);
  assert.equal(pages.changed, true); assert.equal(pages.topologyChanged, false);
  pages.accept(page(['c'], [edge('b','c')]), true);
  assert.equal(pages.changed, true); assert.equal(pages.topologyChanged, true);
});
