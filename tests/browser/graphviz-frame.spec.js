import {test,expect} from '@playwright/test';
import {runtime,browserOrigin} from './support/server.js';
import {readFileSync} from 'node:fs';
async function login(page){await page.goto('/accounts/login/');await page.getByLabel('Username').fill('slice');await page.getByLabel('Password').fill('synthetic-slice-browser-only');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.goto('/health/');}
async function render(page,source){await page.evaluate(async source=>{
  const {createGraphvizFrame}=await import('/static/src/bounded-frame-parent.js');
  const host=document.createElement('section');document.body.append(host);window.plotStatus='pending';
  window.plot=createGraphvizFrame(host,source,{onStatus:s=>window.plotStatus=s,onSize:s=>{window.plot.frame.style.width=s.width+'px';window.plot.frame.style.height=s.height+'px';}});
},source);}
test('Graphviz renders in opaque worker frame without external requests',async({page})=>{
  await login(page);const requests=[];page.on('request',r=>requests.push(r.url()));
  await render(page,'digraph {rankdir=LR; a[label="Source",shape=box]; b[label="Review",shape=diamond]; c[label="Publish",shape=box]; a->b->c;}');
  await expect.poll(()=>page.evaluate(()=>window.plotStatus)).toBe('ok');
  const child=page.frames().find(f=>f.url().endsWith('/renderers/graphviz-frame/'));
  await expect(child.locator('svg')).toBeVisible();await expect(page.locator('svg')).toHaveCount(0);
  expect(await child.evaluate(()=>{try{void parent.document;return false;}catch{return self.origin==='null';}})).toBe(true);
  expect(requests.filter(url=>!url.startsWith('blob:null/')).every(url=>new URL(url).origin===browserOrigin)).toBe(true);
  expect(requests.filter(url=>url.startsWith('blob:null/'))).toHaveLength(1);
  await page.screenshot({path:`${runtime}/reports/graphviz-frame-desktop.png`});
});
test('Graphviz rejects hostile input before allocating frames',async({page})=>{
  await login(page);
  for(const source of ['digraph{a[image="https://evil.invalid/x"]}','digraph{a[label=<img src="/health/">]}','digraph{a[URL="/health/"]}'])await expect(render(page,source)).rejects.toThrow('unsupported_graphviz');
  await expect(page.locator('iframe')).toHaveCount(0);
});
test('Graphviz output sanitizer rejects active and resource markup',async({page})=>{
  await login(page);
  const rejected=await page.evaluate(async()=>{
    const {graphvizSvg}=await import('/static/src/graphviz-svg.js');
    return ['<script/>','<image href="/health/"/>','<a href="/health/">x</a>','<foreignObject/>','<path onclick="x"/>','<path fill="url(/health/)"/>'].map(body=>{try{graphvizSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">${body}</svg>`,document);return false;}catch{return true;}});
  });expect(rejected).toEqual(Array(6).fill(true));
});
test('Graphviz text with fixed XML whitespace survives positive rebuilding',async({page})=>{
 await login(page);
 expect(await page.evaluate(async()=>{const {graphvizSvg}=await import('/static/src/graphviz-svg.js');return graphvizSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60"><text xml:space="preserve" x="2" y="20">Two words</text></svg>',document).textContent;})).toBe('Two words');
});
test('actual worker inheritance denies network and JavaScript eval',async({page})=>{
 await login(page);await render(page,'digraph{a->b}');await expect.poll(()=>page.evaluate(()=>window.plotStatus)).toBe('ok');
 const receiptStart=readFileSync(`${runtime}/request-receipts.jsonl`,'utf8').length;
 const child=page.frames().find(f=>f.url().endsWith('/renderers/graphviz-frame/'));
 const result=await child.evaluate(origin=>new Promise(resolve=>{
  const url=URL.createObjectURL(new Blob([`let denied=false;try{new Function('return 1')()}catch{denied=true}fetch(${JSON.stringify(origin+'/health/?worker-private-canary')},{mode:'no-cors'}).then(()=>postMessage({denied,network:false}),()=>postMessage({denied,network:true}));`],{type:'text/javascript'}));
  const worker=new Worker(url);worker.onmessage=({data})=>{worker.terminate();URL.revokeObjectURL(url);resolve(data);};
 }),browserOrigin);expect(result).toEqual({denied:true,network:true});
 expect(readFileSync(`${runtime}/request-receipts.jsonl`,'utf8').slice(receiptStart)).not.toContain('worker-private-canary');
});
test('actual infinite worker is terminated while parent remains responsive',async({page})=>{
 await login(page);await render(page,'digraph{a->b}');await expect.poll(()=>page.evaluate(()=>window.plotStatus)).toBe('ok');
 const child=page.frames().find(f=>f.url().endsWith('/renderers/graphviz-frame/'));
 // DevTools injects the exact production helper for this synthetic failure;
 // application code exposes no test hook or arbitrary-worker input.
 const helper=readFileSync(new URL('../../static/src/bounded-worker.js',import.meta.url),'utf8').replace('export function','function');
 const result=child.evaluate(`(async()=>{${helper}\nlet terminated=0;const Original=Worker;globalThis.Worker=class extends Original{terminate(){terminated++;super.terminate();}};try{await runBoundedWorker('while(true){}',{});return null;}catch(error){return{error:error.message,terminated};}finally{globalThis.Worker=Original;}})()`);
 await page.evaluate(()=>{window.parentHeartbeat=0;window.heartbeatTimer=setInterval(()=>parentHeartbeat++,20);});
 await expect.poll(()=>page.evaluate(()=>parentHeartbeat)).toBeGreaterThan(5);
 expect(await result).toEqual({error:'renderer_timeout',terminated:1});
 await page.evaluate(()=>clearInterval(heartbeatTimer));
});
test('fixed typography keeps long labels inside their node shapes',async({page})=>{
 await login(page);await render(page,'digraph{a[label="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",shape=box]}');await expect.poll(()=>page.evaluate(()=>window.plotStatus)).toBe('ok');
 const child=page.frames().find(f=>f.url().endsWith('/renderers/graphviz-frame/'));
 const text=await child.locator('g.node text').boundingBox(),shape=await child.locator('g.node polygon').boundingBox();
 expect(text.x).toBeGreaterThanOrEqual(shape.x+2);expect(text.x+text.width).toBeLessThanOrEqual(shape.x+shape.width-2);
});
