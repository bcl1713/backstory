import { DIAGRAM_LIMITS, parseFlowchart } from './mermaid-model.js';
const exact=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).sort().join(',')===[...keys].sort().join(',');
export function installFrameProtocol(win, origin, render) {
  if (win.parent === win) return; // Direct visits never accept note source.
  function handshake(event) {
    const data=event.data;
    if(event.source!==win.parent||event.origin!==origin||!exact(data,['version','type','token'])||data.version!==1||data.type!=='init'||typeof data.token!=='string'||!/^[a-f0-9]{64}$/.test(data.token)||event.ports?.length!==1) return;
    win.removeEventListener('message',handshake);
    const port=event.ports[0], token=data.token; let used=false;
    port.onmessage=async({data:message})=>{
      if(used) return;
      // The first message consumes this session even if malformed; no retries.
      used=true;
      let status='unsupported',width=1,height=1;
      try {
        if(!exact(message,['version','type','token','source'])||message.version!==1||message.type!=='render'||message.token!==token) throw new Error('unsupported_diagram');
        const model=parseFlowchart(message.source);
        status='error';
        const size=await render(model.canonical);
        if(!Number.isFinite(size.width)||!Number.isFinite(size.height)||size.width<=0||size.height<=0) throw new Error('unsafe_output');
        width=Math.min(DIAGRAM_LIMITS.width,size.width); height=Math.min(DIAGRAM_LIMITS.height,size.height);status='ok';
      } catch { /* Never send source, exception text, SVG, HTML or URLs to parent. */ }
      port.postMessage({version:1,type:'result',token,status,width,height});
      port.onmessage=null; port.close();
    };
    port.start(); port.postMessage({version:1,type:'ready',token});
  }
  win.addEventListener('message',handshake);
  win.parent.postMessage({version:1,type:'hello'},origin);
}
