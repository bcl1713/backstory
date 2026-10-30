import { decodeHTMLStrict } from 'entities';
import { StateEffect, StateField } from '@codemirror/state';
import { Decoration, EditorView, ViewPlugin, WidgetType } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { getCM } from '@replit/codemirror-vim';

// DOM is built from syntax nodes and textContent only: no HTML interpretation,
// image loading, or navigation occurs while a table is a presentation widget.
function inline(node, doc) {
  const source = doc.sliceString(node.from, node.to);
  if (node.name === 'Entity') return [{ text: decodeHTMLStrict(source) }];
  if (node.name === 'Escape') return [{ text: source.slice(1) }];
  if (node.name === 'WikiLink') {
    const inner = source.slice(2, -2);
    return [{ tag: 'span', className: 'lp-link', children: [{ text: inner.includes('|') ? inner.slice(inner.indexOf('|') + 1) : inner }] }];
  }
  if (node.name === 'InlineCode') {
    const start = node.firstChild?.to ?? node.from;
    const end = node.lastChild?.from ?? node.to;
    let text = doc.sliceString(start, end).replace(/\n/g, ' ').replace(/\\\|/g, '|');
    if (/^ .* $/.test(text) && /[^ ]/.test(text)) text = text.slice(1, -1);
    return [{ tag: 'code', children: [{ text }] }];
  }
  if (node.name === 'Image' || node.name === 'HTMLTag') return [{ text: source }];
  const tags = { StrongEmphasis: 'strong', Emphasis: 'em', Strikethrough: 's' };
  let from = node.from;
  let to = node.to;
  let children = [];
  if (node.name === 'Link') {
    // Render the label, not a raw URL or a potentially unsafe clickable target.
    const marks = node.getChildren('LinkMark');
    if (marks.length >= 2) { from = marks[0].to; to = marks[1].from; }
  }
  let position = from;
  for (let child = node.firstChild; child; child = child.nextSibling) {
    if (child.from < from || child.to > to) continue;
    if (child.from > position) children.push({ text: doc.sliceString(position, child.from) });
    if (!['EmphasisMark', 'StrikethroughMark', 'CodeMark'].includes(child.name)) children.push(...inline(child, doc));
    position = child.to;
  }
  if (position < to) children.push({ text: doc.sliceString(position, to) });
  if (tags[node.name]) return [{ tag: tags[node.name], children }];
  if (node.name === 'Link') return [{ tag: 'span', className: 'lp-link', children }];
  return children;
}

export function tableModel(node, state) {
  const delimiter = node.getChild('TableDelimiter');
  const alignments = delimiter ? state.doc.sliceString(delimiter.from, delimiter.to).trim().replace(/^\||\|$/g, '').split('|').map(cell => {
    const text = cell.trim();
    return text.startsWith(':') && text.endsWith(':') ? 'center' : text.endsWith(':') ? 'right' : 'left';
  }) : [];
  const rows = [];
  for (let row = node.firstChild; row; row = row.nextSibling) {
    if (!['TableHeader', 'TableRow'].includes(row.name)) continue;
    // Empty cells have no TableCell node. Delimiters define the slots, while
    // cell nodes preserve inline syntax and distinguish escaped pipes.
    const delimiters = row.getChildren('TableDelimiter');
    const cells = row.getChildren('TableCell');
    let from = row.from;
    const slots = [];
    for (let i = 0; i < delimiters.length; i++) {
      const delimiter = delimiters[i];
      if (i || state.doc.sliceString(from, delimiter.from).trim()) {
        const cell = cells.find(cell => cell.from >= from && cell.to <= delimiter.from);
        slots.push(cell ? inline(cell, state.doc) : []);
      }
      from = delimiter.to;
    }
    if (state.doc.sliceString(from, row.to).trim() || !delimiters.length) {
      const cell = cells.find(cell => cell.from >= from);
      slots.push(cell ? inline(cell, state.doc) : []);
    }
    rows.push({ header: row.name === 'TableHeader', cells: slots });
  }
  return { rows, alignments };
}

function appendParts(parent, parts, document) {
  for (const part of parts) {
    if ('text' in part) parent.appendChild(document.createTextNode(part.text));
    else {
      const element = document.createElement(part.tag);
      if (part.className) element.className = part.className;
      appendParts(element, part.children, document);
      parent.appendChild(element);
    }
  }
}

class TableWidget extends WidgetType {
  constructor(model, from, source) { super(); this.model = model; this.from = from; this.source = source; }
  eq(other) { return other.source === this.source && other.from === this.from; }
  toDOM(view) {
    const document = view.dom.ownerDocument;
    const wrapper = document.createElement('div');
    wrapper.className = 'lp-table';
    const table = document.createElement('table');
    table.setAttribute('aria-label', 'Markdown table; move the caret here to edit source');
    const head = document.createElement('thead');
    const body = document.createElement('tbody');
    const columns = this.model.rows[0]?.cells.length || 0;
    for (const row of this.model.rows) {
      const tr = document.createElement('tr');
      for (let i = 0; i < columns; i++) {
        const cell = document.createElement(row.header ? 'th' : 'td');
        if (row.header) cell.scope = 'col';
        cell.className = `lp-table-align-${this.model.alignments[i] || 'left'}`;
        appendParts(cell, row.cells[i] || [], document);
        tr.appendChild(cell);
      }
      (row.header ? head : body).appendChild(tr);
    }
    table.append(head, body);
    wrapper.appendChild(table);
    wrapper.addEventListener('mousedown', event => {
      if (event.button !== 0) return;
      event.preventDefault();
      view.dispatch({ selection: { anchor: this.from }, scrollIntoView: true });
      view.focus();
    });
    return wrapper;
  }
  ignoreEvent() { return false; }
}

export function tableDecorations(state) {
  const motion = state.field(tableMotionRange, false);
  const decorations = [];
  syntaxTree(state).iterate({ enter(node) {
    if (node.name !== 'Table') return;
    if (!(motion && motion.from <= node.to && motion.to >= node.from) && !state.selection.ranges.some(range => range.from <= node.to && range.to >= node.from)) {
      decorations.push(Decoration.replace({ block: true, widget: new TableWidget(tableModel(node.node, state), node.from, state.doc.sliceString(node.from, node.to)) }).range(node.from, node.to));
    }
    return false;
  } });
  return Decoration.set(decorations, true);
}

// Block widgets are intentionally skipped by CodeMirror's vertical geometry
// navigation. Reveal only tables in this key's source-line path before the
// normal editor/Vim handlers run, so their counts and operators see real lines.
export const revealTableMotion = StateEffect.define();
const tableMotionRange = StateField.define({
  create: () => null,
  update(value, transaction) {
    for (const effect of transaction.effects) if (effect.is(revealTableMotion)) return effect.value;
    return value && transaction.docChanged
      ? { from: transaction.changes.mapPos(value.from, -1), to: transaction.changes.mapPos(value.to, 1) }
      : value;
  },
});

// A block replacement can absorb its adjacent empty text line in layout.
// Include that one-line halo so the first upward key cannot skip the table.
export function tableMotionPath(state, direction, count = 1) {
  const lines = state.selection.ranges.flatMap(range => {
    const line = state.doc.lineAt(range.head).number;
    const target = Math.max(1, Math.min(state.doc.lines, line + direction * (count + 1)));
    return [line, target];
  });
  return { from: state.doc.line(Math.min(...lines)).from, to: state.doc.line(Math.max(...lines)).to };
}

export function tableMotionCount(input) {
  // The Vim engine transfers leading digits from keyBuffer into repeat arrays
  // only when it handles the final motion key. Observers run before that step.
  const pending = /^[1-9]\d*/.exec(input.keyBuffer.join(''))?.[0];
  return (Number(input.prefixRepeat.join('')) || 1)
    * (Number(input.motionRepeat.join('')) || 1) * (Number(pending) || 1);
}

const tableKeyboardMotion = ViewPlugin.fromClass(class {
  constructor() { this.destroyed = false; this.generation = 0; }
  destroy() { this.destroyed = true; }
}, {
  eventObservers: {
    keydown(event, view) {
      if (event.defaultPrevented || event.isComposing || event.altKey || event.metaKey || event.ctrlKey) return;
      const vim = getCM(view)?.state.vim;
      const vimMotion = vim && !vim.insertMode;
      const direction = event.key === 'ArrowDown' || (vimMotion && event.key === 'j') ? 1
        : event.key === 'ArrowUp' || (vimMotion && event.key === 'k') ? -1 : 0;
      if (!direction) return;
      const count = vimMotion ? tableMotionCount(vim.inputState) : 1;
      const path = tableMotionPath(view.state, direction, count);
      let hidden = false;
      view.state.field(tablePreview).between(path.from, path.to, () => { hidden = true; });
      if (!hidden) return;
      const generation = ++this.generation;
      view.dispatch({ effects: revealTableMotion.of(path) });
      // Keep raw geometry through every synchronous transaction in a command,
      // including operator-pending Vim. Restore before the browser can paint,
      // even for a no-op key. A removed live-mode plugin must not dispatch.
      queueMicrotask(() => {
        if (!this.destroyed && this.generation === generation) view.dispatch({ effects: revealTableMotion.of(null) });
      });
    },
  },
});

export const tablePreview = StateField.define({
  create: tableDecorations,
  update(value, transaction) {
    return transaction.docChanged || transaction.selection || transaction.effects.some(effect => effect.is(revealTableMotion)) || syntaxTree(transaction.startState) !== syntaxTree(transaction.state)
      ? tableDecorations(transaction.state) : value;
  },
  provide: field => [tableMotionRange, tableKeyboardMotion, EditorView.decorations.from(field)],
});
