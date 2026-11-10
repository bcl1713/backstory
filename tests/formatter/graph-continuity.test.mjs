import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { GraphCamera } from '../../static/src/graph-camera.js';
import { GraphPhysics } from '../../static/src/graph-physics.js';
import { GraphView } from '../../static/src/graph-view.js';

const data = paths => ({ nodes: paths.map(path => ({path,title:path})),
  edges: paths.slice(1).map(destination => ({source:paths[0],destination})) });
function view() {
  return Object.assign(Object.create(GraphView.prototype), {
    data:data([]), simulation:new GraphPhysics(), camera:new GraphCamera(800,600),
    scene:new THREE.Scene(), selected:null, focused:null, paused:true,
    container:{dataset:{},setAttribute(){}}, pointers:new Map(), reduced:{matches:false},
    release(){}, draw(){}, wake(){},
  });
}

test('roll rotates projection and picking on the same invertible camera plane', () => {
  const camera = new GraphCamera(800,600);
  camera.roll = camera.targetRoll = Math.PI/2;
  const point={x:100,y:0,z:0}, p=camera.screen(point);
  assert.ok(Math.abs(p.x-400)<1e-8);
  assert.ok(p.y<300);
  const restored=camera.world(p,point);
  for(const axis of ['x','y','z']) assert.ok(Math.abs(restored[axis]-point[axis])<1e-8);
  camera.resetOrientation(true); assert.equal(camera.roll,0);
});

test('idle orbit moves all three axes gently at unequal frame-independent rates', () => {
  const a=new GraphCamera(), b=new GraphCamera();
  assert.equal(typeof a.idleOrbit,'function');
  for(let i=0;i<60;i++)a.idleOrbit(1/60);
  for(let i=0;i<30;i++)b.idleOrbit(1/30);
  for(const key of ['yaw','pitch','roll']) {
    assert.ok(a[key]>0 && a[key]<.025);
    assert.ok(Math.abs(a[key]-b[key])<1e-10);
  }
  assert.equal(new Set([a.yaw,a.pitch,a.roll]).size,3);
  const distance=a.distance; a.idleOrbit(600);
  assert.ok(a.yaw<.03,'a resumed frame must not jump');
  assert.equal(a.distance,distance);
});

test('fit can frame every node while keeping the selection at its center', () => {
  const camera=new GraphCamera(390,800);
  const nodes=new Map([['a',{x:-800,y:20,z:100}],['b',{x:250,y:-90,z:-200}]]);
  camera.fit(nodes,true,nodes.get('b'));
  const p=camera.screen(nodes.get('b'));
  assert.ok(Math.abs(p.x-195)<1e-8 && Math.abs(p.y-400)<1e-8);
  for(const n of nodes.values()) {
    const projected=camera.screen(n);
    assert.ok(projected.visible && projected.x>0 && projected.x<390 && projected.y>0 && projected.y<800);
  }
});

test('selection centers smoothly, follows published motion, and retains zoom and orientation', () => {
  const v=view(); v.setGraph(data(['a','b']),'a','a');
  v.camera.orbit(.3,.2,true); v.camera.distance=v.camera.targetDistance=700;
  v.setSelection('b','b');
  const n=v.simulation.nodes.get('b');
  const p=v.camera.screen(n);
  assert.ok(Math.abs(p.x-400)<1e-8 && Math.abs(p.y-300)<1e-8);
  assert.equal(v.camera.distance,700); assert.equal(v.camera.yaw,.3);
  assert.equal(v.camera.pitch,.2); assert.equal(v.root,'a');
  n.x+=20; n.y-=7; n.z+=13;
  v.trackSelection();
  const moved=v.camera.screen(n);
  assert.ok(Math.abs(moved.x-400)<1e-8 && Math.abs(moved.y-300)<1e-8);
  v.batch.dispose();
});

test('restoring suspended selection preserves a paused manual camera center', () => {
  const v=view();v.setGraph(data(['a','b']),'a','a');v.setSelection('b','b');
  v.pan(80,20);
  const before={...v.camera};
  v.setSelection(null,null);
  v.setSelection('b','b',{center:false});
  assert.deepEqual({...v.camera},before);
  v.setSelection('a','a');
  const p=v.camera.screen(v.simulation.nodes.get('a'));
  assert.ok(Math.abs(p.x-400)<1e-8 && Math.abs(p.y-300)<1e-8);
  v.batch.dispose();
});

test('topology reconciliation retains scene objects, surviving positions, gestures and spare buffers', () => {
  const v=view(); v.setGraph(data(['a','b','c','d']),'a','a');
  v.setSelection('a','a');
  const batch=v.batch, objects=[...batch.group.children], n=v.simulation.nodes.get('b');
  const originalBuffers=objects.map(o=>o.instanceMatrix || o.geometry.attributes.position);
  const drag={path:'b',moved:true}; v.drag=drag;
  let releases=0; v.release=()=>{releases++;};
  v.setGraph(data(['a','b','c']),'a','a');
  assert.ok(v.batch===batch,'reuse the batch'); assert.ok(batch.group.children.every((o,i)=>o===objects[i]),'reuse scene objects');
  assert.equal(v.simulation.nodes.get('b'),n); assert.equal(v.drag,drag); assert.equal(releases,0);
  assert.deepEqual(objects.map(o=>o.instanceMatrix || o.geometry.attributes.position),originalBuffers);
  assert.equal(batch.nodes.count,3); assert.equal(batch.edges.geometry.drawRange.count,4);
  v.setGraph(data(['a','b','c','e','f']),'a','a');
  assert.ok(v.batch===batch,'reuse the batch'); assert.ok(batch.group.children.every((o,i)=>o===objects[i]),'reuse scene objects');
  assert.equal(batch.nodes.count,5); assert.equal(batch.arrows.geometry.drawRange.count,12);
  assert.equal(v.simulation.nodes.get('b'),n);
  v.setGraph(data(['a','c']),'a','a'); assert.equal(releases,1);
  v.batch.dispose();
});
