import { test, expect } from '@playwright/test';
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { runtime } from './support/server.js';

const source = '# Link source\n\n[[CreateLinks/New#Details|Create target]]\n\n[[CreateShared|Choose target]]\n';
const editor = page => page.locator('[data-markdown-editor]');
const read = page => editor(page).evaluate(el => el.markdownEditor.getSource());
const missing = page => page.locator('.lp-link-missing').filter({ hasText: 'Create target' });
function reindex() {
  const env = { ...process.env, DJANGO_SETTINGS_MODULE: 'backstory.settings', BACKSTORY_WIKI_ROOT: `${runtime}/wiki`, BACKSTORY_DATA_DIR: `${runtime}/data`, BACKSTORY_IDENTITY_PATH: '.backstory-marker', BACKSTORY_COOKIE_MODE: 'localhost', BACKSTORY_ALLOWED_HOSTS: 'localhost,127.0.0.1' };
  const result = spawnSync('.venv/bin/python', ['-c', "import django; django.setup(); from indexing.queue import request_scan; from indexing.worker import run_batch; request_scan('rebuild')\nfor n in range(1000):\n r=run_batch(now=10000000000+n*400)\n if not r.pending: break\nelse: raise SystemExit(9)"], { env, encoding: 'utf8' });
  expect(result.status, result.stderr).toBe(0);
}
async function open(page) {
  await page.goto('/accounts/login/');
  await page.getByLabel('Username').fill('slice');
  await page.getByLabel('Password').fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.goto('/notes/CreateSource.md');
  await expect(missing(page)).toBeVisible();
}
async function draft(page) {
  await editor(page).evaluate(el => el.markdownEditor.view.dispatch({ changes: { from: 0, insert: 'Draft ' } }));
  return read(page);
}
async function create(page) {
  await expect(page.locator('#note-filename')).toHaveValue('New.md');
  await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');
  await editor(page).evaluate(el => el.markdownEditor.setSource('# New\n\n## Details\n\nCreated from a link.\n'));
  await page.getByRole('button', { name: 'Create note', exact: true }).click();
}

test.beforeEach(async () => {
  await mkdir(`${runtime}/wiki/CreateLinks`, { recursive: true });
  await writeFile(`${runtime}/wiki/CreateSource.md`, source);
  await rm(`${runtime}/wiki/CreateLinks/New.md`, { force: true });
  for (const folder of ['CreateA', 'CreateB']) {
    await mkdir(`${runtime}/wiki/${folder}`, { recursive: true });
    await writeFile(`${runtime}/wiki/${folder}/Target.md`, '---\naliases: [CreateShared]\n---\n# Target\n');
  }
  reindex();
});

test('keyboard creates through the existing editor and original link opens the new note', async ({ page }) => {
  await open(page);
  await missing(page).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/new\/link\//);
  await expect(page.locator('#note-filename')).toHaveValue('New.md');
  await expect(async () => readFile(`${runtime}/wiki/CreateLinks/New.md`)).rejects.toThrow();
  await create(page);
  await expect(page).toHaveURL(/\/notes\/CreateLinks\/New.md#preview-details$/);
  await expect.poll(() => editor(page).evaluate(el => {
    const api = el.markdownEditor;
    return api.view.state.selection.main.head === api.getSource().indexOf('## Details');
  })).toBe(true);
  await expect(page.locator('[data-editor-status]')).toContainText('Saved.');
  expect(await readFile(`${runtime}/wiki/CreateSource.md`, 'utf8')).toBe(source);
  await page.goto('/notes/CreateSource.md');
  const link = page.getByRole('link', { name: 'Create target', exact: true });
  await expect(link).toHaveAttribute('href', '/notes/CreateLinks/New.md#preview-details');
  await link.click();
  await expect(page).toHaveURL(/\/notes\/CreateLinks\/New.md#preview-details$/);
});

test('mobile activation and rendered preview offer explicit creation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  await missing(page).tap();
  await expect(page.locator('#note-filename')).toHaveValue('New.md');
  await page.goto('/preview/CreateSource.md');
  await page.getByRole('link', { name: /Create target.*Create note/ }).tap();
  await expect(page.locator('#note-filename')).toHaveValue('New.md');
});

test('ambiguous alias asks for an existing destination or an explicit new path', async ({ page }) => {
  await open(page);
  await page.locator('.lp-link-ambiguous').click();
  await expect(page.getByRole('link', { name: 'CreateA/Target.md', exact: true })).toHaveAttribute('href', '/notes/CreateA/Target.md');
  await expect(page.getByRole('link', { name: 'CreateB/Target.md', exact: true })).toBeVisible();
  await expect(page.locator('#note-filename')).toHaveCount(0);
  await page.getByLabel('New note path', { exact: true }).fill('CreateLinks/Explicit.md');
  await page.getByRole('button', { name: 'Continue to Create Note' }).click();
  await expect(page.locator('#note-filename')).toHaveValue('Explicit.md');
});

test('dirty source and undo history stay in the original tab while creating the linked note', async ({ page }) => {
  await open(page);
  const retained = await draft(page);
  const popupEvent = page.waitForEvent('popup');
  await missing(page).click();
  const popup = await popupEvent;
  await create(popup);
  await expect(popup).toHaveURL(/\/notes\/CreateLinks\/New.md#preview-details$/);
  await page.bringToFront();
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByRole('link', { name: 'Create target', exact: true })).toHaveAttribute('href', '/notes/CreateLinks/New.md#preview-details');
  expect(await read(page)).toBe(retained);
  await editor(page).locator('.cm-content').focus();
  await page.keyboard.press('Control+z');
  expect(await read(page)).toBe(source);
  await popup.close();
});

test('blocked popup retains the source and offers an explicit new-tab link', async ({ page }) => {
  await open(page);
  const retained = await draft(page);
  await page.evaluate(() => { window.open = () => null; });
  await missing(page).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/notes\/CreateSource.md$/);
  expect(await read(page)).toBe(retained);
  await expect(page.locator('[data-linked-note-new-tab]')).toHaveAttribute('target', '_blank');
  await expect(page.locator('[data-editor-status]')).toContainText('draft');
});

test('a creation collision offers Open without adopting an overwrite revision', async ({ page }) => {
  await open(page);
  await missing(page).click();
  await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');
  await editor(page).evaluate(el => el.markdownEditor.setSource('# My retained creation draft\n'));
  await writeFile(`${runtime}/wiki/CreateLinks/New.md`, '# Other writer\n');
  await page.getByRole('button', { name: 'Create note', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Open existing note', exact: true })).toHaveAttribute('href', '/notes/CreateLinks/New.md#preview-details');
  await expect(page.locator('[data-conflict]')).toBeHidden();
  expect(await read(page)).toBe('# My retained creation draft\n');
  await page.getByRole('button', { name: 'Create note', exact: true }).click();
  expect(await readFile(`${runtime}/wiki/CreateLinks/New.md`, 'utf8')).toBe('# Other writer\n');
});

test('successful creation reports indexing delay separately', async ({ page }) => {
  await open(page);
  await missing(page).click();
  await page.route('**/save/CreateLinks/New.md', async route => {
    const response = await route.fetch();
    const result = await response.json();
    await route.fulfill({ response, json: { ...result, state: 'saved_index_delayed' } });
  });
  await create(page);
  await expect(page).toHaveURL(/\/notes\/CreateLinks\/New.md#preview-details$/);
  await expect(page.locator('[data-editor-status]')).toContainText('Saved. Discovery update delayed.');
  expect(await readFile(`${runtime}/wiki/CreateLinks/New.md`, 'utf8')).toContain('Created from a link.');
});

test('focus refresh ignores a late missing result from before creation', async ({ page }) => {
  await open(page);
  let release, started;
  const gate = new Promise(resolve => { release = resolve; });
  const waiting = new Promise(resolve => { started = resolve; });
  let held = false;
  await page.route('**/resolve/**', async route => {
    const target = new URL(route.request().url()).searchParams.get('target');
    if (!held && target === 'CreateLinks/New#Details|Create target') {
      held = true;
      const response = await route.fetch();
      started();
      await gate;
      await route.fulfill({ response });
    } else await route.continue();
  });
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await waiting;
  await writeFile(`${runtime}/wiki/CreateLinks/New.md`, '# External creation\n');
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  const link = page.getByRole('link', { name: 'Create target', exact: true });
  await expect(link).toHaveAttribute('href', '/notes/CreateLinks/New.md#preview-details');
  release();
  await expect(link).toHaveAttribute('href', '/notes/CreateLinks/New.md#preview-details');
  expect(await read(page)).toBe(source);
});


test('creation immediately resolves links within the newly saved editor', async ({ page }) => {
  await open(page);
  await missing(page).click();
  await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');
  await editor(page).evaluate(el => el.markdownEditor.setSource('# New\n\n[[Other|Existing target]]\n'));
  await expect(page.locator('.lp-link-unavailable').filter({ hasText: 'Existing target' })).toBeVisible();
  await page.getByRole('button', { name: 'Create note', exact: true }).click();
  await expect(page).toHaveURL(/\/notes\/CreateLinks\/New.md#preview-details$/);
  await expect(page.locator('a.lp-link-resolved').filter({ hasText: 'Existing target' })).toHaveAttribute('href', '/notes/Other.md');
});


test('linked creation preserves literal whitespace in the offered filename', async ({ page }) => {
  await rm(`${runtime}/wiki/ Leading space.md`, { force: true });
  await rm(`${runtime}/wiki/Leading space.md`, { force: true });
  const original = source + '\n[[ Leading space|Literal label]]\n';
  await writeFile(`${runtime}/wiki/CreateSource.md`, original);
  reindex();
  await open(page);
  await page.getByRole('link', { name: /Literal label.*Create note/ }).click();
  await expect(page.locator('#note-filename')).toHaveValue(' Leading space.md');
  await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');
  await editor(page).evaluate(el => el.markdownEditor.setSource('# Literal filename\n'));
  await page.getByRole('button', { name: 'Create note', exact: true }).click();
  await expect(page).toHaveURL(/\/notes\/%20Leading%20space.md$/);
  expect(await readFile(`${runtime}/wiki/ Leading space.md`, 'utf8')).toBe('# Literal filename\n');
  await expect(readFile(`${runtime}/wiki/Leading space.md`)).rejects.toThrow();
  await page.goto('/notes/CreateSource.md');
  await expect(page.getByRole('link', { name: 'Literal label', exact: true })).toHaveAttribute('href', '/notes/%20Leading%20space.md');
  expect(await readFile(`${runtime}/wiki/CreateSource.md`, 'utf8')).toBe(original);
});

test('a linked draft waits for explicit first Create before enabling idle autosave', async ({ page }) => {
  await open(page);
  await missing(page).click();
  await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');
  const now = new Date('2026-10-26T15:00:00Z');
  await page.clock.install({ time: now });
  await page.clock.pauseAt(new Date(now.getTime() + 1000));
  const saves = [];
  page.on('request', request => { if (request.url().includes('/save/CreateLinks/New.md')) saves.push(request); });
  await editor(page).evaluate(el => el.markdownEditor.setSource('# Linked draft\n'));
  await page.clock.runFor(10000);
  expect(saves).toHaveLength(0);
  await expect(readFile(`${runtime}/wiki/CreateLinks/New.md`)).rejects.toThrow();
  await expect(page).toHaveURL(/\/new\/link\//);
  await page.locator('[data-save]').click();
  await expect(page).toHaveURL(/\/notes\/CreateLinks\/New.md#preview-details$/);
  await editor(page).evaluate(el => el.markdownEditor.setSource('# Linked edit\n'));
  await page.clock.runFor(5000);
  await expect.poll(() => readFile(`${runtime}/wiki/CreateLinks/New.md`, 'utf8')).toBe('# Linked edit\n');
});
