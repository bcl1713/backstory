import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
const path = new URL('../../static/src/mermaid-frame-parent.js', import.meta.url);
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
  assert.equal(typeof controller.createMermaidFrame, 'function', 'frame controller not implemented');
  const e = setup();
  const handle = controller.createMermaidFrame(e.container, 'flowchart TD\nA --> B', { onStatus:s=>e.statuses.push(s), onSize:s=>e.sizes.push(s) });
  assert.equal(e.frame.sandbox, 'allow-scripts');
  assert.equal(e.frame.src, '/renderers/mermaid-frame/');
  e.win.emit('message', {source:{}, origin:'null', data:hello});
  e.win.emit('message', {source:e.frame.contentWindow, origin:'https://evil.invalid', data:hello});
  e.frame.emit('load'); assert.equal(e.sent.length, 0);
  e.win.emit('message', {source:e.frame.contentWindow, origin:'null', data:hello});
  assert.equal(e.sent.length, 1);
  const init=e.sent[0][0]; assert.match(init.token,/^[a-f0-9]{64}$/); assert.equal(e.sent[0][1],'*');
  assert.equal(JSON.stringify(e.sent).includes('A --> B'), false);
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
  assert.equal(typeof controller.createMermaidFrame, 'function', 'frame controller not implemented');
  const e=setup();
  assert.throws(()=>controller.createMermaidFrame(e.container,'flowchart TD\nA[<img>]'));
  const h=controller.createMermaidFrame(e.container,'flowchart TD\nA-->B',{onStatus:s=>e.statuses.push(s)});
  e.frame.emit('load'); e.win.emit('message',{source:e.frame.contentWindow,origin:'null',data:hello});
  const token=e.sent[0][0].token;
  e.Channel.last.port1.onmessage({data:{version:1,type:'ready',token}});
  e.Channel.last.port1.onmessage({data:{version:1,type:'result',token,status:'ok',width:Infinity,height:'400'}});
  assert.equal(e.frame.removed,true); assert.deepEqual(e.statuses,['error']); h.destroy();
});
test('live frame concurrency and response rate are bounded until explicit destroy',()=>{
 const e=setup();
 const one=controller.createMermaidFrame(e.container,'flowchart TD\nA-->B');
 const two=controller.createMermaidFrame(e.container,'flowchart TD\nA-->B');
 assert.throws(()=>controller.createMermaidFrame(e.container,'flowchart TD\nA-->B'),{message:'renderer_busy'});
 one.destroy();two.destroy();
 const h=controller.createMermaidFrame(e.container,'flowchart TD\nA-->B',{onStatus:s=>e.statuses.push(s)});
 e.frame.emit('load');e.win.emit('message',{source:e.frame.contentWindow,origin:'null',data:hello});
 const receive=e.Channel.last.port1.onmessage;
 for(let i=0;i<5;i++)receive({data:{version:1,type:'unknown',token:'wrong'}});
 assert.deepEqual(e.statuses,['error']);h.destroy();
});
