import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';

const require = createRequire(import.meta.url);
const mathExtensionPath = require.resolve('micromark-extension-math');
const mathKatexPath = require.resolve('katex', {paths: [dirname(mathExtensionPath)]});
const {renderToString} = require(mathKatexPath);

test('markdown math KaTeX does not inherit trust from Object.prototype', () => {
  const previous = Object.getOwnPropertyDescriptor(Object.prototype, 'trust');
  Object.defineProperty(Object.prototype, 'trust', {value: true, writable: true, configurable: true});
  try {
    const html = renderToString(String.raw`\href{https://synthetic.invalid/}{synthetic link}`);
    assert.doesNotMatch(html, /<a\b[^>]*href=["']https:\/\/synthetic\.invalid\//);
  } finally {
    if (previous) Object.defineProperty(Object.prototype, 'trust', previous);
    else delete Object.prototype.trust;
  }
});
