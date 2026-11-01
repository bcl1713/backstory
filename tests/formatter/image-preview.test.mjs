import test from 'node:test';
import assert from 'node:assert/strict';
import { EditorState } from '@codemirror/state';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { ensureSyntaxTree, syntaxTree } from '@codemirror/language';
import { frontMatter } from '../../static/src/live-preview.js';
import { imageModels, imagePresentation, imageTargetState, imageIsActive, imageMotionRange, revealImageMotion } from '../../static/src/image-preview.js';

const state = (doc, selection = { anchor: 0 }, extra = []) => EditorState.create({ doc, selection, extensions: [markdown({ base: markdownLanguage, extensions: [frontMatter] }), ...extra] });

test('ordinary images preserve parsed source ranges, decoded labels and relative encoded targets', () => {
  const doc = 'Before\n\n![A &amp; B](<../photos/a%20b.png> "Title") after';
  assert.deepEqual(imageModels(state(doc)), [{ from: 8, to: doc.indexOf(' after'), label: 'A & B', target: '../photos/a%20b.png' }]);
});
test('full, collapsed and shortcut references resolve first matching case/space-normalized definitions', () => {
  const doc = 'Before\n\n![full][A  B]\n\n![collapsed][]\n\n![shortcut]\n\n[a b]: one.png\n[a b]: two.png\n[collapsed]: <two%20two.jpg>\n[SHORTCUT]: three.gif';
  assert.deepEqual(imageModels(state(doc)).map(image => image.target), ['one.png', 'two%20two.jpg', 'three.gif']);
});
test('code, escaped images, front matter, HTML, incomplete and unsupported contexts stay literal', () => {
  const doc = '---\ncover: ![yaml](a.png)\n---\n\n`![code](a.png)`\n\n```md\n![fenced](a.png)\n```\n\n    ![indented](a.png)\n\n\\![escaped](a.png)\n\n<img src="a.png">\n\n![broken](\n\n![unknown][none]\n\n![multi\nline](a.png)\n\n[![nested](a.png)](Other.md)\n\n| A |\n| --- |\n| ![table](a.png) |';
  assert.deepEqual(imageModels(state(doc)), []);
});
test('images inside list and blockquote text are supported without reinterpreting wiki embeds', () => {
  assert.deepEqual(imageModels(state('Before\n\n- ![list](a.png)\n\n> ![quote](b.png)\n\n![[wiki.png]]')).map(image => image.label), ['list', 'quote']);
});
test('models and resolver work are bounded even with many repeated inputs', () => {
  assert.equal(imageModels(state('Before\n\n' + '![a](a.png)\n\n'.repeat(1000))).length, 200);
});
test('remote and active target forms never enter the local resolver queue', () => {
  for (const target of ['https://example.test/a.png', '//example.test/a.png', 'data:image/png;base64,a', 'javascript:alert(1)', 'file:///a.png']) assert.equal(imageTargetState(target), 'blocked', target);
  for (const target of ['../a%20b.png', 'a.png', 'a%23b.jpg']) assert.equal(imageTargetState(target), 'local', target);
  for (const target of ['', 'a\\b.png', 'a\u0000.png', 'x'.repeat(4097)]) assert.equal(imageTargetState(target), 'unavailable');
});
test('only resolved authenticated raster attachment URLs can become image sources', () => {
  for (const href of ['/attachments/a.PNG', '/attachments/a%20b.jpeg#preview-x', '/attachments/a.avif']) assert.deepEqual(imagePresentation({ state: 'resolved', href }), { state: 'ready', href });
  for (const href of ['https://example.test/a.png', '//example.test/a.png', '/notes/a.png', '/attachments/a.svg', '/attachments/a.html', '/attachments/a.pdf', '/attachments/a.png?redirect=x', '/attachments/a.png\\evil']) assert.deepEqual(imagePresentation({ state: 'resolved', href }), { state: 'unavailable' });
  assert.deepEqual(imagePresentation({ state: 'external', href: 'https://example.test/a.png' }), { state: 'blocked' });
  for (const value of [null, {}, { state: 'missing' }, { state: 'unavailable' }, { state: 'resolved', href: '/attachments/%invalid.png' }]) assert.deepEqual(imagePresentation(value), { state: 'unavailable' });
});
test('selected image lines and motion paths reveal source without modifying document', () => {
  const doc = 'Before\n\n![a](a.png)\n\nAfter';
  let s = state(doc, { anchor: 0 }, [imageMotionRange]);
  const image = imageModels(s)[0];
  assert.equal(imageIsActive(s, image), false);
  s = s.update({ effects: revealImageMotion.of({ from: 0, to: doc.length }) }).state;
  assert.equal(imageIsActive(s, image), true);
  s = s.update({ effects: revealImageMotion.of(null), selection: { anchor: image.to + 1, head: image.from } }).state;
  assert.equal(imageIsActive(s, image), true);
  assert.equal(s.doc.toString(), doc);
});


test('large fully parsed documents stop actual cursor visits at the hard node budget', () => {
  const doc = 'Before\n\n![early](a.png)\n\n' + '***\n\n'.repeat(120000) + '![late](b.png)';
  let s = state(doc);
  assert.ok(ensureSyntaxTree(s, doc.length, 10000), 'complete the real Markdown parse');
  s = s.update({}).state;
  const tree = syntaxTree(s);
  assert.equal(tree.length, doc.length);
  const originalCursor = tree.cursor;
  let visits = 0;
  // Observe real cursor movement, not just extracted images: skipping a child
  // must not hide continued sibling traversal after the processing budget.
  tree.cursor = function (...args) {
    visits++;
    const cursor = originalCursor.apply(this, args);
    return new Proxy(cursor, { get(target, property) {
      const value = Reflect.get(target, property, target);
      if (typeof value !== 'function') return value;
      if (!['next', 'firstChild', 'nextSibling'].includes(property)) return value.bind(target);
      return (...args) => { const moved = value.apply(target, args); if (moved) visits++; return moved; };
    } });
  };
  try {
    assert.deepEqual(imageModels(s).map(image => image.label), ['early']);
    assert.equal(visits, 100000, 'the traversal itself must stop, not just extraction');
  } finally { delete tree.cursor; }
  assert.equal(s.doc.toString(), doc);
});
