import { parser, GFM } from '@lezer/markdown';
import { frontMatter } from '../static/src/markdown-front-matter.js';
import { mathSyntax } from '../static/src/math-syntax.js';

const excluded = new Set(['FrontMatter', 'Table', 'FencedCode', 'CodeBlock', 'HTMLBlock', 'HTMLTag', 'Comment', 'ProcessingInstruction', 'Autolink', 'InlineCode', 'LinkReference', 'MathInline', 'MathBlock']);
const baseParser = parser.configure([GFM, frontMatter, mathSyntax]);
const protectedNode = node => excluded.has(node.name) ||
  (['Link', 'Image'].includes(node.name) && (node.getChild('URL') || node.getChild('LinkLabel')));

// The preview grammar intentionally accepts single-line links only. Explicit
// formatting can join soft-wrapped aliases before Prettier sees them as raw
// paragraph text and repeatedly adds the surrounding list's indentation.
export function normalizeWrappedWikiAliases(source) {
  if (!source.includes('[[') || !/[\r\n]/.test(source)) return source;
  const bom = source.startsWith('\ufeff') ? '\ufeff' : '';
  const text = source.slice(bom.length).replace(/\r\n?/g, '\n');
  // Only completed Markdown constructs protect a range. hasOpenLink also
  // includes unmatched literal brackets and would hide valid wrapped aliases.
  const protectedRanges = [], baseCursor = baseParser.parse(text).cursor();
  for (let visited = 0; ; visited++) {
    if (visited === 100000) return null;
    const descend = !protectedNode(baseCursor.node);
    if (!descend) protectedRanges.push({ from: baseCursor.from, to: baseCursor.to });
    if (!baseCursor.next(descend)) break;
  }
  const protectedAt = pos => {
    let low = 0, high = protectedRanges.length;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (protectedRanges[mid].from <= pos) low = mid + 1;
      else high = mid;
    }
    return low > 0 && pos < protectedRanges[low - 1].to;
  };
  const candidates = new Map();
  let scanned = 0, exhausted = false;
  const syntax = {
    defineNodes: ['WrappedWikiAlias'],
    parseInline: [{ name: 'WrappedWikiAlias', before: 'Link', parse(cx, next, pos) {
      // An unmatched ![ opener would otherwise consume the first '[' before
      // this rule can see it. Keep the literal '!' outside the alias node.
      if (next === 33 && cx.char(pos + 1) === 91 && cx.char(pos + 2) === 91) pos++;
      else if (next !== 91 || cx.char(pos + 1) !== 91) return -1;
      if (protectedAt(pos)) return -1;
      const remaining = cx.slice(pos + 2, Math.min(cx.end, pos + 8192));
      const end = remaining.indexOf(']]');
      scanned += end < 0 ? remaining.length : end + 2;
      if (scanned > 8 * 1024 * 1024) { exhausted = true; return -1; }
      if (end < 0) return -1;
      const content = remaining.slice(0, end), pipe = content.indexOf('|');
      if (pipe <= 0 || /[\n\[\]]/.test(content.slice(0, pipe)) || !content.slice(pipe + 1).includes('\n')) return -1;
      const to = pos + end + 4;
      // InlineContext replaces actual container prefixes with spaces, so a
      // quote marker is removed while a literal '>' in the label is retained.
      candidates.set(pos, { to, value: '[[' + content.replace(/[ \t]*\n[ \t]*/g, ' ') + ']]' });
      return cx.addElement(cx.elt('WrappedWikiAlias', pos, to));
    } }],
  };
  const tree = baseParser.configure(syntax).parse(text);
  if (exhausted) return null;
  const changes = [], cursor = tree.cursor();
  for (let visited = 0; ; visited++) {
    if (visited === 100000) return null;
    let descend = !protectedNode(cursor.node);
    if (cursor.name === 'WrappedWikiAlias') {
      const candidate = candidates.get(cursor.from);
      if (!candidate || candidate.to !== cursor.to) return null;
      changes.push({ from: cursor.from, ...candidate });
      descend = false;
    }
    if (!cursor.next(descend)) break;
  }
  if (!changes.length) return source;
  const pieces = [];
  let from = 0;
  for (const change of changes) {
    pieces.push(text.slice(from, change.from), change.value);
    from = change.to;
  }
  pieces.push(text.slice(from));
  // Match Prettier's auto EOL selection; explicit endOfLine still runs next.
  const eol = source.match(/\r\n?|\n/)?.[0] || '\n';
  return bom + pieces.join('').replaceAll('\n', eol);
}
