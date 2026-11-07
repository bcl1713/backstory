import { parser, GFM } from '@lezer/markdown';
import { frontMatter } from './markdown-front-matter.js';

const excluded = new Set(['FrontMatter', 'Table', 'FencedCode', 'CodeBlock', 'HTMLBlock', 'HTMLTag', 'InlineCode', 'Link', 'Image', 'LinkReference', 'WikiLink']);
const delimiter = text => text === '$$' ? '$$' : text === '\\[' ? '\\]' : null;
function singleDisplay(text) {
  if (text.length > 8192) return false;
  const close = text.startsWith('$$') ? '$$' : text.startsWith('\\[') ? '\\]' : null;
  if (!close) return false;
  for (let at = 2; at < text.length; at++) {
    if (text.startsWith(close, at)) return at > 2 && at + 2 === text.length;
    if (text[at] === '\\') at++;
  }
  return false;
}
const expressionFor = source => source.slice(2, -2).trim();

// Explicit inline syntax precedes Markdown's Escape rule. The parser, not an
// auto-render DOM scan, owns complete math and shields its TeX from Markdown.
export const mathSyntax = {
  defineNodes: ['MathInline', { name: 'MathBlock', block: true }],
  parseInline: [{ name: 'MathInline', before: 'Escape', parse(cx, next, pos) {
    if (next !== 92 || cx.char(pos + 1) !== 40 || cx.hasOpenLink) return -1;
    for (let at = pos + 2, limit = Math.min(cx.end, pos + 8192); at < limit; at++) {
      const char = cx.char(at);
      if (char === 10 || char === 13) return -1;
      if (char !== 92) continue;
      if (cx.char(at + 1) === 41) return at === pos + 2 || at + 2 > limit ? -1 : cx.addElement(cx.elt('MathInline', pos, at + 2));
      at++; // A pair of backslashes cannot start a closing delimiter.
    }
    return -1;
  } }],
  parseBlock: [{ name: 'MathBlock', before: 'SetextHeading',
    parse(cx, line) {
      if (cx.parentType().name !== 'Document' || line.basePos !== 0 || line.pos !== 0 || !singleDisplay(line.text)) return false;
      cx.addElement(cx.elt('MathBlock', cx.lineStart, cx.lineStart + line.text.length));
      cx.nextLine();
      return true;
    },
    leaf(cx, leaf) {
      const close = delimiter(leaf.content);
      if (!close || cx.parentType().name !== 'Document') return null;
      return {
        nextLine(cx, line, leaf) {
          if (cx.lineStart + line.text.length - leaf.start > 8192 || line.text !== close) return false;
          cx.addLeafElement(leaf, cx.elt('MathBlock', leaf.start, cx.lineStart + line.text.length));
          cx.nextLine();
          return true;
        },
        finish() { return false; },
      };
    },
  }],
};

export function mathModelsFromTree(tree, slice) {
  const models = [];
  const cursor = tree.cursor();
  for (let visited = 0; visited < 100000; visited++) {
    let descend = !excluded.has(cursor.name);
    if (cursor.name === 'MathInline' || cursor.name === 'MathBlock') {
      const source = slice(cursor.from, cursor.to);
      models.push({ from: cursor.from, to: cursor.to, source, expression: expressionFor(source), display: cursor.name === 'MathBlock' });
      descend = false;
      if (models.length === 100) break;
    }
    if (visited === 99999 || !cursor.next(descend)) break;
  }
  return models;
}

let sourceParser;
// Formatting may change Markdown around math, but must not rewrite the TeX.
// EOL-only conversion is governed by the existing formatter configuration.
export function mathSources(source) {
  const normalized = source.replace(/\r\n?|\n/g, '\n');
  sourceParser ||= parser.configure([GFM, frontMatter, mathSyntax]);
  // Display extraction intentionally stops at 100 widgets. Formatting must
  // protect every formula, or explicitly refuse an incomplete verification.
  const cursor = sourceParser.parse(normalized).cursor();
  const signatures = [];
  for (let visited = 0; visited < 100000; visited++) {
    let descend = !excluded.has(cursor.name);
    if (cursor.name === 'MathInline' || cursor.name === 'MathBlock') {
      signatures.push(normalized.slice(cursor.from, cursor.to));
      descend = false;
    }
    if (visited === 99999) return null;
    if (!cursor.next(descend)) return signatures;
  }
  return null;
}
