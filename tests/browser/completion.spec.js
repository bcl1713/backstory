import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { runtime } from './support/server.js';
import { revealChrome } from './support/chrome.js';

const initial = '# Completion\n\n';
const host = page => page.locator('[data-markdown-editor]');
const content = page => page.getByRole('textbox', { name: 'Markdown editor', exact: true });
const read = page => host(page).evaluate(el => el.markdownEditor.getSource());
const popup = page => page.getByRole('listbox', { name: 'Completions' });

async function index() {
  await mkdir(`${runtime}/wiki/Completion`, { recursive: true });
  await writeFile(`${runtime}/wiki/Completion/Atlas.md`, '---\ntitle: World building\naliases: [Terra, Shared completion]\n---\n# Atlas\n');
  await writeFile(`${runtime}/wiki/Completion/Other.md`, '---\naliases: [Shared completion]\n---\n# Other destination\n');
  await writeFile(`${runtime}/wiki/Completion/Emoji.md`, '---\ntitle: "' + '🌍'.repeat(300) + '"\naliases: [Emoji completion]\n---\n');
  await writeFile(`${runtime}/wiki/CompletionDraft.md`, initial);
  const env = { ...process.env, DJANGO_SETTINGS_MODULE: 'backstory.settings', BACKSTORY_WIKI_ROOT: `${runtime}/wiki`, BACKSTORY_DATA_DIR: `${runtime}/data`, BACKSTORY_IDENTITY_PATH: '.backstory-marker', BACKSTORY_COOKIE_MODE: 'localhost', BACKSTORY_ALLOWED_HOSTS: 'localhost,127.0.0.1' };
  const program = "import django; django.setup(); from indexing.queue import request_scan; from indexing.worker import run_batch; request_scan('rebuild')\nfor n in range(1000):\n r=run_batch(now=10000000000+n*400)\n if not r.pending: break\nelse: raise SystemExit(9)";
  const result = spawnSync('.venv/bin/python', ['-c', program], { env, encoding: 'utf8', timeout: 120000 });
  expect(result.status, result.stderr).toBe(0);
}

test.beforeAll(index);

async function open(page, presentation = 'Live preview', vim = false, path = 'CompletionDraft.md') {
  if (path === 'CompletionDraft.md') await writeFile(`${runtime}/wiki/${path}`, initial);
  await page.goto('/accounts/login/');
  await page.getByLabel('Username', { exact: true }).fill('slice');
  await page.getByLabel('Password', { exact: true }).fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  const now = new Date('2026-10-27T14:00:00Z');
  await page.clock.install({ time: now });
  await page.clock.pauseAt(new Date(now.getTime() + 1000));
  await page.goto(`/notes/${path}`);
  await expect(content(page)).toBeVisible();
  if (presentation !== 'Live preview') {
    await revealChrome(page);
    await page.getByRole('button', { name: presentation, exact: true }).click();
    await page.keyboard.press('Control+Shift+Period');
  }
  if (vim) await page.getByRole('button', { name: 'Vim bindings', exact: true }).click();
  await content(page).focus();
  if (vim) await page.keyboard.type('Gi');
  else await page.keyboard.press('Control+End');
}

async function readyPopup(page) {
  await expect(popup(page)).toBeVisible();
  // The paused clock must drive async-result and tooltip layout timers, too.
  await expect.poll(async () => {
    await page.clock.runFor(100);
    return (await popup(page).boundingBox())?.y ?? -10000;
  }).toBeGreaterThanOrEqual(0);
}
async function suggest(page, text) {
  await page.keyboard.type(text);
  await page.clock.runFor(400);
  await readyPopup(page);
}

for (const presentation of ['Live preview', 'Raw source']) for (const vim of [false, true]) {
  test(`${presentation} ${vim ? 'Vim Insert' : 'standard'}: accepted alias completion is one undoable source edit`, async ({ page }) => {
    await open(page, presentation, vim);
    await suggest(page, '[[Ter');
    await expect(popup(page)).toContainText('Terra');
    await page.keyboard.press('Enter');
    expect(await read(page)).toBe(initial + '[[/Completion/Atlas.md|Terra]]');
    if (vim) {
      await expect(page.locator('[data-vim-mode]')).toHaveText('Vim · Insert');
      await page.keyboard.press('Escape');
      await page.keyboard.type('u');
    } else await page.keyboard.press('Control+z');
    expect(await read(page)).toBe(initial + '[[Ter');
  });
}

test('completion preserves an existing fragment, custom label, closing brackets and surrounding text', async ({ page }) => {
  await open(page);
  await host(page).evaluate(el => {
    el.markdownEditor.setSource('# Completion\n\nBefore [[Atl#Details|My label]] after.\n');
    el.markdownEditor.view.dispatch({ selection: { anchor: '# Completion\n\nBefore [[Atl'.length } });
  });
  await page.getByRole('button', { name: 'Complete link', exact: true }).click();
  await page.clock.runFor(300);
  await readyPopup(page);
  await page.keyboard.press('Enter');
  expect(await read(page)).toBe('# Completion\n\nBefore [[/Completion/Atlas.md#Details|My label]] after.\n');
});

test('Escape dismisses suggestions before leaving Vim Insert, and Tab leaves without accepting', async ({ page }) => {
  await open(page, 'Live preview', true);
  await suggest(page, '[[Ter');
  await page.keyboard.press('Escape');
  await expect(popup(page)).toBeHidden();
  await expect(page.locator('[data-vim-mode]')).toHaveText('Vim · Insert');
  expect(await read(page)).toBe(initial + '[[Ter');
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-vim-mode]')).toHaveText('Vim · Normal');
  await page.keyboard.type('a');
  await page.getByRole('button', { name: 'Complete link', exact: true }).click();
  await page.clock.runFor(300);
  await readyPopup(page);
  await page.keyboard.press('Tab');
  await expect(content(page)).not.toBeFocused();
  expect(await read(page)).toBe(initial + '[[Ter');
});

test('code, front matter, escaped links and labels do not request completion', async ({ page }) => {
  await open(page);
  const requests = [];
  page.on('request', r => { if (r.url().includes('/tools/complete/')) requests.push(r.url()); });
  for (const text of ['---\ntitle: [[Ter\n---\n', '```md\n[[Ter\n```', '`[[Ter`', '\\[[Ter', '[[Atlas|Ter', '[[Atlas#Ter', '[[Atlas|Some [[Ter]]', '[[Atlas#Some [[Ter]]', '[[Atlas|Some [[Ter']) {
    await host(page).evaluate((el, text) => {
      el.markdownEditor.setSource(text);
      el.markdownEditor.view.dispatch({ selection: { anchor: text.indexOf('Ter') + 3 } });
    }, text);
    await page.getByRole('button', { name: 'Complete link', exact: true }).click();
    await page.clock.runFor(500);
    await expect(popup(page)).toBeHidden();
    expect(await read(page)).toBe(text);
  }
  expect(requests).toEqual([]);
});

test('failed and obsolete completion replies never change the draft', async ({ page }) => {
  await open(page);
  await page.route('**/tools/complete/**', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"state":"unavailable"}' }));
  await page.keyboard.type('[[Ter');
  await page.clock.runFor(500);
  await expect(page.locator('[data-link-completion-status]')).toContainText('unavailable');
  expect(await read(page)).toBe(initial + '[[Ter');
  await expect(popup(page)).toBeHidden();
  await page.unroute('**/tools/complete/**');
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  let captured;
  const pending = new Promise(resolve => { captured = resolve; });
  await page.route('**/tools/complete/**', async route => {
    const response = await route.fetch();
    captured(); await gate; await route.fulfill({ response });
  });
  await page.getByRole('button', { name: 'Complete link', exact: true }).click();
  await page.clock.runFor(300);
  await pending;
  await page.keyboard.type('|custom]]');
  release();
  await page.clock.runFor(500);
  await expect(popup(page)).toBeHidden();
  expect(await read(page)).toBe(initial + '[[Ter|custom]]');
});

test('mobile completion can be tapped and stays below sticky controls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 640 });
  await open(page);
  await suggest(page, '[[World');
  const bounds = await popup(page).boundingBox();
  const toolbar = await page.locator('.persistent-actions').boundingBox();
  expect(bounds.y).toBeGreaterThanOrEqual(toolbar.y + toolbar.height);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(640);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await popup(page).getByRole('option').first().tap();
  expect(await read(page)).toBe(initial + '[[/Completion/Atlas.md|World building]]');
});

test('duplicate aliases show distinct paths and arrows select the intended note', async ({ page }) => {
  await open(page);
  await suggest(page, '[[Shared completion');
  await expect(popup(page).getByRole('option')).toHaveCount(2);
  await expect(popup(page).getByRole('option').first()).toContainText('Completion/Atlas.md');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  expect(await read(page)).toBe(initial + '[[/Completion/Other.md|Shared completion]]');
});

test('completion preserves prose after an unclosed link and exact mixed endings on undo', async ({ page }) => {
  const mixed = '# Mixed\r\n\nBefore [[Ter after.\r\n';
  await writeFile(`${runtime}/wiki/MixedCompletion.md`, mixed);
  await open(page, 'Raw source', false, 'MixedCompletion.md');
  await host(page).evaluate(el => el.markdownEditor.view.dispatch({ selection: { anchor: el.markdownEditor.view.state.doc.toString().indexOf('Ter') + 3 } }));
  await content(page).press('Control+Space');
  await page.clock.runFor(400);
  await readyPopup(page);
  await page.keyboard.press('Enter');
  expect(await read(page)).toBe('# Mixed\r\n\r\nBefore [[/Completion/Atlas.md|Terra]] after.\r\n');
  await page.keyboard.press('Control+z');
  expect(await read(page)).toBe(mixed);
});

test('acceptance feeds the existing guarded autosave and popup activity never writes', async ({ page }) => {
  await open(page);
  const writes = [];
  page.on('request', request => { if (request.method() === 'POST' && request.url().includes('/save/')) writes.push(request); });
  await suggest(page, '[[Ter');
  expect(writes).toHaveLength(0);
  await page.keyboard.press('Enter');
  await page.clock.runFor(5000);
  await expect(page.locator('[data-editor-status]')).toContainText('Saved');
  expect(writes).toHaveLength(1);
  expect(writes[0].postDataJSON().source).toBe(initial + '[[/Completion/Atlas.md|Terra]]');
});

test('fallback closes suggestions and preserves the draft without modal trapping', async ({ page }) => {
  await open(page, 'Live preview', true);
  await suggest(page, '[[Ter');
  await revealChrome(page);
  await page.getByRole('button', { name: 'Plain text fallback', exact: true }).click();
  await expect(popup(page)).toBeHidden();
  await expect(page.getByLabel('Markdown source (plain text fallback)')).toHaveValue(initial + '[[Ter');
  await expect(page.getByRole('button', { name: 'Complete link', exact: true })).toBeDisabled();
});

test('Vim Normal and Visual never offer completion, including alternate Insert escape', async ({ page }) => {
  await open(page, 'Live preview', true);
  await suggest(page, '[[Ter');
  await page.keyboard.press('Control+[');
  await expect(page.locator('[data-vim-mode]')).toHaveText('Vim · Normal');
  await expect(popup(page)).toBeHidden();
  await expect(page.getByRole('button', { name: 'Complete link', exact: true })).toBeDisabled();
  await page.keyboard.type('v');
  await page.keyboard.press('Control+Space');
  await page.clock.runFor(500);
  await expect(popup(page)).toBeHidden();
  expect(await read(page)).toBe(initial + '[[Ter');
});

test('malformed replies and expired sessions leave the draft editable', async ({ page }) => {
  await open(page);
  await page.route('**/tools/complete/**', route => route.fulfill({ contentType: 'application/json', body: '{"state":"suggestions","items":[{"path":"javascript:bad"}]}' }));
  await page.keyboard.type('[[Ter'); await page.clock.runFor(500);
  await expect(page.locator('[data-link-completion-status]')).toContainText('unavailable');
  await page.unroute('**/tools/complete/**');
  await page.route('**/tools/complete/**', route => route.fulfill({ status: 401, contentType: 'application/json', body: '{"state":"error"}' }));
  await page.getByRole('button', { name: 'Complete link', exact: true }).click();
  await page.clock.runFor(500);
  await expect(page.locator('[data-link-completion-status]')).toContainText('Sign in again');
  await page.keyboard.type('ra]]');
  expect(await read(page)).toBe(initial + '[[Terra]]');
});

test('an unclosed link never consumes a separate following wikilink', async ({ page }) => {
  await open(page);
  await host(page).evaluate(el => {
    el.markdownEditor.setSource('# Completion\n\nBefore [[Ter after [[Other]].\n');
    el.markdownEditor.view.dispatch({ selection: { anchor: '# Completion\n\nBefore [[Ter'.length } });
  });
  await page.getByRole('button', { name: 'Complete link', exact: true }).click();
  await page.clock.runFor(400); await readyPopup(page);
  await page.keyboard.press('Enter');
  expect(await read(page)).toBe('# Completion\n\nBefore [[/Completion/Atlas.md|Terra]] after [[Other]].\n');
});

test('valid Unicode titles cannot disable otherwise usable suggestions', async ({ page }) => {
  await open(page);
  await suggest(page, '[[Emoji');
  await page.keyboard.press('Enter');
  expect(await read(page)).toBe(initial + '[[/Completion/Emoji.md|Emoji completion]]');
});

test('Escape after ordinary Vim typing is never consumed by a pending non-link query', async ({ page }) => {
  await open(page, 'Live preview', true);
  await page.keyboard.type('Ordinary prose');
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-vim-mode]')).toHaveText('Vim · Normal');
  await page.keyboard.type('u');
  expect(await read(page)).toBe(initial);
});
