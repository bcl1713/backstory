import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initializeWikiTimezone, ensureWikiTimezone } from '../../static/src/wiki-timezone.js';

const response = value => ({ ok: true, json: async () => value });
function setup(state, options = {}) {
  const requests = [];
  const fetcher = async (url, init) => { requests.push({ url, ...init }); return response(state); };
  return { requests, run: () => initializeWikiTimezone({ fetcher, csrfToken: 'token', browserTimezone: () => 'America/Chicago', ...options }) };
}
test('initializes fallback only with browser zone and same-origin CSRF protected request', async () => {
  const s = setup({ timezone: 'UTC', source: 'fallback', can_change: true });
  await s.run();
  assert.equal(s.requests.length, 2);
  assert.equal(s.requests[0].url, '/settings/timezone/?format=json');
  const request = s.requests[1];
  assert.equal(request.method, 'POST');
  assert.equal(request.credentials, 'same-origin');
  assert.equal(request.headers['X-CSRFToken'], 'token');
  assert.equal(request.headers.Accept, 'application/json');
  assert.equal(request.body.get('action'), 'initialize');
  assert.equal(request.body.get('timezone'), 'America/Chicago');
});
for (const state of [
  { source: 'saved', can_change: true },
  { source: 'environment', can_change: true },
  { source: 'fallback', can_change: false },
  { source: 'fallback', can_change: 'true' },
]) test(`never initializes ${JSON.stringify(state)}`, async () => {
  const s = setup(state); await s.run(); assert.equal(s.requests.length, 1);
});
test('missing CSRF or missing browser timezone never writes', async () => {
  for (const options of [{ csrfToken: '' }, { browserTimezone: () => undefined }]) {
    const s = setup({ source: 'fallback', can_change: true }, options);
    await s.run(); assert.ok(s.requests.every(request => request.method !== 'POST'));
  }
});
test('startup errors are contained without retrying or blocking the editor', async () => {
  let calls = 0;
  await initializeWikiTimezone({ csrfToken: 'token', fetcher: async () => { calls++; throw new Error('offline'); } });
  assert.equal(calls, 1);
  const s = setup({ source: 'fallback', can_change: true }, { browserTimezone: () => { throw new Error('unavailable'); } });
  await s.run(); assert.equal(s.requests.length, 1);
});

test('first save shares and waits for in-flight owner initialization across bundles', async () => {
  const host = {};
  let finish;
  let calls = 0;
  const options = { csrfToken: 'token', browserTimezone: () => 'America/Chicago', fetcher: async () => {
    calls++;
    if (calls === 1) return response({ source: 'fallback', can_change: true });
    await new Promise(resolve => { finish = resolve; });
    return response({ source: 'saved', timezone: 'America/Chicago' });
  } };
  const shell = ensureWikiTimezone(options, host);
  await Promise.resolve(); await Promise.resolve();
  const save = ensureWikiTimezone(options, host);
  assert.equal(save, shell);
  let saved = false;
  save.then(() => { saved = true; });
  await Promise.resolve();
  assert.equal(saved, false);
  finish(); await save;
  assert.equal(saved, true);
  assert.equal(calls, 2);
  await ensureWikiTimezone(options, host);
  assert.equal(calls, 2);
});
