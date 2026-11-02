import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {runtime} from './support/server.js';
const mermaid='flowchart TD\n'+Array.from({length:18},(_,i)=>`N${i}[Stage ${i+1}]${i?'':' '}`).join('\n')+'\n'+Array.from({length:17},(_,i)=>`N${i} --> N${i+1}`).join('\n');
const dot='digraph { '+Array.from({length:18},(_,i)=>`n${i}[label="Stage ${i+1}"];`).join(' ')+Array.from({length:17},(_,i)=>`n${i}->n${i+1};`).join(' ')+' }';
const chart=JSON.stringify({data:{values:[{category:'A',value:2},{category:'B',value:4}]},mark:'bar',encoding:{x:{field:'category',type:'nominal'},y:{field:'value',type:'quantitative'}}});
const fixtures=[['mermaid',mermaid,'Mermaid flowchart.'],['graphviz',dot,'Graphviz diagram.'],['vega-lite',chart,'Vega-Lite chart.']];
test.beforeAll(async()=>{for(const [engine,body] of fixtures)await writeFile(`${runtime}/wiki/Clipping-${engine}.md`,'Before\n\n```'+engine+'\n'+body+'\n```\n\n# Following section\n\nAfter.\n');});
for(const [engine,,status] of fixtures)for(const mode of ['notes','preview'])test(`${engine} complete viewport without nested clipping in ${mode}`,async({page},info)=>{
 await page.goto('/accounts/login/');await page.getByLabel('Username').fill('slice');await page.getByLabel('Password').fill('synthetic-slice-browser-only');await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await page.setViewportSize({width:390,height:900});await page.goto(`/${mode}/Clipping-${engine}.md`);
 await expect(page.getByText(status,{exact:true})).toBeVisible();
 const original=mode==='notes'?await page.locator('[data-markdown-editor]').evaluate(el=>el.markdownEditor.getSource()):null;
 const iframe=page.locator('.lp-diagram iframe'),identity=await iframe.elementHandle(),frame=await identity.contentFrame();
 for(const width of [390,1180,390]){
  await page.setViewportSize({width,height:900});
  // Wait for responsive iframe and SVG layout to settle before reading all boxes.
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const geometry=await frame.evaluate(()=>{const svg=document.querySelector('#diagram > svg'),box=svg.getBoundingClientRect(),main=document.querySelector('#diagram'),v=svg.viewBox.baseVal;
   return {svg:{width:box.width,height:box.height,right:box.right,bottom:box.bottom},natural:{width:v.width,height:v.height},viewport:{width:innerWidth,height:innerHeight},document:{width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight},main:{clientHeight:main.clientHeight,scrollHeight:main.scrollHeight},labels:[...svg.querySelectorAll('text')].map(el=>{const b=el.getBoundingClientRect();return {text:el.textContent,top:b.top,bottom:b.bottom};})};});
  await info.attach(`geometry-${width}`,{body:JSON.stringify(geometry),contentType:'application/json'});
  await writeFile(`${runtime}/reports/${engine}-geometry-${mode}-${width}.json`,JSON.stringify(geometry));
  expect.soft(geometry.svg.bottom,JSON.stringify(geometry)).toBeLessThanOrEqual(geometry.viewport.height+2);
  expect.soft(geometry.svg.right).toBeLessThanOrEqual(geometry.viewport.width+2);
  expect.soft(geometry.document.height).toBeLessThanOrEqual(geometry.viewport.height+2);
  expect.soft(geometry.main.scrollHeight).toBeLessThanOrEqual(geometry.main.clientHeight+2);
  if(engine!=='vega-lite'){
   expect(geometry.natural.height).toBeGreaterThan(1200);
   const last=geometry.labels.find(x=>x.text==='Stage 18');expect(last).toBeTruthy();expect.soft(last.bottom).toBeLessThanOrEqual(geometry.viewport.height+2);
  }
  expect(await identity.evaluate(el=>el===document.querySelector('.lp-diagram iframe'))).toBe(true);
  await expect(iframe).toHaveAttribute('sandbox','allow-scripts');
  // Capture the reachable bottom in the real viewport: full-page capture can
  // temporarily resize/recycle CodeMirror widgets and opaque-frame surfaces.
  await iframe.evaluate(el=>window.scrollBy(0,el.getBoundingClientRect().bottom-innerHeight+60));
  await expect(page.getByText(status,{exact:true})).toBeVisible();
  await page.screenshot({path:`${runtime}/reports/${engine}-clipping-${mode}-${width}.png`});
 }
 if(mode==='notes'){
  const box=await iframe.boundingBox();
  await page.touchscreen.tap(box.x+box.width/2,box.y+box.height-20);
  await expect(iframe).toHaveCount(0);
  expect(await page.locator('[data-markdown-editor]').evaluate(el=>el.markdownEditor.getSource())).toBe(original);
 }
});
