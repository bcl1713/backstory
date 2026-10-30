import { decodeHTMLStrict } from 'entities';
import { StateField } from '@codemirror/state';
import { Decoration, EditorView, WidgetType } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';

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
  const decorations = [];
  syntaxTree(state).iterate({ enter(node) {
    if (node.name !== 'Table') return;
    if (!state.selection.ranges.some(range => range.from <= node.to && range.to >= node.from)) {
      decorations.push(Decoration.replace({ block: true, widget: new TableWidget(tableModel(node.node, state), node.from, state.doc.sliceString(node.from, node.to)) }).range(node.from, node.to));
    }
    return false;
  } });
  return Decoration.set(decorations, true);
}

export const tablePreview = StateField.define({
  create: tableDecorations,
  update(value, transaction) {
    return transaction.docChanged || transaction.selection || syntaxTree(transaction.startState) !== syntaxTree(transaction.state)
      ? tableDecorations(transaction.state) : value;
  },
  provide: field => EditorView.decorations.from(field),
});
