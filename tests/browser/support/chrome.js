// Existing workflows explicitly reveal the controls hidden by default in Zen.
export async function revealChrome(page) {
  await page.waitForLoadState('domcontentloaded');
  const toggle = page.locator('[data-zen-toggle]');
  if (await toggle.isVisible() && await toggle.getAttribute('aria-expanded') === 'false') await toggle.click();
}
