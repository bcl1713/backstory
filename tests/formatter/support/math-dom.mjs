// Minimal standards-shaped DOM for exercising the real KaTeX DOM renderer in
// Node. Browser tests separately verify native layout, CSP and accessibility.
export class TestNode {
  constructor(type, document, name = '', namespaceURI = null, value = '') {
    Object.assign(this, { nodeType: type, ownerDocument: document, localName: name, namespaceURI, nodeValue: value, childNodes: [], style: {} });
    this.attrs = new Map();
  }
  appendChild(node) { this.childNodes.push(node); return node; }
  get attributes() { return [...this.attrs].map(([name, value]) => ({ name, value, namespaceURI: null })); }
  setAttribute(name, value) { this.ownerDocument.attributeWrites.push({ name, value: String(value) }); this.attrs.set(name, String(value)); }
  getAttribute(name) { return this.attrs.get(name) ?? null; }
  set className(value) { this.setAttribute('class', value); }
  get className() { return this.getAttribute('class') || ''; }
  set textContent(value) { this.childNodes = value ? [this.ownerDocument.createTextNode(value)] : []; }
  get textContent() { return this.nodeType === 3 ? this.nodeValue : this.childNodes.map(node => node.textContent).join(''); }
}
export const document = {
  compatMode: 'CSS1Compat',
  attributeWrites: [],
  createElement(name) { return new TestNode(1, this, name, 'http://www.w3.org/1999/xhtml'); },
  createElementNS(namespace, name) { return new TestNode(1, this, name, namespace); },
  createTextNode(text) { return new TestNode(3, this, '', null, text); },
};
export function descendants(node) { return [node, ...node.childNodes.flatMap(descendants)]; }
