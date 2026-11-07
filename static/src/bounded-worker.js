// Source is a trusted build artifact, never note data. The deadline covers startup.
export function runBoundedWorker(source, input) {
  return new Promise((resolve,reject)=>{
    let worker,url,settled=false;
    const cleanup=()=>{
      clearTimeout(timer);globalThis.removeEventListener?.('pagehide',cancel);
      if(worker){worker.onmessage=null;worker.onerror=null;worker.terminate();}
      if(url)URL.revokeObjectURL(url);
    };
    const finish=(error,value)=>{if(settled)return;settled=true;cleanup();error?reject(error):resolve(value);};
    const cancel=()=>finish(new Error('renderer_disposed'));
    const timer=setTimeout(()=>finish(new Error('renderer_timeout')),2000);
    globalThis.addEventListener?.('pagehide',cancel,{once:true});
    try {
      url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));
      worker=new Worker(url);
      worker.onerror=()=>finish(new Error('renderer_error'));
      worker.onmessage=({data})=>{
        if(!data||Object.keys(data).join(',')!=='svg'||typeof data.svg!=='string'||data.svg.length>250000)finish(new Error('unsafe_output'));
        else finish(null,data.svg);
      };
      worker.postMessage(input);
    } catch(error){finish(error);}
  });
}
