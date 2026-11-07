import test from 'node:test';
import assert from 'node:assert/strict';
import { document, descendants } from './support/math-dom.mjs';
globalThis.document = document;
const math = await import('../../static/src/math-renderer.js').catch(() => ({}));
const render = (expression, display = false) => {
  assert.equal(typeof math.renderMath, 'function', 'bounded local DOM renderer exists');
  return math.renderMath(expression, display, document);
};
test('supported DOM rendering produces native semantic MathML for fractions, roots, accents and matrices', () => {
  for (const expression of [String.raw`x_1^2 + \frac{1}{\sqrt{x}}`, String.raw`\begin{bmatrix}a&b\\c&d\end{bmatrix}`, String.raw`\begin{aligned}x&=1\\y&=2\end{aligned}`, String.raw`\sum_{n=1}^{10}\hat{x}`, String.raw`\left(\frac ab\right)`]) {
    const output = render(expression, true);
    assert.ok(output, expression);
    const nodes = descendants(output);
    assert.ok(nodes.some(node => node.localName === 'math' && node.getAttribute('display') === 'block'));
    assert.ok(nodes.some(node => node.localName === 'annotation' && node.textContent === expression));
    assert.ok(!nodes.some(node => ['style', 'script', 'svg', 'img', 'a', 'mglyph'].includes(node.localName)));
    assert.ok(nodes.every(node => node.attributes.every(attr => !['style', 'href', 'src'].includes(attr.name))));
  }
});
test('graphics, URLs, HTML extensions and macro aliases cannot create resource or active DOM', () => {
  for (const expression of [String.raw`\includegraphics{https://example.invalid/x}`, String.raw`\href{/private}{x}`, String.raw`\url{https://example.invalid}`, String.raw`\htmlStyle{background:url(/private)}{x}`, String.raw`\htmlClass{evil}{x}`, String.raw`\def\evil{\includegraphics}\evil{/private}`]) {
    document.attributeWrites = [];
    const output = render(expression);
    assert.ok(document.attributeWrites.every(({ name }) => !/^(?:href|src|style|on)/.test(name)), 'no resource/style attempt even while building detached DOM');
    if (output) for (const node of descendants(output)) {
      assert.ok(!['a', 'img', 'mglyph', 'style', 'script', 'svg'].includes(node.localName));
      assert.ok(node.attributes.every(attr => !/^(?:href|src|style|on)/.test(attr.name)));
    }
  }
});
test('recursive expansion, malformed TeX, deep/long inputs and unsupported styled output fail closed', () => {
  for (const expression of [String.raw`\def\a{\a\a}\a`, String.raw`\frac{`, '{'.repeat(40) + 'x' + '}'.repeat(40), 'x+'.repeat(2000), String.raw`\pmb{x}`, String.raw`\fcolorbox{red}{blue}{x}`]) assert.equal(render(expression), null, expression.slice(0, 50));
});
test('macro definitions are local to each expression and finite geometry is capped', () => {
  assert.ok(render(String.raw`\gdef\private{a}\private`));
  assert.equal(render(String.raw`\private`), null);
  const output = render(String.raw`\rule{999em}{999em}`);
  assert.ok(output);
  assert.ok(descendants(output).some(node => node.getAttribute('width') === '20em' && node.getAttribute('height') === '20em'));
});
test('positive DOM validator rejects unknown namespaces, resource attributes and oversized trees', () => {
  assert.equal(typeof math.validMathDOM, 'function');
  const root = document.createElementNS('http://www.w3.org/1998/Math/MathML', 'math');
  assert.equal(math.validMathDOM(root), true);
  root.setAttribute('href', '/private');
  assert.equal(math.validMathDOM(root), false);
  const foreign = document.createElementNS('http://www.w3.org/2000/svg', 'math');
  assert.equal(math.validMathDOM(foreign), false);
  const huge = document.createElementNS('http://www.w3.org/1998/Math/MathML', 'math');
  for (let n = 0; n < 4096; n++) huge.appendChild(document.createTextNode('x'));
  assert.equal(math.validMathDOM(huge), false);
});

test('unexpected attribute names fail closed rather than inheriting policy object properties', () => {
  assert.equal(typeof math.validMathDOM, 'function');
  for (const name of ['constructor', 'toString', '__proto__', 'onload', 'style']) {
    const root = document.createElementNS('http://www.w3.org/1998/Math/MathML', 'math');
    root.setAttribute(name, 'x');
    assert.equal(math.validMathDOM(root), false, name);
  }
});
