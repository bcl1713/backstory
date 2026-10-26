import { revealChrome } from './support/chrome.js';
import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { runtime } from './support/server.js';

async function login(page) {
  await page.goto('/accounts/login/');
  await page.getByLabel('Username').fill('slice');
  await page.getByLabel('Password').fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}
const editor = page => page.locator('[data-markdown-editor]');

test('loading is distinct from ready and each presentation reports the actual visible editor', async ({ page }) => {
  await login(page);
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/static/editor.js', async route => { await gate; await route.continue(); });
  await page.goto('/notes/Slice.md', { waitUntil: 'commit' });
  await expect(page.locator('[data-editor-readiness]')).toContainText('Loading');
  await expect(page.getByLabel('Markdown source (plain text fallback)')).toBeVisible();
  const loadingSource = await page.getByLabel('Markdown source (plain text fallback)').inputValue();
  await page.getByLabel('Markdown source (plain text fallback)').fill(loadingSource + 'Edited during startup\n');
  release();
  await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');
  expect(await editor(page).evaluate(el => el.markdownEditor.getSource())).toContain('Edited during startup');
  for (const [button, other] of [['Raw source', 'Live preview'], ['Plain text fallback', 'Raw source'], ['Live preview', 'Plain text fallback']]) {
    await revealChrome(page);
    await page.getByRole('button', { name: button, exact: true }).click();
    await revealChrome(page);
    await expect(page.getByRole('button', { name: button, exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: other, exact: true })).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('[data-editor-readiness]')).toContainText(button);
    await revealChrome(page);
    await expect(page.getByLabel('Markdown source (plain text fallback)')).toBeVisible({ visible: button === 'Plain text fallback' });
  }
});

test('whole-document source exposes the end of a long note and preserves unsaved edits through all modes', async ({ page }) => {
  const source = '---\ntitle: Long source\n---\n# Beginning\n\n' + 'Full source line\n'.repeat(3000) + '\nEND_OF_WHOLE_SOURCE\n';
  await writeFile(`${runtime}/wiki/WholeSource.md`, source);
  await login(page);
  await page.goto('/notes/WholeSource.md');
  await revealChrome(page);
  await page.getByRole('button', { name: 'Plain text fallback', exact: true }).click();
  const plain = page.getByLabel('Markdown source (plain text fallback)');
  await expect(page.getByText('Complete document source', { exact: true })).toBeVisible();
  expect(await plain.inputValue()).toBe(source);
  await expect(plain).toBeEditable();
  await plain.press('Control+End');
  await page.keyboard.insertText('Unsaved final line\n');
  await revealChrome(page);
  await page.getByRole('button', { name: 'Raw source', exact: true }).click();
  expect(await editor(page).evaluate(el => el.markdownEditor.getSource())).toBe(source + 'Unsaved final line\n');
  await revealChrome(page);
  await page.getByRole('button', { name: 'Live preview', exact: true }).click();
  await revealChrome(page);
  await page.getByRole('button', { name: 'Plain text fallback', exact: true }).click();
  expect(await plain.inputValue()).toBe(source + 'Unsaved final line\n');
  await expect(page.locator('[data-editor-status]')).toContainText('Unsaved changes');
});

for (const [timezoneId, expectedDate] of [['Pacific/Kiritimati', '2026-10-27'], ['America/Adak', '2026-10-26']]) {
  test(`Today uses the explicit browser date in ${timezoneId}`, async ({ browser }) => {
    const context = await browser.newContext({ timezoneId });
    const page = await context.newPage();
    await page.clock.setFixedTime(new Date('2026-10-26T23:30:00Z'));
    await writeFile(`${runtime}/wiki/${expectedDate}.md`, '# Existing today\n');
    await login(page);
    await page.goto('/notes/Slice.md');
    await expect(page.locator('[data-today-context]')).toContainText(timezoneId);
    await expect(page.locator('[data-today-context]')).toContainText(expectedDate);
    await revealChrome(page);
    await expect(page.getByRole('link', { name: 'Today', exact: true })).toHaveAttribute('href', `/notes/${expectedDate}.md`);
    await revealChrome(page);
    await page.getByRole('link', { name: 'Today', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/notes/${expectedDate}.md$`));
    await context.close();
  });
}
