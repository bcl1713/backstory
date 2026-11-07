import { test, expect } from '@playwright/test';
import { writeFile, readFile } from 'node:fs/promises';
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
  await page.locator('.cm-content').focus();
  await page.keyboard.type('g/');
  await expect(panel(page)).toBeVisible();
  await expect(panel(page).getByRole('searchbox', { name: 'Graph search' })).toBeFocused();
  await expect(map(page).locator('[data-node-path]')).toHaveCount(3);
}

test('g/ opens search; two Escapes restore exact editor caret and Normal mode without saving', async ({ page }) => {
  await setup(page);
  const editor = page.locator('[data-markdown-editor]');
  await editor.evaluate(el => el.markdownEditor.view.dispatch({ selection: { anchor: 3 } }));
  const before = await editor.evaluate(el => el.markdownEditor.getSource());
  const writes = [];
  page.on('request', r => { if (r.method() === 'POST' && /\/(save|format)\//.test(r.url())) writes.push(r.url()); });
  await openGraph(page);
  await page.keyboard.press('Escape');
  await expect(map(page)).toBeFocused();
  await expect(panel(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(panel(page)).not.toBeVisible();
  await expect(page.locator('.cm-content')).toBeFocused();
  expect(await editor.evaluate(el => el.markdownEditor.view.state.selection.main.head)).toBe(3);
  expect(await editor.evaluate(el => el.markdownEditor.getSource())).toBe(before);
  await expect(page.locator('[data-vim-mode]')).toHaveText('Vim · Normal');
  expect(writes).toEqual([]);
});

test('Insert text and browser shortcuts are preserved; Menu opens over a dirty draft and opening uses its guard', async ({ page }) => {
  await setup(page);
  await page.locator('.cm-content').focus();
  await page.keyboard.type('ig/');
  await expect(panel(page)).not.toBeVisible();
  await page.keyboard.press('Escape');
  await revealChrome(page);
  const dialogs = [];
  page.on('dialog', async d => { dialogs.push(d.message()); await d.dismiss(); });
  await page.getByRole('link', { name: 'Graph', exact: true }).click();
  await expect(panel(page)).toBeVisible();
  expect(dialogs).toEqual([]);
  await panel(page).getByRole('button', { name: 'Connection list', exact: true }).click();
  await panel(page).getByRole('link', { name: 'Open Graph B.md', exact: true }).click();
  expect(dialogs).toHaveLength(1);
  expect(await page.locator('[data-markdown-editor]').evaluate(el => el.markdownEditor.getSource())).toContain('g/');
});

test('list, map and tools share canonical edges; selection changes lighting without moving camera', async ({ page }) => {
  await setup(page); await openGraph(page);
  await page.keyboard.press('Escape');
  const initial = await map(page).locator('.graph-world').getAttribute('transform');
  await page.keyboard.press('ArrowRight');
  const selected = await map(page).getAttribute('data-selected');
  expect(selected).toBeTruthy();
  await expect(map(page).locator(`[data-node-path="${selected}"]`)).toHaveClass(/is-selected/);
  const tools = await page.request.get('/tools/graph/?path=Graph%20A.md');
  const evidence = await tools.json();
  await panel(page).getByRole('button', { name: 'Connection list', exact: true }).click();
  await expect(panel(page).locator('[data-graph-nodes] > li')).toHaveCount(evidence.nodes.length);
  await expect(panel(page).locator('[data-graph-edges] > li')).toHaveCount(evidence.edges.length);
  expect(await map(page).locator('.graph-world').getAttribute('transform')).toBe(initial);
  await panel(page).getByRole('slider', { name: 'Bloom intensity' }).fill('0');
  await expect(map(page)).toHaveAttribute('data-bloom', '0');
});

test('drag tugs a neighbor, cancellation releases pins, and physics sleeps with stable selection', async ({ page }) => {
  await setup(page); await openGraph(page);
  await panel(page).getByLabel('Depth').selectOption('2');
  await panel(page).getByRole('button', { name: 'Apply filters' }).click();
  await expect(map(page).locator('[data-node-path]')).toHaveCount(4);
  await expect(map(page)).toHaveAttribute('data-motion', 'settled', { timeout: 16000 });
  const selected = await map(page).getAttribute('data-selected');
  const node = map(page).locator('[data-node-path="Graph B.md"]');
  const neighbor = map(page).locator('[data-node-path="Graph D.md"]');
  const before = await neighbor.getAttribute('transform');
  const box = await node.boundingBox();
  await page.mouse.move(box.x + 10, box.y + 10); await page.mouse.down();
  await page.mouse.move(box.x + 130, box.y + 80, { steps: 18 });
  await expect.poll(() => neighbor.getAttribute('transform')).not.toBe(before);
  await map(page).dispatchEvent('pointercancel', { pointerId: 1 });
  await page.mouse.up();
  await expect(map(page)).toHaveAttribute('data-pinned', 'false');
  expect(await map(page).getAttribute('data-selected')).toBe(selected);
});

test('reduced motion, mobile list, direct URL and no-JavaScript evidence remain usable', async ({ page, browser }) => {
  await setup(page); await page.emulateMedia({ reducedMotion: 'reduce' });
  await openGraph(page);
  await expect(map(page)).toHaveAttribute('data-motion', 'paused');
  await expect(panel(page).getByRole('button', { name: 'Pause motion' })).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 390, height: 844 });
  await revealChrome(page); await page.getByRole('link', { name: 'Graph', exact: true }).click();
  await expect(panel(page).locator('[data-graph-list]')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const context = await browser.newContext({ javaScriptEnabled: false, storageState: await page.context().storageState() });
  const fallback = await context.newPage();
  await fallback.goto('/graph/?path=Graph%20A.md');
  await expect(fallback.getByRole('link', { name: 'Cluster B', exact: true })).toBeVisible();
  await context.close();
});

test('theme changes update vector roles while selection and camera survive', async ({ page }) => {
  await setup(page); await revealChrome(page);
  await page.getByLabel('Import Alacritty theme').setInputFiles({ name: 'light.toml', mimeType: 'application/toml', buffer: Buffer.from("colors.primary={background='#ffffff',foreground='#202020'}") });
  await page.getByRole('link', { name: 'Graph', exact: true }).click();
  await expect(map(page).locator('[data-node-path]')).toHaveCount(3);
  await panel(page).getByRole('button', { name: 'Pause motion' }).click();
  const selected = await map(page).getAttribute('data-selected');
  const camera = await map(page).locator('.graph-world').getAttribute('transform');
  const before = await map(page).locator('.graph-node-mark').first().evaluate(el => getComputedStyle(el).stroke);
  // Exercise the same semantic token update used by the installed theme control.
  await page.evaluate(() => document.documentElement.style.setProperty('--link', '#573399'));
  await expect(map(page).locator('.graph-node-mark').first()).toHaveCSS('stroke', 'rgb(87, 51, 153)');
  expect(before).not.toBe('rgb(87, 51, 153)');
  expect(await map(page).getAttribute('data-selected')).toBe(selected);
  expect(await map(page).locator('.graph-world').getAttribute('transform')).toBe(camera);
});

test('Menu Escape belongs to graph before chrome; bloom Off and restored lifecycle stay usable', async ({ page }) => {
  await setup(page); await revealChrome(page);
  await page.getByRole('link', { name: 'Graph', exact: true }).click();
  await expect(map(page).locator('[data-node-path]')).toHaveCount(3);
  await panel(page).getByRole('slider', { name: 'Bloom intensity' }).fill('0');
  await panel(page).getByRole('searchbox', { name: 'Graph search' }).focus();
  await page.keyboard.press('Escape'); await expect(map(page)).toBeFocused();
  await page.keyboard.press('Escape'); await expect(panel(page)).not.toBeVisible();
  await expect(page.locator('.cm-content')).toBeFocused();
  await page.keyboard.type('g/');
  await expect(map(page).locator('[data-node-path]')).toHaveCount(3);
  await expect(map(page)).toHaveAttribute('data-bloom', '0');
  await page.evaluate(() => {
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
  });
  await expect(map(page).locator('[data-node-path]')).toHaveCount(3);
  await panel(page).getByRole('button', { name: 'Connection list', exact: true }).click();
  await expect(panel(page).locator('[data-graph-list]')).toBeVisible();
});
