import test from 'node:test';
import assert from 'node:assert/strict';
import { EditorState } from '@codemirror/state';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { wikiLinks, linkAtCaret } from '../../static/src/live-links.js';
const find = (doc, anchor) => linkAtCaret({ state: EditorState.create({ doc, selection: { anchor }, extensions: [markdown({ base: markdownLanguage, extensions: [wikiLinks] })] }) });
test('caret selects wiki syntax from first through final character, not following space', () => {
  const doc = '[[Other#Details|Alias]] after';
  for (const pos of [0, 3, 17, 22]) assert.equal(find(doc, pos)?.target, 'Other#Details|Alias');
  assert.equal(find(doc, 23), null);
});
test('Markdown label and destination both identify same link', () => {
  for (const pos of [0, 3, 9, 15]) assert.equal(find('[label](Other.md)', pos)?.target, 'Other.md');
});
test('nonlinks, code and images never navigate', () => {
  assert.equal(find('ordinary text', 4), null);
  assert.equal(find('`[[Other]]`', 4), null);
  assert.equal(find('![alt](Other.md)', 4), null);
  assert.equal(find('```\n[[Other]]\n```', 8), null);
});
