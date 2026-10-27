import { Prec, Transaction } from '@codemirror/state';
import { EditorView, tooltips } from '@codemirror/view';
import { ensureSyntaxTree } from '@codemirror/language';
import { isolateHistory } from '@codemirror/commands';
import { autocompletion, acceptCompletion, closeCompletion, moveCompletionSelection, pickedCompletion, startCompletion } from '@codemirror/autocomplete';
import { getCM } from '@replit/codemirror-vim';
import { editorTooltipSpace } from './editor-viewport.js';

const literalNodes = new Set(['FrontMatter', 'FencedCode', 'CodeBlock', 'InlineCode', 'HTMLBlock', 'HTMLTag', 'Image', 'Table', 'Link']);
const boundedString = (value, limit) => typeof value === 'string' && value.length <= limit * 2
  && value.isWellFormed() && Array.from(value).length <= limit;
const safeText = value => boundedString(value, 512) && !/[\x00-\x1f\x7f]/.test(value);
const safeLabel = value => safeText(value) && !value.includes(']]') && !value.endsWith(']') && !value.includes('\\');
const safePath = path => boundedString(path, 4096) && /\.md$/i.test(path)
  && !/[#|\[\]\\\x00-\x1f\x7f]/.test(path) && path.split('/').every(part => part && part !== '.' && part !== '..' && !part.startsWith('.'));

function linkContext(state, pos) {
  if (!state.selection.main.empty || state.selection.ranges.length !== 1) return null;
  const line = state.doc.lineAt(pos);
  const column = pos - line.from;
  let opening = -1;
  // Wikilinks don't nest. Track the first unclosed opener so an inner [[ in
  // an existing label or heading cannot be mistaken for a fresh link target.
  for (let n = 0; n < column - 1; n++) {
    const pair = line.text.slice(n, n + 2);
    if (pair !== '[[' && pair !== ']]') continue;
    if (pair === '[[') {
      let escapes = 0;
      for (let before = n - 1; before >= 0 && line.text[before] === '\\'; before--) escapes++;
      if (escapes % 2) continue;
      if (opening < 0) opening = n;
    } else opening = -1;
    n++;
  }
  if (opening < 0) return null;
  const query = line.text.slice(opening + 2, column);
  if (!boundedString(query, 256) || /[\[\]#|\\]/.test(query)) return null;
  const tree = ensureSyntaxTree(state, pos, 20);
  if (!tree) return null;
  for (let node = tree.resolveInner(pos, -1); node; node = node.parent) {
    if (literalNodes.has(node.name)) return null;
    if (node.name === 'WikiLink' && node.from !== line.from + opening) return null;
  }
  const from = line.from + opening + 2;
  let closing = line.text.indexOf(']]', column);
  const rest = line.text.slice(column);
  const laterOpening = line.text.indexOf('[[', column);
  const separator = rest.search(/[#|]/);
  if (laterOpening >= 0 && laterOpening < closing && (separator < 0 || laterOpening < column + separator)) closing = -1;
  // With no closing delimiter, preserve prose after the caret unless it
  // explicitly begins a fragment or label belonging to this link.
  const end = closing >= 0 ? line.from + closing + 2
    : pos + (/^[#|]/.test(rest) ? rest.length : rest.startsWith(']') ? 1 : 0);
  const body = state.sliceDoc(from, closing >= 0 ? line.from + closing : end);
  const boundary = body.search(/[#|]/);
  const suffix = boundary < 0 ? '' : body.slice(boundary);
  return { from, end, query, suffix };
}

export function createLinkCompletionExtension({ onStatus = () => {} } = {}) {
  const source = async context => {
    const vim = context.view && getCM(context.view)?.state.vim;
    const link = linkContext(context.state, context.pos);
    if (!link || (vim && !vim.insertMode)) {
      onStatus(context.explicit ? 'Put the caret after [[ in note text to complete a link.' : '');
      return null;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    context.addEventListener('abort', () => controller.abort(), { onDocChange: true });
    onStatus('Loading link suggestions…');
    try {
      const response = await fetch('/tools/complete/?' + new URLSearchParams({ query: link.query }), {
        credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (context.aborted) return null;
      if (response.status === 401 || response.status === 403) {
        onStatus('Sign in again for link suggestions. Your draft is retained.'); return null;
      }
      if (!response.ok || !response.headers.get('content-type')?.startsWith('application/json')) throw new Error();
      const result = await response.json();
      if (context.aborted) return null;
      if (result.state !== 'suggestions' || result.authoritative !== false || !Array.isArray(result.items)
          || result.items.length > 20 || !result.freshness || typeof result.freshness.state !== 'string'
          || typeof result.freshness.limited !== 'boolean' || typeof result.truncated !== 'boolean'
          || result.items.some(item => !item || !safePath(item.path) || !safeText(item.title) || !safeLabel(item.label))) throw new Error();
      const options = result.items.map(item => ({
        label: item.label || item.title || item.path, detail: item.path, type: 'text',
        apply(view, completion) {
          const current = linkContext(view.state, view.state.selection.main.head);
          const vim = getCM(view)?.state.vim;
          if (!current || (vim && !vim.insertMode)) { closeCompletion(view); return; }
          const pipe = current.suffix.indexOf('|');
          const fragment = pipe < 0 ? current.suffix : current.suffix.slice(0, pipe);
          const label = pipe >= 0 ? current.suffix.slice(pipe) : item.label ? `|${item.label}` : '';
          const text = `[[/${item.path}${fragment}${label}]]`;
          view.dispatch({
            changes: { from: current.from - 2, to: current.end, insert: text },
            selection: { anchor: current.from - 2 + text.length }, scrollIntoView: true,
            annotations: [Transaction.userEvent.of('input.complete'), pickedCompletion.of(completion), isolateHistory.of('full')],
          });
          onStatus('');
        },
      }));
      const incomplete = result.truncated || result.freshness.limited || result.freshness.state !== 'ready';
      onStatus(options.length ? `${options.length} link suggestions.${incomplete ? ' Results may be incomplete; type more to narrow.' : ''}`
        : incomplete ? 'Link suggestions are incomplete. Check index status or try a narrower query.' : 'No existing-note suggestions. Keep typing or dismiss.');
      return options.length ? { from: link.from, options, filter: false } : null;
    } catch {
      if (!context.aborted) onStatus('Link suggestions unavailable. Keep typing; your draft is retained.');
      return null;
    } finally {
      clearTimeout(timeout);
    }
  };
  return [
    autocompletion({ override: [source], defaultKeymap: false, icons: false, maxRenderedOptions: 20 }),
    // Vim installs a DOM handler before the ordinary keymap dispatcher. A
    // high-precedence DOM handler lets the active popup own these keys first.
    Prec.highest(EditorView.domEventHandlers({ keydown(event, view) {
      if (!event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
        if (event.key === 'ArrowDown') return moveCompletionSelection(true)(view);
        if (event.key === 'ArrowUp') return moveCompletionSelection(false)(view);
        if (event.key === 'Enter') return acceptCompletion(view);
        if (event.key === 'Escape') {
          const vim = getCM(view)?.state.vim;
          const eligible = Boolean(linkContext(view.state, view.state.selection.main.head)) && (!vim || vim.insertMode);
          const closed = closeCompletion(view);
          if (closed) onStatus('');
          return closed && eligible;
        }
      }
      if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.code === 'Space') return startCompletion(view);
      return false;
    } })),
    tooltips({ tooltipSpace: editorTooltipSpace }),
    EditorView.domEventHandlers({ blur() { onStatus(''); } }),
  ];
}
