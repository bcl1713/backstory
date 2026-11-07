import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const fixtures=JSON.parse(readFileSync(new URL('../fixtures/mermaid-origins.json',import.meta.url)));
test('shared renderer origin fixtures agree with native WHATWG URL serialization',()=>{
  for(const fixture of fixtures){
    let serialized=null;
    try{serialized=new URL(fixture.origin).origin;}catch{}
    assert.equal(serialized,fixture.browserOrigin,fixture.origin);
    if(fixture.accepted)assert.equal(serialized,fixture.origin,fixture.origin);
    else assert.notEqual(serialized,fixture.origin,fixture.origin);
  }
});
