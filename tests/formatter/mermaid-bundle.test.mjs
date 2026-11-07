import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync,readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
test('renderer is one content-hashed classic bundle with no runtime asset graph',()=>{
 const manifestURL=new URL('../../static/renderers/manifest.json',import.meta.url);
 assert.ok(existsSync(manifestURL),'renderer build manifest missing');
 const manifest=JSON.parse(readFileSync(manifestURL));
 assert.match(manifest.frame,/^mermaid-frame-[A-Z0-9]+\.js$/);
 const code=readFileSync(new URL(`../../static/renderers/${manifest.frame}`,import.meta.url),'utf8');
 assert.equal(createHash('sha256').update(code).digest('hex'),manifest.sha256);
 assert.equal(manifest.mermaid,'12.2.0');
 assert.deepEqual(manifest.imports,[]);assert.equal(manifest.outputs,1);
 assert.equal(manifest.allowedDynamicImports,3);
 assert.doesNotThrow(()=>new vm.Script(code));
 assert.doesNotMatch(code,/\bimport\s*\(|\bimportScripts\s*\(|\bnew\s+(?:Shared)?Worker\s*\(|\bfetch\s*\(|\bWebAssembly\b/);
});
