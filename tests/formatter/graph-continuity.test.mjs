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
    container:{dataset:{},setAttribute(){},focus(){},setPointerCapture(){},hasPointerCapture(){return true;},releasePointerCapture(){}},
    canvas:{getBoundingClientRect(){return {left:0,top:0};}}, pointers:new Map(), reduced:{matches:false},
    projected:new Map(), matrix:new THREE.Matrix4(),
    release(){}, draw(){}, wake(){},
  });
}
function renderable(v) {
  globalThis.document={hidden:false}; globalThis.requestAnimationFrame=()=>1;
  v.container.hidden=false; v.destroyed=false; v.unavailable=false;
  v.renderer={setClearColor(){},render(){v.rendered.push(v.projected.get('b'));}};
  v.renderCamera=new THREE.PerspectiveCamera(45,800/600,1,1000000);
  v.quality={sample:()=>false,bloom:()=>0,level:0}; v.forced={matches:false};
  v.theme={background:0}; v.themeDirty=false; v.pixelRatio=1; v.intensity=0;
  v.applyColors=()=>{v.themeDirty=false;};
  v.drawLabels=()=>{}; v.drawHints=()=>{}; v.rendered=[];
  v.draw=options=>GraphView.prototype.draw.call(v,options);
  return v;
}
function startTicks(v) {
  v.loaded=true; v.paused=false; v.idleAfter=0; v.lastTime=0;
  v.reduced={matches:false}; v.hints={active:false}; v.actions={};
  v.simulation.reheat();
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

test('selected camera follows layout while the legacy pan API orbits instead of translating focus', () => {
  const v=view(); v.setGraph(data(['a','b']),'a','a'); v.setSelection('b','b');
  const node=v.simulation.nodes.get('b');
  const angles={yaw:v.camera.yaw,pitch:v.camera.pitch};
  const center={x:v.camera.x,y:v.camera.y,z:v.camera.z};
  v.pan(40,20);
  assert.equal(v.camera.yaw,angles.yaw+.24); assert.equal(v.camera.pitch,angles.pitch-.12);
  for(const axis of ['x','y','z']) assert.equal(v.camera['target'+axis.toUpperCase()],node[axis]);
  assert.deepEqual({x:v.camera.x,y:v.camera.y,z:v.camera.z},center);
  Object.assign(node,{x:node.x+25,y:node.y-11,z:node.z+7});
  v.trackSelection();
  const moved=v.camera.screen(node);
  assert.ok(Math.abs(moved.x-400)<1e-8 && Math.abs(moved.y-300)<1e-8);
  v.camera.orbit(.4,.2,true); v.zoom(1.2,{x:720,y:90}); v.trackSelection();
  Object.assign(node,{x:node.x-8,y:node.y+13,z:node.z-4});
  v.trackSelection();
  v.setSelection(null,null);
  const camera={...v.camera}; Object.assign(node,{x:node.x+100,y:node.y+100,z:node.z+100});v.trackSelection();
  assert.deepEqual({...v.camera},camera);
  v.batch.dispose();
});

test('selected background, node-hit, modifier, right and middle drags always orbit without pinning', () => {
  const v=renderable(view()); v.setGraph(data(['a','b']),'a','a'); v.setSelection('b','b');
  const node=v.simulation.nodes.get('b');
  const cases=[
    {button:0,x:400,y:300}, // Starts on the selected node.
    {button:0,shiftKey:true,x:700,y:500},
    {button:0,ctrlKey:true,x:700,y:500},
    {button:1,x:700,y:500},
    {button:2,x:700,y:500},
  ];
  let pointerId=1;
  for(const scenario of cases) {
    let prevented=false;
    const target={closest:()=>null};
    const down={...scenario,pointerId, pointerType:'mouse',clientX:scenario.x,clientY:scenario.y,target,preventDefault(){prevented=true;}};
    const picked=v.pick({x:scenario.x,y:scenario.y});
    v.pointerDown(down);
    assert.ok(v.drag,`pointer ${pointerId} starts a selected camera gesture; active pointers=${v.pointers.size}`);
    assert.equal(v.drag.path,picked,'pointer-down retains click selection identity');
    const before={yaw:v.camera.yaw,pitch:v.camera.pitch,node:[node.x,node.y,node.z]};
    v.pointerMove({...down,clientX:scenario.x+40,clientY:scenario.y+25});
    assert.ok(Math.abs(v.camera.yaw-(before.yaw-.24))<1e-10,'horizontal drag orbits');
    assert.ok(Math.abs(v.camera.pitch-(before.pitch+.15))<1e-10,'vertical drag orbits');
    assert.deepEqual([node.x,node.y,node.z],before.node,'layout node remains free');
    assert.equal(node.pinned,false);
    const rendered=v.rendered.at(-1);
    assert.ok(Math.abs(rendered.x-400)<1e-8 && Math.abs(rendered.y-300)<1e-8,'selected target stays centered on every draw');
    if(scenario.button!==0 || scenario.ctrlKey) assert.equal(prevented,true,'selected non-primary/modifier gesture suppresses browser default');
    GraphView.prototype.release.call(v,{pointerId},false); pointerId++;
  }
  v.batch.dispose();
});

test('clicking another node while one is selected changes the orbit target', () => {
  const v=renderable(view()); v.setGraph(data(['a','b']),'a','a'); v.setSelection('b','b');
  const point=v.projected.get('a');
  assert.ok(point?.visible);
  assert.equal(v.pick(point),'a','the other node is hittable at its projected point');
  v.actions={onSelect:path=>v.setSelection(path,path)};
  const target={closest:()=>null};
  v.pointerDown({button:0,pointerId:10,pointerType:'mouse',clientX:point.x,clientY:point.y,target});
  GraphView.prototype.release.call(v,{pointerId:10},false);
  assert.equal(v.selected,'a');
  const p=v.projected.get('a');
  assert.ok(Math.abs(p.x-400)<1e-8 && Math.abs(p.y-300)<1e-8,'selection change immediately centers the new orbit target');
  v.batch.dispose();
});

test('selected two-finger centroid movement orbits and pinch changes zoom about the selected target', () => {
  const v=renderable(view()); v.setGraph(data(['a','b']),'a','a'); v.setSelection('b','b');
  const node=v.simulation.nodes.get('b'), before={yaw:v.camera.yaw,pitch:v.camera.pitch,distance:v.camera.distance,position:[node.x,node.y,node.z]};
  const target={closest:()=>null};
  v.pointerDown({button:0,pointerId:1,pointerType:'touch',clientX:300,clientY:300,target});
  v.pointerDown({button:0,pointerId:2,pointerType:'touch',clientX:500,clientY:300,target});
  assert.equal(v.drag,null,'pinch gesture has no node-drag state');
  v.pointerMove({pointerId:2,pointerType:'touch',clientX:510,clientY:330,target});
  assert.ok(Math.abs(v.camera.yaw-(before.yaw-.03))<1e-10,'centroid horizontal movement orbits');
  assert.ok(Math.abs(v.camera.pitch-(before.pitch+.09))<1e-10,'centroid vertical movement orbits');
  assert.ok(v.camera.distance<before.distance,'pinch zoom changes radius');
  assert.deepEqual([node.x,node.y,node.z],before.position);
  assert.equal(node.pinned,false);
  const rendered=v.rendered.at(-1);
  assert.ok(Math.abs(rendered.x-400)<1e-8 && Math.abs(rendered.y-300)<1e-8);
  v.batch.dispose();
});

test('pan remains a camera translation when no node is selected', () => {
  const v=renderable(view()); v.setGraph(data(['a','b']),'a','a');
  const before={x:v.camera.x,y:v.camera.y,z:v.camera.z,yaw:v.camera.yaw,pitch:v.camera.pitch};
  v.pan(40,20);
  assert.notDeepEqual([v.camera.x,v.camera.y,v.camera.z],[before.x,before.y,before.z]);
  assert.equal(v.camera.yaw,before.yaw); assert.equal(v.camera.pitch,before.pitch);
  v.batch.dispose();
});

test('active selected focus stays centered on every draw through layout, orbit and off-center zoom', () => {
  const v=renderable(view()); v.setGraph(data(['a','b']),'a','a'); v.setSelection('b','b');
  v.camera.orbit(.3,.2,true); v.camera.distance=v.camera.targetDistance=700;
  startTicks(v);
  const node=v.simulation.nodes.get('b'), start={x:node.x,y:node.y,z:node.z};
  const renderedAtStart=v.rendered.length;
  for(let frame=1;frame<=20;frame++) { v.simulation.step(); v.tick(frame*16); }
  assert.equal(v.rendered.length-renderedAtStart,20,'each update must reach GraphView.draw and the renderer');
  v.rendered.slice(renderedAtStart).forEach((p,frame)=>{
    assert.ok(Math.abs(p.x-400)<1e-8,`render ${frame} x`);
    assert.ok(Math.abs(p.y-300)<1e-8,`render ${frame} y`);
  });
  assert.ok(Math.hypot(node.x-start.x,node.y-start.y,node.z-start.z)>1,'layout motion remains free');
  assert.ok(v.camera.yaw>.3,'idle orbit continues');
  const radius=v.camera.targetDistance, previousFrames=v.rendered.length;
  v.zoom(1.2,{x:120,y:510});
  assert.equal(v.rendered.length,previousFrames+1,'focused zoom must draw immediately');
  assert.ok(Math.abs(v.rendered.at(-1).x-400)<1e-8 && Math.abs(v.rendered.at(-1).y-300)<1e-8,'focused zoom keeps the selected node centered on its immediate draw');
  assert.ok(Math.abs(v.camera.targetDistance-radius/1.2)<1e-8,'focused zoom changes radius about the selected target');
  for(const axis of ['x','y','z']) assert.ok(Math.abs(v.camera['target'+axis.toUpperCase()]-node[axis])<1e-8,'focused zoom keeps the target at the selected node');
  v.batch.dispose();
});

test('removing a selected node clears its camera tracking identity', () => {
  const v=view(); v.setGraph(data(['a','b']),'a','a'); v.setSelection('b','b');
  v.setGraph(data(['a']),'a','a');
  assert.equal(v.selected,null);
  assert.equal(v.focused,null);
  assert.equal(v.trackedSelection,null);
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
