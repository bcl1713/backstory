import { decodeHTMLStrict } from 'entities';
import { StateEffect, StateField } from '@codemirror/state';
import { Decoration, ViewPlugin, WidgetType } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { getCM } from '@replit/codemirror-vim';
import { tableMotionCount, tableMotionPath } from './table-preview.js';

const imageLimit = 200;
const nodeLimit = 100000;
const rawBlocks = new Set(['FrontMatter', 'Table', 'FencedCode', 'CodeBlock', 'HTMLBlock', 'InlineCode', 'HTMLTag', 'Link']);
const markdownText = value => decodeHTMLStrict(value.replace(/\\([!"#$%&'()*+,\-./:;<=>?@[\]\\^_`{|}~])/g, '$1'));
const referenceKey = value => value.trim().replace(/\s+/g, ' ').toUpperCase();
const destination = (node, doc) => markdownText(doc.sliceString(node.from, node.to).replace(/^<(.*)>$/s, '$1'));

// Use the same Markdown tree as editing, not a regex over note source. Tables
// own their entire decoration; linked/multiline images remain editable source.
export function imageModels(state) {
  const references = new Map();
  const candidates = [];
  const enter = node => {
    if (rawBlocks.has(node.name)) return false;
    if (node.name === 'LinkReference') {
      const label = node.node.getChild('LinkLabel');
      const url = node.node.getChild('URL');
      if (label && url && references.size < imageLimit) {
        const key = referenceKey(state.doc.sliceString(label.from + 1, label.to - 1));
        if (!references.has(key)) references.set(key, destination(url, state.doc));
      }
      return false;
    }
    if (node.name !== 'Image') return;
    if (candidates.length >= imageLimit || state.doc.lineAt(node.from).number !== state.doc.lineAt(node.to).number) return false;
    const close = node.node.getChildren('LinkMark').find(mark => state.doc.sliceString(mark.from, mark.to) === ']');
    if (!close) return false;
    const label = state.doc.sliceString(node.from + 2, close.from);
    const url = node.node.getChild('URL');
    const ref = node.node.getChild('LinkLabel');
    candidates.push({ from: node.from, to: node.to, label: markdownText(label), target: url ? destination(url, state.doc) : null,
      reference: referenceKey(ref && ref.to - ref.from > 2 ? state.doc.sliceString(ref.from + 1, ref.to - 1) : label) });
    return false;
  };
  const cursor = syntaxTree(state).cursor();
  for (let visited = 0; visited < nodeLimit; visited++) {
    const descend = enter(cursor) !== false;
    // iterate's false return only skips children; an explicit cursor budget
    // also stops subsequent siblings and never advances beyond the last visit.
    if (visited + 1 === nodeLimit || !cursor.next(descend)) break;
  }
  return candidates.flatMap(({ reference, ...image }) => {
    const target = image.target ?? references.get(reference);
    return target === undefined ? [] : [{ ...image, target }];
  });
}

// Targets only travel to our authenticated resolver. Never assign a Markdown
// destination directly to src, including scheme-relative/data/active URLs.
export function imageTargetState(target) {
  if (!target || target.length > 4096 || /[\\\u0000-\u001f\u007f]/.test(target)) return 'unavailable';
  if (/^[a-z][a-z\d+.-]*:/i.test(target) || target.startsWith('//')) return 'blocked';
  return 'local';
}
export function imagePresentation(result) {
  if (result?.state === 'external') return { state: 'blocked' };
  const href = result?.href;
  if (result?.state === 'resolved' && typeof href === 'string' && /^\/attachments\/[^?#\\\u0000-\u001f\u007f]+(?:#[^?\\\u0000-\u001f\u007f]*)?$/.test(href)) {
    try {
      const path = decodeURIComponent(href.split('#')[0]);
      if (/\.(?:png|jpe?g|gif|webp|avif|bmp|ico)$/i.test(path)) return { state: 'ready', href };
    } catch { /* Invalid percent escapes never become a browser URL. */ }
  }
  return { state: 'unavailable' };
}

export const revealImageMotion = StateEffect.define();
export const imageMotionRange = StateField.define({
  create: () => null,
  update(value, transaction) {
    for (const effect of transaction.effects) if (effect.is(revealImageMotion)) return effect.value;
    return value && transaction.docChanged
      ? { from: transaction.changes.mapPos(value.from, -1), to: transaction.changes.mapPos(value.to, 1) } : value;
  },
});
export function imageIsActive(state, image) {
  const line = state.doc.lineAt(image.from);
  const motion = state.field(imageMotionRange, false);
  return !!(motion && motion.from <= image.to && motion.to >= image.from)
    || state.selection.ranges.some(range => range.from <= line.to && range.to >= line.from);
}

class ImageWidget extends WidgetType {
  constructor(image, result) { super(); this.image = image; this.result = result; }
  eq(other) { return this.image.from === other.image.from && this.image.label === other.image.label && this.result.state === other.result.state && this.result.href === other.result.href; }
  toDOM(view) {
    const document = view.dom.ownerDocument;
    const wrapper = document.createElement('span');
    wrapper.className = 'lp-image';
    wrapper.contentEditable = 'false';
    wrapper.addEventListener('mousedown', event => { if (event.button === 0) event.preventDefault(); });
    const label = this.image.label || 'Unlabeled image';
    const message = document.createElement('span');
    message.className = 'lp-image-status';
    const measure = () => { if (!wrapper.imageDisposed) view.requestMeasure(); };
    const unavailable = () => { message.textContent = `Image unavailable: ${label}`; measure(); };
    if (this.result.state === 'ready') {
      const enlarge = document.createElement('button');
      enlarge.type = 'button';
      enlarge.className = 'lp-image-enlarge';
      enlarge.setAttribute('aria-label', `Enlarge image: ${label}`);
      enlarge.title = 'Enlarge image';
      const image = document.createElement('img');
      image.alt = this.image.label;
      image.loading = 'lazy';
      image.decoding = 'async';
      image.referrerPolicy = 'same-origin';
      image.addEventListener('load', measure);
      image.addEventListener('error', () => { enlarge.hidden = true; unavailable(); });
      image.src = this.result.href;
      enlarge.appendChild(image);
      enlarge.addEventListener('click', () => {
        if (wrapper.closeImage) return;
        const dialog = document.createElement('dialog');
        dialog.className = 'lp-image-dialog';
        dialog.setAttribute('aria-label', `Image: ${label}`);
        const close = document.createElement('button');
        close.type = 'button';
        close.textContent = 'Close image';
        const full = document.createElement('img');
        full.alt = this.image.label;
        full.src = this.result.href;
        full.addEventListener('error', () => { dialog.close(); enlarge.hidden = true; unavailable(); });
        dialog.append(close, full);
        document.body.appendChild(dialog);
        // Window capture precedes the shell's Menu/proposal Escape handlers.
        const ownKeys = event => {
          if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); dialog.close(); }
          else if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.code === 'Period') {
            event.preventDefault(); event.stopImmediatePropagation();
          }
        };
        let closed = false, restoreFocus = true;
        const cleanup = () => {
          if (closed) return;
          closed = true;
          window.removeEventListener('keydown', ownKeys, true);
          wrapper.closeImage = null;
          dialog.remove();
          if (restoreFocus && enlarge.isConnected) enlarge.focus({ preventScroll: true });
        };
        dialog.addEventListener('close', cleanup, { once: true });
        wrapper.closeImage = (restore = true) => { restoreFocus = restore; dialog.close(); cleanup(); };
        close.addEventListener('click', () => dialog.close());
        dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
        dialog.showModal();
        window.addEventListener('keydown', ownKeys, true);
        close.focus();
      });
      wrapper.appendChild(enlarge);
    } else message.textContent = this.result.state === 'blocked' ? `External image blocked: ${label}`
      : this.result.state === 'pending' ? `Loading image: ${label}` : `Image unavailable: ${label}`;
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'lp-image-edit';
    edit.textContent = 'Edit image source';
    edit.setAttribute('aria-label', `Edit image source: ${label}`);
    edit.addEventListener('click', () => { view.dispatch({ selection: { anchor: this.image.from }, scrollIntoView: true }); view.focus(); });
    wrapper.append(message, edit);
    return wrapper;
  }
  destroy(dom) { dom.imageDisposed = true; dom.closeImage?.(false); }
  ignoreEvent() { return true; }
}

export function createImagePreviewExtension({ getPath = () => '' } = {}) {
  return [imageMotionRange, ViewPlugin.fromClass(class {
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
      if (update.docChanged || update.selectionSet || update.viewportChanged || syntaxTree(update.startState) !== syntaxTree(update.state)
          || update.transactions.some(transaction => transaction.effects.some(effect => effect.is(revealImageMotion)))) {
        this.decorations = this.build();
        queueMicrotask(() => this.pump());
      }
    }
    build() {
      const { state } = this.view;
      const path = getPath();
      this.images = imageModels(state);
      const keys = new Set(this.images.map(image => JSON.stringify([path, image.target])));
      for (const key of this.cache.keys()) if (!keys.has(key)) this.cache.delete(key);
      this.queue = this.queue.filter(entry => this.cache.get(entry.key) === entry);
      const ranges = [];
      for (const image of this.images) {
        const key = JSON.stringify([path, image.target]);
        const targetState = imageTargetState(image.target);
        let entry = this.cache.get(key);
        if (!entry && path && targetState === 'local') {
          entry = { key, path, target: image.target, result: { state: 'pending' } };
          this.cache.set(key, entry);
          this.queue.push(entry);
        }
        if (imageIsActive(state, image)) continue;
        const result = targetState === 'local' ? entry?.result || { state: 'unavailable' } : { state: targetState };
        ranges.push(Decoration.replace({ widget: new ImageWidget(image, result) }).range(image.from, image.to));
      }
      return Decoration.set(ranges, true);
    }
    pump() {
      if (this.destroyed) return;
      while (this.active < 4 && this.queue.length) {
        const entry = this.queue.shift();
        if (this.cache.get(entry.key) !== entry) continue;
        this.active++;
        const query = new URLSearchParams({ source: entry.path, target: entry.target, kind: 'markdown' });
        fetch('/resolve/?' + query, { credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal: this.controller.signal })
          .then(response => { if (!response.ok) throw new Error(); return response.json(); })
          .then(result => { if (this.cache.get(entry.key) === entry) entry.result = imagePresentation(result); })
          .catch(() => { if (this.cache.get(entry.key) === entry) entry.result = { state: 'unavailable' }; })
          .finally(() => {
            this.active--;
            if (this.destroyed) return;
            this.decorations = this.build();
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
  }, { decorations: plugin => plugin.decorations, eventObservers: {
    keydown(event, view) {
      if (event.defaultPrevented || event.isComposing || event.altKey || event.metaKey || event.ctrlKey) return;
      const vim = getCM(view)?.state.vim;
      const vimMotion = vim && !vim.insertMode;
      const direction = event.key === 'ArrowDown' || (vimMotion && event.key === 'j') ? 1
        : event.key === 'ArrowUp' || (vimMotion && event.key === 'k') ? -1 : 0;
      if (!direction) return;
      const path = tableMotionPath(view.state, direction, vimMotion ? tableMotionCount(vim.inputState) : 1);
      if (!this.images.some(image => image.from <= path.to && image.to >= path.from && !imageIsActive(view.state, image))) return;
      const generation = this.motionGeneration = (this.motionGeneration || 0) + 1;
      view.dispatch({ effects: revealImageMotion.of(path) });
      queueMicrotask(() => {
        if (!this.destroyed && this.motionGeneration === generation) view.dispatch({ effects: revealImageMotion.of(null) });
      });
    },
  } })];
}
