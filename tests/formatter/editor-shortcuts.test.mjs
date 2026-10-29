import test from 'node:test';
import assert from 'node:assert/strict';
import { isVimToggleShortcut } from '../../static/src/editor-shortcuts.js';

test('Vim shortcut accepts Ctrl or Meta Shift F2 only, excluding repeat and composition', () => {
  const event = { key: 'F2', ctrlKey: true, shiftKey: true };
  assert.equal(isVimToggleShortcut(event), true);
  assert.equal(isVimToggleShortcut({ ...event, ctrlKey: false, metaKey: true }), true);
  for (const change of [{ key: 'v' }, { shiftKey: false }, { ctrlKey: false }, { altKey: true }, { repeat: true }, { isComposing: true }]) {
    assert.equal(isVimToggleShortcut({ ...event, ...change }), false);
  }
});
