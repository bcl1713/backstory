import { ChangeSet, Compartment, EditorState, StateEffect, StateField, Transaction } from '@codemirror/state';
import { EditorView, keymap, drawSelection } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, isolateHistory, invertedEffects } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { mountNoteActions } from './navigation.js';
import { installHeadingNavigation } from './heading-navigation.js';
import { createLivePreviewExtension, frontMatter } from './live-preview.js';
import { createLiveLinksExtension, wikiLinks } from './live-links.js';
import { sourceChanges } from './source-merge.js';
import { blockExitExtension, blockIsInactive } from './block-format.js';

export function mountMarkdownEditor({ parent, source, newline = '\n', onChange = () => {}, onBlockExit = () => {}, onFailure = () => {}, nonce = '', getPath = () => '' }) {
  const presentation = new Compartment();
  const liveExtensions = () => [createLivePreviewExtension(), createLiveLinksExtension({ getPath })];
  const separator = ['\n', '\r\n', '\r'].includes(newline) ? newline : '\n';
  const uniformEndings = new Map(['\n', '\r\n', '\r'].map(value => [value, { separator: value }]));
  const endingsFrom = (text, preferred) => {
    const breaks = text.match(/\r\n|\r|\n/g) || [];
    return breaks.every(value => value === breaks[0])
      ? uniformEndings.get(breaks[0] || preferred)
      : { separator: preferred, breaks };
  };
  const restoreEndings = StateEffect.define();
  const lineEndings = StateField.define({
    create: () => endingsFrom(source, separator),
    update(value, transaction) {
      // A real edit uses the current preferred convention. Undo restores the
      // original boundary sequence through history effects, including mixed EOLs.
      let next = transaction.docChanged ? uniformEndings.get(value.separator) : value;
      for (const effect of transaction.effects) if (effect.is(restoreEndings)) next = effect.value;
      return next;
    },
  });
  const getSource = () => {
    const text = view.state.doc.toString();
    const endings = view.state.field(lineEndings);
    let index = 0;
    return endings.breaks
      ? text.replace(/\n/g, () => endings.breaks[index++])
      : text.replaceAll('\n', endings.separator);
  };
  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc: source,
      extensions: [
        lineEndings,
        invertedEffects.of(transaction => transaction.docChanged || transaction.effects.some(effect => effect.is(restoreEndings))
          ? [restoreEndings.of(transaction.startState.field(lineEndings))] : []),
        history(), keymap.of([...defaultKeymap, ...historyKeymap]), drawSelection(),
        markdown({ base: markdownLanguage, extensions: [frontMatter, wikiLinks], addKeymap: false, completeHTMLTags: false, pasteURLAsLink: false }),
        EditorView.lineWrapping,
        EditorView.theme({}, { dark: true }),
        EditorView.contentAttributes.of({ 'aria-label': 'Markdown editor', spellcheck: 'false' }),
        EditorView.cspNonce.of(nonce),
        EditorView.exceptionSink.of(() => onFailure()),
        presentation.of(liveExtensions()),
        blockExitExtension(onBlockExit),
        EditorView.updateListener.of(update => {
          if (update.docChanged || update.startState.field(lineEndings) !== update.state.field(lineEndings)) {
            onChange(getSource(), { user: update.transactions.some(tr => !tr.isUserEvent('input.external') && !tr.isUserEvent('input.format')) });
          }
        }),
      ],
    }),
  });
  const removeHeadingNavigation = installHeadingNavigation(view);
  return {
    view,
    getSource,
    setSource(nextSource) {
      if (getSource() === nextSource) return;
      const doc = view.state.toText(nextSource);
      // Newline-only replacements are metadata events in the same undo history.
      // They do not replace identical text or move the current selection.
      view.dispatch({
        changes: view.state.doc.eq(doc) ? undefined : { from: 0, to: view.state.doc.length, insert: doc },
        effects: restoreEndings.of(endingsFrom(nextSource, view.state.field(lineEndings).separator)),
        annotations: [Transaction.userEvent.of('input'), isolateHistory.of('full')],
      });
    },
    applyExternalSource(nextSource, preferredNewline, origin = 'input.external') {
      if (getSource() === nextSource && (!preferredNewline || preferredNewline === view.state.field(lineEndings).separator)) return;
      const text = nextSource.replace(/\r\n|\r/g, '\n');
      const changes = ChangeSet.of(sourceChanges(view.state.doc.toString(), text), view.state.doc.length);
      view.dispatch({
        changes,
        effects: [restoreEndings.of(endingsFrom(nextSource, preferredNewline || view.state.field(lineEndings).separator)), view.scrollSnapshot().map(changes)],
        annotations: [Transaction.userEvent.of(origin), isolateHistory.of('full')],
      });
    },
    setMode(mode) {
      if (!['live', 'source'].includes(mode)) throw new TypeError('Unknown editor mode');
      view.dispatch({ effects: presentation.reconfigure(mode === 'live' ? liveExtensions() : []), annotations: Transaction.addToHistory.of(false) });
    },
    focus() { view.focus(); },
    destroy() { removeHeadingNavigation(); view.destroy(); },
  };
}

function attachNoteEditor() {
  const parent = document.querySelector('[data-markdown-editor]');
  if (!parent) return;
  const fallback = document.querySelector('#source');
  const fallbackRegion = document.querySelector('[data-source-fallback]');
  const controls = document.querySelector('[data-editor-controls]');
  const initialSource = JSON.parse(document.querySelector('#note-source').textContent);
  const newline = JSON.parse(document.querySelector('#note-newline').textContent);
  // A user may edit the initially available textarea while the module loads.
  // Preserve those edits; untouched text keeps its original mixed line endings.
  const source = fallback.value === fallback.defaultValue ? initialSource : fallback.value.replaceAll('\n', newline);
  const readiness = document.querySelector('[data-editor-readiness]');
  let api;
  let fallbackSource = source;
  let fallbackNewline = newline;
  let fallbackComposing = false;
  let enhancedComposing = false;
  parent.addEventListener('compositionstart', () => { enhancedComposing = true; });
  parent.addEventListener('compositionend', () => { enhancedComposing = false; });
  fallback.addEventListener('compositionstart', () => { fallbackComposing = true; });
  fallback.addEventListener('compositionend', () => { fallbackComposing = false; });
  let onChange = () => {};
  let onBlockExit = () => {};
  const changed = (value, origin = { user: true }) => {
    fallbackSource = value;
    if (fallback.value !== value.replace(/\r\n|\r/g, '\n')) fallback.value = value;
    onChange(value, origin);
  };
  const setPresentation = (mode, failed = false, focus = true) => {
    const plain = mode === 'plain' || !api;
    if (plain && api) fallback.value = api.getSource();
    if (!plain) api.setMode(mode);
    parent.hidden = plain;
    fallbackRegion.hidden = !plain;
    parent.dataset.presentation = plain ? 'plain' : mode;
    controls.querySelectorAll('[data-editor-mode]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.editorMode === parent.dataset.presentation));
      button.disabled = !api && button.dataset.editorMode !== 'plain';
    });
    const name = plain ? 'Plain text fallback' : mode === 'source' ? 'Raw source' : 'Live preview';
    readiness.textContent = failed ? 'Enhanced editor unavailable. Ready · Plain text fallback · Complete document source.' : `Ready · ${name}${plain ? ' · Complete document source' : ''}`;
    controls.hidden = false;
    if (focus) { if (plain) fallback.focus(); else api.focus(); }
  };
  const showFallback = () => setPresentation('plain');
  try {
    api = mountMarkdownEditor({ parent, source, newline, getPath: () => JSON.parse(document.querySelector('#note-path').textContent), nonce: parent.dataset.styleNonce || '', onChange: changed,
      onBlockExit: block => onBlockExit(block),
      onFailure: () => queueMicrotask(() => setPresentation('plain', true)) });
    parent.markdownEditor = api;
    setPresentation('live', false, false);
  } catch {
    parent.replaceChildren();
    setPresentation('plain', true, false);
  }
  controls.querySelectorAll('[data-editor-mode]').forEach(button => button.addEventListener('click', () => setPresentation(button.dataset.editorMode)));
  fallback.addEventListener('input', () => {
    if (api) api.view.dispatch({ changes: { from: 0, to: api.view.state.doc.length, insert: fallback.value }, annotations: Transaction.userEvent.of('input') });
    else changed(fallback.value.replaceAll('\n', fallbackNewline));
  });
  const editor = {
    getSource: () => api ? api.getSource() : fallbackSource,
    setSource: value => { if (api) api.setSource(value); else { fallback.value = value; changed(value); } },
    applyExternalSource: (value, preferredNewline, origin = 'input.external') => {
      const changes = ChangeSet.of(sourceChanges(fallback.value, value.replace(/\r\n|\r/g, '\n')), fallback.value.length);
      const start = changes.mapPos(fallback.selectionStart), end = changes.mapPos(fallback.selectionEnd);
      const direction = fallback.selectionDirection, top = fallback.scrollTop, left = fallback.scrollLeft;
      fallbackNewline = preferredNewline || value.match(/\r\n|\r|\n/)?.[0] || fallbackNewline;
      if (api) api.applyExternalSource(value, preferredNewline, origin);
      else changed(value, { user: false });
      fallback.setSelectionRange(start, end, direction);
      fallback.scrollTop = top; fallback.scrollLeft = left;
    },
    isComposing: () => enhancedComposing || fallbackComposing || api?.view.compositionStarted || false,
    setBlockExitHandler: handler => { onBlockExit = handler; },
    blockIsInactive: (block, changes) => Boolean(api && !parent.hidden && blockIsInactive(api.view.state, block, changes)),
    focus: () => api && !parent.hidden ? api.focus() : fallback.focus(),
    showFallback,
  };
  onChange = mountNoteActions({ editor, initialSource, isNew: parent.dataset.isNew === 'true', bom: parent.dataset.bom === 'true' });
  if (source !== initialSource) onChange(source);
}
attachNoteEditor();
