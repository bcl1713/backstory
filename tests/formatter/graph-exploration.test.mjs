import test from 'node:test';
import assert from 'node:assert/strict';
import { GraphPhysics } from '../../static/src/graph-physics.js';
import { GraphHints, hintAssignments } from '../../static/src/graph-hints.js';
import { layoutLabels } from '../../static/src/graph-labels.js';
import { nodeRadius, connectionGeometry } from '../../static/src/graph-geometry.js';
import { GraphCamera } from '../../static/src/graph-camera.js';
const nodes = (...paths) => paths.map(path => ({path,title:path}));
const edge = (source,destination) => ({source,destination});

test('selection does not replace opening BFS root and appended shortcuts recompute all parents',()=>{
 const sim=new GraphPhysics(nodes('a','b','c','d'),[edge('a','b'),edge('b','c'),edge('c','d')],'a');
 const b=sim.nodes.get('b'),position=[b.x,b.y,b.z];
 sim.setSelection('c');
 assert.equal(sim.depths.get('a'),0);assert.equal(sim.depths.get('d'),3);
 sim.setGraph(nodes('a','b','c','d','e'),[edge('a','b'),edge('b','c'),edge('a','c'),edge('b','d'),edge('c','d'),edge('d','a'),edge('d','e')]);
 assert.equal(sim.depths.get('d'),2);assert.equal(sim.depths.get('e'),3);
 assert.deepEqual(sim.springs.map(([a,b])=>`${a.path}:${b.path}`).sort(),['a:b','a:c','b:d','c:d','d:e']);
 assert.equal(sim.nodes.get('b'),b);assert.deepEqual([b.x,b.y,b.z],position);
});
test('hint codes prioritize outgoing neighbors and remain prefix free at multiple sizes',()=>{
 for(const count of [1,9,20,93,730]){
  const all=nodes(...Array.from({length:count},(_,i)=>`n${i}`));
  const projected=new Map(all.map((n,i)=>[n.path,{x:20+i%20,y:20+i%30,visible:true}]));
  const hints=hintAssignments({nodes:all,edges:[edge('n0',`n${count-1}`)],selected:'n0',projected,width:390,height:500});
  assert.equal(hints.length,count);assert.equal(new Set(hints.map(h=>h.code)).size,count);
  for(const a of hints)for(const b of hints)if(a!==b)assert.equal(b.code.startsWith(a.code),false);
  assert.equal(hints[0].path,`n${count-1}`);
  assert.equal(hints[0].code.length,Math.min(...hints.map(h=>h.code.length)));
 }
});
test('hint mode freezes assignments until cancel or complete and excludes offscreen nodes',()=>{
 const all=nodes(...Array.from({length:25},(_,i)=>`n${i}`));
 const projected=new Map(all.map(n=>[n.path,{x:50,y:50,visible:true}]));projected.set('n24',{x:-1,y:10,visible:true});
 const hints=new GraphHints();hints.begin({nodes:all,edges:[],selected:'n0',projected,width:390,height:500});
 const chosen=hints.assignments.find(h=>h.code.length>1);assert.ok(chosen);assert.equal(hints.assignments.length,24);
 const assignments=hints.assignments;hints.key(chosen.code[0]);
 projected.clear();all.push({path:'new'});assert.equal(hints.assignments,assignments);
 const result=hints.key(chosen.code[1]);assert.equal(result.path,chosen.path);assert.equal(hints.active,false);
 hints.begin({nodes:all,edges:[],projected,width:390,height:500});assert.equal(hints.active,false);
 projected.set('n0',{x:50,y:50,visible:true});hints.begin({nodes:all,edges:[],projected,width:390,height:500});hints.key('Escape');assert.equal(hints.active,false);
});
test('selected neighbors precede unrelated labels with quieter secondary treatment',()=>{
 const all=nodes('secondary','neighbor','selected');
 const projected=new Map(all.map((n,i)=>[n.path,{x:50+i*100,y:100,visible:true}]));
 const labels=layoutLabels({nodes:all,edges:[edge('selected','neighbor')],projected,width:600,height:400,selected:'selected',maximum:3,measure:t=>t.length*6});
 assert.deepEqual(labels.map(l=>l.path),['selected','neighbor','secondary']);assert.ok(labels[1].priority>labels[2].priority);
});
test('mesh and glow follow perspective geometry while both edge ends stop at world boundaries',()=>{
 const camera=new GraphCamera(960,600),a={x:-100,y:0,z:0},b={x:100,y:0,z:0};
 const radius=nodeRadius('a','a'),near=camera.screen(a).scale*radius;
 camera.zoom(.5,undefined,true);assert.ok(camera.screen(a).scale*radius<near*.6);
 const g=connectionGeometry(a,b,nodeRadius('a','a'),nodeRadius('b','a'),camera.basis());
 assert.ok(g.start[0]>a.x);assert.ok(g.tip[0]<b.x);
 assert.equal(g.start[0]-a.x,radius);assert.equal(b.x-g.tip[0],nodeRadius('b','a'));
 assert.ok(g.arrow.flat().every(Number.isFinite));
});
