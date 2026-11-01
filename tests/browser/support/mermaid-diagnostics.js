// Test-only synthetic-fixture diagnostics. Never imported into application code.
export function installMermaidDiagnostics(){
 let records=0;
 const record=value=>{if(records++>=8)return;try{window.recordMermaidDiagnostic?.(value)?.catch?.(()=>{});}catch{}};
 const errorRecord=(reason,kind)=>{try{
  const name=['Error','TypeError','RangeError','SyntaxError'].includes(reason?.name)?reason.name:'Error';
  const message=['unsafe_output','unsupported_renderer_feature'].includes(reason?.message)?reason.message:'redacted';
  // Retain only fixed test renderer-script coordinates, never arbitrary raw
  // lines: a multiline Error.message can itself contain an apparent 'at' frame.
  const trace=String(reason?.stack||'').slice(0,16384);
  const location=/https?:\/\/(?:127\.0\.0\.1|localhost):[1-9]\d{0,4}\/static\/renderers\/(mermaid-frame-[A-Z0-9]+\.js):(\d{1,7}):(\d{1,7})(?=[\s)]|$)/g;
  const frames=[...trace.matchAll(location)].slice(0,8).map(match=>({script:match[1],line:Number(match[2]),column:Number(match[3])}));
  record({kind,name,message,frames});
 }catch{/* Diagnostics must never change the rejection being observed. */}};
 const parse=DOMParser.prototype.parseFromString;
 const geometry=new Set(['x','y','x1','x2','y1','y2','dx','dy','cx','cy','r','rx','ry','width','height','viewBox','refX','refY','markerWidth','markerHeight','markerUnits','orient','text-anchor','dominant-baseline','font-weight','font-style','stroke-linecap','stroke-linejoin','stroke-width','stroke-dasharray','stroke-dashoffset','opacity','transform','d','points','xmlns','xmlns:xlink','fill','stroke','preserveAspectRatio']);
 DOMParser.prototype.parseFromString=function(source,type){
  const parsed=Reflect.apply(parse,this,[source,type]);
  try{if(type==='image/svg+xml'){
   const elements=[parsed.documentElement,...parsed.documentElement.querySelectorAll('*')];
   record({kind:'svg-schema',parserError:!!parsed.querySelector('parsererror'),inputUnits:source.length,nodeCount:elements.length,
    elements:elements.slice(0,256).map(node=>({tag:node.localName,namespace:node.namespaceURI,attributes:[...node.attributes].slice(0,24).map(attr=>[attr.name,geometry.has(attr.name)?attr.value.slice(0,256):'<redacted>',attr.namespaceURI])}))});
  }}catch{/* Return the original parser result even if schema capture fails. */}
  return parsed;
 };
 for(const name of ['Error','TypeError','RangeError']){
  const native=window[name];window[name]=new Proxy(native,{construct(target,args,newTarget){const error=Reflect.construct(target,args,newTarget);errorRecord(error,'constructed-error');return error;}});
 }
 // Mermaid's public queue handles native draw rejections explicitly. Observe
 // before those handlers consume them, preserving handler values/throw behavior.
 const then=Promise.prototype.then;
 Promise.prototype.then=function(fulfilled,rejected){return Reflect.apply(then,this,[fulfilled,typeof rejected==='function'?reason=>{errorRecord(reason,'handled-rejection');return Reflect.apply(rejected,undefined,[reason]);}:rejected]);};
 addEventListener('unhandledrejection',event=>errorRecord(event.reason,'unhandled-rejection'));
 addEventListener('error',event=>errorRecord(event.error,'window-error'));
}
