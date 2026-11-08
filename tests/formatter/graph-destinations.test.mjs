import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GraphView} from '../../static/src/graph-view.js';
import {GraphPhysics} from '../../static/src/graph-physics.js';
import {GraphCamera} from '../../static/src/graph-camera.js';
import {layoutLabels} from '../../static/src/graph-labels.js';
import {hintAssignments,GraphHints} from '../../static/src/graph-hints.js';
const nodes=['selected','near','far','incoming'].map(path=>({path,title:path}));
const edges=[{source:'selected',destination:'near'},{source:'near',destination:'far'},{source:'incoming',destination:'selected'}];

test('only selection and immediate outbound destinations have title labels',()=>{
 const projected=new Map(nodes.map((n,i)=>[n.path,{visible:true,x:60+i*150,y:150}]));
 const labels=layoutLabels({nodes,edges,projected,width:800,height:400,selected:'selected',focused:'far',current:'incoming',measure:t=>t.length*7});
 assert.deepEqual(labels.map(l=>l.path),['selected','near']);
});
test('displayed one-hop codes match active hints despite camera visibility changes',()=>{
 const all=Array.from({length:93},(_,i)=>({path:`n${i}`,title:`Node ${i}`}));
 const connections=[{source:'n0',destination:'n92'}];
 const stable=hintAssignments({nodes:all,edges:connections,selected:'n0',visibleOnly:false});
 assert.equal(stable.length,93);
 const projected=new Map(all.map((n,i)=>[n.path,{visible:true,x:i<50?50:-50,y:100}]));
 projected.set('n92',{visible:true,x:80,y:100});
 const hints=new GraphHints();hints.begin({nodes:all,edges:connections,selected:'n0',projected,width:390,height:400,assignments:stable});
 const advertised=stable.find(h=>h.path==='n92');
 assert.equal(hints.assignments.find(h=>h.path==='n92').code,advertised.code);
 assert.equal(hints.assignments.some(h=>h.path==='n60'),false);
 for(const key of advertised.code){const result=hints.key(key);if(result.path)assert.equal(result.path,'n92');}
 assert.equal(hints.active,false);
});
test('one-hop node and directed connection get a distinct semantic color without changing root springs',()=>{
 const data={nodes,edges};
 const view=Object.assign(Object.create(GraphView.prototype),{
  data,simulation:new GraphPhysics(nodes,edges,'selected'),camera:new GraphCamera(),scene:new THREE.Scene(),
  selected:'selected',focused:'selected',paused:true,loaded:true,forced:{matches:false},color:new THREE.Color(),
  theme:{node:'#0000ff',destination:'#00ff00',highlight:'#ff0000',focus:'#ffff00',edge:'#888888',bloom:'#0000ff'},
  container:{dataset:{},setAttribute(){}},release(){},draw(){},wake(){},
 });
 view.setGraph(data,'selected','selected');view.applyColors(2);
 const color=new THREE.Color();view.batch.nodes.getColorAt(1,color);
 assert.equal(color.getHexString(),'00ff00');view.batch.nodes.getColorAt(2,color);assert.equal(color.getHexString(),'0000ff');
 const line=view.batch.edges.geometry.attributes.color;
 assert.equal(line.getY(0),1);assert.equal(line.getX(0),0);
 assert.equal(view.simulation.depths.get('far'),2);assert.equal(view.simulation.depths.get('incoming'),Infinity);
 view.batch.dispose();
});
