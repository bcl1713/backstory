import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutLabels, overlaps } from '../../static/src/graph-labels.js';
import { GraphView } from '../../static/src/graph-view.js';

const node = path => ({ path, title: `Synthetic ${path} long identity` });
const point = (x,y) => ({ x,y,visible:true });
const base = { width:390, height:400, measure:text=>text.length*7.2, maximum:48 };
function clean(labels, marks) {
  for (const [i,label] of labels.entries()) {
    assert.ok(label.rect.x >= 4 && label.rect.y >= 4);
    assert.ok(label.rect.x+label.rect.w <= base.width-4);
    assert.ok(label.rect.y+label.rect.h <= base.height-4);
    for (const other of labels.slice(i+1)) assert.equal(overlaps(label.rect,other.rect),false,`${label.path}/${other.path}`);
    for (const mark of marks) assert.equal(overlaps(label.rect,mark),false,`${label.path} covers a node`);
  }
}

test('distinct selected focused current labels avoid one another and all nearby marks',()=>{
  const nodes=['selected','focused','current'].map(node);
  const projected=new Map(nodes.map((n,i)=>[n.path,point(110+i*5,180+i*3)]));
  const labels=layoutLabels({...base,nodes,projected,selected:'selected',focused:'focused',current:'current'});
  assert.deepEqual(labels.map(l=>l.path),nodes.map(n=>n.path));
  clean(labels,[...projected.values()].map(p=>({x:p.x-19,y:p.y-19,w:38,h:38})));
  assert.ok(labels.every(l=>l.anchor && l.text.endsWith('…')));
});

test('ordinary title avoids a second node beneath the old right-side placement',()=>{
  const nodes=['one','two'].map(node), projected=new Map([['one',point(100,160)],['two',point(180,160)]]);
  const labels=layoutLabels({...base,nodes,projected});
  assert.ok(labels.some(l=>l.path==='one'));
  clean(labels,[...projected.values()].map(p=>({x:p.x-8,y:p.y-8,w:16,h:16})));
});

test('placement remains stable with unchanged projection, append, and small camera motion',()=>{
  const nodes=['a','b','c'].map(node), projected=new Map(nodes.map((n,i)=>[n.path,point(80+i*45,140+i*45)]));
  const options={...base,nodes,projected,selected:'a',focused:'b',current:'c'};
  const first=layoutLabels(options), previous=new Map(first.map(l=>[l.path,l.slot]));
  assert.deepEqual(layoutLabels({...options,previous}),first);
  projected.set('offscreen',{x:-20,y:-20,visible:true});
  assert.deepEqual(layoutLabels({...options,nodes:[...nodes,node('offscreen')],previous}),first);
  for(const p of projected.values()){p.x+=1;p.y+=1;}
  assert.deepEqual(layoutLabels({...options,previous}).map(l=>l.slot),first.map(l=>l.slot));
});

test('dense phone labels stay bounded and contain all priority identities after zoom and selection',()=>{
  const nodes=Array.from({length:93},(_,i)=>node(`n${i}`));
  const projected=new Map(nodes.map((n,i)=>[n.path,point(25+(i%10)*34,100+Math.floor(i/10)*20)]));
  for(const selected of ['n20','n60']) {
    const labels=layoutLabels({...base,nodes,projected,selected,focused:'n21',current:'n22',maximum:12});
    assert.ok(labels.length<=12);
    for(const path of [selected,'n21','n22']) assert.ok(labels.some(l=>l.path===path),path);
    clean(labels,[...projected.values()].map(p=>({x:p.x-8,y:p.y-8,w:16,h:16})));
    for(const p of projected.values()){p.x=195+(p.x-195)*1.1;p.y=200+(p.y-200)*1.1;}
  }
});

test('renderer paints state marks even when a label cannot be shown',()=>{
  const marks=[];
  const ctx={setTransform(){},clearRect(){},measureText(t){return{width:t.length*7.2};},strokeText(){},fillText(){},fillRect(){},strokeRect(...r){marks.push(r);},beginPath(){},moveTo(){},lineTo(){},closePath(){},stroke(){},setLineDash(){}};
  const view={labelContext:ctx,camera:{width:390,height:400},pixelRatio:1,fontFamily:'sans-serif',
    data:{nodes:['a','b','c'].map(node)},projected:new Map([['a',point(110,180)],['b',point(115,183)],['c',point(120,185)]]),
    selected:'a',focused:'b',current:'c',quality:{labels:0},theme:{background:'#000',label:'#fff',highlight:'#abc',focus:'#fed'}};
  GraphView.prototype.drawLabels.call(view);
  assert.equal(marks.length,2,'current square and focus box are independent of label budget');
});
