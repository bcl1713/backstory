import { test, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { runtime } from './support/server.js';

const env = { ...process.env, DJANGO_SETTINGS_MODULE: 'backstory.settings', BACKSTORY_WIKI_ROOT: `${runtime}/wiki`, BACKSTORY_DATA_DIR: `${runtime}/data`, BACKSTORY_IDENTITY_PATH: '.backstory-marker', BACKSTORY_COOKIE_MODE: 'localhost', BACKSTORY_ALLOWED_HOSTS: 'localhost,127.0.0.1' };
async function indexFixture() {
  const indexed = spawnSync('.venv/bin/python', ['-c', "import django; django.setup(); from indexing.queue import request_scan; from indexing.worker import run_batch; request_scan('verify')\nfor n in range(2000):\n r=run_batch(now=10000000000+n)\n if not r.pending: break\nelse: raise SystemExit(9)"], { env, encoding: 'utf8' });
  expect(indexed.status, indexed.stderr).toBe(0);
}

async function login(page) {
  await page.goto('/accounts/login/');
  await page.getByLabel('Username', { exact: true }).fill('slice');
  await page.getByLabel('Password', { exact: true }).fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}

test('presentation keeps the real graph and dirty editor draft through fullscreen/fallback exit', async ({ page }, info) => {
  test.setTimeout(60000);
  await indexFixture();
  await login(page); await page.goto('/notes/Slice.md');
  await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');
  await page.locator('[data-markdown-editor]').evaluate(el => el.markdownEditor.setSource(el.markdownEditor.getSource() + '\nUnsubmitted presentation draft.\n'));
  const draft = await page.locator('[data-markdown-editor]').evaluate(el => el.markdownEditor.getSource());
  await page.evaluate(() => document.dispatchEvent(new Event('backstory:open-graph')));
  const panel = page.locator('[data-graph-dialog]'), map = panel.locator('[data-graph-map]');
  await expect(panel.locator('[data-graph-summary]')).toContainText('notes');
  await expect(map).toHaveAttribute('data-renderer', 'webgl');
  const before = await map.evaluate(el => el.graphView.snapshot());
  await panel.getByRole('button', { name: 'Present graph', exact: true }).click();
  await expect(panel.locator('[data-graph-presentation-tools]')).toBeVisible();
  await expect(panel.locator('[data-graph-presentation-status]')).toContainText(/Browser fullscreen active|Fullscreen unavailable/);
  expect(await panel.locator('[data-graph-panel]').evaluate(el => document.fullscreenElement === el)).toBe(true);
  console.info('presentation-status:', (await panel.locator('[data-graph-presentation-status]').textContent()).trim());
  await panel.getByRole('button', { name: 'Hide controls', exact: true }).click();
  await expect(panel.locator('[data-graph-presentation-tools]')).toBeHidden();
  expect(await page.locator('#site-navigation').isVisible()).toBe(false);
  expect(await map.isVisible()).toBe(true);
  await page.screenshot({ path: info.outputPath('presentation-desktop-1180.png'), fullPage: false });
  await page.keyboard.press('c');
  await expect(panel.locator('[data-graph-presentation-tools]')).toBeVisible();
  await panel.getByRole('button', { name: /Keep screen awake/ }).click();
  await expect(panel.locator('[data-graph-presentation-status]')).toContainText(/wake lock active|wake lock was denied|not supported/i);
  console.info('wake-lock-status:', (await panel.locator('[data-graph-presentation-status]').textContent()).trim());
  await page.keyboard.press('Escape');
  await expect(page.locator('body')).not.toHaveClass(/graph-presentation/);
  expect(await page.evaluate(() => document.fullscreenElement)).toBe(null);
  expect(await page.locator('[data-markdown-editor]').evaluate(el => el.markdownEditor.getSource())).toBe(draft);
  const after = await map.evaluate(el => el.graphView.snapshot());
  expect(after.selected).toBe(before.selected); expect(after.focused).toBe(before.focused);
  expect(after.nodes).toBe(before.nodes); expect(after.edges).toBe(before.edges);
  for (const key of ['yaw', 'pitch', 'roll', 'distance']) expect(after.camera[key]).toBeCloseTo(before.camera[key], 4);
});

test('in-page fallback remains graph-only when fullscreen request is refused', async ({ page }) => {
  await indexFixture();
  await login(page); await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/graph/?path=Slice.md');
  await expect(page.locator('[data-graph-map]')).toHaveAttribute('data-renderer', 'webgl');
  await page.locator('[data-graph-panel]').evaluate(panel => { panel.requestFullscreen = () => Promise.reject(new Error('denied')); });
  await page.getByRole('button', { name: 'Present graph', exact: true }).click();
  await expect(page.locator('[data-graph-presentation-status]')).toContainText('Fullscreen unavailable');
  await expect(page.locator('[data-graph-page] > .graph-header')).toBeHidden();
  await expect(page.locator('[data-graph-map]')).toBeVisible();
  await page.getByRole('button', { name: 'Hide controls', exact: true }).click();
  await page.screenshot({ path: test.info().outputPath('presentation-narrow-390.png'), fullPage: false });
  await page.keyboard.press('Escape');
  await expect(page.locator('body')).not.toHaveClass(/graph-presentation/);
});
