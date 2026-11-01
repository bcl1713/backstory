import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { runtime } from './support/server.js';
// Synthetic 4×4 blue PNG, generated with Pillow.
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAFElEQVR4nGN06TjDAANMDEgANwcAUCwBoBbl4KYAAAAASUVORK5CYII=', 'base64');
const source = '# Upload test\n\nRetain this draft.\n';
const host = page => page.locator('[data-markdown-editor]');
const read = page => host(page).evaluate(el => el.markdownEditor.getSource());
test.beforeAll(async () => {
  await mkdir(`${runtime}/wiki/assets`, { recursive: true });
  await writeFile(`${runtime}/wiki/Upload.md`, source);
});
async function open(page) {
  await page.goto('/accounts/login/');
  await page.getByLabel('Username').fill('slice');
  await page.getByLabel('Password').fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.goto('/notes/Upload.md');
  await expect(page.locator('[data-editor-stage]')).toHaveAttribute('data-editor-state', 'ready');
  await page.getByRole('button', { name: 'Navigation and controls', exact: true }).click();
  await page.getByRole('button', { name: 'Upload image', exact: true }).click();
}
for (const width of [390, 1180]) test(`image upload is explicit and preserves draft at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await open(page);
  const dialog = page.getByRole('dialog', { name: 'Upload image' });
  await dialog.getByLabel('Image file').setInputFiles({ name: 'sample.png', mimeType: 'image/png', buffer: png });
  await dialog.getByRole('button', { name: 'Upload', exact: true }).click();
  await expect(dialog.getByRole('status')).toContainText('Image ready');
  expect(await read(page)).toBe(source);
  await page.screenshot({ path: `${runtime}/reports/image-upload-${width}.png` });
  await dialog.getByRole('button', { name: 'Insert into draft' }).click();
  await expect(dialog).not.toBeVisible();
  expect(await read(page)).toContain('![](assets/upload-');
  expect(await read(page)).toContain(source);
});

test('changed draft is retained and Escape restores keyboard focus', async ({ page }) => {
  await open(page);
  const dialog = page.getByRole('dialog', { name: 'Upload image' });
  await dialog.getByLabel('Image file').setInputFiles({ name: 'sample.png', mimeType: 'image/png', buffer: png });
  await dialog.getByRole('button', { name: 'Upload', exact: true }).click();
  await expect(dialog.getByRole('status')).toContainText('Image ready');
  await host(page).evaluate(el => el.markdownEditor.setSource('Changed draft\n'));
  await dialog.getByRole('button', { name: 'Insert into draft' }).click();
  await expect(dialog.getByRole('status')).toContainText('draft changed');
  expect(await read(page)).toBe('Changed draft\n');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Upload image', exact: true })).toBeFocused();
});

test('unknown network outcome permits same-file retry without changing source', async ({ page }) => {
  await open(page);
  const dialog = page.getByRole('dialog', { name: 'Upload image' });
  await dialog.getByLabel('Image file').setInputFiles({ name: 'sample.png', mimeType: 'image/png', buffer: png });
  await page.route('**/tools/images/**', route => route.abort(), { times: 1 });
  await dialog.getByRole('button', { name: 'Upload', exact: true }).click();
  await expect(dialog.getByRole('status')).toContainText('outcome is unknown');
  expect(await read(page)).toBe(source);
  await dialog.getByRole('button', { name: 'Upload', exact: true }).click();
  await expect(dialog.getByRole('status')).toContainText('Image ready');
  expect(await read(page)).toBe(source);
});

test('plain text fallback inserts only after explicit action and retains draft', async ({ page }) => {
  await open(page);
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByRole('button', { name: 'Plain text fallback', exact: true }).click();
  await page.locator('#source').fill('Plain unsaved draft');
  await page.getByRole('button', { name: 'Upload image', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Upload image' });
  await dialog.getByLabel('Image file').setInputFiles({ name: 'sample.png', mimeType: 'image/png', buffer: png });
  await dialog.getByRole('button', { name: 'Upload', exact: true }).click();
  await expect(dialog.getByRole('status')).toContainText('Image ready');
  await expect(page.locator('#source')).toHaveValue('Plain unsaved draft');
  await dialog.getByRole('button', { name: 'Insert into draft' }).click();
  await expect(page.locator('#source')).toHaveValue(/Plain unsaved draft\n\n!\[\]\(assets\/upload-/);
  await expect(page.locator('#source')).toBeFocused();
});

test('note in assets receives its sibling image Markdown', async ({ page }) => {
  await writeFile(`${runtime}/wiki/assets/Upload.md`, source);
  await open(page);
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  await page.goto('/notes/assets/Upload.md');
  await expect(page.locator('[data-editor-stage]')).toHaveAttribute('data-editor-state', 'ready');
  const trigger = page.getByRole('button', { name: 'Upload image', exact: true });
  if (!await trigger.isVisible()) await page.getByRole('button', { name: 'Navigation and controls', exact: true }).click();
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Image file').setInputFiles({ name: 'sample.png', mimeType: 'image/png', buffer: png });
  await dialog.getByRole('button', { name: 'Upload', exact: true }).click();
  await expect(dialog.getByRole('status')).toContainText('Image ready');
  await expect(dialog.getByLabel('Image Markdown')).toHaveValue(/^!\[\]\(upload-/);
});

test('stalled upload can be cancelled without losing draft', async ({ page }) => {
  await open(page);
  const dialog = page.getByRole('dialog');
  let reached;
  const intercepted = new Promise(resolve => { reached = resolve; });
  await page.route('**/tools/images/**', async route => { reached(); await new Promise(resolve => setTimeout(resolve, 3000)); await route.abort(); });
  await dialog.getByLabel('Image file').setInputFiles({ name: 'sample.png', mimeType: 'image/png', buffer: png });
  await dialog.getByRole('button', { name: 'Upload', exact: true }).click();
  await intercepted;
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible({ timeout: 1000 });
  expect(await read(page)).toBe(source);
  await expect(page.getByRole('button', { name: 'Upload image', exact: true })).toBeFocused();
});
