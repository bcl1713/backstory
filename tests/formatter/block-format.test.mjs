import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EditorState } from '@codemirror/state';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { frontMatter } from '../../static/src/live-preview.js';
import { wikiLinks } from '../../static/src/live-links.js';
import { markdownBlock, blockFormattingChanges } from '../../static/src/block-format.js';

const state = source => EditorState.create({ doc: source, extensions: [markdown({ base: markdownLanguage, extensions: [frontMatter, wikiLinks] })] });
test('paragraphs, complete nested lists and complete tables are structural blocks', () => {
  const text = '# Heading\n\nFirst paragraph\ncontinued with [[Wiki]].\n\n- first\n  - nested\n\n  continued\n- last\n\n| A | B |\n|---|---|\n| x | y |\n';
  const doc = state(text);
  const paragraph = markdownBlock(doc, text.indexOf('continued with'));
  assert.equal(paragraph.type, 'Paragraph');
  assert.equal(text.slice(paragraph.from, paragraph.to), 'First paragraph\ncontinued with [[Wiki]].');
  const list = markdownBlock(doc, text.indexOf('nested'));
  assert.equal(list.type, 'BulletList');
  assert.equal(text.slice(list.from, list.to), '- first\n  - nested\n\n  continued\n- last');
  assert.equal(markdownBlock(doc, text.indexOf('| x')).type, 'Table');
});
test('front matter, fences, blockquotes and headings use the conservative fallback', () => {
  const text = '---\ntitle: Test\n---\n\n# Heading\n\n```md\n- code\n```\n\n> quote\n';
  const doc = state(text);
  for (const snippet of ['title:', 'Heading', '- code', 'quote']) assert.equal(markdownBlock(doc, text.indexOf(snippet)), null);
});
test('full-context formatter output is accepted only within the exited block and surrounding whitespace', () => {
  const before = '# Heading\n\n-    first\n- second\n\nActive paragraph.\n';
  const block = markdownBlock(state(before), before.indexOf('first'));
  assert.ok(blockFormattingChanges(before, before.replace('-    first', '- first'), block)?.length);
  assert.equal(blockFormattingChanges(before, before.replace('Active paragraph.', 'Active\nparagraph.'), block), null);
  assert.equal(blockFormattingChanges(before, before.replace('-    first', '- first').replace('# Heading', '# Changed'), block), null);
  assert.deepEqual(blockFormattingChanges(before, before, block), []);
});
test('prose reflow stays confined to the paragraph and newline conversions are deferred', () => {
  const before = '# Title\n\nA long paragraph with [[Wiki|alias]] and [reference][id].\n\nActive.\n\n[id]: Other.md\n';
  const block = markdownBlock(state(before), before.indexOf('A long'));
  const after = before.replace('with [[Wiki', 'with\n[[Wiki');
  assert.ok(blockFormattingChanges(before, after, block));
  assert.equal(blockFormattingChanges(before.replaceAll('\n', '\r\n'), after, block), null);
  assert.ok(blockFormattingChanges(before.replaceAll('\n', '\r\n'), after.replaceAll('\n', '\r\n'), block));
});

test('neighboring heading indentation and previous prose trailing spaces are not block separators', () => {
  const before = 'Current   text.\n\n  # Heading\n\nActive.\n';
  const block = markdownBlock(state(before), 0);
  const after = 'Current text.\n\n# Heading\n\nActive.\n';
  assert.equal(blockFormattingChanges(before, after, block), null);
  const previous = 'Previous.   \n\nCurrent   text.\n\nActive.\n';
  const current = markdownBlock(state(previous), previous.indexOf('Current'));
  assert.equal(blockFormattingChanges(previous, previous.replace('Previous.   ', 'Previous.').replace('Current   text.', 'Current text.'), current), null);
});

test('automatic block formatting does not reinterpret explicit TeX as ordinary Markdown', async () => {
  const { mathSyntax } = await import('../../static/src/math-preview.js');
  for (const source of ['Before\n\nInline \\(\\verb|a  b|\\).', 'Before\n\n- Inline \\(\\text{a  b}\\).\n- Other']) {
    const doc = EditorState.create({ doc: source, extensions: [markdown({ base: markdownLanguage, extensions: [frontMatter, wikiLinks, mathSyntax] })] });
    assert.equal(markdownBlock(doc, source.indexOf('Inline')), null);
    assert.equal(doc.doc.toString(), source);
  }
});

test('math source guard is scoped to the exited block rather than later sibling paragraphs', async () => {
  const { mathSyntax } = await import('../../static/src/math-syntax.js');
  const source = 'Before\n\n\\(x\\)\n\nAfter';
  const doc = EditorState.create({ doc: source, extensions: [markdown({ base: markdownLanguage, extensions: [mathSyntax] })] });
  assert.equal(markdownBlock(doc, 0)?.type, 'Paragraph');
  assert.equal(markdownBlock(doc, source.indexOf('After'))?.type, 'Paragraph');
  assert.equal(markdownBlock(doc, source.indexOf('\\(')), null);
});
