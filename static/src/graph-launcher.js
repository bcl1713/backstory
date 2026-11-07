// Small shell adapter. Physics, SVG and graph styles load only on demand.
export function mountGraphLauncher() {
  const dialog = document.querySelector('[data-graph-dialog]');
  if (!dialog) return;
  let controller = null, sequence = 0, returnFocus = null, prefix = false, timer;
  const currentPath = () => {
    try { return JSON.parse(document.querySelector('#note-path')?.textContent || '""'); } catch { return ''; }
  };
  const finish = () => {
    sequence++; controller?.destroy(); controller = null;
    if (dialog.open) dialog.close();
    document.dispatchEvent(new Event('backstory:graph-closed'));
    const host = document.querySelector('[data-markdown-editor]');
    if (host?.markdownEditor && !host.hidden) host.markdownEditor.focus();
    else if (document.querySelector('#source')) document.querySelector('#source').focus({ preventScroll: true });
    else if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  };
  const close = () => { if (history.state?.backstoryGraph) history.back(); else finish(); };
  const open = async ({ search = true } = {}) => {
    if (dialog.open) { controller?.focusSearch(); return; }
    const ticket = ++sequence;
    returnFocus = document.activeElement;
    const path = currentPath();
    dialog.querySelector('[name=path]').value = path;
    dialog.showModal();
    history.pushState({ ...history.state, backstoryGraph: true }, '');
    document.dispatchEvent(new Event('backstory:graph-opened'));
    if (search) {
      dialog.querySelector('[data-graph-filter-options]').open = true;
      dialog.querySelector('[name=query]').focus({ preventScroll: true });
    }
    if (!document.querySelector('[data-graph-styles]')) {
      const style = document.createElement('link'); style.rel = 'stylesheet'; style.href = '/static/graph.css'; style.dataset.graphStyles = '';
      document.head.append(style);
    }
    try {
      const { mountGraph } = await import('/static/graph-controller.js');
      if (ticket !== sequence || !dialog.open) return;
      controller = mountGraph(dialog, { currentPath: path, onClose: close });
      if (search) controller.focusSearch(); else controller.focusNavigation();
    } catch {
      if (ticket === sequence) {
        const status = dialog.querySelector('[data-graph-status]');
        status.replaceChildren(document.createTextNode('Graph enhancement unavailable. '));
        const fallback = document.createElement('a'); fallback.textContent = 'Open server connection list';
        fallback.href = '/graph/?' + new URLSearchParams(path ? { path } : {}); status.append(fallback);
      }
    }
  };
  document.addEventListener('click', event => {
    const anchor = event.target.closest('[data-graph-open]');
    if (!anchor || event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); void open({ search: false });
  });
  document.addEventListener('backstory:open-graph', () => { void open(); });
  dialog.querySelector('[data-graph-close]').addEventListener('click', close);
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  window.addEventListener('popstate', () => { if (dialog.open) finish(); });
  window.addEventListener('pagehide', () => { sequence++; controller?.destroy(); controller = null; });
  window.addEventListener('pageshow', async event => {
    if (!event.persisted || !dialog.open) return;
    const ticket = ++sequence;
    try {
      const { mountGraph } = await import('/static/graph-controller.js');
      if (ticket !== sequence || !dialog.open) return;
      controller = mountGraph(dialog, { currentPath: currentPath(), onClose: close });
      controller.focusSearch();
    } catch { if (ticket === sequence) finish(); }
  });
  // Vim owns its own prefix through mapCommand. Only navigation controls are
  // handled here; editor text, composition and browser shortcuts pass through.
  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || dialog.open || event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.getModifierState?.('AltGraph') ||
        event.target.closest('input, textarea, select, [contenteditable], [role=textbox], dialog')) { prefix = false; return; }
    if (prefix) {
      prefix = false; clearTimeout(timer);
      if (event.key === '/') { event.preventDefault(); void open(); }
    } else if (event.key === 'g') {
      prefix = true; timer = setTimeout(() => { prefix = false; }, 800);
    }
  });
}
