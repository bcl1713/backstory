import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import * as renderer from '../../static/src/graph-view.js';
import { GraphPhysics } from '../../static/src/graph-physics.js';
import { GraphCamera } from '../../static/src/graph-camera.js';
import { emission } from '../../static/src/graph-layout.js';

test('directed spring context stays quiet across root changes, appended shortcuts and pause', () => {
  const data = { nodes: ['a', 'b', 'c', 'd', 'unreachable', 'inbound'].map(path => ({ path })),
    edges: [['a', 'b'], ['a', 'c'], ['b', 'd'], ['c', 'd'], ['b', 'c'], ['d', 'a'],
      ['b', 'a'], ['unreachable', 'inbound'], ['inbound', 'a']].map(([source, destination]) => ({ source, destination })) };
  const view = Object.assign(Object.create(renderer.GraphView.prototype), {
    data, simulation: new GraphPhysics(data.nodes, data.edges, 'a'), camera: new GraphCamera(),
    scene: new THREE.Scene(), selected: 'a', focused: 'b', paused: true, loaded: true,
    forced: { matches: false }, color: new THREE.Color(),
    theme: { node: '#8ab4f8', highlight: '#c5a5ff', focus: '#f4c95d', edge: '#8a919d', bloom: '#8ab4f8' },
    container: { dataset: {}, setAttribute() {} }, release() {}, wake() {},
    draw() { if (this.batch) this.applyColors(4); },
  });
  const inspect = expected => {
    const active = new Set(expected);
    data.edges.forEach((edge, i) => {
      const eligible = active.has(`${edge.source}:${edge.destination}`);
      assert.equal(view.simulation.isSpringEdge(edge.source, edge.destination), eligible);
      for (const [object, vertices] of [[view.batch.edges, 2], [view.batch.arrows, 3], [view.batch.edgeHalos, 6]]) {
        const colors = object.geometry.attributes.color;
        assert.equal(colors.itemSize, 4, 'batched vertex alpha provides per-edge transparency');
        for (let v = 0; v < vertices; v++) {
          const alpha = colors.getW(i * vertices + v);
          assert.ok(eligible ? alpha === 1 : alpha > 0 && alpha <= .15, `${edge.source}:${edge.destination} alpha ${alpha}`);
        }
      }
    });
    assert.equal(view.batch.edges.geometry.attributes.position.count, data.edges.length * 2);
    assert.equal(view.simulation.active, false, 'settled/paused physics retains eligibility');
  };
  view.setGraph(data, 'a'); inspect(['a:b', 'a:c', 'b:d', 'c:d']);
  const before = view.simulation.all.map(n => [n.x, n.y, n.z]);
  view.setSelection('b', 'b'); inspect(['a:b', 'a:c', 'b:d', 'c:d']);
  assert.deepEqual(view.simulation.all.map(n => [n.x, n.y, n.z]), before);
  view.setSelection('a', 'b');
  data.edges.push({ source: 'a', destination: 'd' });
  view.setGraph(data, 'a'); inspect(['a:b', 'a:c', 'a:d']);
  view.theme.edge = '#324050'; view.theme.bloom = '#173f7a'; view.applyColors(4);
  inspect(['a:b', 'a:c', 'a:d']);
  const quietHalo = [...view.batch.edgeHalos.geometry.attributes.color.array.slice(4 * 6 * 4, 5 * 6 * 4)];
  view.applyColors(2);
  assert.deepEqual([...view.batch.edgeHalos.geometry.attributes.color.array.slice(4 * 6 * 4, 5 * 6 * 4)], quietHalo,
    'raising Default to High cannot brighten a non-spring halo');
  view.forced.matches = true; view.applyColors(0);
  assert.ok([...view.batch.edges.geometry.attributes.color.array].filter((_, i) => i % 4 === 3).every(a => a === 1), 'forced colors keeps every directed link legible');
  view.batch.dispose();
});

test('bloom default retains old High emission and new High does not saturate there', () => {
  const view = Object.assign(Object.create(renderer.GraphView.prototype), { container: { dataset: {} }, draw() {} });
  assert.equal(emission(0), 1.54, 'fresh default equals the previous intensity-two High');
  view.setBloom(4);
  assert.equal(view.intensity, 4);
  assert.ok(emission(0, view.intensity) > emission(0, 2));
  view.setBloom(0); assert.equal(emission(0, view.intensity), 0);
  view.setBloom(999); assert.equal(view.intensity, 4);
});

test('renderer batches every eligible node and directed edge without per-node objects', () => {
  assert.equal(typeof renderer.createGraphBatches, 'function');
  const nodes = Array.from({ length: 10001 }, (_, i) => ({ path: `n${i}` }));
  const edges = Array.from({ length: 30001 }, (_, i) => ({ source: `n${i % 10001}`, destination: `n${(i + 1) % 10001}` }));
  const batch = renderer.createGraphBatches(nodes, edges);
  assert.ok(batch.nodes instanceof THREE.InstancedMesh);
  assert.equal(batch.nodes.count, 10001);
  assert.equal(batch.edges.geometry.attributes.position.count, 60002);
  assert.equal(batch.arrows.geometry.attributes.position.count, 90003);
  assert.equal(batch.halos.geometry.attributes.position.count, 10001);
  assert.equal(batch.group.children.length, 5);
  assert.equal(batch.edgeHalos.geometry.attributes.position.count, 180006);
  assert.equal(batch.edgeHalos.material.forceSinglePass, true);
  assert.equal(batch.arrows.material.forceSinglePass, true);
  let disposed = 0;
  batch.nodes.geometry.addEventListener('dispose', () => disposed++);
  batch.dispose();
  assert.equal(disposed, 1);
});

test('paused view refreshes spring roots and appended shortcuts without moving camera, nodes or focus', () => {
  const data = { nodes: ['a', 'b', 'c', 'inbound'].map(path => ({ path, title: path })),
    edges: [{ source: 'a', destination: 'b' }, { source: 'b', destination: 'c' }, { source: 'inbound', destination: 'a' }] };
  const view = Object.assign(Object.create(renderer.GraphView.prototype), {
    data, simulation: new GraphPhysics(data.nodes, data.edges, 'a'), camera: new GraphCamera(),
    scene: new THREE.Scene(), selected: 'a', focused: 'b', paused: true, loaded: true,
    container: { dataset: {}, setAttribute() {} }, release() {}, draw() {}, wake() {},
  });
  const position = view.simulation.all.map(n => [n.x, n.y, n.z]);
  const camera = { ...view.camera };
  view.setSelection('a', 'b');
  assert.equal(view.simulation.active, false);
  assert.equal(view.tiers.nodes.get('inbound'), 1, 'highlight membership remains undirected');
  assert.equal(view.simulation.depths.get('inbound'), Infinity, 'spring membership is outgoing only');
  data.edges.push({ source: 'a', destination: 'c' });
  view.setGraph(data, 'a');
  assert.deepEqual(view.simulation.springs.map(([a, b]) => [a.path, b.path]), [['a', 'b'], ['a', 'c']]);
  assert.deepEqual(view.simulation.all.map(n => [n.x, n.y, n.z]), position);
  assert.deepEqual({ ...view.camera }, camera);
  assert.equal(view.focused, 'b');
  assert.equal(view.simulation.active, false);
  view.setSelection('removed', 'b');
  assert.equal(view.simulation.springs.length, 2, 'a missing visual selection does not replace the opening root');
  assert.equal(view.simulation.active, false);
  view.batch.dispose();
});

test('empty checkpoints do not consume first fit and metadata leaves batches and drag alone', () => {
  let fits=0, releases=0;
  const view=Object.assign(Object.create(renderer.GraphView.prototype), {
    data:{nodes:[],edges:[]}, simulation:new GraphPhysics(), camera:new GraphCamera(),
    scene:new THREE.Scene(), selected:null, focused:null, paused:true,
    container:{dataset:{},setAttribute(){}}, release(){releases++;}, draw(){},wake(){},
  });
  view.camera.fit=()=>fits++;
  view.setGraph({nodes:[],edges:[]},'a');
  assert.equal(fits,0); assert.equal(Boolean(view.loaded),false);
  view.setGraph({nodes:[{path:'a',title:'A'}],edges:[]},'a');
  assert.equal(fits,1); assert.equal(view.loaded,true);
  const batch=view.batch, calls=releases; view.drag={path:'a'};
  view.setGraph({nodes:[{path:'a',title:'Renamed'}],edges:[]},'a');
  assert.equal(view.batch,batch); assert.equal(releases,calls);
  assert.deepEqual(view.drag,{path:'a'}); assert.equal(fits,1);
  view.batch.dispose();
});

test('camera control before first data suppresses automatic fit', () => {
  let fits=0;
  const view=Object.assign(Object.create(renderer.GraphView.prototype), {
    data:{nodes:[],edges:[]}, simulation:new GraphPhysics(), camera:new GraphCamera(),
    scene:new THREE.Scene(), selected:null, focused:null, paused:true,
    container:{dataset:{},setAttribute(){}}, release(){},draw(){},wake(){},
  });
  view.camera.fit=()=>fits++;
  view.pan(10,20);
  view.setGraph({nodes:[{path:'a',title:'A'}],edges:[]},'a');
  assert.equal(fits,0); view.batch.dispose();
});
