import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {runtime} from './support/server.js';
import {firefoxRendererFixtures} from './support/firefox-renderers.js';
const mermaid='flowchart TD\n'+Array.from({length:18},(_,i)=>`N${i}[Stage ${i+1}]`).join('\n')+'\n'+Array.from({length:17},(_,i)=>`N${i} --> N${i+1}`).join('\n');
const graphviz='digraph { '+Array.from({length:18},(_,i)=>`n${i}[label="Stage ${i+1}"];`).join(' ')+Array.from({length:17},(_,i)=>`n${i}->n${i+1};`).join(' ')+' }';
const chart=JSON.stringify({data:{values:[{category:'A',value:2},{category:'B',value:4}]},mark:'bar',encoding:{x:{field:'category',type:'nominal'},y:{field:'value',type:'quantitative'}}});
const branching='flowchart TD\nA[Review the synthetic service maintenance plan] --> B{Are the test prerequisites complete?}\nB -->|Yes| C[Continue with the scheduled maintenance procedure]\nB -->|No| D[Keep the current synthetic configuration unchanged]\nC --> E{Did the synthetic verification complete?}\nE -->|Yes| F[Update the demonstration record]\nE -->|No| G[Keep the previous demonstration record]';
const converging=firefoxRendererFixtures[0].source;
const fixtures=[['mermaid',mermaid,'Mermaid flowchart.'],['mermaid-tiny','flowchart TD\nA','Mermaid flowchart.'],['mermaid-branching',branching,'Mermaid flowchart.'],['mermaid-converging',converging,'Mermaid flowchart.'],['graphviz',graphviz,'Graphviz diagram.'],['graphviz-tiny','digraph { a; }','Graphviz diagram.'],['vega-lite',chart,'Vega-Lite chart.']];
test.beforeAll(async()=>{await mkdir(`${runtime}/reports`,{recursive:true});for(const [engine,body]of fixtures)await writeFile(`${runtime}/wiki/Browser-${engine}.md`,'Before\n\n```'+(engine.startsWith('mermaid-')?'mermaid':engine.startsWith('graphviz-')?'graphviz':engine)+'\n'+body+'\n```\n\nFollowing paragraph.\n');});
for(const [engine,,ready]of fixtures)test(`${engine} renders through isolated browser protocol`,async({page,browserName},info)=>{
 const logs=[],events=[],svg=[];page.on('console',m=>{const text=m.text();if(text.startsWith('__renderer_event__'))events.push(JSON.parse(text.slice(18)));else if(text.startsWith('__renderer_svg__'))svg.push(text.slice(16));else logs.push({type:m.type(),text});});page.on('pageerror',e=>logs.push({error:e.message}));
 await page.addInitScript(()=>{
  const record=value=>console.debug('__renderer_event__'+JSON.stringify({...value,child:parent!==window}));
  const parse=DOMParser.prototype.parseFromString;DOMParser.prototype.parseFromString=function(source,type){if(type==='image/svg+xml'&&source.length<=250000)console.debug('__renderer_svg__'+source);return parse.call(this,source,type);};
  addEventListener('securitypolicyviolation',e=>record({time:performance.now(),csp:e.violatedDirective,blocked:e.blockedURI}));
  addEventListener('message',e=>record({time:performance.now(),type:e.data?.type,origin:e.origin}));
  const descriptor=Object.getOwnPropertyDescriptor(MessagePort.prototype,'onmessage');
  Object.defineProperty(MessagePort.prototype,'onmessage',{...descriptor,set(handler){descriptor.set.call(this,handler&&function(e){record({time:performance.now(),port:e.data?.type,status:e.data?.status,width:e.data?.width,height:e.data?.height});return handler.call(this,e);});}});
 });
 await page.goto('/accounts/login/');await page.getByLabel('Username').fill('slice');await page.getByLabel('Password').fill('synthetic-slice-browser-only');await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await page.goto(`/notes/Browser-${engine}.md`);await expect(page.locator('[data-editor-stage]')).toHaveAttribute('data-editor-state','ready');
 const status=page.locator('.lp-diagram-status');
 await expect.poll(async()=>await status.textContent(),{timeout:20000}).toMatch(/^(Mermaid flowchart\.|Graphviz diagram\.|Vega-Lite chart\.|Diagram unavailable;)/);
 const diagnostics={browserName,engine,status:await status.textContent(),events,logs};
 if(await status.textContent()!==ready)await info.attach('synthetic-renderer-svg',{body:JSON.stringify(svg),contentType:'application/json'});
 await info.attach('renderer-stages',{body:JSON.stringify(diagnostics),contentType:'application/json'});
 console.log(JSON.stringify(diagnostics));
 await page.screenshot({path:`${runtime}/reports/${engine}-browser-${browserName}.png`});
 await expect(status).toHaveText(ready);
 const iframe=page.locator('.lp-diagram iframe');await expect(iframe).toHaveAttribute('sandbox','allow-scripts');
 const identity=await iframe.elementHandle(),frame=await identity.contentFrame();
 for(const width of [390,1180]){
  await page.setViewportSize({width,height:1000});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const geometry=await frame.evaluate(()=>{const svg=document.querySelector('#diagram > svg'),b=svg.getBoundingClientRect();return{width:innerWidth,height:innerHeight,right:b.right,bottom:b.bottom,labels:[...svg.querySelectorAll('text')].map(el=>{const r=el.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom};})};});
  expect(geometry.right).toBeLessThanOrEqual(geometry.width+2);expect(geometry.bottom).toBeLessThanOrEqual(geometry.height+2);
  for(const label of geometry.labels){expect(label.left).toBeGreaterThanOrEqual(-2);expect(label.right).toBeLessThanOrEqual(geometry.width+2);expect(label.top).toBeGreaterThanOrEqual(-2);expect(label.bottom).toBeLessThanOrEqual(geometry.height+2);}
  expect(await identity.evaluate(el=>el.isConnected)).toBe(true);
  expect(await iframe.evaluate(el=>{const host=el.closest('.lp-diagram');return host.scrollWidth-host.clientWidth;})).toBeLessThanOrEqual(1);
  await page.screenshot({path:`${runtime}/reports/${engine}-${width}-browser-${browserName}.png`});
 }
 const host=page.locator('[data-markdown-editor]'),original=await host.evaluate(el=>el.markdownEditor.getSource());
 await page.getByRole('button',{name:/Edit .* source/}).focus();await page.keyboard.press('Enter');await expect(iframe).toHaveCount(0);
 expect(await host.evaluate(el=>el.markdownEditor.getSource())).toBe(original);
 await host.evaluate(el=>el.markdownEditor.view.dispatch({selection:{anchor:0}}));await expect(status).toHaveText(ready);
});
