import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { runtime } from './support/server.js';
const content = page => page.getByRole('textbox', { name: 'Markdown editor', exact: true });
const host = page => page.locator('[data-markdown-editor]');
async function open(page, text = '# Keyboard\n\n[[Other#Details|Alias]]\n') {
  await writeFile(`${runtime}/wiki/Keyboard.md`, text);
  await page.goto('/accounts/login/');
  await page.getByLabel('Username', { exact: true }).fill('slice');
  await page.getByLabel('Password', { exact: true }).fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.evaluate(() => localStorage.setItem('backstory.vim.v1', 'on'));
  await page.goto('/notes/Keyboard.md');
  await expect(content(page)).toBeVisible();
  await content(page).focus();
}
async function caret(page, pos) {
  await host(page).evaluate((el, anchor) => el.markdownEditor.view.dispatch({ selection: { anchor } }), pos);
}
for (const [label, source, position] of [
  ['wiki first bracket', '[[Other]]', 0],
  ['wiki label', '[[Other#Details|Alias]]', 17],
  ['Markdown destination', '[label](Other.md#Details)', 12],
]) {
  test(`gf follows ${label} without changing source`, async ({ page }) => {
    await open(page, source); await caret(page, position);
    await page.keyboard.type('gf');
    await expect(page).toHaveURL(/\/notes\/Other\.md(?:#preview-details)?$/);
  });
}
test('gf nonlink and insert mode do not navigate; gg retains its motion', async ({ page }) => {
  await open(page, 'first\nsecond\n'); await caret(page, 8);
  await page.keyboard.type('gf'); await expect(page).toHaveURL(/Keyboard.md$/);
  await page.keyboard.type('gg');
  expect(await host(page).evaluate(el => el.markdownEditor.view.state.selection.main.head)).toBe(0);
  await page.keyboard.type('igf');
  expect(await host(page).evaluate(el => el.markdownEditor.getSource())).toBe('gffirst\nsecond\n');
});
test('gf preserves dirty draft cancellation', async ({ page }) => {
  await open(page, '[[Other]]\n');
  await host(page).evaluate(el => el.markdownEditor.view.dispatch({ changes: { from: el.markdownEditor.view.state.doc.length, insert: 'dirty' } }));
  await caret(page, 3);
  let prompted = false; page.on('dialog', async dialog => { prompted = true; await dialog.dismiss(); });
  await page.keyboard.type('gf');
  await expect.poll(() => prompted).toBe(true);
  await expect(page).toHaveURL(/Keyboard.md$/);
  expect(await host(page).evaluate(el => el.markdownEditor.getSource())).toContain('dirty');
});
test('gh uses home route and preserves dirty draft confirmation', async ({ page }) => {
  await open(page, 'draft\n');
  await host(page).evaluate(el => el.markdownEditor.view.dispatch({ changes: { from: 0, insert: 'dirty ' } }));
  let prompted = false;
  page.on('dialog', async dialog => { prompted = true; await dialog.dismiss(); });
  await page.keyboard.type('gh');
  await expect.poll(() => prompted).toBe(true);
  await expect(page).toHaveURL(/Keyboard.md$/);
});
test('pending gf never follows after caret moves away and back', async ({ page }) => {
  await open(page, '[[Other]]\nelsewhere'); await caret(page, 3);
  await page.waitForLoadState('networkidle');
  let release;
  await page.route('**/resolve/**', route => new Promise(resolve => { release = async () => { await route.fulfill({ json: { state: 'resolved', href: '/notes/Other.md' } }); resolve(); }; }));
  await page.keyboard.type('gf'); await expect.poll(() => Boolean(release)).toBe(true);
  await caret(page, 13); await caret(page, 3); await release();
  await expect(page).toHaveURL(/Keyboard.md$/);
});
test.describe('desktop startup', () => {
  test.use({ hasTouch: false });
  test('defaults to focused Normal; manual off survives navigation and no active yellow stripe', async ({ page }) => {
    await open(page);
    await page.evaluate(() => localStorage.removeItem('backstory.vim.v1'));
    await page.reload();
    await expect(page.locator('[data-vim-mode]')).toHaveText('Vim · Normal');
    await expect(content(page)).toBeFocused();
    await expect(content(page)).toHaveCSS('box-shadow', 'none');
    await page.keyboard.press('Control+Shift+Period');
    await page.getByRole('button', { name: 'Vim bindings', exact: true }).click();
    await page.reload();
    await expect(page.locator('[data-vim-mode]')).toHaveText('Vim · Off');
  });
  test('fragment positioning survives startup focus', async ({ page }) => {
    await open(page, '# First\n\n## Destination\n\ntext\n');
    await page.goto('/notes/Keyboard.md#preview-destination');
    await expect.poll(() => host(page).evaluate(el => el.markdownEditor.view.state.selection.main.head)).toBe(9);
    await expect(content(page)).toBeFocused();
  });
});
test('phone defaults off and does not focus editor', async ({ page }) => {
  await open(page); await page.evaluate(() => localStorage.removeItem('backstory.vim.v1'));
  await page.setViewportSize({ width: 390, height: 844 }); await page.reload();
  await expect(page.locator('[data-vim-mode]')).toHaveText('Vim · Off');
  await expect(content(page)).not.toBeFocused();
});
