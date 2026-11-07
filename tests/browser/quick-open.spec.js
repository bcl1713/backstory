import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { runtime } from './support/server.js';
const source = page => page.getByRole('textbox', {name:'Markdown editor',exact:true});
const result = {state:'suggestions', authoritative:false, freshness:{state:'ready',limited:false}, truncated:false, items:[{path:'Other.md',title:'Other',label:'Other alias'}]};
async function open(page) {
 await writeFile(`${runtime}/wiki/QuickOpen.md`,'# Quick open\n\nOriginal.\n');
 await page.goto('/accounts/login/');
 await page.getByLabel('Username',{exact:true}).fill('slice');
 await page.getByLabel('Password',{exact:true}).fill('synthetic-slice-browser-only');
 await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await page.goto('/notes/QuickOpen.md');
 await expect(source(page)).toBeVisible();
 await source(page).focus();
 await page.route('**/tools/complete/?*', route=>route.fulfill({json:result}));
}
test('shortcut opens chooser, arrows and Enter follow a real existing-note link',async({page})=>{
 await open(page); await page.keyboard.press('Control+Alt+o');
 await expect(page.getByRole('dialog',{name:'Open note'})).toBeVisible();
 await page.getByLabel('Find a note').fill('Other');
 await expect(page.getByRole('link',{name:'Other alias — Other.md'})).toBeVisible();
 await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
 await expect(page).toHaveURL(/\/notes\/Other.md$/);
});
test('Escape restores editor focus, selection and source without editing',async({page})=>{
 await open(page);
 const host=page.locator('[data-markdown-editor]');
 await host.evaluate(el=>el.markdownEditor.view.dispatch({selection:{anchor:5}}));
 await page.keyboard.press('Control+Alt+o'); await page.keyboard.press('Escape');
 await expect(source(page)).toBeFocused();
 expect(await host.evaluate(el=>el.markdownEditor.view.state.selection.main.head)).toBe(5);
 expect(await host.evaluate(el=>el.markdownEditor.getSource())).toBe('# Quick open\n\nOriginal.\n');
});
test('Menu fallback and rejected dirty navigation preserve the draft',async({page})=>{
 await open(page);
 await page.locator('[data-markdown-editor]').evaluate(el=>el.markdownEditor.view.dispatch({changes:{from:0,insert:'dirty '}}));
 await page.keyboard.press('Control+Shift+Period');
 await page.getByRole('button',{name:'Open note',exact:true}).click();
 await expect(page.getByRole('link',{name:'Other alias — Other.md'})).toBeVisible();
 page.on('dialog',dialog=>dialog.dismiss());
 await page.getByRole('link',{name:'Other alias — Other.md'}).click();
 await expect(page).toHaveURL(/QuickOpen.md$/);
 expect(await page.locator('[data-markdown-editor]').evaluate(el=>el.markdownEditor.getSource())).toContain('dirty ');
 await page.keyboard.press('Escape');
 await expect(page.getByRole('button',{name:'Open note',exact:true})).toBeFocused();
});
test('failed lookup is not presented as an empty index',async({page})=>{
 await open(page); await page.route('**/tools/complete/?*',route=>route.fulfill({status:503,json:{state:'unavailable'}}));
 await page.keyboard.press('Control+Alt+o');
 await expect(page.locator('[data-quick-open-status]')).toContainText('unavailable');
 await expect(page.locator('[data-quick-open-results] a')).toHaveCount(0);
});
test('late lookup cannot replace newer results and incomplete index is disclosed',async({page})=>{
 await open(page);
 let release;
 await page.route('**/tools/complete/?*',async route=>{
   const query=new URL(route.request().url()).searchParams.get('query');
   if(query==='slow') await new Promise(resolve=>{release=resolve;});
   await route.fulfill({json:{...result,items:[{path:'Other.md',label:query||'Initial'}],truncated:query==='new'}}).catch(()=>{});
 });
 await page.keyboard.press('Control+Alt+o');
 await page.getByLabel('Find a note').fill('slow');
 await expect.poll(()=>Boolean(release)).toBe(true);
 await page.getByLabel('Find a note').fill('new');
 await expect(page.getByRole('link',{name:'new — Other.md'})).toBeVisible();
 release();
 await expect(page.locator('[data-quick-open-status]')).toContainText('incomplete');
 await expect(page.getByRole('link',{name:'slow — Other.md'})).toHaveCount(0);
});
test('unsafe result paths fail closed without inserting HTML',async({page})=>{
 await open(page);
 await page.route('**/tools/complete/?*',route=>route.fulfill({json:{...result,items:[{path:'../secret.md',label:'<img src=x onerror=alert(1)>'}]}}));
 await page.keyboard.press('Control+Alt+o');
 await expect(page.locator('[data-quick-open-status]')).toContainText('unsupported');
 await expect(page.locator('[data-quick-open-results] a')).toHaveCount(0);
 await expect(page.locator('[data-quick-open-results] img')).toHaveCount(0);
});
test('chooser Escape owns focus without dismissing an underlying proposal or toggling Menu',async({page})=>{
 await open(page);
 await page.locator('[data-format-proposal]').evaluate(el=>{el.hidden=false;});
 await page.keyboard.press('Control+Alt+o');
 await page.keyboard.press('Control+Shift+Period');
 await expect(page.locator('[data-zen-toggle]')).toHaveAttribute('aria-expanded','false');
 await page.keyboard.press('Escape');
 await expect(page.getByRole('dialog',{name:'Open note'})).not.toBeVisible();
 await expect(page.locator('[data-format-proposal]')).toBeVisible();
 await expect(source(page)).toBeFocused();
});
test('chooser leaves Vim Normal mode and caret unchanged',async({page})=>{
 await open(page);
 await page.evaluate(()=>localStorage.setItem('backstory.vim.v1','on'));
 await page.reload();
 await expect(source(page)).toBeVisible();
 await source(page).focus();
 await expect(page.locator('[data-vim-mode]')).toHaveText('Vim · Normal');
 await page.keyboard.press('Control+Alt+o');
 await page.keyboard.press('Escape');
 await expect(source(page)).toBeFocused();
 await expect(page.locator('[data-vim-mode]')).toHaveText('Vim · Normal');
});
