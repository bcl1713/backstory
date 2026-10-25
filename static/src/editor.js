import { Compartment, EditorState, Transaction } from '@codemirror/state';
import { EditorView, keymap, drawSelection } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { createLivePreviewExtension, frontMatter } from './live-preview.js';

export function mountMarkdownEditor({ parent, source, newline = '\n', onChange = () => {}, onFailure = () => {}, nonce = '' }) {
  const presentation = new Compartment();
  let originalSource = source;
  let originalDoc;
  const separator = ['\n', '\r\n', '\r'].includes(newline) ? newline : '\n';
  const getSource = () => view.state.doc.eq(originalDoc) ? originalSource : view.state.doc.toString().replaceAll('\n', separator);
  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc: source,
      extensions: [
        history(), keymap.of([...defaultKeymap, ...historyKeymap]), drawSelection(),
        markdown({ base: markdownLanguage, extensions: [frontMatter], addKeymap: false, completeHTMLTags: false, pasteURLAsLink: false }),
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({ 'aria-label': 'Markdown editor', spellcheck: 'false' }),
        EditorView.cspNonce.of(nonce),
        EditorView.exceptionSink.of(() => onFailure()),
        presentation.of(createLivePreviewExtension()),
        EditorView.updateListener.of(update => {
          if (update.docChanged) onChange(getSource());
        }),
      ],
    }),
  });
  originalDoc = view.state.doc;
  return {
    view,
    getSource,
    setSource(nextSource) {
      // An explicitly accepted replacement is one undoable source edit.
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: nextSource }, annotations: Transaction.userEvent.of('input') });
      originalSource = nextSource;
      originalDoc = view.state.doc;
    },
    setMode(mode) {
      if (!['live', 'source'].includes(mode)) throw new TypeError('Unknown editor mode');
      view.dispatch({ effects: presentation.reconfigure(mode === 'live' ? createLivePreviewExtension() : []), annotations: Transaction.addToHistory.of(false) });
    },
    focus() { view.focus(); },
    destroy() { view.destroy(); },
  };
}

function attachNoteEditor() {
  const parent = document.querySelector('[data-markdown-editor]');
  if (!parent) return;
  const fallback = document.querySelector('#source');
  const fallbackRegion = document.querySelector('[data-source-fallback]');
  const status = document.querySelector('[data-editor-status]');
  const controls = document.querySelector('[data-editor-controls]');
  const source = JSON.parse(document.querySelector('#note-source').textContent);
  fallback.value = source;
  let api;
  let fallbackActive = false;
  const changed = value => {
    fallback.value = value;
    status.textContent = value === source ? 'Unchanged' : 'Unsaved changes';
  };
  const showFallback = () => {
    if (api) fallback.value = api.getSource();
    fallbackActive = true;
    parent.hidden = true;
    fallbackRegion.hidden = false;
    fallback.focus();
  };
  try {
    api = mountMarkdownEditor({ parent, source, newline: JSON.parse(document.querySelector('#note-newline').textContent), nonce: parent.dataset.styleNonce || '', onChange: changed, onFailure: () => queueMicrotask(showFallback) });
    parent.markdownEditor = api;
    fallbackRegion.hidden = true;
    controls.hidden = false;
    controls.querySelectorAll('[data-editor-mode]').forEach(button => button.addEventListener('click', () => {
      if (fallbackActive) { fallbackActive = false; parent.hidden = false; fallbackRegion.hidden = true; }
      api.setMode(button.dataset.editorMode);
      controls.querySelectorAll('[data-editor-mode]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    }));
    controls.querySelector('[data-plain-fallback]').addEventListener('click', showFallback);
    fallback.addEventListener('input', () => {
      api.view.dispatch({ changes: { from: 0, to: api.view.state.doc.length, insert: fallback.value }, annotations: Transaction.userEvent.of('input') });
    });
  } catch {
    showFallback();
    status.textContent = 'Plain text editor available';
  }
}
attachNoteEditor();
