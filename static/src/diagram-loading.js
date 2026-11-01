import { createMermaidFrame } from './mermaid-frame-parent.js';
import {createGraphvizFrame,createVegaLiteFrame} from './bounded-frame-parent.js';
function observeViewport(element,change){
  if(typeof IntersectionObserver!=='function')return()=>{}; // Keep readable source, never allocate offscreen blindly.
  const observer=new IntersectionObserver(entries=>{for(const entry of entries)change(entry.isIntersecting);});
  observer.observe(element);return()=>observer.disconnect();
}
export function createDiagramScheduler({createFrame=createMermaidFrame,observe=observeViewport}={}){
  const jobs=new Set(),active=new Set(),failures=new Map();let queued=false,sequence=0;
  const current=job=>!job.disposed&&job.element.isConnected&&job.valid();
  function state(job,value){if(current(job))job.callbacks.state?.(value);}
  function stop(job){if(job.handle){job.handle.destroy();job.handle=null;active.delete(job);}}
  function dispose(job){if(job.disposed)return;stop(job);job.disposed=true;job.unobserve?.();job.callbacks.dispose?.();jobs.delete(job);schedule();}
  function prune(){
    for(const job of jobs){
      if(job.element.isConnected){job.wasConnected=true;if(!job.valid())dispose(job);}
      else if(job.wasConnected||job.attachmentSettled)dispose(job);
      // CodeMirror builds multiple toDOM widgets before synchronously inserting
      // them. A never-connected newborn gets only this same-turn grace period.
    }
  }
  function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;pump();});}
  function fail(job,status){stop(job);failures.set(job.source,status);if(failures.size>32)failures.delete(failures.keys().next().value);state(job,status);schedule();}
  function pump(){
    prune();
    const ready=[...jobs].filter(job=>current(job)&&job.visible&&!job.paused&&!job.handle).sort((a,b)=>b.priority-a.priority);
    for(const job of ready){
      if(failures.has(job.source)){state(job,failures.get(job.source));continue;}
      if(active.size>=2){state(job,'capacity');continue;}
      state(job,'loading');active.add(job);job.order=++sequence;
      try{job.handle=createFrame(job.element,job.source,{
        onStatus:status=>{if(!current(job)||!job.visible){dispose(job);return;}if(status==='ok')state(job,'ok');else fail(job,status);},
        onSize:size=>{if(current(job)&&job.visible)job.callbacks.size?.(size);},
      });job.callbacks.frame?.(job.handle.frame);}catch{active.delete(job);fail(job,'error');}
    }
  }
  function mount(element,source,valid,callbacks={}){
    // Fragment replacement can hydrate synchronously before MutationObserver
    // cleanup. Reclaim disconnected/invalid generations before applying cap.
    prune();
    if(jobs.size>=32){callbacks.state?.('capacity');return{destroy(){},activate(){}};}
    const job={element,source,valid,callbacks,visible:false,paused:false,disposed:false,priority:0,handle:null,wasConnected:element.isConnected,attachmentSettled:false};jobs.add(job);
    queueMicrotask(()=>{job.attachmentSettled=true;prune();});
    state(job,'pending');
    job.unobserve=observe(element,visible=>{
      if(job.disposed)return;job.visible=visible;
      if(!visible){stop(job);state(job,'pending');}else job.paused=false;
      schedule();
    });
    return{destroy:()=>dispose(job),pause:()=>{if(current(job)){stop(job);job.paused=true;state(job,'paused');schedule();}},activate:()=>{
      if(!current(job)||!job.visible||failures.has(source))return;
      job.paused=false;job.priority=++sequence;
      if(!job.handle&&active.size>=2){const oldest=[...active].sort((a,b)=>a.order-b.order)[0];stop(oldest);oldest.paused=true;state(oldest,'paused');}
      schedule();
    }};
  }
  return Object.freeze({mount,prune});
}
const scheduler=createDiagramScheduler();
const graphvizScheduler=createDiagramScheduler({createFrame:(element,payload,options)=>{const {engine,source}=JSON.parse(payload);return(engine==='graphviz'?createGraphvizFrame:createVegaLiteFrame)(element,source,options);}});
let cleanupObserver;
export function mountDiagram(element,model,valid,callbacks={}){
  if(!cleanupObserver&&typeof MutationObserver==='function'){
    cleanupObserver=new MutationObserver(()=>{scheduler.prune();graphvizScheduler.prune();});cleanupObserver.observe(element.ownerDocument.documentElement,{childList:true,subtree:true});
  }
  const workerEngine=['graphviz','vega-lite'].includes(model.engine);
  return (workerEngine?graphvizScheduler:scheduler).mount(element,workerEngine?JSON.stringify({engine:model.engine,source:model.expression}):model.expression,valid,callbacks);
}
