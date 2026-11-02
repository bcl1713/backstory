import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {safeSvg,safeSvgAttribute} from '../../static/src/mermaid-svg.js';
import {Element,document,withParsedSvg} from './support/svg-tree.mjs';
const fixture=JSON.parse(readFileSync(new URL('../fixtures/mermaid-svg-ci-geometry.json',import.meta.url)));
function shadow({suffix,size,offset},changes={}){return new Element('filter',{id:'diagram-svg'+suffix,height:size,width:size,...changes},[new Element('feDropShadow',{dx:offset,dy:offset,stdDeviation:'0','flood-opacity':'0.06','flood-color':'#000000'})]);}
function root(children=[],viewBox=fixture.viewBox){return new Element('svg',{xmlns:'http://www.w3.org/2000/svg',id:'diagram-svg',viewBox},children);}
test('actual CI fractional geometry is finite data and canonicalized rather than rejected by decimal-place count',()=>{
 assert.equal(safeSvgAttribute('svg','viewBox',fixture.viewBox,new Set()),true);
 assert.equal(safeSvgAttribute('circle','r',fixture.circleRadius,new Set()),true);
 const parsed=root([new Element('circle',{cx:'0',cy:'0',r:fixture.circleRadius})]);
 const clean=withParsedSvg(parsed,()=>safeSvg('<svg/>',document));
 assert.equal(clean.getAttribute('viewBox'),fixture.canonicalViewBox);
 assert.equal(clean.querySelectorAll('*').find(node=>node.localName==='circle').getAttribute('r'),fixture.canonicalRadius);
 const canonical=withParsedSvg(root([new Element('circle',{r:'0.3333333333333333333333333333'})]),()=>safeSvg('<svg/>',document));
 assert.equal(canonical.querySelectorAll('*').find(node=>node.localName==='circle').getAttribute('r'),'0.33333333');
 for(const value of ['Infinity','NaN','1e2','1e999','1000001','url(/private)','1'.repeat(65)])assert.equal(safeSvgAttribute('circle','r',value,new Set()),false,value);
});
test('only pinned decorative drop shadows are omitted; final SVG still admits no filter/resource machinery',()=>{
 const parsed=root([new Element('circle',{r:'20'}),...fixture.filters.map(item=>new Element('defs',{},[shadow(item)]))],'0 0 100 100');
 const clean=withParsedSvg(parsed,()=>safeSvg('<svg/>',document));
 assert.equal(clean.querySelectorAll('*').some(node=>['filter','feDropShadow'].includes(node.localName)),false);
 for(const filter of [shadow(fixture.filters[0],{href:'/private'}),shadow(fixture.filters[0],{id:'unknown-filter'})])assert.throws(()=>withParsedSvg(root([new Element('defs',{},[filter])],'0 0 100 100'),()=>safeSvg('<svg/>',document)),{message:'unsafe_output'});
 const malicious=shadow(fixture.filters[0]);malicious.childNodes[0].append(new Element('feImage',{href:'/private'}));
 assert.throws(()=>withParsedSvg(root([new Element('defs',{},[malicious])],'0 0 100 100'),()=>safeSvg('<svg/>',document)),{message:'unsafe_output'});
 assert.equal(safeSvgAttribute('g','filter','url(#diagram-svg-drop-shadow)',new Set(['diagram-svg-drop-shadow'])),false);
});

test('decorative omission refuses mutated shadow payloads and dangling references',()=>{
 for(const edit of [filter=>filter.childNodes[0].setAttribute('flood-opacity','1'),filter=>filter.childNodes[0].setAttribute('flood-color','url(/private)'),filter=>filter.childNodes[0].setAttribute('href','/private')]){
  const filter=shadow(fixture.filters[0]);edit(filter);assert.throws(()=>withParsedSvg(root([new Element('defs',{},[filter])],'0 0 100 100'),()=>safeSvg('<svg/>',document)),{message:'unsafe_output'});
 }
 const filter=shadow(fixture.filters[0]);assert.throws(()=>withParsedSvg(root([filter],'0 0 100 100'),()=>safeSvg('<svg/>',document)),{message:'unsafe_output'});
 const dangling=root([new Element('defs',{},[shadow(fixture.filters[0])]),new Element('g',{'clip-path':'url(#diagram-svg-drop-shadow)'})],'0 0 100 100');assert.throws(()=>withParsedSvg(dangling,()=>safeSvg('<svg/>',document)),{message:'unsafe_output'});
});
test('classless node text gets an owned center rule and SVG width never upscales beyond natural viewBox',()=>{
 const clean=withParsedSvg(root([new Element('g',{class:'node default'},[new Element('g',{class:'label'},[new Element('text',{},[])])])]),()=>safeSvg('<svg/>',document));
 const style=clean.querySelectorAll('*').find(node=>node.localName==='style').textContent;
 assert.match(style,/\.node text\{text-anchor:middle\}/);
 assert.equal(clean.style.width,'615.109375px');assert.equal(clean.style.maxWidth,'100%');assert.equal(clean.style.height,'auto');
 for(const viewBox of ['0 0 0 100','0 0 100 -1'])assert.throws(()=>withParsedSvg(root([],viewBox),()=>safeSvg('<svg/>',document)),{message:'unsafe_output'});
 const missing=root();missing.removeAttribute('viewBox');assert.throws(()=>withParsedSvg(missing,()=>safeSvg('<svg/>',document)),{message:'unsafe_output'});
});
test('frame sizing uses the bounded natural viewport, not a mobile-first measurement that locks later desktop width',async()=>{
 const api=await import('../../static/src/mermaid-svg.js');assert.equal(typeof api.svgViewport,'function','natural viewport reply helper missing');
 const clean=withParsedSvg(root(),()=>safeSvg('<svg/>',document));
 assert.deepEqual(api.svgViewport(clean),{width:615.109375,height:193.71286011});
 const wide=withParsedSvg(root([],'0 0 5000 500'),()=>safeSvg('<svg/>',document));assert.deepEqual(api.svgViewport(wide),{width:1600,height:162});
 const tall=withParsedSvg(root([],'0 0 200 5000'),()=>safeSvg('<svg/>',document));assert.deepEqual(api.svgViewport(tall),{width:47.92,height:1200});
 const both=withParsedSvg(root([],'0 0 5000 5000'),()=>safeSvg('<svg/>',document));assert.deepEqual(api.svgViewport(both),{width:1198,height:1200});
});
