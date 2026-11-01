import test from 'node:test';import assert from 'node:assert/strict';import {EditorState} from '@codemirror/state';import {markdown} from '@codemirror/lang-markdown';import {syntaxTree} from '@codemirror/language';import {diagramModelsFromTree,diagramSources} from '../../static/src/diagram-syntax.js';
const chart={data:{values:[{name:'A',value:2}]},mark:'bar',encoding:{x:{field:'name',type:'nominal'},y:{field:'value',type:'quantitative'}}};
const fence='```vega-lite\n'+JSON.stringify(chart)+'\n```';
test('Vega-Lite fences are separately enabled and source protected',()=>{
 const s=EditorState.create({doc:fence,extensions:[markdown()]}),scan=engines=>diagramModelsFromTree(syntaxTree(s),(a,b)=>s.doc.sliceString(a,b),engines);
 assert.equal(scan(['mermaid','graphviz']).length,0);const result=scan(['vega-lite']);assert.equal(result.length,1);assert.equal(result[0].supported,true);assert.equal(result[0].source,fence);assert.deepEqual(diagramSources(fence),[fence]);
});
