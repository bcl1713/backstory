import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {safeSvg,safeSvgAttribute} from '../../static/src/mermaid-svg.js';
import {Element,document,withParsedSvg} from './support/svg-tree.mjs';
const fixture=JSON.parse(readFileSync(new URL('../fixtures/mermaid-svg-firefox-exponents.json',import.meta.url)));
function clean(attrs,children=[]){return withParsedSvg(new Element('svg',{viewBox:'0 0 100 100',...attrs},children),()=>safeSvg('<svg/>',document));}
test('captured Firefox exponent viewBox and transform reconstruct as bounded decimal geometry',()=>{
 const svg=clean({viewBox:fixture.viewBox},[new Element('g',{transform:fixture.transform})]);
 assert.equal(svg.getAttribute('viewBox'),fixture.canonicalViewBox);
 assert.equal(svg.querySelectorAll('*').find(n=>n.localName==='g').getAttribute('transform'),fixture.canonicalTransform);
});
for(const [raw,want]of [['9.5367431640625e-7','0.00000095'],['1e+2','100'],['1E-8','0.00000001'],['-1e-20','0'],['-0e2','0'],['1e6','1000000'],['1e-308','0']])test(`scalar ${raw} canonicalizes within existing magnitude and precision`,()=>{const svg=clean({},[new Element('circle',{r:raw})]);assert.equal(svg.querySelectorAll('*').find(n=>n.localName==='circle').getAttribute('r'),want);});
for(const value of ['1e','1e+','1e--2','1e2e3','NaN','Infinity','1e309','1e-309','1e0001','1.000001e6','1e7','10000001e-1','0.'+'1'.repeat(33)+'e-1','1'.repeat(65),'1e2pxjunk','url(/private)','1e2;fill:red'])test(`malformed or unbounded scalar remains rejected: ${value.slice(0,30)}`,()=>{assert.equal(safeSvgAttribute('circle','r',value,new Set()),false);});
for(const [input,expected]of [['translate(1e2)','translate(100)'],['scale(1e0, 2E-1)','scale(1 0.2)'],['rotate(4.5e1 1e0 -1e0)','rotate(45 1 -1)'],['matrix(1e0,0,0,1e0,9e-7,-1e1)','matrix(1 0 0 1 0.0000009 -10)'],['translate(1,2) scale(2)','translate(1 2) scale(2)']])test(`transform arguments are fully parsed and canonicalized: ${input}`,()=>{const svg=clean({},[new Element('g',{transform:input})]);assert.equal(svg.querySelectorAll('*').find(n=>n.localName==='g').getAttribute('transform'),expected);});
for(const input of ['translate()','translate(1,,2)','translate(,1)','translate(1,)','translate(1 2 3)','scale(1 2 3)','rotate(1 2)','matrix(1 0 0 1 0)','matrix(1 0 0 1 0 0 0)','translate(1e309)','translate(1e-309)','translate(1e7)','translate(1px)','translate(1e)','translate(1)junk','translate(1) url(/private)','skewX(1)','translate(1)/*x*/scale(2)','translate(1e2+3)','translate(1.2.3)','translate(1, ,2)'])test(`malformed or unsupported transform is rejected: ${input}`,()=>{assert.equal(safeSvgAttribute('g','transform',input,new Set()),false);});
test('viewport positivity is enforced after exponent rounding',()=>{for(const box of ['0 0 1e-20 100','0 0 100 -1e-7','0 0 0e2 100'])assert.throws(()=>clean({viewBox:box}),{message:'unsafe_output'});});
