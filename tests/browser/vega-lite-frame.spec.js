import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {runtime,browserOrigin} from './support/server.js';
const spec=mark=>({data:{values:[{category:'A',value:2},{category:'B',value:4},{category:'C',value:3}]},mark,encoding:{x:{field:'category',type:'nominal'},y:{field:'value',type:'quantitative'}}});
async function login(page){await page.goto('/accounts/login/');await page.getByLabel('Username').fill('slice');await page.getByLabel('Password').fill('synthetic-slice-browser-only');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.goto('/health/');}
async function render(page,source){await page.evaluate(async source=>{const {createVegaLiteFrame}=await import('/static/src/bounded-frame-parent.js');const host=document.createElement('section');document.body.append(host);window.chartStatus='pending';window.chart=createVegaLiteFrame(host,source,{onStatus:s=>chartStatus=s,onSize:s=>{chart.frame.style.width=s.width+'px';chart.frame.style.height=s.height+'px';}});},source);}
for(const mark of ['bar','line','point'])test(`Vega-Lite ${mark} uses opaque interpreter worker and local assets only`,async({page})=>{
 await login(page);const requests=[];page.on('request',r=>requests.push(r.url()));await render(page,JSON.stringify(spec(mark)));await expect.poll(()=>page.evaluate(()=>chartStatus)).toBe('ok');
 const child=page.frames().find(f=>f.url().endsWith('/renderers/vega-lite-frame/'));await expect(child.locator('svg')).toBeVisible();await expect(page.locator('svg')).toHaveCount(0);
 const marks=child.locator('g.role-mark > path');await expect(marks).toHaveCount(mark==='line'?1:3);
 for(const item of await marks.all()){await expect(item).toHaveAttribute('d',/.+/);const box=await item.boundingBox();expect(box.width+box.height).toBeGreaterThan(2);}
 expect(await child.evaluate(()=>{try{void parent.document;return false;}catch{return self.origin==='null';}})).toBe(true);
 expect(requests.filter(url=>!url.startsWith('blob:null/')).every(url=>new URL(url).origin===browserOrigin)).toBe(true);expect(requests.filter(url=>url.startsWith('blob:null/'))).toHaveLength(1);
 await page.screenshot({path:`${runtime}/reports/vega-lite-${mark}-desktop.png`});
});
test('Vega-Lite rejects external data and expressions before creating a frame',async({page})=>{
 await login(page);for(const extra of [{data:{url:'https://evil.invalid/data'}},{transform:[{calculate:'1+1',as:'x'}]},{mark:'image'}])await expect(render(page,JSON.stringify({...spec('bar'),...extra}))).rejects.toThrow('unsupported_vega_lite');await expect(page.locator('iframe')).toHaveCount(0);
});
test('Vega-Lite shell keeps WebAssembly, JavaScript eval and network denied',async({page})=>{
 await login(page);await render(page,JSON.stringify(spec('bar')));await expect.poll(()=>page.evaluate(()=>chartStatus)).toBe('ok');
 const child=page.frames().find(f=>f.url().endsWith('/renderers/vega-lite-frame/'));const start=readFileSync(`${runtime}/request-receipts.jsonl`,'utf8').length;
 const result=await child.evaluate(origin=>new Promise(resolve=>{
  const code=`(async()=>{let js=false,wasm=false,network=false;try{Function('return 1')()}catch{js=true}try{await WebAssembly.compile(new Uint8Array([0,97,115,109,1,0,0,0]))}catch{wasm=true}try{await fetch(${JSON.stringify(origin+'/health/?chart-worker-canary')},{mode:'no-cors'})}catch{network=true}postMessage({js,wasm,network});})()`;
  const url=URL.createObjectURL(new Blob([code],{type:'text/javascript'})),worker=new Worker(url);worker.onmessage=({data})=>{worker.terminate();URL.revokeObjectURL(url);resolve(data);};
 }),browserOrigin);expect(result).toEqual({js:true,wasm:true,network:true});expect(readFileSync(`${runtime}/request-receipts.jsonl`,'utf8').slice(start)).not.toContain('chart-worker-canary');
});

test('Vega-Lite output rejects active markup, external resources and excessive complexity',async({page})=>{
 await login(page);
 const result=await page.evaluate(async()=>{
  const {vegaLiteSvg}=await import('/static/src/vega-lite-svg.js');
  const wrap=body=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${body}</svg>`;
  const inputs=['<script/>','<image href="/health/"/>','<a href="/health/">x</a>','<foreignObject/>','<path onclick="x"/>','<path fill="url(/health/)"/>','<path clip-path="url(#missing)"/>','<g id="same"/><g id="same"/>','<text>'+ 'a'.repeat(16001)+'</text>','<g>'.repeat(34)+'</g>'.repeat(34),'<path/>'.repeat(4001)].map(wrap);
  inputs.push('<!DOCTYPE svg [<!ENTITY bad "x">]>'+wrap('<text>&bad;</text>'));
  return inputs.map(source=>{try{vegaLiteSvg(source,document);return false;}catch{return true;}});
 });expect(result).toEqual(Array(12).fill(true));
});
test('quantitative axes and optional nominal color render a bounded legend',async({page})=>{
 await login(page);
 await render(page,JSON.stringify({data:{values:[{x:1,y:2,group:'First'},{x:2,y:3,group:'Second'},{x:3,y:1,group:'First'}]},mark:'point',encoding:{x:{field:'x',type:'quantitative'},y:{field:'y',type:'quantitative'},color:{field:'group',type:'nominal'}}}));
 await expect.poll(()=>page.evaluate(()=>chartStatus)).toBe('ok');
 const child=page.frames().find(f=>f.url().endsWith('/renderers/vega-lite-frame/'));
 await expect(child.locator('g.role-mark > path')).toHaveCount(3);
 await expect(child.locator('.role-legend-label')).toContainText(['First','Second']);
 await page.screenshot({path:`${runtime}/reports/vega-lite-color-desktop.png`});
});
