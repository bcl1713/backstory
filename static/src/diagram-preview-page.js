import { parseFlowchart } from './mermaid-model.js';
import { diagramView } from './diagram-view.js';
const hydrated=new WeakSet();
export function hydrate(root=document){
  const enabled=root.matches?.('[data-mermaid-enabled="true"]')||root.closest?.('[data-mermaid-enabled="true"]')||root.querySelector?.('[data-mermaid-enabled="true"]');
  if(!enabled)return;
  let count=0;
  for(const element of root.querySelectorAll('pre[data-mermaid-source]')){
    if(++count>32)break;if(!element.closest('[data-mermaid-enabled="true"]')||hydrated.has(element))continue;hydrated.add(element);
    const expression=element.getAttribute('data-mermaid-source');let supported=true;try{parseFlowchart(expression);}catch{supported=false;}
    const valid=()=>element.isConnected&&element.getAttribute('data-mermaid-source')===expression;
    diagramView(element,{expression,source:expression,supported},{valid});
  }
}
window.backstoryMermaidPreview=Object.freeze({hydrate});hydrate();
