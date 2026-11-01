import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
const path = new URL('../../static/src/bounded-frame-parent.js', import.meta.url);
const controller = existsSync(path) ? await import(path) : {};
class Target {
  listeners = new Map();
  addEventListener(type, fn) { this.listeners.set(type, [...(this.listeners.get(type) || []), fn]); }
  removeEventListener(type, fn) { this.listeners.set(type, (this.listeners.get(type) || []).filter(f => f !== fn)); }
  emit(type, data={}) { for (const fn of [...(this.listeners.get(type) || [])]) fn(data); }
}
function setup() {
  const win = new Target(), sent = [], statuses = [], sizes = [];
  const frame = new Target(); frame.contentWindow = { postMessage: (...args) => sent.push(args) };
  frame.setAttribute = (k,v) => frame[k] = v; frame.remove = () => frame.removed = true;
  const ports = [];
  class Channel { constructor() { this.port1 = { postMessage: msg => ports.push(msg), close() {}, start() {} }; this.port2 = {}; Channel.last = this; } }
  Object.assign(globalThis, { window: win, document: { createElement: () => frame }, MessageChannel: Channel });
  const container = { append: f => { assert.equal(f, frame); } };
  return {win, frame, sent, ports, statuses, sizes, Channel, container};
}
const hello = {version:1, type:'hello'};
test('one-shot source channel verifies frame identity, token, null origin and lifecycle', () => {
  assert.equal(typeof controller.createGraphvizFrame, 'function', 'frame controller not implemented');
  const e = setup();
  const handle = controller.createGraphvizFrame(e.container, 'digraph { A -> B }', { onStatus:s=>e.statuses.push(s), onSize:s=>e.sizes.push(s) });
  assert.equal(e.frame.sandbox, 'allow-scripts');
  assert.equal(e.frame.src, '/renderers/graphviz-frame/');
  e.win.emit('message', {source:{}, origin:'null', data:hello});
  e.win.emit('message', {source:e.frame.contentWindow, origin:'https://evil.invalid', data:hello});
  e.frame.emit('load'); assert.equal(e.sent.length, 0);
  e.win.emit('message', {source:e.frame.contentWindow, origin:'null', data:hello});
  assert.equal(e.sent.length, 1);
  const init=e.sent[0][0]; assert.match(init.token,/^[a-f0-9]{64}$/); assert.equal(e.sent[0][1],'*');
  assert.equal(JSON.stringify(e.sent).includes('A -> B'), false);
  e.Channel.last.port1.onmessage({data:{version:1,type:'ready',token:'a'.repeat(64)}});
  assert.equal(e.ports.length,0);
  e.Channel.last.port1.onmessage({data:{version:1,type:'ready',token:init.token}});
  assert.equal(e.ports.length,1); assert.equal(e.ports[0].type,'render');
  e.Channel.last.port1.onmessage({data:{version:1,type:'ready',token:init.token}});
  assert.equal(e.ports.length,1);
  e.Channel.last.port1.onmessage({data:{version:1,type:'result',token:init.token,status:'ok',width:900,height:400}});
  assert.deepEqual(e.sizes,[{width:900,height:400}]);
  e.frame.emit('load'); assert.equal(e.frame.removed,true);
  e.win.emit('message',{source:e.frame.contentWindow,origin:'null',data:hello});
  assert.equal(e.sent.length,1); assert.equal(e.ports.length,1); handle.destroy();
});
test('bad source never creates a frame; invalid dimensions and excessive replies fail closed', () => {
  assert.equal(typeof controller.createGraphvizFrame, 'function', 'frame controller not implemented');
  const e=setup();
  assert.throws(()=>controller.createGraphvizFrame(e.container,'digraph { A[label=<img>] }'));
  const h=controller.createGraphvizFrame(e.container,'digraph { A -> B }',{onStatus:s=>e.statuses.push(s)});
  e.frame.emit('load'); e.win.emit('message',{source:e.frame.contentWindow,origin:'null',data:hello});
  const token=e.sent[0][0].token;
  e.Channel.last.port1.onmessage({data:{version:1,type:'ready',token}});
  e.Channel.last.port1.onmessage({data:{version:1,type:'result',token,status:'ok',width:Infinity,height:'400'}});
  assert.equal(e.frame.removed,true); assert.deepEqual(e.statuses,['error']); h.destroy();
});
test('live frame concurrency and response rate are bounded until explicit destroy',()=>{
 const e=setup();
 const one=controller.createGraphvizFrame(e.container,'digraph { A -> B }');
 const two=controller.createGraphvizFrame(e.container,'digraph { A -> B }');
 assert.throws(()=>controller.createGraphvizFrame(e.container,'digraph { A -> B }'),{message:'renderer_busy'});
 one.destroy();two.destroy();
 const h=controller.createGraphvizFrame(e.container,'digraph { A -> B }',{onStatus:s=>e.statuses.push(s)});
 e.frame.emit('load');e.win.emit('message',{source:e.frame.contentWindow,origin:'null',data:hello});
 const receive=e.Channel.last.port1.onmessage;
 for(let i=0;i<5;i++)receive({data:{version:1,type:'unknown',token:'wrong'}});
 assert.deepEqual(e.statuses,['error']);h.destroy();
});
test('distinct Graphviz and Vega-Lite frames serialize rendering and cancellation releases only its own slot',()=>{
 const win=new Target(),frames=[],events=[];
 class Channel{constructor(){this.port1={sent:[],postMessage(data){this.sent.push(data);events.push('render:'+frames.indexOf(this.frame));},close(){},start(){}};this.port2={owner:this.port1};}}
 Object.assign(globalThis,{window:win,MessageChannel:Channel,document:{createElement(){
  const frame=new Target();frame.setAttribute=(k,v)=>frame[k]=v;frame.remove=()=>{frame.removed=true;events.push('remove:'+frames.indexOf(frame));};
  frame.contentWindow={postMessage:(data,target,ports)=>{frame.token=data.token;frame.port=ports[0].owner;frame.port.frame=frame;}};frames.push(frame);return frame;
 }}});
 const host={append(){}};
 const ready=frame=>{frame.emit('load');win.emit('message',{source:frame.contentWindow,origin:'null',data:hello});frame.port.onmessage({data:{version:1,type:'ready',token:frame.token}});};
 const success=frame=>frame.port.onmessage({data:{version:1,type:'result',token:frame.token,status:'ok',width:100,height:100}});
 const a=controller.createGraphvizFrame(host,'digraph{a->b}'),b=controller.createVegaLiteFrame(host,JSON.stringify({data:{values:[{x:'A',y:1}]},mark:'bar',encoding:{x:{field:'x',type:'nominal'},y:{field:'y',type:'quantitative'}}}));ready(frames[0]);ready(frames[1]);
 assert.equal(frames[0].port.sent.length,1);assert.equal(frames[1].port.sent.length,0);
 success(frames[0]);assert.equal(frames[1].port.sent.length,1);a.destroy();
 const c=controller.createGraphvizFrame(host,'digraph{e->f}');ready(frames[2]);assert.equal(frames[2].port.sent.length,0);c.destroy();
 const d=controller.createGraphvizFrame(host,'digraph{g->h}');ready(frames[3]);assert.equal(frames[3].port.sent.length,0);b.destroy();
 assert.equal(frames[3].port.sent.length,1);assert.equal(frames[2].port.sent.length,0);assert.ok(events.indexOf('remove:1')<events.indexOf('render:3'));d.destroy();
});
