import { mountDiagram } from './diagram-loading.js';
const messages={pending:'Diagram source; waiting until visible.',loading:'Loading local Mermaid diagram; source retained.',capacity:'Two diagrams are already active. Show diagram to replace the oldest preview.',paused:'Diagram paused; source retained. Show diagram to render again.',unsupported:'Unsupported Mermaid syntax; source retained. Only bounded plain flowcharts are supported.',error:'Diagram unavailable; source retained. Edit the source or reload to retry.'};
export function diagramView(wrapper,model,{valid,onSource,measured=()=>{}}){
  const doc=wrapper.ownerDocument,source=doc.createElement('code'),status=doc.createElement('span'),show=doc.createElement('button'),edit=doc.createElement('button');
  wrapper.classList.add('lp-diagram');wrapper.setAttribute('role','group');wrapper.setAttribute('aria-label','Mermaid diagram');
  source.className='lp-diagram-source';source.textContent=model.source;
  status.className='lp-diagram-status';status.setAttribute('role','status');
  show.type='button';show.textContent='Show Mermaid diagram';edit.type='button';edit.textContent=onSource?'Edit Mermaid source':'Show Mermaid source';
  wrapper.replaceChildren(source,status,show,edit);
  let registration,disposed=false;
  const current=()=>!disposed&&wrapper.isConnected&&valid();
  function state(value){
    if(disposed)return;
    source.hidden=value==='ok';status.textContent=value==='ok'?'Mermaid flowchart.':messages[value]||messages.error;
    show.hidden=!model.supported||!['pending','capacity','paused'].includes(value);measured();
  }
  show.addEventListener('click',()=>registration?.activate());
  edit.addEventListener('click',()=>onSource?onSource():registration?.pause());
  state(model.supported?'pending':'unsupported');
  if(model.supported)registration=mountDiagram(wrapper,model,current,{state,size:({height})=>{
    if(!current())return;const frame=wrapper.querySelector('iframe');if(frame)frame.style.height=`${height}px`;
    wrapper.style.minHeight=`${height+48}px`;measured();
  }});
  return()=>{disposed=true;registration?.destroy();};
}
