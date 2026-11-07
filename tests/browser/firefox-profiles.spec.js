import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {runtime} from './support/server.js';
import {firefoxRendererFixtures,measureActiveRenderer} from './support/firefox-renderers.js';
import {installMermaidDiagnostics} from './support/mermaid-diagnostics.js';

const fixture=firefoxRendererFixtures[0];
const source=`Before\n\n\`\`\`mermaid\n${fixture.source}\n\`\`\`\n\nAfter\n`;
// Retain all 32 stock-probe combinations; code/preview/clipping tests already
// assert the other engines' baseline geometry, source fidelity and sandbox.
test.beforeAll(async()=>{
 await mkdir(`${runtime}/reports`,{recursive:true});
 await writeFile(`${runtime}/wiki/FirefoxProfiles.md`,source);
});
 test('synthetic viewport, device scaling and child CSS zoom retain rendering',async({page,context,browser,browserName},info)=>{
  const profile=info.project.metadata.firefoxProfile;
  test.skip(!profile||browserName!=='firefox','Firefox profiles are selected by playwright.firefox.config.js');
  test.setTimeout(90000);
  await page.goto('/accounts/login/');
  await page.getByLabel('Username').fill('slice');
  await page.getByLabel('Password').fill('synthetic-slice-browser-only');
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  const results=[];
  try{
   for(const width of profile.widths)for(const cssZoom of [1,.9,.8,.7]){
    const probe=await context.newPage();
    const diagnostics=[];
    probe.on('console',message=>{
     if(message.text().startsWith('__synthetic_schema__')&&diagnostics.length<8)
      diagnostics.push(JSON.parse(message.text().slice('__synthetic_schema__'.length)));
    });
    try{
     await probe.setViewportSize({width,height:1000});
     await probe.addInitScript(zoom=>{
      if(window===top){
       // Deliberately stale parent messages must never become zoom evidence.
       window.rendererZoomMessages=[1,.8];
       return;
      }
      const apply=()=>{
       if(!document.documentElement)return false;
       document.documentElement.style.zoom=String(zoom);return true;
      };
      if(!apply()){
       const observer=new MutationObserver(()=>{if(apply())observer.disconnect();});
       observer.observe(document,{childList:true});
      }
     },cssZoom);
     await probe.addInitScript(()=>{window.recordMermaidDiagnostic=value=>console.debug('__synthetic_schema__'+JSON.stringify(value));});
     await probe.addInitScript(installMermaidDiagnostics);
     await probe.goto('/notes/FirefoxProfiles.md');
     const status=probe.locator('.lp-diagram-status'),iframe=probe.locator('.lp-diagram iframe');
     await expect(status).toHaveText(fixture.ready,{timeout:20000});
     await expect(iframe).toHaveAttribute('sandbox','allow-scripts');
     const parent=await probe.evaluate(()=>({cssZoom:Number(getComputedStyle(document.documentElement).zoom),scale:devicePixelRatio,viewport:innerWidth}));
     const measured=await measureActiveRenderer(iframe);
     const row={profile:profile.name,browser:browser.version(),requestedWidth:width,requestedChildCssZoom:cssZoom,
      browserPageZoom:'default-unmodified',parent,measured};
     results.push(row);
     await writeFile(`${runtime}/reports/firefox-${profile.name}.json`,JSON.stringify(results,null,2));
     await writeFile(`${runtime}/reports/firefox-${profile.name}-${width}-${cssZoom}-schema.json`,JSON.stringify(diagnostics));
     await probe.screenshot({path:`${runtime}/reports/firefox-${profile.name}-${width}-${cssZoom}.png`});
     expect(parent.cssZoom).toBe(1);
     expect(parent.viewport).toBe(width);
     expect(parent.scale).toBeCloseTo(profile.scale,3);
     expect(measured.cssZoom).toBeCloseTo(cssZoom,3);
     expect(measured.scale).toBeCloseTo(profile.scale,3);
     expect(measured.svg.right).toBeLessThanOrEqual(measured.viewport.width+2);
     expect(measured.svg.bottom).toBeLessThanOrEqual(measured.viewport.height+2);
     if(profile.name==='default'&&width===1180&&cssZoom===.7){
      // #90/#91: remount a renderer while stale parent values remain. Measure
      // the active DOM frame directly, including a value absent from messages.
      const retired=await iframe.elementHandle();
      await probe.getByRole('button',{name:'Edit Mermaid source',exact:true}).focus();
      await probe.keyboard.press('Enter');await expect(iframe).toHaveCount(0);
      expect(await probe.locator('[data-markdown-editor]').evaluate(el=>el.markdownEditor.getSource())).toBe(source);
      await probe.locator('[data-markdown-editor]').evaluate(el=>el.markdownEditor.view.dispatch({selection:{anchor:0}}));
      await expect(status).toHaveText(fixture.ready);
      expect(await retired.evaluate(el=>el.isConnected)).toBe(false);
      expect(await probe.evaluate(()=>window.rendererZoomMessages)).toEqual([1,.8]);
      expect((await measureActiveRenderer(iframe)).cssZoom).toBeCloseTo(.7,3);
      await probe.screenshot({path:`${runtime}/reports/firefox-profile-active-frame.png`});
     }
    }catch(error){
     await info.attach(`synthetic-schema-${width}-${cssZoom}`,{body:JSON.stringify(diagnostics),contentType:'application/json'});
     await probe.screenshot({path:`${runtime}/reports/firefox-${profile.name}-${width}-${cssZoom}-failure.png`}).catch(()=>{});
     throw error;
    }finally{await probe.close();}
   }
  }finally{
   await info.attach(`firefox-${profile.name}-measurements`,{body:JSON.stringify(results),contentType:'application/json'});
  }
 });
