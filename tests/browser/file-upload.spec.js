import { test, expect } from '@playwright/test';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { runtime } from './support/server.js';
import http from 'node:http';
import { createHash } from 'node:crypto';

const source = '# Attachment journey\n\nKeep this draft.\n';
const raw = Buffer.from([0, 255, 1, 13, 10, 60, 115, 118, 103, 62]);
const filename = '日本語 100% ([x])!.pdf';
const editor = page => page.locator('[data-markdown-editor]');
const read = page => editor(page).evaluate(el => el.markdownEditor.getSource());
async function login(page) {
  await page.goto('/accounts/login/');
  await page.getByLabel('Username').fill('slice');
  await page.getByLabel('Password').fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}
test.beforeAll(async () => {
  await mkdir(`${runtime}/wiki/assets`, { recursive: true });
  await mkdir(`${runtime}/wiki/Nested`, { recursive: true });
  await writeFile(`${runtime}/wiki/Nested/Files.md`, source);
});
for (const width of [390, 1180]) test(`normal exact file upload and explicit draft insertion at ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await login(page);
  await page.goto('/notes/Nested/Files.md');
  await expect(page.locator('[data-editor-stage]')).toHaveAttribute('data-editor-state', 'ready');
  await editor(page).evaluate(el => el.markdownEditor.view.dispatch({ selection: { anchor: 2 } }));
  const before = await read(page);
  await page.locator('.persistent-actions').getByRole('button', { name: 'Upload file', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Upload file', exact: true });
  await dialog.getByLabel('File to upload').setInputFiles({ name: filename, mimeType: 'application/pdf', buffer: raw });
  await dialog.getByRole('button', { name: 'Upload', exact: true }).click();
  await expect(dialog.getByRole('status')).toContainText('File ready');
  expect(await read(page)).toBe(before);
  expect(await readFile(`${runtime}/wiki/Nested/Files.md`, 'utf8')).toBe(source);
  const href = await dialog.getByRole('link', { name: 'Download uploaded file' }).getAttribute('href');
  const response = await page.request.get(href);
  expect(response.headers()['content-type']).toBe('application/octet-stream');
  expect(await response.body()).toEqual(raw);
  const markdown = await dialog.getByLabel('Attachment Markdown').inputValue();
  expect(markdown).toContain('](../assets/file-');
  await expect(dialog.locator('[data-file-upload-path]')).toContainText('assets/file-');
  expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.screenshot({ path: `${runtime}/reports/file-upload-${width}.png` });
  await dialog.getByRole('button', { name: 'Insert into draft', exact: true }).click();
  expect(await read(page)).toBe(before.slice(0, 2) + markdown + before.slice(2));
  await page.keyboard.press('Control+z');
  expect(await read(page)).toBe(before);
  expect(await readFile(`${runtime}/wiki/Nested/Files.md`, 'utf8')).toBe(source);
});
test('upload works from home without a saved note', async ({ page }) => {
  await login(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Upload file', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Upload file', exact: true });
  await dialog.getByLabel('File to upload').setInputFiles({ name: 'empty', mimeType: '', buffer: Buffer.alloc(0) });
  await dialog.getByRole('button', { name: 'Upload', exact: true }).click();
  await expect(dialog.getByRole('status')).toContainText('File ready');
  await expect(dialog.getByRole('button', { name: 'Insert into draft', exact: true })).toBeDisabled();
  const href = await dialog.getByRole('link', { name: 'Download uploaded file' }).getAttribute('href');
  expect((await (await page.request.get(href)).body()).length).toBe(0);
});

test('stale draft is retained and cancelled/lost responses require inspection', async ({ page }) => {
  await login(page); await page.goto('/notes/Nested/Files.md');
  await expect(page.locator('[data-editor-stage]')).toHaveAttribute('data-editor-state', 'ready');
  const trigger = page.locator('.persistent-actions').getByRole('button', { name: 'Upload file', exact: true });
  const dialog = page.getByRole('dialog', { name: 'Upload file', exact: true });
  await trigger.click();
  await dialog.getByLabel('File to upload').setInputFiles({ name: 'lost.bin', mimeType: '', buffer: raw });
  let posts = 0;
  await page.route('**/tools/files/?*', async route => { posts++; await route.fetch(); await route.abort(); }, { times: 1 });
  await dialog.getByRole('button', { name: 'Upload', exact: true }).click();
  await expect(dialog.getByRole('status')).toContainText('uncertain');
  await expect(dialog.getByRole('button', { name: 'Upload', exact: true })).toBeDisabled();
  expect(posts).toBe(1);
  await dialog.getByRole('button', { name: 'Inspect upload status' }).click();
  await expect(dialog.getByRole('status')).toContainText('File ready');
  expect(posts).toBe(1);
  await editor(page).evaluate(el => el.markdownEditor.setSource('Changed unsaved draft\n'));
  await dialog.getByRole('button', { name: 'Insert into draft' }).click();
  await expect(dialog.getByRole('status')).toContainText('draft changed');
  expect(await read(page)).toBe('Changed unsaved draft\n');
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await trigger.click();
  await dialog.getByLabel('File to upload').setInputFiles({ name: 'cancel.bin', mimeType: '', buffer: raw });
  let reached;
  const intercepted = new Promise(resolve => { reached = resolve; });
  await page.route('**/tools/files/?*', async route => { reached(); await new Promise(resolve => setTimeout(resolve, 1000)); await route.abort(); }, { times: 1 });
  await dialog.getByRole('button', { name: 'Upload', exact: true }).click(); await intercepted;
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden(); await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(dialog.getByRole('button', { name: 'Upload', exact: true })).toBeDisabled();
  await dialog.getByRole('button', { name: 'Inspect upload status' }).click();
  await expect(dialog.getByRole('status')).toContainText('No matching file');
  expect(await read(page)).toBe('Changed unsaved draft\n');
});

test('plain fallback keeps native selection and undo for explicit insertion', async ({ page }) => {
  await login(page); await page.goto('/notes/Nested/Files.md');
  await expect(page.locator('[data-editor-stage]')).toHaveAttribute('data-editor-state', 'ready');
  await page.getByRole('button', { name: 'Navigation and controls', exact: true }).click();
  await page.getByRole('button', { name: 'Plain text fallback', exact: true }).click();
  const fallback = page.locator('#source');
  await fallback.fill('Plain unsaved draft');
  await fallback.evaluate(el => el.setSelectionRange(6, 13));
  await page.locator('.persistent-actions').getByRole('button', { name: 'Upload file', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Upload file', exact: true });
  await dialog.getByLabel('File to upload').setInputFiles({ name: 'plain.txt', mimeType: 'text/plain', buffer: raw });
  await dialog.getByRole('button', { name: 'Upload', exact: true }).click();
  await expect(dialog.getByRole('status')).toContainText('File ready');
  const markdown = await dialog.getByLabel('Attachment Markdown').inputValue();
  await dialog.getByRole('button', { name: 'Insert into draft' }).click();
  await expect(fallback).toHaveValue('Plain ' + markdown + ' draft');
  await page.keyboard.press('Control+z');
  await expect(fallback).toHaveValue('Plain unsaved draft');
});

test('WebMCP encoded upload uses real local HTTP without touching draft', async ({ page }) => {
  await page.addInitScript(() => { window.fixtureTools = {}; document.modelContext = { registerTool(tool) { window.fixtureTools[tool.name] = tool; } }; });
  await login(page); await page.goto('/notes/Nested/Files.md');
  await expect(page.locator('[data-editor-stage]')).toHaveAttribute('data-editor-state', 'ready');
  const before = await read(page);
  const result = await page.evaluate(async encoded => JSON.parse(await window.fixtureTools.upload_file.execute({ filename: 'host-fixture.html', data_base64: encoded, note: 'Nested/Files.md' })), raw.toString('base64'));
  expect(['created', 'already_exists']).toContain(result.state);
  expect(result.authoritative).toBe(true);
  const inspected = await page.evaluate(async values => JSON.parse(await window.fixtureTools.inspect_upload.execute(values)), { filename: 'host-fixture.html', sha256: result.sha256 });
  expect(inspected.state).toBe('confirmed');
  expect(await (await page.request.get(result.href)).body()).toEqual(raw);
  expect(await read(page)).toBe(before);
});

test('framed chunked upload without Content-Length round trips in pinned Gunicorn', async ({ page, baseURL }) => {
  test.skip(process.env.BACKSTORY_BROWSER_GUNICORN !== '1', 'Requires the real pinned Gunicorn transport.');
  await login(page); await page.goto('/');
  const csrf = await page.locator('[name=csrfmiddlewaretoken]').inputValue();
  const cookie = (await page.context().cookies()).map(item => `${item.name}=${item.value}`).join('; ');
  const query = new URLSearchParams({ filename: 'chunked.bin', sha256: createHash('sha256').update(raw).digest('hex') });
  const reply = await new Promise((resolve, reject) => {
    const request = http.request(baseURL + '/tools/files/?' + query, { method: 'POST', headers: { Cookie: cookie, 'X-CSRFToken': csrf, 'Content-Type': 'application/octet-stream', 'Transfer-Encoding': 'chunked' } }, response => {
      const chunks = []; response.on('data', chunk => chunks.push(chunk)); response.on('end', () => resolve({ status: response.statusCode, data: JSON.parse(Buffer.concat(chunks)) }));
    });
    request.on('error', reject); request.write(raw.subarray(0, 3)); request.end(raw.subarray(3));
  });
  expect([200, 201]).toContain(reply.status);
  expect(await (await page.request.get(reply.data.href)).body()).toEqual(raw);
});

test('R1 links inserted in an unsaved nested note use its authorized folder', async ({ page }) => {
  await login(page); await page.goto('/new/?folder=Nested');
  await expect(page.locator('[data-editor-stage]')).toHaveAttribute('data-editor-state', 'ready');
  await page.locator('.persistent-actions').getByRole('button', { name: 'Upload file', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Upload file', exact: true });
  await dialog.getByLabel('File to upload').setInputFiles({ name: 'new-note.txt', mimeType: '', buffer: raw });
  await dialog.getByRole('button', { name: 'Upload', exact: true }).click();
  await expect(dialog.getByRole('status')).toContainText('File ready');
  const markdown = await dialog.getByLabel('Attachment Markdown').inputValue();
  expect(markdown).toContain('](../assets/file-');
  await dialog.getByRole('button', { name: 'Insert into draft' }).click();
  expect(await read(page)).toBe(markdown);
  const resolved = await page.request.get('/resolve/?' + new URLSearchParams({ source: 'Nested/New.md', kind: 'markdown', target: markdown.match(/\]\(([^)]+)\)$/)[1] }));
  expect((await resolved.json()).state).toBe('resolved');
  expect(await readFile(`${runtime}/wiki/Nested/Files.md`, 'utf8')).toBe(source);
});

test('R1 retained uncertain upload adopts the current note context on inspection', async ({ page }) => {
  await writeFile(`${runtime}/wiki/RootFiles.md`, '# Root\n');
  await login(page); await page.goto('/notes/Nested/Files.md');
  await expect(page.locator('[data-editor-stage]')).toHaveAttribute('data-editor-state', 'ready');
  await page.locator('.persistent-actions').getByRole('button', { name: 'Upload file', exact: true }).click();
  let dialog = page.getByRole('dialog', { name: 'Upload file', exact: true });
  await dialog.getByLabel('File to upload').setInputFiles({ name: 'cross-note.txt', mimeType: '', buffer: raw });
  await page.route('**/tools/files/?*', async route => { await route.fetch(); await route.abort(); }, { times: 1 });
  await dialog.getByRole('button', { name: 'Upload', exact: true }).click();
  await expect(dialog.getByRole('status')).toContainText('uncertain');
  await page.goto('/notes/RootFiles.md');
  await expect(page.locator('[data-editor-stage]')).toHaveAttribute('data-editor-state', 'ready');
  await page.locator('.persistent-actions').getByRole('button', { name: 'Upload file', exact: true }).click();
  dialog = page.getByRole('dialog', { name: 'Upload file', exact: true });
  await dialog.getByRole('button', { name: 'Inspect upload status' }).click();
  await expect(dialog.getByRole('status')).toContainText('File ready');
  const markdown = await dialog.getByLabel('Attachment Markdown').inputValue();
  expect(markdown).toContain('](assets/file-');
  expect(markdown).not.toContain('](../assets/');
  const resolved = await page.request.get('/resolve/?' + new URLSearchParams({ source: 'RootFiles.md', kind: 'markdown', target: markdown.match(/\]\(([^)]+)\)$/)[1] }));
  expect((await resolved.json()).state).toBe('resolved');
  await dialog.getByRole('button', { name: 'Insert into draft' }).click();
  expect(await read(page)).toBe(markdown + '# Root\n');
  expect(await readFile(`${runtime}/wiki/RootFiles.md`, 'utf8')).toBe('# Root\n');
});
