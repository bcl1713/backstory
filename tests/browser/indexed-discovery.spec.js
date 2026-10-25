import { test, expect } from '@playwright/test';
import { readFile, writeFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { runtime } from './support/server.js';

async function python(program) {
  const identity = await readFile(`${runtime}/wiki/Storage identity.txt`);
  const env = { ...process.env, DJANGO_SETTINGS_MODULE: 'backstory.settings', BACKSTORY_WIKI_ROOT: `${runtime}/wiki`, BACKSTORY_DATA_DIR: `${runtime}/data`, BACKSTORY_IDENTITY_PATH: 'Storage identity.txt', BACKSTORY_IDENTITY_SHA256: createHash('sha256').update(identity).digest('hex'), BACKSTORY_COOKIE_MODE: 'localhost', BACKSTORY_ALLOWED_HOSTS: 'localhost,127.0.0.1' };
  const result = spawnSync('.venv/bin/python', ['-c', program], { env, encoding: 'utf8', timeout: 120000 });
  expect(result.status, result.stderr).toBe(0);
}
async function login(page) {
  await page.goto('/accounts/login/');
  await page.getByLabel('Username').fill('slice');
  await page.getByLabel('Password').fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in' }).click();
}

test('explicit link discovery is inert until requested and preserves the editor document', async ({ page }) => {
  await login(page);
  const requests = [];
  page.on('request', request => { if (/\/(resolve|index|search)\//.test(request.url())) requests.push(request.url()); });
  await page.goto('/notes/Slice.md');
  const source = await page.locator('[data-markdown-editor]').evaluate(el => el.markdownEditor.getSource());
  await page.getByRole('button', { name: 'Raw source', exact: true }).click();
  await page.getByRole('button', { name: 'Live preview', exact: true }).click();
  await page.locator('.cm-content').click();
  expect(requests).toEqual([]);
  await page.getByLabel('Link target', { exact: true }).fill('Other#Details|Local target');
  await page.getByRole('button', { name: 'Resolve link', exact: true }).click();
  await expect(page.locator('[data-link-result] a')).toHaveAttribute('href', '/notes/Other.md#preview-details');
  expect(requests).toHaveLength(1);
  expect(await page.locator('[data-markdown-editor]').evaluate(el => el.markdownEditor.getSource())).toBe(source);
  await expect(page.locator('[data-editor-status]')).toHaveText('Unchanged');
});

test('representative search reports partial state, then opens current disk content after indexing', async ({ page }) => {
  test.setTimeout(120000);
  await python("import pathlib,tempfile; from tests.fixtures.generate import generate_fixture; from shutil import copytree; p=pathlib.Path(tempfile.mkdtemp(prefix='search-corpus-',dir='/tmp/backstory-release-one')); f=generate_fixture(p/'fixture','representative'); copytree(f.wiki_root,pathlib.Path('" + runtime + "/wiki'),dirs_exist_ok=True)");
  await writeFile(`${runtime}/wiki/Search observer.md`, '# Search observer\n\nobserverneedleunique\n');
  await python("import django; django.setup(); from indexing.models import IndexGeneration,IndexJob,ScanState; IndexGeneration.objects.all().delete(); IndexJob.objects.all().delete(); ScanState.objects.all().delete(); from indexing.queue import request_scan; from indexing.worker import run_batch; request_scan('rebuild'); run_batch()");
  await login(page);
  await page.goto('/search/?q=synthetic');
  await expect(page.getByRole('status')).toContainText('partial');
  await python("import django; django.setup(); from indexing.worker import run_batch\nfor n in range(500):\n r=run_batch(now=10000000000+n*400)\n if not r.pending: break\nelse: raise SystemExit(9)");
  await page.goto('/search/?q=synthetic');
  await expect(page.getByRole('status')).toContainText('ready');
  await expect(page.getByRole('link', { name: 'Next page', exact: true })).toBeVisible();
  const response = await page.request.get('/search/?q=synthetic');
  expect((await response.body()).length).toBeLessThan(40000);
  await writeFile(`${runtime}/wiki/Search observer.md`, '# Current external disk content\n');
  await page.goto('/search/?' + new URLSearchParams({ q: 'observerneedleunique' }));
  await page.getByRole('link', { name: 'Search observer', exact: true }).click();
  await expect(page.locator('.cm-content')).toContainText('Current external disk content');
  const fresh = await readFile(`${runtime}/wiki/Search observer.md`, 'utf8');
  expect(await page.locator('[data-markdown-editor]').evaluate(el => el.markdownEditor.getSource())).toBe(fresh);
  await rm(`${runtime}/wiki/Search observer.md`);
  await page.goto('/search/?' + new URLSearchParams({ q: 'observerneedleunique' }));
  await expect(page.getByText('No available matches in this page.')).toBeVisible();
});

for (const presentation of ['live', 'source']) test(`${presentation}: direct and resolved duplicate heading fragments select current source without edits`, async ({ page }) => {
  const source = '# Intro\n\n# **Café** heading\n\nFirst.\n\n# **Café** heading\n\nSecond.\n';
  const path = `${runtime}/wiki/Heading.md`;
  await writeFile(path, source);
  const expected = source.indexOf('# **Café**', source.indexOf('# **Café**') + 1);
  await login(page);
  await page.goto('/notes/Heading.md#preview-caf%C3%A9-heading-1');
  const editor = page.locator('[data-markdown-editor]');
  await expect.poll(() => editor.evaluate(el => el.markdownEditor.view.state.selection.main.head)).toBe(expected);
  await page.getByRole('button', { name: presentation === 'source' ? 'Raw source' : 'Live preview', exact: true }).click();
  expect(await editor.evaluate(el => el.markdownEditor.getSource())).toBe(source);
  await expect(page.locator('[data-editor-status]')).toHaveText('Unchanged');
  await editor.evaluate(el => el.markdownEditor.view.dispatch({ changes: { from: el.markdownEditor.view.state.doc.length, insert: 'draft' } }));
  await page.evaluate(() => { location.hash = '#preview-caf%C3%A9-heading'; });
  await expect.poll(() => editor.evaluate(el => el.markdownEditor.view.state.selection.main.head)).toBe(source.indexOf('# **Café**'));
  await page.locator('.cm-content').focus();
  await page.keyboard.press('Control+z');
  expect(await editor.evaluate(el => el.markdownEditor.getSource())).toBe(source);
  await expect(page.locator('[data-editor-status]')).toHaveText('Unchanged');
  await page.goto('/notes/Slice.md');
  await page.getByLabel('Link target', { exact: true }).fill('Heading#Café heading-1|Second heading');
  await page.getByRole('button', { name: 'Resolve link', exact: true }).click();
  await page.locator('[data-link-result] a').click();
  await page.waitForFunction(() => document.querySelector('[data-markdown-editor]')?.markdownEditor);
  await expect.poll(() => editor.evaluate(el => el.markdownEditor.view.state.selection.main.head)).toBe(expected);
  expect(await editor.evaluate(el => el.markdownEditor.getSource())).toBe(source);
  expect(await readFile(path, 'utf8')).toBe(source);
  await expect(page.locator('[data-editor-status]')).toHaveText('Unchanged');
});

test('current-document heading slugs match safe preview for markup, entities, code and collision suffixes', async ({ page }) => {
  const headings = ['# A', '# A', '# A-1', '# [**Label**](Other.md)', '# [Title label](Other.md "ignored title")', '# `[label](target)`', '# `[[raw|literal]]`', '# [[Other|Wiki label]]', '# Fish &amp; Chips', '# 東京 café', '# Under_score heading', '# [Literal][undefined-reference]'];
  const source = headings.join('\n\n') + '\n';
  await writeFile(`${runtime}/wiki/Slug cases.md`, source);
  await login(page);
  const csrf = await page.locator('[name=csrfmiddlewaretoken]').first().inputValue();
  const preview = await page.request.post('/preview/Slice.md', { data: { source }, headers: { 'X-CSRFToken': csrf } });
  expect(preview.ok()).toBe(true);
  const { html } = await preview.json();
  const slugs = [...html.matchAll(/id="(preview-[^"]+)"/g)].map(match => match[1]);
  expect(slugs).toHaveLength(headings.length);
  await page.goto('/notes/Slug%20cases.md');
  let expected = 0;
  for (let n = 0; n < headings.length; n++) {
    await page.evaluate(hash => { location.hash = '#' + encodeURIComponent(hash); }, slugs[n]);
    await expect.poll(() => page.locator('[data-markdown-editor]').evaluate(el => el.markdownEditor.view.state.selection.main.head)).toBe(expected);
    expected += headings[n].length + 2;
  }
  await expect(page.locator('[data-editor-status]')).toHaveText('Unchanged');
});

for (const presentation of ['live', 'source']) test(`${presentation}: resolved reference heading fragments preserve current source and undo`, async ({ page }) => {
  const source = 'Opening paragraph\n\n# [Label][target]\n\n[target]: Other.md\n\nUnresolved [plain][missing] and <https://example.invalid/>.\n';
  const path = `${runtime}/wiki/References.md`;
  await writeFile(path, source);
  const expected = source.indexOf('# [Label]');
  await login(page);
  await page.goto('/notes/References.md');
  const editor = page.locator('[data-markdown-editor]');
  await page.getByRole('button', { name: presentation === 'source' ? 'Raw source' : 'Live preview', exact: true }).click();
  await page.evaluate(() => { location.hash = '#preview-label'; });
  await expect.poll(() => editor.evaluate(el => el.markdownEditor.view.state.selection.main.head)).toBe(expected);
  expect(await editor.evaluate(el => el.markdownEditor.getSource())).toBe(source);
  await expect(page.locator('[data-editor-status]')).toHaveText('Unchanged');
  await editor.evaluate(el => el.markdownEditor.view.dispatch({ changes: { from: el.markdownEditor.view.state.doc.length, insert: 'draft' } }));
  await page.evaluate(() => { location.hash = '#preview-unmatched'; });
  await page.evaluate(() => { location.hash = '#preview-label'; });
  await page.locator('.cm-content').focus();
  await page.keyboard.press('Control+z');
  expect(await editor.evaluate(el => el.markdownEditor.getSource())).toBe(source);
  await expect(page.locator('[data-editor-status]')).toHaveText('Unchanged');
  await page.goto('/notes/Slice.md');
  await page.getByLabel('Link target', { exact: true }).fill('References#Label|Reference heading');
  await page.getByRole('button', { name: 'Resolve link', exact: true }).click();
  await page.locator('[data-link-result] a').click();
  await page.waitForFunction(() => document.querySelector('[data-markdown-editor]')?.markdownEditor);
  await expect.poll(() => editor.evaluate(el => el.markdownEditor.view.state.selection.main.head)).toBe(expected);
  await page.getByRole('button', { name: presentation === 'source' ? 'Raw source' : 'Live preview', exact: true }).click();
  expect(await editor.evaluate(el => el.markdownEditor.getSource())).toBe(source);
  expect(await readFile(path, 'utf8')).toBe(source);
});
