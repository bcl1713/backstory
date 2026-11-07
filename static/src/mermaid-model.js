// This is an intentionally small language, not Mermaid's general-purpose parser.
// Only the reconstructed canonical string reaches the trusted renderer.
export const DIAGRAM_LIMITS = Object.freeze({ source: 8192, nodes: 32, edges: 48, label: 80, output: 250000, elements: 4000, height: 1200, width: 1600, active: 2 });
const fail = () => { throw new Error('unsupported_diagram'); };
const plain = /^[\p{L}\p{N} .,!?_+\-]+$/u;
function label(value) {
  if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
  if (!value || value.length > DIAGRAM_LIMITS.label || !plain.test(value)) fail();
  return value;
}
export function parseFlowchart(source) {
  if (typeof source !== 'string' || source.length > DIAGRAM_LIMITS.source) fail();
  const lines = source.replace(/\r\n/g, '\n').trim().split('\n');
  const header = /^(?:flowchart|graph) (TD|TB|BT|LR|RL)$/.exec(lines.shift()?.trim());
  if (!header) fail();
  const nodes = [], edges = [], byId = new Map();
  function node(input) {
    const id = /^([A-Za-z][A-Za-z0-9_]{0,31})/.exec(input);
    if (!id) fail();
    let rest = input.slice(id[0].length), text = null, shape = null;
    for (const [open, close] of [['((', '))'], ['[[', ']]'], ['[', ']'], ['{', '}'], ['(', ')']]) {
      if (!rest.startsWith(open)) continue;
      const end = rest.indexOf(close, open.length);
      if (end < 0) fail();
      text = label(rest.slice(open.length, end)); shape = [open, close]; rest = rest.slice(end + close.length); break;
    }
    let item = byId.get(id[0]);
    if (!item) {
      if (nodes.length >= DIAGRAM_LIMITS.nodes) fail();
      item = { id: `n${nodes.length}`, label: text ?? label(id[0]), shape: shape ?? ['[', ']'] };
      nodes.push(item); byId.set(id[0], item);
    } else if (text !== null && (item.label !== text || item.shape.join('') !== shape.join(''))) fail();
    return { item, rest: rest.trimStart() };
  }
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    let left = node(line), rest = left.rest;
    while (rest) {
      const arrow = /^(-->|---|-\.->|==>)\s*/.exec(rest);
      if (!arrow || edges.length >= DIAGRAM_LIMITS.edges) fail();
      rest = rest.slice(arrow[0].length);
      let text = '';
      if (rest.startsWith('|')) {
        const end = rest.indexOf('|', 1);
        if (end < 0) fail();
        text = label(rest.slice(1, end)); rest = rest.slice(end + 1).trimStart();
      }
      const right = node(rest);
      edges.push({ from: left.item.id, to: right.item.id, arrow: arrow[1], label: text });
      left = right; rest = right.rest;
    }
  }
  if (!nodes.length) fail();
  const canonical = [`flowchart ${header[1]}`, ...nodes.map(n => `${n.id}${n.shape[0]}"${n.label}"${n.shape[1]}`), ...edges.map(e => `${e.from} ${e.arrow}${e.label ? `|${e.label}|` : ''} ${e.to}`)].join('\n');
  return Object.freeze({ nodes: Object.freeze(nodes.map(Object.freeze)), edges: Object.freeze(edges.map(Object.freeze)), canonical });
}
