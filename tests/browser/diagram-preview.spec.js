import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {runtime} from './support/server.js';
import {revealChrome} from './support/chrome.js';
import {expectDiagramGeometry} from './support/diagram-geometry.js';
const fence='```mermaid\nflowchart TD\nA[Start] --> B{Ready?}\nB -->|Yes| C((Done))\nB -.-> D(Retry)\n```';
const source='Before\n\n'+fence+'\n\n```mermaid\nsequenceDiagram\nA->>B:Hi\n```\n\n```mermaid\nflowchart TD\nA[<img src=/diagram-private-canary>]\n```\n\nAfter\n';
const motion='Before\n\n'+fence+'\n\nAfter';
const host=page=>page.locator('[data-markdown-editor]');
const read=page=>host(page).evaluate(el=>el.markdownEditor.getSource());
const select=(page,anchor,head=anchor)=>host(page).evaluate((el,selection)=>el.markdownEditor.view.dispatch({selection}),{anchor,head});
async function open(page,note='Diagrams'){
 await page.goto('/accounts/login/');await page.getByLabel('Username').fill('slice');await page.getByLabel('Password').fill('synthetic-slice-browser-only');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.goto(`/notes/${note}.md`);await expect(page.locator('[data-editor-stage]')).toHaveAttribute('data-editor-state','ready');
}
test.beforeAll(async()=>{
 await mkdir(`${runtime}/reports`,{recursive:true});
 for(const[note,text]of Object.entries({Diagrams:source,DiagramMotion:motion,DiagramWide:motion.replace('flowchart TD','flowchart LR'),DiagramMany:'Before\n\n'+Array.from({length:5},(_,i)=>'```mermaid\nflowchart LR\nA[Diagram '+i+']-->B\n```').join('\n\n')+'\n\nAfter\n\n'+('Distant paragraph.\n\n'.repeat(150))}))await writeFile(`${runtime}/wiki/${note}.md`,text);
});
test('explicit Mermaid widgets use only fixed local frame assets, retain unsupported source and never save',async({page})=>{
 const requests=[],effects=[];page.on('request',r=>{requests.push(r.url());if(r.method()==='POST'&&/\/(save|format|draft)/.test(r.url()))effects.push(r.url());});
 await open(page);await expect(host(page).locator('iframe')).toHaveCount(1);
 await expect(host(page).locator('iframe')).toHaveAttribute('sandbox','allow-scripts');
 await expect(host(page).getByText('Mermaid flowchart.',{exact:true})).toBeVisible();
 await expect(host(page).getByText('Unsupported Mermaid syntax; source retained.',{exact:false})).toHaveCount(2);
 expect(requests.filter(url=>new URL(url).hostname!=='127.0.0.1')).toEqual([]);expect(requests.filter(url=>url.includes('diagram-private-canary'))).toEqual([]);
 expect(requests.filter(url=>new URL(url).pathname==='/renderers/mermaid-frame/').every(url=>!new URL(url).search)).toBe(true);
 expect(effects).toEqual([]);expect(await read(page)).toBe(source);await expect(page.locator('[data-editor-status]')).toHaveText('Unchanged');
});
test('source entry, repeated selection, raw/plain switches, edit/undo and navigation clean up frames',async({page})=>{
 await open(page,'DiagramMotion');await expect(host(page).getByText('Mermaid flowchart.',{exact:true})).toBeVisible();
 for(let i=0;i<3;i++){
  await host(page).getByRole('button',{name:'Edit Mermaid source',exact:true}).click();await expect(host(page).locator('iframe')).toHaveCount(0);expect(await read(page)).toBe(motion);
  await select(page,0);await expect(host(page).getByText('Mermaid flowchart.',{exact:true})).toBeVisible();
  await select(page,0,motion.length);await expect(host(page).locator('.lp-diagram')).toHaveCount(0);await select(page,0);await expect(host(page).locator('iframe')).toHaveCount(1);
 }
 await host(page).evaluate(el=>el.markdownEditor.setVimEnabled(false));await page.locator('.cm-content').focus();await page.keyboard.type('X');await page.keyboard.press('Control+z');expect(await read(page)).toBe(motion);
 for(const mode of ['Raw source','Plain text fallback','Live preview']){
  await revealChrome(page);await page.getByRole('button',{name:mode,exact:true}).click();if(mode!=='Live preview')await expect(host(page).locator('iframe')).toHaveCount(0);expect(await read(page)).toBe(motion);
 }
 await page.goto('/notes/Other.md');await expect(page.locator('iframe')).toHaveCount(0);await page.goBack();await expect(host(page).getByText('Mermaid flowchart.',{exact:true})).toBeVisible();expect(await read(page)).toBe(motion);
});
for(const vim of [false,true])for(const direction of ['down','up'])test(`${vim?'Vim':'arrows'} reveals tall Mermaid fence source ${direction}`,async({page})=>{
 await open(page,'DiagramMotion');await expect(host(page).getByText('Mermaid flowchart.',{exact:true})).toBeVisible();await host(page).evaluate((el,v)=>el.markdownEditor.setVimEnabled(v),vim);await page.locator('.cm-content').focus();
 if(vim)await page.keyboard.type(direction==='down'?'gg':'G');else await page.keyboard.press(direction==='down'?'Control+Home':'Control+End');
 const key=vim?(direction==='down'?'j':'k'):(direction==='down'?'ArrowDown':'ArrowUp');await page.keyboard.press(key);await page.keyboard.press(key);
 expect(await host(page).evaluate(el=>{const s=el.markdownEditor.view.state;return s.doc.lineAt(s.selection.main.head).number;})).toBe(direction==='down'?3:motion.split('\n').length-2);
 await expect(host(page).locator('iframe')).toHaveCount(0);expect(await read(page)).toBe(motion);
});
test('capacity fallback replaces an active frame regardless of intersection order; scrolling remounts at most two',async({page})=>{
 await page.setViewportSize({width:1180,height:2600});await open(page,'DiagramMany');
 const diagrams=host(page).locator('.lp-diagram'),ready=host(page).getByText('Mermaid flowchart.',{exact:true});
 const capacity=diagrams.filter({has:page.getByText('Two diagrams are already active. Show diagram to replace the oldest preview.',{exact:true})});
 await expect(ready).toHaveCount(2);await expect(capacity).toHaveCount(3);await expect(host(page).locator('iframe')).toHaveCount(2);
 // IntersectionObserver delivery need not allocate frames in source order (#68).
 // Keep a source-stable target after its capacity status/Show button disappear.
 const original=await read(page),targetSource=await capacity.first().locator('.lp-diagram-source').textContent();
 const target=diagrams.filter({has:page.locator('.lp-diagram-source').filter({hasText:targetSource})});
 await expect(target).toHaveCount(1);await target.scrollIntoViewIfNeeded();
 const initialFrames=await host(page).locator('iframe').elementHandles();
 await target.getByRole('button',{name:'Show Mermaid diagram',exact:true}).click();await expect(target.getByText('Mermaid flowchart.',{exact:true})).toBeVisible();
 await expect(host(page).locator('iframe')).toHaveCount(2);await expect(ready).toHaveCount(2);await expect(host(page).getByText('Diagram paused; source retained.',{exact:false})).toHaveCount(1);
 await expect.poll(async()=>{let connected=0;for(const frame of initialFrames)if(await frame.evaluate(el=>el.isConnected))connected++;return connected;}).toBe(1);
 for(let i=0;i<3;i++){
  await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));await expect(host(page).locator('iframe')).toHaveCount(0);await page.evaluate(()=>scrollTo(0,0));
  await expect(host(page).locator('iframe')).toHaveCount(2);await expect(ready).toHaveCount(2);
 }
 expect(await read(page)).toBe(original);
});
test('GET and draft preview hydrate inert placeholders; showing source releases a frame',async({page})=>{
 await open(page,'DiagramMotion');await page.goto('/preview/DiagramMotion.md');const preview=page.locator('[aria-label="Markdown preview"]');await expect(preview.getByText('Mermaid flowchart.',{exact:true})).toBeVisible();
 await preview.getByRole('button',{name:'Show Mermaid source',exact:true}).click();await expect(preview.locator('iframe')).toHaveCount(0);await expect(preview.locator('code')).toContainText('flowchart TD');
 await preview.getByRole('button',{name:'Show Mermaid diagram',exact:true}).click();await expect(preview.locator('iframe')).toHaveCount(1);
 const response=await page.request.post('/preview/DiagramMotion.md',{data:{source:fence},headers:{'X-CSRFToken':(await page.context().cookies()).find(c=>c.name==='csrftoken').value}});const draft=await response.json();expect(draft.html).toContain('data-mermaid-source');expect(draft.html).not.toContain('<iframe');
 await preview.evaluate((el,html)=>{el.innerHTML=html;window.backstoryMermaidPreview.hydrate(el);},draft.html);await expect(preview.getByText('Mermaid flowchart.',{exact:true})).toBeVisible();await page.goto('/notes/DiagramMotion.md');expect(await read(page)).toBe(motion);
});
test('disabled UI does not allocate frames; frame failures retain source and do not retry on selection',async({page})=>{
 await page.route('**/notes/DiagramMotion.md',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('data-mermaid-enabled="true"','data-mermaid-enabled="false"')});});
 await open(page,'DiagramMotion');await expect(host(page).locator('iframe')).toHaveCount(0);expect(await read(page)).toBe(motion);await page.unroute('**/notes/DiagramMotion.md');
 let attempts=0;await page.route('**/renderers/mermaid-frame/',route=>{attempts++;return route.fulfill({status:503,body:'Unavailable'});});await page.reload();await expect(host(page).getByText('Diagram unavailable; source retained.',{exact:false})).toBeVisible({timeout:15000});
 for(let i=0;i<3;i++){await select(page,motion.indexOf('```'));await select(page,0);}await expect(host(page).locator('iframe')).toHaveCount(0);expect(attempts).toBe(1);expect(await read(page)).toBe(motion);
});
for(const width of [1180,390])test(`Mermaid editor and preview fit ${width}px with screenshot evidence`,async({page})=>{
 await page.setViewportSize({width,height:900});await open(page,'DiagramMotion');await expect(host(page).getByText('Mermaid flowchart.',{exact:true})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await expectDiagramGeometry(host(page).locator('iframe'));await page.screenshot({path:`${runtime}/reports/mermaid-${width}.png`,fullPage:true});await page.goto('/preview/DiagramMotion.md');await expect(page.getByText('Mermaid flowchart.',{exact:true})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expectDiagramGeometry(page.locator('iframe'));await page.screenshot({path:`${runtime}/reports/mermaid-${width}-preview.png`,fullPage:true});
});
for(const direction of ['down','up'])test(`Vim counts and delete/undo preserve Mermaid fence source ${direction}`,async({page})=>{
 await open(page,'DiagramMotion');await expect(host(page).getByText('Mermaid flowchart.',{exact:true})).toBeVisible();await host(page).evaluate(el=>el.markdownEditor.setVimEnabled(true));await page.locator('.cm-content').focus();
 const edge=direction==='down'?'gg':'G',key=direction==='down'?'j':'k';await page.keyboard.type(edge+'2'+key);
 expect(await host(page).evaluate(el=>{const s=el.markdownEditor.view.state;return s.doc.lineAt(s.selection.main.head).number;})).toBe(direction==='down'?3:motion.split('\n').length-2);
 await page.keyboard.type(edge+'d4'+key);expect(await read(page)).not.toBe(motion);await page.keyboard.type('u');expect(await read(page)).toBe(motion);
});
test('delayed frame bootstrap cannot revive edited or raw-mode diagram widgets',async({page})=>{
 let started,release;const waiting=new Promise(resolve=>started=resolve),gate=new Promise(resolve=>release=resolve);
 await page.route('**/renderers/mermaid-frame/',async route=>{const response=await route.fetch();started();await gate;try{await route.fulfill({response});}catch{/* Removed frame cancels its request. */}});
 await open(page,'DiagramMotion');await waiting;
 await host(page).evaluate(el=>el.markdownEditor.setSource('Replacement\n\nNo diagram.'));await select(page,3);release();await expect(host(page).locator('.lp-diagram')).toHaveCount(0);expect(await read(page)).toBe('Replacement\n\nNo diagram.');expect(await host(page).evaluate(el=>el.markdownEditor.view.state.selection.main.head)).toBe(3);
});
test('explicit Format refuses Mermaid fence rewrites without changing stored or current source',async({page})=>{
 await open(page,'DiagramMotion');const edited=motion.replaceAll('```','~~~~');await host(page).evaluate((el,text)=>el.markdownEditor.setSource(text),edited);await revealChrome(page);await page.locator('[data-format]').click();
 await expect(page.locator('[data-diagnostics]')).toContainText('Formatting would change Mermaid source');await expect(page.locator('[data-format-proposal]')).not.toBeVisible();expect(await read(page)).toBe(edited);
 expect((await page.request.get('/source/DiagramMotion.md')).status()).toBe(200);expect(await(await page.request.get('/source/DiagramMotion.md')).text()).toBe(motion);
});
test('replacing a full 32-diagram draft and immediately hydrating registers the new generation',async({page})=>{
 await open(page,'DiagramMotion');await page.goto('/preview/DiagramMotion.md');
 const response=await page.request.post('/preview/DiagramMotion.md',{data:{source:(fence+'\n\n').repeat(32)},headers:{'X-CSRFToken':(await page.context().cookies()).find(c=>c.name==='csrftoken').value}});
 const draft=await response.json();const preview=page.locator('[aria-label="Markdown preview"]');
 await preview.evaluate((el,html)=>{
  // Both replacements are synchronous: MutationObserver cleanup has not run.
  el.innerHTML=html;window.backstoryMermaidPreview.hydrate(el);
  el.innerHTML=html;window.backstoryMermaidPreview.hydrate(el);
 },draft.html);
 await expect(preview.locator('.lp-diagram')).toHaveCount(32);
 await expect(preview.getByText('Mermaid flowchart.',{exact:true}).first()).toBeVisible();
 expect(await preview.locator('iframe').count()).toBeLessThanOrEqual(2);
});

for(const preview of [false,true])test(`Mermaid natural sizing survives desktop/mobile resize without rerender (${preview?'preview':'editor'})`,async({page})=>{
 const loads=[];page.on('request',request=>{if(new URL(request.url()).pathname==='/renderers/mermaid-frame/')loads.push(request.url());});
 await page.setViewportSize({width:1180,height:1000});await open(page,'DiagramWide');if(preview)await page.goto('/preview/DiagramWide.md');
 await expect(page.getByText('Mermaid flowchart.',{exact:true})).toBeVisible();const iframe=page.locator('iframe'),initial=await expectDiagramGeometry(iframe),count=loads.length;
 expect(initial.parentWidth).toBeGreaterThan(400);
 for(const width of [390,1180,390,1180]){
  await page.setViewportSize({width,height:1000});
  await expect.poll(async()=>{const box=await iframe.boundingBox();return width===390?box.width<390:Math.abs(box.width-initial.parentWidth)<2;}).toBe(true);
  const geometry=await expectDiagramGeometry(iframe);if(width===390)expect(geometry.width).toBeLessThan(initial.width);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 expect(loads.length).toBe(count);await page.screenshot({path:`${runtime}/reports/mermaid-resize-${preview?'preview':'editor'}.png`,fullPage:true});
});

test('removing a successfully hydrated preview disconnects its owned resize observer',async({page})=>{
 await page.addInitScript(()=>{
  const Native=window.ResizeObserver,observed=new Map();
  window.ResizeObserver=class extends Native{
   constructor(callback){super(callback);observed.set(this,new Set());}
   observe(target,options){super.observe(target,options);observed.get(this).add(target);}
   unobserve(target){super.unobserve(target);observed.get(this).delete(target);}
   disconnect(){super.disconnect();observed.get(this).clear();}
  };
  window.mermaidResizeCount=()=>[...observed.values()].reduce((n,targets)=>n+[...targets].filter(el=>el.matches('iframe[title="Mermaid flowchart"]')).length,0);
 });
 await open(page,'DiagramMotion');await page.goto('/preview/DiagramMotion.md');await expect(page.getByText('Mermaid flowchart.',{exact:true})).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>window.mermaidResizeCount())).toBe(1);
 await page.locator('[aria-label="Markdown preview"]').evaluate(el=>el.replaceChildren());
 await expect.poll(()=>page.evaluate(()=>window.mermaidResizeCount())).toBe(0);await expect(page.locator('iframe')).toHaveCount(0);
});
