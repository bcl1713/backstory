import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {runtime} from './support/server.js';
const samples={mermaid:'flowchart TD\nA[Diagnostic sample] --> B[Done]',graphviz:'digraph { a -> b; }','vega-lite':JSON.stringify({data:{values:[{category:'A',value:2}]},mark:'bar',encoding:{x:{field:'category',type:'nominal'},y:{field:'value',type:'quantitative'}}})};
const sourceFor=engine=>'Before\n\n```'+engine+'\n'+samples[engine]+'\n```\n\nAfter';
test.beforeAll(async()=>{await mkdir(`${runtime}/reports`,{recursive:true});for(const engine of Object.keys(samples))await writeFile(`${runtime}/wiki/DiagramDiagnostics-${engine}.md`,sourceFor(engine));});
for(const engine of Object.keys(samples))for(const width of [390,1180])for(const failure of ['hello','sanitize'])test(`${engine} fixed ${failure} fallback at ${width}px retains keyboard source entry and cached detail`,async({page,browserName})=>{
 const source=sourceFor(engine);
 await page.setViewportSize({width,height:1000});
 if(failure==='hello')await page.route(`**/renderers/${engine}-frame/`,async route=>{const response=await route.fetch();await route.fulfill({response,body:'<!doctype html><body></body>'});});
 else await page.addInitScript(()=>{if(parent===window)return;const parse=DOMParser.prototype.parseFromString;DOMParser.prototype.parseFromString=function(value,type){if(type==='image/svg+xml')throw Error('PRIVATE_EXCEPTION_CANARY https://private.invalid');return parse.call(this,value,type);};});
 await page.goto('/accounts/login/');await page.getByLabel('Username').fill('slice');await page.getByLabel('Password').fill('synthetic-slice-browser-only');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.goto(`/notes/DiagramDiagnostics-${engine}.md`);
 const status=page.locator('.lp-diagram-status'),host=page.locator('[data-markdown-editor]');
 await expect(status).toContainText(`Diagnostic ${failure}:`,{timeout:15000});await expect(status).toContainText('source retained');expect(await status.textContent()).not.toContain('PRIVATE_EXCEPTION_CANARY');expect(await status.textContent()).not.toContain('https://');await expect(page.locator('.lp-diagram iframe')).toHaveCount(0);
 await page.screenshot({path:`${runtime}/reports/diagnostic-${engine}-${failure}-${width}-${browserName}.png`});
 await page.getByRole('button',{name:`Edit ${engine==='mermaid'?'Mermaid':engine==='graphviz'?'Graphviz':'Vega-Lite'} source`,exact:true}).focus();await page.keyboard.press('Enter');expect(await host.evaluate(el=>el.markdownEditor.getSource())).toBe(source);
 await host.evaluate(el=>el.markdownEditor.view.dispatch({selection:{anchor:0}}));await expect(status).toContainText(`Diagnostic ${failure}:`);expect(await host.evaluate(el=>el.markdownEditor.getSource())).toBe(source);
});
