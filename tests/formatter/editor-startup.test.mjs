import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('initial HTML provides an editor-only loading boundary and native fallback', async () => {
  const html = await readFile('wiki/templates/wiki/note.html', 'utf8');
  assert.match(html, /data-editor-stage data-editor-state="loading"/);
  assert.match(html, /href="#plain-source"/);
  assert.match(html, /id="plain-source" data-source-fallback/);
  assert.match(html, /editor-startup.js/);
});

import vm from 'node:vm';
async function guard() {
  const stage = new EventTarget();
  stage.dataset = { editorState: 'loading' };
  const loading = { hidden: false }, source = { hidden: false }, editor = { hidden: false }, readiness = {};
  const elements = { '[data-editor-stage]': stage, '[data-editor-loading]': loading, '[data-source-fallback]': source, '[data-markdown-editor]': editor, '[data-editor-readiness]': readiness };
  const listeners = {};
  let timeout, cleared = false;
  class Script { hasAttribute() { return true; } }
  vm.runInNewContext(await readFile('static/src/editor-startup.js', 'utf8'), {
    document: { querySelector: selector => elements[selector] },
    window: { addEventListener: (name, fn) => { listeners[name] = fn; } },
    location: { hash: '' }, Event, HTMLScriptElement: Script,
    setTimeout: fn => { timeout = fn; return 1; }, clearTimeout: () => { cleared = true; },
  });
  return { stage, loading, editor, source, readiness, timeout: () => timeout(), fail: () => listeners.error({ target: new Script() }), cleared: () => cleared };
}
test('module error exposes fallback without waiting for the network timeout', async () => {
  const g = await guard(); g.fail();
  assert.equal(g.stage.dataset.editorState, 'ready');
  assert.equal(g.stage.dataset.plainRequested, 'true');
  assert.equal(g.editor.hidden, true);
  assert.equal(g.source.hidden, false);
  assert.equal(g.loading.hidden, true);
  assert.equal(g.cleared(), true);
});
test('hung module exposes fallback, but completed layout cancels timeout effects', async () => {
  const hung = await guard(); hung.timeout();
  assert.equal(hung.stage.dataset.plainRequested, 'true');
  const ready = await guard(); ready.stage.dispatchEvent(new Event('editor-ready')); ready.timeout();
  assert.equal(ready.stage.dataset.editorState, 'ready');
  assert.equal(ready.stage.dataset.plainRequested, undefined);
  assert.equal(ready.editor.hidden, false);
});
