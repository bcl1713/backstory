import { Compartment, EditorState, Transaction } from '@codemirror/state';
import { EditorView, keymap, drawSelection } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, isolateHistory } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { mountNoteActions } from './navigation.js';
import { createLivePreviewExtension, frontMatter } from './live-preview.js';

export function mountMarkdownEditor({ parent, source, newline = '\n', onChange = () => {}, onFailure = () => {}, nonce = '' }) {
  const presentation = new Compartment();
  const exactSources = [];
  const separator = ['\n', '\r\n', '\r'].includes(newline) ? newline : '\n';
  const getSource = () => exactSources.find(record => record.doc.eq(view.state.doc))?.source ?? view.state.doc.toString().replaceAll('\n', separator);
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
  exactSources.push({ doc: view.state.doc, source });
  return {
    view,
    getSource,
    setSource(nextSource) {
      // Explicit accepted replacements are separate, undoable source edits.
      const transaction = view.state.update({ changes: { from: 0, to: view.state.doc.length, insert: nextSource }, annotations: [Transaction.userEvent.of('input'), isolateHistory.of('full')] });
      exactSources.unshift({ doc: transaction.newDoc, source: nextSource });
      if (exactSources.length > 16) exactSources.splice(15, 1);
      view.dispatch(transaction);
      if (!transaction.docChanged) onChange(getSource());
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
  const controls = document.querySelector('[data-editor-controls]');
  const source = JSON.parse(document.querySelector('#note-source').textContent);
  const newline = JSON.parse(document.querySelector('#note-newline').textContent);
  fallback.value = source;
  let api;
  let fallbackSource = source;
  let onChange = () => {};
  const changed = value => {
    fallbackSource = value;
    if (fallback.value !== value.replaceAll('\r\n', '\n').replaceAll('\r', '\n')) fallback.value = value;
    onChange(value);
  };
  const showFallback = () => {
    if (api) fallback.value = api.getSource();
    parent.hidden = true;
    fallbackRegion.hidden = false;
    fallback.focus();
  };
  try {
    api = mountMarkdownEditor({ parent, source, newline, nonce: parent.dataset.styleNonce || '', onChange: changed, onFailure: () => queueMicrotask(showFallback) });
    parent.markdownEditor = api;
    fallbackRegion.hidden = true;
    controls.hidden = false;
    controls.querySelectorAll('[data-editor-mode]').forEach(button => button.addEventListener('click', () => {
      parent.hidden = false;
      fallbackRegion.hidden = true;
      api.setMode(button.dataset.editorMode);
      controls.querySelectorAll('[data-editor-mode]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    }));
    controls.querySelector('[data-plain-fallback]').addEventListener('click', showFallback);
  } catch {
    showFallback();
    document.querySelector('[data-editor-status]').textContent = 'Plain text editor available';
  }
  fallback.addEventListener('input', () => {
    if (api) api.view.dispatch({ changes: { from: 0, to: api.view.state.doc.length, insert: fallback.value }, annotations: Transaction.userEvent.of('input') });
    else changed(fallback.value.replaceAll('\n', newline));
  });
  const editor = {
    getSource: () => api ? api.getSource() : fallbackSource,
    setSource: value => { if (api) api.setSource(value); else { fallback.value = value; changed(value); } },
    focus: () => api && !parent.hidden ? api.focus() : fallback.focus(),
    showFallback,
  };
  onChange = mountNoteActions({ editor, initialSource: source, isNew: parent.dataset.isNew === 'true', bom: parent.dataset.bom === 'true' });
}
attachNoteEditor();
