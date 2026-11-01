import { DIAGRAM_LIMITS, parseFlowchart } from './mermaid-model.js';
let active = 0;
const exact = (value, keys) => value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).sort().join(',') === [...keys].sort().join(',');
export function createMermaidFrame(container, source, { onStatus = () => {}, onSize = () => {} } = {}) {
  parseFlowchart(source); // Reject before allocating a browsing context or cloning source.
  if (active >= DIAGRAM_LIMITS.active) throw new Error('renderer_busy');
  const frame = document.createElement('iframe');
  frame.setAttribute('sandbox', 'allow-scripts');
  frame.setAttribute('title', 'Mermaid flowchart');
  frame.setAttribute('referrerpolicy', 'no-referrer');
  frame.setAttribute('allow', "camera 'none'; microphone 'none'; geolocation 'none'; payment 'none'");
  frame.src = '/renderers/mermaid-frame/';
  const bytes = new Uint8Array(32); crypto.getRandomValues(bytes);
  const token = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  let alive = true, loads = 0, hello = false, connected = false, rendered = false, finished = false, messages = 0, port;
  active++;
  function destroy() {
    if (!alive) return;
    alive = false; active--; source = ''; clearTimeout(timer);
    window.removeEventListener('message', handshake);
    frame.removeEventListener('load', load); frame.removeEventListener('error', error);
    if (port) { port.onmessage = null; port.close(); }
    frame.remove();
  }
  function error() { if (alive) { destroy(); onStatus('error'); } }
  function connect() {
    if (!alive || connected || loads !== 1 || !hello) return;
    connected = true; window.removeEventListener('message', handshake);
    const channel = new MessageChannel(); port = channel.port1;
    port.onmessage = ({data}) => {
      if (!alive) return;
      if (++messages > 4) { error(); return; }
      if (!data || data.version !== 1 || data.token !== token) return;
      if (!rendered && exact(data, ['version','type','token']) && data.type === 'ready') {
        rendered = true;
        port.postMessage({ version: 1, type: 'render', token, source }); source = '';
      } else if (rendered && !finished && data.type === 'result' && exact(data, ['version','type','token','status','width','height'])) {
        if (!['ok','unsupported','error'].includes(data.status) || !Number.isFinite(data.width) || !Number.isFinite(data.height) || data.width <= 0 || data.height <= 0 || data.width > DIAGRAM_LIMITS.width || data.height > DIAGRAM_LIMITS.height) { error(); return; }
        finished = true; clearTimeout(timer);
        if (data.status !== 'ok') { destroy(); onStatus(data.status); return; }
        onSize({width:data.width,height:data.height}); onStatus('ok');
      }
    };
    port.start();
    // '*' is required for this opaque target; never broadcast or transfer source here.
    frame.contentWindow.postMessage({version:1,type:'init',token}, '*', [channel.port2]);
  }
  function handshake(event) {
    if (!alive || event.source !== frame.contentWindow || event.origin !== 'null' || !exact(event.data, ['version','type']) || event.data.version !== 1 || event.data.type !== 'hello') return;
    hello = true; connect();
  }
  function load() { if (++loads !== 1) error(); else connect(); }
  window.addEventListener('message', handshake); frame.addEventListener('load', load); frame.addEventListener('error', error);
  const timer = setTimeout(error, 10000); // UX fallback, NOT a hard synchronous CPU kill.
  try { container.append(frame); } catch (err) { destroy(); throw err; }
  return Object.freeze({ frame, destroy });
}
