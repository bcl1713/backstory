import {test, expect} from '@playwright/test';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {runtime} from './support/server.js';
import {settleEditorWithClock} from './support/editor-ready.js';
const original='# Toolbar upload\n\nSaved source.\n';
const draft='# Toolbar upload\r\n\r\nUnsaved source stays here.\r\n';
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAFElEQVR4nGN06TjDAANMDEgANwcAUCwBoBbl4KYAAAAASUVORK5CYII=','base64');
const host=page=>page.locator('[data-markdown-editor]');
const source=page=>host(page).evaluate(el=>el.markdownEditor.getSource());
for(const width of [360,390,1180])test(`persistent upload button preserves modal and unsaved draft at ${width}px`,async({page})=>{
 await mkdir(`${runtime}/wiki/assets`,{recursive:true});
 await writeFile(`${runtime}/wiki/ToolbarUpload.md`,original);
 await page.setViewportSize({width,height:900});
 await page.goto('/accounts/login/');await page.getByLabel('Username').fill('slice');await page.getByLabel('Password').fill('synthetic-slice-browser-only');await page.getByRole('button',{name:'Sign in',exact:true}).click();
 const now=new Date('2026-11-01T12:00:00Z');await page.clock.install({time:now});await page.clock.pauseAt(new Date(now.getTime()+1000));
 await page.goto('/notes/ToolbarUpload.md');await settleEditorWithClock(page);
 const toolbar=page.locator('.persistent-actions'),trigger=toolbar.getByRole('button',{name:'Upload image',exact:true});
 await expect(trigger).toBeVisible();await expect(toolbar.locator('button')).toHaveText(['Menu','Save','Upload image']);
 await expect(page.getByRole('navigation',{name:'Main',exact:true})).toBeHidden();
 const boxes=await toolbar.locator('button').evaluateAll(buttons=>buttons.map(button=>{const b=button.getBoundingClientRect();return{x:b.x,y:b.y,right:b.right,height:b.height};}));
 expect(boxes.every(b=>b.x>=0&&b.right<=width&&b.height>=44)).toBe(true);expect(new Set(boxes.map(b=>b.y)).size).toBe(1);
 await host(page).evaluate((el,value)=>el.markdownEditor.setSource(value),draft);await page.clock.runFor(64);
 await page.screenshot({path:`${runtime}/reports/image-upload-toolbar-${width}.png`});
 const dialog=page.getByRole('dialog',{name:'Upload image'});
 for(const close of ['Escape','Close']){
  await toolbar.getByRole('button',{name:'Save',exact:true}).focus();await page.keyboard.press('Tab');await expect(trigger).toBeFocused();
  expect(await trigger.evaluate(el=>getComputedStyle(el).outlineStyle)).not.toBe('none');await page.keyboard.press('Enter');await expect(dialog).toBeVisible();
  expect(await source(page)).toBe(draft);
  if(close==='Escape')await page.keyboard.press('Escape');else await dialog.getByRole('button',{name:'Close',exact:true}).click();
  await expect(dialog).toBeHidden();await expect(trigger).toBeFocused();expect(await source(page)).toBe(draft);
 }
 await trigger.click();await dialog.getByLabel('Image file').setInputFiles({name:'sample.png',mimeType:'image/png',buffer:png});await dialog.getByRole('button',{name:'Upload',exact:true}).click();await expect(dialog.getByRole('status')).toContainText('Image ready');
 expect(await source(page)).toBe(draft);expect(await readFile(`${runtime}/wiki/ToolbarUpload.md`,'utf8')).toBe(original);
 await page.screenshot({path:`${runtime}/reports/image-upload-toolbar-modal-${width}.png`});
 await dialog.getByRole('button',{name:'Insert into draft'}).click();await expect(dialog).toBeHidden();
 expect(await source(page)).toMatch(/^# Toolbar upload\r\n\r\nUnsaved source stays here\.\r\n\r\n\r\n!\[\]\(assets\/upload-/);
 expect(await readFile(`${runtime}/wiki/ToolbarUpload.md`,'utf8')).toBe(original);await expect(page.locator('.cm-content')).toBeFocused();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
