import { test, expect } from '@playwright/test';
import { readFile, stat } from 'node:fs/promises';
import { bytes, source, runtime } from './support/server.js';

async function open(page) {
  await page.goto('/accounts/login/');
  await page.getByLabel('Username').fill('slice');
  await page.getByLabel('Password').fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in' }).click();
  return page.goto('/notes/Slice.md');
}
const editor = page => page.locator('[data-markdown-editor]');
const readSource = page => editor(page).evaluate(el => el.markdownEditor.getSource());
const selection = page => editor(page).evaluate(el => {
  const range = el.markdownEditor.view.state.selection.main;
  return { anchor: range.anchor, head: range.head };
});
const select = (page, anchor, head = anchor) => editor(page).evaluate((el, positions) => {
  el.markdownEditor.view.dispatch({ selection: positions });
}, { anchor, head });

test('opening, selection and repeated modes preserve exact source, bytes, revision and mtime without writes', async ({ page }) => {
  const requests = [];
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => { if (/\/(format|save)\//.test(request.url())) requests.push(request.url()); });
  const before = await stat(`${runtime}/wiki/Slice.md`);
  const response = await open(page);
  await expect(page.getByRole('button', { name: 'Live preview', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(await readSource(page)).toBe(source);
  await page.screenshot({ path: '/tmp/backstory-release-one/reports/live-preview-live.png', fullPage: true });
  await page.getByRole('button', { name: 'Raw source', exact: true }).click();
  await page.screenshot({ path: '/tmp/backstory-release-one/reports/live-preview-source.png', fullPage: true });
  await page.getByRole('button', { name: 'Live preview', exact: true }).click();
  await select(page, 12);
  const original = await selection(page);
  for (let i = 0; i < 4; i++) {
    await page.getByRole('button', { name: 'Raw source', exact: true }).click();
    await page.getByRole('button', { name: 'Live preview', exact: true }).click();
  }
  expect(await selection(page)).toEqual(original);
  expect(await readSource(page)).toBe(source);
  await expect(page.getByRole('status').filter({ hasText: 'Unchanged' })).toBeVisible();
  const current = await page.request.get('/source/Slice.md');
  expect(current.headers().etag).toBe(response.headers().etag);
  expect(await readFile(`${runtime}/wiki/Slice.md`)).toEqual(bytes);
  expect((await stat(`${runtime}/wiki/Slice.md`)).mtimeMs).toBe(before.mtimeMs);
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});

test('active blocks and multiline selections reveal syntax and preserve reversed anchors', async ({ page }) => {
  await open(page);
  await expect(page.locator('.lp-strong')).toBeVisible();
  const content = page.locator('.cm-content');
  const offset = await editor(page).evaluate(el => el.markdownEditor.view.state.doc.toString().indexOf('quiet emphasis'));
  await select(page, offset + 2);
  await expect(page.locator('.lp-strong')).toHaveCount(0);
  await expect(content).toContainText('**quiet emphasis**');
  const end = await editor(page).evaluate(el => el.markdownEditor.view.state.doc.toString().indexOf('- A list'));
  await select(page, end, offset);
  expect(await selection(page)).toEqual({ anchor: end, head: offset });
  await expect(content).toContainText('[relative link](Other.md#Details)');
  await page.getByRole('button', { name: 'Raw source', exact: true }).click();
  await page.getByRole('button', { name: 'Live preview', exact: true }).click();
  expect(await selection(page)).toEqual({ anchor: end, head: offset });
  await expect(content).toContainText('| unchanged | 7 |');
  await expect(page.locator('.lp-source-region').filter({ hasText: '| unchanged | 7 |' })).toBeVisible();
  await expect(content).toContainText('const literal = "**source**";');
  await expect(content).toContainText(':::unfamiliar {keep=this}');
  const unfamiliar = await editor(page).evaluate(el => el.markdownEditor.view.state.doc.toString().indexOf('keep=this'));
  await select(page, unfamiliar, unfamiliar + 9);
  await content.focus();
  await page.keyboard.type('keep=edited');
  expect(await readSource(page)).toContain(':::unfamiliar {keep=edited}');
  await page.keyboard.press('Control+z');
  expect(await readSource(page)).toBe(source);
});

test('keyboard edits and undo redo survive mode changes without putting decorations in source', async ({ page }) => {
  await open(page);
  await page.locator('.cm-content').focus();
  await page.keyboard.press('Control+End');
  await page.keyboard.type('A real edit');
  const changed = await readSource(page);
  expect(changed).toContain('A real edit');
  await page.getByRole('button', { name: 'Raw source', exact: true }).click();
  await page.locator('.cm-content').focus();
  await page.keyboard.press('Control+z');
  expect(await readSource(page)).toBe(source);
  await page.getByRole('button', { name: 'Live preview', exact: true }).click();
  await page.locator('.cm-content').focus();
  await page.keyboard.press('Control+Shift+Z');
  expect(await readSource(page)).toBe(changed);
  await expect(page.getByRole('status').filter({ hasText: 'Unsaved changes' })).toBeVisible();
});

test('HTML and external images are inert; ordinary touch places cursor and plain source remains usable', async ({ page }) => {
  const external = [];
  page.on('request', request => { if (request.url().includes('example.invalid')) external.push(request.url()); });
  await open(page);
  expect(await page.evaluate(() => window.noteExecuted)).toBeUndefined();
  expect(await editor(page).locator('img[src],script,a[href]').count()).toBe(0);
  expect(external).toEqual([]);
  await page.locator('.lp-link').first().tap();
  expect(page.url()).toContain('/notes/Slice.md');
  await expect(page.locator('.cm-editor.cm-focused')).toBeVisible();
  await page.getByRole('button', { name: 'Plain text fallback' }).click();
  const fallback = page.getByRole('textbox', { name: 'Markdown source (plain text fallback)' });
  await expect(fallback).toBeVisible();
  await fallback.fill('Still editable in fallback.');
  expect(await readSource(page)).toBe('Still editable in fallback.');
});

test('JavaScript unavailable leaves a labeled editable source fallback', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await open(page);
  const fallback = page.getByRole('textbox', { name: 'Markdown source (plain text fallback)' });
  await expect(fallback).toBeVisible();
  await expect(fallback).toBeEditable();
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeHidden();
  await context.close();
});

for (const presentation of ['live', 'source']) {
  for (const [ending, original] of [
    ['CRLF', '# Synthetic\r\n\r\nBody\r\n'],
    ['mixed', '# Synthetic\r\n\nBody\rFinal\r\n'],
  ]) {
    test(`${presentation}: accepted ${ending} newline-only source changes undo and redo exact serialization`, async ({ page }) => {
      await open(page);
      if (presentation === 'source') await page.getByRole('button', { name: 'Raw source', exact: true }).click();
      const formatted = original.replace(/\r\n|\r/g, '\n');
      await editor(page).evaluate((el, value) => el.markdownEditor.setSource(value), original);
      await select(page, 3);
      const beforeSelection = await selection(page);
      await editor(page).evaluate((el, value) => el.markdownEditor.setSource(value), formatted);
      expect(await readSource(page)).toBe(formatted);
      await page.getByRole('button', { name: 'Raw source', exact: true }).click();
      await page.getByRole('button', { name: 'Live preview', exact: true }).click();
      expect(await readSource(page)).toBe(formatted);
      await page.locator('.cm-content').focus();
      await page.keyboard.press('Control+z');
      expect(await readSource(page)).toBe(original);
      expect(await selection(page)).toEqual(beforeSelection);
      await page.getByRole('button', { name: 'Raw source', exact: true }).click();
      expect(await readSource(page)).toBe(original);
      await page.locator('.cm-content').focus();
      await page.keyboard.press('Control+Shift+Z');
      expect(await readSource(page)).toBe(formatted);
      await page.keyboard.press('Control+End');
      await page.keyboard.type('Typed after Format');
      await page.keyboard.press('Control+z');
      expect(await readSource(page)).toBe(formatted);
      await page.keyboard.press('Control+z');
      expect(await readSource(page)).toBe(original);
    });
  }
}

test('inactive autolinks, bare URLs, email and unsupported references stay visible and inert in all modes', async ({ page }) => {
  await open(page);
  const requests = [];
  page.on('request', request => { if (request.url().includes('example.invalid')) requests.push(request.url()); });
  const links = '# Cursor stays here\n\n<https://example.invalid/auto>\n\nhttps://example.invalid/bare\n\n<reader@example.invalid>\n\n[unresolved][unknown]\n\n[label](Other.md)\n';
  await editor(page).evaluate((el, value) => {
    el.markdownEditor.setSource(value);
    el.markdownEditor.view.dispatch({ selection: { anchor: 0 } });
  }, links);
  const content = page.locator('.cm-content');
  for (const visible of ['<https://example.invalid/auto>', 'https://example.invalid/bare', '<reader@example.invalid>', '[unresolved][unknown]']) {
    await expect(content).toContainText(visible);
  }
  await select(page, links.indexOf('example.invalid/auto'));
  await expect(content).toContainText('<https://example.invalid/auto>');
  await page.getByRole('button', { name: 'Raw source', exact: true }).click();
  await expect(content).toContainText('[label](Other.md)');
  await expect(content).toContainText('<reader@example.invalid>');
  await page.getByRole('button', { name: 'Live preview', exact: true }).click();
  await select(page, 0);
  await expect(content).toContainText('<https://example.invalid/auto>');
  expect(await readSource(page)).toBe(links);
  expect(await editor(page).locator('a[href],img[src]').count()).toBe(0);
  expect(requests).toEqual([]);
});
