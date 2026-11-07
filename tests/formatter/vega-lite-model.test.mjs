import test from 'node:test';import assert from 'node:assert/strict';import {existsSync} from 'node:fs';
const path=new URL('../../static/src/vega-lite-model.js',import.meta.url),api=existsSync(path)?await import(path):{};
const sample=()=>({data:{values:[{category:'A',value:2},{category:'B',value:4}]},mark:'bar',encoding:{x:{field:'category',type:'nominal'},y:{field:'value',type:'quantitative'}}});
function parse(value){assert.equal(typeof api.parseVegaLite,'function','bounded chart parser missing');return api.parseVegaLite(typeof value==='string'?value:JSON.stringify(value));}
test('static chart families map fields to owned names and round-trip canonical data',()=>{
 for(const mark of ['bar','line','point']){const input=sample();input.mark=mark;const model=parse(input);assert.equal(model.spec.mark,mark);assert.equal(model.spec.encoding.x.field,'f0');assert.equal(model.spec.encoding.x.title,'category');assert.deepEqual(model.spec.data.values,[{f0:'A',f1:2},{f0:'B',f1:4}]);assert.deepEqual(parse(model.canonical).spec,model.spec);}
});
test('arbitrary runtime, resources, expressions and unknown keys fail closed',()=>{
 for(const [key,value] of Object.entries({transform:[{calculate:'alert(1)',as:'evil'}],params:[{name:'x',expr:'1'}],config:{},width:9999,layer:[],datasets:{},usermeta:{},resolve:{},projection:{}})){const input=sample();input[key]=value;assert.throws(()=>parse(input),{message:'unsupported_vega_lite'});}
 for(const data of [{url:'https://evil.invalid/data'},{values:[],url:'/secret'},{name:'remote'}]){const input=sample();input.data=data;assert.throws(()=>parse(input),{message:'unsupported_vega_lite'});}
 for(const encoding of [{x:{field:'category',type:'nominal',axis:{labelExpr:'evil'}}},{href:{field:'category',type:'nominal'}},{tooltip:{field:'category',type:'nominal'}}]){const input=sample();Object.assign(input.encoding,encoding);assert.throws(()=>parse(input),{message:'unsupported_vega_lite'});}
 const image=sample();image.mark='image';assert.throws(()=>parse(image),{message:'unsupported_vega_lite'});
});
test('field paths, prototype keys, inconsistent records and nonfinite numbers are rejected',()=>{
 for(const field of ['a.b','a[0]','__proto__','constructor','prototype','x'.repeat(33)]){const input=sample();input.data.values=[{[field]:'A',value:1}];input.encoding.x.field=field;assert.throws(()=>parse(input),{message:'unsupported_vega_lite'});}
 for(const values of [[{category:'A',value:2},{category:'B'}],[{category:'A',value:'2'}],[{category:'A',value:null}],[{category:{nested:'A'},value:2}],[{category:'A',value:1e10}]]){const input=sample();input.data.values=values;assert.throws(()=>parse(input),{message:'unsupported_vega_lite'});}
 assert.throws(()=>parse('{"__proto__":{},"mark":"bar"}'),{message:'unsupported_vega_lite'});
});
test('chart source depth rows categories strings and fields stay bounded',()=>{
 for(const input of [' '.repeat(65537),'['.repeat(9)+']'.repeat(9),'{' ,'null'])assert.throws(()=>parse(input),{message:'unsupported_vega_lite'});
 for(const values of [Array.from({length:257},()=>({category:'A',value:2})),Array.from({length:33},(_,i)=>({category:'C'+i,value:i})),[{category:'x'.repeat(81),value:1}]]){const input=sample();input.data.values=values;assert.throws(()=>parse(input),{message:'unsupported_vega_lite'});}
 const input=sample();input.data.values=Array.from({length:256},()=>({category:'A',value:2}));assert.equal(parse(input).spec.data.values.length,256);
});
test('numeric normalization cannot exceed the canonical transport budget',()=>{
 const row='{'+[...Array.from({length:3},(_,i)=>`"s${i}":"${'A'.repeat(52)}"`),...Array.from({length:5},(_,i)=>`"n${i}":1e8`)].join(',')+'}';
 const source=`{"data":{"values":[${Array(256).fill(row).join(',')}]},"mark":"point","encoding":{"x":{"field":"n0","type":"quantitative"},"y":{"field":"n1","type":"quantitative"}}}`;
 assert.ok(source.length<65536);assert.throws(()=>parse(source),{message:'unsupported_vega_lite'});
});
