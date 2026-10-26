import { test, expect } from '@playwright/test';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { runtime } from './support/server.js';

const folder = 'Tree picker #100%';
test.beforeEach(async () => {
  await mkdir(`${runtime}/wiki/${folder}/zebra`, { recursive: true });
  await mkdir(`${runtime}/wiki/${folder}/Alpha`, { recursive: true });
  for (const name of ['zebra.md', 'Beta.md', 'apple.md', '100%#日本語.md']) {
    await writeFile(`${runtime}/wiki/${folder}/${name}`, '# Tree picker\n');
  }
  await writeFile(`${runtime}/wiki/${folder}/Alpha/Child.md`, '# Child\n');
});
test.afterEach(async () => { await rm(`${runtime}/wiki/${folder}`, { recursive: true, force: true }); });

async function login(page) {
  await page.goto('/accounts/login/');
  await page.getByLabel('Username', { exact: true }).fill('slice');
  await page.getByLabel('Password', { exact: true }).fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL('/');
}

for (const width of [1440, 390]) test(`file tree is prominent and expands without leaving an unsaved note at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await login(page);
  await page.goto('/notes/Slice.md');
  const editor = page.locator('[data-markdown-editor]');
  await expect(page.locator('.cm-content')).toBeVisible();
  await editor.evaluate(el => el.markdownEditor.setSource('# Unsaved tree browsing\n'));
  await page.getByRole('button', { name: 'Navigation and controls', exact: true }).click();
  const sidebar = page.getByRole('navigation', { name: 'Folder sidebar' });
  await expect(sidebar.getByRole('heading', { name: 'File tree' })).toBeInViewport();
  const branch = sidebar.locator('details').filter({ has: page.locator('summary', { hasText: folder }) });
  const disclosure = branch.locator(':scope > summary');
  await disclosure.focus();
  await page.keyboard.press('Enter');
  await expect(branch.locator(':scope > ul > li > details > summary')).toHaveText(['Alpha', 'zebra']);
  await expect(branch.locator(':scope > ul > li > a')).toHaveText(['100%#日本語.md', 'apple.md', 'Beta.md', 'zebra.md']);
  const nested = branch.locator(':scope > ul > li > details').filter({ has: page.locator('summary', { hasText: 'Alpha' }) });
  await nested.locator(':scope > summary').click();
  await expect(nested.getByRole('link', { name: 'Child.md', exact: true })).toBeVisible();
  expect(page.url()).toContain('/notes/Slice.md');
  expect(await editor.evaluate(el => el.markdownEditor.getSource())).toBe('# Unsaved tree browsing\n');
  await expect(sidebar.getByRole('link', { name: 'Slice.md', exact: true })).toHaveAttribute('aria-current', 'page');
  await disclosure.click();
  await expect(branch.locator(':scope > ul')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await disclosure.click();
  await page.screenshot({ path: `/tmp/backstory-release-one/reports/file-tree-${width}.png` });
});

test('file tree on folder pages opens nested notes with literal filenames', async ({ page }) => {
  await login(page);
  await page.goto('/?' + new URLSearchParams({ folder }));
  const sidebar = page.getByRole('navigation', { name: 'Folder sidebar' });
  await expect(sidebar.getByRole('link', { name: '100%#日本語.md', exact: true })).toBeVisible();
  await sidebar.getByRole('link', { name: '100%#日本語.md', exact: true }).click();
  await expect(page.locator('[data-note-title]')).toHaveText(`${folder}/100%#日本語.md`);
});

test('file tree reloads changed folders and appends later pages in order', async ({ page }) => {
  const paged = `${runtime}/wiki/${folder}/Paged`;
  await mkdir(paged);
  for (let index = 104; index >= 0; index--) {
    await writeFile(`${paged}/note-${String(index).padStart(3, '0')}.md`, '# Paged note\n');
  }
  await login(page);
  await page.goto('/?' + new URLSearchParams({ folder: `${folder}/Paged` }));
  const sidebar = page.getByRole('navigation', { name: 'Folder sidebar' });
  const branch = sidebar.locator('summary').filter({ hasText: /^Paged$/ }).locator('..');
  const files = branch.locator(':scope > ul > li > a');
  await expect(files).toHaveCount(100);
  await expect(files.first()).toHaveText('note-000.md');
  await expect(files.last()).toHaveText('note-099.md');
  // A changed directory invalidates the old page cursor; reload must discard
  // its old rows before appending the freshly sorted first and second pages.
  await writeFile(`${paged}/aaa.md`, '# Added after the first page\n');
  await branch.locator(':scope > button').click();
  await expect(branch.locator(':scope > button')).toHaveText('Reload folder');
  await branch.locator(':scope > button').click();
  await expect(files).toHaveCount(100);
  await expect(files.first()).toHaveText('aaa.md');
  await branch.locator(':scope > button').click();
  await expect(files).toHaveCount(106);
  await expect(files.last()).toHaveText('note-104.md');
  await expect(branch.locator(':scope > button')).toBeHidden();
});
