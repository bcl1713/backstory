import { mountMath } from './math-loading.js';
const hydrated = new WeakSet();
export function hydrate(root = document) {
  let count = 0;
  for (const element of root.querySelectorAll('[data-math-source]')) {
    if (++count > 100) break;
    if (hydrated.has(element)) continue;
    hydrated.add(element);
    const source = element.getAttribute('data-math-source');
    const expression = element.getAttribute('data-math-expression');
    const display = element.getAttribute('data-math-display') === 'true';
    element.classList.add('lp-math');
    if (display) element.classList.add('lp-math-display');
    mountMath(element, { source, expression, display }, () => element.isConnected && element.getAttribute('data-math-source') === source);
  }
}
// JSON draft previews contain the same inert sanitized fragment. Consumers
// mounting those fragments can explicitly use this same bounded enhancer.
window.backstoryMathPreview = Object.freeze({ hydrate });
hydrate();
