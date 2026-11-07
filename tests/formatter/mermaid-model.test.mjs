import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
const path = new URL('../../static/src/mermaid-model.js', import.meta.url);
const model = existsSync(path) ? await import(path) : {};
// Removing positive validation must fail these assertions before a renderer is called.
test('bounded positive flowchart grammar canonicalizes useful shapes and arrows', () => {
  assert.equal(typeof model.parseFlowchart, 'function', 'positive parser not implemented');
  const result = model.parseFlowchart('flowchart LR\nA[Start] --> B{Ready?}\nB -->|Yes| C((Done))\nB -.-> D(Retry)');
  assert.equal(result.nodes.length, 4);
  assert.equal(result.edges.length, 3);
  assert.match(result.canonical, /^flowchart LR\nn0\[/);
  assert.ok(!result.canonical.includes('Start] -->'));
});
test('unsupported grammar is rejected before Mermaid including encoded and multiline resources', () => {
  assert.equal(typeof model.parseFlowchart, 'function', 'positive parser not implemented');
  for (const source of ['sequenceDiagram\nA->>B:Hi', '%%{init: {}}%%\nflowchart TD\nA-->B', '---\nconfig: x\n---\nflowchart TD', 'flowchart TD\nA@{ img: "https://evil.invalid/x" }', 'flowchart TD\nclick A "https://evil.invalid"', 'flowchart TD\nA[<img src=/secret>]', 'flowchart TD\nA[&lt;img&gt;]', 'flowchart TD\nA["`markdown`"]', 'flowchart TD\nA[$$x$$]', 'flowchart TD\nstyle A fill:red', 'flowchart TD\nsubgraph x\nA-->B\nend', 'flowchart TD\nA[https://evil.invalid]', 'flowchart TD\nA[one\ntwo]']) assert.throws(() => model.parseFlowchart(source), {message: 'unsupported_diagram'}, source);
});
test('bounds constrain text nodes edges and label lengths without recursion', () => {
  assert.equal(typeof model.parseFlowchart, 'function', 'positive parser not implemented');
  for (const source of ['flowchart TD\nA['+'x'.repeat(81)+']', 'flowchart TD\n' + Array.from({length:33},(_,i)=>`A${i}[Node]`).join('\n'), 'flowchart TD\n'+'A --> B\n'.repeat(49), 'x'.repeat(8193)]) assert.throws(() => model.parseFlowchart(source), {message: 'unsupported_diagram'});
});
