import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
const path=new URL('../../static/src/bounded-worker.js',import.meta.url);
const api=existsSync(path)?await import(path):{};
test('worker results are bounded and worker/object URL are always released',async()=>{
  assert.equal(typeof api.runBoundedWorker,'function','bounded worker not implemented');
  const original=globalThis.Worker,create=URL.createObjectURL,revoke=URL.revokeObjectURL;
  let terminated=0,revoked=0;
  URL.createObjectURL=()=> 'blob:test';URL.revokeObjectURL=()=>revoked++;
  try {
    globalThis.Worker=class{postMessage(){queueMicrotask(()=>this.onmessage({data:{svg:'<svg/>'}}));}terminate(){terminated++;}};
    assert.equal(await api.runBoundedWorker('trusted-build-source',{}),'<svg/>');
    globalThis.Worker=class{postMessage(){queueMicrotask(()=>this.onmessage({data:{svg:'x'.repeat(250001)}}));}terminate(){terminated++;}};
    await assert.rejects(api.runBoundedWorker('trusted-build-source',{}));
    assert.equal(terminated,2);assert.equal(revoked,2);
  } finally {globalThis.Worker=original;URL.createObjectURL=create;URL.revokeObjectURL=revoke;}
});
test('stuck worker is actually terminated at deadline',async()=>{
  assert.equal(typeof api.runBoundedWorker,'function','bounded worker not implemented');
  const original=globalThis.Worker;let terminated=false;
  try {
    globalThis.Worker=class{postMessage(){}terminate(){terminated=true;}};
    await assert.rejects(api.runBoundedWorker('trusted-build-source',{}),{message:'renderer_timeout'});
    assert.equal(terminated,true);
  } finally {globalThis.Worker=original;}
});
