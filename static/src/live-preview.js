import { StateField } from '@codemirror/state';
import { Decoration, EditorView, ViewPlugin, WidgetType } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { ordinaryCodeBlock } from './code-preview.js';

export { frontMatter } from './markdown-front-matter.js';

const rawBlocks = new Set(['FrontMatter', 'Table', 'FencedCode', 'CodeBlock', 'HTMLBlock']);
const blocks = /^(Paragraph|ATXHeading[1-6]|SetextHeading[12]|ListItem|Blockquote)$/;

class SoftBreakWidget extends WidgetType {
  eq() { return true; }
  toDOM(view) {
    const space = view.dom.ownerDocument.createElement('span');
    space.textContent = ' ';
    return space;
  }
}

function softBreakDecorations(state) {
  const ranges = [];
  const selected = node => state.selection.ranges.some(range => range.from <= node.to && range.to >= node.from);
  syntaxTree(state).iterate({ enter(node) {
    if (rawBlocks.has(node.name) || ordinaryCodeBlock(node.node, state)) return false;
    if (blocks.test(node.name) && selected(node)) return false;
    if (!['Paragraph', 'Task'].includes(node.name)) return;
    const protectedRanges = [];
    const quotes = new Map();
    node.node.toTree().iterate({ enter(child) {
      const from = node.from + child.from, to = node.from + child.to;
      if (child.name === 'QuoteMark') quotes.set(from, to);
      if (['HardBreak', 'InlineCode', 'Link', 'Image', 'HTMLTag', 'MathInline'].includes(child.name)) {
        protectedRanges.push({ from, to });
        return false;
      }
    } });
    for (let number = state.doc.lineAt(node.from).number; number < state.doc.lineAt(node.to).number; number++) {
      const line = state.doc.line(number), next = state.doc.line(number + 1);
      if (protectedRanges.some(range => range.from <= line.to && range.to > line.to)) continue;
      let from = line.to, to = next.from;
      // Remove presentation whitespace, including parsed blockquote prefixes,
      // only inside this leaf block. Never cross paragraphs or list items.
      while (from > Math.max(line.from, node.from) && /[ \t]/.test(state.doc.sliceString(from - 1, from))) from--;
      while (to < Math.min(next.to, node.to)) {
        if (quotes.has(to)) to = quotes.get(to);
        else if (/[ \t]/.test(state.doc.sliceString(to, to + 1))) to++;
        else break;
      }
      ranges.push(Decoration.replace({ widget: new SoftBreakWidget() }).range(from, to));
    }
    return false;
  } });
  return Decoration.set(ranges, true);
}

// A direct state decoration may join source lines before viewport layout.
// ViewPlugin decorations cannot replace line boundaries (see hide below).
const softBreaks = StateField.define({
  create: softBreakDecorations,
  update(value, transaction) {
    return transaction.docChanged || transaction.selection || syntaxTree(transaction.startState) !== syntaxTree(transaction.state)
      ? softBreakDecorations(transaction.state) : value;
  },
  provide: field => EditorView.decorations.from(field),
});

function buildDecorations(view) {
  const { state } = view;
  const ranges = [];
  const selected = node => state.selection.ranges.some(range => range.from <= node.to && range.to >= node.from);
  const mark = (from, to, className) => {
    if (to > from) ranges.push(Decoration.mark({ class: className }).range(from, to));
  };
  const hide = node => {
    // View plugins may replace inline content only, never line boundaries.
    if (!state.doc.sliceString(node.from, node.to).includes('\n')) {
      ranges.push(Decoration.replace({}).range(node.from, node.to));
    }
  };
  syntaxTree(state).iterate({ enter(node) {
    if (ordinaryCodeBlock(node.node, state)) return false;
    if (rawBlocks.has(node.name)) {
      for (let n = state.doc.lineAt(node.from).number; n <= state.doc.lineAt(node.to).number; n++) {
        ranges.push(Decoration.line({ class: 'lp-source-region' }).range(state.doc.line(n).from));
      }
      return false;
    }
    const heading = /^(ATXHeading[1-6]|SetextHeading[12])$/.test(node.name);
    if (heading) {
      const level = node.name.at(-1);
      ranges.push(Decoration.line({ class: `lp-heading lp-h${level}`, attributes: { role: 'heading', 'aria-level': level } }).range(state.doc.lineAt(node.from).from));
    }
    // Heading semantics persist even while the selected block reveals source.
    if (blocks.test(node.name) && selected(node)) return false;
    if (node.name === 'StrongEmphasis') mark(node.from, node.to, 'lp-strong');
    if (node.name === 'Emphasis') mark(node.from, node.to, 'lp-emphasis');
    if (node.name === 'InlineCode') mark(node.from, node.to, 'lp-code');
    if (node.name === 'ListMark') mark(node.from, node.to, 'lp-list-marker');
    if (node.name === 'Image' || node.name === 'HTMLTag') return false;
    // A separate decoration plugin owns labeled links and line activity.
    if (node.name === 'Link' || node.name === 'WikiLink') return false;
    if (['EmphasisMark', 'CodeMark', 'HeaderMark'].includes(node.name)) hide(node);

  } });
  return Decoration.set(ranges, true);
}

export function createLivePreviewExtension() {
  return [softBreaks, ViewPlugin.fromClass(class {
    constructor(view) { this.decorations = buildDecorations(view); }
    update(update) {
      if (update.docChanged || update.selectionSet || update.viewportChanged || syntaxTree(update.startState) !== syntaxTree(update.state)) {
        this.decorations = buildDecorations(update.view);
      }
    }
  }, { decorations: plugin => plugin.decorations })];
}
