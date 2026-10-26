import { test, expect } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { runtime } from './support/server.js';
import { revealChrome } from './support/chrome.js';

test.setTimeout(90000);

async function login(page) {
  await page.goto('/accounts/login/');
  await page.getByLabel('Username').fill('slice');
  await page.getByLabel('Password').fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL('/');
}

async function fixture() {
  const root = `Move-${randomUUID()}`;
  await mkdir(`${runtime}/wiki/${root}/Active`, { recursive: true });
  await mkdir(`${runtime}/wiki/${root}/Archives`);
  await writeFile(`${runtime}/wiki/${root}/Active/Project.md`, '# Project\n');
  await writeFile(`${runtime}/wiki/${root}/Index.md`, `# Active\n[[${root}/Active/Project|Project alias]]\n`);
  return root;
}

test('folder archival previews exact link changes and refreshes navigation', async ({ page }) => {
  const root = await fixture();
  await login(page);
  await page.goto('/?' + new URLSearchParams({ folder: `${root}/Active` }));
  await page.getByRole('link', { name: 'Move / Rename this folder' }).click();
  await page.getByLabel('Destination path').fill(`${root}/Archives/Project`);
  await page.getByRole('button', { name: 'Preview move', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Source inventory' })).toContainText('Project.md');
  await expect(page.getByRole('region', { name: 'Reviewed link updates' })).toContainText(`${root}/Archives/Project/Project`);
  expect(await readFile(`${runtime}/wiki/${root}/Active/Project.md`, 'utf8')).toBe('# Project\n');
  await page.getByRole('button', { name: 'Confirm move and link updates' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'completed' })).toBeVisible();
  expect(await readFile(`${runtime}/wiki/${root}/Index.md`, 'utf8')).toBe(`# Active\n[[${root}/Archives/Project/Project|Project alias]]\n`);
  await page.getByRole('link', { name: 'Open destination', exact: true }).click();
  await expect(page.getByRole('navigation', { name: 'Folder', exact: true }).getByRole('link', { name: 'Project.md', exact: true })).toBeVisible();
});

test('unsaved note draft blocks its move entry point without discarding editor history', async ({ page }) => {
  const root = await fixture();
  await login(page);
  await page.goto(`/notes/${root}/Active/Project.md`);
  const editor = page.locator('[data-markdown-editor]');
  await expect.poll(() => editor.evaluate(el => Boolean(el.markdownEditor))).toBe(true);
  await editor.evaluate(el => el.markdownEditor.setSource('# My unsaved draft\n'));
  await revealChrome(page);
  let dialogs = 0;
  page.on('dialog', async dialog => { dialogs++; await dialog.dismiss(); });
  await page.getByRole('link', { name: 'Move / Rename this note', exact: true }).click();
  await expect(page.locator('[data-editor-status]')).toContainText('Save or store');
  expect(dialogs).toBe(0);
  expect(await editor.evaluate(el => el.markdownEditor.getSource())).toBe('# My unsaved draft\n');
  await editor.locator('.cm-content').focus();
  await page.keyboard.press('Control+z');
  expect(await editor.evaluate(el => el.markdownEditor.getSource())).toBe('# Project\n');
  await revealChrome(page);
  await page.getByRole('link', { name: 'Move / Rename this note', exact: true }).click();
  await expect(page.getByLabel('Source path')).toHaveValue(`${root}/Active/Project.md`);
});

test('an open editor retains unsaved source and cannot recreate the old path after a move', async ({ page, context }) => {
  const root = await fixture();
  await login(page);
  await page.goto(`/notes/${root}/Active/Project.md`);
  const editor = page.locator('[data-markdown-editor]');
  await expect.poll(() => editor.evaluate(el => Boolean(el.markdownEditor))).toBe(true);
  await editor.evaluate(el => el.markdownEditor.setSource('# Draft from another tab\n'));
  const mover = await context.newPage();
  await mover.goto('/move/?' + new URLSearchParams({ source: `${root}/Active/Project.md` }));
  await mover.getByLabel('Destination path').fill(`${root}/Archives/Project.md`);
  await mover.getByRole('button', { name: 'Preview move', exact: true }).click();
  await mover.getByRole('button', { name: 'Confirm move and link updates' }).click();
  await page.bringToFront();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('[data-sync-message]')).toContainText('deleted or moved');
  await expect(page.locator('[data-editor-status]')).toContainText('Draft retained');
  expect(await editor.evaluate(el => el.markdownEditor.getSource())).toBe('# Draft from another tab\n');
  expect(await readFile(`${runtime}/wiki/${root}/Archives/Project.md`, 'utf8')).toBe('# Project\n');
  await mover.close();
});
