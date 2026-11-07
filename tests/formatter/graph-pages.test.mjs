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
test('client budget preserves the unconsumed continuation and never calls a partial window complete', () => {
  const pages = new GraphPages({ maxNodes: 2, maxEdges: 2 });
  pages.accept(page(['a'], [], 'two'));
  assert.equal(pages.accept(page(['b', 'c']), true), false);
  assert.equal(pages.data.next_cursor, 'two');
  assert.equal(pages.limited, true);
  assert.equal(pages.complete, false);
  assert.deepEqual(pages.data.nodes.map(n => n.path), ['a']);
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

test('continuing empty pages have an explicit resource bound and keep the unconsumed cursor', () => {
  const pages = new GraphPages({ maxPages: 2 });
  pages.accept(page(['a'], [], 'two'));
  pages.accept(page([], [], 'three'), true);
  assert.equal(pages.accept(page([], [], 'four'), true), false);
  assert.equal(pages.data.next_cursor, 'three'); assert.equal(pages.complete, false);
  assert.equal(pages.limited, true);
});
