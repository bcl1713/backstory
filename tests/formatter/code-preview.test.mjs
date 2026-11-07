import { parsedState } from './support/parsed-state.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { EditorState, EditorSelection } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { codeDecorations, codeLanguage } from '../../static/src/code-preview.js';
const state = (doc, anchor = 0, head = anchor) => parsedState({ doc, selection: { anchor, head }, extensions: [markdown({ codeLanguages: codeLanguage })] });
const ranges = value => { const result = []; for (let i = value.iter(); i.value; i.next()) result.push({ from: i.from, to: i.to, spec: i.value.spec }); return result; };

test('inactive fenced code hides only fence text and keeps source lines', () => {
  const doc = 'Before\n\n```js\nconst answer = 42;\n```\nAfter';
  const decorations = ranges(codeDecorations(state(doc)));
  const hidden = decorations.filter(x => x.to > x.from);
  assert.deepEqual(hidden.map(x => doc.slice(x.from, x.to)), ['```js', '```']);
  assert.equal(decorations.filter(x => x.spec.class?.includes('lp-code-line')).length, 3);
});
test('active and crossing selections reveal fences without source mutation', () => {
  const doc = 'Before\n\n~~~python\nprint(42)\n~~~\nAfter';
  for (const s of [state(doc, doc.indexOf('print')), state(doc, doc.length, 0)]) {
    assert.equal(ranges(codeDecorations(s)).filter(x => x.to > x.from).length, 0);
    assert.equal(s.doc.toString(), doc);
  }
});
test('diagram fences retain existing owner', () => {
  for (const language of ['mermaid', 'graphviz', 'dot', 'vega-lite']) assert.equal(ranges(codeDecorations(state(`Before\n\n\`\`\`${language}\nA-->B\n\`\`\``))).length, 0);
});
test('known aliases resolve locally; missing languages use plain code', () => {
  assert.ok(codeLanguage('js')); assert.equal(codeLanguage('js'), codeLanguage('javascript'));
  assert.ok(codeLanguage('python')); assert.ok(codeLanguage('bash')); assert.ok(codeLanguage('yaml'));
  assert.equal(codeLanguage('unknown'), null); assert.equal(codeLanguage('mermaid'), null);
});


test('empty and nested fences preserve source and hide only delimiters', () => {
  for (const doc of ['Before\n\n```\n```\nAfter', 'Before\n\n> ~~~python\n> print(1)\n> ~~~\nAfter']) {
    const s = state(doc);
    const hidden = ranges(codeDecorations(s)).filter(x => x.to > x.from);
    assert.equal(hidden.length, 2);
    assert.ok(hidden.every(x => !doc.slice(x.from, x.to).includes('>')));
    assert.equal(s.doc.toString(), doc);
  }
});
test('any selection range in a block reveals its source', () => {
  const doc = 'Before\n\n```js\nconst answer = 42;\n```\nAfter';
  const s = parsedState({ doc, selection: EditorSelection.create([EditorSelection.cursor(0), EditorSelection.cursor(doc.indexOf('answer'))]), extensions: [EditorState.allowMultipleSelections.of(true), markdown()] });
  assert.equal(ranges(codeDecorations(s)).filter(x => x.to > x.from).length, 0);
});
