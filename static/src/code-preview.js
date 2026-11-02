import { Decoration, ViewPlugin } from '@codemirror/view';
import { HighlightStyle, StreamLanguage, syntaxHighlighting, syntaxTree } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { javascript, typescript, json } from '@codemirror/legacy-modes/mode/javascript';
import { python } from '@codemirror/legacy-modes/mode/python';
import { shell } from '@codemirror/legacy-modes/mode/shell';
import { yaml } from '@codemirror/legacy-modes/mode/yaml';
import { css } from '@codemirror/legacy-modes/mode/css';
import { xml } from '@codemirror/legacy-modes/mode/xml';
import { standardSQL } from '@codemirror/legacy-modes/mode/sql';

const languages = new Map();
for (const [parser, aliases] of [
  [javascript, ['javascript', 'js']], [typescript, ['typescript', 'ts']],
  [json, ['json']], [python, ['python', 'py']], [shell, ['shell', 'sh', 'bash', 'zsh']],
  [yaml, ['yaml', 'yml']], [css, ['css']], [xml, ['xml', 'html']], [standardSQL, ['sql']],
]) {
  const language = StreamLanguage.define(parser);
  for (const alias of aliases) languages.set(alias, language);
}
const languageName = info => info.trim().split(/\s+/)[0].toLowerCase();
const diagramLanguages = new Set(['mermaid', 'graphviz', 'dot', 'vega-lite']);
export const codeLanguage = info => languages.get(languageName(info)) || null;

export function ordinaryCodeBlock(node, state) {
  if (node.name === 'CodeBlock') return true;
  if (node.name !== 'FencedCode') return false;
  const info = node.getChild('CodeInfo');
  return !info || !diagramLanguages.has(languageName(state.doc.sliceString(info.from, info.to)));
}

export function codeDecorations(state) {
  const ranges = [];
  syntaxTree(state).iterate({ enter(ref) {
    const node = ref.node;
    if (!ordinaryCodeBlock(node, state)) return;
    const active = state.selection.ranges.some(range => range.from <= node.to && range.to >= node.from);
    const first = state.doc.lineAt(node.from).number, last = state.doc.lineAt(node.to).number;
    for (let number = first; number <= last; number++) {
      const edge = `${number === first ? ' lp-code-start' : ''}${number === last ? ' lp-code-end' : ''}`;
      ranges.push(Decoration.line({ class: `lp-code-line${edge}${active ? ' lp-code-active' : ''}` }).range(state.doc.line(number).from));
    }
    if (!active && node.name === 'FencedCode') {
      // Keep line boundaries and native caret geometry. Only the delimiter text
      // disappears; entering either fence line reveals its exact source.
      for (const mark of node.getChildren('CodeMark')) {
        const line = state.doc.lineAt(mark.from);
        ranges.push(Decoration.replace({}).range(mark.from, line.to));
      }
    }
    return false;
  } });
  return Decoration.set(ranges, true);
}

const style = [
  { tag: tags.keyword, class: 'lp-code-keyword' },
  { tag: [tags.string, tags.special(tags.string)], class: 'lp-code-string' },
  { tag: [tags.number, tags.bool, tags.null], class: 'lp-code-number' },
  { tag: [tags.comment, tags.meta], class: 'lp-code-comment' },
  { tag: [tags.typeName, tags.tagName, tags.attributeName, tags.propertyName], class: 'lp-code-name' },
];
export const codeHighlighting = [...new Set(languages.values())].map(language =>
  syntaxHighlighting(HighlightStyle.define(style, { scope: language })));
export const codePreview = ViewPlugin.fromClass(class {
  constructor(view) { this.decorations = codeDecorations(view.state); }
  update(update) {
    if (update.docChanged || update.selectionSet || update.viewportChanged || syntaxTree(update.startState) !== syntaxTree(update.state)) this.decorations = codeDecorations(update.state);
  }
}, { decorations: plugin => plugin.decorations });
