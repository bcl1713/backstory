import { test, expect } from '@playwright/test';
import { writeFile, readFile, rm } from 'node:fs/promises';
import { runtime } from './support/server.js';

const target = `${runtime}/wiki/Blocks.md`;
const base = '# Blocks\n\n- first\n- second\n\nActive paragraph.\n\n| Name | Value |\n| ---- | ----- |\n| x    | y     |\n';
const read = page => page.locator('[data-markdown-editor]').evaluate(el => el.markdownEditor.getSource());
async function select(page, position) {
  await page.locator('[data-markdown-editor]').evaluate((el, head) => {
    el.markdownEditor.view.dispatch({ selection: { anchor: head } });
    el.markdownEditor.focus();
  }, position);
}
async function open(page, source = base) {
  await writeFile(target, source);
  await page.goto('/accounts/login/');
  await page.getByLabel('Username', { exact: true }).fill('slice');
  await page.getByLabel('Password', { exact: true }).fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  const now = new Date('2026-10-26T15:00:00Z');
  await page.clock.install({ time: now }); await page.clock.pauseAt(now);
  await page.goto('/notes/Blocks.md');
  await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');
}
async function messyList(page) {
  await select(page, (await read(page)).indexOf('first'));
  await page.keyboard.insertText('   ');
}
async function exitList(page) { await select(page, (await read(page)).indexOf('Active')); }

test('leaving an edited list formats only after exit, maps caret, preserves focus and is separately undoable', async ({ page }) => {
  await open(page);
  let requests = 0;
  page.on('request', r => { if (r.url().includes('/format/Blocks.md')) requests++; });
  await messyList(page);
  expect(await read(page)).toContain('-    first'); expect(requests).toBe(0);
  await select(page, (await read(page)).indexOf('second'));
  expect(requests).toBe(0);
  await exitList(page);
  await expect.poll(() => read(page)).toBe(base);
  expect(requests).toBe(1);
  const caret = await page.locator('[data-markdown-editor]').evaluate(el => el.markdownEditor.view.state.selection.main.head);
  expect(caret).toBe(base.indexOf('Active'));
  await expect(page.locator('.cm-content')).toBeFocused();
  expect(await readFile(target, 'utf8')).toBe(base);
  await page.keyboard.press('Control+z');
  expect(await read(page)).toContain('-    first');
  await page.keyboard.press('Control+z'); expect(await read(page)).toBe(base);
});

test('Enter inside a continuing list does not format a physical line', async ({ page }) => {
  await open(page);
  let requests = 0;
  page.on('request', r => { if (r.url().includes('/format/Blocks.md')) requests++; });
  await messyList(page);
  await page.keyboard.press('End'); await page.keyboard.press('Enter');
  await page.keyboard.insertText('continuation');
  expect(await read(page)).toContain('-    first'); expect(requests).toBe(0);
});

test('a full-context result touching another block is deferred until Save', async ({ page }) => {
  await open(page, base.replace('Active paragraph.', 'Active   paragraph.'));
  await messyList(page); await exitList(page);
  await expect(page.locator('[data-editor-status]')).toContainText('deferred');
  expect(await read(page)).toContain('-    first');
  expect(await read(page)).toContain('Active   paragraph.');
  await page.locator('[data-save]').click();
  await expect(page.locator('[data-editor-status]')).toContainText('Saved');
  expect(await read(page)).toContain('- first');
  expect(await read(page)).toBe(await readFile(target, 'utf8'));
});

test('typing or returning to the exited block while formatting is in flight rejects the stale result', async ({ page }) => {
  await open(page);
  let release, captured;
  const gate = new Promise(resolve => { release = resolve; });
  const pending = new Promise(resolve => { captured = resolve; });
  await page.route('**/format/Blocks.md', async route => {
    const response = await route.fetch(); captured(); await gate; await route.fulfill({ response });
  });
  await messyList(page); await exitList(page); await pending;
  try {
    await select(page, (await read(page)).indexOf('first'));
    await page.keyboard.insertText('new ');
    release();
    await expect(page.locator('[data-editor-status]')).toContainText('deferred');
    expect(await read(page)).toContain('-    new first');
    expect(await readFile(target, 'utf8')).toBe(base);
  } finally { release(); }
});

test('table formatting uses the entire table and never alters active prose', async ({ page }) => {
  await open(page);
  await select(page, base.indexOf('| x') + 2);
  await page.keyboard.insertText('long');
  await select(page, (await read(page)).indexOf('Active'));
  await expect(page.locator('[data-editor-status]')).toContainText('Block formatted');
  const formatted = await read(page);
  expect(formatted).toContain('| longx |');
  expect(formatted).toContain('Active paragraph.');
  expect(await readFile(target, 'utf8')).toBe(base);
});

test('creating a real paragraph boundary can format the paragraph just left', async ({ page }) => {
  const source = '# Blocks\n\nParagraph   text. Next paragraph.\n';
  await open(page, source);
  await select(page, source.indexOf('Next'));
  await page.keyboard.press('Enter'); await page.keyboard.press('Enter');
  await expect(page.locator('[data-editor-status]')).toContainText('Block formatted');
  expect(await read(page)).toContain('Paragraph text.\n\nNext paragraph.');
});

test('one Enter at the end of a paragraph keeps the ongoing block unformatted', async ({ page }) => {
  const source = '# Blocks\n\nParagraph   text.';
  await open(page, source);
  let requests = 0;
  page.on('request', r => { if (r.url().includes('/format/Blocks.md')) requests++; });
  await select(page, source.length); await page.keyboard.press('Enter');
  await page.keyboard.insertText('continued');
  expect(await read(page)).toContain('Paragraph   text.\ncontinued');
  expect(requests).toBe(0);
});

test('configured prose wrapping preserves full front matter, wikilinks, code fences and active text', async ({ page }) => {
  const config = `${runtime}/wiki/.prettierrc`;
  const originalConfig = await readFile(config).catch(error => { if (error.code !== 'ENOENT') throw error; return null; });
  await writeFile(config, JSON.stringify({ proseWrap: 'always', printWidth: 40 }));
  const prose = 'A long paragraph with [[Other|alias]] and many words to wrap safely when leaving this edited paragraph.';
  const source = `---\ntitle: Blocks\n---\n\n# Blocks\n\n${prose}\n\nActive paragraph.\n\n\`\`\`text\n[[Literal]] stays verbatim.\n\`\`\`\n`;
  try {
    await open(page, source);
    await select(page, source.indexOf('many words'));
    await page.keyboard.insertText('more ');
    await select(page, (await read(page)).indexOf('Active'));
    await expect(page.locator('[data-editor-status]')).toContainText('Block formatted');
    const formatted = await read(page);
    expect(formatted).toContain('---\ntitle: Blocks\n---');
    expect(formatted).toContain('[[Other|alias]]');
    expect(formatted).toContain('```text\n[[Literal]] stays verbatim.\n```');
    expect(formatted).toContain('Active paragraph.');
    const paragraph = formatted.split('# Blocks\n\n')[1].split('\n\n')[0];
    expect(paragraph.split('\n').length).toBeGreaterThan(1);
    expect(paragraph.split('\n').every(line => line.length <= 40)).toBe(true);
    expect(await readFile(target, 'utf8')).toBe(source);
    await page.clock.runFor(5000);
    await expect(page.locator('[data-editor-status]')).toContainText('Saved');
    expect(await readFile(target, 'utf8')).toBe(formatted);
  } finally {
    if (originalConfig === null) await rm(config, { force: true });
    else await writeFile(config, originalConfig);
  }
});

test('save formatting preserves a selection and page scroll through an earlier change', async ({ page }) => {
  const source = '# Blocks\n\n-    first\n- second\n\n' + Array.from({ length: 180 }, (_, i) => `Paragraph ${i}.\n\n`).join('');
  await open(page, source);
  await page.locator('[data-markdown-editor]').evaluate(el => {
    el.markdownEditor.view.dispatch({ selection: { anchor: 1400, head: 1410 } });
  });
  const selected = await page.locator('[data-markdown-editor]').evaluate(el => el.markdownEditor.view.state.sliceDoc(1400, 1410));
  await page.evaluate(() => window.scrollTo(0, 1500));
  const before = await page.evaluate(() => window.scrollY);
  await page.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true })));
  await expect(page.locator('[data-editor-status]')).toContainText('Saved');
  expect(await page.locator('[data-markdown-editor]').evaluate(el => {
    const state = el.markdownEditor.view.state, { from, to } = state.selection.main;
    return state.sliceDoc(from, to);
  })).toBe(selected);
  expect(await page.evaluate(() => window.scrollY)).toBeCloseTo(before, -1);
  expect(await read(page)).toBe(await readFile(target, 'utf8'));
});
