import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { EditorState } from '@codemirror/state';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { frontMatter } from '../../static/src/live-preview.js';
const file=new URL('../../static/src/diagram-preview.js',import.meta.url);
const api=existsSync(file)?await import(file):{};
const state=(doc,selection={anchor:0},extra=[])=>EditorState.create({doc,selection,extensions:[markdown({base:markdownLanguage,extensions:[frontMatter]}),...extra]});
const fence='```mermaid\nflowchart LR\nA[Start] --> B{Ready?}\n```';
test('only complete explicit top-level mermaid fences become bounded models',()=>{
 assert.equal(typeof api.diagramModels,'function','diagram models missing');
 const source='Before\n\n'+fence+'\n\n~~~mermaid\nflowchart TD\nA-->B\n~~~\n\nAfter';
 const models=api.diagramModels(state(source));assert.equal(models.length,2);
 assert.equal(models[0].source,fence);assert.equal(models[0].expression,'flowchart LR\nA[Start] --> B{Ready?}\n');
 for(const model of models)assert.equal(source.slice(model.from,model.to),model.source);
 for(const source of ['```mermaid\nflowchart TD\nA-->B','```mermaid extra\nflowchart TD\nA-->B\n```','```js\nflowchart TD\nA-->B\n```','> ```mermaid\n> flowchart TD\n> A-->B\n> ```','- ```mermaid\n  flowchart TD\n  A-->B\n  ```','<div>\n'+fence+'\n</div>','---\n'+fence+'\n---'])assert.deepEqual(api.diagramModels(state(source)),[],source);
});
test('unsupported and over-budget fences retain source; selection and motion reveal without edits',()=>{
 assert.equal(typeof api.diagramModels,'function');
 const source='Before\n\n'+fence+'\n\n```mermaid\nsequenceDiagram\nA->>B:Hi\n```';
 let s=state(source,{anchor:0},[api.diagramMotionRange]);const models=api.diagramModels(s);
 assert.equal(models[0].supported,true);assert.equal(models[1].supported,false);
 assert.equal(api.diagramIsActive(s,models[0]),false);
 s=s.update({selection:{anchor:models[0].from+20}}).state;assert.equal(api.diagramIsActive(s,models[0]),true);
 s=s.update({selection:{anchor:0},effects:api.revealDiagramMotion.of({from:0,to:source.length})}).state;assert.equal(api.diagramIsActive(s,models[0]),true);
 assert.equal(s.doc.toString(),source);
 assert.equal(api.diagramModels(state(('Before\n\n'+fence+'\n\n').repeat(40))).length,32);
 assert.deepEqual(api.diagramModels(state('```mermaid\n'+'x'.repeat(8193)+'\n```')),[]);
});
test('state-owned block replacements disappear for intersecting source selection',()=>{
 assert.ok(api.diagramPreview,'diagram field missing');
 const source='Before\n\n'+fence+'\n\nAfter';let s=state(source,{anchor:0},[api.diagramPreview]);
 assert.equal(s.field(api.diagramPreview).size,1);
 s=s.update({selection:{anchor:0,head:source.length}}).state;assert.equal(s.field(api.diagramPreview).size,0);assert.equal(s.doc.toString(),source);
});
