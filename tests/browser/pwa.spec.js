import { test, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { runtime } from './support/server.js';
import { revealChrome } from './support/chrome.js';

async function login(page) {
  await page.goto('/accounts/login/');
  await page.getByLabel('Username', { exact: true }).fill('slice');
  await page.getByLabel('Password', { exact: true }).fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL('/');
}

test('public install metadata resolves without login or a service worker', async ({ page, request }) => {
  await page.goto('/accounts/login/');
  const href = await page.locator('link[rel=manifest]').getAttribute('href');
  const response = await request.get(href);
  expect(response.ok()).toBeTruthy();
  const manifest = await response.json();
  expect(manifest.start_url).toBe('/');
  for (const icon of manifest.icons) {
    const asset = await request.get(icon.src);
    expect(asset.ok()).toBeTruthy();
    expect(asset.headers()['content-type']).toContain('image/png');
  }
  expect(await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length)).toBe(0);
});

test('offline status is explicit without claiming a save or discarding a draft', async ({ page, context }) => {
  const target = `${runtime}/wiki/Pwa.md`;
  const original = '# Network check\n';
  await writeFile(target, original);
  await login(page);
  await page.goto('/notes/Pwa.md');
  await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');
  await expect(page.locator('[data-connectivity-status]')).toBeHidden();
  await context.setOffline(true);
  try {
    await expect(page.locator('[data-connectivity-status]')).toBeVisible();
    await expect(page.locator('[data-connectivity-status]')).toContainText('Offline');
    const editor = page.locator('[data-markdown-editor]');
    await editor.evaluate(el => el.markdownEditor.setSource('# Keep this local work\n'));
    await revealChrome(page);
    await page.locator('[data-save]').click();
    await expect(page.locator('[data-editor-status]')).toContainText('Needs attention');
    expect(await editor.evaluate(el => el.markdownEditor.getSource())).toBe('# Keep this local work\n');
    expect(await readFile(target, 'utf8')).toBe(original);
  } finally {
    await context.setOffline(false);
  }
  await expect(page.locator('[data-connectivity-status]')).toBeHidden();
  await revealChrome(page);
  await page.locator('[data-save]').click();
  await expect(page.locator('[data-editor-status]')).toContainText('Saved');
});
