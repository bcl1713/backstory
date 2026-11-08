import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('overlapping cross-path saves are explicitly not started, never queued', async () => {
  const registered = {};
  globalThis.timezoneCalls = 0;
  globalThis.document = {
    querySelector: selector => selector === '[data-wiki-tools]' ? {} : selector === '[name=csrfmiddlewaretoken]' ? { value: 'synthetic' } : null,
    dispatchEvent() {},
    modelContext: { registerTool: tool => { registered[tool.name] = tool; } },
  };
  globalThis.window = { addEventListener() {} };
  globalThis.location = { origin: 'http://synthetic.test' };
  globalThis.CustomEvent = class { constructor(type, options) { this.type = type; this.detail = options.detail; } };
  let release, posts = 0;
  globalThis.fetch = async () => {
    posts++;
    return new Promise(resolve => { release = () => resolve({ ok: true, status: 200, url: 'http://synthetic.test/tools/save/', headers: { get: () => 'application/json' }, json: async () => ({ state: 'saved', path: 'a.md', source: 'saved', revision: '"' + 'b'.repeat(64) + '"', authoritative: true, untrusted_content: true }) }); });
  };
  const source = (await readFile(new URL('../../static/src/wiki-tools.js', import.meta.url), 'utf8')).replace("import { ensureWikiTimezone } from './wiki-timezone.js';", 'const ensureWikiTimezone = async () => { globalThis.timezoneCalls++; };');
  await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
  const args = { path: 'a.md', source: 'saved', revision: '"' + 'a'.repeat(64) + '"' };
  const pending = registered.save_note.execute(args);
  await new Promise(resolve => setImmediate(resolve));
  const second = JSON.parse(await registered.save_note.execute({ ...args, path: 'b.md' }));
  const createBusy = JSON.parse(await registered.create_note.execute({ path: 'new.md', source: '# New' }));
  assert.equal(createBusy.reason_code, 'save_in_progress');
  assert.equal(createBusy.request_started, false);
  assert.equal(posts, 1);
  assert.equal(second.reason_code, 'save_in_progress');
  assert.equal(second.request_started, false);
  assert.equal(second.queued, false);
  release();
  assert.equal(JSON.parse(await pending).state, 'saved');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(posts, 1);
  // A later deliberate call is allowed; there is no queued operation.
  globalThis.fetch = async (url, options) => {
    posts++;
    const input = JSON.parse(options.body);
    return { ok: true, status: 200, url: 'http://synthetic.test/tools/save/', headers: { get: () => 'application/json' }, json: async () => ({ state: 'saved', path: input.path, source: input.source, revision: '"' + 'c'.repeat(64) + '"', authoritative: true, untrusted_content: true }) };
  };
  const later = JSON.parse(await registered.save_note.execute({ ...args, path: 'b.md', revision: '"' + 'b'.repeat(64) + '"' }));
  assert.equal(later.state, 'saved');
  assert.equal(posts, 2);
  globalThis.fetch = async () => { throw new Error('lost transport'); };
  const uncertain = JSON.parse(await registered.save_note.execute(args));
  assert.equal(uncertain.state, 'uncertain');
  assert.equal(uncertain.request_started, undefined);
  const initializationCount = globalThis.timezoneCalls;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    const payload = url.startsWith('/tools/create-folder/')
      ? { state: 'created', path: 'folder', href: '/?folder=folder', authoritative: true }
      : { state: 'complete', results: [] };
    return { ok: true, status: 200, url: 'http://synthetic.test' + url, headers: { get: () => 'application/json' }, json: async () => ({ ...payload, untrusted_content: true }) };
  };
  assert.equal(registered.read_notes.annotations.readOnlyHint, true);
  assert.equal(registered.wiki_status.annotations.readOnlyHint, true);
  assert.equal(registered.create_folder.annotations.consequentialHint, true);
  await registered.read_notes.execute({ paths: ['a.md', 'b.md'] });
  await registered.wiki_status.execute({});
  assert.equal(JSON.parse(await registered.create_folder.execute({ path: 'folder' })).state, 'created');
  assert.equal(calls[0].options.method, 'POST');
  assert.deepEqual(JSON.parse(calls[0].options.body), { paths: ['a.md', 'b.md'] });
  assert.equal(calls[1].options.method, 'GET');
  assert.equal(globalThis.timezoneCalls, initializationCount);
  assert.equal(JSON.parse(await registered.read_notes.execute({ paths: ['a.md', 'a.md'] })).reason_code, 'invalid_arguments');
  assert.equal(calls.length, 3);
  assert.equal(registered.create_note.annotations.consequentialHint, true);
  globalThis.fetch = async (url, options) => {
    const input = JSON.parse(options.body);
    return { ok: true, status: 201, url: 'http://synthetic.test' + url, headers: { get: () => 'application/json' }, json: async () => ({ state: 'created', path: input.path, href: '/notes/' + input.path, source: input.source, revision: '\"' + 'd'.repeat(64) + '\"', authoritative: true, untrusted_content: true }) };
  };
  const creation = JSON.parse(await registered.create_note.execute({ path: 'new.md', source: '# New' }));
  assert.equal(creation.state, 'created');
  assert.equal(globalThis.timezoneCalls, initializationCount + 1);
  assert.equal(JSON.parse(await registered.create_note.execute({ path: 'new.md', source: '# New', revision: null })).reason_code, 'invalid_arguments');
  globalThis.fetch = async () => ({ ok: true, status: 201, url: 'http://synthetic.test/tools/create-note/', headers: { get: () => 'application/json' }, json: async () => ({ state: 'created', path: 'new.md', href: '/notes/new.md', authoritative: true, untrusted_content: true }) });
  assert.equal(JSON.parse(await registered.create_note.execute({ path: 'new.md', source: '# New' })).state, 'uncertain');
  globalThis.fetch = async () => { throw new Error('lost create acknowledgement'); };
  assert.equal(JSON.parse(await registered.create_note.execute({ path: 'new.md', source: '# New' })).read_before_retry, true);
  assert.equal(registered.get_graph_snapshot.annotations.readOnlyHint, true);
  assert.equal(registered.get_note_graph.inputSchema.properties.depth.maximum, 8);
});
