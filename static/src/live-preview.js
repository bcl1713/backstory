import { Decoration, ViewPlugin } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';

export { frontMatter } from './markdown-front-matter.js';

const rawBlocks = new Set(['FrontMatter', 'Table', 'FencedCode', 'CodeBlock', 'HTMLBlock']);
const blocks = /^(Paragraph|ATXHeading[1-6]|SetextHeading[12]|ListItem|Blockquote)$/;

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
  return ViewPlugin.fromClass(class {
    constructor(view) { this.decorations = buildDecorations(view); }
    update(update) {
      if (update.docChanged || update.selectionSet || update.viewportChanged || syntaxTree(update.startState) !== syntaxTree(update.state)) {
        this.decorations = buildDecorations(update.view);
      }
    }
  }, { decorations: plugin => plugin.decorations });
}
