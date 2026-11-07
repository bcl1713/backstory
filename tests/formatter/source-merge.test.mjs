import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeSources, sourceChanges } from '../../static/src/source-merge.js';

const cases = [
  ['clean refresh', 'one\ntwo\n', 'one\ntwo\n', 'ONE\ntwo\n', 'ONE\ntwo\n'],
  ['separate sections', 'one\ntwo\nthree\n', 'ONE\ntwo\nthree\n', 'one\ntwo\nTHREE\n', 'ONE\ntwo\nTHREE\n'],
  ['several changes per writer', 'a\nb\nc\nd\ne\n', 'A\nb\nC\nd\ne\n', 'a\nB\nc\nd\nE\n', 'A\nB\nC\nd\nE\n'],
  ['identical edit', 'one\ntwo\n', 'ONE\ntwo\n', 'ONE\ntwo\n', 'ONE\ntwo\n'],
  ['overlapping edit', 'one\ntwo\n', 'ONE\ntwo\n', 'other\ntwo\n', null],
  ['different insertions at the same boundary', 'a\nb\n', 'a\nx\nb\n', 'a\ny\nb\n', null],
  ['insertion inside deletion', 'a\nb\nc\nd\n', 'a\nd\n', 'a\nb\nx\nc\nd\n', null],
  ['separate insert and deletion', 'a\nb\nc\nd\n', 'a\nx\nb\nc\nd\n', 'a\nb\nc\n', 'a\nx\nb\nc\n'],
  ['end insertion and earlier edit', 'a\nb\nc\n', 'a\nb\nc\nd\n', 'A\nb\nc\n', 'A\nb\nc\nd\n'],
  ['empty external is a real deletion conflict', 'a\n', 'local\n', '', null],
  ['empty base', '', '', 'a\n', 'a\n'],
  ['no final newline', 'a\nb', 'A\nb', 'a\nB', 'A\nB'],
  ['mixed endings and content FEFF', '\ufeffa\r\nb\rc\n', '\ufeffA\r\nb\rc\n', '\ufeffa\r\nb\rC\n', '\ufeffA\r\nb\rC\n'],
  ['duplicate lines', 'a\nsame\nsame\nz\n', 'A\nsame\nsame\nz\n', 'a\nsame\nsame\nZ\n', 'A\nsame\nsame\nZ\n'],
  ['ambiguous duplicate deletion overlaps another writer', 'a\nsame\nsame\nz\n', 'a\nsame\nz\n', 'a\nCHANGED\nsame\nz\n', null],
  ['ambiguous duplicate insertion overlaps another writer', 'a\nsame\nsame\nz\n', 'a\nsame\nsame\nsame\nz\n', 'a\nsame\nCHANGED\nz\n', null],
  ['duplicate deletion with separate external edit', 'a\nsame\nsame\nz\n', 'a\nsame\nz\n', 'a\nsame\nsame\nZ\n', 'a\nsame\nZ\n'],
];
for (const [name, base, local, external, expected] of cases) test(name, () => {
  assert.equal(mergeSources(base, local, external), expected);
});

test('source changes preserve unchanged spans and use exact UTF-16 offsets', () => {
  assert.deepEqual(sourceChanges('🐈 alpha\r\nkeep\nlast', '🐈 ALPHA\r\nkeep\nLAST'), [
    { from: 3, to: 8, insert: 'ALPHA' }, { from: 15, to: 19, insert: 'LAST' },
  ]);
});

test('broad edits exceeding the diff budget conservatively conflict', () => {
  const base = Array.from({ length: 3000 }, (_, i) => `base ${i}\n`).join('');
  const local = base.replaceAll('base', 'local');
  const external = base.replaceAll('base', 'external');
  assert.equal(mergeSources(base, local, external), null);
  assert.equal(mergeSources(base, base, external), external);
});

test('sparse changes around a long unchanged passage preserve its exact span', () => {
  const middle = 'unchanged\n'.repeat(3000);
  assert.deepEqual(sourceChanges('old\n' + middle + 'last\n', 'new\n' + middle + 'LAST\n'), [
    { from: 0, to: 3, insert: 'new' },
    { from: 4 + middle.length, to: 8 + middle.length, insert: 'LAST' },
  ]);
});
