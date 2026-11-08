import test from 'node:test';
import assert from 'node:assert/strict';
import {GraphView} from '../../static/src/graph-view.js';

function frameView({publish=false,moving=false,themeDirty=false}={}) {
 let draws=0, elapsed;
 const view=Object.assign(Object.create(GraphView.prototype),{
  frame:1,destroyed:false,unavailable:false,paused:false,lastTime:0,themeDirty,
  container:{hidden:false},data:{nodes:Array.from({length:1050},()=>({}))},
  simulation:{active:true,positionVersion:3,advance(value){elapsed=value;if(publish)this.positionVersion++;}},
  camera:{tick(){return moving;}},quality:{sample(){return false;}},
  draw(){draws++;},actions:{},
 });
 return {view,draws:()=>draws,elapsed:()=>elapsed};
}
function withFrames(fn){
 const documentBefore=globalThis.document, frameBefore=globalThis.requestAnimationFrame;
 globalThis.document={hidden:false};globalThis.requestAnimationFrame=()=>2;
 try{fn();}finally{globalThis.document=documentBefore;globalThis.requestAnimationFrame=frameBefore;}
}

test('an unfinished solver slice does not redraw unchanged positions, labels or picking',()=>withFrames(()=>{
 const state=frameView();state.view.tick(1000/60);
 assert.equal(state.draws(),0);
 assert.equal(state.view.frame,2,'continue cooperative solver work on another frame');
}));
test('camera, completed publication and style updates redraw independently of solver progress',()=>withFrames(()=>{
 for(const change of [{moving:true},{publish:true},{themeDirty:true}]){
  const state=frameView(change);state.view.tick(1000/60);assert.equal(state.draws(),1);
 }
}));
test('large layouts receive actual elapsed time for bounded fixed-step catch-up',()=>withFrames(()=>{
 const state=frameView();state.view.tick(1000/30);
 assert.ok(Math.abs(state.elapsed()-1/30)<1e-10,'view must not discard elapsed time above one step');
}));

test('installing an ordinary graph never runs synchronous solver warmup steps',async()=>{
 const THREE=await import('three');
 const {GraphPhysics}=await import('../../static/src/graph-physics.js');
 const {GraphCamera}=await import('../../static/src/graph-camera.js');
 let warmups=0;
 const simulation=new GraphPhysics();simulation.step=()=>warmups++;
 const view=Object.assign(Object.create(GraphView.prototype),{
  data:{nodes:[],edges:[]},simulation,camera:new GraphCamera(),scene:new THREE.Scene(),
  selected:null,focused:null,paused:true,
  container:{dataset:{},setAttribute(){}},release(){},draw(){},wake(){},
 });
 view.setGraph({nodes:[{path:'a',title:'A'},{path:'b',title:'B'}],edges:[{source:'a',destination:'b'}]},'a','a');
 assert.equal(warmups,0);view.batch.dispose();
});

test('camera-only drawing refreshes arrows and picking without uploading stationary node buffers',async()=>{
 const THREE=await import('three');
 const {GraphPhysics}=await import('../../static/src/graph-physics.js');
 const {GraphCamera}=await import('../../static/src/graph-camera.js');
 const {createGraphBatches}=await import('../../static/src/graph-view.js');
 const data={nodes:[{path:'a'},{path:'b'}],edges:[{source:'a',destination:'b'}]};
 const view=Object.assign(Object.create(GraphView.prototype),{
  data,simulation:new GraphPhysics(data.nodes,data.edges,'a'),camera:new GraphCamera(500,400),
  scene:new THREE.Scene(),batch:createGraphBatches(data.nodes,data.edges),renderCamera:new THREE.PerspectiveCamera(),
  selected:'a',focused:'a',forced:{matches:false},quality:{bloom(){return 0;}},pixelRatio:1,
  matrix:new THREE.Matrix4(),projected:new Map(),container:{dataset:{}},theme:{background:'#000000'},
  renderer:{setClearColor(){},render(){}},drawLabels(){},drawHints(){},
 });
 withFrames(()=>{
  view.draw();const nodes=view.batch.nodes.instanceMatrix.version,edges=view.batch.arrows.geometry.attributes.position.version;
  const before=view.projected.get('b').x;
  view.camera.orbit(.3,.1,true);view.draw({positionsChanged:false});
  assert.equal(view.batch.nodes.instanceMatrix.version,nodes);
  assert.ok(view.batch.arrows.geometry.attributes.position.version>edges);
  assert.notEqual(view.projected.get('b').x,before);
  const arrows=view.batch.arrows.geometry.attributes.position.version;
  view.draw({positionsChanged:false});
  assert.equal(view.batch.arrows.geometry.attributes.position.version,arrows,'unchanged draw reuses geometry too');
 });
 view.batch.dispose();
});

test('projection reuses caller storage and one camera basis across every node',async()=>{
 const {GraphCamera}=await import('../../static/src/graph-camera.js');
 const camera=new GraphCamera(500,400),point={x:50,y:20,z:10},output={};
 const expected=camera.screen(point);
 const actual=camera.screen(point,output,camera.basis());
 assert.equal(actual,output);assert.deepEqual(actual,expected);
 camera.pan(15,20,true);assert.equal(camera.screen(point,output,camera.basis()),output);
 assert.notEqual(output.x,expected.x);
});

test('the final eased camera snap still marks its frame changed',async()=>{
 const {GraphCamera}=await import('../../static/src/graph-camera.js');
 const camera=new GraphCamera();camera.targetX=.000001;
 assert.equal(camera.tick(1/60),true);assert.equal(camera.x,camera.targetX);
 assert.equal(camera.tick(1/60),false);
});
