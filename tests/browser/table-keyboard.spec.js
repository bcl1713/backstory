import { test, expect } from '@playwright/test';

const source = 'Before\n\n| Name | Value |\n| --- | --- |\n| unchanged | 7 |\n\nAfter';
const host = page => page.locator('[data-markdown-editor]');

for (const vim of [false, true]) {
  for (const direction of ['down', 'up']) {
    test(`${vim ? 'Vim Normal' : 'ordinary arrows'} enters a rendered table ${direction} without a mouse`, async ({ page }) => {
      await page.goto('/accounts/login/');
      await page.getByLabel('Username').fill('slice');
      await page.getByLabel('Password').fill('synthetic-slice-browser-only');
      await page.getByRole('button', { name: 'Sign in' }).click();
      await page.goto('/notes/TableKeyboard.md');
      await host(page).evaluate((el, vim) => el.markdownEditor.setVimEnabled(vim), vim);
      await page.locator('.cm-content').focus();
      // Navigate from the document edge with actual keys. Direct selection
      // dispatch into the table would miss a layout-driven navigation skip.
      if (vim) await page.keyboard.type(direction === 'down' ? 'gg' : 'G');
      else await page.keyboard.press(direction === 'down' ? 'Control+Home' : 'Control+End');
      await expect(page.locator('.lp-table')).toHaveCount(1);
      const key = vim ? (direction === 'down' ? 'j' : 'k') : (direction === 'down' ? 'ArrowDown' : 'ArrowUp');
      await page.keyboard.press(key);
      await page.keyboard.press(key);
      const cursor = await host(page).evaluate(el => el.markdownEditor.view.state.selection.main.head);
      expect(cursor).toBeGreaterThanOrEqual(source.indexOf('| Name'));
      expect(cursor).toBeLessThanOrEqual(source.indexOf('\n\nAfter'));
      await expect(page.locator('.lp-table')).toHaveCount(0);
      expect(await host(page).evaluate(el => el.markdownEditor.getSource())).toBe(source);
    });
  }
}
