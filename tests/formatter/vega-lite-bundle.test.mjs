import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
test('chart bundle uses only local assets and interpreter backend without Function construction',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../../static/renderers/vega-lite-manifest.json',import.meta.url)));
 assert.equal(manifest.expressionBackend,'official-interpreter-only');assert.equal(manifest.outputs,1);assert.deepEqual(manifest.imports,[]);
 const code=readFileSync(new URL('../../static/renderers/'+manifest.frame,import.meta.url),'utf8');assert.ok(!/\bFunction\s*\(|\bWebAssembly\b|\bimportScripts\s*\(|\bimport\s*\(/.test(code));
});
