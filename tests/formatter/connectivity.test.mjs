import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

test('connectivity advisory follows offline/online without touching drafts or reloading', async () => {
  const status = { hidden: true };
  const events = new Map();
  const navigator = { onLine: false };
  const context = { navigator, document: { querySelector: selector => {
    assert.equal(selector, '[data-connectivity-status]');
    return status;
  } }, window: { addEventListener: (event, callback) => events.set(event, callback) } };
  const source = await readFile(new URL('../../static/src/connectivity.js', import.meta.url), 'utf8').catch(() => '');
  vm.runInNewContext(source, context);
  assert.equal(status.hidden, false, 'An already-offline page needs an advisory');
  navigator.onLine = true;
  events.get('online')();
  assert.equal(status.hidden, true);
  navigator.onLine = false;
  events.get('offline')();
  assert.equal(status.hidden, false);
});
