import { test, expect } from '@playwright/test';

async function login(page) {
  await page.goto('/accounts/login/');
  await page.getByLabel('Username').fill('slice');
  await page.getByLabel('Password').fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}

for (const width of [1180, 390]) {
  test(`closed navigation never paints while shell is delayed at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await login(page);
    // Abort the enhancement bundles: assertions cannot accidentally wait until
    // shell.js has hidden a sidebar that was visible during the initial paint.
    await page.route(/\/static\/(shell|editor)\.[^/]*js|\/static\/(shell|editor)\.js/, route => route.abort());
    for (const path of ['/notes/Slice.md', '/notes/Other.md']) {
      await page.goto(path);
      await expect(page.locator('body')).not.toHaveClass(/zen-enabled/);
      await expect(page.locator('#site-navigation')).toBeHidden();
      await expect(page.locator('#source')).toBeVisible();
      await expect(page.locator('[data-navigation-fallback]')).toBeVisible();
      await expect(page.locator('[data-navigation-fallback]')).toHaveAttribute('href', '/?folder=');
    }
    await page.reload();
    await expect(page.locator('#site-navigation')).toBeHidden();
    await page.goBack();
    await expect(page.locator('#site-navigation')).toBeHidden();
    await page.goForward();
    await expect(page.locator('#site-navigation')).toBeHidden();
    await page.unrouteAll();
    await page.reload();
    const menu = page.getByRole('button', { name: 'Navigation and controls', exact: true });
    await expect(page.locator('[data-navigation-fallback]')).toBeHidden();
    await menu.click();
    await expect(page.locator('#site-navigation')).toBeVisible();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(page.locator('#site-navigation')).toBeHidden();
  });
}

test('without JavaScript navigation and source remain available', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await login(page);
  await page.goto('/notes/Slice.md');
  await expect(page.getByRole('link', { name: 'Search', exact: true })).toBeVisible();
  await expect(page.locator('#source')).toBeVisible();
  await expect(page.locator('[data-zen-toggle]')).toBeHidden();
  await context.close();
});

test('delayed shell initializes with chrome still closed', async ({ page }) => {
  await login(page);
  let release;
  const ready = new Promise(resolve => { release = resolve; });
  await page.route(/\/static\/shell(?:\.[^/]*)?\.js/, async route => {
    await ready;
    await route.continue();
  });
  await page.goto('/notes/Slice.md', { waitUntil: 'commit' });
  await expect(page.locator('#source')).toBeAttached();
  await expect(page.locator('#site-navigation')).toBeHidden();
  await expect(page.locator('[data-navigation-fallback]')).toBeVisible();
  release();
  const menu = page.getByRole('button', { name: 'Navigation and controls', exact: true });
  await expect(menu).toBeVisible();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#site-navigation')).toBeHidden();
  await expect(page.locator('[data-navigation-fallback]')).toBeHidden();
  await menu.click();
  await expect(page.locator('#site-navigation')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Backstory', exact: true })).toBeFocused();
});
