import { syntaxTree } from '@codemirror/language';
import { ViewPlugin } from '@codemirror/view';
import { sourceChanges } from './source-merge.js';

const eligible = new Set(['Paragraph', 'BulletList', 'OrderedList', 'Table']);
export function markdownBlock(state, position) {
  const tree = syntaxTree(state);
  if (tree.length < state.doc.length) return null;
  let node = tree.resolveInner(position, 1);
  if (node.name === 'Document') node = tree.resolveInner(position, -1);
  while (node.parent && node.parent.name !== 'Document') node = node.parent;
  // Prettier treats explicit TeX as ordinary Markdown and may collapse spaces
  // in \verb/\text. Do not queue automatic formatting of a math-owned block.
  // A conservative traversal cap also avoids unbounded per-selection work.
  if (eligible.has(node.name)) {
    const cursor = node.cursor();
    for (let visited = 0; visited < 10000; visited++) {
      if (cursor.from < node.from || cursor.to > node.to) break;
      if (cursor.name === 'MathInline' || cursor.name === 'MathBlock') return null;
      if (cursor.name === 'FencedCode') {
        const info = cursor.node.getChild('CodeInfo');
        if (info && /^mermaid(?:[ \t]|$)/i.test(state.doc.sliceString(info.from, info.to).trim())) return null;
      }
      if (!cursor.next()) break;
      if (visited === 9999) return null;
    }
  }
  return eligible.has(node.name) && node.from <= position && position <= node.to
    ? { from: node.from, to: node.to, type: node.name } : null;
}

export function blockIsInactive(state, block, changes = []) {
  return state.selection.ranges.every(range => (range.to < block.from || range.from > block.to) &&
    changes.every(change => change.to < range.from || change.from > range.to));
}

export function blockFormattingChanges(before, after, block) {
  if (!block) return null;
  // Offsets refer to CodeMirror's LF document. Mixed endings or a global EOL
  // conversion need the explicit full-document path, not block application.
  const endings = text => new Set(text.match(/\r\n|\r|\n/g) || []);
  const a = endings(before), b = endings(after);
  if (a.size > 1 || b.size > 1 || (a.size && b.size && [...a][0] !== [...b][0])) return null;
  const normalized = text => text.replace(/\r\n|\r/g, '\n');
  before = normalized(before); after = normalized(after);
  let { from, to } = block;
  // Include this block's own indentation, final newline and following blank
  // separator lines. Never include another content line's indentation/trailing
  // spaces: those characters belong to the neighboring block.
  const lineStart = before.lastIndexOf('\n', from - 1) + 1;
  if (/^[\t ]*$/.test(before.slice(lineStart, from))) from = lineStart;
  to += before.slice(to).match(/^[\t ]*(?:\n|$)/)?.[0].length || 0;
  to += before.slice(to).match(/^(?:[\t ]*\n)*/)[0].length;
  const changes = sourceChanges(before, after);
  return changes.every(change => change.from >= from && change.to <= to &&
    // Insertion exactly at a neighboring block's start would edit that block.
    !(change.from === to && to < before.length && change.insert)) ? changes : null;
}

export function blockExitExtension(onExit) {
  return ViewPlugin.fromClass(class {
    constructor() { this.edited = null; }
    update(update) {
      if (!update.docChanged && !update.selectionSet) return;
      if (update.docChanged && update.transactions.every(tr => tr.isUserEvent('input.external') || tr.isUserEvent('input.format'))) {
        this.edited = null;
        return;
      }
      let previous = this.edited;
      if (update.docChanged) {
        previous ||= markdownBlock(update.startState, update.startState.selection.main.head);
        if (previous) previous = markdownBlock(update.state, update.changes.mapPos(previous.from, -1));
      }
      const current = markdownBlock(update.state, update.state.selection.main.head);
      // A single newline at EOF is still an ongoing paragraph. Wait for an
      // actual blank separator or a different parsed block before formatting.
      const boundary = !update.docChanged || current || (previous &&
        /\n[\t ]*\n/.test(update.state.doc.sliceString(previous.to, update.state.selection.main.from)));
      if (previous && boundary && blockIsInactive(update.state, previous)) {
        const block = previous, doc = update.state.doc;
        // Editor dispatch is forbidden inside plugin updates. Recheck the
        // document after leaving the transaction before scheduling a request.
        queueMicrotask(() => { if (update.view.state.doc === doc) onExit(block); });
        previous = null;
      }
      this.edited = update.docChanged ? current || previous : previous;
    }
  });
}
