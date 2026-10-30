/** Existing-note discovery only: never mutates editor source or saves a draft. */
export function isQuickOpenShortcut(event) {
  return event.code === 'KeyO' && !!event.ctrlKey && !!event.altKey &&
    !event.getModifierState?.('AltGraph') && !event.metaKey && !event.shiftKey && !event.repeat && !event.isComposing && !event.defaultPrevented;
}

export function noteHref(path) {
  if (typeof path !== 'string' || !path.toLowerCase().endsWith('.md') || path.length > 4096 ||
      /[\\#\[\]|\u0000-\u001f\u007f-\u009f]/u.test(path) ||
      path.split('/').some(part => !part || part.startsWith('.'))) return null;
  try { return '/notes/' + path.split('/').map(encodeURIComponent).join('/'); }
  catch { return null; }
}

export function resultIndex(index, count, key) {
  if (index < 0) return key === 'ArrowDown' ? 0 : count - 1;
  return (index + (key === 'ArrowDown' ? 1 : -1) + count) % count;
}

export function mountQuickOpen() {
  const dialog = document.querySelector('[data-quick-open]');
  const trigger = document.querySelector('[data-quick-open-trigger]');
  if (!dialog || !trigger || typeof dialog.showModal !== 'function') return;
  trigger.hidden = false;
  const input = dialog.querySelector('input');
  const results = dialog.querySelector('[data-quick-open-results]');
  const status = dialog.querySelector('[data-quick-open-status]');
  let previousFocus, controller, version = 0, debounce;
  const cancel = () => { version++; controller?.abort(); clearTimeout(debounce); };
  const close = () => { cancel(); dialog.close(); previousFocus?.focus(); };
  const search = async () => {
    cancel();
    const current = version;
    results.replaceChildren();
    status.textContent = 'Looking for existing notes…';
    controller = new AbortController();
    const requestController = controller;
    const timeout = setTimeout(() => requestController.abort(), 15000);
    try {
      const response = await fetch('/tools/complete/?' + new URLSearchParams({query:input.value}), {
        credentials:'same-origin', cache:'no-store', redirect:'error', headers:{Accept:'application/json'}, signal:requestController.signal,
      });
      if (response.status === 401 || response.status === 403) throw new Error('Sign in again to find notes.');
      if (!response.ok) throw new Error('Note lookup is unavailable. Try again or use Search from Menu.');
      const data = await response.json();
      if (data.state !== 'suggestions' || data.authoritative !== false || !Array.isArray(data.items) || data.items.length > 20 || typeof data.freshness?.state !== 'string' || typeof data.freshness.limited !== 'boolean' || typeof data.truncated !== 'boolean') throw new Error('Note lookup is unavailable. Try again or use Search from Menu.');
      const links = data.items.map(item => {
        const href = noteHref(item.path);
        if (!href || typeof item.label !== 'string' || item.label.length > 4096) throw new Error('Note lookup returned an unsupported result. Use Search from Menu.');
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = href;
        a.textContent = `${item.label} — ${item.path}`;
        li.append(a);
        return li;
      });
      if (current !== version || !dialog.open) return;
      results.replaceChildren(...links);
      const partial = data.truncated || data.freshness.limited || data.freshness.state !== 'ready';
      status.textContent = `${links.length ? `${links.length} matching notes.` : 'No matching notes in the index.'}${partial ? ` Results may be incomplete (index: ${data.freshness.state}). Refine your search or browse files.` : ''}`;
    } catch (error) {
      if (current === version && dialog.open) status.textContent = error.name === 'AbortError' ? 'Note lookup timed out. Try again or use Search from Menu.' : error.message;
    } finally { clearTimeout(timeout); }
  };
  const open = () => {
    if (dialog.open) return;
    previousFocus = document.activeElement;
    input.value = '';
    dialog.showModal();
    input.focus();
    void search();
  };
  trigger.addEventListener('click',open);
  dialog.querySelector('[data-quick-open-close]').addEventListener('click',close);
  dialog.addEventListener('cancel',event => { event.preventDefault(); close(); });
  input.addEventListener('input',() => {
    cancel(); results.replaceChildren(); status.textContent = 'Looking for existing notes…';
    debounce = setTimeout(search,150);
  });
  // Window capture runs before editor/document shortcuts, including proposals.
  window.addEventListener('keydown',event => {
    if (isQuickOpenShortcut(event)) { event.preventDefault(); event.stopPropagation(); open(); }
    if (!dialog.open) return;
    // Own Escape before the shell's Menu handler, preserving the initiating control.
    if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); close(); return; }
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.code === 'Period') {
      event.preventDefault(); event.stopImmediatePropagation(); return;
    }
    const links = [...results.querySelectorAll('a')];
    const index = links.indexOf(document.activeElement);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (links.length) links[resultIndex(index, links.length, event.key)].focus();
    } else if (event.key === 'Enter' && document.activeElement === input && links.length) {
      event.preventDefault(); links[0].click();
    }
  },true);
}
