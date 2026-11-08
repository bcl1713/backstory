import test from 'node:test';
import assert from 'node:assert/strict';
import * as geometry from '../../static/src/graph-geometry.js';

const a={x:1,y:2,z:3}, b={x:21,y:2,z:3};
const fixtures=[
  {
    name:'screen-facing edge',a,b,
    basis:{right:{x:1,y:0,z:0},back:{x:0,y:0,z:1}},
    want:{start:[7,2,3],tip:[16,2,3],arrow:[[16,2,3],[11,-.5,3],[11,4.5,3]],
      halo:[[7,-1,3],[7,5,3],[16,-1,3],[16,-1,3],[7,5,3],[16,5,3]]},
  },
  {
    name:'rotated camera',a,b,
    basis:{right:{x:1,y:0,z:0},back:{x:0,y:1,z:0}},
    want:{start:[7,2,3],tip:[16,2,3],arrow:[[16,2,3],[11,2,5.5],[11,2,.5]],
      halo:[[7,2,6],[7,2,0],[16,2,6],[16,2,6],[7,2,0],[16,2,0]]},
  },
  {
    name:'edge parallel to camera',a,b,
    basis:{right:{x:0,y:1,z:0},back:{x:1,y:0,z:0}},
    want:{start:[7,2,3],tip:[16,2,3],arrow:[[16,2,3],[11,4.5,3],[11,-.5,3]],
      halo:[[7,5,3],[7,-1,3],[16,5,3],[16,5,3],[7,-1,3],[16,-1,3]]},
  },
  {
    name:'vertical world-space edge',a,b:{x:1,y:22,z:3},
    basis:{right:{x:1,y:0,z:0},back:{x:0,y:0,z:1}},
    want:{start:[1,8,3],tip:[1,17,3],arrow:[[1,17,3],[3.5,12,3],[-1.5,12,3]],
      halo:[[4,8,3],[-2,8,3],[4,17,3],[4,17,3],[-2,8,3],[-2,17,3]]},
  },
  {
    name:'depth-aligned world-space edge',a,b:{x:1,y:2,z:23},
    basis:{right:{x:1,y:0,z:0},back:{x:0,y:1,z:0}},
    want:{start:[1,2,9],tip:[1,2,18],arrow:[[1,2,18],[-1.5,2,13],[3.5,2,13]],
      halo:[[-2,2,9],[4,2,9],[-2,2,18],[-2,2,18],[4,2,9],[4,2,18]]},
  },
  {
    name:'coincident endpoints',a,b:a,
    basis:{right:{x:0,y:1,z:0},back:{x:1,y:0,z:0}},
    want:{start:[1,2,3],tip:[1,2,3],arrow:[[1,2,3],[1,2.00125,3],[1,1.99875,3]],
      halo:[[1,5,3],[1,-1,3],[1,5,3],[1,5,3],[1,-1,3],[1,-1,3]]},
  },
];

test('connection endpoints, arrows and halo retain their world-space geometry',()=>{
  for(const {name,a,b,basis,want} of fixtures){
    assert.deepEqual(geometry.connectionGeometry(a,b,7,5,basis),want,name);
  }
});

test('explicit output reuses every point and triangle array across edges and camera changes',()=>{
  assert.equal(typeof geometry.createConnectionGeometry,'function');
  const output=geometry.createConnectionGeometry();
  const refs={start:output.start,tip:output.tip,arrow:output.arrow,halo:output.halo,
    arrowPoints:output.arrow.slice(),haloPoints:output.halo.slice()};
  for(const {name,a,b,basis,want} of fixtures){
    assert.equal(geometry.connectionGeometry(a,b,7,5,basis,output),output,name);
    assert.deepEqual(output,want,name);
    for(const key of ['start','tip','arrow','halo'])assert.equal(output[key],refs[key],key);
    for(let i=0;i<3;i++)assert.equal(output.arrow[i],refs.arrowPoints[i]);
    for(let i=0;i<6;i++)assert.equal(output.halo[i],refs.haloPoints[i]);
  }
});

test('convenience calls own independent geometry storage',()=>{
  const first=geometry.connectionGeometry(a,b,7,5,fixtures[0].basis);
  const second=geometry.connectionGeometry(a,b,7,5,fixtures[1].basis);
  assert.deepEqual(first,fixtures[0].want);
  assert.deepEqual(second,fixtures[1].want);
  for(const key of ['start','tip','arrow','halo'])assert.notEqual(first[key],second[key]);
});
