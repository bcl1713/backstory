import { test, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { source as mixedSource, bytes, runtime } from './support/server.js';
import { revealChrome } from './support/chrome.js';

const source = '# Vim test\n\nAlpha **bold** omega.\nSecond line.\n';
const host = page => page.locator('[data-markdown-editor]');
const content = page => page.getByRole('textbox', { name: 'Markdown editor', exact: true });
const toggle = page => page.getByRole('button', { name: 'Vim bindings', exact: true });
const mode = page => page.locator('[data-vim-mode]');
const read = page => host(page).evaluate(el => el.markdownEditor.getSource());
const selection = page => host(page).evaluate(el => {
  const { anchor, head } = el.markdownEditor.view.state.selection.main;
  return { anchor, head };
});
async function open(page, path = 'Vim.md', enhanced = true) {
  if (path === 'Vim.md') await writeFile(`${runtime}/wiki/${path}`, source);
  await page.goto('/accounts/login/');
  await page.getByLabel('Username', { exact: true }).fill('slice');
  await page.getByLabel('Password', { exact: true }).fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  // Keep dev's autosave/source polling deterministic while testing draft-only
  // operations. Integration cases below explicitly advance those timers.
  const now = new Date('2026-10-27T12:00:00Z');
  await page.clock.install({ time: now });
  await page.clock.pauseAt(new Date(now.getTime() + 1000));
  await page.goto(`/notes/${path}`);
  if (enhanced) await expect(content(page)).toBeVisible();
}
async function presentation(page, name) {
  await revealChrome(page);
  await page.getByRole('button', { name, exact: true }).click();
  // Close chrome without changing the editor's modal state.
  if (await page.getByRole('button', { name: 'Navigation and controls', exact: true }).getAttribute('aria-expanded') === 'true') {
    await page.keyboard.press('Control+Shift+Period');
  }
}
async function enable(page) {
  await revealChrome(page);
  await toggle(page).click();
  await expect(mode(page)).toHaveText('Vim · Normal');
  await page.keyboard.press('Control+Shift+Period');
  await content(page).focus();
}
async function tabTo(page, target) {
  await expect(target).toBeVisible();
  const focusable = page.locator('a[href], button, input, textarea, select, summary, [tabindex]');
  let controls = await focusable.count();
  for (let n = 0; n < controls + 2; n++) {
    if (await target.evaluate(el => el === document.activeElement)) return;
    await page.keyboard.press('Tab');
    controls = Math.max(controls, await focusable.count());
  }
  await expect(target).toBeFocused();
}

test('standard editing is default; opting in and disabling preserve source and selection', async ({ page }) => {
  const writes = [];
  page.on('request', req => { if (req.method() === 'POST' && /\/(save|format)\//.test(req.url())) writes.push(req.url()); });
  await open(page);
  await revealChrome(page);
  await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false');
  await expect(mode(page)).toHaveText('Vim · Off');
  await host(page).evaluate(el => el.markdownEditor.view.dispatch({ selection: { anchor: 14, head: 19 } }));
  const before = await selection(page);
  await enable(page);
  expect(await selection(page)).toEqual(before);
  expect(await read(page)).toBe(source);
  await revealChrome(page);
  await toggle(page).click();
  await expect(mode(page)).toHaveText('Vim · Off');
  await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false');
  expect(await selection(page)).toEqual(before);
  await content(page).focus();
  await page.keyboard.type('ordinary');
  expect(await read(page)).toContain('ordinary');
  await content(page).press('Control+z');
  expect(await read(page)).toBe(source);
  expect(writes).toEqual([]);
  await page.reload();
  await expect(mode(page)).toHaveText('Vim · Off');
});

test('Normal, Insert and Visual modes share selections and undo across Live and Raw', async ({ page }) => {
  await open(page);
  await enable(page);
  await page.keyboard.type('gg0i');
  await expect(mode(page)).toHaveText('Vim · Insert');
  await page.keyboard.type('Inserted ');
  await presentation(page, 'Raw source');
  await expect(mode(page)).toHaveText('Vim · Insert');
  await content(page).press('Escape');
  await expect(mode(page)).toHaveText('Vim · Normal');
  await page.keyboard.type('u');
  expect(await read(page)).toBe(source);
  await presentation(page, 'Live preview');
  await content(page).press('Control+r');
  expect(await read(page)).toBe('Inserted ' + source);
  await page.keyboard.type('gg0vj');
  await expect(mode(page)).toHaveText('Vim · Visual');
  const selected = await selection(page);
  expect(selected.anchor).not.toBe(selected.head);
  await presentation(page, 'Raw source');
  expect(await selection(page)).toEqual(selected);
  await presentation(page, 'Live preview');
  expect(await selection(page)).toEqual(selected);
  await content(page).press('Escape');
  await expect(mode(page)).toHaveText('Vim · Normal');
  await page.keyboard.type('V');
  await expect(mode(page)).toHaveText('Vim · Visual line');
  await page.keyboard.press('Escape');
});

test('Visual selection reveals Markdown and deleting it is undoable', async ({ page }) => {
  await open(page);
  await enable(page);
  await page.keyboard.type('ggjj0vll');
  await expect(mode(page)).toHaveText('Vim · Visual');
  await expect(content(page)).toContainText('Alpha **bold** omega.');
  const selected = await selection(page);
  expect(selected.head - selected.anchor).toBe(3);
  await page.keyboard.type('d');
  expect(await read(page)).toBe(source.replace('Alpha', 'ha'));
  await page.keyboard.type('u');
  expect(await read(page)).toBe(source);
});

test('fallback suspends bindings, stays editable and resumes Normal without losing history', async ({ page }) => {
  await open(page);
  await enable(page);
  await page.keyboard.type('i');
  await presentation(page, 'Plain text fallback');
  await expect(mode(page)).toHaveText('Vim · Suspended (plain text)');
  const plain = page.getByLabel('Markdown source (plain text fallback)');
  await plain.press('Control+End');
  // A paste is one textarea input event; typed fallback keys are separate edits.
  await page.keyboard.insertText('Fallback edit');
  expect(await read(page)).toBe(source + 'Fallback edit');
  await presentation(page, 'Raw source');
  await expect(mode(page)).toHaveText('Vim · Normal');
  await content(page).press('u');
  expect(await read(page)).toBe(source);
  await presentation(page, 'Plain text fallback');
  await revealChrome(page);
  await toggle(page).click();
  await expect(mode(page)).toHaveText('Vim · Off');
  await presentation(page, 'Live preview');
  await expect(mode(page)).toHaveText('Vim · Off');
});

test('Vim undo restores exact mixed line endings and leaves disk bytes untouched', async ({ page }) => {
  await open(page, 'Slice.md');
  await enable(page);
  await page.keyboard.type('iEdit');
  await page.keyboard.press('Escape');
  await presentation(page, 'Raw source');
  await content(page).press('u');
  expect(await read(page)).toBe(mixedSource);
  expect(await readFile(`${runtime}/wiki/Slice.md`)).toEqual(bytes);
});

test('Save shortcuts work in Normal and Insert without Vim consuming them', async ({ page }) => {
  await open(page);
  await enable(page);
  for (const [keys, expectedMode] of [['', 'Normal'], ['i', 'Insert']]) {
    if (keys) await page.keyboard.type(keys);
    await expect(mode(page)).toHaveText(`Vim · ${expectedMode}`);
    for (const key of ['Control+s', 'Meta+s']) {
      const response = page.waitForResponse(r => r.url().endsWith('/save/Vim.md') && r.request().method() === 'POST', { timeout: 3000 });
      await content(page).press(key);
      expect((await response).ok()).toBe(true);
      // Save retains the existing formatting pipeline, including prose reflow.
      await expect.poll(() => read(page)).toBe('# Vim test\n\nAlpha **bold** omega. Second line.\n');
      await expect(mode(page)).toHaveText(`Vim · ${expectedMode}`);
    }
  }
});

test('Escape dismisses proposals then navigation before changing Vim mode', async ({ page }) => {
  await open(page);
  await enable(page);
  await page.keyboard.type('i');
  await revealChrome(page);
  await page.getByRole('button', { name: 'Format', exact: true }).click();
  await expect(page.locator('[data-format-proposal]')).toBeVisible();
  const menu = page.getByRole('button', { name: 'Navigation and controls', exact: true });
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await content(page).focus();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-format-proposal]')).toBeHidden();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expect(mode(page)).toHaveText('Vim · Insert');
  await content(page).focus();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await expect(content(page)).toBeFocused();
  await expect(mode(page)).toHaveText('Vim · Insert');
  await page.keyboard.press('Escape');
  await expect(mode(page)).toHaveText('Vim · Normal');
  expect(await read(page)).toBe(source);
});

test('Tab exits every Vim mode and the off switch is keyboard reachable', async ({ page }) => {
  await open(page);
  await enable(page);
  for (const keys of ['', 'i', 'v']) {
    await content(page).press('Escape');
    if (keys) await page.keyboard.type(keys);
    await page.keyboard.press('Tab');
    await expect(content(page)).not.toBeFocused();
    await content(page).focus();
    await page.keyboard.press('Control+Shift+Period');
    await tabTo(page, toggle(page));
    await expect(toggle(page)).toBeFocused();
    if (keys === 'v') await page.keyboard.press('Enter');
    await page.keyboard.press('Control+Shift+Period');
    await content(page).focus();
  }
  await revealChrome(page);
  await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false');
  expect(await read(page)).toBe(source);
});

test('browser shortcuts remain uncancelled while Vim owns ordinary editing keys', async ({ page }) => {
  await open(page);
  await enable(page);
  // Synthetic events inspect cancellation without actually opening browser UI.
  for (const modifier of ['ctrlKey', 'metaKey']) {
    for (const key of ['l', 'f', 't', 'w', 'n', 'p']) {
      const uncancelled = await content(page).evaluate((el, { key, modifier }) => {
        return el.dispatchEvent(new KeyboardEvent('keydown', { key, [modifier]: true, bubbles: true, cancelable: true }));
      }, { key, modifier });
      expect(uncancelled, `${modifier}+${key}`).toBe(true);
    }
  }
  expect(await read(page)).toBe(source);
});

test('mobile users can disable Vim and edit fallback with no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  await revealChrome(page);
  await expect(toggle(page)).toBeVisible();
  await toggle(page).tap();
  await expect(mode(page)).toHaveText('Vim · Normal');
  await page.screenshot({ path: '/tmp/backstory-issue-2/vim-mobile.png', fullPage: true });
  await toggle(page).tap();
  await expect(mode(page)).toHaveText('Vim · Off');
  await presentation(page, 'Plain text fallback');
  await page.getByLabel('Markdown source (plain text fallback)').fill('Mobile fallback draft');
  expect(await read(page)).toBe('Mobile fallback draft');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('enhancement load failure leaves an ordinary editable fallback', async ({ page }) => {
  await page.route('**/static/editor.js', route => route.abort());
  await open(page, 'Vim.md', false);
  const plain = page.getByLabel('Markdown source (plain text fallback)');
  await expect(plain).toBeEditable();
  await plain.fill('Recoverable plain draft');
  await expect(plain).toHaveValue('Recoverable plain draft');
  await expect(toggle(page)).toBeHidden();
});

test('Vim edits retain guarded save conflicts and undoable formatting', async ({ page }) => {
  await open(page);
  await enable(page);
  await page.keyboard.type('ggiDraft ');
  await page.keyboard.press('Escape');
  const draft = await read(page);
  await revealChrome(page);
  await page.getByRole('button', { name: 'Format', exact: true }).click();
  await page.getByRole('button', { name: 'Apply formatted source', exact: true }).click();
  await content(page).focus();
  await page.keyboard.type('u');
  expect(await read(page)).toBe(draft);
  await writeFile(`${runtime}/wiki/Vim.md`, '# External edit\n');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Revision conflict', exact: true })).toBeVisible();
  expect(await read(page)).toBe(draft);
  await expect(page.getByLabel('Your draft', { exact: true })).toHaveValue(draft);
  expect(await readFile(`${runtime}/wiki/Vim.md`, 'utf8')).toBe('# External edit\n');
});

test('Vim Insert edits autosave through the existing pipeline without leaving Insert', async ({ page }) => {
  await open(page);
  await enable(page);
  await page.keyboard.type('ggiDraft ');
  await page.clock.runFor(5000);
  await expect(page.locator('[data-editor-status]')).toContainText('Saved');
  expect(await readFile(`${runtime}/wiki/Vim.md`, 'utf8')).toBe('Draft # Vim test\n\nAlpha **bold** omega. Second line.\n');
  expect(await read(page)).toBe('Draft # Vim test\n\nAlpha **bold** omega. Second line.\n');
  await expect(mode(page)).toHaveText('Vim · Insert');
});

test('authoritative source refresh preserves Vim mode and is undoable', async ({ page }) => {
  await open(page);
  await enable(page);
  await page.keyboard.type('i');
  await writeFile(`${runtime}/wiki/Vim.md`, '# Updated externally\n');
  await page.clock.runFor(5000);
  await expect.poll(() => read(page)).toBe('# Updated externally\n');
  await expect(mode(page)).toHaveText('Vim · Insert');
  await content(page).press('Escape');
  await page.keyboard.type('u');
  expect(await read(page)).toBe(source);
  expect(await readFile(`${runtime}/wiki/Vim.md`, 'utf8')).toBe('# Updated externally\n');
});

test('editor-only Vim shortcut toggles without changing source and ignores repeat/composition', async ({ page }) => {
  await open(page);
  await content(page).focus();
  await page.keyboard.press('Control+Shift+Space');
  await expect(mode(page)).toHaveText('Vim · Normal');
  await content(page).dispatchEvent('keydown', { key: ' ', code: 'Space', ctrlKey: true, shiftKey: true, repeat: true });
  await content(page).dispatchEvent('keydown', { key: ' ', code: 'Space', ctrlKey: true, shiftKey: true, isComposing: true });
  await expect(mode(page)).toHaveText('Vim · Normal');
  await page.keyboard.press('Meta+Shift+Space');
  await expect(mode(page)).toHaveText('Vim · Off');
  expect(await read(page)).toBe(source);
  await page.getByRole('button', { name: 'Save', exact: true }).focus();
  await page.keyboard.press('Control+Shift+Space');
  await expect(mode(page)).toHaveText('Vim · Off');
  await presentation(page, 'Plain text fallback');
  await page.getByLabel('Markdown source (plain text fallback)').focus();
  await page.keyboard.press('Control+Shift+Space');
  await expect(mode(page)).toHaveText('Vim · Off');
});

test('Escape returns focus to editor when proposal survives closing Menu', async ({ page }) => {
  // The preceding fallback test may still have a server-side autosave in flight.
  // Give this draft-only focus test its own fixture, not the shared Vim.md.
  const path = 'Vim-escape-proposal.md';
  await writeFile(`${runtime}/wiki/${path}`, source);
  await open(page, path);
  await revealChrome(page);
  const [formatted] = await Promise.all([
    page.waitForResponse(response => response.url().endsWith(`/format/${path}`) && response.request().method() === 'POST'),
    page.getByRole('button', { name: 'Format', exact: true }).click(),
  ]);
  expect(formatted.status()).toBe(200);
  await expect(page.locator('[data-format-proposal]')).toBeVisible();
  await page.keyboard.press('Control+Shift+Period');
  await page.getByRole('button', { name: 'Dismiss proposed formatting' }).focus();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-format-proposal]')).toBeHidden();
  await expect(content(page)).toBeFocused();
});
