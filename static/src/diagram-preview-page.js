import { parseFlowchart } from './mermaid-model.js';
import {parseDot} from './graphviz-model.js';
import {parseVegaLite} from './vega-lite-model.js';
import { diagramView } from './diagram-view.js';
const hydrated=new WeakSet();
export function hydrate(root=document){
  hydrateEngine(root,'mermaid',parseFlowchart);hydrateEngine(root,'graphviz',parseDot);hydrateEngine(root,'vega-lite',parseVegaLite);
}
function hydrateEngine(root,engine,parse){
  const enabled=root.matches?.(`[data-${engine}-enabled="true"]`)||root.closest?.(`[data-${engine}-enabled="true"]`)||root.querySelector?.(`[data-${engine}-enabled="true"]`);
  if(!enabled)return;
  let count=0;
  for(const element of root.querySelectorAll(`pre[data-${engine}-source]`)){
    if(++count>32)break;if(!element.closest(`[data-${engine}-enabled="true"]`)||hydrated.has(element))continue;hydrated.add(element);
    const expression=element.getAttribute(`data-${engine}-source`);let supported=true;try{parse(expression);}catch{supported=false;}
    const valid=()=>element.isConnected&&element.getAttribute(`data-${engine}-source`)===expression;
    diagramView(element,{expression,source:expression,supported,engine},{valid});
  }
}
window.backstoryMermaidPreview=Object.freeze({hydrate});hydrate();
