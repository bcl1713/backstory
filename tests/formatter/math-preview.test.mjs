import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { EditorState } from '@codemirror/state';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { frontMatter } from '../../static/src/live-preview.js';
const math = await import('../../static/src/math-preview.js').catch(() => ({}));
const fixtures = JSON.parse(readFileSync(new URL('../fixtures/math-delimiters.json', import.meta.url)));
const state = (doc, selection = { anchor: 0 }, extra = []) => EditorState.create({ doc, selection, extensions: [markdown({ base: markdownLanguage, extensions: [frontMatter, math.mathSyntax || {}] }), ...extra] });
for (const [index, fixture] of fixtures.entries()) test(`explicit math parser fixture ${index}: source-preserving delimiter and context policy`, () => {
  assert.equal(typeof math.mathModels, 'function', 'math model extraction exists');
  const s = state(fixture.source);
  const models = math.mathModels(s);
  assert.deepEqual(models.map(({ expression, display }) => ({ expression, display })), fixture.math);
  for (const model of models) assert.equal(s.doc.sliceString(model.from, model.to), model.source);
  assert.equal(s.doc.toString(), fixture.source.replace(/\r\n/g, '\n'));
});
test('math count, selected-line source reveal and motion ranges remain bounded and non-mutating', () => {
  assert.equal(typeof math.mathModels, 'function');
  const doc = 'Before\n\n' + '\\(x\\)\n\n'.repeat(300);
  let s = state(doc, { anchor: 0 }, [math.mathMotionRange]);
  const models = math.mathModels(s);
  assert.equal(models.length, 100);
  assert.equal(math.mathIsActive(s, models[0]), false);
  s = s.update({ effects: math.revealMathMotion.of({ from: 0, to: doc.length }) }).state;
  assert.equal(math.mathIsActive(s, models[0]), true);
  s = s.update({ effects: math.revealMathMotion.of(null), selection: { anchor: models[0].from } }).state;
  assert.equal(math.mathIsActive(s, models[0]), true);
  assert.equal(s.doc.toString(), doc);
});

test('state-owned block and inline replacements disappear for source selection without edits', () => {
  assert.ok(math.mathPreview);
  const doc = 'Before\n\n\\(x\\)\n\n$$\nx^2\n$$\n\nAfter';
  let s = state(doc, { anchor: 0 }, [math.mathPreview]);
  assert.equal(s.field(math.mathPreview).size, 2);
  const replacements = [];
  s.field(math.mathPreview).between(0, doc.length, (from, to, decoration) => replacements.push({ from, to, block: decoration.spec.block }));
  assert.deepEqual(replacements.map(value => value.block), [false, true]);
  s = s.update({ selection: { anchor: 0, head: doc.length } }).state;
  assert.equal(s.field(math.mathPreview).size, 0);
  assert.equal(s.doc.toString(), doc);
});

test('over-budget delimiter ranges remain literal instead of copying huge placeholder source', () => {
  for (const doc of ['Before\n\n$$' + 'x'.repeat(8192) + '$$', 'Before\n\n$$\n' + 'x'.repeat(8187) + '\n$$', 'Before\n\n\\(' + 'x'.repeat(8189) + '\\)']) assert.deepEqual(math.mathModels(state(doc)), []);
});

test('formatter syntax-only math source collection matches editor fixtures without DOM or rendering', async () => {
  const syntax = await import('../../static/src/math-syntax.js').catch(() => ({}));
  assert.equal(typeof syntax.mathSources, 'function');
  for (const fixture of fixtures) assert.deepEqual(syntax.mathSources(fixture.source), math.mathModels(state(fixture.source)).map(model => model.source));
});

test('formatter signatures protect all complete formulas beyond the display count cap', async () => {
  const { mathSources } = await import('../../static/src/math-syntax.js');
  const source = '\\(x\\)\n\n'.repeat(100) + '\\(\\verb|a  b|\\)';
  const signatures = mathSources(source);
  assert.equal(signatures.length, 101);
  assert.equal(signatures.at(-1), '\\(\\verb|a  b|\\)');
});

test('formatter signature collection fails closed rather than returning a partial node-budget scan', async () => {
  const { mathSources } = await import('../../static/src/math-syntax.js');
  const source = 'Before\n\n' + '***\n\n'.repeat(100001) + '\\(\\verb|a  b|\\)';
  assert.equal(mathSources(source), null);
});
