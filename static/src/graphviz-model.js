// Deliberately limited DOT, reconstructed before any Graphviz call.
export const GRAPHVIZ_LIMITS = Object.freeze({source:8192, bytes:16384, nodes:32, edges:48, label:80, output:250000, elements:4000, timeout:2000});
const fail = () => { throw new Error('unsupported_graphviz'); };
const plain = /^[\p{L}\p{N} .,!?_+\-]+$/u;
const reserved = new Set(['graph','digraph','node','edge','subgraph','strict']);
export function parseDot(source) {
  if (typeof source !== 'string' || source.length > GRAPHVIZ_LIMITS.source || new TextEncoder().encode(source).length > GRAPHVIZ_LIMITS.bytes) fail();
  const tokens = [];
  for (let offset=0; offset<source.length;) {
    const rest = source.slice(offset), space = /^[ \t\r\n]+/.exec(rest);
    if (space) { offset+=space[0].length; continue; }
    const match = /^(?:[A-Za-z_][A-Za-z0-9_]{0,31}|->|--|[{}\[\]=;,]|"[^"\r\n]*")/.exec(rest);
    if (!match) fail();
    const value=match[0];
    tokens.push({value, from:offset, to:offset+value.length}); offset+=value.length;
  }
  let at=0;
  const peek = () => tokens[at]?.value;
  const take = value => { if (peek()!==value) fail(); at++; };
  const id = () => {
    const value=peek();
    if (!value || !/^[A-Za-z_][A-Za-z0-9_]{0,31}$/.test(value) || reserved.has(value.toLowerCase())) fail();
    at++; return value;
  };
  const kind=peek(); if (kind!=='graph' && kind!=='digraph') fail(); at++;
  if (peek()!=='{') id();
  take('{');
  const directed=kind==='digraph', nodes=[], edges=[], byId=new Map(), declarations=new Map();
  let rankdir='TB', declaredDirection=false;
  function node(name) {
    if (!byId.has(name)) {
      if (nodes.length>=GRAPHVIZ_LIMITS.nodes) fail();
      const item={id:`n${nodes.length}`,label:name,shape:'ellipse'};
      nodes.push(item); byId.set(name,item);
    }
    return byId.get(name);
  }
  while (peek()!=='}') {
    if (!peek()) fail();
    const name=id();
    if (name==='rankdir' && peek()==='=') {
      if (declaredDirection) fail();
      take('='); rankdir=id(); if (!['TB','LR'].includes(rankdir)) fail(); declaredDirection=true;
    } else {
      let left=node(name);
      if (peek()==='[') {
        take('['); const attrs={};
        do {
          const key=id(); if (!['label','shape'].includes(key) || Object.hasOwn(attrs,key)) fail();
          take('='); const value=peek();
          if (key==='label') {
            if (!value?.startsWith('"')) fail();
            const text=value.slice(1,-1);
            if (!text || text.length>GRAPHVIZ_LIMITS.label || !plain.test(text)) fail();
            attrs.label=text; at++;
          } else {
            attrs.shape=id(); if (!['box','ellipse','circle','diamond'].includes(attrs.shape)) fail();
          }
          if (peek()!==',') break;
          take(',');
        } while (true);
        take(']');
        const previous=declarations.get(name)??{};
        for (const [key,value] of Object.entries(attrs)) {
          if (Object.hasOwn(previous,key) && previous[key]!==value) fail();
          left[key]=value; previous[key]=value;
        }
        declarations.set(name,previous);
      } else {
        while (peek()==='->' || peek()==='--') {
          take(directed?'->':'--');
          const right=node(id());
          if (edges.length>=GRAPHVIZ_LIMITS.edges) fail();
          edges.push({from:left.id,to:right.id}); left=right;
        }
      }
    }
    if (peek()===';') take(';');
    else if (peek()!=='}' && tokens[at-1]?.to===tokens[at]?.from) fail();
  }
  take('}'); if (at!==tokens.length || !nodes.length) fail();
  const canonical=[`${kind} {`,`rankdir=${rankdir};`,...nodes.map(n=>`${n.id} [label="${n.label}",shape=${n.shape}];`),...edges.map(e=>`${e.from} ${directed?'->':'--'} ${e.to};`),'}'].join('\n');
  return Object.freeze({directed,nodes:Object.freeze(nodes.map(Object.freeze)),edges:Object.freeze(edges.map(Object.freeze)),canonical});
}
