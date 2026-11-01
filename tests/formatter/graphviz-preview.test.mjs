import test from 'node:test';
import assert from 'node:assert/strict';
import {EditorState} from '@codemirror/state';
import {markdown} from '@codemirror/lang-markdown';
import {syntaxTree} from '@codemirror/language';
import {diagramModelsFromTree,diagramSources} from '../../static/src/diagram-syntax.js';
const fence='```graphviz\ndigraph {a->b}\n```';
test('Graphviz explicit fences are opt-in and preserve source spans',()=>{
 const doc='Before\n\n'+fence+'\n\nAfter',s=EditorState.create({doc,extensions:[markdown()]});
 const scan=engines=>diagramModelsFromTree(syntaxTree(s),(a,b)=>s.doc.sliceString(a,b),engines);
 assert.equal(scan(['mermaid']).length,0);
 const models=scan(['graphviz']);assert.equal(models.length,1);assert.equal(models[0].engine,'graphviz');assert.equal(models[0].supported,true);assert.equal(doc.slice(models[0].from,models[0].to),fence);
});
test('formatter protection includes Graphviz and DOT regardless of renderer opt-in',()=>{
 assert.deepEqual(diagramSources(fence),[fence]);
 const dot=fence.replace('graphviz','dot');assert.deepEqual(diagramSources(dot),[dot]);
});
