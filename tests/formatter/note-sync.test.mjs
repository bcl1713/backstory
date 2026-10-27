import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readNoteSnapshot } from '../../static/src/note-sync.js';

const revision = '"' + 'a'.repeat(64) + '"';
const snapshot = { state: 'ok', authoritative: true, path: 'Synthetic.md', source: '\ufeff# Synthetic\r\n\nUnicode α\r', revision, bom: true, newline: '\r\n' };
function respond(t, body = snapshot, headers = {}, status = 200) {
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify(body), {
    status, headers: { 'content-type': 'application/json', ...headers },
  }));
}

for (const etag of [revision, 'W/' + revision, null, '"different-transport-representation"']) {
  test(`authoritative source and strong application revision survive transport ETag ${etag}`, async t => {
    respond(t, snapshot, etag === null ? {} : { etag });
    assert.deepEqual(await readNoteSnapshot(snapshot.path), snapshot);
  });
}
test('valid empty content is a snapshot', async t => {
  respond(t, { ...snapshot, source: '' }, { etag: revision });
  assert.equal((await readNoteSnapshot(snapshot.path)).source, '');
});

for (const [field, invalid] of [
  ['state', 'error'], ['authoritative', false], ['path', 'Other.md'],
  ['source', null], ['revision', 'W/' + revision], ['revision', '*'],
  ['revision', null], ['revision', 123], ['bom', 'true'], ['newline', ''],
]) {
  test(`invalid ${field} fails with a specific safe diagnostic`, async t => {
    respond(t, { ...snapshot, [field]: invalid }, { etag: revision });
    await assert.rejects(readNoteSnapshot(snapshot.path), error => {
      assert.equal(error.kind, 'read');
      assert.equal(error.reason, field);
      assert.equal(error.diagnostic.status, 200);
      assert.equal(error.diagnostic.etag, revision);
      assert.ok(!JSON.stringify(error.diagnostic).includes(snapshot.source));
      assert.ok(!JSON.stringify(error.diagnostic).includes(snapshot.path));
      return true;
    });
  });
}
test('a non-object JSON response fails safely', async t => {
  respond(t, null);
  await assert.rejects(readNoteSnapshot(snapshot.path), { kind: 'read', reason: 'contract' });
});
test('invalid JSON is distinct from a transport failure', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('{', { headers: { 'content-type': 'application/json' } }));
  await assert.rejects(readNoteSnapshot(snapshot.path), { kind: 'read', reason: 'json' });
});
test('a response body connection failure is a transport error', async t => {
  const body = new ReadableStream({ start(controller) { controller.error(new TypeError('private connection details')); } });
  t.mock.method(globalThis, 'fetch', async () => new Response(body, { headers: { 'content-type': 'application/json' } }));
  await assert.rejects(readNoteSnapshot(snapshot.path), { kind: 'read', reason: 'transport' });
});
test('diagnostics redact arbitrary header values', async t => {
  respond(t, { ...snapshot, source: null }, { 'content-type': 'text/private-note-details', etag: 'private-note-details' });
  await assert.rejects(readNoteSnapshot(snapshot.path), error => {
    assert.equal(error.reason, 'content_type');
    assert.equal(error.diagnostic.contentType, 'other');
    assert.equal(error.diagnostic.etag, 'other');
    assert.ok(!JSON.stringify(error.diagnostic).includes('private-note-details'));
    return true;
  });
});
test('network failures have no private error text in diagnostics', async t => {
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('private request information'); });
  await assert.rejects(readNoteSnapshot(snapshot.path), error => {
    assert.equal(error.reason, 'transport');
    assert.ok(!JSON.stringify(error.diagnostic).includes('private'));
    return true;
  });
});
for (const [status, kind] of [[401, 'authentication'], [403, 'authentication'], [404, 'missing'], [503, 'storage'], [500, 'read']]) {
  test(`HTTP ${status} is classified without trusting response content`, async t => {
    respond(t, snapshot, {}, status);
    await assert.rejects(readNoteSnapshot(snapshot.path), { kind, reason: 'http_status' });
  });
}
test('HTML responses are distinct from malformed JSON', async t => {
  respond(t, snapshot, { 'content-type': 'text/html' });
  await assert.rejects(readNoteSnapshot(snapshot.path), { kind: 'read', reason: 'content_type' });
});
