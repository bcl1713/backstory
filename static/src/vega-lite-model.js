export const VEGA_LITE_LIMITS=Object.freeze({source:65536,records:256,fields:8,categories:32,string:80,depth:8,number:1e9});
const fail=()=>{throw new Error('unsupported_vega_lite');};
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const keys=(value,allowed,required=allowed)=>{
 if(!object(value)||Object.keys(value).some(key=>!allowed.includes(key))||required.some(key=>!Object.hasOwn(value,key)))fail();
};
const field=name=>typeof name==='string'&&/^[A-Za-z_][A-Za-z0-9_]{0,31}$/.test(name)&&!['__proto__','prototype','constructor'].includes(name);
export function parseVegaLite(source){
 if(typeof source!=='string'||source.length>65536||new TextEncoder().encode(source).length>65536)fail();
 let depth=0,quoted=false;
 for(let i=0;i<source.length;i++){
  const c=source[i];if(quoted){if(c==='\\')i++;else if(c==='"')quoted=false;continue;}
  if(c==='"')quoted=true;else if(c==='['||c==='{'){if(++depth>8)fail();}else if(c===']'||c==='}')depth--;
 }
 let input;try{input=JSON.parse(source);}catch{fail();}
 keys(input,['data','mark','encoding']);keys(input.data,['values']);
 if(!['bar','line','point'].includes(input.mark))fail();
 const rows=input.data.values;
 if(!Array.isArray(rows)||!rows.length||rows.length>256||!object(rows[0]))fail();
 const fields=Object.keys(rows[0]);if(!fields.length||fields.length>8||!fields.every(field))fail();
 const mapped=new Map(fields.map((name,index)=>[name,`f${index}`]));
 const values=rows.map(row=>{
  keys(row,fields);
  const result={};
  for(const name of fields){
   const value=row[name];
   if(typeof value==='number'){if(!Number.isFinite(value)||Math.abs(value)>1e9)fail();}
   else if(typeof value!=='string'||!value.length||value.length>80||/[\x00-\x1f\x7f]/.test(value))fail();
   result[mapped.get(name)]=value;
  }return Object.freeze(result);
 });
 keys(input.encoding,['x','y','color'],['x','y']);
 const encoding={};
 for(const [channel,entry] of Object.entries(input.encoding)){
  keys(entry,['field','type']);
  if(!field(entry.field)||!mapped.has(entry.field)||!['nominal','quantitative'].includes(entry.type)||(channel==='color'&&entry.type!=='nominal'))fail();
  const column=rows.map(row=>row[entry.field]);
  if(entry.type==='quantitative'){if(column.some(value=>typeof value!=='number'))fail();}
  else if(column.some(value=>typeof value!=='string')||new Set(column).size>32)fail();
  encoding[channel]=Object.freeze({field:mapped.get(entry.field),type:entry.type,title:entry.field});
 }
 if(input.encoding.x.type!=='quantitative'&&input.encoding.y.type!=='quantitative')fail();
 const spec=Object.freeze({data:Object.freeze({values:Object.freeze(values)}),mark:input.mark,encoding:Object.freeze(encoding)});
 const canonical={data:{values:values.map(row=>Object.fromEntries(fields.map(name=>[name,row[mapped.get(name)]])))},mark:input.mark,encoding:Object.fromEntries(Object.entries(input.encoding).map(([channel,entry])=>[channel,{field:entry.field,type:entry.type}]))};
 const transport=JSON.stringify(canonical);
 // Numeric normalization and escaping may expand otherwise bounded input.
 if(transport.length>65536||new TextEncoder().encode(transport).length>65536)fail();
 return Object.freeze({spec,canonical:transport});
}
