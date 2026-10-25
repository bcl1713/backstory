import { test, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { runtime } from './support/server.js';

async function python(program) {
  const env = { ...process.env, DJANGO_SETTINGS_MODULE: 'backstory.settings', BACKSTORY_WIKI_ROOT: `${runtime}/wiki`, BACKSTORY_DATA_DIR: `${runtime}/data`, BACKSTORY_IDENTITY_PATH: '.backstory-marker', BACKSTORY_COOKIE_MODE: 'localhost', BACKSTORY_ALLOWED_HOSTS: 'localhost,127.0.0.1' };
  const r = spawnSync('.venv/bin/python', ['-c', program], { env, encoding: 'utf8', timeout: 120000 });
  expect(r.status, r.stderr).toBe(0);
}
const editor = page => page.locator('[data-markdown-editor]');
const source = page => editor(page).evaluate(el => el.markdownEditor.getSource());

test('full generated corpus stays server-side during paused/resumed maintenance and ordinary large-note editing', async ({ page, context }) => {
  test.setTimeout(120000);
  // The generated source collection has exactly 1000 notes, 299 dailies and
  // 699000-byte Large.md. Browser-only slice notes remain additional fixtures.
  await python("import pathlib,tempfile; from tests.fixtures.generate import generate_fixture; from shutil import copytree; p=pathlib.Path(tempfile.mkdtemp(prefix='task11-corpus-',dir='/tmp/backstory-release-one')); f=generate_fixture(p/'fixture','representative'); copytree(f.wiki_root,pathlib.Path('" + runtime + "/wiki'),dirs_exist_ok=True)");
  await python("import django; django.setup(); from indexing.queue import request_scan; from indexing.worker import run_batch; request_scan('rebuild'); run_batch()");
  const external = [];
  await context.route('**/*', route => {
    if (new URL(route.request().url()).hostname !== '127.0.0.1') { external.push(route.request().url()); return route.abort(); }
    return route.continue();
  });
  await page.goto('/accounts/login/');
  await page.getByLabel('Username', { exact: true }).fill('slice');
  await page.getByLabel('Password', { exact: true }).fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.goto('/?folder=daily%2F2026');
  expect((await page.request.get('/folders/daily/2026?limit=1000')).status()).toBe(400);
  const folder = await page.request.get('/folders/daily/2026');
  expect((await folder.json()).entries.length).toBeLessThanOrEqual(100);
  await page.goto('/search/?q=synthetic');
  await expect(page.getByRole('status')).toContainText('partial');
  const requests = [];
  page.on('request', r => requests.push(new URL(r.url()).pathname));
  await page.goto('/notes/reference/Large.md');
  await page.waitForFunction(() => document.querySelector('[data-markdown-editor]')?.markdownEditor);
  expect(Buffer.byteLength(await source(page))).toBe(699000);
  await page.getByRole('button', { name: 'Raw source', exact: true }).click();
  await page.locator('.cm-content').focus();
  await page.keyboard.press('Control+End');
  await page.keyboard.insertText('\nOrdinary large note draft\n');
  const edited = await source(page);
  await page.getByRole('button', { name: 'Live preview', exact: true }).click();
  await page.locator('.cm-content').focus();
  await page.keyboard.press('Control+z');
  expect(Buffer.byteLength(await source(page))).toBe(699000);
  await page.keyboard.press('Control+Shift+Z');
  expect(await source(page)).toBe(edited);
  // Explicit protected recovery during paused maintenance; it does not save.
  await page.getByRole('button', { name: 'Store protected draft', exact: true }).click();
  await expect(page.locator('[data-editor-status]')).toContainText('Protected draft stored');
  await python("import django; django.setup(); from indexing.worker import run_batch\nfor n in range(500):\n r=run_batch(now=10000000000+n*400)\n if not r.pending: break\nelse: raise SystemExit(9)");
  expect(await source(page)).toBe(edited);
  expect(requests.some(p => /\/(index|backlinks|scan)\//.test(p))).toBe(false);
  expect(requests.filter(p => p.startsWith('/notes/'))).toEqual(['/notes/reference/Large.md']);
  const storage = await page.evaluate(async () => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage), databases: await indexedDB.databases(), caches: await caches.keys(), workers: (await navigator.serviceWorker.getRegistrations()).length }));
  expect(storage).toEqual({ local: [], session: [], databases: [], caches: [], workers: 0 });
  expect((await context.cookies()).filter(c => !['sessionid', 'csrftoken'].includes(c.name))).toEqual([]);
  page.once('dialog', d => d.accept());
  await page.goto('/notes/Slice.md');
  await page.getByRole('link', { name: 'Open safe server preview' }).click();
  expect(external).toEqual([]);
  await page.goto('/search/?q=synthetic');
  await expect(page.getByRole('status')).toContainText('ready');
  const search = await page.request.get('/search/?q=synthetic');
  expect((await search.body()).length).toBeLessThan(50000);
  await page.goto('/notes/Slice.md');
  for (const target of ['No such note', 'synthetic-duplicate', '']) {
    await page.getByLabel('Link target', { exact: true }).fill(target);
    if (target) {
      await page.getByRole('button', { name: 'Resolve link' }).click();
      await expect(page.locator('[data-link-result]')).toContainText(target === 'synthetic-duplicate' ? 'ambiguous' : 'missing');
    } else {
      await page.getByRole('button', { name: 'Resolve link' }).click();
      expect(await page.getByLabel('Link target', { exact: true }).evaluate(el => el.validity.valueMissing)).toBe(true);
    }
  }
});
