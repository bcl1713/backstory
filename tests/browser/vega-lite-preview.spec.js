import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {runtime} from './support/server.js';
const source='Before\n\n```vega-lite\n{"data":{"values":[{"category":"A","value":2},{"category":"B","value":4},{"category":"C","value":3}]},"mark":"bar","encoding":{"x":{"field":"category","type":"nominal"},"y":{"field":"value","type":"quantitative"}}}\n```\n\nAfter\n\n'+('Further paragraph.\n\n'.repeat(25));
const host=page=>page.locator('[data-markdown-editor]');
async function open(page){await page.goto('/accounts/login/');await page.getByLabel('Username').fill('slice');await page.getByLabel('Password').fill('synthetic-slice-browser-only');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.goto('/notes/VegaLite.md');await expect(page.locator('[data-editor-stage]')).toHaveAttribute('data-editor-state','ready');await expect(host(page).getByText('Vega-Lite chart.',{exact:true})).toBeVisible();}
const reset=page=>host(page).evaluate(el=>el.markdownEditor.view.dispatch({selection:{anchor:0}}));
test.beforeAll(()=>writeFile(`${runtime}/wiki/VegaLite.md`,source));
for(const width of [390,1180])test(`VegaLite direct source editing and responsive rendering at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await open(page);
 await page.screenshot({path:`${runtime}/reports/vega-lite-preview-${width}.png`});
 for(let repeat=0;repeat<2;repeat++){
  const frame=host(page).locator('iframe');const box=await frame.boundingBox();
  if(width===390)await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);else await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
  await expect(frame).toHaveCount(0);
  expect(await host(page).evaluate(el=>el.markdownEditor.getSource())).toBe(source);
  expect(await host(page).evaluate(el=>el.markdownEditor.view.state.selection.main.head)).toBe(source.indexOf('```'));
  await reset(page);await expect(host(page).getByText('Vega-Lite chart.',{exact:true})).toBeVisible();
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('VegaLite keyboard source activation and server/no-JS fallback preserve source',async({page,browser})=>{
 await open(page);const edit=host(page).getByRole('button',{name:'Edit Vega-Lite source',exact:true});
 for(let i=0;i<30&&!await edit.evaluate(el=>el===document.activeElement);i++)await page.keyboard.press('Tab');
 await expect(edit).toBeFocused();expect(await edit.evaluate(el=>getComputedStyle(el).outlineStyle)).not.toBe('none');await page.keyboard.press('Enter');await expect(host(page).locator('iframe')).toHaveCount(0);expect(await host(page).evaluate(el=>el.markdownEditor.getSource())).toBe(source);
 await page.goto('/preview/VegaLite.md');await expect(page.getByText('Vega-Lite chart.',{exact:true})).toBeVisible();
 const context=await browser.newContext({javaScriptEnabled:false,storageState:await page.context().storageState()});const plain=await context.newPage();await plain.goto(page.url());await expect(plain.locator('pre code')).toContainText('values');await expect(plain.locator('iframe')).toHaveCount(0);await context.close();
});
for(const vim of [false,true])test(`${vim?'Vim':'arrow'} motion reveals VegaLite source`,async({page})=>{
 await open(page);await host(page).evaluate((el,v)=>el.markdownEditor.setVimEnabled(v),vim);await page.locator('.cm-content').focus();
 if(vim)await page.keyboard.type('gg');else await page.keyboard.press('Control+Home');
 await page.keyboard.press(vim?'j':'ArrowDown');await page.keyboard.press(vim?'j':'ArrowDown');
 await expect(host(page).locator('iframe')).toHaveCount(0);expect(await host(page).evaluate(el=>el.markdownEditor.getSource())).toBe(source);
});
test('touch scrolling a VegaLite surface does not enter source',async({page,context})=>{
 await page.setViewportSize({width:390,height:650});await open(page);const box=await host(page).locator('iframe').boundingBox();
 const cdp=await context.newCDPSession(page);const x=box.x+box.width/2,y=box.y+box.height/2;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
 for(let i=1;i<=6;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-i*12}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 expect(await host(page).evaluate(el=>el.markdownEditor.view.state.selection.main.head)).toBe(0);expect(await host(page).evaluate(el=>el.markdownEditor.getSource())).toBe(source);await cdp.detach();
});
test('Graphviz and Vega-Lite share two-frame capacity with unchanged mixed source',async({page})=>{
 await writeFile(`${runtime}/wiki/MixedCharts.md`,'Before\n\n```graphviz\ndigraph{a->b}\n```\n\n'+source.split('\n\n')[1]+'\n\n'+source.split('\n\n')[1]+'\n\nAfter');
 await page.setViewportSize({width:1180,height:1800});await open(page);await page.goto('/notes/MixedCharts.md');await expect(page.locator('[data-editor-stage]')).toHaveAttribute('data-editor-state','ready');
 await expect(host(page).locator('iframe')).toHaveCount(2);await expect(host(page).getByText('Two diagrams are already active. Show diagram to replace the oldest preview.',{exact:true})).toHaveCount(1);
 const before=await host(page).evaluate(el=>el.markdownEditor.getSource());const fallback=host(page).locator('.lp-diagram').filter({has:page.getByText('Two diagrams are already active.',{exact:false})});
 await fallback.getByRole('button',{name:/^Show (Graphviz diagram|Vega-Lite chart)$/}).click();await expect(host(page).locator('iframe')).toHaveCount(2);expect(await host(page).evaluate(el=>el.markdownEditor.getSource())).toBe(before);
});
test('mobile chart axis labels remain readable after responsive scaling',async({page})=>{
 await page.setViewportSize({width:390,height:900});await open(page);const child=page.frames().find(frame=>frame.url().endsWith('/renderers/vega-lite-frame/'));
 const box=await child.locator('.role-axis-label text').last().boundingBox();expect(box.height).toBeGreaterThanOrEqual(10);
});
