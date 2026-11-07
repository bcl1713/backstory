import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {existsSync} from 'node:fs';
const path=new URL('../browser/support/mermaid-diagnostics.js',import.meta.url),api=existsSync(path)?await import(path):{};
test('CI-only renderer diagnostic captures handled native TypeError without message or label disclosure',async()=>{
 assert.equal(typeof api.installMermaidDiagnostics,'function','diagnostic helper missing');
 const context=vm.createContext({});
 vm.runInContext(`window=globalThis; records=[]; addEventListener=()=>{}; recordMermaidDiagnostic=value=>{records.push(value);return Promise.resolve();}; DOMParser=class{parseFromString(){return{documentElement:{localName:'svg',namespaceURI:'http://www.w3.org/2000/svg',attributes:[{name:'aria-label',value:'PRIVATE-LABEL',namespaceURI:null},{name:'width',value:'100%',namespaceURI:null}],querySelectorAll:()=>[]},querySelector:()=>null};}};`,context);
 vm.runInContext('('+api.installMermaidDiagnostics.toString()+')()',context);
 await vm.runInContext(`Promise.resolve().then(()=>null.privateProperty).catch(()=>{});`,context);
 vm.runInContext(`new DOMParser().parseFromString('<svg/>','image/svg+xml'); new Error('PRIVATE-MESSAGE');`,context);
 const records=JSON.parse(vm.runInContext('JSON.stringify(records)',context));
 assert.ok(records.some(r=>r.kind==='handled-rejection'&&r.name==='TypeError'));
 assert.ok(records.some(r=>r.kind==='svg-schema'));
 assert.ok(!JSON.stringify(records).includes('PRIVATE-LABEL'));
 assert.ok(!JSON.stringify(records).includes('PRIVATE-MESSAGE'));
 assert.equal(records.find(r=>r.kind==='svg-schema').elements[0].attributes[1][1],'100%');
});
test('diagnostic getters cannot change rejection handler return values or thrown reasons',async()=>{
 assert.equal(typeof api.installMermaidDiagnostics,'function');const context=vm.createContext({});
 vm.runInContext(`window=globalThis; addEventListener=()=>{}; recordMermaidDiagnostic=()=>Promise.resolve(); DOMParser=class{parseFromString(){return{};}};`,context);
 vm.runInContext('('+api.installMermaidDiagnostics.toString()+')()',context);
 for(const field of ['name','message','stack']){
  const value=await vm.runInContext(`Promise.reject(Object.defineProperty({},'${field}',{get(){throw 'instrumentation-failure';}})).catch(()=>42)`,context);
  assert.equal(value,42);
 }
 vm.runInContext(`originalReason={get stack(){throw 'instrumentation-failure';}};`,context);
 await assert.rejects(vm.runInContext(`Promise.reject(originalReason).catch(reason=>{throw reason;})`,context),reason=>reason===context.originalReason);
});
test('diagnostic SVG schema failure preserves native parser return and native parser exceptions',()=>{
 assert.equal(typeof api.installMermaidDiagnostics,'function');const context=vm.createContext({});
 vm.runInContext(`window=globalThis; addEventListener=()=>{}; recordMermaidDiagnostic=()=>Promise.resolve(); nativeResult={get documentElement(){throw 'schema-instrumentation-failure';}}; nativeFailure={marker:'native-parser'}; throwNative=false; DOMParser=class{parseFromString(){if(throwNative)throw nativeFailure;return nativeResult;}};`,context);
 vm.runInContext('('+api.installMermaidDiagnostics.toString()+')()',context);
 assert.equal(vm.runInContext(`new DOMParser().parseFromString('<svg/>','image/svg+xml')===nativeResult`,context),true);
 vm.runInContext('throwNative=true',context);
 assert.throws(()=>vm.runInContext(`new DOMParser().parseFromString('<svg/>','image/svg+xml')`,context),reason=>reason===context.nativeFailure);
});
test('multiline error text cannot masquerade as retained stack frames',()=>{
 assert.equal(typeof api.installMermaidDiagnostics,'function');const context=vm.createContext({});
 vm.runInContext(`window=globalThis; records=[]; addEventListener=()=>{}; recordMermaidDiagnostic=value=>{records.push(value);return Promise.resolve();}; DOMParser=class{parseFromString(){return{};}};`,context);
 vm.runInContext('('+api.installMermaidDiagnostics.toString()+')()',context);
 vm.runInContext(`new Error('safe header\\n    at PRIVATE-MESSAGE');`,context);
 const records=JSON.parse(vm.runInContext('JSON.stringify(records)',context));assert.ok(!JSON.stringify(records).includes('PRIVATE-MESSAGE'));
});
test('only known renderer script coordinates survive stack extraction',async()=>{
 const context=vm.createContext({});vm.runInContext(`window=globalThis; records=[]; addEventListener=()=>{}; recordMermaidDiagnostic=value=>{records.push(value);return Promise.resolve();}; DOMParser=class{parseFromString(){return{};}};`,context);
 vm.runInContext('('+api.installMermaidDiagnostics.toString()+')()',context);
 await vm.runInContext(`reason=new Error('not retained');reason.stack='TypeError: PRIVATE-MESSAGE\\n    at fn (http://127.0.0.1:8765/static/renderers/mermaid-frame-ABC123.js:17:23)\\n    at http://127.0.0.1:8765/static/renderers/mermaid-frame-ABC123.js:99:7\\n    at PRIVATE-MESSAGE';Promise.reject(reason).catch(()=>42);`,context);
 const records=JSON.parse(vm.runInContext('JSON.stringify(records)',context));const frames=records.find(record=>record.kind==='handled-rejection').frames;
 assert.deepEqual(frames,[{script:'mermaid-frame-ABC123.js',line:17,column:23},{script:'mermaid-frame-ABC123.js',line:99,column:7}]);assert.ok(!JSON.stringify(records).includes('PRIVATE-MESSAGE'));
});
