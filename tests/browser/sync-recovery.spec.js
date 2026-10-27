import { test, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { runtime } from './support/server.js';
import { revealChrome } from './support/chrome.js';

const target = `${runtime}/wiki/SyncRecovery.md`;
const base = '# Recovery\n\nFirst paragraph.\n\nLast paragraph.\n';
const read = page => page.locator('[data-markdown-editor]').evaluate(el => el.markdownEditor.getSource());
const draft = (page, source) => page.locator('[data-markdown-editor]').evaluate((el, value) => el.markdownEditor.setSource(value), source);
const check = page => page.evaluate(() => window.dispatchEvent(new Event('focus')));
async function open(page) {
  await writeFile(target, base);
  await page.goto('/accounts/login/');
  await page.getByLabel('Username', { exact: true }).fill('slice');
  await page.getByLabel('Password', { exact: true }).fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  const now = new Date('2026-10-27T10:00:00Z');
  await page.clock.install({ time: now });
  await page.clock.pauseAt(new Date(now.getTime() + 1000));
  await page.goto('/notes/SyncRecovery.md');
  await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');
}
async function failRead(page) {
  await page.route('**/tools/read/**', route => route.fulfill({ contentType: 'text/html', body: 'Synthetic read failure' }));
  await check(page);
  await expect(page.locator('[data-editor-status]')).toContainText('Needs attention');
  await expect(page.locator('[data-sync-banner]')).toBeVisible();
}
async function recover(page) {
  await page.unroute('**/tools/read/**');
  await page.locator('[data-sync-check]').click();
  await expect(page.locator('[data-sync-banner]')).toBeHidden();
}

test('same-revision recovery clears only read attention and future user edits autosave', async ({ page }) => {
  await open(page);
  let saves = 0;
  page.on('request', request => { if (request.url().includes('/save/SyncRecovery.md')) saves++; });
  await page.evaluate(() => {
    window.readFailures = [];
    document.addEventListener('backstory:sync-read-failure', event => window.readFailures.push(event.detail));
  });
  await failRead(page);
  expect(await page.evaluate(() => window.readFailures.at(-1))).toMatchObject({
    reason: 'content_type', status: 200, contentType: 'text/html', etag: null,
  });
  await recover(page);
  await expect(page.locator('[data-editor-status]')).toHaveAttribute('data-state', 'saved');
  await expect(page.locator('[data-editor-status]')).not.toContainText('Needs attention');
  for (let i = 0; i < 2; i++) {
    await failRead(page);
    // Typing during the pause must not be published by recovery alone.
    await draft(page, base + `\nLocal ${i}.\n`);
    await recover(page);
    await expect(page.locator('[data-editor-status]')).not.toContainText('Needs attention');
    await expect(page.locator('[data-editor-status]')).toHaveAttribute('data-state', 'dirty');
    await page.clock.runFor(10000);
    expect(saves).toBe(0);
    expect(await readFile(target, 'utf8')).toBe(base);
  }
  await draft(page, base + '\nNext user edit.\n');
  await page.clock.runFor(5000);
  await expect.poll(() => readFile(target, 'utf8')).toContain('Next user edit.');
  expect(saves).toBe(1);
});

test('newer-revision recovery merges current typing without publishing and adopts the guarded base', async ({ page }) => {
  await open(page);
  await failRead(page);
  const external = base.replace('Last paragraph.', 'External last.');
  await writeFile(target, external);
  await page.unroute('**/tools/read/**');
  let held;
  await page.route('**/tools/read/**', route => { held = route; });
  await page.locator('[data-sync-review]').click();
  await expect.poll(() => Boolean(held)).toBe(true);
  await draft(page, base.replace('First paragraph.', 'Typed during recovery.'));
  await held.continue();
  await expect.poll(() => read(page)).toBe('# Recovery\n\nTyped during recovery.\n\nExternal last.\n');
  await expect(page.locator('[data-editor-status]')).not.toContainText('Needs attention');
  await page.unroute('**/tools/read/**');
  await page.clock.runFor(10000);
  expect(await readFile(target, 'utf8')).toBe(external);
  const revision = (await (await page.request.get('/tools/read/?path=SyncRecovery.md')).json()).revision;
  const saved = page.waitForRequest(request => request.url().includes('/save/SyncRecovery.md'));
  await draft(page, (await read(page)) + '\nLater user edit.\n');
  await page.clock.runFor(5000);
  expect((await saved).headers()['if-match']).toBe(revision);
  await expect.poll(() => readFile(target, 'utf8')).toContain('Later user edit.');
});

test('storing a protected draft during a read failure does not create a separate autosave pause', async ({ page }) => {
  await open(page);
  await failRead(page);
  await draft(page, base + '\nProtected local work.\n');
  await revealChrome(page);
  await page.locator('[data-store-draft]').click();
  await expect(page.locator('[data-stored-draft]')).toBeVisible();
  await recover(page);
  await expect(page.locator('[data-editor-status]')).not.toContainText('Needs attention');
  await page.clock.runFor(10000);
  expect(await readFile(target, 'utf8')).toBe(base);
  await draft(page, base + '\nNext user edit.\n');
  await page.clock.runFor(5000);
  await expect.poll(() => readFile(target, 'utf8')).toContain('Next user edit.');
});

for (const failure of ['format', 'storage', 'authentication', 'network']) {
  for (const readFirst of [false, true]) {
    test(`${failure} pause survives read recovery with read failure ${readFirst ? 'first' : 'last'}`, async ({ page }) => {
      await open(page);
      if (readFirst) await failRead(page);
      await draft(page, base.replace('First paragraph.', 'Keep local.'));
      await page.route('**/save/SyncRecovery.md', route => failure === 'network' ? route.abort() : route.fulfill({
        status: { format: 422, storage: 503, authentication: 401 }[failure],
        json: { state: failure === 'format' ? 'format_failed' : 'error', reason_code: failure },
      }));
      await page.locator('[data-save]').click();
      const reason = { format: 'Formatting failed', storage: 'Storage status', authentication: 'Sign in again', network: 'could not be confirmed' }[failure];
      await expect(page.locator('[data-editor-status]')).toContainText(reason);
      if (!readFirst) await failRead(page);
      const disk = readFirst ? base.replace('Last paragraph.', 'External last.') : base;
      await writeFile(target, disk);
      await recover(page);
      await expect(page.locator('[data-editor-status]')).toContainText(reason);
      await page.unroute('**/save/SyncRecovery.md');
      await draft(page, base + '\nMore local.\n');
      await page.clock.runFor(15000);
      expect(await readFile(target, 'utf8')).toBe(disk);
      await expect(page.locator('[data-editor-status]')).toContainText('Needs attention');
    });
  }
}

test('read recovery leaves overlapping external changes in explicit conflict review', async ({ page }) => {
  await open(page);
  await draft(page, '# Local conflict\n');
  await writeFile(target, '# External conflict\n');
  await check(page);
  await expect(page.locator('#conflict-current')).toHaveValue('# External conflict\n');
  await failRead(page);
  await page.unroute('**/tools/read/**');
  await page.locator('[data-sync-check]').click();
  await expect(page.locator('[data-reload-current]')).toBeEnabled();
  await expect(page.locator('[data-sync-banner]')).toBeVisible();
  await expect(page.locator('[data-editor-status]')).toContainText('Needs attention');
  await draft(page, '# More local conflict\n');
  await page.clock.runFor(15000);
  expect(await read(page)).toBe('# More local conflict\n');
  expect(await readFile(target, 'utf8')).toBe('# External conflict\n');
});

test('proxy-weakened ETags preserve exact external source and stale writes still conflict', async ({ page }) => {
  await open(page);
  const external = '# Proxy\r\n\nUnicode α\r';
  await writeFile(target, '\ufeff' + external);
  await page.route('**/tools/read/**', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, headers: { ...response.headers(), etag: 'W/' + response.headers().etag } });
  });
  await check(page);
  await expect.poll(() => read(page)).toBe(external);
  await expect(page.locator('[data-sync-banner]')).toBeHidden();
  // Another writer races after the last authoritative read.
  await writeFile(target, '# A newer disk version\n');
  await draft(page, '# Local retained\n');
  const response = page.waitForResponse(r => r.url().includes('/save/SyncRecovery.md'));
  await page.locator('[data-save]').click();
  expect((await response).status()).toBe(412);
  await expect(page.locator('[data-conflict]')).toBeVisible();
  expect(await read(page)).toBe('# Local retained\n');
  expect(await readFile(target, 'utf8')).toBe('# A newer disk version\n');
});
