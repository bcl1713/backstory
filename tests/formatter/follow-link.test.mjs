import test from 'node:test';
import assert from 'node:assert/strict';
import { createLinkFollower } from '../../static/src/follow-link.js';
test('follows only safe resolver destinations', async () => {
  const calls = []; const snapshot = {}; let state = snapshot;
  const run = createLinkFollower({ resolve: async () => ({ state: 'resolved', href: '/notes/Other.md' }), navigate: href => calls.push(href), isCurrent: value => value === state });
  await run({ target: 'Other', kind: 'wiki' }, 'Source.md', snapshot);
  assert.deepEqual(calls, ['/notes/Other.md']);
  const unsafe = createLinkFollower({ resolve: async () => ({ state: 'external', href: 'javascript:alert(1)' }), navigate: href => calls.push(href), isCurrent: value => value === state });
  await unsafe({ target: 'x', kind: 'markdown' }, 'Source.md', snapshot);
  assert.equal(calls.length, 1);
});
test('does not follow stale, missing-source or failed resolutions', async () => {
  let finish; const snapshot = {}; let state = snapshot; const calls = [];
  const run = createLinkFollower({ resolve: () => new Promise(resolve => { finish = resolve; }), navigate: href => calls.push(href), isCurrent: value => value === state });
  const pending = run({ target: 'Other', kind: 'wiki' }, 'Source.md', snapshot);
  state = {}; finish({ state: 'resolved', href: '/notes/Other.md' }); await pending;
  assert.deepEqual(calls, []);
  await run(null, '', state);
});
test('missing-note action uses existing creation destination without writing', async () => {
  const snapshot = {}; const calls = [];
  const run = createLinkFollower({ resolve: async () => ({ state: 'missing', action_href: '/new/link/?target=Other' }), navigate: href => calls.push(href), isCurrent: value => value === snapshot });
  await run({ target: 'Other', kind: 'wiki' }, 'Source.md', snapshot);
  assert.deepEqual(calls, ['/new/link/?target=Other']);
});
test('explicit cancellation prevents navigation even when context returns to its original state', async () => {
  let finish; const snapshot = {}; const calls = [];
  const run = createLinkFollower({ resolve: () => new Promise(resolve => { finish = resolve; }), navigate: href => calls.push(href), isCurrent: () => true });
  const pending = run({ target: 'Other', kind: 'wiki' }, 'Source.md', snapshot);
  run.cancel(); finish({ state: 'resolved', href: '/notes/Other.md' }); await pending;
  assert.deepEqual(calls, []);
});
test('cancel clears pending status without allowing an old response to overwrite a newer one', async () => {
  const statuses = []; const pending = [];
  const run = createLinkFollower({ resolve: () => new Promise(resolve => pending.push(resolve)), navigate: () => {}, isCurrent: () => true, onStatus: value => statuses.push(value) });
  const first = run({ target: 'One', kind: 'wiki' }, 'Source.md', {});
  run.cancel(); assert.equal(statuses.at(-1), '');
  const second = run({ target: 'Two', kind: 'wiki' }, 'Source.md', {});
  pending[0]({ state: 'resolved', href: '/notes/One.md' }); await first;
  assert.equal(statuses.at(-1), 'Resolving link…');
  pending[1]({ state: 'unavailable' }); await second;
  assert.match(statuses.at(-1), /unavailable/);
});
