import test from 'node:test';
import assert from 'node:assert/strict';
import { GraphSnapshot } from '../../static/src/graph-snapshot.js';
const origin = 'https://wiki.example';
const fixture = (paths, pairs = [], extra = {}) => ({ schema_version: 1, scope: 'session-policy', snapshot_id: 'one',
  next_cursor: null, untrusted_content: true, authoritative: false, generation: 1, mutation: 2, relation_epoch: 3,
  eligibility_version: 'policy', freshness: { state: 'ready' }, projection_complete: true, limiting_reasons: [],
  nodes: paths.map(path => ({path, title: path, revision:'rev', href:'/notes/' + encodeURIComponent(path)})),
  edges: pairs.map(([source,destination,count=1]) => ({source,destination,occurrence_count:count,source_revision:'rev'})), ...extra });
const paths = graph => graph.nodes.map(n=>n.path).sort();
const pairs = graph => graph.edges.map(e=>`${e.source}:${e.destination}:${e.occurrence_count}`).sort();

test('outgoing BFS includes exact depth on chains, diamonds, cycles and isolates', () => {
  const snapshot = new GraphSnapshot(origin);
  snapshot.accept(fixture(['a','b','c','d','isolate'], [['a','b'],['a','c'],['b','d'],['c','d'],['d','a']]));
  assert.deepEqual(paths(snapshot.explore('a',1)), ['a','b','c']);
  assert.deepEqual(paths(snapshot.explore('a',2)), ['a','b','c','d']);
  assert.deepEqual(pairs(snapshot.explore('a',2)), ['a:b:1','a:c:1','b:d:1','c:d:1','d:a:1']);
  assert.deepEqual(paths(snapshot.explore('isolate',8)), ['isolate']);
  assert.deepEqual(paths(snapshot.explore(null,1)), ['a','b','c','d','isolate']);
});
test('selecting a two-hop node expands locally and repeated selection never inflates canonical counts', () => {
  const snapshot = new GraphSnapshot(origin);
  snapshot.accept(fixture(['a','b','c','d','e'], [['a','b',3],['b','c'],['c','d'],['d','e']]));
  assert.deepEqual(paths(snapshot.explore('a',2)), ['a','b','c']);
  snapshot.expand('c');
  assert.deepEqual(paths(snapshot.explore('a',2)), ['a','b','c','d','e']);
  snapshot.expand('c');
  assert.deepEqual(pairs(snapshot.explore('a',2)), ['a:b:3','b:c:1','c:d:1','d:e:1']);
  assert.deepEqual(snapshot.connections('b').incoming.map(e=>e.source), ['a']);
});
test('same-scope refresh recomputes all seeds, removes revoked nodes and discovers shortened paths', () => {
  const snapshot = new GraphSnapshot(origin);
  snapshot.accept(fixture(['a','b','c','d','e'], [['a','b'],['b','c'],['c','d'],['d','e']]));
  snapshot.explore('a',1); snapshot.expand('b'); snapshot.explore('a',1);
  snapshot.accept(fixture(['a','c','d','e'], [['a','c'],['c','d'],['d','e']], {generation:2,snapshot_id:'two'}));
  assert.deepEqual(paths(snapshot.explore('a',2)), ['a','c','d']);
  assert.equal(snapshot.seeds.has('b'), false);
  snapshot.expand('c'); snapshot.explore('a',2);
  snapshot.accept(fixture(['a','c','d','e'], [['a','c'],['c','d'],['d','e']], {scope:'new-policy'}));
  assert.deepEqual(paths(snapshot.explore('a',1)), ['a','c']);
});
test('invalid or untrusted snapshots reject atomically without keeping private evidence', () => {
  const valid = fixture(['a','b'],[['a','b']]);
  for (const change of [{schema_version:2},{scope:''},{next_cursor:'cursor'},{authoritative:true},
    {nodes:[{...valid.nodes[0],href:'https://attacker.example/notes/a'}]},
    {edges:[{source:'a',destination:'hidden',occurrence_count:1}]},
    {edges:[...valid.edges,...valid.edges]}, {nodes:[...valid.nodes,...valid.nodes]},
    {edges:[{...valid.edges[0],occurrence_count:0}]}]) {
    const snapshot = new GraphSnapshot(origin); snapshot.accept(valid);
    assert.throws(()=>snapshot.accept({...valid,...change}), /invalid_response/);
    assert.equal(snapshot.data,null); assert.equal(snapshot.nodes.size,0);
    assert.equal(snapshot.outgoing.size,0); assert.equal(snapshot.seeds.size,0);
  }
});
test('suspension drops every evidence record and only restores seeds after scope revalidation',()=>{
 const snapshot=new GraphSnapshot(origin);const data=fixture(['a','b','c'],[['a','b'],['b','c']]);
 snapshot.accept(data);snapshot.explore('a',1);snapshot.expand('b');snapshot.suspend();
 assert.equal(snapshot.data,null);assert.equal(snapshot.nodes.size,0);assert.equal(snapshot.outgoing.size,0);
 snapshot.accept({...data,snapshot_id:'two'});assert.deepEqual(paths(snapshot.explore('a',1)),['a','b','c']);
 snapshot.suspend();snapshot.accept({...data,scope:'different'});assert.deepEqual(paths(snapshot.explore('a',1)),['a','b']);
});
test('expansion and refresh append new visible paths without reordering surviving nodes',()=>{
 const snapshot=new GraphSnapshot(origin);
 const data=fixture(['a','b','c','d','x'],[['a','b'],['a','x'],['b','c'],['c','d']]);
 snapshot.accept(data);assert.deepEqual(snapshot.explore('a',1).nodes.map(n=>n.path),['a','b','x']);
 snapshot.expand('b');assert.deepEqual(snapshot.explore('a',1).nodes.map(n=>n.path),['a','b','x','c']);
 snapshot.accept({...data,generation:2,snapshot_id:'two'});
 assert.deepEqual(snapshot.explore('a',1).nodes.map(n=>n.path),['a','b','x','c']);
});
