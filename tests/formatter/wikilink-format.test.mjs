import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeWrappedWikiAliases as normalize } from '../../formatter/wikilinks.mjs';

test('wrapped alias normalization leaves protected and incomplete syntax unchanged', () => {
  for (const source of [
    '\\[[target|Sample\nlabel]]',
    '`[[target|Sample\nlabel]]`',
    '```md\n[[target|Sample\nlabel]]\n```',
    '    [[target|Sample\n    label]]',
    '<div>\n[[target|Sample\nlabel]]\n</div>',
    '<span title="[[target|Sample\nlabel]]">',
    'Text <!-- [[target|Sample\nlabel]] -->',
    '---\ntitle: "[[target|Sample\nlabel]]"\n---',
    '\ufeff---\ntitle: |\n  [[target|Sample\n  label]]\n---\n',
    '$$\n\\text{[[target|Sample\nlabel]]}\n$$',
    '[[target\npath|label]]',
    '[[target|unfinished\nlabel]',
    '[[target|Sample\n\nlabel]]',
    '[[target|single  line]]',
    '[label [[target|Sample\nlabel]]](other.md)',
    '![[target|Sample\nlabel]](image.png)',
  ]) assert.equal(normalize(source), source, source);
});

test('literal unmatched link and image openers do not suppress wrapped aliases', () => {
  assert.equal(normalize('- ![[target|Sample\n  label]]\n'), '- ![[target|Sample label]]\n');
  assert.equal(normalize('- See [draft [[target|Sample\n  label]] pending].\n'), '- See [draft [[target|Sample label]] pending].\n');
});

test('alias normalization preserves literal target, punctuation, spaces and quote-like label text', () => {
  assert.equal(normalize('> - [[/notes/100%\\_日本語#Part|Sample  &amp;\n>   label > literal]]'), '> - [[/notes/100%\\_日本語#Part|Sample  &amp; label > literal]]');
  assert.equal(normalize('Before [[one|First\nlabel]] and [[two|Second\nlabel]].'), 'Before [[one|First label]] and [[two|Second label]].');
});

test('normalization bounds lookahead and refuses incomplete traversal rather than partial rewrites', () => {
  const tooLong = '[[target|Sample\n' + 'x'.repeat(8192) + ']]';
  assert.equal(normalize(tooLong), tooLong);
  assert.equal(normalize('***\n\n'.repeat(100001) + '[[target|Sample\nlabel]]'), null);
});

test('many short ordinary wikilinks do not consume the budget for long lookahead', () => {
  const source = '[[target|label]] '.repeat(3000) + '\n';
  assert.ok(normalize(source) === source);
});
