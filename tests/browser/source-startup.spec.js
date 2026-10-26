import { test, expect } from '@playwright/test';
import { writeFile, readFile, rm } from 'node:fs/promises';
import { runtime } from './support/server.js';
import { revealChrome } from './support/chrome.js';

async function login(page, path) {
  await page.goto('/accounts/login/');
  await page.getByLabel('Username').fill('slice');
  await page.getByLabel('Password').fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.goto(`/notes/${path}`);
  await page.waitForFunction(() => Boolean(document.querySelector('[data-markdown-editor]')?.markdownEditor));
}
for (const [name, source] of [['LF', '\n# Leading blank\n'], ['mixed', '\r\n# Heading\n\r\nBody\rFinal\n']]) {
  test(`opening a ${name} note with a leading blank line retains exact source`, async ({ page }) => {
    const path = `Leading-${name}.md`;
    await writeFile(`${runtime}/wiki/${path}`, source);
    await login(page, path);
    const read = () => page.locator('[data-markdown-editor]').evaluate(el => el.markdownEditor.getSource());
    expect(await read()).toBe(source);
    await expect(page.locator('[data-editor-status]')).toHaveText('Unchanged');
    await revealChrome(page);
    await page.getByRole('button', { name: 'Plain text fallback', exact: true }).click();
    expect(await page.getByLabel('Markdown source (plain text fallback)').inputValue()).toBe(source.replace(/\r\n|\r/g, '\n'));
    await page.getByRole('button', { name: 'Live preview', exact: true }).click();
    expect(await read()).toBe(source);
    expect(await readFile(`${runtime}/wiki/${path}`, 'utf8')).toBe(source);
  });
}

test('repeated links do not consume the distinct destination limit', async ({ page }) => {
  const source = '# Cursor\n\n' + '[[Other]] '.repeat(200) + '\n\n[[Slice|Second destination]]\n';
  await writeFile(`${runtime}/wiki/RepeatedLinks.md`, source);
  await login(page, 'RepeatedLinks.md');
  await expect(page.locator('[data-markdown-editor]').getByRole('link', { name: 'Second destination', exact: true })).toHaveAttribute('href', '/notes/Slice.md');
});

test('reopening navigation refreshes a Today note created later on the same day', async ({ page }) => {
  await rm(`${runtime}/wiki/2026-11-12.md`, { force: true });
  await page.clock.setFixedTime(new Date('2026-11-12T12:00:00Z'));
  await login(page, 'Slice.md');
  await revealChrome(page);
  await expect(page.locator('[data-today-result]')).toContainText('No note was created');
  await page.getByRole('button', { name: 'Navigation and controls', exact: true }).click();
  await writeFile(`${runtime}/wiki/2026-11-12.md`, '# Created later\n');
  await revealChrome(page);
  await expect(page.getByRole('link', { name: 'Today', exact: true })).toHaveAttribute('href', '/notes/2026-11-12.md');
});

test('arrow keys enter a rendered link line and reveal editable source', async ({ page }) => {
  const source = '# Cursor\n\n[[Other|Clickable label]]\n';
  await writeFile(`${runtime}/wiki/ArrowLink.md`, source);
  await login(page, 'ArrowLink.md');
  await expect(page.getByRole('link', { name: 'Clickable label', exact: true })).toBeVisible();
  await page.locator('[data-markdown-editor]').evaluate(el => {
    el.markdownEditor.view.dispatch({ selection: { anchor: 9 } });
    el.markdownEditor.focus();
  });
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('.cm-content')).toContainText('[[Other|Clickable label]]');
  await expect(page.getByRole('link', { name: 'Clickable label', exact: true })).toHaveCount(0);
});
