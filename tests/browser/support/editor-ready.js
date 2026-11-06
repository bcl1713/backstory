import { expect } from '@playwright/test';

// focus() and evaluate() can reach CodeMirror while initial rendering still
// hides it. Keyboard workflows must wait for the enhanced editor to be usable.
export async function waitForEnhancedEditor(page) {
  await expect(page.locator('[data-editor-stage]')).toHaveAttribute('data-editor-state', 'ready');
  await expect(page.locator('[data-markdown-editor] .cm-content')).toBeVisible();
}

// A paused Playwright clock freezes requestAnimationFrame too. Allow startup's
// real layout/paint work to finish before testing idle timers with time frozen.
// This advances only until readiness; it does not change production barriers.
export async function settleEditorWithClock(page) {
  await expect.poll(async () => {
    await page.clock.runFor(32);
    return page.locator('[data-editor-stage]').getAttribute('data-editor-state');
  }, { message: 'initial editor rendering finishes with animation frames enabled' }).toBe('ready');
}
