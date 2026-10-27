import { ensureSyntaxTree, syntaxTree } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { stickyEditorTop } from './editor-viewport.js';
import { Transaction } from '@codemirror/state';

// This mirrors heading_slug's plain-text cleanup. Headings come only from the
// current CodeMirror document's syntax tree; fences/front matter never qualify.
function slug(text) {
  return text.toLowerCase().replace(/[^\p{L}\p{N}_\s-]/gu, '').trim().replace(/\s+/gu, '-') || 'section';
}
function referenceLabel(value) {
  return value.slice(1, -1).trim().replace(/\s+/gu, ' ').toLowerCase().toUpperCase();
}
function plainHeading(state, node, references) {
  const raw = state.doc.sliceString(node.from, node.to);
  // Syntax offsets count UTF-16 code units, as does the CodeMirror document.
  const output = raw.split('');
  const code = [];
  const escaped = index => {
    let backslashes = 0;
    for (let i = index - 1; i >= 0 && raw[i] === '\\'; i--) backslashes++;
    return Boolean(backslashes % 2);
  };
  const erase = (from, to) => { for (let i = from; i < to; i++) output[i] = ''; };
  node.node.toTree().iterate({ enter(child) {
    if (child.name === 'InlineCode') code.push([child.from, child.to]);
    const marker = ['HeaderMark', 'EmphasisMark', 'CodeMark', 'LinkMark'].includes(child.name);
    const reference = child.name === 'LinkLabel'
      && ['Link', 'Image'].includes(child.node.parent?.name)
      && references.has(referenceLabel(raw.slice(child.from, child.to)));
    const destination = (['URL', 'LinkTitle'].includes(child.name) && ['Link', 'Image'].includes(child.node.parent?.name)) || reference;
    if (marker || destination) erase(child.from, child.to);
  } });
  const inCode = index => code.some(([from, to]) => index >= from && index < to);
  for (const match of raw.matchAll(/\[\[([^\]\n]+)\]\]/g)) {
    if (inCode(match.index) || escaped(match.index)) continue;
    erase(match.index, match.index + match[0].length);
    const [target, ...label] = match[1].split('|');
    output[match.index] = label.length ? label.join('|') : target;
  }
  for (const match of raw.matchAll(/&(?:#[xX][\da-fA-F]+|#\d+|[\da-zA-Z]+);/g)) {
    if (inCode(match.index) || escaped(match.index)) continue;
    // The fragment consists of an entity only: no raw HTML enters this inert
    // textarea, and its value is used solely as a disposable slug projection.
    const decoder = document.createElement('textarea');
    decoder.innerHTML = match[0];
    erase(match.index, match.index + match[0].length);
    output[match.index] = decoder.value;
  }
  return output.join('');
}

export function installHeadingNavigation(view) {
  const jump = () => {
    let fragment;
    try { fragment = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    if (!fragment.startsWith('preview-')) return;
    const wanted = fragment.slice('preview-'.length);
    const tree = ensureSyntaxTree(view.state, view.state.doc.length, 1000) || syntaxTree(view.state);
    const references = new Set();
    tree.iterate({ enter(node) {
      if (node.name !== 'LinkReference') return;
      const label = node.node.getChild('LinkLabel');
      if (label) references.add(referenceLabel(view.state.doc.sliceString(label.from, label.to)));
    } });
    const counts = new Map();
    const used = new Set();
    let position = null;
    tree.iterate({ enter(node) {
      if (!/^(ATXHeading[1-6]|SetextHeading[12])$/.test(node.name)) return;
      const base = slug(plainHeading(view.state, node, references));
      let count = counts.get(base) || 0;
      let candidate = base + (count ? `-${count}` : '');
      while (used.has(candidate)) candidate = `${base}-${++count}`;
      counts.set(base, count + 1);
      used.add(candidate);
      if (candidate === wanted) position = node.from;
    } });
    if (position !== null) view.dispatch({ selection: { anchor: position }, effects: EditorView.scrollIntoView(position, { y: 'start', yMargin: stickyEditorTop(view.dom.ownerDocument) + 5 }), annotations: Transaction.addToHistory.of(false) });
  };
  const initial = setTimeout(jump, 0);
  window.addEventListener('hashchange', jump);
  return () => { clearTimeout(initial); window.removeEventListener('hashchange', jump); };
}
