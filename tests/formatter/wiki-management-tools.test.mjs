import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('management mutations inspect affected paths, guard drafts, serialize inspection and never replay uncertain writes', async () => {
  const registered = {}, guards = [], requests = [];
  let dirty = true, hold, release;
  const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  globalThis.document = {
    querySelector: selector => selector === '[data-wiki-tools]' ? {} : selector === '[name=csrfmiddlewaretoken]' ? { value: 'synthetic' } : selector === '[data-markdown-editor]' ? {} : null,
    dispatchEvent(event) { if (event.type === 'backstory:tool-save-start') { guards.push(event.detail); event.detail.editorReady = true; if (dirty && (event.detail.paths.includes('Human.md') || event.detail.prefixes.includes('Drafts'))) event.detail.reason_code = 'unsaved_editor_draft'; } },
    modelContext: { registerTool: tool => { registered[tool.name] = tool; } },
  };
  globalThis.window = { addEventListener() {} };
  globalThis.location = { origin: 'http://synthetic.test' };
  globalThis.CustomEvent = class { constructor(type, options) { this.type = type; this.detail = options.detail; } };
  const response = (url, payload) => ({ ok: true, status: 200, url: 'http://synthetic.test' + url, headers: { get: () => 'application/json' }, json: async () => ({ ...payload, untrusted_content: true }) });
  globalThis.fetch = async (url, options) => {
    requests.push({ url, method: options.method });
    if (url.startsWith('/tools/moves/get/')) {
      if (hold) await new Promise(resolve => { release = resolve; });
      return response(url, { state: 'preview', kind: 'note', operation_id: id, affected_paths: ['a.md', 'Human.md'], review_token: 'review', authoritative: false });
    }
    throw new Error('synthetic lost acknowledgement');
  };
  const source = (await readFile(new URL('../../static/src/wiki-tools.js', import.meta.url), 'utf8')).replace("import { ensureWikiTimezone } from './wiki-timezone.js';", 'const ensureWikiTimezone = async () => {};');
  await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
  const args = { operation_id: id, review_token: 'review' };
  const rejected = JSON.parse(await registered.commit_move.execute(args));
  assert.equal(rejected.reason_code, 'unsaved_editor_draft');
  assert.equal(rejected.request_started, false);
  assert.equal(requests.filter(r => r.method === 'POST').length, 0);
  assert.deepEqual(guards[0].paths, ['a.md', 'Human.md']);
  dirty = false; hold = true;
  const pending = registered.commit_move.execute(args);
  await new Promise(resolve => setImmediate(resolve));
  const busy = JSON.parse(await registered.preview_removal.execute({ path: 'b.md', kind: 'note', revision: '"' + 'a'.repeat(64) + '"' }));
  assert.equal(busy.reason_code, 'save_in_progress');
  assert.equal(busy.queued, false);
  hold = false; release();
  const uncertain = JSON.parse(await pending);
  assert.equal(uncertain.state, 'uncertain');
  assert.equal(uncertain.operation_id, id);
  assert.equal(uncertain.read_before_retry, true);
  assert.equal(requests.filter(r => r.method === 'POST').length, 1);
  dirty = true;
  globalThis.fetch = async url => response(url, { state: 'preview', kind: 'folder', operation_id: id, affected_paths: ['Drafts', 'Archive'], review_token: 'review', authoritative: false });
  const folderRejected = JSON.parse(await registered.commit_move.execute(args));
  assert.equal(folderRejected.reason_code, 'unsaved_editor_draft');
  assert.deepEqual(guards.at(-1).prefixes, ['Drafts', 'Archive']);
  assert.equal(registered.get_index_diagnostics.annotations.readOnlyHint, true);
  assert.equal(registered.get_removal.annotations.readOnlyHint, true);
  assert.equal(registered.read_note_revision.annotations.readOnlyHint, true);
  assert.equal(registered.restore_note_revision.annotations.consequentialHint, true);
  assert.equal(JSON.parse(await registered.restore_note_revision.execute({ revision_id: 1, revision: '"' + 'a'.repeat(64) + '"' })).reason_code, 'invalid_arguments');
});
