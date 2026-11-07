import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { runtime } from './support/server.js';
async function login(page) {
  await page.goto('/accounts/login/');
  await page.getByLabel('Username').fill('slice');
  await page.getByLabel('Password').fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}
for (const width of [1180, 390]) {
  test(`editor source never paints during delayed enhancement at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await login(page);
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    await page.route('**/static/editor.js', async route => { await gate; await route.continue(); });
    await page.goto('/notes/Slice.md', { waitUntil: 'commit' });
    await expect(page.locator('[data-editor-loading]')).toBeVisible();
    await expect(page.locator('#source')).toBeHidden();
    await expect(page.locator('[data-markdown-editor]')).toBeHidden();
    await expect(page.locator('[data-navigation-fallback], [data-zen-toggle]').filter({ visible: true }).first()).toBeVisible();
    const screenshots = `${dirname(runtime)}/reports`;
    await mkdir(screenshots, { recursive: true });
    await page.screenshot({ path: `${screenshots}/editor-startup-loading-${width}.png` });
    release();
    await expect(page.locator('[data-editor-stage]')).toHaveAttribute('data-editor-state', 'ready');
    await expect(page.locator('.cm-editor')).toBeVisible();
    await expect(page.locator('.lp-table')).toBeVisible();
    await expect(page.locator('#source')).toBeHidden();
    await expect(page.locator('[data-editor-loading]')).toBeHidden();
    await page.screenshot({ path: `${screenshots}/editor-startup-ready-${width}.png` });
  });
}
test('failed editor bundle exposes usable fallback without an indefinite blank', async ({ page }) => {
  await login(page);
  await page.route('**/static/editor.js', route => route.abort());
  await page.goto('/notes/Slice.md');
  await expect(page.locator('#source')).toBeVisible();
  await expect(page.locator('#source')).toBeEditable();
  await expect(page.locator('[data-editor-readiness]')).toContainText('unavailable');
});
test('native fallback works even when all editor scripts fail', async ({ page }) => {
  await login(page);
  await page.route(/\/static\/editor(?:-startup)?\.js/, route => route.abort());
  await page.goto('/notes/Slice.md');
  await page.getByRole('link', { name: 'Use plain text' }).click();
  await expect(page.locator('#source')).toBeVisible();
  await expect(page.locator('#source')).toBeEditable();
});

test('a hung editor falls back and does not discard edits if it arrives late', async ({ page }) => {
  await login(page);
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/static/editor.js', async route => { await gate; await route.continue(); });
  await page.goto('/notes/Slice.md', { waitUntil: 'commit' });
  await expect(page.locator('#source')).toBeHidden();
  await expect(page.locator('#source')).toBeVisible({ timeout: 15000 });
  await page.locator('#source').fill('# Edited while waiting\n');
  release();
  await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');
  await expect(page.locator('#source')).toBeVisible();
  await expect(page.locator('#source')).toHaveValue('# Edited while waiting\n');
});
test('editor still reveals when only the startup guard fails', async ({ page }) => {
  await login(page);
  await page.route('**/static/editor-startup.js', route => route.abort());
  await page.goto('/notes/Slice.md');
  await expect(page.locator('.cm-editor')).toBeVisible();
  await expect(page.locator('[data-editor-stage]')).toHaveAttribute('data-editor-state', 'ready');
});

test('initial editor waits for the note font instead of showing a font-swap layout', async ({ page }) => {
  await login(page);
  // A fresh context is required: login may already have cached this font.
  const context = await page.context().browser().newContext({ storageState: await page.context().storageState() });
  const fresh = await context.newPage();
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await fresh.route('**/*.woff2', async route => { await gate; await route.continue(); });
  await fresh.goto('/notes/Slice.md', { waitUntil: 'domcontentloaded' });
  await expect(fresh.locator('[data-markdown-editor] .cm-editor')).toBeAttached();
  await expect(fresh.locator('[data-markdown-editor]')).toBeHidden();
  await expect(fresh.locator('#source')).toBeHidden();
  release();
  await expect(fresh.locator('[data-markdown-editor]')).toBeVisible();
  await expect(fresh.locator('[data-editor-readiness]')).toContainText('Ready');
  await context.close();
});

test('native fallback remains usable when the guard fails and the editor waits on a font', async ({ page }) => {
  await login(page);
  const context = await page.context().browser().newContext({ storageState: await page.context().storageState() });
  const fresh = await context.newPage();
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await fresh.route('**/static/editor-startup.js', route => route.abort());
  await fresh.route('**/*.woff2', async route => { await gate; await route.continue(); });
  await fresh.goto('/notes/Slice.md', { waitUntil: 'domcontentloaded' });
  await expect(fresh.locator('.cm-editor')).toBeAttached();
  await fresh.getByRole('link', { name: 'Use plain text' }).click();
  await expect(fresh.locator('#source')).toBeVisible();
  await fresh.locator('#source').fill('# Fallback choice retained\n');
  release();
  await expect(fresh.locator('#source')).toBeVisible();
  await expect(fresh.locator('#source')).toHaveValue('# Fallback choice retained\n');
  await context.close();
});
