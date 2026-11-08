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

test('selected and outbound destination labels avoid one another and all nearby marks',()=>{
  const nodes=['selected','focused','current'].map(node);
  const projected=new Map(nodes.map((n,i)=>[n.path,point(110+i*5,180+i*3)]));
  const labels=layoutLabels({...base,nodes,projected,selected:'selected',focused:'focused',current:'current',edges:[{source:'selected',destination:'focused'},{source:'selected',destination:'current'}]});
  assert.deepEqual(labels.map(l=>l.path),nodes.map(n=>n.path));
  clean(labels,[...projected.values()].map(p=>({x:p.x-19,y:p.y-19,w:38,h:38})));
  assert.ok(labels.every(l=>l.anchor && l.text.endsWith('…')));
});

test('ordinary title avoids a second node beneath the old right-side placement',()=>{
  const nodes=['one','two'].map(node), projected=new Map([['one',point(100,160)],['two',point(180,160)]]);
  const labels=layoutLabels({...base,nodes,projected,selected:'one',edges:[{source:'one',destination:'two'}]});
  assert.ok(labels.some(l=>l.path==='one'));
  clean(labels,[...projected.values()].map(p=>({x:p.x-8,y:p.y-8,w:16,h:16})));
});

test('placement remains stable with unchanged projection, append, and small camera motion',()=>{
  const nodes=['a','b','c'].map(node), projected=new Map(nodes.map((n,i)=>[n.path,point(80+i*45,140+i*45)]));
  const options={...base,nodes,projected,selected:'a',focused:'b',current:'c',edges:[{source:'a',destination:'b'},{source:'a',destination:'c'}]};
  const first=layoutLabels(options), previous=new Map(first.map(l=>[l.path,l.slot]));
  assert.deepEqual(layoutLabels({...options,previous}),first);
  projected.set('offscreen',{x:-20,y:-20,visible:true});
  assert.deepEqual(layoutLabels({...options,nodes:[...nodes,node('offscreen')],previous}),first);
  for(const p of projected.values()){p.x+=1;p.y+=1;}
  assert.deepEqual(layoutLabels({...options,previous}).map(l=>l.slot),first.map(l=>l.slot));
});

test('dense phone labels stay local and prioritize selection after zoom and selection',()=>{
  const nodes=Array.from({length:93},(_,i)=>node(`n${i}`));
  const projected=new Map(nodes.map((n,i)=>[n.path,point(25+(i%10)*34,100+Math.floor(i/10)*20)]));
  for(const selected of ['n20','n60']) {
    const labels=layoutLabels({...base,nodes,projected,selected,focused:'n21',current:'n22',edges:[{source:selected,destination:'n21'},{source:selected,destination:'n22'}],maximum:12});
    assert.ok(labels.length<=12);
    assert.ok(labels.some(l=>l.path===selected),selected);
    assert.ok(labels.every(l=>[selected,'n21','n22'].includes(l.path)));
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

test('crowded identities use local leaders instead of crossing the canvas to margins',()=>{
  const nodes=Array.from({length:100},(_,i)=>node(`n${i}`));
  const projected=new Map(nodes.map((n,i)=>[n.path,point(360+(i%10)*9,200+Math.floor(i/10)*8)]));
  const labels=layoutLabels({...base,width:900,height:600,nodes,projected,selected:'n44',focused:'n45',current:'n46',edges:nodes.slice(1).map(n=>({source:'n44',destination:n.path}))});
  assert.ok(labels.some(l=>l.path==='n44'),'selection remains identifiable');
  for(const label of labels){const p=projected.get(label.path);assert.ok(Math.hypot(p.x-label.anchor.x,p.y-label.anchor.y)<=100,`${label.path} has a distant leader`);}
  const cross=(a,b,c,d)=>{const orient=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);return orient(a,b,c)*orient(a,b,d)<0&&orient(c,d,a)*orient(c,d,b)<0;};
  for(const [i,a] of labels.entries())for(const b of labels.slice(i+1))assert.equal(cross(projected.get(a.path),a.anchor,projected.get(b.path),b.anchor),false,`${a.path}/${b.path} leaders cross`);
});

test('coincident roles share a primary outline',()=>{
  const marks=[];
  const ctx={setTransform(){},clearRect(){},measureText(t){return{width:t.length*7.2};},strokeText(){},fillText(){},fillRect(){},strokeRect(...r){marks.push(r);},beginPath(){},moveTo(){},lineTo(){},closePath(){},stroke(){},setLineDash(){},arc(){}};
  const view={labelContext:ctx,camera:{width:390,height:400},pixelRatio:1,fontFamily:'sans-serif',data:{nodes:[node('a')],edges:[]},projected:new Map([['a',point(110,180)]]),selected:'a',focused:'a',current:'a',root:'a',quality:{labels:0},theme:{background:'#000',label:'#fff',highlight:'#abc',focus:'#fed'}};
  GraphView.prototype.drawLabels.call(view);
  assert.equal(marks.length,0,'selection diamond carries current/root/focus accents without extra boxes');
});
