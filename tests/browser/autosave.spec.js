import { test, expect } from '@playwright/test';
import { readFile, writeFile, stat, rm } from 'node:fs/promises';
import { runtime } from './support/server.js';

const target = `${runtime}/wiki/Auto.md`;
const base = '# Automatic\n\nFirst paragraph.\n\nLast paragraph.\n';
const read = page => page.locator('[data-markdown-editor]').evaluate(el => el.markdownEditor.getSource());
async function draft(page, value) {
  await page.waitForFunction(() => Boolean(document.querySelector('[data-markdown-editor]')?.markdownEditor));
  await page.locator('[data-markdown-editor]').evaluate((el, source) => el.markdownEditor.setSource(source), value);
}
const advance = (page, ms = 5000) => page.clock.runFor(ms);

async function open(page) {
  await writeFile(target, base);
  await page.goto('/accounts/login/');
  await page.getByLabel('Username', { exact: true }).fill('slice');
  await page.getByLabel('Password', { exact: true }).fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  const now = new Date('2026-10-26T15:00:00Z');
  await page.clock.install({ time: now });
  await page.clock.pauseAt(new Date(now.getTime() + 1000));
  await page.goto('/notes/Auto.md');
  await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');
}

test('five idle seconds reset on edits, persist formatted source, and never rewrite a clean note', async ({ page }) => {
  await open(page);
  const saves = [];
  page.on('request', request => { if (request.url().includes('/save/Auto.md')) saves.push(request); });
  await draft(page, base + '\n-    first\n');
  await advance(page, 4999); expect(saves).toHaveLength(0);
  await draft(page, base + '\n-    second\n');
  await advance(page, 4999); expect(saves).toHaveLength(0);
  await advance(page, 1);
  await expect(page.locator('[data-editor-status]')).toContainText('Saved');
  expect(saves).toHaveLength(1);
  const persisted = await readFile(target, 'utf8');
  expect(persisted).toContain('- second');
  expect(await read(page)).toBe(persisted);
  const before = (await stat(target)).mtimeNs ?? (await stat(target)).mtimeMs;
  await advance(page, 15000);
  expect(saves).toHaveLength(1);
  await page.locator('[data-save]').click();
  await expect(page.locator('[data-editor-status]')).toContainText('Unchanged on disk');
  expect((await stat(target)).mtimeNs ?? (await stat(target)).mtimeMs).toBe(before);
});

test('newer typing during an in-flight save survives and is coalesced behind that save', async ({ page }) => {
  await open(page);
  let release, captured;
  const gate = new Promise(resolve => { release = resolve; });
  const pending = new Promise(resolve => { captured = resolve; });
  let saves = 0;
  await page.route('**/save/Auto.md', async route => {
    saves++;
    const response = await route.fetch();
    if (saves === 1) { captured(); await gate; }
    await route.fulfill({ response });
  });
  const first = base.replace('First paragraph.', 'First local.');
  const newer = first.replace('Last paragraph.', 'Newest local.');
  await draft(page, first); await advance(page); await pending;
  try {
    await draft(page, newer); await advance(page);
    expect(saves).toBe(1);
    release();
    await expect.poll(() => readFile(target, 'utf8')).toBe(newer);
    await expect(page.locator('[data-editor-status]')).toContainText('Saved');
    expect(await read(page)).toBe(newer); expect(saves).toBe(2);
  } finally { release(); }
});

for (const failure of ['network', 'storage', 'format', 'authentication', 'conflict']) {
  test(`${failure} pauses automatic writes and retains actionable status through more typing`, async ({ page }) => {
    await open(page);
    let saves = 0;
    await page.route('**/save/Auto.md', route => {
      saves++;
      if (failure === 'network') return route.abort();
      const status = { storage: 503, format: 422, authentication: 401, conflict: 412 }[failure];
      return route.fulfill({ status, json: failure === 'format'
        ? { state: 'format_failed', diagnostics: [{ severity: 'error', code: 'format-parse', message: 'Synthetic invalid format' }] }
        : { reason_code: failure } });
    });
    const local = base + '\nLocal work.\n';
    await draft(page, local); await advance(page);
    await expect(page.locator('[data-editor-status]')).toContainText('Needs attention');
    await draft(page, local + '\nMore work.\n'); await advance(page, 20000);
    expect(saves).toBe(1);
    expect(await read(page)).toContain('More work.');
    expect(await readFile(target, 'utf8')).toBe(base);
    await expect(page.locator('[data-editor-status]')).toContainText('Needs attention');
    await page.unroute('**/save/Auto.md');
    await page.locator('[data-save]').click();
    await expect(page.locator('[data-editor-status]')).toContainText('Saved');
  });
}

test('external merge cancels pending autosave and leaves local changes unsaved', async ({ page }) => {
  await open(page);
  const local = base.replace('First paragraph.', 'Local first.');
  await draft(page, local); await advance(page, 2000);
  const external = base.replace('Last paragraph.', 'External last.');
  await writeFile(target, external);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect.poll(() => read(page)).toBe(local.replace('Last paragraph.', 'External last.'));
  await advance(page, 15000);
  expect(await readFile(target, 'utf8')).toBe(external);
});

test('composition defers autosave and restarting idle time waits five seconds', async ({ page }) => {
  await open(page);
  await page.locator('.cm-content').dispatchEvent('compositionstart');
  await draft(page, base + '\nComposing.\n'); await advance(page, 10000);
  expect(await readFile(target, 'utf8')).toBe(base);
  await page.locator('.cm-content').dispatchEvent('compositionend');
  await advance(page, 4999); expect(await readFile(target, 'utf8')).toBe(base);
  await advance(page, 1);
  await expect(page.locator('[data-editor-status]')).toContainText('Saved');
});

test('formatting that overlaps newer typing retains the current draft and pauses for explicit review', async ({ page }) => {
  await open(page);
  let release, captured;
  const gate = new Promise(resolve => { release = resolve; });
  const pending = new Promise(resolve => { captured = resolve; });
  await page.route('**/save/Auto.md', async route => {
    const response = await route.fetch(); captured(); await gate; await route.fulfill({ response });
  });
  const first = base + '\n-    old item\n';
  await draft(page, first); await advance(page); await pending;
  const newer = first.replace('-    old item', '- local replacement');
  try {
    await draft(page, newer); release();
    await expect(page.locator('[data-editor-status]')).toContainText('Needs attention');
    expect(await read(page)).toBe(newer);
    expect(await readFile(target, 'utf8')).toContain('- old item');
    await advance(page, 15000);
    expect(await read(page)).toBe(newer);
  } finally { release(); }
});

test('manual save keeps subsequent typing scheduled and reports the older save honestly', async ({ page }) => {
  await open(page);
  let release, captured;
  const gate = new Promise(resolve => { release = resolve; });
  const pending = new Promise(resolve => { captured = resolve; });
  let count = 0;
  await page.route('**/save/Auto.md', async route => {
    const response = await route.fetch();
    if (++count === 1) { captured(); await gate; }
    await route.fulfill({ response });
  });
  await draft(page, base + '\nFirst edit.\n');
  await page.locator('[data-save]').click(); await pending;
  const newer = base + '\nFirst edit.\n\nNew typing.\n';
  try {
    await draft(page, newer); release();
    await expect(page.locator('[data-editor-status]')).toContainText('Newer edits remain unsaved');
    expect(await page.locator('[data-editor-status]').textContent()).not.toMatch(/^Saved/);
    await advance(page);
    await expect.poll(() => readFile(target, 'utf8')).toBe(newer);
    expect(count).toBe(2);
  } finally { release(); }
});

test('plain text fallback autosaves without requiring the enhanced editor', async ({ page }) => {
  await open(page);
  await page.locator('[data-zen-toggle]').click();
  await page.locator('[data-plain-fallback]').click();
  const source = base + '\n-    fallback\n';
  await page.locator('#source').fill(source);
  await advance(page);
  await expect(page.locator('[data-editor-status]')).toContainText('Saved');
  const persisted = await readFile(target, 'utf8');
  expect(persisted).toContain('- fallback');
  await expect(page.locator('#source')).toHaveValue(persisted);
});

test('a new note requires a valid filename and uses create-if-absent autosave', async ({ page }) => {
  await open(page);
  const created = `${runtime}/wiki/Drafts/Auto-created.md`;
  await rm(created, { force: true });
  await page.goto('/new/?folder=Drafts');
  await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');
  await draft(page, '# New automatic note\n');
  await page.getByLabel('Note filename').fill('bad/name.md');
  await advance(page, 10000);
  await expect(page).toHaveURL(/\/new\//);
  await page.getByLabel('Note filename').fill('Auto-created.md');
  const response = page.waitForResponse(r => r.url().includes('/save/Drafts/Auto-created.md'));
  await advance(page);
  expect((await response).request().headers()['if-none-match']).toBe('*');
  await expect(page).toHaveURL(/\/notes\/Drafts\/Auto-created.md$/);
  expect(await readFile(created, 'utf8')).toBe('# New automatic note\n');
});

test('pending save retains the existing navigation and browser-close warning', async ({ page }) => {
  await open(page);
  let release, captured;
  const gate = new Promise(resolve => { release = resolve; });
  const pending = new Promise(resolve => { captured = resolve; });
  await page.route('**/save/Auto.md', async route => { captured(); await gate; await route.abort(); });
  await draft(page, base + '\nPending.\n'); await advance(page); await pending;
  try {
    const prevented = await page.evaluate(() => {
      const event = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(event); return event.defaultPrevented;
    });
    expect(prevented).toBe(true);
    page.once('dialog', dialog => dialog.dismiss());
    await page.locator('[data-server-preview]').evaluate(el => el.click());
    await expect(page).toHaveURL(/\/notes\/Auto.md$/);
  } finally { release(); }
});

test('recovered protected drafts and historical views require an explicit first save', async ({ page }) => {
  await open(page);
  await draft(page, base + '\nProtected work.\n');
  await page.locator('[data-zen-toggle]').click();
  await page.locator('[data-store-draft]').click();
  await expect(page.locator('[data-stored-draft]')).toBeVisible();
  await page.goto(await page.locator('[data-stored-draft]').getAttribute('href'));
  await expect(page.locator('[data-editor-status]')).toContainText('Recovered draft');
  await draft(page, base + '\nProtected work edited.\n');
  await advance(page, 20000);
  expect(await readFile(target, 'utf8')).toBe(base);
  await page.locator('[data-save]').click();
  await expect(page.locator('[data-editor-status]')).toContainText('Saved');
  const saved = await readFile(target, 'utf8');
  await page.goto('/history/Auto.md');
  await page.getByRole('link', { name: 'Open original for comparison and explicit restoration' }).first().click();
  await expect(page.locator('[data-restore-revision]')).toBeVisible();
  await draft(page, '# Never automatically restore history\n');
  await advance(page, 20000);
  expect(await readFile(target, 'utf8')).toBe(saved);
});

test('a response arriving during composition does not replace composing source', async ({ page }) => {
  await open(page);
  let release, captured;
  const gate = new Promise(resolve => { release = resolve; });
  const pending = new Promise(resolve => { captured = resolve; });
  await page.route('**/save/Auto.md', async route => {
    const response = await route.fetch(); captured(); await gate; await route.fulfill({ response });
  });
  const submitted = base + '\n-    unfinished\n';
  await draft(page, submitted); await advance(page); await pending;
  try {
    await page.locator('.cm-content').dispatchEvent('compositionstart');
    release();
    await expect(page.locator('[data-editor-status]')).toContainText('Needs attention');
    expect(await read(page)).toBe(submitted);
    expect(await readFile(target, 'utf8')).toContain('- unfinished');
    await page.locator('.cm-content').dispatchEvent('compositionend');
    await advance(page, 10000);
    expect(await read(page)).toBe(submitted);
  } finally { release(); }
});

test('a slow protected-draft operation releases autosave work that became due while it was busy', async ({ page }) => {
  await open(page);
  let release, captured;
  const gate = new Promise(resolve => { release = resolve; });
  const pending = new Promise(resolve => { captured = resolve; });
  await page.route('**/drafts/', async route => {
    const response = await route.fetch(); captured(); await gate; await route.fulfill({ response });
  });
  const local = base + '\nStored and saved.\n';
  await draft(page, local);
  await page.locator('[data-zen-toggle]').click();
  await page.locator('[data-store-draft]').click(); await pending;
  try {
    await advance(page);
    expect(await readFile(target, 'utf8')).toBe(base);
    release();
    await expect.poll(() => readFile(target, 'utf8')).toBe(local);
  } finally { release(); }
});

test('composition without source changes after an external merge does not publish local work', async ({ page }) => {
  await open(page);
  await draft(page, base.replace('First paragraph.', 'Local first.'));
  const external = base.replace('Last paragraph.', 'External last.');
  await writeFile(target, external);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.locator('[data-editor-status]')).toContainText('External changes merged');
  await page.locator('.cm-content').dispatchEvent('compositionstart');
  await page.locator('.cm-content').dispatchEvent('compositionend');
  await advance(page, 10000);
  expect(await readFile(target, 'utf8')).toBe(external);
});
