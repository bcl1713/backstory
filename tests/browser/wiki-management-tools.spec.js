import { test, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { runtime } from './support/server.js';

async function login(page) {
  await page.addInitScript(() => {
    window.registeredWikiTools = {};
    Object.defineProperty(document, 'modelContext', { value: { registerTool(tool) { window.registeredWikiTools[tool.name] = tool; } } });
  });
  await page.goto('/accounts/login/');
  await page.getByLabel('Username', { exact: true }).fill('slice');
  await page.getByLabel('Password', { exact: true }).fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL('/');
}
async function call(page, name, input) {
  await expect.poll(() => page.evaluate(name => Boolean(window.registeredWikiTools[name]), name)).toBe(true);
  return page.evaluate(async ({ name, input }) => JSON.parse(await window.registeredWikiTools[name].execute(input)), { name, input });
}
async function prepareMove(page, input) {
  const queued = await call(page, 'preview_move', input);
  expect(queued).toMatchObject({ state: 'preparing', next_action: 'get_move', poll_after_ms: 1000, authoritative: false });
  expect(queued.review_token).toBeUndefined();
  expect(queued.inventory).toBeUndefined();
  // The browser fixture supervises only the HTTP server. Run its separate
  // worker explicitly, then deliberately inspect the same durable handle.
  execFileSync('.venv/bin/python', ['-c', 'import django; django.setup(); from wiki.move_previews import run_pending_move_preview; assert run_pending_move_preview()'], {
    env: { ...process.env, DJANGO_SETTINGS_MODULE: 'backstory.settings', BACKSTORY_WIKI_ROOT: `${runtime}/wiki`, BACKSTORY_DATA_DIR: `${runtime}/data`, BACKSTORY_IDENTITY_PATH: '.backstory-marker', BACKSTORY_COOKIE_MODE: 'localhost', BACKSTORY_ALLOWED_HOSTS: 'localhost,127.0.0.1' }, stdio: 'pipe', timeout: 30000,
  });
  const review = await call(page, 'get_move', { operation_id: queued.operation_id });
  expect(review).toMatchObject({ state: 'preview', operation_id: queued.operation_id });
  return review;
}
const source = page => page.evaluate(() => document.querySelector('[data-markdown-editor]').markdownEditor.getSource());
const setSource = (page, value) => page.evaluate(value => document.querySelector('[data-markdown-editor]').markdownEditor.setSource(value), value);

test('tool fixture lifecycle creates, edits, restores history, removes and restores note and parent without residue', async ({ page }) => {
  await login(page);
  expect((await call(page, 'create_folder', { path: 'Tool lifecycle' })).state).toBe('created');
  const created = await call(page, 'create_note', { path: 'Tool lifecycle/Fixture.md', source: '# Fixture\n' });
  expect(created.state).toBe('created');
  const edited = await call(page, 'save_note', { path: created.path, source: created.source + '\nEdited\n', revision: created.revision });
  expect(edited.state).toBe('saved');
  const history = await call(page, 'list_note_history', { path: created.path, limit: 1 });
  expect(history.items.length).toBe(1);
  const backup = await call(page, 'read_note_revision', { revision_id: history.items[0].revision_id });
  expect(backup.source).toBe(created.source);
  const restored = await call(page, 'restore_note_revision', { path: created.path, revision_id: backup.revision_id, revision: edited.revision });
  expect(restored).toMatchObject({ state: 'saved_source', source: created.source, revision: created.revision, authoritative: true });
  const removal = await call(page, 'preview_removal', { path: created.path, kind: 'note', revision: restored.revision });
  expect(removal.state).toBe('preview');
  expect((await call(page, 'commit_removal', { operation_id: removal.operation_id })).state).toBe('removed');
  expect((await call(page, 'read_note', { path: created.path })).reason_code).toBe('not_found');
  const folder = await call(page, 'preview_removal', { path: 'Tool lifecycle', kind: 'folder' });
  expect((await call(page, 'commit_removal', { operation_id: folder.operation_id })).state).toBe('removed');
  expect((await call(page, 'restore_removal', { operation_id: folder.operation_id })).state).toBe('restored');
  expect((await call(page, 'restore_removal', { operation_id: removal.operation_id })).state).toBe('restored');
  const observed = await call(page, 'read_note', { path: created.path });
  expect([observed.source, observed.revision]).toEqual([created.source, created.revision]);
  const lastNote = await call(page, 'preview_removal', { path: created.path, kind: 'note', revision: observed.revision });
  expect((await call(page, 'commit_removal', { operation_id: lastNote.operation_id })).state).toBe('removed');
  const lastFolder = await call(page, 'preview_removal', { path: 'Tool lifecycle', kind: 'folder' });
  expect((await call(page, 'commit_removal', { operation_id: lastFolder.operation_id })).state).toBe('removed');
  const listing = await call(page, 'list_notes', {});
  expect(listing.entries.some(entry => entry.path === 'Tool lifecycle')).toBe(false);
});

test('move protects an incoming-link editor draft, then rewrites links without navigation', async ({ page }) => {
  const original = '# Links\n\n[[Tool move from]]\n';
  await writeFile(`${runtime}/wiki/Tool move from.md`, '# From\n');
  await writeFile(`${runtime}/wiki/Tool move links.md`, original);
  await login(page);
  await page.goto('/notes/Tool%20move%20links.md');
  await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');
  await setSource(page, '# Keep this human draft\n');
  const review = await prepareMove(page, { source: 'Tool move from.md', destination: 'Tool move to.md' });
  expect(review.state).toBe('preview');
  expect(review.affected_paths).toContain('Tool move links.md');
  const args = { operation_id: review.operation_id, review_token: review.review_token };
  const refused = await call(page, 'commit_move', args);
  expect(refused).toMatchObject({ reason_code: 'unsaved_editor_draft', request_started: false, queued: false });
  expect(await source(page)).toBe('# Keep this human draft\n');
  await page.screenshot({ path: `${runtime}/move-preserved-incoming-draft.png` });
  await setSource(page, original);
  const moved = await call(page, 'commit_move', args);
  expect(moved).toMatchObject({ state: 'completed', path: 'Tool move to.md', authoritative: true });
  expect(new URL(page.url()).pathname).toBe('/notes/Tool%20move%20links.md');
  await expect.poll(() => source(page)).toContain('[[Tool move to]]');
  expect(await readFile(`${runtime}/wiki/Tool move links.md`, 'utf8')).toContain('[[Tool move to]]');
});

test('folder move and empty-folder removal protect new child drafts missing from disk inventory', async ({ page }) => {
  await login(page);
  await call(page, 'create_folder', { path: 'Tool draft folder' });
  const move = await prepareMove(page, { source: 'Tool draft folder', destination: 'Tool folder archive' });
  const removal = await call(page, 'preview_removal', { path: 'Tool draft folder', kind: 'folder' });
  await page.goto('/new/?folder=Tool%20draft%20folder');
  await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');
  await page.locator('#note-filename').fill('Unsaved.md');
  await setSource(page, '# Never discard\n');
  expect((await call(page, 'commit_move', { operation_id: move.operation_id, review_token: move.review_token })).reason_code).toBe('unsaved_editor_draft');
  expect((await call(page, 'commit_removal', { operation_id: removal.operation_id })).reason_code).toBe('unsaved_editor_draft');
  expect(await source(page)).toBe('# Never discard\n');
  await expect(page.locator('[data-save]')).toBeEnabled();
});

test('lost removal acknowledgement exposes inspectable operation and never replays', async ({ page }) => {
  await writeFile(`${runtime}/wiki/Tool remove lost.md`, '# Original\n');
  await login(page);
  const base = await call(page, 'read_note', { path: 'Tool remove lost.md' });
  const preview = await call(page, 'preview_removal', { path: base.path, kind: 'note', revision: base.revision });
  let posts = 0;
  await page.route('**/tools/removals/commit/', async route => { posts++; await route.fetch(); await route.abort('failed'); });
  const result = await call(page, 'commit_removal', { operation_id: preview.operation_id });
  expect(result).toMatchObject({ state: 'uncertain', operation_id: preview.operation_id, read_before_retry: true });
  expect(posts).toBe(1);
  expect((await call(page, 'get_removal', { operation_id: preview.operation_id })).state).toBe('removed');
  expect((await call(page, 'restore_removal', { operation_id: preview.operation_id })).state).toBe('restored');
  expect((await call(page, 'read_note', { path: base.path })).revision).toBe(base.revision);
});

test('bounded diagnostic tool identifies the one malformed indexed source without reading wiki bodies', async ({ page }) => {
  await writeFile(`${runtime}/wiki/Tool malformed.md`, '---\nx: [\n---\n# Synthetic diagnostic fixture\n');
  execFileSync('.venv/bin/python', ['-c', 'import django; django.setup(); from indexing import worker; from tests.integration.test_indexing import drain; drain(worker)'], {
    env: { ...process.env, DJANGO_SETTINGS_MODULE: 'backstory.settings', BACKSTORY_WIKI_ROOT: `${runtime}/wiki`, BACKSTORY_DATA_DIR: `${runtime}/data`, BACKSTORY_IDENTITY_PATH: '.backstory-marker', BACKSTORY_COOKIE_MODE: 'localhost', BACKSTORY_ALLOWED_HOSTS: 'localhost,127.0.0.1' }, stdio: 'pipe', timeout: 30000,
  });
  await login(page);
  const result = await call(page, 'get_index_diagnostics', { limit: 10 });
  expect(result.state).toBe('incomplete');
  expect(result.projection_complete).toBe(false);
  expect(result.enumeration_complete).toBe(true);
  expect(result.items).toHaveLength(1);
  expect(result.items[0]).toMatchObject({ path: 'Tool malformed.md', diagnostic_codes: ['metadata_parse_error'], pending: false });
  expect(JSON.stringify(result)).not.toContain('Synthetic diagnostic fixture');
  const status = await call(page, 'wiki_status', {});
  expect(status.capabilities).toMatchObject({ index_diagnostics: true, relocation: true, note_history: true, recoverable_removal: { notes: true, empty_folders: true, recursive: false, purge: false } });
  expect(status.relationships.projection_complete).toBe(false);
});
