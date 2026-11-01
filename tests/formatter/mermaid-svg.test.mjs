import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
const path=new URL('../../static/src/mermaid-svg.js',import.meta.url);
const api=existsSync(path)?await import(path):{};
test('SVG attributes accept bounded geometry and owned references, never resource/event data',()=>{
  assert.equal(typeof api.safeSvgAttribute,'function','SVG validator missing');
  assert.equal(api.safeSvgAttribute('path','d','M0,0L20.5,-4Z',new Set()),true);
  assert.equal(api.safeSvgAttribute('path','marker-end','url(#diagram-pointEnd)',new Set(['diagram-pointEnd'])),true);
  for(const [name,value] of [['onclick','alert(1)'],['href','https://evil.invalid'],['style','fill:url(/secret)'],['marker-end','url(/secret)'],['d','M'+'0'.repeat(40001)],['transform','translate(Infinity,0)'],['class','x https://x'],['fill','url(https://x)']]) assert.equal(api.safeSvgAttribute('path',name,value,new Set()),false,name);
});
test('renderer text em offsets stay bounded while path and transform numbers are finite',()=>{
 assert.equal(api.safeSvgAttribute('tspan','dy','1.1em',new Set()),true);
 assert.equal(api.safeSvgAttribute('tspan','y','-0.1em',new Set()),true);
 assert.equal(api.safeSvgAttribute('path','d','M1e999,0L2,3',new Set()),false);
 assert.equal(api.safeSvgAttribute('g','transform','translate(9999999999999999999999,0)',new Set()),false);
});
test('simple subroutine polygons and plain text font attributes remain positive data',()=>{
 assert.equal(api.safeSvgAttribute('polygon','points','0,0 10,0 10,-20 0,-20 0,0 -8,0 18,0 18,-20 -8,-20 -8,0',new Set()),true);
 assert.equal(api.safeSvgAttribute('tspan','font-weight','normal',new Set()),true);
 assert.equal(api.safeSvgAttribute('tspan','font-style','normal',new Set()),true);
 assert.equal(api.safeSvgAttribute('svg','viewBox','0 0 100 200 300',new Set()),false);
});
