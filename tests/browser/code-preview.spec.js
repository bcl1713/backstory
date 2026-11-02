import { test, expect } from '@playwright/test';
import { revealChrome } from './support/chrome.js';

const source = 'Before\n\n```js\nconst answer = 42;\nconsole.log("**literal**");\n```\n\nAfter';
const editor = page => page.locator('[data-markdown-editor]');
async function open(page, value = source) {
  await page.goto('/accounts/login/');
  await page.getByLabel('Username').fill('slice');
  await page.getByLabel('Password').fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.goto('/notes/Slice.md');
  await expect(editor(page)).toHaveAttribute('data-presentation', 'live');
  await editor(page).evaluate((el, text) => { el.markdownEditor.setVimEnabled(false); el.markdownEditor.setSource(text); el.markdownEditor.view.dispatch({ selection: { anchor: 0 } }); }, value);
}
const select = (page, anchor, head = anchor) => editor(page).evaluate((el, selection) => el.markdownEditor.view.dispatch({ selection }), { anchor, head });
const readSource = page => editor(page).evaluate(el => el.markdownEditor.getSource());

test('inactive code is styled and highlighted with hidden fences; entry reveals exact source', async ({ page }) => {
  await open(page);
  await expect(page.locator('.lp-code-line')).toHaveCount(4);
  await expect(page.locator('.cm-content')).not.toContainText('```');
  await expect(page.locator('.lp-code-keyword').filter({ hasText: 'const' })).toBeVisible();
  await expect(page.locator('.cm-content')).toContainText('**literal**');
  await select(page, source.indexOf('answer'));
  await expect(page.locator('.cm-content')).toContainText('```js');
  expect(await readSource(page)).toBe(source);
  await select(page, source.length);
  await expect(page.locator('.cm-content')).not.toContainText('```');
  await revealChrome(page);
  await page.getByRole('button', { name: 'Raw source', exact: true }).click();
  await expect(page.locator('.cm-content')).toContainText('```js');
  expect(await readSource(page)).toBe(source);
});

test('unknown, tilde and unfinished fences remain literal safe code', async ({ page }) => {
  const text = 'Before\n\n~~~mystery\n<script>window.codeRan = true</script>\n![x](https://example.invalid/tracker)\n~~~\n\n```python\nprint("unfinished")';
  const external = [];
  page.on('request', request => { if (request.url().includes('example.invalid')) external.push(request.url()); });
  await open(page, text);
  await expect(page.locator('.lp-code-line')).not.toHaveCount(0);
  await expect(page.locator('.cm-content')).toContainText('<script>window.codeRan = true</script>');
  expect(await page.evaluate(() => window.codeRan)).toBeUndefined();
  expect(await editor(page).locator('script,img').count()).toBe(0);
  expect(external).toEqual([]);
  await select(page, text.length);
  await expect(page.locator('.cm-content')).toContainText('```python');
  expect(await readSource(page)).toBe(text);
});

for (const direction of ['up', 'down']) for (const vim of [false, true]) {
  test(`${vim ? 'Vim' : 'arrows'} enter code from ${direction} without skipping`, async ({ page }) => {
    await open(page);
    await editor(page).evaluate((el, enabled) => el.markdownEditor.setVimEnabled(enabled), vim);
    await select(page, direction === 'up' ? source.length : 0);
    await page.locator('.cm-content').focus();
    for (let i = 0; i < 3; i++) await page.keyboard.press(vim ? (direction === 'up' ? 'k' : 'j') : (direction === 'up' ? 'ArrowUp' : 'ArrowDown'));
    const head = await editor(page).evaluate(el => el.markdownEditor.view.state.selection.main.head);
    expect(head).toBeGreaterThanOrEqual(source.indexOf('```'));
    expect(head).toBeLessThanOrEqual(source.lastIndexOf('```') + 3);
    await expect(page.locator('.cm-content')).toContainText('```js');
    expect(await readSource(page)).toBe(source);
  });
}

test('selection across a block reveals fences and editing undo preserves source', async ({ page }) => {
  await open(page);
  await select(page, source.length, 0);
  await expect(page.locator('.cm-content')).toContainText('```js');
  await select(page, source.indexOf('answer'), source.indexOf('answer') + 6);
  await page.locator('.cm-content').focus();
  await page.keyboard.type('result');
  expect(await readSource(page)).toBe(source.replace('answer', 'result'));
  await page.keyboard.press('Control+z');
  expect(await readSource(page)).toBe(source);
});

test('phone code wraps without page overflow and diagram fences remain separate', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const text = 'Before\n\n```text\n' + 'wide_line_'.repeat(45) + '\n```\n\n```mermaid\nflowchart TD\nA-->B\n```\n\nAfter';
  await open(page, text);
  await expect(page.locator('.lp-code-line')).toHaveCount(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await select(page, text.indexOf('wide_line_'));
  await expect(page.locator('.cm-content')).toContainText('```text');
  expect(await readSource(page)).toBe(text);
});

test('pointer entry and a tall block remain editable on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const text = 'Before\n\n```python\n' + Array.from({ length: 90 }, (_, i) => `print(${i})`).join('\n') + '\n```\n\nAfter';
  await open(page, text);
  await page.locator('.lp-code-line').filter({ hasText: 'print(0)' }).click();
  await expect(page.locator('.cm-content')).toContainText('```python');
  await page.keyboard.press('Control+End');
  await expect(page.locator('.cm-line').filter({ hasText: /^After$/ })).toBeVisible();
  expect(await readSource(page)).toBe(text);
});
