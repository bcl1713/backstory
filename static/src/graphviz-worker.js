import {instance} from '@viz-js/viz';
import {parseDot,GRAPHVIZ_LIMITS} from './graphviz-model.js';
let used=false;
// Graphviz's generated runtime includes generic filesystem/network helpers.
// They are not part of this interface; deny them independently of inherited CSP.
for(const name of ['fetch','XMLHttpRequest','WebSocket','EventSource','importScripts','Worker','SharedWorker'])
  Object.defineProperty(self,name,{value:function(){throw new Error('resource_denied');},writable:false,configurable:false});
self.onmessage=async({data})=>{
  if(used)return;used=true;
  try {
    const model=parseDot(data);
    const viz=await instance();
    const svg=viz.renderString(model.canonical,{format:'svg',engine:'dot',nodeAttributes:{fontname:'Arial',fontsize:'14'},edgeAttributes:{fontname:'Arial',fontsize:'14'}});
    if(typeof svg!=='string'||svg.length>GRAPHVIZ_LIMITS.output)throw new Error('unsafe_output');
    self.postMessage({svg});
  } catch {self.postMessage({error:true});}
};
