import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
const path = new URL('../../static/src/graphviz-model.js', import.meta.url);
const api = existsSync(path) ? await import(path) : {};
function parse(source) {
  assert.equal(typeof api.parseDot, 'function', 'bounded DOT parser not implemented');
  return api.parseDot(source);
}
test('directed DOT remaps IDs and applies declarations following edges', () => {
  const result = parse('digraph Project { rankdir=LR; start -> build -> done; build [label="Build app", shape=box]; done [shape=diamond]; }');
  assert.equal(result.directed, true);
  assert.deepEqual(result.nodes.map(n => [n.id,n.label,n.shape]), [['n0','start','ellipse'],['n1','Build app','box'],['n2','done','diamond']]);
  assert.equal(result.edges.length,2);
  assert.match(result.canonical, /^digraph \{\nrankdir=LR;/);
  assert.match(result.canonical, /n0 -> n1;/);
  assert.ok(!result.canonical.includes('Project'));
  assert.ok(Object.isFrozen(result.nodes[0]));
});
test('undirected DOT supports whitespace separators and plain Unicode labels', () => {
  const result = parse('graph { a [label="Café 1", shape=circle] b a -- b }');
  assert.equal(result.directed,false);
  assert.match(result.canonical,/n0 -- n1;/);
  assert.equal(result.nodes[0].label,'Café 1');
});
test('DOT rejects resources, HTML, escape substitution and non-subset syntax', () => {
  for (const body of ['a [image="https://evil.invalid/a"]','a [URL="/secret"]','a [href="x"]','a [fontname="remote"]','a [label=<b>x</b>]','a [label="https://evil.invalid"]','a [label="\\N"]','a [label="a\\nb"]','a [label="&lt;x&gt;"]','a [label="<script>"]','subgraph x { a }','node [shape=box]','a:port -> b','a -> {b c}','a /*comment*/','a //comment\nb','a [color=red]','a [shape=record]','a [label="x",label="y"]']) {
    assert.throws(() => parse(`digraph { ${body} }`),{message:'unsupported_graphviz'},body);
  }
  for (const source of ['digraph { a -- b }','graph { a -> b }','digraph {}','digraph { a } trailing','strict digraph {a}','digraph { a [label="one\ntwo"] }']) assert.throws(() => parse(source),{message:'unsupported_graphviz'},source);
});
test('DOT source, node, edge and label budgets reject before engine execution', () => {
  for (const source of [' '.repeat(8193), `digraph { ${Array.from({length:33},(_,i)=>`a${i}`).join(';')} }`, `digraph { ${'a -> b;'.repeat(49)} }`, `digraph { a[label="${'x'.repeat(81)}"] }`, `digraph { a[label="x"] ${' '.repeat(8100)} } extra`]) {
    assert.throws(() => parse(source), {message:'unsupported_graphviz'});
  }
  assert.equal(parse(`digraph { ${Array.from({length:32},(_,i)=>`a${i}`).join(';')} }`).nodes.length,32);
  assert.equal(parse(`digraph { ${'a -> b;'.repeat(48)} }`).edges.length,48);
});
test('DOT refuses contradictory declarations and malformed token boundaries', () => {
  for (const body of ['a[label="x"];a[label="y"]','rankdir=LR;rankdir=TB;a','a [shape=box] [label="x"]','a->','a[label="x"','a[label="x"shape=box]','a[label=x]','a[shape=box,]']) assert.throws(() => parse(`digraph {${body}}`),{message:'unsupported_graphviz'},body);
});
