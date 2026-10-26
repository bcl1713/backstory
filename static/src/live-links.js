import { Decoration, ViewPlugin, WidgetType } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';

export const wikiLinks = {
  defineNodes: ['WikiLink'],
  parseInline: [{
    name: 'WikiLink', before: 'Link',
    parse(cx, next, pos) {
      if (next !== 91 || cx.char(pos + 1) !== 91 || cx.hasOpenLink) return -1;
      const remaining = cx.slice(pos + 2, cx.end);
      const end = remaining.indexOf(']]');
      if (end < 0 || remaining.slice(0, end).includes('\n')) return -1;
      return cx.addElement(cx.elt('WikiLink', pos, pos + end + 4));
    },
  }],
};

const rawBlocks = new Set(['FrontMatter', 'Table', 'FencedCode', 'CodeBlock', 'HTMLBlock', 'InlineCode', 'Image', 'HTMLTag']);
const limit = 200;
function markdownText(value) {
  return value.replace(/\\([!"#$%&'()*+,\-./:;<=>?@[\]\\^_`{|}~])/g, '$1')
    .replace(/&(?:#[xX][\da-fA-F]+|#\d+|[\da-zA-Z]+);/g, entity => {
      const decoder = document.createElement('textarea');
      decoder.innerHTML = entity;
      return decoder.value;
    });
}
function linksIn(view) {
  const links = [];
  syntaxTree(view.state).iterate({ enter(node) {
    if (rawBlocks.has(node.name)) return false;
    if (!['WikiLink', 'Link'].includes(node.name)) return;
    const { state } = view;
    if (state.doc.lineAt(node.from).number !== state.doc.lineAt(node.to).number) return false;
    let target, label, kind;
    const raw = state.doc.sliceString(node.from, node.to);
    if (node.name === 'WikiLink') {
      target = raw.slice(2, -2);
      const pipe = target.indexOf('|');
      label = pipe < 0 ? target : target.slice(pipe + 1);
      kind = 'wiki';
    } else {
      const url = node.node.getChild('URL');
      if (!url) return false;
      target = markdownText(state.doc.sliceString(url.from, url.to).replace(/^<(.*)>$/, '$1'));
      const close = node.node.getChildren('LinkMark').find(mark => state.doc.sliceString(mark.from, mark.to) === ']');
      if (!close) return false;
      label = markdownText(state.doc.sliceString(node.from + 1, close.from));
      kind = 'markdown';
    }
    links.push({ from: node.from, to: node.to, target, label, kind });
    return false;
  } });
  return links;
}
class LinkWidget extends WidgetType {
  constructor(label, result) { super(); this.label = label; this.result = result; }
  eq(other) { return this.label === other.label && this.result.state === other.result.state && this.result.href === other.result.href && this.result.action_href === other.result.action_href && this.result.create_path === other.result.create_path; }
  toDOM() {
    const { state } = this.result;
    const href = this.result.action_href || this.result.href;
    const dom = document.createElement(href ? 'a' : 'span');
    dom.className = `lp-rendered-link lp-link lp-link-${state}`;
    dom.textContent = this.label || '(empty link label)';
    dom.contentEditable = 'false';
    if (href) {
      dom.setAttribute('href', href);
      // Preserve the inactive-line selection until the click's native link
      // activation. Otherwise CodeMirror would reveal source before activation.
      dom.addEventListener('mousedown', event => event.preventDefault());
      dom.title = 'Follow link. Use arrow keys or Raw source to edit this line.';
      if (this.result.action_href) {
        const description = this.result.create_path ? `Create note: ${this.result.create_path}` : 'Choose note destination';
        dom.title = description;
        dom.setAttribute('aria-label', `${this.label || 'Empty link label'} — ${description}`);
      }
    } else {
      dom.title = state === 'pending' ? 'Resolving link…' : `Link ${state}`;
      dom.setAttribute('aria-label', `${this.label || 'Empty link label'} — link ${state}`);
    }
    return dom;
  }
  ignoreEvent() { return true; }
}

export function createLiveLinksExtension({ getPath = () => '' } = {}) {
  return ViewPlugin.fromClass(class {
    constructor(view) {
      this.view = view;
      this.cache = new Map();
      this.queue = [];
      this.active = 0;
      this.destroyed = false;
      this.controller = new AbortController();
      this.refresh = () => {
        if (this.destroyed || document.hidden || this.refreshQueued) return;
        this.refreshQueued = true;
        queueMicrotask(() => {
          this.refreshQueued = false;
          if (this.destroyed) return;
          this.controller.abort();
          this.controller = new AbortController();
          this.cache.clear();
          this.queue = [];
          this.decorations = this.build();
          this.view.dispatch({});
          this.pump();
        });
      };
      window.addEventListener('focus', this.refresh);
      window.addEventListener('pageshow', this.refresh);
      document.addEventListener('visibilitychange', this.refresh);
      document.addEventListener('backstory:links-refresh', this.refresh);
      this.decorations = this.build();
      queueMicrotask(() => this.pump());
    }
    update(update) {
      if (update.docChanged || update.selectionSet || update.viewportChanged || syntaxTree(update.startState) !== syntaxTree(update.state)) {
        this.decorations = this.build();
        queueMicrotask(() => this.pump());
      }
    }
    build() {
      const { state } = this.view;
      const path = getPath();
      const links = linksIn(this.view);
      const keys = new Set();
      for (const link of links) {
        keys.add(JSON.stringify([path, link.kind, link.target]));
        if (keys.size === limit) break;
      }
      for (const key of this.cache.keys()) if (!keys.has(key)) this.cache.delete(key);
      this.queue = this.queue.filter(entry => this.cache.get(entry.key) === entry);
      const ranges = [];
      for (const link of links) {
        const key = JSON.stringify([path, link.kind, link.target]);
        let entry = this.cache.get(key);
        if (!entry && keys.has(key) && path) {
          entry = { key, path, ...link, result: { state: 'pending', href: null } };
          this.cache.set(key, entry);
          this.queue.push(entry);
        }
        const line = state.doc.lineAt(link.from);
        const active = state.selection.ranges.some(range => range.from <= line.to && range.to >= line.from);
        if (active) continue;
        const result = entry?.result || { state: 'unavailable', href: null };
        ranges.push(Decoration.replace({ widget: new LinkWidget(link.label, result) }).range(link.from, link.to));
      }
      return Decoration.set(ranges, true);
    }
    pump() {
      if (this.destroyed) return;
      while (this.active < 4 && this.queue.length) {
        const entry = this.queue.shift();
        if (this.cache.get(entry.key) !== entry) continue;
        this.active++;
        const query = new URLSearchParams({ source: entry.path, target: entry.target, kind: entry.kind });
        fetch('/resolve/?' + query, { credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal: this.controller.signal })
          .then(response => { if (!response.ok) throw new Error(); return response.json(); })
          .then(result => {
            if (this.cache.get(entry.key) !== entry) return;
            entry.result = ['resolved', 'external', 'missing', 'ambiguous', 'unavailable'].includes(result.state)
              ? result : { state: 'unavailable', href: null };
          })
          .catch(() => { if (this.cache.get(entry.key) === entry) entry.result = { state: 'unavailable', href: null }; })
          .finally(() => {
            this.active--;
            if (this.destroyed) return;
            this.decorations = this.build();
            // Redraw through a transaction outside the view update lifecycle.
            this.view.dispatch({});
            this.pump();
          });
      }
    }
    destroy() {
      this.destroyed = true;
      this.controller.abort();
      window.removeEventListener('focus', this.refresh);
      window.removeEventListener('pageshow', this.refresh);
      document.removeEventListener('visibilitychange', this.refresh);
      document.removeEventListener('backstory:links-refresh', this.refresh);
    }
  }, { decorations: plugin => plugin.decorations });
}
