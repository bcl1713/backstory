import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import * as renderer from '../../static/src/graph-view.js';
import { GraphPhysics } from '../../static/src/graph-physics.js';
import { GraphCamera } from '../../static/src/graph-camera.js';

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
  assert.equal(view.simulation.springs.length, 0);
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
