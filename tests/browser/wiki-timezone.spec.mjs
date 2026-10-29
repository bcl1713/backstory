import { test, expect } from '@playwright/test';

test('ordinary editor can inspect wiki timezone without changing it', async ({ page }) => {
  await page.goto('/accounts/login/');
  await page.getByLabel('Username', { exact: true }).fill('slice');
  await page.getByLabel('Password', { exact: true }).fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  const writes = [];
  page.on('request', request => {
    if (request.url().includes('/settings/timezone/') && request.method() === 'POST') writes.push(request);
  });
  await page.goto('/settings/timezone/');
  await expect(page.getByRole('heading', { name: 'Wiki timezone', exact: true })).toBeVisible();
  await expect(page.locator('[data-wiki-timezone-settings]')).toContainText('UTC');
  await expect(page.getByText('Only a wiki owner (staff or superuser) can change this setting.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save wiki timezone' })).toHaveCount(0);
  expect(writes).toHaveLength(0);
});
