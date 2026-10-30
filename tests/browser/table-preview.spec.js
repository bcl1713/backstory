import { test, expect } from '@playwright/test';
import { source } from './support/server.js';

const host = page => page.locator('[data-markdown-editor]');
const select = (page, anchor, head = anchor) => host(page).evaluate((el, selection) => el.markdownEditor.view.dispatch({ selection }), { anchor, head });
const read = page => host(page).evaluate(el => el.markdownEditor.getSource());
async function open(page) {
  await page.goto('/accounts/login/');
  await page.getByLabel('Username').fill('slice');
  await page.getByLabel('Password').fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.goto('/notes/Slice.md');
}

test('inactive table renders; caret and crossing selection reveal source without modifying bytes', async ({ page }) => {
  await open(page);
  await expect(page.locator('.lp-table table')).toBeVisible();
  await expect(page.locator('.lp-table th')).toHaveText(['Name', 'Value']);
  await expect(page.locator('.lp-table td')).toHaveText(['unchanged', '7']);
  const offset = await host(page).evaluate(el => el.markdownEditor.view.state.doc.toString().indexOf('| Name'));
  await select(page, offset + 4);
  await expect(page.locator('.lp-table')).toHaveCount(0);
  await expect(page.locator('.cm-content')).toContainText('| unchanged | 7 |');
  await select(page, 0);
  await expect(page.locator('.lp-table table')).toBeVisible();
  await select(page, offset + 70, offset - 3);
  await expect(page.locator('.lp-table')).toHaveCount(0);
  expect(await read(page)).toBe(source);
});

test('arrows can enter a table, edit and undo; leaving renders it again', async ({ page }) => {
  await open(page);
  const offset = await host(page).evaluate(el => el.markdownEditor.view.state.doc.toString().indexOf('| Name'));
  await select(page, offset - 1);
  await page.locator('.cm-content').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.lp-table')).toHaveCount(0);
  await select(page, offset + 2);
  await page.keyboard.type('New ');
  expect(await read(page)).toContain('| New Name');
  await page.keyboard.press('Control+z');
  expect(await read(page)).toBe(source);
  await select(page, 0);
  await expect(page.locator('.lp-table')).toBeVisible();
});

const longTable = '# Synthetic table preview\n\nA readable note column stays narrow.\n\n| Field | Value |\n| --- | --- |\n| Status | Planned |\n| Purpose | A long description of a synthetic project that should wrap within its own value column rather than wrap the entire pipe-delimited source line. |\n| Dates | Monday through Friday; this is synthetic fixture data, not a real event. |\n| Label | **Important** and `literal code`, [safe label](https://example.invalid), escaped \\| pipe. |\n| Inert | <img src=x onerror=alert(1)> ![image](https://example.invalid/tracker.png) |\n| Unbroken | '+ 'x'.repeat(180)+' |\n\nFollowing paragraph.';
test('wrapped cells preserve the note width at desktop and phone; HTML and images remain inert', async ({ page }) => {
  await open(page);
  await host(page).evaluate((el,s) => el.markdownEditor.applyExternalSource(s),longTable);
  await select(page, 0);
  await expect(page.locator('.lp-table strong')).toHaveText('Important');
  await expect(page.locator('.lp-table code')).toHaveText('literal code');
  await expect(page.locator('.lp-table a, .lp-table img')).toHaveCount(0);
  for (const width of [1180,390]) {
    await page.setViewportSize({width,height:1000});
    await expect(page.locator('.lp-table table')).toBeVisible();
    const sizes=await page.locator('.lp-table').evaluate(el=>({width:el.getBoundingClientRect().width,scroll:el.scrollWidth,viewport:document.documentElement.clientWidth,body:document.documentElement.scrollWidth}));
    expect(sizes.scroll).toBeLessThanOrEqual(sizes.width+1);
    expect(sizes.body).toBeLessThanOrEqual(sizes.viewport+1);
    await page.screenshot({path:`/tmp/backstory-release-one/reports/table-preview-${width}.png`,fullPage:true});
  }
  expect(await read(page)).toBe(longTable);
});

test('Vim normal and insert editing, mode changes and undo preserve table source', async ({ page }) => {
  await open(page);
  await host(page).evaluate(el => el.markdownEditor.setVimEnabled(true));
  const offset = await host(page).evaluate(el => el.markdownEditor.view.state.doc.toString().indexOf('unchanged'));
  await select(page, offset);
  await page.locator('.cm-content').focus();
  await expect(page.locator('.lp-table')).toHaveCount(0);
  await page.keyboard.type('iNew ');
  await page.keyboard.press('Escape');
  expect(await read(page)).toContain('New unchanged');
  await page.keyboard.type('u');
  expect(await read(page)).toBe(source);
  await host(page).evaluate(el => el.markdownEditor.setMode('source'));
  await select(page, 0);
  await expect(page.locator('.lp-table')).toHaveCount(0);
  await host(page).evaluate(el => el.markdownEditor.setMode('live'));
  await expect(page.locator('.lp-table table')).toBeVisible();
  expect(await read(page)).toBe(source);
});
