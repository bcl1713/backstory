import { render } from 'katex';

const mathNS = 'http://www.w3.org/1998/Math/MathML';
const htmlNS = 'http://www.w3.org/1999/xhtml';
const tags = new Set('math annotation semantics mtext mn mo mi mspace mover munder munderover msup msub msubsup mfrac mroot msqrt mtable mtr mtd mlabeledtr mrow menclose mstyle mpadded mphantom'.split(' '));
const booleans = new Set('accent accentunder displaystyle fence largeop separator stretchy'.split(' '));
const lengths = new Set('depth height width voffset lspace rspace mathsize linethickness minsize maxsize rowspacing columnspacing'.split(' '));
const enumValues = {
  display: /^(?:block|inline)$/,
  encoding: /^application\/x-tex$/,
  mathvariant: /^(?:normal|bold|italic|bold-italic|double-struck|bold-fraktur|script|bold-script|fraktur|sans-serif|bold-sans-serif|sans-serif-italic|sans-serif-bold-italic|monospace|initial|tailed|looped|stretched)$/,
  columnalign: /^(?:left|center|right)(?: (?:left|center|right)){0,31}$/,
  rowalign: /^(?:top|bottom|center|baseline|axis)(?: (?:top|bottom|center|baseline|axis)){0,31}$/,
  rowlines: /^(?:none|solid|dashed)(?: (?:none|solid|dashed)){0,31}$/,
  columnlines: /^(?:none|solid|dashed)(?: (?:none|solid|dashed)){0,31}$/,
  notation: /^(?:box|actuarial|phasorangle|horizontalstrike|updiagonalstrike|downdiagonalstrike|top|bottom|left|right)(?: (?:box|actuarial|phasorangle|horizontalstrike|updiagonalstrike|downdiagonalstrike|top|bottom|left|right)){0,7}$/,
  linebreak: /^newline$/,
  valign: /^(?:top|bottom|center|baseline|axis)$/,
  scriptlevel: /^-?[0-4]$/,
  mathcolor: /^(?:#[\da-fA-F]{3,8}|[a-zA-Z]{1,24})$/,
  mathbackground: /^(?:#[\da-fA-F]{3,8}|[a-zA-Z]{1,24})$/,
};
function safeLength(value) {
  const values = value.split(' ');
  return values.length <= 32 && values.every(part => /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:em|ex|mu|px|pt|pc|in|cm|mm|%)?$/.test(part) && Math.abs(parseFloat(part)) <= 20);
}

// Only the pinned renderer's detached MathML is admitted. This is not a raw
// HTML sanitizer, SVG importer, or API available to ordinary note markup.
export function validMathDOM(root) {
  const pending = [[root, 0]];
  let count = 0, size = 0;
  while (pending.length) {
    const [node, depth] = pending.pop();
    if (++count > 4096 || depth > 64) return false;
    if (node.nodeType === 3) { size += node.nodeValue.length; if (size > 65536) return false; continue; }
    if (node.nodeType !== 1) return false;
    const wrapper = node === root && node.namespaceURI === htmlNS && node.localName === 'span';
    if (!wrapper && (node.namespaceURI !== mathNS || !tags.has(node.localName))) return false;
    if (node.attributes.length > 16) return false;
    for (const { name, value, namespaceURI } of node.attributes) {
      if (namespaceURI || value.length > 2048) return false;
      if (wrapper) { if (name !== 'class' || value !== 'katex') return false; }
      else if (name === 'xmlns') { if (node.localName !== 'math' || value !== mathNS) return false; }
      else if (booleans.has(name)) { if (!/^(?:true|false)$/.test(value)) return false; }
      else if (lengths.has(name)) { if (!safeLength(value)) return false; }
      else if (!Object.hasOwn(enumValues, name) || !enumValues[name].test(value)) return false;
    }
    for (const child of node.childNodes) pending.push([child, depth + 1]);
  }
  return true;
}
function boundedExpression(expression) {
  if (typeof expression !== 'string' || !expression.trim() || expression.length > 2048 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(expression)) return false;
  const tokens = expression.match(/\\[a-zA-Z]+|\\[^]|[^\s]/g) || [];
  if (tokens.length > 512) return false;
  let depth = 0, cells = 0;
  for (const token of tokens) {
    if (token === '{' && ++depth > 32) return false;
    if (token === '}' && --depth < 0) return false;
    if ((token === '&' || token === '\\\\') && ++cells > 64) return false;
  }
  return depth === 0;
}
export function renderMath(expression, display, document) {
  if (!boundedExpression(expression)) return null;
  try {
    const detached = document.createElement('span');
    render(expression, detached, {
      output: 'mathml', displayMode: !!display, trust: false, strict: 'error',
      throwOnError: true, maxExpand: 200, maxSize: 20, globalGroup: false,
      macros: {}, // Never share even a single macro definition across formulas.
    });
    const root = detached.childNodes[0];
    return root && detached.childNodes.length === 1 && validMathDOM(root) ? root : null;
  } catch { return null; } // Never expose a KaTeX error containing note source.
}
