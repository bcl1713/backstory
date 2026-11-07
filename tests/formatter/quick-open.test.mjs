import test from 'node:test';
import assert from 'node:assert/strict';
import { isQuickOpenShortcut, noteHref, resultIndex } from '../../static/src/quick-open.js';
test('quick open shortcut avoids browser bookmarks and typing/composition', () => {
 const chord = {code:'KeyO',ctrlKey:true,altKey:true};
 assert.equal(isQuickOpenShortcut(chord),true);
 assert.equal(isQuickOpenShortcut({...chord,getModifierState:key=>key==='AltGraph'}),false);
 for (const extra of [{shiftKey:true},{metaKey:true},{repeat:true},{isComposing:true},{defaultPrevented:true}]) assert.equal(isQuickOpenShortcut({...chord,...extra}),false);
 assert.equal(isQuickOpenShortcut({code:'KeyO',ctrlKey:true,shiftKey:true}),false);
 assert.equal(isQuickOpenShortcut({code:'KeyO',altKey:true}),false);
});
test('note links encode literal path components and reject traversal/unsupported paths', () => {
 assert.equal(noteHref('Folder/A note & ü.md'),'/notes/Folder/A%20note%20%26%20%C3%BC.md');
 for(const path of ['',null,'//evil/x.md','/x.md','../x.md','a/../x.md','.private/x.md','a//x.md','a\\x.md','a#x.md','a\nx.md','x.txt']) assert.equal(noteHref(path),null,path);
 assert.equal(noteHref('100%.md'),'/notes/100%25.md');
});

test('literal question marks and case-insensitive Markdown suffix match the server', () => {
 assert.equal(noteHref('What?.MD'), '/notes/What%3F.MD');
});
test('arrow navigation starts at the first/last result and wraps even with one result', () => {
 for(const count of [1,2,3]) {
  assert.equal(resultIndex(-1,count,'ArrowUp'),count-1);
  assert.equal(resultIndex(-1,count,'ArrowDown'),0);
  assert.equal(resultIndex(0,count,'ArrowUp'),count-1);
  assert.equal(resultIndex(count-1,count,'ArrowDown'),0);
 }
});
