import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { revealChrome } from './support/chrome.js';
import { runtime } from './support/server.js';

const dark = `
[colors.primary]
background = '#282a36'
foreground = '#f8f8f2'
[colors.normal]
blue = '#8be9fd'
magenta = '#bd93f9'
red = '#ff5555'
green = '#50fa7b'
yellow = '#f1fa8c'
[colors.selection]
background = '#44475a'
`;
const light = `colors.primary = { background = '#ffffff', foreground = '#202020' }
colors.normal = { blue = '#eeeeee', red = '#eeeeee' }
colors.selection = { background = 'CellForeground', text = 'CellBackground' }`;
async function login(page) {
  await page.goto('/accounts/login/');
  await page.getByLabel('Username').fill('slice');
  await page.getByLabel('Password').fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL('/');
  await page.goto('/notes/Slice.md');
  await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');
}
async function importTheme(page, source = dark, name = 'dracula.toml') {
  await revealChrome(page);
  await page.getByLabel('Import Alacritty theme').setInputFiles({ name, mimeType: 'application/toml', buffer: Buffer.from(source) });
}
const background = page => page.locator('body');

test('imports a palette, preserves draft, history and geometry, remembers it and restores Tokyo Night', async ({ page }) => {
  const disk = await readFile(`${runtime}/wiki/Slice.md`);
  const violations = [];
  await page.addInitScript(() => document.addEventListener('securitypolicyviolation', e => { window.themeCspViolations = [...(window.themeCspViolations || []), e.violatedDirective]; }));
  page.on('pageerror', error => violations.push(error.message));
  await login(page);
  const editor = page.locator('[data-markdown-editor]');
  const initial = await editor.evaluate(el => el.markdownEditor.getSource());
  const geometry = () => page.locator('.cm-content').evaluate(el => {
    const style = getComputedStyle(el);
    return [style.fontFamily, style.fontSize, style.lineHeight, style.width];
  });
  const before = await geometry();
  await page.locator('.cm-content').press('Control+End');
  await page.keyboard.insertText('Unsaved theme check');
  const draft = await editor.evaluate(el => el.markdownEditor.getSource());
  expect(draft).toContain('Unsaved theme check');
  await importTheme(page);
  await expect(background(page)).toHaveCSS('background-color', 'rgb(40, 42, 54)');
  await expect(page.locator('[data-theme-status]')).toContainText('dracula');
  expect(await geometry()).toEqual(before);
  expect(await editor.evaluate(el => el.markdownEditor.getSource())).toBe(draft);
  await page.locator('.cm-content').press('Control+z');
  expect(await editor.evaluate(el => el.markdownEditor.getSource())).toBe(initial);
  await expect(page.locator('[data-editor-status]')).not.toContainText('Unsaved');
  expect(await readFile(`${runtime}/wiki/Slice.md`)).toEqual(disk);
  await page.reload();
  await expect(background(page)).toHaveCSS('background-color', 'rgb(40, 42, 54)');
  await revealChrome(page);
  await page.getByRole('button', { name: 'Plain text fallback', exact: true }).click();
  await expect(page.locator('#source')).toHaveCSS('color', 'rgb(248, 248, 242)');
  await page.goto('/search/');
  await expect(background(page)).toHaveCSS('background-color', 'rgb(40, 42, 54)');
  await page.getByRole('button', { name: 'Restore Tokyo Night', exact: true }).click();
  await expect(background(page)).toHaveCSS('background-color', 'rgb(26, 27, 38)');
  await page.reload();
  await expect(background(page)).toHaveCSS('background-color', 'rgb(26, 27, 38)');
  expect(await page.evaluate(() => window.themeCspViolations || [])).toEqual([]);
  expect(violations).toEqual([]);
});

test('bad files leave the previous palette intact and can be retried with the same filename', async ({ page }) => {
  await login(page);
  await importTheme(page);
  for (const source of ['[colors.primary', '[general]\nimport = ["theme.toml"]', dark.replace('#282a36', 'url(evil)'), 'x'.repeat(262145)]) {
    await importTheme(page, source);
    await expect(page.locator('[data-theme-status]')).toContainText('Could not import');
    await expect(background(page)).toHaveCSS('background-color', 'rgb(40, 42, 54)');
  }
  await importTheme(page, dark.replace('#282a36', '#111111'));
  await expect(background(page)).toHaveCSS('background-color', 'rgb(17, 17, 17)');
});

test('light imports apply to the enhanced editor, headings, native controls and selection', async ({ page }) => {
  await login(page);
  await importTheme(page, light, 'light.toml');
  await expect(background(page)).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(page.locator('.cm-editor')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'light');
  await expect(page.getByRole('button', { name: 'Live preview', exact: true })).toHaveCSS('color', 'rgb(255, 255, 255)');
  const currentFile = page.locator('[data-folder-sidebar] [aria-current="page"]');
  await expect(currentFile).toHaveCSS('color', 'rgb(255, 255, 255)');
  await currentFile.hover();
  await expect(currentFile).toHaveCSS('background-color', 'rgb(32, 32, 32)');
  await expect(currentFile).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(page.locator('.lp-heading').first()).toHaveCSS('font-size', '16px');
  await page.locator('.cm-content').press('Control+a');
  await expect(page.locator('.cm-selectionBackground').first()).toHaveCSS('background-color', 'rgb(32, 32, 32)');
  expect(await page.locator('.cm-content').evaluate(el => getComputedStyle(el, '::selection').color)).toBe('rgb(255, 255, 255)');
});

test('inverse selections remain readable over raw block backgrounds', async ({ page }) => {
  await login(page);
  await importTheme(page, light, 'light.toml');
  await page.locator('.cm-content').press('Control+a');
  const rawSelection = await page.locator('.lp-source-region').first().evaluate(el => {
    const style = getComputedStyle(el, '::selection');
    return [style.backgroundColor, style.color];
  });
  expect(rawSelection).toEqual(['rgb(32, 32, 32)', 'rgb(255, 255, 255)']);
  await page.screenshot({ path: '/tmp/backstory-release-one/reports/theme-light-selection.png', fullPage: true });
});

test('corrupt browser preferences fall back safely without applying untrusted CSS', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('backstory.theme.v1', JSON.stringify({ version: 1, name: '<img src=x>', palette: { background: 'url(https://example.invalid/)' } })));
  await login(page);
  await expect(background(page)).toHaveCSS('background-color', 'rgb(26, 27, 38)');
  await importTheme(page);
  await expect(background(page)).toHaveCSS('background-color', 'rgb(40, 42, 54)');
});

test('unavailable storage still permits imports and reset with honest status', async ({ page }) => {
  await page.addInitScript(() => {
    for (const method of ['getItem', 'setItem', 'removeItem']) Storage.prototype[method] = () => { throw new DOMException('Disabled', 'SecurityError'); };
  });
  await login(page);
  await importTheme(page);
  await expect(background(page)).toHaveCSS('background-color', 'rgb(40, 42, 54)');
  await expect(page.locator('[data-theme-status]')).toContainText('cannot be remembered');
  await page.getByRole('button', { name: 'Restore Tokyo Night', exact: true }).click();
  await expect(background(page)).toHaveCSS('background-color', 'rgb(26, 27, 38)');
});
