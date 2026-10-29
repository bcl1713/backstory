import test from 'node:test';
import assert from 'node:assert/strict';
import { initialVimEnabled, rememberVimEnabled, shouldFocusEditor } from '../../static/src/editor-preferences.js';
const storage = value => ({ getItem: () => value, setItem(key, next) { this.saved = next; } });
test('desktop defaults on, phone off, explicit browser choice wins', () => {
  assert.equal(initialVimEnabled(storage(null), true), true);
  assert.equal(initialVimEnabled(storage(null), false), false);
  assert.equal(initialVimEnabled(storage('off'), true), false);
  assert.equal(initialVimEnabled(storage('on'), false), true);
  assert.equal(initialVimEnabled(storage('invalid'), false), false);
});
test('blocked storage falls back and never breaks toggle', () => {
  const blocked = { getItem() { throw Error(); }, setItem() { throw Error(); } };
  assert.equal(initialVimEnabled(blocked, true), true);
  assert.doesNotThrow(() => rememberVimEnabled(blocked, true));
  const saved = storage(null); rememberVimEnabled(saved, false); assert.equal(saved.saved, 'off');
});
test('startup focus is desktop only and never takes focus from an active control', () => {
  const body = {}; const html = {}; const input = {};
  assert.equal(shouldFocusEditor(true, body, body, html), true);
  assert.equal(shouldFocusEditor(true, input, body, html), false);
  assert.equal(shouldFocusEditor(false, body, body, html), false);
});
