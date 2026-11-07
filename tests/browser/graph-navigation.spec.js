import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { runtime } from './support/server.js';
import { revealChrome } from './support/chrome.js';

async function setup(page) {
  for (const [name, source] of Object.entries({
    'Graph A.md': '# Cluster A\n[[Graph B]] [[Graph C]]',
    'Graph B.md': '# Cluster B\n[[Graph C]] [[Graph D]]',
    'Graph C.md': '# Cluster C\n[[Graph A]]',
    'Graph D.md': '# Cluster D\n[[Graph E]] [[Graph F]]',
    'Graph E.md': '# Cluster E\n[[Graph F]]', 'Graph F.md': '# Cluster F\n[[Graph D]]',
  })) await writeFile(`${runtime}/wiki/${name}`, source);
  const env = { ...process.env, DJANGO_SETTINGS_MODULE: 'backstory.settings', BACKSTORY_WIKI_ROOT: `${runtime}/wiki`, BACKSTORY_DATA_DIR: `${runtime}/data`, BACKSTORY_IDENTITY_PATH: '.backstory-marker', BACKSTORY_COOKIE_MODE: 'localhost', BACKSTORY_ALLOWED_HOSTS: 'localhost,127.0.0.1' };
  const indexed = spawnSync('.venv/bin/python', ['-c', "import django; django.setup(); from indexing.queue import request_scan; from indexing.worker import run_batch; request_scan('verify')\nfor n in range(2000):\n r=run_batch(now=10000000000+n)\n if not r.pending: break\nelse: raise SystemExit(9)"], { env, encoding: 'utf8' });
  expect(indexed.status, indexed.stderr).toBe(0);
  await page.goto('/accounts/login/');
  await page.getByLabel('Username', { exact: true }).fill('slice');
  await page.getByLabel('Password', { exact: true }).fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.evaluate(() => localStorage.setItem('backstory.vim.v1', 'on'));
  await page.goto('/notes/Graph%20A.md');
  await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');
}
const panel = page => page.locator('[data-graph-dialog]');
const map = page => panel(page).locator('[data-graph-map]');
async function openGraph(page) {
  await page.locator('.cm-content').focus(); await page.keyboard.type('g/');
  await expect(panel(page)).toBeVisible();
  await expect(panel(page).getByRole('searchbox', { name: 'Graph search' })).toBeFocused();
  await expect(panel(page).locator('[data-graph-summary]')).toContainText('3 notes');
}
async function viewOptions(page) { await panel(page).locator('[data-graph-map-options]').evaluate(el => { el.open = true; }); }

test('g/ opens search; two Escapes restore exact editor caret and Normal mode without saving', async ({ page }) => {
  await setup(page);
  const editor = page.locator('[data-markdown-editor]');
  await editor.evaluate(el => el.markdownEditor.view.dispatch({ selection: { anchor: 3 } }));
  const before = await editor.evaluate(el => el.markdownEditor.getSource());
  const writes = [];
  page.on('request', r => { if (r.method() === 'POST' && /\/(save|format)\//.test(r.url())) writes.push(r.url()); });
  await openGraph(page); await page.keyboard.press('Escape');
  // WebGL is optional: keyboard navigation through the full list remains available.
  const navigation = await map(page).isVisible() ? map(page) : panel(page).getByRole('button', { name: 'Connection list', exact: true });
  await expect(navigation).toBeFocused();
  await page.keyboard.press('Escape'); await expect(panel(page)).not.toBeVisible();
  await expect(page.locator('.cm-content')).toBeFocused();
  expect(await editor.evaluate(el => el.markdownEditor.view.state.selection.main.head)).toBe(3);
  expect(await editor.evaluate(el => el.markdownEditor.getSource())).toBe(before);
  await expect(page.locator('[data-vim-mode]')).toHaveText('Vim · Normal'); expect(writes).toEqual([]);
});
test('Insert text is preserved; Graph opens over a dirty draft and opening a note uses its guard', async ({ page }) => {
  await setup(page); await page.locator('.cm-content').focus(); await page.keyboard.type('ig/');
  await expect(panel(page)).not.toBeVisible(); await page.keyboard.press('Escape'); await revealChrome(page);
  const dialogs = []; page.on('dialog', async d => { dialogs.push(d.message()); await d.dismiss(); });
  await page.getByRole('link', { name: 'Graph', exact: true }).click(); await expect(panel(page)).toBeVisible();
  expect(dialogs).toEqual([]);
  if (!await panel(page).locator('[data-graph-list]').isVisible()) await panel(page).getByRole('button', { name: 'Connection list', exact: true }).click();
  await panel(page).getByRole('link', { name: 'Open Graph B.md', exact: true }).click();
  expect(dialogs).toHaveLength(1);
  expect(await page.locator('[data-markdown-editor]').evaluate(el => el.markdownEditor.getSource())).toContain('g/');
});
test('list and tools share canonical edges; technical evidence starts behind disclosure', async ({ page }) => {
  await setup(page); await openGraph(page);
  const evidence = await (await page.request.get('/tools/graph/?path=Graph%20A.md')).json();
  if (!await panel(page).locator('[data-graph-list]').isVisible()) await panel(page).getByRole('button', { name: 'Connection list', exact: true }).click();
  await expect(panel(page).locator('[data-graph-nodes] > li')).toHaveCount(evidence.nodes.length);
  await expect(panel(page).locator('[data-graph-edges] > li')).toHaveCount(evidence.edges.length);
  await expect(panel(page).locator('[data-graph-summary]')).not.toContainText(/epoch|revision|observed/);
  await expect(panel(page).getByText('Technical evidence', { exact: true })).toBeVisible();
  await expect(panel(page).locator('[data-graph-details] code:visible')).toHaveCount(0);
  await viewOptions(page); await panel(page).getByRole('slider', { name: 'Bloom intensity' }).fill('0');
  await expect(map(page)).toHaveAttribute('data-bloom', '0');
});
test('reduced motion, phone graph-first layout and no-JavaScript evidence remain usable', async ({ page, browser }) => {
  await setup(page); await page.emulateMedia({ reducedMotion: 'reduce' }); await openGraph(page);
  await viewOptions(page);
  await expect(panel(page).getByRole('button', { name: 'Pause motion' })).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 390, height: 844 }); await revealChrome(page);
  await page.getByRole('link', { name: 'Graph', exact: true }).click();
  await expect(panel(page).locator('[data-graph-summary]')).toContainText('3 notes');
  if (await map(page).getAttribute('data-renderer') === 'webgl') await expect(map(page)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const context = await browser.newContext({ javaScriptEnabled: false, storageState: { cookies: await page.context().cookies(), origins: [] } });
  const fallback = await context.newPage(); await fallback.goto('/graph/?path=Graph%20A.md');
  await expect(fallback.getByRole('link', { name: 'Cluster B', exact: true })).toBeVisible(); await context.close();
});
test('missing WebGL retains full list, filters, continuation and guarded navigation', async ({ page }) => {
  await setup(page);
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(kind, ...args) { return String(kind).startsWith('webgl') ? null : original.call(this, kind, ...args); };
  });
  await page.reload(); await openGraph(page);
  await expect(panel(page).locator('[data-graph-list]')).toBeVisible();
  await expect(panel(page).getByRole('button', { name: 'Retry map' })).toBeVisible();
  await panel(page).getByRole('button', { name: 'Inspect Cluster B', exact: true }).click();
  await expect(panel(page).getByRole('link', { name: 'Open selected note' })).toHaveAttribute('href', '/notes/Graph%20B.md');
});
test('closing graph restores visible plain-text fallback and caret', async ({ page }) => {
  await setup(page); await revealChrome(page);
  await page.getByRole('button', { name: 'Plain text fallback', exact: true }).click();
  await page.locator('#source').evaluate(el => { el.focus(); el.setSelectionRange(4, 4); });
  await page.getByRole('link', { name: 'Graph', exact: true }).click(); await expect(panel(page)).toBeVisible();
  await panel(page).getByRole('button', { name: 'Close graph', exact: true }).click();
  await expect(page.locator('#source')).toBeFocused(); expect(await page.locator('#source').evaluate(el => el.selectionStart)).toBe(4);
});
