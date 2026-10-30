import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { runtime } from './support/server.js';
const content = page => page.getByRole('textbox', { name: 'Markdown editor', exact: true });
const host = page => page.locator('[data-markdown-editor]');
async function open(page, source) {
  await writeFile(`${runtime}/wiki/Escape.md`, source);
  await page.goto('/accounts/login/');
  await page.getByLabel('Username', { exact: true }).fill('slice');
  await page.getByLabel('Password', { exact: true }).fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.evaluate(() => localStorage.setItem('backstory.vim.v1', 'on'));
  await page.goto('/notes/Escape.md');
  await expect(content(page)).toBeVisible();
  await content(page).focus();
}
const cases = [
  ['plain paragraph', 'Alpha beta\nSecond line\n', 3],
  ['heading', '# Alpha heading\n\nSecond line\n', 5],
  ['table cell', 'Before\n\n| Name | Value |\n| --- | --- |\n| Alpha | Beta |\n\nAfter\n', 41],
];
for (const [label, source, anchor] of cases) {
  test(`Insert Escape retains focus and Normal cursor in ${label}`, async ({ page }) => {
    await open(page, source);
    await host(page).evaluate((el, anchor) => el.markdownEditor.view.dispatch({ selection: { anchor } }), anchor);
    await page.keyboard.type('i');
    await expect(page.locator('[data-vim-mode]')).toHaveText('Vim · Insert');
    await page.keyboard.type('X');
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-vim-mode]')).toHaveText('Vim · Normal');
    await expect(content(page)).toBeFocused();
    await expect(page.locator('.cm-fat-cursor.cm-cursor-primary')).toBeVisible();
    const before = await host(page).evaluate(el => el.markdownEditor.view.state.selection.main.head);
    await page.keyboard.type('h');
    expect(await host(page).evaluate(el => el.markdownEditor.view.state.selection.main.head)).toBe(before - 1);
    await page.keyboard.type('liY');
    await page.keyboard.press('Escape');
    await expect(content(page)).toBeFocused();
    expect(await host(page).evaluate(el => el.markdownEditor.getSource())).toContain('YX');
  });
}
test('Escape closes Menu then returns editor focus without consuming the next Vim Escape', async ({ page }) => {
  await open(page, 'Alpha beta\nSecond line\n');
  await page.keyboard.type('iX');
  await page.keyboard.press('Control+Shift+Period');
  await expect(page.getByRole('button', { name: 'Navigation and controls', exact: true })).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(content(page)).toBeFocused();
  await expect(page.locator('[data-vim-mode]')).toHaveText('Vim · Insert');
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-vim-mode]')).toHaveText('Vim · Normal');
  await expect(content(page)).toBeFocused();
});
