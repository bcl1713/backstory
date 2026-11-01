import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {browserOrigin,runtime} from './support/server.js';
import {expireSession} from './support/session.js';
import {installMermaidDiagnostics} from './support/mermaid-diagnostics.js';
const manifest=JSON.parse(readFileSync(new URL('../../static/renderers/manifest.json',import.meta.url)));
async function login(page){
 await page.goto('/accounts/login/');await page.getByLabel('Username').fill('slice');await page.getByLabel('Password').fill('synthetic-slice-browser-only');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.goto('/health/');
}
async function render(page,source){
 return page.evaluate(async source=>{
  const {createMermaidFrame}=await import('/static/src/mermaid-frame-parent.js');
  const host=document.createElement('section'),button=document.createElement('button');button.textContent='Show diagram source';button.onclick=()=>window.diagramHandle?.destroy();host.append(button);document.body.append(host);
  window.diagramStatus='pending';window.diagramHandle=createMermaidFrame(host,source,{onStatus:status=>window.diagramStatus=status,onSize:size=>{window.diagramHandle.frame.style.width=`${size.width}px`;window.diagramHandle.frame.style.height=`${size.height}px`;}});
 },source);
}
// These exercise the actual middleware/static boundary, not a mocked renderer.
test('authenticated opaque frame renders fixed classic bundle, frame-local SVG and no unplanned requests',async({page})=>{
 await login(page);const requests=[],violations=[],responses=[];
 page.on('response',r=>responses.push(r));
 const receiptStart=readFileSync(`${runtime}/request-receipts.jsonl`,'utf8').length;
 await page.exposeFunction('recordRendererViolation',v=>violations.push(v));
 await page.addInitScript(()=>addEventListener('securitypolicyviolation',e=>window.recordRendererViolation?.({directive:e.effectiveDirective,blocked:e.blockedURI})));
 page.on('request',r=>requests.push(r.url()));
 // CI-only evidence from this synthetic fixture. No application logging or
 // exception disclosure is added, and the production policy remains enforced.
 const diagnostics=[];
 await page.exposeFunction('recordMermaidDiagnostic',value=>{if(diagnostics.length<8)diagnostics.push(value);});
 await page.addInitScript(installMermaidDiagnostics);
 await render(page,'flowchart LR\nA[Start] --> B{Ready?}\nB -->|Yes| C((Done))\nB -.-> D(Retry)');
 try{await expect.poll(()=>page.evaluate(()=>window.diagramStatus)).toBe('ok');}
 finally{await test.info().attach('mermaid-renderer-diagnostic.json',{body:JSON.stringify(diagnostics,null,2),contentType:'application/json'});}
 const frame=page.frameLocator('iframe');await expect(frame.locator('svg')).toBeVisible();await expect(page.locator('svg')).toHaveCount(0);
 await expect(page.locator('iframe')).toHaveAttribute('sandbox','allow-scripts');
 const child=page.frames().find(f=>f.url().endsWith('/renderers/mermaid-frame/'));
 expect(await child.evaluate(()=>{let denied=false;try{void parent.document.body;}catch{denied=true;}return{origin:self.origin,denied};})).toEqual({origin:'null',denied:true});
 expect(await child.evaluate(()=>{try{localStorage.getItem('x');return false;}catch{return true;}})).toBe(true);
 await expect(frame.locator('svg a,svg image,svg foreignObject,svg script')).toHaveCount(0);
 const bootstrap=frame.locator('script');await expect(bootstrap).toHaveCount(1);
 await expect(bootstrap).toHaveAttribute('src',`/static/renderers/${manifest.frame}`);
 const bootstrapNonce=await bootstrap.evaluate(script=>script.nonce);expect(bootstrapNonce).toMatch(/^[\w-]+$/);
 const allowed=new Set(['/static/src/mermaid-frame-parent.js','/static/src/mermaid-model.js','/renderers/mermaid-frame/',`/static/renderers/${manifest.frame}`]);
 expect(requests.filter(url=>{const parsed=new URL(url);return parsed.origin!==browserOrigin||parsed.search||!allowed.has(parsed.pathname);})).toEqual([]);
 const receipts=readFileSync(`${runtime}/request-receipts.jsonl`,'utf8').slice(receiptStart).trim().split('\n').filter(Boolean).map(line=>JSON.parse(line));
 expect(receipts.filter(r=>r.method!=='GET'||!allowed.has(r.path))).toEqual([]);
 expect(receipts.some(r=>r.path===`/static/renderers/${manifest.frame}`)).toBe(true);
 const bundleResponse=responses.find(r=>new URL(r.url()).pathname===`/static/renderers/${manifest.frame}`);
 expect(bundleResponse.status()).toBe(200);expect(bundleResponse.headers()['content-type']).toMatch(/javascript/);expect(bundleResponse.headers()['x-content-type-options']).toBe('nosniff');
 expect(bundleResponse.headers()['cross-origin-resource-policy']).not.toBe('same-origin');expect(bundleResponse.headers()['cross-origin-embedder-policy']).not.toBe('require-corp');
 const shellResponse=responses.find(r=>new URL(r.url()).pathname==='/renderers/mermaid-frame/');
 expect(shellResponse.headers()['x-frame-options']).toBeUndefined();expect(shellResponse.headers()['content-security-policy']).toContain('sandbox allow-scripts');
 expect(shellResponse.headers()['content-security-policy']).toContain(`script-src 'nonce-${bootstrapNonce}'`);
 expect(shellResponse.headers()['access-control-allow-origin']).toBeUndefined();
 expect(violations).toEqual([]);
 const svg=await frame.locator('svg').boundingBox();expect(svg.width).toBeGreaterThan(100);expect(svg.height).toBeGreaterThan(20);
 await page.getByRole('button',{name:'Show diagram source'}).click();await expect(page.locator('iframe')).toHaveCount(0);
});
test('unsupported source chooses no network destination and allocates no child',async({page})=>{
 await login(page);const requests=[];page.on('request',r=>requests.push(r.url()));
 for(const source of ['flowchart TD\nA@{ img: "https://example.invalid/tracker" }','flowchart TD\nA[<img src=/health/?private-canary>]','flowchart TD\nclick A "/health/?private-canary"','%%{init:{themeCSS:"@import url(/health/?private-canary)"}}%%\nflowchart TD\nA-->B','flowchart TD\nA[&lt;img src=x&gt;]']){
  await expect(render(page,source)).rejects.toThrow('unsupported_diagram');
 }
 await expect(page.locator('iframe')).toHaveCount(0);
 expect(requests.every(url=>new URL(url).pathname.startsWith('/static/src/mermaid-'))).toBe(true);
});
test('unexpected second navigation destroys frame without resending source',async({page})=>{
 await login(page);await render(page,'flowchart TD\nA-->B');await expect.poll(()=>page.evaluate(()=>window.diagramStatus)).toBe('ok');
 await page.evaluate(()=>window.diagramHandle.frame.src='/health/');
 await expect.poll(()=>page.evaluate(()=>window.diagramStatus)).toBe('error');await expect(page.locator('iframe')).toHaveCount(0);
});
test('expired and missing sessions retain denied login policy and source fallback',async({page,context,browser})=>{
 await login(page);await expireSession(context);await render(page,'flowchart TD\nA-->B');await expect.poll(()=>page.evaluate(()=>window.diagramStatus),{timeout:15000}).toBe('error');
 const anonymous=await browser.newContext();const response=await anonymous.request.get(`${browserOrigin}/renderers/mermaid-frame/`,{maxRedirects:0});expect(response.status()).toBe(302);expect(response.headers()['x-frame-options']).toBe('DENY');await anonymous.close();
});
test('positive SVG reconstruction rejects active/resource markup and discards returned CSS',async({page})=>{
 await login(page);const requests=[];page.on('request',r=>requests.push(r.url()));
 const result=await page.evaluate(async()=>{
  const{safeSvg}=await import('/static/src/mermaid-svg.js');
  const rejected=[];
  for(const body of ['<script>alert(1)</script>','<image href="/health/?private-canary"/>','<a href="https://example.invalid">x</a>','<foreignObject><div xmlns="http://www.w3.org/1999/xhtml">x</div></foreignObject>','<path onclick="alert(1)"/>','<use href="#other"/>','<path marker-end="url(/health/?private-canary)"/>']){
   try{safeSvg(`<svg xmlns="http://www.w3.org/2000/svg">${body}</svg>`,document);rejected.push(false);}catch{rejected.push(true);}
  }
  const clean=safeSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><style>@import url(/health/?private-canary);</style><rect x="0" y="0" width="20" height="20" style="fill:url(/health/?private-canary)"/></svg>',document);
  return{rejected,css:clean.querySelector('style').textContent,rectStyle:clean.querySelector('rect').getAttribute('style')};
 });
 expect(result.rejected).toEqual(Array(7).fill(true));expect(result.css).not.toContain('url(');expect(result.rectStyle).toBe(null);
 expect(requests.every(url=>new URL(url).pathname.startsWith('/static/src/mermaid-'))).toBe(true);
});
test('bounded worst-case fixtures render or fail safely with responsive fallback budgets',async({page})=>{
 await login(page);
 const source='flowchart LR\n'+Array.from({length:32},(_,i)=>`A${i}[Node ${i}]`).join('\n')+'\n'+Array.from({length:48},(_,i)=>`A${i%32} --> A${(i*7+1)%32}`).join('\n');
 await render(page,source);
 await expect.poll(()=>page.evaluate(()=>window.diagramStatus),{timeout:15000}).toBe('ok');
 await page.evaluate(()=>window.diagramHandle.destroy());
 await expect(render(page,'flowchart TD\n'+'A --> B\n'.repeat(49))).rejects.toThrow('unsupported_diagram');
});
