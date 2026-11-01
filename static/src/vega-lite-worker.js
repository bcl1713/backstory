import {compile} from 'vega-lite';
import {parse,View} from 'vega';
import {expressionInterpreter} from 'vega-interpreter';
import {parseVegaLite} from './vega-lite-model.js';
for(const name of ['fetch','XMLHttpRequest','WebSocket','EventSource','importScripts','Worker','SharedWorker'])
 Object.defineProperty(self,name,{value:function(){throw new Error('resource_denied');},writable:false,configurable:false});
let used=false;
self.onmessage=async({data})=>{
 if(used)return;used=true;let view;
 try{
  const model=parseVegaLite(data);
  // Vega assigns tuple identities to records. Keep the validated model immutable,
  // but give the compiler/dataflow its own mutable copy, never the original spec.
  const specification={...structuredClone(model.spec),width:300,height:220,config:{font:'Arial',axis:{labelFont:'Arial',titleFont:'Arial',labelFontSize:14,titleFontSize:14,labelAngle:0,labelOverlap:true,labelLimit:70,tickCount:6},legend:{labelFont:'Arial',titleFont:'Arial',labelFontSize:14,titleFontSize:14,labelLimit:100},view:{stroke:null}}};
  const compiled=compile(specification,{logger:{warn(){},info(){},debug(){},error(){throw new Error('unsupported_chart');},level(){return this;}}}).spec;
  const runtime=parse(compiled,null,{ast:true});
  const deny=()=>Promise.reject(new Error('resource_denied'));
  view=new View(runtime,{expr:expressionInterpreter,renderer:'none',loader:{load:deny,sanitize:deny},logLevel:0});
  const svg=await view.toSVG();
  if(typeof svg!=='string'||svg.length>250000||(svg.match(/<[A-Za-z]/g)||[]).length>4000)throw new Error('unsafe_output');
  self.postMessage({svg});
 }catch{self.postMessage({error:true});}finally{view?.finalize();}
};
