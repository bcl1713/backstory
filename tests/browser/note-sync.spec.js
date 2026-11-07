import { test, expect } from '@playwright/test';
import { readFile, writeFile, rename } from 'node:fs/promises';
import { runtime } from './support/server.js';
import { revealChrome } from './support/chrome.js';

const path = 'Sync.md';
const target = `${runtime}/wiki/${path}`;
const base = '# Sync\n\nFirst section.\n\nLast section.\n';
const read = page => page.locator('[data-markdown-editor]').evaluate(el => el.markdownEditor.getSource());
const draft = (page, source) => page.locator('[data-markdown-editor]').evaluate((el, value) => el.markdownEditor.setSource(value), source);
const check = page => page.evaluate(() => window.dispatchEvent(new Event('focus')));

async function open(page) {
  await writeFile(target, base);
  await page.goto('/accounts/login/');
  await page.getByLabel('Username', { exact: true }).fill('slice');
  await page.getByLabel('Password', { exact: true }).fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.goto('/notes/Sync.md');
  await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');
}
async function save(page) {
  const done = page.waitForResponse(r => r.url().includes('/save/Sync.md') && r.request().method() === 'POST');
  await page.locator('[data-save]').click();
  return done;
}

test('a clean open note follows external edits and Save uses the adopted revision', async ({ page }) => {
  await open(page);
  const latest = '# External\n\nFirst section.\n\nLast section.\n';
  await writeFile(target, latest);
  await check(page);
  await expect.poll(() => read(page)).toBe(latest);
  const revision = (await page.request.get('/tools/read/?path=Sync.md')).headers().etag;
  await draft(page, latest + '\nHuman edit.\n');
  const response = await save(page);
  expect(response.status()).toBe(200);
  expect(response.request().headers()['if-match']).toBe(revision);
  expect(await readFile(target, 'utf8')).toContain('Human edit.');
});

test('disjoint edits merge automatically while local differences remain unsaved', async ({ page }) => {
  await open(page);
  await draft(page, base.replace('First section.', 'My first section.'));
  const external = base.replace('Last section.', 'External last section.');
  await writeFile(target, external);
  await check(page);
  await expect.poll(() => read(page)).toBe('# Sync\n\nMy first section.\n\nExternal last section.\n');
  expect(await readFile(target, 'utf8')).toBe(external);
  await expect(page.locator('[data-editor-status]')).toContainText('unsaved');
  expect((await save(page)).status()).toBe(200);
  expect(await readFile(target, 'utf8')).toContain('My first section.');
});

test('conflict keeps the draft, permits copying, and reload rechecks the displayed version', async ({ page, context }) => {
  await open(page);
  const local = base.replace('First section.', 'Local first.');
  await draft(page, local);
  const external = base.replace('First section.', 'External first.');
  await writeFile(target, external);
  await check(page);
  await expect(page.locator('[data-sync-banner]')).toBeVisible();
  await expect(page.locator('#conflict-current')).toHaveValue(external);
  expect(await read(page)).toBe(local);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.locator('[data-sync-copy]').click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(local);
  const dismissed = new Promise(resolve => page.once('dialog', async dialog => { await dialog.dismiss(); resolve(); }));
  await page.locator('[data-reload-current]').click();
  await dismissed;
  expect(await read(page)).toBe(local);
  const newest = base.replace('First section.', 'Newest first.');
  await writeFile(target, newest);
  // The first click updates the comparison and requires a new decision.
  await page.locator('[data-reload-current]').click();
  await expect(page.locator('#conflict-current')).toHaveValue(newest);
  expect(await read(page)).toBe(local);
  page.once('dialog', dialog => dialog.accept());
  await page.locator('[data-reload-current]').click();
  await expect.poll(() => read(page)).toBe(newest);
  expect(await readFile(target, 'utf8')).toBe(newest);
});

test('typing while a source read is pending is merged from the live draft', async ({ page }) => {
  await open(page);
  let release, captured;
  const gate = new Promise(resolve => { release = resolve; });
  const pending = new Promise(resolve => { captured = resolve; });
  await writeFile(target, base.replace('Last section.', 'External last.'));
  await page.route('**/tools/read/**', async route => {
    const response = await route.fetch();
    captured();
    await gate;
    await route.fulfill({ response });
  });
  await check(page);
  await pending;
  try {
    await draft(page, base.replace('First section.', 'Typed while reading.'));
    release();
    await expect.poll(() => read(page)).toBe('# Sync\n\nTyped while reading.\n\nExternal last.\n');
    expect(await readFile(target, 'utf8')).not.toContain('Typed while reading.');
  } finally { release(); }
});

test('deletion/movement and storage/authentication failures retain the draft and never mean empty source', async ({ page }) => {
  await open(page);
  const local = base + '\nRetain me.\n';
  await draft(page, local);
  await rename(target, target + '.moved');
  try {
    await check(page);
    await expect(page.locator('[data-sync-message]')).toContainText('deleted or moved');
    expect(await read(page)).toBe(local);
    await expect(page.locator('[data-reload-current]')).toBeDisabled();
  } finally { await rename(target + '.moved', target); }
  const marker = `${runtime}/wiki/.backstory-marker`;
  await rename(marker, marker + '.held');
  try {
    await check(page);
    await expect(page.locator('[data-sync-message]')).toContainText('Storage');
    expect(await read(page)).toBe(local);
  } finally { await rename(marker + '.held', marker); }
  await page.route('**/tools/read/**', route => route.fulfill({ status: 401, json: { state: 'error', reason_code: 'authentication_required', untrusted_content: true } }));
  await check(page);
  await expect(page.locator('[data-reauth]')).toBeVisible();
  expect(await read(page)).toBe(local);
});

test('undo after refresh restores text only and the next Save still checks the new revision', async ({ page }) => {
  await open(page);
  const external = base.replace('Last section.', 'External last.');
  await writeFile(target, external);
  await check(page);
  await expect.poll(() => read(page)).toBe(external);
  const revision = (await page.request.get('/tools/read/?path=Sync.md')).headers().etag;
  await page.locator('.cm-content').focus();
  await page.keyboard.press('Control+z');
  expect(await read(page)).toBe(base);
  await expect(page.locator('[data-editor-status]')).toHaveText('Unsaved changes');
  const response = await save(page);
  expect(response.status()).toBe(200);
  expect(response.request().headers()['if-match']).toBe(revision);
});

test('refresh preserves selection and exact mixed endings, including in plain fallback', async ({ page }) => {
  await open(page);
  await page.locator('[data-markdown-editor]').evaluate(el => el.markdownEditor.view.dispatch({ selection: { anchor: 10, head: 15 } }));
  const external = base.replace('Last section.', 'External last.').replace('\n\n', '\r\n\n');
  await writeFile(target, '\ufeff' + external);
  await check(page);
  await expect.poll(() => read(page)).toBe(external);
  expect(await page.locator('[data-markdown-editor]').evaluate(el => ({ from: el.markdownEditor.view.state.selection.main.from, to: el.markdownEditor.view.state.selection.main.to }))).toEqual({ from: 10, to: 15 });
  await revealChrome(page);
  await page.getByRole('button', { name: 'Plain text fallback', exact: true }).click();
  const plain = page.locator('#source');
  await plain.evaluate(el => { el.focus(); el.setSelectionRange(10, 15); });
  const newer = external.replace('External last.', 'Newest last.');
  await writeFile(target, '\ufeff' + newer);
  await check(page);
  await expect.poll(() => read(page)).toBe(newer);
  expect(await plain.evaluate(el => [el.selectionStart, el.selectionEnd])).toEqual([10, 15]);
  expect((await save(page)).status()).toBe(200);
  expect((await readFile(target)).subarray(0, 3)).toEqual(Buffer.from('\ufeff'));
});

test('a read started before Save cannot restore an earlier revision after Save finishes', async ({ page }) => {
  await open(page);
  let release, captured;
  const gate = new Promise(resolve => { release = resolve; });
  const pending = new Promise(resolve => { captured = resolve; });
  let held = false;
  await page.route('**/tools/read/**', async route => {
    if (held) { await route.continue(); return; }
    held = true;
    const response = await route.fetch();
    captured(); await gate; await route.fulfill({ response });
  });
  await check(page); await pending;
  try {
    await draft(page, '# Saved while reading\n');
    expect((await save(page)).status()).toBe(200);
    const response = page.waitForResponse(r => r.url().includes('/tools/read/'));
    release(); await response;
    await page.unroute('**/tools/read/**');
    await check(page);
    await expect.poll(() => read(page)).toBe('# Saved while reading\n');
    await expect(page.locator('[data-sync-banner]')).toBeHidden();
    expect((await save(page)).status()).toBe(200);
  } finally { release(); }
});

test('a newer check queued during a pending read skips the obsolete snapshot', async ({ page }) => {
  await open(page);
  const first = base.replace('Last section.', 'First external.');
  const newest = base.replace('Last section.', 'Newest external.');
  await writeFile(target, first);
  let release, captured;
  const gate = new Promise(resolve => { release = resolve; });
  const pending = new Promise(resolve => { captured = resolve; });
  let requests = 0;
  await page.route('**/tools/read/**', async route => {
    if (++requests > 1) { await route.continue(); return; }
    const response = await route.fetch();
    captured(); await gate; await route.fulfill({ response });
  });
  // Observe document updates through the actual CodeMirror transaction stream.
  await page.locator('[data-markdown-editor]').evaluate(el => {
    window.seenExternalSources = [];
    const view = el.markdownEditor.view;
    const dispatch = view.dispatch.bind(view);
    view.dispatch = (...args) => { dispatch(...args); window.seenExternalSources.push(el.markdownEditor.getSource()); };
  });
  await check(page); await pending;
  try {
    await writeFile(target, newest);
    await check(page);
    release();
    await expect.poll(() => read(page)).toBe(newest);
    expect(await page.evaluate(() => window.seenExternalSources)).not.toContain(first);
  } finally { release(); }
});

test('typing while an explicit reload is reading requires a fresh review decision', async ({ page }) => {
  await open(page);
  await draft(page, '# Local\n');
  await writeFile(target, '# External\n');
  await check(page);
  await expect(page.locator('[data-reload-current]')).toBeEnabled();
  let held;
  await page.route('**/tools/read/**', route => { held = route; });
  await page.locator('[data-reload-current]').click();
  await expect.poll(() => Boolean(held)).toBe(true);
  await draft(page, '# Typed during review\n');
  await held.continue();
  await expect(page.locator('[data-sync-message]')).toContainText('changed during review');
  expect(await read(page)).toBe('# Typed during review\n');
});

test('a revision published while reload confirmation is open requires comparison again', async ({ page }) => {
  await open(page);
  await draft(page, '# Local\n');
  await writeFile(target, '# External\n');
  await check(page);
  await expect(page.locator('[data-reload-current]')).toBeEnabled();
  page.once('dialog', async dialog => {
    await writeFile(target, '# Published during confirmation\n');
    await dialog.accept();
  });
  await page.locator('[data-reload-current]').click();
  await expect(page.locator('#conflict-current')).toHaveValue('# Published during confirmation\n');
  await expect(page.locator('[data-sync-message]')).toContainText('changed during confirmation');
  expect(await read(page)).toBe('# Local\n');
});

test('visible tabs poll automatically and a valid empty source can be adopted', async ({ page }) => {
  await open(page);
  await writeFile(target, '');
  await expect.poll(() => read(page), { timeout: 10000 }).toBe('');
  await expect(page.locator('[data-sync-banner]')).toBeHidden();
  expect((await save(page)).status()).toBe(200);
  expect(await readFile(target, 'utf8')).toBe('');
});

test('refresh pauses for textarea composition and resumes without replacing the composing draft', async ({ page }) => {
  await open(page);
  await revealChrome(page);
  await page.getByRole('button', { name: 'Plain text fallback', exact: true }).click();
  await page.locator('#source').dispatchEvent('compositionstart');
  let reads = 0;
  page.on('request', request => { if (request.url().includes('/tools/read/')) reads++; });
  await writeFile(target, base.replace('Last section.', 'External last.'));
  await check(page);
  // A non-read request round trip gives a mistakenly started refresh time to run.
  await page.request.get('/status/');
  expect(reads).toBe(0);
  await page.locator('#source').dispatchEvent('compositionend');
  await check(page);
  await expect.poll(() => read(page)).toContain('External last.');
});

test('a mixed-ending refresh adopts the external preferred newline for subsequent typing', async ({ page }) => {
  await open(page);
  const external = '# Sync\r\n\r\nFirst section.\n\r\nLast section.\r\n';
  await writeFile(target, external);
  await check(page);
  await expect.poll(() => read(page)).toBe(external);
  await page.locator('.cm-content').focus();
  await page.keyboard.press('Control+End');
  await page.keyboard.insertText('Human\n');
  const edited = await read(page);
  expect(edited).toBe('# Sync\r\n\r\nFirst section.\r\n\r\nLast section.\r\nHuman\r\n');
});

test('an update below the viewport preserves page scroll and maps selection through an earlier edit', async ({ page }) => {
  await open(page);
  const long = '# Long\n\n' + Array.from({ length: 300 }, (_, i) => `Paragraph ${i}.\n\n`).join('');
  await writeFile(target, long);
  await page.goto('/notes/Sync.md');
  await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');
  const selected = await page.locator('[data-markdown-editor]').evaluate(el => {
    const api = el.markdownEditor;
    api.view.dispatch({ selection: { anchor: 1800, head: 1810 } });
    return api.view.state.sliceDoc(1800, 1810);
  });
  await page.evaluate(() => window.scrollTo(0, 1800));
  const before = await page.evaluate(() => window.scrollY);
  const external = long.replace('# Long', '# A longer heading').replace('Paragraph 280.', 'External paragraph 280.');
  await writeFile(target, external);
  await check(page);
  await expect.poll(() => read(page)).toBe(external);
  expect(await page.locator('[data-markdown-editor]').evaluate(el => {
    const state = el.markdownEditor.view.state, { from, to } = state.selection.main;
    return state.sliceDoc(from, to);
  })).toBe(selected);
  expect(await page.evaluate(() => window.scrollY)).toBeCloseTo(before, -1);
});

test('a malformed read never clears the document and checking again recovers', async ({ page }) => {
  await open(page);
  await page.route('**/tools/read/**', route => route.fulfill({ contentType: 'text/html', body: '<html>Sign in</html>' }));
  await check(page);
  await expect(page.locator('[data-sync-message]')).toContainText('could not be read');
  expect(await read(page)).toBe(base);
  await page.unroute('**/tools/read/**');
  await writeFile(target, '# Latest after recovery\n');
  await page.locator('[data-sync-check]').click();
  await expect.poll(() => read(page)).toBe('# Latest after recovery\n');
  await expect(page.locator('[data-sync-banner]')).toBeHidden();
});

test('when the enhanced editor cannot start, the fallback still refreshes and conditionally saves', async ({ page }) => {
  await page.addInitScript(() => {
    window.MutationObserver = class { constructor() { throw new Error('Synthetic enhanced editor failure'); } };
  });
  await open(page);
  await expect(page.locator('#source')).toBeVisible();
  const external = '# Plain external\r\n';
  await writeFile(target, external);
  await check(page);
  await expect(page.locator('#source')).toHaveValue('# Plain external\n');
  await page.locator('#source').fill('# Plain local\n');
  expect((await save(page)).status()).toBe(200);
  expect(await readFile(target, 'utf8')).toBe('# Plain local\r\n');
});

test('a slow authoritative read is applied despite periodic ticks while it is pending', async ({ page }) => {
  await page.clock.install();
  await open(page);
  await writeFile(target, '# Slow external\n');
  let release, captured;
  const gate = new Promise(resolve => { release = resolve; });
  const pending = new Promise(resolve => { captured = resolve; });
  let requests = 0;
  await page.route('**/tools/read/**', async route => {
    if (++requests > 1) { await route.abort(); return; }
    const response = await route.fetch();
    captured(); await gate; await route.fulfill({ response });
  });
  await check(page); await pending;
  try {
    await page.clock.runFor(6000);
    release();
    await expect.poll(() => read(page)).toBe('# Slow external\n');
    expect(requests).toBe(1);
  } finally { release(); }
});

test('composition beginning during reload confirmation read keeps the draft and review open', async ({ page }) => {
  await open(page);
  await draft(page, '# Local\n');
  await writeFile(target, '# External\n');
  await check(page);
  await expect(page.locator('[data-reload-current]')).toBeEnabled();
  await revealChrome(page);
  await page.getByRole('button', { name: 'Plain text fallback', exact: true }).click();
  let held, requests = 0;
  await page.route('**/tools/read/**', async route => {
    if (++requests === 1) await route.continue();
    else held = route;
  });
  page.once('dialog', dialog => dialog.accept());
  await page.locator('[data-reload-current]').click();
  await expect.poll(() => Boolean(held)).toBe(true);
  await page.locator('#source').dispatchEvent('compositionstart');
  await held.continue();
  await expect(page.locator('[data-reload-current]')).toBeEnabled();
  expect(await read(page)).toBe('# Local\n');
  await expect(page.locator('[data-sync-banner]')).toBeVisible();
  await page.locator('#source').dispatchEvent('compositionend');
});
