import { revealChrome } from './support/chrome.js';
import { test, expect } from '@playwright/test';
import { readFile, writeFile, stat, readdir, unlink } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { runtime } from './support/server.js';

const target = `${runtime}/wiki/Editable.md`;
const original = Buffer.from('\ufeff# Original\r\n');
async function login(page, route = '/notes/Editable.md') {
  await page.goto('/accounts/login/');
  await page.getByLabel('Username', { exact: true }).fill('slice');
  await page.getByLabel('Password', { exact: true }).fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL('/');
  return page.goto(route);
}
const readSource = page => page.locator('[data-markdown-editor]').evaluate(el => el.markdownEditor.getSource());
async function replace(page, value) {
  await page.locator('.cm-content').focus();
  await page.keyboard.press('Control+a');
  await page.keyboard.insertText(value);
}
async function action(page, label, route = '/save/') {
  await revealChrome(page);
  const [response] = await Promise.all([
    page.waitForResponse(response => response.url().includes(route) && response.request().method() === 'POST'),
    page.getByRole('button', { name: label, exact: true }).click(),
  ]);
  return response;
}
async function mode(page, presentation) {
  await revealChrome(page);
  if (presentation === 'source') await page.getByRole('button', { name: 'Raw source', exact: true }).click();
}

async function expireSession(context) {
  const session = (await context.cookies()).find(cookie => cookie.name === 'sessionid');
  expect(session).toBeDefined();
  const env = { ...process.env, DJANGO_SETTINGS_MODULE: 'backstory.settings', BACKSTORY_WIKI_ROOT: `${runtime}/wiki`, BACKSTORY_DATA_DIR: `${runtime}/data`, BACKSTORY_IDENTITY_PATH: '.backstory-marker', BACKSTORY_COOKIE_MODE: 'localhost', BACKSTORY_ALLOWED_HOSTS: 'localhost,127.0.0.1' };
  // Expire the actual server-side device; retain CSRF and avoid cookie deletion
  // racing session-renewal responses from other requests already in flight.
  const program = "import django,json,sys; django.setup(); from datetime import timedelta; from django.utils.timezone import now; from accounts.models import SessionDevice; count=SessionDevice.objects.filter(session_key_digest=json.load(sys.stdin)['digest'],revoked_at=None).update(absolute_expires_at=now()-timedelta(seconds=1)); assert count==1";
  const result = spawnSync('.venv/bin/python', ['-c', program], { env, input: JSON.stringify({ digest: createHash('sha256').update(session.value).digest('hex') }), encoding: 'utf8', timeout: 30000 });
  expect(result.status, result.stderr).toBe(0);
}

test.beforeEach(async () => { await writeFile(target, original); });

for (const presentation of ['live', 'source']) {
  test(`${presentation}: Format proposes an undoable edit; explicit Save and reopening use real disk bytes`, async ({ page }) => {
    await login(page);
    await mode(page, presentation);
    const draft = '# Edited\n\nA **bold** note.\n\n-    item\n';
    await replace(page, draft);
    const submitted = await readSource(page);
    const response = await action(page, 'Format', '/format/');
    expect(response.status()).toBe(200);
    await expect(page.getByRole('button', { name: 'Apply formatted source' })).toBeVisible();
    await expect(page.locator('[data-format-diff]')).toContainText('formatted');
    expect(await readSource(page)).toBe(submitted);
    expect(await readFile(target)).toEqual(original);
    await page.getByRole('button', { name: 'Apply formatted source' }).click();
    const formatted = await readSource(page);
    expect(formatted).not.toBe(submitted);
    await revealChrome(page);
    await page.getByRole('button', { name: 'Raw source', exact: true }).click();
    await page.locator('.cm-content').focus();
    await page.keyboard.press('Control+z');
    expect(await readSource(page)).toBe(submitted);
    await revealChrome(page);
    await page.getByRole('button', { name: 'Live preview', exact: true }).click();
    await page.locator('.cm-content').focus();
    await page.keyboard.press('Control+Shift+Z');
    expect(await readSource(page)).toBe(formatted);
    const saved = await action(page, 'Save');
    expect(saved.status()).toBe(200);
    await expect(page.locator('[data-editor-status]')).toContainText('Saved');
    // Queue availability changes after the representative indexing workflow.
    // The UI must report the actual backend save state in either case.
    const state = (await saved.json()).state;
    expect(['saved', 'saved_index_delayed']).toContain(state);
    await expect(page.locator('[data-editor-status]')).toHaveText(state === 'saved_index_delayed' ? 'Saved. Discovery update delayed.' : 'Saved.');
    expect(await readFile(target)).toEqual(Buffer.from('\ufeff' + await readSource(page)));
    await page.reload();
    expect(await readSource(page)).toBe(formatted);
    await expect(page.locator('[data-editor-status]')).toContainText('Unchanged');
  });

  test(`${presentation}: failed formatting needs explicit source recovery and retains diagnostics`, async ({ page }) => {
    await login(page);
    await mode(page, presentation);
    await replace(page, '---\nx: [\n---\n# Draft\n');
    const draft = await readSource(page);
    const failed = await action(page, 'Save');
    expect(failed.status()).toBe(422);
    expect(await readFile(target)).toEqual(original);
    await expect(page.locator('[data-diagnostics]')).toContainText('error');
    const diagnostics = await page.locator('[data-diagnostics]').innerText();
    const identityPath = `${runtime}/wiki/.backstory-marker`;
    const identity = await readFile(identityPath);
    try {
      await unlink(identityPath);
      expect((await action(page, 'Save source without formatting')).status()).toBe(503);
      expect(await page.locator('[data-diagnostics]').innerText()).toBe(diagnostics);
    } finally { await writeFile(identityPath, identity); }
    const saved = await action(page, 'Save source without formatting');
    expect(saved.status()).toBe(200);
    expect(saved.request().headers()['if-match']).toBe(failed.request().headers()['if-match']);
    expect(saved.request().postDataJSON().mode).toBe('source_recovery');
    expect(await readFile(target)).toEqual(Buffer.from('\ufeff' + draft));
    await expect(page.locator('[data-editor-status]')).toContainText('Saved without formatting');
    expect(await page.locator('[data-diagnostics]').innerText()).toBe(diagnostics);
  });

  test(`${presentation}: recovery after external edit keeps original ETag until explicit manual merge`, async ({ page }) => {
    const initial = await login(page);
    await mode(page, presentation);
    await replace(page, '---\nx: [\n---\n# My draft\n');
    const failed = await action(page, 'Format', '/format/');
    expect((await failed.json()).outcome).toBe('failed');
    const draft = await readSource(page);
    await writeFile(target, '\ufeff# External\r\n');
    const conflict = await action(page, 'Save source without formatting');
    expect(conflict.status()).toBe(412);
    expect(conflict.request().headers()['if-match']).toBe(initial.headers().etag);
    expect(await readSource(page)).toBe(draft);
    await expect(page.getByLabel('Base source', { exact: true })).toHaveValue('# Original\n');
    await expect(page.getByLabel('Current disk source', { exact: true })).toHaveValue('# External\n');
    await expect(page.getByLabel('Your draft', { exact: true })).toHaveValue(draft.replaceAll('\r\n', '\n'));
    const current = (await conflict.json()).revision;
    await page.getByRole('button', { name: 'Accept current revision for manual merge' }).click();
    await expect(page.locator('[data-conflict]')).toBeHidden();
    await replace(page, '# Merged\n');
    const saved = await action(page, 'Save');
    expect(saved.status()).toBe(200);
    expect(saved.request().headers()['if-match']).toBe(current);
    expect((await readFile(target)).toString()).toBe('\ufeff# Merged\r\n');
  });

  test(`${presentation}: ignored no-op and recovery no-op preserve bytes and mtime with honest labels`, async ({ page }) => {
    const ignored = `${runtime}/wiki/Ignored.md`;
    const unchanged = Buffer.from('#  Ignored    \n\nVerbatim  text\n');
    await writeFile(ignored, unchanged);
    const before = await stat(ignored);
    await login(page, '/notes/Ignored.md');
    await mode(page, presentation);
    expect((await action(page, 'Save')).status()).toBe(200);
    await expect(page.locator('[data-editor-status]')).toContainText('Unchanged on disk');
    await expect(page.locator('[data-diagnostics]')).toContainText('skipped');
    expect(await readFile(ignored)).toEqual(unchanged);
    expect((await stat(ignored)).mtimeMs).toBe(before.mtimeMs);
    await writeFile(target, '\ufeff---\r\nx: [\r\n---\r\n');
    await page.goto('/notes/Editable.md');
    await mode(page, presentation);
    const recoveryBefore = await stat(target);
    expect((await action(page, 'Save')).status()).toBe(422);
    expect((await action(page, 'Save source without formatting')).status()).toBe(200);
    await expect(page.locator('[data-editor-status]')).toContainText('Unchanged source on disk; formatting skipped');
    await expect(page.locator('[data-diagnostics]')).toContainText('error');
    expect((await stat(target)).mtimeMs).toBe(recoveryBefore.mtimeMs);
  });

  test(`${presentation}: storage identity loss retains draft and restoration never replays Save`, async ({ page }) => {
    const identityPath = `${runtime}/wiki/.backstory-marker`;
    const identity = await readFile(identityPath);
    await login(page);
    await mode(page, presentation);
    await replace(page, '# Retained draft\n');
    const draft = await readSource(page);
    const saves = [];
    page.on('request', request => { if (request.url().includes('/save/')) saves.push(request); });
    try {
      await unlink(identityPath);
      expect((await action(page, 'Save')).status()).toBe(503);
      expect(await readSource(page)).toBe(draft);
      await expect(page.locator('[data-editor-status]')).toContainText('Draft retained');
      await writeFile(identityPath, identity);
      await revealChrome(page);
      await page.getByRole('button', { name: 'Raw source', exact: true }).click();
      await revealChrome(page);
      await page.getByRole('button', { name: 'Live preview', exact: true }).click();
      expect(saves).toHaveLength(1);
      expect(await readFile(target)).toEqual(original);
      expect((await action(page, 'Save')).status()).toBe(200);
    } finally { await writeFile(identityPath, identity); }
  });

  test(`${presentation}: create uses current folder, LF and absent-file precondition without overwrite`, async ({ page }) => {
    const filename = `Created-${presentation}.md`;
    const created = `${runtime}/wiki/Drafts/${filename}`;
    const { rm } = await import('node:fs/promises');
    await rm(created, { force: true });
    await login(page, '/?folder=Drafts');
    await page.getByRole('navigation', { name: 'Folder', exact: true }).getByRole('link', { name: 'New note in this folder' }).click();
    await page.getByLabel('Note filename').fill('Missing/note.md');
    await page.getByRole('button', { name: 'Create note', exact: true }).click();
    await expect(page.locator('[data-editor-status]')).toContainText('current folder');
    await page.getByLabel('Note filename').fill(filename);
    await mode(page, presentation);
    await replace(page, '# New\n');
    const response = await action(page, 'Create note');
    expect(response.status()).toBe(200);
    expect(response.request().headers()['if-none-match']).toBe('*');
    expect(response.request().headers()['if-match']).toBeUndefined();
    expect(await readFile(created)).toEqual(Buffer.from('# New\n'));
    await expect(page).toHaveURL(new RegExp(`/notes/Drafts/Created-${presentation}\\.md$`));
    await page.reload();
    expect(await readSource(page)).toBe('# New\n');
    await page.goto('/new/?folder=Drafts');
    await page.getByLabel('Note filename').fill(filename);
    await replace(page, '# Collision\n');
    expect((await action(page, 'Create note')).status()).toBe(412);
    expect(await readFile(created)).toEqual(Buffer.from('# New\n'));
    await page.getByRole('button', { name: 'Accept current revision for manual merge' }).click();
    await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeVisible();
    await replace(page, '# Manually merged new note\n');
    expect((await action(page, 'Save')).status()).toBe(200);
    expect(await readFile(created)).toEqual(Buffer.from('# Manually merged new note\n'));
    expect((await readdir(`${runtime}/wiki/Drafts`)).filter(name => name.startsWith('.backstory-'))).toEqual([]);
  });
}

test('two authenticated editors expose base/current/draft and confirmed reload never overwrites', async ({ browser }) => {
  const firstContext = await browser.newContext();
  const secondContext = await browser.newContext();
  const first = await firstContext.newPage();
  const second = await secondContext.newPage();
  await login(first);
  await login(second);
  await replace(first, '# First writer\n');
  await replace(second, '# My preserved draft\n');
  expect((await action(first, 'Save')).status()).toBe(200);
  expect((await action(second, 'Save')).status()).toBe(412);
  await expect(second.getByLabel('Base source', { exact: true })).toHaveValue('# Original\n');
  await expect(second.getByLabel('Current disk source', { exact: true })).toHaveValue('# First writer\n');
  await secondContext.grantPermissions(['clipboard-read', 'clipboard-write']);
  await revealChrome(second);
  await second.getByRole('button', { name: 'Copy draft', exact: true }).click();
  expect(await second.evaluate(() => navigator.clipboard.readText())).toContain('# My preserved draft');
  const download = second.waitForEvent('download');
  await revealChrome(second);
  await second.getByRole('button', { name: 'Download draft' }).click();
  const downloaded = await download;
  expect((await readFile(await downloaded.path())).toString()).toContain('# My preserved draft');
  const dismissed = new Promise(resolve => second.once('dialog', async dialog => { await dialog.dismiss(); resolve(); }));
  await second.getByRole('button', { name: 'Reload current source' }).click();
  await dismissed;
  expect(await readSource(second)).toContain('# My preserved draft');
  second.once('dialog', dialog => dialog.accept());
  await second.getByRole('button', { name: 'Reload current source' }).click();
  await expect.poll(() => readSource(second)).toBe('# First writer\r\n');
  expect((await readFile(target)).toString()).toBe('\ufeff# First writer\r\n');
  await firstContext.close();
  await secondContext.close();
});

test('dirty navigation, logout and unload are guarded; keyboard Save and textarea use the same write path', async ({ page }) => {
  await login(page);
  await replace(page, '# Guarded draft\n');
  await revealChrome(page);
  for (const selector of [page.getByRole('link', { name: 'Backstory', exact: true }), page.getByRole('button', { name: 'Sign out' })]) {
    page.once('dialog', dialog => dialog.dismiss());
    await selector.click();
    expect(await readSource(page)).toContain('# Guarded draft');
    expect(page.url()).toContain('/notes/Editable.md');
  }
  page.once('dialog', dialog => dialog.dismiss());
  await page.reload({ timeout: 3000 }).catch(() => {});
  expect(await readSource(page)).toContain('# Guarded draft');
  await revealChrome(page);
  await page.getByRole('button', { name: 'Plain text fallback' }).click();
  await page.getByLabel('Markdown source (plain text fallback)').fill('# Fallback draft\n');
  const saved = page.waitForResponse(response => response.url().includes('/save/') && response.request().method() === 'POST');
  await page.keyboard.press('Control+s');
  expect((await saved).status()).toBe(200);
  expect((await readFile(target)).toString()).toBe('\ufeff# Fallback draft\r\n');
});

for (const presentation of ['live', 'source']) test(`${presentation}: expired authentication keeps source and undo in memory; in-place sign-in never replays Save`, async ({ page, context }) => {
  await login(page);
  await mode(page, presentation);
  await replace(page, '# Auth draft\n');
  const draft = await readSource(page);
  await expireSession(context);
  const response = await action(page, 'Save');
  expect(response.status()).toBe(302);
  expect(response.headers().location).toContain('/accounts/login/');
  await expect(page.locator('[data-reauth]')).toBeVisible();
  expect(await readSource(page)).toBe(draft);
  await page.getByLabel('Username for sign-in').fill('slice');
  await page.getByLabel('Password for sign-in').fill('deliberately-wrong-fixture-password');
  await page.getByRole('button', { name: 'Sign in again', exact: true }).click();
  await expect(page.locator('[data-editor-status]')).toContainText('Sign in was not completed. Draft retained');
  expect(await readSource(page)).toBe(draft);
  await page.getByLabel('Password for sign-in').fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in again', exact: true }).click();
  await expect(page.locator('[data-editor-status]')).toContainText('Signed in. Draft retained');
  expect(await readFile(target)).toEqual(original);
  expect(await readSource(page)).toBe(draft);
  await page.locator('.cm-content').focus();
  await page.keyboard.press('Control+z');
  expect(await readSource(page)).toBe('# Original\r\n');
  await page.keyboard.press('Control+Shift+Z');
  expect(await readSource(page)).toBe(draft);
  expect((await action(page, 'Save')).status()).toBe(200);
});


test('a confirmed save of an earlier draft never replaces edits typed while its response is pending', async ({ page }) => {
  await login(page);
  await replace(page, '# Earlier draft\n');
  let release;
  let published;
  const gate = new Promise(resolve => { release = resolve; });
  const onDisk = new Promise(resolve => { published = resolve; });
  await page.route('**/save/Editable.md', async route => {
    const response = await route.fetch();
    published();
    await gate;
    await route.fulfill({ response });
  });
  const completed = page.waitForResponse(response => response.url().includes('/save/Editable.md'));
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await onDisk;
  try {
    await replace(page, '# Newer unsaved draft\n');
    release();
    expect((await completed).status()).toBe(200);
    await expect(page.locator('[data-editor-status]')).toContainText('Newer edits remain unsaved');
    expect(await readSource(page)).toContain('# Newer unsaved draft');
    expect((await readFile(target)).toString()).toBe('\ufeff# Earlier draft\r\n');
  } finally { release(); }
});


test('a rejected formatter diff remains inspectable but cannot be applied as source', async ({ page }) => {
  await login(page);
  await replace(page, '# Retained draft\n');
  const submitted = await readSource(page);
  // The backend independently tests preservation rejection; this isolates its
  // documented diagnostic response at the UI boundary without an unsafe helper.
  await page.route('**/format/Editable.md', route => route.fulfill({
    json: { outcome: 'failed', source: submitted, diagnostics: [{ code: 'metadata_changed', message: 'Formatting changed front matter meaning.', severity: 'error' }], diff: '--- submitted\n+++ formatted\n@@ -1 +1 @@\n-before\n+after\n', recovery_token: null },
  }));
  await action(page, 'Format', '/format/');
  await expect(page.locator('[data-format-diff]')).toBeVisible();
  await expect(page.locator('[data-format-diff]')).toContainText('+++ formatted');
  await expect(page.getByRole('button', { name: 'Apply formatted source' })).toBeHidden();
  expect(await readSource(page)).toBe(submitted);
  expect(await readFile(target)).toEqual(original);
});

for (const presentation of ['live', 'source']) test(`${presentation}: accepted newline-only Format has exact undo redo without disk writes`, async ({ page }) => {
  const configPath = `${runtime}/wiki/.prettierrc`;
  let existingConfig;
  try { existingConfig = await readFile(configPath); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const exactOriginal = '# Mixed\r\n\nBody\r\n';
  const disk = Buffer.from('\ufeff' + exactOriginal);
  try {
    await writeFile(target, disk);
    await writeFile(configPath, '{"endOfLine":"lf"}\n');
    const before = await stat(target);
    await login(page);
    await mode(page, presentation);
    const formattedResponse = await action(page, 'Format', '/format/');
    expect(formattedResponse.status()).toBe(200);
    expect((await formattedResponse.json()).source).toBe('# Mixed\n\nBody\n');
    expect(await readSource(page)).toBe(exactOriginal);
    await page.getByRole('button', { name: 'Apply formatted source' }).click();
    expect(await readSource(page)).toBe('# Mixed\n\nBody\n');
    await revealChrome(page);
    await page.getByRole('button', { name: 'Raw source', exact: true }).click();
    await page.locator('.cm-content').focus();
    await page.keyboard.press('Control+z');
    expect(await readSource(page)).toBe(exactOriginal);
    await expect(page.locator('[data-editor-status]')).toHaveText('Unchanged');
    await revealChrome(page);
    await page.getByRole('button', { name: 'Live preview', exact: true }).click();
    await page.locator('.cm-content').focus();
    await page.keyboard.press('Control+Shift+Z');
    expect(await readSource(page)).toBe('# Mixed\n\nBody\n');
    await expect(page.locator('[data-editor-status]')).toHaveText('Unsaved changes');
    expect(await readFile(target)).toEqual(disk);
    expect((await stat(target)).mtimeMs).toBe(before.mtimeMs);
  } finally {
    if (existingConfig) await writeFile(configPath, existingConfig);
    else { const { rm } = await import('node:fs/promises'); await rm(configPath, { force: true }); }
  }
});

test('conflict reload and subsequent Save preserve a leading content FEFF separately from encoding BOM', async ({ page }) => {
  await login(page);
  await replace(page, '# My retained draft\n');
  const currentSource = '\ufeff# Current\r\n';
  await writeFile(target, Buffer.from('\ufeff' + currentSource));
  expect((await action(page, 'Save')).status()).toBe(412);
  await expect(page.getByLabel('Current disk source', { exact: true })).toHaveValue('\ufeff# Current\n');
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Reload current source' }).click();
  await expect.poll(() => readSource(page)).toBe(currentSource);
  await page.locator('.cm-content').focus();
  await page.keyboard.press('Control+End');
  await page.keyboard.insertText('\nChanged\n');
  const saved = await action(page, 'Save');
  expect(saved.status()).toBe(200);
  expect(saved.request().postDataJSON().source.startsWith('\ufeff')).toBe(true);
  expect((await readFile(target)).subarray(0, 6)).toEqual(Buffer.from('\ufeff\ufeff'));
});
