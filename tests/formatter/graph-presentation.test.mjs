import test from 'node:test';
import assert from 'node:assert/strict';
import { createPresentation } from '../../static/src/graph-presentation.js';

test('reports fallback honestly and releases wake lock and fullscreen on exit', async () => {
  const states = [];
  const graph = { requestFullscreen: null, ownerDocument: { fullscreenElement: null, exitFullscreen: async () => {} } };
  const presentation = createPresentation({ graph, wakeLock: null, onState: state => states.push(state) });
  await presentation.enter();
  assert.equal(states.at(-1).mode, 'fallback');
  assert.equal(states.at(-1).wake, 'off');
  await presentation.toggleWake();
  assert.equal(states.at(-1).wake, 'unsupported');
  await presentation.exit();
  assert.equal(states.at(-1).mode, 'closed');
  presentation.destroy();
});

test('tracks acquired wake lock, releases on exit and reacquires after visibility return', async () => {
  const states = [], releases = [], document = { hidden: false, fullscreenElement: null, exitFullscreen: async () => {} };
  const graph = { requestFullscreen: async () => {}, ownerDocument: { fullscreenElement: null, exitFullscreen: async () => {} } };
  const wakeLock = { request: async () => ({ release: async () => releases.push('released'), addEventListener() {} }) };
  const presentation = createPresentation({ graph, wakeLock, document, onState: state => states.push(state) });
  await presentation.enter();
  await presentation.toggleWake();
  assert.equal(states.at(-1).wake, 'active');
  document.hidden = true;
  await presentation.visibilityChanged(true);
  assert.equal(releases.length, 1);
  document.hidden = false;
  await presentation.visibilityChanged(false);
  assert.equal(states.at(-1).wake, 'active');
  await presentation.exit();
  assert.equal(releases.length, 2);
  presentation.destroy();
});

test('a fullscreen request resolving after exit cannot reopen presentation', async () => {
  const states = [];
  let resolveRequest, fullscreenElement = null, exits = 0;
  const document = {
    get fullscreenElement() { return fullscreenElement; },
    hidden: false,
    async exitFullscreen() { exits++; fullscreenElement = null; },
  };
  const graph = { ownerDocument: document, requestFullscreen: () => new Promise(resolve => {
    resolveRequest = () => { fullscreenElement = graph; resolve(); };
  }) };
  const presentation = createPresentation({ graph, wakeLock: null, document, onState: state => states.push(state) });
  const entering = presentation.enter();
  await presentation.exit();
  resolveRequest(); await entering;
  assert.equal(states.at(-1).mode, 'closed');
  assert.equal(fullscreenElement, null);
  assert.equal(exits, 1);
  presentation.destroy();
});

test('a fullscreen request resolving after teardown releases fullscreen without reopening state', async () => {
  const states = [];
  let resolveRequest, fullscreenElement = null, exits = 0;
  const document = {
    get fullscreenElement() { return fullscreenElement; },
    hidden: false,
    async exitFullscreen() { exits++; fullscreenElement = null; },
  };
  const graph = { ownerDocument: document, requestFullscreen: () => new Promise(resolve => {
    resolveRequest = () => { fullscreenElement = graph; resolve(); };
  }) };
  const presentation = createPresentation({ graph, wakeLock: null, document, onState: state => states.push(state) });
  const entering = presentation.enter();
  presentation.destroy();
  resolveRequest(); await entering;
  assert.equal(states.at(-1).mode, 'closed');
  assert.equal(fullscreenElement, null);
  assert.equal(exits, 1);
});

