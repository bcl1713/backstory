import { revealChrome } from './support/chrome.js';
import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { runtime } from './support/server.js';

// Removing semantic navigation, keyboard activation or persistent actions must
// fail this workflow; all navigation below uses Tab/Enter, including login.
async function tabTo(page, target) {
  await expect(target).toBeVisible();
  // Folder links grow with the disposable corpus; traverse a complete possible
  // focus cycle rather than assuming a fixed number of controls on the page.
  const focusable = page.locator('a[href], button, input, textarea, select, summary, [tabindex]');
  let controls = await focusable.count();
  for (let n = 0; n < controls + 2; n++) {
    if (await target.evaluate(el => el === document.activeElement)) return;
    await page.keyboard.press('Tab');
    // The file tree can finish loading during traversal, adding more stops.
    controls = Math.max(controls, await focusable.count());
  }
  if (await target.evaluate(el => el === document.activeElement)) return;
  throw new Error('Control cannot be reached using Tab');
}
async function activate(page, target) {
  await tabTo(page, target);
  await page.keyboard.press('Enter');
}
async function login(page) {
  await page.goto('/accounts/login/');
  await tabTo(page, page.getByLabel('Username', { exact: true }));
  await page.keyboard.type('slice');
  await page.keyboard.press('Tab');
  await page.keyboard.type('synthetic-slice-browser-only');
  await activate(page, page.getByRole('button', { name: 'Sign in', exact: true }));
  await page.waitForURL('/');
}

test('keyboard navigation reaches folders, search, editor modes, proposal dismissal and fallback Save', async ({ page }) => {
  await writeFile(`${runtime}/wiki/Keyboard.md`, '# Keyboard\n');
  await login(page);
  await activate(page, page.getByRole('link', { name: 'Skip to content' }));
  await activate(page, page.getByRole('navigation', { name: 'Folder', exact: true }).getByRole('link', { name: 'Keyboard.md', exact: true }));
  await activate(page, page.getByRole('button', { name: 'Navigation and controls', exact: true }));
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('Keyboard.md');
  await expect(page.getByRole('navigation', { name: 'Folder sidebar' })).toContainText('Other.md');
  await activate(page, page.getByRole('button', { name: 'Raw source', exact: true }));
  await activate(page, page.getByRole('button', { name: 'Live preview', exact: true }));
  await tabTo(page, page.getByRole('textbox', { name: 'Markdown editor', exact: true }));
  await expect(page.locator('.cm-editor')).toHaveClass(/cm-focused/);
  const focusStyle = await page.locator('.cm-content').evaluate(el => getComputedStyle(el).boxShadow);
  expect(focusStyle).toBe('none');
  await expect(page.locator('.cm-cursor').first()).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await activate(page, page.getByRole('button', { name: 'Format', exact: true }));
  await expect(page.locator('[data-format-proposal]')).toBeVisible();
  await tabTo(page, page.getByRole('button', { name: 'Dismiss proposed formatting' }));
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-format-proposal]')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Format', exact: true })).toBeFocused();
  await activate(page, page.getByRole('button', { name: 'Plain text fallback' }));
  await expect(page.getByLabel('Markdown source (plain text fallback)')).toBeFocused();
  // No-op Save exercises the keyboard shortcut without modifying the slice.
  const url = page.url();
  const saved = page.waitForResponse(r => r.url().includes('/save/') && r.request().method() === 'POST');
  await page.keyboard.press('Control+s');
  expect((await saved).ok()).toBe(true);
  expect(page.url()).toBe(url);
  await expect(page.getByLabel('Markdown source (plain text fallback)')).toBeFocused();
  await expect(page.locator('[data-editor-status]')).toHaveAttribute('aria-live', 'polite');
  await activate(page, page.getByRole('link', { name: 'Open safe server preview' }));
  await expect(page.getByRole('region', { name: 'Markdown preview' })).toBeVisible();
  await activate(page, page.getByRole('link', { name: 'Search', exact: true }));
  await tabTo(page, page.getByLabel('Search text'));
  await page.keyboard.type('synthetic');
  await activate(page, page.getByRole('button', { name: 'Search', exact: true }));
  await expect(page).toHaveURL(/search\/\?q=synthetic/);
});

for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
  test(`responsive navigation and persistent actions at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await login(page);
    await page.goto('/notes/Slice.md');
    const nav = page.locator('[data-site-navigation]');
    const toggle = page.getByRole('button', { name: 'Navigation and controls', exact: true });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.tap();
    await expect(nav).toHaveAttribute('open');
    await expect(page.getByRole('navigation', { name: 'Folder sidebar' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('.cm-content')).toBeFocused();
    await page.locator('.cm-content').focus();
    await page.keyboard.press('Control+End');
    await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeInViewport();
    await expect(toggle).toBeInViewport();
    await expect(page.locator('.persistent-actions button')).toHaveText(['Menu', 'Save', 'Upload image']);
    await expect(page.getByRole('button', { name: 'Format', exact: true })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Vim bindings', exact: true })).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `/tmp/backstory-release-one/reports/task11-${viewport.width}.png`, fullPage: true });
    await revealChrome(page);
    await expect(page.getByRole('button', { name: 'Format', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Vim bindings', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Raw source', exact: true }).click();
    await page.screenshot({ path: `/tmp/backstory-release-one/reports/task11-${viewport.width}-source.png`, fullPage: true });
  });
}
