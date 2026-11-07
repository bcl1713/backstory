import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { revealChrome } from './support/chrome.js';
import { runtime } from './support/server.js';

test.use({ hasTouch: true });
test.beforeAll(() => {
  const env = { ...process.env, DJANGO_SETTINGS_MODULE: 'backstory.settings', BACKSTORY_WIKI_ROOT: `${runtime}/wiki`, BACKSTORY_DATA_DIR: `${runtime}/data`, BACKSTORY_IDENTITY_PATH: '.backstory-marker', BACKSTORY_COOKIE_MODE: 'localhost', BACKSTORY_ALLOWED_HOSTS: 'localhost,127.0.0.1' };
  const indexed = spawnSync('.venv/bin/python', ['-c', "import django; django.setup(); from indexing.queue import request_scan; from indexing.worker import run_batch; request_scan('verify')\nfor n in range(2000):\n r=run_batch(now=10000000000+n)\n if not r.pending: break\nelse: raise SystemExit(9)"], { env, encoding: 'utf8' });
  expect(indexed.status, indexed.stderr).toBe(0);
});

const panel = page => page.locator('[data-graph-dialog]');
async function setup(page) {
  await page.goto('/accounts/login/');
  await page.getByLabel('Username', { exact: true }).fill('slice');
  await page.getByLabel('Password', { exact: true }).fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.goto('/notes/Slice.md');
  await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');
}
async function reachableClose(page) {
  const close = panel(page).getByRole('button', { name: 'Close graph', exact: true });
  const box = await close.boundingBox();
  expect(box).not.toBeNull();
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(await page.evaluate(() => innerHeight));
  expect(Math.round(box.width)).toBeGreaterThanOrEqual(44);
  expect(Math.round(box.height)).toBeGreaterThanOrEqual(44);
  expect(await close.evaluate(el => {
    const r = el.getBoundingClientRect();
    return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
  })).toBe(true);
}

for (const width of [390, 320]) test(`Menu graph leaves useful space and reachable controls at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 568 });
  await setup(page); await revealChrome(page);
  await page.getByRole('link', { name: 'Graph', exact: true }).click();
  await expect(panel(page).locator('[data-graph-controls]')).toBeAttached();
  await expect(panel(page).locator('[data-graph-summary]')).toContainText('2 notes');
  const sidebar = await panel(page).locator('.graph-sidebar').evaluate(el => {
    const style = getComputedStyle(el), r = el.getBoundingClientRect();
    return { position: style.position, zIndex: style.zIndex, paddingTop: style.paddingTop, width: r.width, height: r.height };
  });
  await info.attach('sidebar-computed-style', { body: JSON.stringify(sidebar), contentType: 'application/json' });
  await writeFile(info.outputPath('sidebar-computed-style.json'), JSON.stringify(sidebar));
  await page.screenshot({ path: info.outputPath('menu-graph.png') });
  // A navigation drawer rule must never turn graph details into an overlay.
  expect(sidebar.position).not.toBe('fixed');
  await expect(panel(page).locator('[data-graph-control-options]')).not.toHaveAttribute('open', '');
  await expect(panel(page).locator('[data-graph-scope]')).toContainText('Local');
  await expect(panel(page).locator('[data-graph-scope]')).toContainText('2 hops');
  await reachableClose(page);
  const workspace = await panel(page).locator('.graph-workspace').boundingBox();
  expect(workspace.y).toBeLessThan((await page.evaluate(() => innerHeight)) * .5);
  expect(await panel(page).evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  for (const selector of ['[data-graph-filter-options]', '[data-graph-control-options]', '[data-graph-map-options]', '[data-graph-settings]', '[data-graph-forces]']) {
    await panel(page).locator(selector).locator(':scope > summary').tap();
    await expect(panel(page).locator(selector)).toHaveAttribute('open', '');
    await reachableClose(page);
  }
  await panel(page).getByRole('slider', { name: 'Gravity', exact: true }).fill('2');
  await reachableClose(page);
  await panel(page).locator('[data-graph-control-options] > summary').tap();
  await expect(panel(page).getByRole('button', { name: 'All notes', exact: true })).toBeHidden();
  await reachableClose(page);
  await panel(page).getByRole('button', { name: 'Close graph', exact: true }).tap();
  await expect(panel(page)).not.toBeVisible();
  await expect(page.locator('.cm-content')).toBeFocused();
  if (width === 390) {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.getByRole('link', { name: 'Graph', exact: true }).click();
    await expect(panel(page)).toBeVisible();
    await panel(page).evaluate(el => { el.scrollTop = el.scrollHeight; });
    await reachableClose(page);
    await page.screenshot({ path: info.outputPath('landscape-graph.png') });
    await panel(page).getByRole('button', { name: 'Close graph', exact: true }).tap();
    await expect(panel(page)).not.toBeVisible();
  }
});

test('direct phone graph keeps disclosures and connection list usable without WebGL', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page);
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(kind, ...args) {
      return String(kind).startsWith('webgl') ? null : original.call(this, kind, ...args);
    };
  });
  await page.goto('/graph/?path=Slice.md');
  const direct = page.locator('[data-graph-page]');
  await expect(direct.locator('[data-graph-list]')).toBeVisible();
  await expect(direct.locator('[data-graph-control-options]')).not.toHaveAttribute('open', '');
  await expect(direct.getByRole('button', { name: 'Connection list', exact: true })).toBeVisible();
  await direct.locator('[data-graph-filter-options] > summary').tap();
  await direct.getByRole('searchbox', { name: 'Graph search' }).focus();
  await page.keyboard.press('Escape');
  await expect(direct.getByRole('button', { name: 'Connection list', exact: true })).toBeFocused();
  await direct.locator('[data-graph-control-options] > summary').tap();
  await expect(direct.getByRole('button', { name: 'Retry map', exact: true })).toBeVisible();
  await direct.getByRole('button', { name: 'All notes', exact: true }).tap();
  await expect(direct.locator('[data-graph-scope]')).toContainText('Whole wiki');
  await direct.locator('[data-graph-control-options] > summary').tap();
  await expect(direct.locator('[data-graph-scope]')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('direct-list-graph.png'), fullPage: true });
});
