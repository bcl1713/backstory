import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { runtime } from './support/server.js';

const source = '# Start here\n\n[[Other#Details|Wiki alias]] and [Markdown label](Other.md#Details).\nContinuation in the same paragraph.\n\n[[Other]]\n\n[[MissingLive|Missing label]] [[SharedLive|Ambiguous label]]\n\n`[[Other|Code label]]` and \\[[Other|Escaped label]]\n\n```md\n[[Other|Fenced label]]\n```\n';
const editor = page => page.locator('[data-markdown-editor]');
const read = page => editor(page).evaluate(el => el.markdownEditor.getSource());
const select = (page, anchor, head = anchor) => editor(page).evaluate((el, range) => el.markdownEditor.view.dispatch({ selection: range }), { anchor, head });
async function open(page) {
  await page.goto('/accounts/login/');
  await page.getByLabel('Username').fill('slice');
  await page.getByLabel('Password').fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.goto('/notes/LiveLinks.md');
}

test.beforeAll(async () => {
  await writeFile(`${runtime}/wiki/LiveLinks.md`, source);
  for (const folder of ['live-a', 'live-b']) {
    await mkdir(`${runtime}/wiki/${folder}`, { recursive: true });
    await writeFile(`${runtime}/wiki/${folder}/SharedLive.md`, '# Duplicate basename\n');
  }
  const env = { ...process.env, DJANGO_SETTINGS_MODULE: 'backstory.settings', BACKSTORY_WIKI_ROOT: `${runtime}/wiki`, BACKSTORY_DATA_DIR: `${runtime}/data`, BACKSTORY_IDENTITY_PATH: '.backstory-marker', BACKSTORY_COOKIE_MODE: 'localhost', BACKSTORY_ALLOWED_HOSTS: 'localhost,127.0.0.1' };
  const result = spawnSync('.venv/bin/python', ['-c', "import django; django.setup(); from indexing.queue import request_scan; from indexing.worker import run_batch; request_scan('rebuild')\nfor n in range(500):\n r=run_batch(now=10000000000+n*400)\n if not r.pending: break\nelse: raise SystemExit(9)"], { env, encoding: 'utf8' });
  expect(result.status, result.stderr).toBe(0);
});

test('inactive aliases and ordinary links have safe destinations; only selected lines reveal source', async ({ page }) => {
  await open(page);
  const alias = page.getByRole('link', { name: 'Wiki alias', exact: true });
  await expect(alias).toHaveAttribute('href', '/notes/Other.md#preview-details');
  await expect(page.getByRole('link', { name: 'Markdown label', exact: true })).toHaveAttribute('href', '/notes/Other.md#preview-details');
  await expect(editor(page).getByRole('link', { name: 'Other', exact: true })).toHaveAttribute('href', '/notes/Other.md');
  await select(page, source.indexOf('Continuation'));
  await expect(alias).toBeVisible();
  await select(page, source.indexOf('Wiki alias'));
  await expect(alias).toHaveCount(0);
  await expect(page.locator('.cm-content')).toContainText('[[Other#Details|Wiki alias]]');
  await expect(page.getByRole('link', { name: 'Markdown label', exact: true })).toHaveCount(0);
  await select(page, source.indexOf('[[Other]]') + 3, source.indexOf('Wiki alias'));
  await expect(editor(page).getByRole('link', { name: 'Other', exact: true })).toHaveCount(0);
  await select(page, 0);
  await page.getByRole('button', { name: 'Raw source', exact: true }).click();
  await expect(alias).toHaveCount(0);
  await expect(page.locator('.cm-content')).toContainText('[[Other#Details|Wiki alias]]');
  await page.getByRole('button', { name: 'Live preview', exact: true }).click();
  await expect(alias).toBeVisible();
  expect(await read(page)).toBe(source);
  await expect(page.locator('[data-editor-status]')).toHaveText('Unchanged');
});

test('pointer and keyboard can follow rendered links without entering source first', async ({ page }) => {
  await open(page);
  await page.getByRole('link', { name: 'Wiki alias', exact: true }).tap();
  await expect(page).toHaveURL(/\/notes\/Other.md#preview-details$/);
  await page.goto('/notes/LiveLinks.md');
  const link = page.getByRole('link', { name: 'Markdown label', exact: true });
  await link.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/notes\/Other.md#preview-details$/);
});

test('missing and ambiguous destinations stay non-navigable and code/escapes remain literal', async ({ page }) => {
  await open(page);
  await expect(editor(page).locator('.lp-link-missing')).toHaveText('Missing label');
  await expect(editor(page).locator('.lp-link-ambiguous')).toHaveText('Ambiguous label');
  for (const name of ['Missing label', 'Ambiguous label', 'Code label', 'Escaped label', 'Fenced label']) {
    await expect(editor(page).getByRole('link', { name, exact: true })).toHaveCount(0);
  }
  expect(await read(page)).toBe(source);
});

test('rendered link navigation retains a dirty draft when leaving is cancelled', async ({ page }) => {
  await open(page);
  await editor(page).evaluate(el => el.markdownEditor.view.dispatch({ changes: { from: 0, insert: 'Draft ' } }));
  const draft = await read(page);
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('link', { name: 'Wiki alias', exact: true }).click();
  await expect(page).toHaveURL(/\/notes\/LiveLinks.md$/);
  expect(await read(page)).toBe(draft);
});

test('a delayed old resolution cannot restore a link after its source changes', async ({ page }) => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  let started;
  const waiting = new Promise(resolve => { started = resolve; });
  await page.route('**/resolve/**', async route => {
    if (new URL(route.request().url()).searchParams.get('target') === 'Other#Details|Wiki alias') {
      const response = await route.fetch();
      started();
      await gate;
      await route.fulfill({ response });
    } else await route.continue();
  });
  await open(page);
  await waiting;
  const changed = '# Cursor\n\n[[Other|New label]]\n';
  await editor(page).evaluate((el, value) => el.markdownEditor.setSource(value), changed);
  release();
  await expect(page.getByRole('link', { name: 'New label', exact: true })).toHaveAttribute('href', '/notes/Other.md');
  await expect(page.getByRole('link', { name: 'Wiki alias', exact: true })).toHaveCount(0);
  expect(await read(page)).toBe(changed);
});
