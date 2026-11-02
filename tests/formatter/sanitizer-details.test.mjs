import test from 'node:test';
import assert from 'node:assert/strict';
import {safeSvg} from '../../static/src/mermaid-svg.js';
import {childStage,diagnosticText} from '../../static/src/diagram-diagnostics.js';
import {Element,document,withParsedSvg} from './support/svg-tree.mjs';
const root=(children=[],attrs={})=>new Element('svg',{viewBox:'0 0 100 100',...attrs},children);
// These rejected trees must remain rejected; only a fixed category may escape.
const cases=[
 ['sanitize-viewbox',root([], {viewBox:'0 0 PRIVATE_CANARY 100'})],
 ['sanitize-points',root([new Element('polygon',{points:'PRIVATE_CANARY'})])],
 ['sanitize-numeric-list',root([new Element('path',{'stroke-dasharray':'PRIVATE_CANARY'})])],
 ['sanitize-scalar',root([new Element('circle',{r:'PRIVATE_CANARY'})])],
 ['sanitize-path',root([new Element('path',{d:'PRIVATE_CANARY'})])],
 ['sanitize-transform',root([new Element('g',{transform:'PRIVATE_CANARY'})])],
 ['sanitize-reference',root([new Element('path',{'marker-end':'url(https://PRIVATE_CANARY.invalid)'})])],
 ['sanitize-paint',root([new Element('path',{fill:'url(https://PRIVATE_CANARY.invalid)'})])],
 ['sanitize-text-attribute',root([new Element('text',{'font-weight':'PRIVATE_CANARY'})])],
 ['sanitize-metadata',root([new Element('g',{class:'PRIVATE_CANARY/'})])],
 ['sanitize-attribute',root([new Element('g',{'PRIVATE_CANARY':'PRIVATE_CANARY'})])],
 ['sanitize-element-filter',root([new Element('filter',{id:'PRIVATE_CANARY'})])],
 ['sanitize-element-resource',root([new Element('image',{href:'https://PRIVATE_CANARY.invalid'})])],
 ['sanitize-element',root([new Element('PRIVATE_CANARY')])],
 ['sanitize-namespace',root([new Element('g',{},[],'https://PRIVATE_CANARY.invalid')])],
 ['sanitize-id',root([new Element('g',{id:'PRIVATE_CANARY/'} )])],
 ['sanitize-viewport',root([], {viewBox:'0 0 0 100'})],
 ['sanitize-node',root([{nodeType:8,textContent:'PRIVATE_CANARY'}])],
 ['sanitize-limit',root([{nodeType:3,textContent:'x'.repeat(16001)}])],
];
const nsAttribute=new Element('g',{foo:'PRIVATE_CANARY'});nsAttribute.attributes[0].namespaceURI='https://PRIVATE_CANARY.invalid';cases.push(['sanitize-attribute-namespace',root([nsAttribute])]);
for(const [code,tree] of cases)test(`rejected SVG reports only ${code}`,()=>{const details=[];assert.throws(()=>withParsedSvg(tree,()=>safeSvg('<svg/>',document,value=>details.push(value))),{message:'unsafe_output'});assert.deepEqual(details,[code]);assert.equal(childStage(code),true);assert.match(diagnosticText(code),/Diagnostic sanitize-/);assert.equal((JSON.stringify(details)+diagnosticText(code)).includes('PRIVATE_CANARY'),false);});
test('malformed XML and oversized input retain rejection with bounded categories',()=>{for(const [tree,source,code]of [[new Element('PRIVATE_CANARY'),'<bad/>','sanitize-xml'],[root(),'x'.repeat(300001),'sanitize-limit']]){const details=[];assert.throws(()=>withParsedSvg(tree,()=>safeSvg(source,document,value=>details.push(value))));assert.deepEqual(details,[code]);}});
test('successful reconstruction emits no rejection detail',()=>{const details=[];const clean=withParsedSvg(root([new Element('circle',{r:'2'})]),()=>safeSvg('<svg/>',document,value=>details.push(value)));assert.equal(clean.getAttribute('viewBox'),'0 0 100 100');assert.deepEqual(details,[]);});
test('untrusted category spellings never become diagnostic text',()=>{for(const value of ['sanitize-PRIVATE_CANARY','sanitize-scalar:PRIVATE_CANARY','__proto__',{},null]){assert.equal(childStage(value),false);assert.equal(diagnosticText(value),'');}});
import {installFrameProtocol} from '../../static/src/mermaid-frame-protocol.js';
test('real sanitizer rejection reaches the unchanged failure protocol without input data',async()=>{
 let listener;const replies=[],parent={postMessage(){}};const win={parent,addEventListener:(t,f)=>listener=f,removeEventListener(){}};const port={postMessage:v=>replies.push(v),start(){},close(){}};
 installFrameProtocol(win,'https://parent.invalid',async(source,stage)=>withParsedSvg(root([new Element('g',{transform:'PRIVATE_CANARY https://private.invalid'})]),()=>safeSvg('<svg/>',document,stage)));
 const token='a'.repeat(64);listener({source:parent,origin:'https://parent.invalid',data:{version:1,type:'init',token},ports:[port]});await port.onmessage({data:{version:1,type:'render',token,source:'flowchart TD\nA[Private sample]'}});
 assert.deepEqual(replies.map(({type,stage,status})=>({type,stage,status})),[{type:'ready',stage:undefined,status:undefined},{type:'diagnostic',stage:'sanitize-transform',status:undefined},{type:'result',stage:undefined,status:'error'}]);
 assert.deepEqual(Object.keys(replies[2]).sort(),['height','status','token','type','version','width']);assert.equal(JSON.stringify(replies).includes('PRIVATE_CANARY'),false);assert.equal(JSON.stringify(replies).includes('Private sample'),false);
});
test('a throwing diagnostic callback cannot accept rejected SVG or replace its error',()=>{assert.throws(()=>withParsedSvg(root([new Element('g',{transform:'PRIVATE_CANARY'})]),()=>safeSvg('<svg/>',document,()=>{throw Error('PRIVATE_CALLBACK_CANARY');})),{message:'unsafe_output'});});
