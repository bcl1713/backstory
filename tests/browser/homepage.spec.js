import { test, expect } from '@playwright/test';
import { writeFile, unlink, readFile } from 'node:fs/promises';
import { runtime } from './support/server.js';
import { revealChrome } from './support/chrome.js';

const index = `${runtime}/wiki/index.md`;
const content = '# Home\n\n[Other](Other.md#Details) and [[Other]].\n';
test.beforeEach(async () => { await writeFile(index, content); });
test.afterEach(async () => { await unlink(index).catch(error => { if (error.code !== 'ENOENT') throw error; }); });
async function login(page) {
  await page.goto('/accounts/login/');
  await page.getByLabel('Username', { exact: true }).fill('slice');
  await page.getByLabel('Password', { exact: true }).fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL('/');
  await expect.poll(() => page.locator('#note-path').textContent()).toBe('"index.md"');
  await expect(page.locator('.cm-content')).toBeVisible();
}

test('home preserves note identity across refresh, tree, Back and deep links', async ({ page }) => {
  await login(page);
  await page.reload();
  await expect.poll(() => page.locator('#note-path').textContent()).toBe('"index.md"');
  await revealChrome(page);
  await page.getByRole('link', { name: 'Wiki root', exact: true }).click();
  await expect(page).toHaveURL('/?folder=');
  await expect(page.locator('nav[aria-label="Folder"]')).toBeVisible();
  await page.goBack();
  await expect.poll(() => page.locator('#note-path').textContent()).toBe('"index.md"');
  await page.goto('/notes/Other.md#Details');
  await expect.poll(() => page.locator('#note-path').textContent()).toBe('"Other.md"');
  await revealChrome(page);
  await page.getByRole('link', { name: 'Backstory', exact: true }).click();
  await expect(page).toHaveURL('/');
  await expect.poll(() => page.locator('#note-path').textContent()).toBe('"index.md"');
  const preview = await page.request.get('/preview/index.md');
  expect(await preview.text()).toContain('/notes/Other.md#Details');
  expect(await readFile(index, 'utf8')).toBe(content);
});

test('home uses existing unsaved-draft navigation guard', async ({ page }) => {
  await login(page);
  // Pause all saving, so a navigation attempt cannot race an idle save.
  await page.route('**/save/**', route => route.abort());
  await page.locator('.cm-content').focus();
  await page.keyboard.press('Control+a');
  await page.keyboard.insertText('# Unsaved home\n');
  await revealChrome(page);
  const dialog = page.waitForEvent('dialog');
  const click = page.getByRole('link', { name: 'Wiki root', exact: true }).click();
  const confirmation = await dialog;
  expect(confirmation.message()).toContain('unsaved draft');
  await confirmation.dismiss();
  await click;
  await expect(page).toHaveURL('/');
  await expect(page.locator('.cm-content')).toContainText('Unsaved home');
  expect(await readFile(index, 'utf8')).toBe(content);
});

test('saving from canonical home updates index.md using the normal save endpoint', async ({ page }) => {
  await login(page);
  await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');
  // Keep idle autosave from racing the explicit Save assertion on slow runners.
  await page.clock.install({ time: new Date('2026-10-29T15:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-29T15:00:01Z'));
  await page.locator('.cm-content').focus();
  await page.keyboard.press('Control+a');
  await page.keyboard.insertText('# Saved home\n');
  await revealChrome(page);
  const response = page.waitForResponse(response => response.url().endsWith('/save/index.md') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  expect((await response).status()).toBe(200);
  await expect(page.locator('[data-editor-status]')).toContainText('Saved');
  expect(await readFile(index, 'utf8')).toBe('# Saved home\n');
  await page.reload();
  await expect(page.locator('.cm-content')).toContainText('Saved home');
});
