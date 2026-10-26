import { Decoration, ViewPlugin } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';

// This parser only recognizes the source boundary; YAML is never interpreted.
export const frontMatter = {
  defineNodes: [{ name: 'FrontMatter', block: true }],
  parseBlock: [{
    name: 'FrontMatter', before: 'HorizontalRule',
    parse(cx, line) {
      if (cx.lineStart !== 0 || line.text !== '---') return false;
      let end = line.text.length;
      while (cx.nextLine()) {
        end = cx.lineStart + line.text.length;
        if (line.text === '---' || line.text === '...') {
          cx.nextLine();
          break;
        }
      }
      cx.addElement(cx.elt('FrontMatter', 0, end));
      return true;
    },
  }],
};

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
    // Never partly hide a block intersecting any cursor or selection range.
    if (blocks.test(node.name) && selected(node)) return false;
    if (/^ATXHeading[1-6]$/.test(node.name)) {
      ranges.push(Decoration.line({ class: `lp-heading lp-h${node.name.at(-1)}` }).range(state.doc.lineAt(node.from).from));
    }
    if (node.name === 'StrongEmphasis') mark(node.from, node.to, 'lp-strong');
    if (node.name === 'Emphasis') mark(node.from, node.to, 'lp-emphasis');
    if (node.name === 'InlineCode') mark(node.from, node.to, 'lp-code');
    if (node.name === 'ListMark') mark(node.from, node.to, 'lp-list-marker');
    if (node.name === 'Image' || node.name === 'HTMLTag') return false;
    if (node.name === 'Link') {
      // The label stays inert text. Navigation remains the secondary safe preview.
      if (!node.node.getChild('URL') || state.doc.lineAt(node.from).number !== state.doc.lineAt(node.to).number) return false;
      mark(node.from, node.to, 'lp-link');
    }
    if (['EmphasisMark', 'CodeMark', 'HeaderMark'].includes(node.name)) hide(node);
    // Autolinks, bare URLs and email have no separate label: retain all source.
    // Only a supported, single-line labeled Link may conceal its destination.
    if (['LinkMark', 'URL'].includes(node.name)) {
      const link = node.node.parent;
      if (link?.name === 'Link' && link.getChild('URL') && state.doc.lineAt(link.from).number === state.doc.lineAt(link.to).number) hide(node);
    }
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
