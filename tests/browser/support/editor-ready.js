import { expect } from '@playwright/test';

// A paused Playwright clock freezes requestAnimationFrame too. Allow startup's
// real layout/paint work to finish before testing idle timers with time frozen.
// This advances only until readiness; it does not change production barriers.
export async function settleEditorWithClock(page) {
  await expect.poll(async () => {
    await page.clock.runFor(32);
    return page.locator('[data-editor-stage]').getAttribute('data-editor-state');
  }, { message: 'initial editor rendering finishes with animation frames enabled' }).toBe('ready');
}
