import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {runtime} from './support/server.js';
const mermaid='flowchart TD\n'+Array.from({length:18},(_,i)=>`N${i}[Stage ${i+1}]`).join('\n')+'\n'+Array.from({length:17},(_,i)=>`N${i} --> N${i+1}`).join('\n');
const graphviz='digraph { '+Array.from({length:18},(_,i)=>`n${i}[label="Stage ${i+1}"];`).join(' ')+Array.from({length:17},(_,i)=>`n${i}->n${i+1};`).join(' ')+' }';
const chart=JSON.stringify({data:{values:[{category:'A',value:2},{category:'B',value:4}]},mark:'bar',encoding:{x:{field:'category',type:'nominal'},y:{field:'value',type:'quantitative'}}});
const fixtures=[['mermaid',mermaid,'Mermaid flowchart.'],['graphviz',graphviz,'Graphviz diagram.'],['vega-lite',chart,'Vega-Lite chart.']];
test.beforeAll(async()=>{await mkdir(`${runtime}/reports`,{recursive:true});for(const [engine,body]of fixtures)await writeFile(`${runtime}/wiki/Browser-${engine}.md`,'Before\n\n```'+engine+'\n'+body+'\n```\n\nFollowing paragraph.\n');});
for(const [engine,,ready]of fixtures)test(`${engine} renders through isolated browser protocol`,async({page,browserName},info)=>{
 const logs=[];page.on('console',m=>logs.push({type:m.type(),text:m.text()}));page.on('pageerror',e=>logs.push({error:e.message}));
 await page.addInitScript(()=>{
  window.rendererEvents=[];
  addEventListener('securitypolicyviolation',e=>window.rendererEvents.push({time:performance.now(),csp:e.violatedDirective,blocked:e.blockedURI}));
  addEventListener('message',e=>window.rendererEvents.push({time:performance.now(),type:e.data?.type,origin:e.origin}));
  const descriptor=Object.getOwnPropertyDescriptor(MessagePort.prototype,'onmessage');
  Object.defineProperty(MessagePort.prototype,'onmessage',{...descriptor,set(handler){descriptor.set.call(this,handler&&function(e){window.rendererEvents.push({time:performance.now(),port:e.data?.type,status:e.data?.status,width:e.data?.width,height:e.data?.height});return handler.call(this,e);});}});
 });
 await page.goto('/accounts/login/');await page.getByLabel('Username').fill('slice');await page.getByLabel('Password').fill('synthetic-slice-browser-only');await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await page.goto(`/notes/Browser-${engine}.md`);await expect(page.locator('[data-editor-stage]')).toHaveAttribute('data-editor-state','ready');
 const status=page.locator('.lp-diagram-status');
 await expect.poll(async()=>await status.textContent(),{timeout:20000}).toMatch(/^(Mermaid flowchart\.|Graphviz diagram\.|Vega-Lite chart\.|Diagram unavailable;)/);
 const diagnostics={browserName,engine,status:await status.textContent(),events:await page.evaluate(()=>window.rendererEvents),logs};
 await info.attach('renderer-stages',{body:JSON.stringify(diagnostics),contentType:'application/json'});
 console.log(JSON.stringify(diagnostics));
 await page.screenshot({path:`${runtime}/reports/${engine}-browser-${browserName}.png`});
 await expect(status).toHaveText(ready);
 await expect(page.locator('.lp-diagram iframe')).toHaveAttribute('sandbox','allow-scripts');
});
