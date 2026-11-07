import test from 'node:test';
import assert from 'node:assert/strict';
import{existsSync}from'node:fs';
const path=new URL('../../static/src/diagram-syntax.js',import.meta.url),api=existsSync(path)?await import(path):{};
test('formatter protects every Mermaid fence independently of display/model count and body budget',()=>{
 assert.equal(typeof api.diagramSources,'function','diagram source signatures missing');
 const source='```mermaid\nflowchart TD\nA[keep  two  spaces]\n```\n\n';
 assert.equal(api.diagramSources(source.repeat(101)).length,101);
 assert.equal(api.diagramSources('```mermaid\n'+'x'.repeat(9000)+'\n```').length,1);
 assert.equal(api.diagramSources('```mermaid\nunfinished')[0],'```mermaid\nunfinished');
 assert.equal(api.diagramSources('> ```mermaid\n> sequenceDiagram\n> A->>B: Hi\n> ```').length,1);
 assert.deepEqual(api.diagramSources('<div>\n'+source+'\n</div>'),[]);
 assert.equal(api.diagramSources('***\n\n'.repeat(100001)+source),null);
});
test('source integrity also protects unsupported Mermaid fence info and casing',()=>{
 for(const header of ['mermaid extra','Mermaid','mermaid {theme=custom}'])assert.equal(api.diagramSources('```'+header+'\nunsupported source\n```').length,1);
});
