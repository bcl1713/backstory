import test from 'node:test';
import assert from 'node:assert/strict';
import { EditorState } from '@codemirror/state';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { tableDecorations } from '../../static/src/table-preview.js';
const source = 'Before\n\n| A | B |\n| :-- | --: |\n| hello | world |\n\nAfter';
const state = selection => EditorState.create({doc:source, selection, extensions:[markdown({base:markdownLanguage})]});
test('inactive tables have block replacements; caret and crossing ranges reveal entire source', () => {
  assert.equal(tableDecorations(state({anchor:0})).size,1);
  assert.equal(tableDecorations(state({anchor:source.indexOf('hello')})).size,0);
  assert.equal(tableDecorations(state({anchor:0,head:source.length})).size,0);
  assert.equal(tableDecorations(state({anchor:source.length,head:0})).size,0);
});

import { syntaxTree } from '@codemirror/language';
import { tableModel, tablePreview } from '../../static/src/table-preview.js';
test('models escaped pipes, safe inline formatting and alignment from the Markdown tree', () => {
  const s = EditorState.create({doc:'Before\n\n| Left | Right |\n| :--- | ---: |\n| **bold** and a \\| b | `code` [label](javascript:bad) <img src=x> |', extensions:[markdown({base:markdownLanguage})]});
  const model = tableModel(syntaxTree(s).topNode.getChild('Table'), s);
  assert.deepEqual(model.alignments,['left','right']);
  assert.equal(model.rows.length,2);
  assert.deepEqual(model.rows[1].cells[0],[{tag:'strong',children:[{text:'bold'}]},{text:' and a '},{text:'|'},{text:' b'}]);
  assert.equal(JSON.stringify(model).includes('javascript:'),false);
  assert.equal(JSON.stringify(model).includes('<img src=x>'),true);
  assert.equal(model.rows[1].cells[1][0].tag,'code');
});
test('state-field tracks edits, selection changes and source without injecting presentation', () => {
  let s=EditorState.create({doc:source,extensions:[markdown({base:markdownLanguage}),tablePreview]});
  assert.equal(s.field(tablePreview).size,1);
  s=s.update({selection:{anchor:source.indexOf('hello')}}).state;
  assert.equal(s.field(tablePreview).size,0);
  s=s.update({changes:{from:s.selection.main.head,insert:'new '}}).state;
  s=s.update({selection:{anchor:0}}).state;
  assert.equal(s.field(tablePreview).size,1);
  assert.equal(s.doc.toString(),source.replace('hello','new hello'));
});
test('empty header and body cells keep their column positions', () => {
  for(const row of ['| | value |',' | | value |',' | | value | ']) {
    const s=EditorState.create({doc:'| | B |\n| --- | --- |\n'+row,extensions:[markdown({base:markdownLanguage})]});
    const model=tableModel(syntaxTree(s).topNode.getChild('Table'),s);
    assert.equal(model.rows[0].cells.length,2);
    assert.equal(model.rows[1].cells.length,2);
    assert.deepEqual(model.rows[1].cells[0],[]);
    assert.deepEqual(model.rows[1].cells[1],[{text:'value'}]);
  }
});
test('entities and table escaped pipes in code render decoded text', () => {
  const s=EditorState.create({doc:'| A | B |\n| --- | --- |\n| &amp; &#x41; | `a\\|b` |',extensions:[markdown({base:markdownLanguage})]});
  const model=tableModel(syntaxTree(s).topNode.getChild('Table'),s);
  assert.deepEqual(model.rows[1].cells[0],[{text:'&'},{text:' '},{text:'A'}]);
  assert.equal(model.rows[1].cells[1][0].children[0].text,'a|b');
});
test('middle and trailing empty cells, optional outer pipes and escaped delimiters preserve slots', () => {
  for (const row of ['| first | | last |','first | | last']) {
    const s=EditorState.create({doc:'| A | | C |\n| --- | --- | --- |\n'+row+'\n| a\\|b | tail | |',extensions:[markdown({base:markdownLanguage})]});
    const model=tableModel(syntaxTree(s).topNode.getChild('Table'),s);
    assert.equal(model.rows[0].cells.length,3);
    assert.deepEqual(model.rows[1].cells,[[{text:'first'}],[],[{text:'last'}]]);
    assert.deepEqual(model.rows[2].cells[2],[]);
    assert.deepEqual(model.rows[2].cells[0],[{text:'a'},{text:'|'},{text:'b'}]);
  }
});

import { revealTableMotion, tableMotionPath, tableMotionCount } from '../../static/src/table-preview.js';
test('vertical motion reveals only its source path until explicit cleanup, without editing source', () => {
  let s = EditorState.create({doc:source, extensions:[markdown({base:markdownLanguage}), tablePreview]});
  const path = tableMotionPath(s, 1, 2);
  assert.equal(path.from, 0);
  assert.equal(path.to, s.doc.line(4).to);
  s = s.update({effects:revealTableMotion.of(path)}).state;
  assert.equal(s.field(tablePreview).size, 0);
  s = s.update({selection:{anchor:s.doc.line(2).from}}).state;
  assert.equal(s.field(tablePreview).size, 0, 'remain raw across intermediate command transactions');
  s = s.update({effects:revealTableMotion.of(null)}).state;
  assert.equal(s.field(tablePreview).size, 1);
  assert.equal(s.doc.toString(), source);
});

test('motion range is bounded and leaves tables outside its path rendered', () => {
  const doc = source + '\n\n' + source;
  let s = EditorState.create({doc, selection:{anchor:source.length + 2}, extensions:[markdown({base:markdownLanguage}), tablePreview]});
  assert.equal(s.field(tablePreview).size, 2);
  s = s.update({effects:revealTableMotion.of(tableMotionPath(s,1,2))}).state;
  assert.equal(s.field(tablePreview).size,1);
  assert.equal(s.field(tablePreview).iter().from,source.indexOf('| A'));
  assert.equal(tableMotionPath(s,1,100000).to,s.doc.length);
  assert.equal(tableMotionPath(s,-1,100000).from,0);
});

test('pending Vim count digits combine with operator counts before handler normalization', () => {
  assert.equal(tableMotionCount({prefixRepeat:[],motionRepeat:[],keyBuffer:['2']}),2);
  assert.equal(tableMotionCount({prefixRepeat:['2'],motionRepeat:[],keyBuffer:['3']}),6);
  assert.equal(tableMotionCount({prefixRepeat:[],motionRepeat:[],keyBuffer:['2','g']}),2);
  assert.equal(tableMotionCount({prefixRepeat:[],motionRepeat:[],keyBuffer:[]}),1);
});

test('upward path includes the empty-line halo below a block table', () => {
  let s = EditorState.create({doc:source, selection:{anchor:source.length}, extensions:[markdown({base:markdownLanguage}),tablePreview]});
  const path = tableMotionPath(s,-1);
  assert.equal(path.from,s.doc.line(5).from);
  s = s.update({effects:revealTableMotion.of(path)}).state;
  assert.equal(s.field(tablePreview).size,0);
});
