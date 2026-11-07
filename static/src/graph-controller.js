import { GraphView } from './graph-view.js';
import { GraphPages } from './graph-pages.js';
import { DEFAULT_FORCES, loadForces, saveForces } from './graph-preferences.js';

let preferredList = false;
const linkTo = path => '/notes/' + path.split('/').map(encodeURIComponent).join('/');
const element = (name, text, attributes = {}) => {
  const el = document.createElement(name);
  if (text !== undefined) el.textContent = text;
  for (const [key, value] of Object.entries(attributes)) el.setAttribute(key, String(value));
  return el;
};
const safeNote = node => {
  if (typeof node.path !== 'string' || typeof node.title !== 'string' || typeof node.href !== 'string') return false;
  try {
    const url = new URL(node.href, location.origin);
    return url.origin === location.origin && url.pathname.startsWith('/notes/') && decodeURIComponent(url.pathname.slice(7)) === node.path;
  } catch { return false; }
};
const safePage = page => page && page.untrusted_content === true && page.authoritative === false &&
  (page.next_cursor === null || typeof page.next_cursor === 'string' && page.next_cursor.length > 0 && page.next_cursor.length <= 4096) &&
  Array.isArray(page.nodes) && page.nodes.length <= 200 && Array.isArray(page.edges) && page.edges.length <= 500 &&
  page.nodes.every(safeNote) && page.edges.every(edge => typeof edge.source === 'string' &&
    typeof edge.destination === 'string' && Number.isSafeInteger(edge.occurrence_count) && edge.occurrence_count > 0);

async function readJSON(url, signal) {
  const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal, headers: { Accept: 'application/json' } });
  if (response.redirected || new URL(response.url).origin !== location.origin || !response.headers.get('content-type')?.startsWith('application/json')) throw new Error('invalid_response');
  const data = await response.json();
  if (!response.ok) throw new Error(response.status === 401 ? 'authentication_required' : data.restart ? 'restart_required' : data.reason_code || 'graph_unavailable');
  if (data.untrusted_content !== true) throw new Error('invalid_response');
  if (data.state === 'unavailable' || data.freshness?.state === 'unavailable') throw new Error(data.reason_code || 'storage_unavailable');
  return data;
}

export function mountGraph(root, { currentPath = '', initial = null, onClose = () => {} } = {}) {
  const find = selector => root.querySelector(selector);
  const panel = find('[data-graph-panel]') || root;
  const form = find('[data-graph-filters]');
  const input = name => form.elements.namedItem(name);
  const status = find('[data-graph-status]');
  const details = find('[data-graph-details]');
  const map = find('[data-graph-map]');
  const life = new AbortController();
  const listen = (el, name, fn, options = {}) => el.addEventListener(name, fn, { ...options, signal: life.signal });
  const say = text => { if (status.textContent !== text) status.textContent = text; };
  const pages = new GraphPages();
  let closed = false, sequence = 0, detailSequence = 0, request = null, detailRequest = null, debounce = null;
  let page = null, selected = currentPath || null, focused = currentPath || null;
  let listMode = preferredList, graphicsAvailable = true, trail = [], nextCursor = null, activeParams = null;
  let pendingPositions = null, pendingVersion = null;
  const evidenceStamp = data => data && JSON.stringify([data.generation, data.mutation, data.relation_epoch, data.eligibility_version]);
  let view = null, loadingPaused = false, loadingError = false, loadingReason = '', autoTimer;
  let storage; try { storage = window.localStorage; } catch { /* Preferences remain page-local. */ }
  let forces = loadForces(storage);
  const cancelAutomatic = () => { clearTimeout(autoTimer); autoTimer = null; };
  const wholeWiki = () => !activeParams?.path;
  const automaticallyContinue = () => {
    cancelAutomatic();
    if (!closed && nextCursor && !request && !loadingPaused && !loadingError) {
      // Yield between bounded requests so controls, input and rendering stay live.
      autoTimer = setTimeout(() => { autoTimer = null; void load({ cursor: nextCursor, append: true }); }, 40);
    }
  };

  find('[data-graph-filter-options]').open = false;
  find('[data-graph-map-options]').open = false;
  find('[data-graph-settings]').open = false;
  find('[data-graph-forces]').open = false;
  find('[data-graph-control-options]').open = !matchMedia('(max-width: 650px), (max-height: 500px)').matches;
  const focusSearch = () => { find('[data-graph-filter-options]').open = true; input('query').focus({ preventScroll: true }); };
  const parameters = () => {
    const values = { ...Object.fromEntries(new FormData(form)), depth: input('depth').value };
    if (!values.path) delete values.path;
    return values;
  };
  const open = path => {
    if (!path || !page?.nodes.some(node => node.path === path)) return;
    const anchor = element('a', '', { href: linkTo(path), hidden: '' });
    panel.append(anchor); try { anchor.click(); } finally { anchor.remove(); }
  };
  const toggleHelp = () => { find('[data-graph-help]').hidden = !find('[data-graph-help]').hidden; };
  const escape = () => {
    if (!find('[data-graph-help]').hidden) { find('[data-graph-help]').hidden = true; return; }
    onClose();
  };
  const unavailable = () => {
    graphicsAvailable = false; listMode = true; presentation();
    if (!loadingError) say('Map unavailable. Use the connection list, or retry the map.');
    find('[data-graph-graphics-retry]').hidden = false;
  };
  function createView() {
    try {
      view = new GraphView(map, {
        onSelect: (path, focus) => select(path, focus), onOpen: open, onCenter: path => center(path),
        onSearch: focusSearch, onEscape: escape, onHelp: toggleHelp,
        onPause: paused => { find('[data-graph-pause]').setAttribute('aria-pressed', String(paused)); },
        onUnavailable: unavailable,
        onRestored: () => { graphicsAvailable = true; find('[data-graph-graphics-retry]').hidden = true; say('Map ready. Switch to the map to continue.'); },
        onLimit: () => {},
      });
      view.setForces(forces);
      graphicsAvailable = view.available !== false;
      if (!graphicsAvailable) unavailable();
    } catch { unavailable(); }
  }
  function presentation() {
    panel.classList.toggle('graph-list-mode', listMode);
    find('[data-graph-list]').hidden = !listMode;
    map.hidden = listMode;
    if (listMode) view?.stop(); else view?.wake();
    find('[data-graph-list-toggle]').setAttribute('aria-pressed', String(listMode));
  }
  function controls() {
    const global = wholeWiki(), depth = Number(input('depth').value), filters = ['query', 'folder', 'tag'].filter(name => (activeParams?.[name] || '').trim());
    find('[data-graph-cancel]').hidden = loadingPaused || loadingError || !(request || nextCursor);
    find('[data-graph-resume]').hidden = !loadingPaused || loadingError;
    find('[data-graph-restart]').hidden = !loadingError;
    find('[data-graph-depth-controls]').hidden = global;
    input('depth').disabled = global;
    find('[data-graph-depth-down]').disabled = depth <= 1;
    find('[data-graph-depth-up]').disabled = depth >= 8;
    find('[data-graph-depth-value]').textContent = `${depth} hop${depth === 1 ? '' : 's'}`;
    find('[data-graph-local]').setAttribute('aria-pressed', String(!global));
    find('[data-graph-global]').setAttribute('aria-pressed', String(global));
    find('[data-graph-scope]').textContent = `${global ? 'Whole wiki' : `Local · ${depth} hop${depth === 1 ? '' : 's'} · ${activeParams?.path || input('path').value}`}${filters.length ? ` · Filtered by ${filters.map(name => `${name}: ${activeParams[name]}`).join(', ')}` : ''}`;
    const state = loadingError ? 'Partial — loading stopped' : loadingPaused ? 'Loading paused · Partial' :
      request || nextCursor ? 'Loading…' : pages.complete ? 'Complete' :
      page?.limiting_reasons?.includes('index_updating') || page?.freshness?.state === 'partial' ?
        'Loaded available results · Index updating' : 'Loaded available results · Incomplete evidence';
    find('[data-graph-summary]').textContent = !page ? '' :
      `${page.nodes.length} notes · ${page.edges.length} directed links · ${state}${page.boundary_connections ? ' · Some connections are outside your filters' : ''}`;
  }
  const listWindow = 250;
  let nodeOffset = 0, edgeOffset = 0;
  function listNavigation(kind, total, offset) {
    const nav = find(`[data-graph-${kind}-navigation]`);
    const hadFocus = nav.contains(document.activeElement), forwardFocus = document.activeElement === nav.lastElementChild;
    nav.replaceChildren(); nav.hidden = total <= listWindow;
    if (nav.hidden) return;
    const previous = element('button', `Previous ${kind}`, { type: 'button' });
    const next = element('button', `Next ${kind}`, { type: 'button' });
    previous.disabled = offset === 0; next.disabled = offset + listWindow >= total;
    const move = delta => {
      if (kind === 'notes') nodeOffset = Math.max(0, nodeOffset + delta); else edgeOffset = Math.max(0, edgeOffset + delta);
      renderList();
    };
    previous.addEventListener('click', () => move(-listWindow)); next.addEventListener('click', () => move(listWindow));
    nav.append(previous, element('span', `${offset + 1}–${Math.min(offset + listWindow, total)} of ${total} loaded ${kind}`), next);
    if (hadFocus) {
      const preferred = forwardFocus ? next : previous;
      (preferred.disabled ? forwardFocus ? previous : next : preferred).focus({ preventScroll: true });
    }
  }
  function renderList() {
    const activePath = document.activeElement?.dataset.graphInspect;
    const list = find('[data-graph-nodes]'); list.replaceChildren();
    const ordered = [...(page?.nodes || [])].sort((a, b) => a.path.localeCompare(b.path));
    nodeOffset = Math.min(nodeOffset, Math.max(0, Math.floor((ordered.length - 1) / listWindow) * listWindow));
    edgeOffset = Math.min(edgeOffset, Math.max(0, Math.floor(((page?.edges.length || 0) - 1) / listWindow) * listWindow));
    listNavigation('notes', ordered.length, nodeOffset);
    listNavigation('links', page?.edges.length || 0, edgeOffset);
    for (const node of ordered.slice(nodeOffset, nodeOffset + listWindow)) {
      const li = element('li');
      const inspect = element('button', `Inspect ${node.title}`, { type: 'button', 'data-graph-inspect': node.path, 'aria-pressed': String(node.path === selected) });
      // These listeners disappear with the row, rather than accumulating abort
      // callbacks on the long-lived graph for every continuation.
      inspect.addEventListener('click', () => select(node.path, false));
      const openLink = element('a', `Open ${node.path}`, { href: node.href });
      if (node.path === currentPath) openLink.setAttribute('aria-current', 'page');
      li.append(element('strong', node.title), element('div', node.path), inspect, openLink); list.append(li);
      if (activePath === node.path) inspect.focus({ preventScroll: true });
    }
    if (!page?.nodes.length) list.append(element('li', loadingError ?
      loadingReason === 'graph_query_limited' ? 'The graph query limit was reached. Try fewer hops or narrower filters.' : 'Loading stopped. Check the graph status for recovery options.' :
      request || nextCursor ? 'Loading connections…' : page && pages.complete ? 'No notes match this scope.' : 'Loaded available results. Relationships are still updating.'));
    const edges = find('[data-graph-edges]'); edges.replaceChildren();
    for (const edge of (page?.edges || []).slice(edgeOffset, edgeOffset + listWindow)) edges.append(element('li', `${edge.source} → ${edge.destination} · ${edge.occurrence_count} occurrence${edge.occurrence_count === 1 ? '' : 's'}`));
  }
  function clearEvidence() {
    pages.clear(); page = null; nextCursor = null; selected = focused = null; nodeOffset = edgeOffset = 0;
    detailSequence++; detailRequest?.abort(); detailRequest = null;
    details.replaceChildren(element('h2', 'Selected note'), element('p', 'Select a note to see its connections.'));
    view?.setGraph({ nodes: [], edges: [] }, currentPath); view?.setSelection(null, null);
    renderList(); controls();
  }
  function revokeEvidence() {
    sequence++; cancelAutomatic(); request?.abort(); request = null; pendingPositions = pendingVersion = null; clearEvidence();
  }
  function showDetails(path) {
    const ticket = ++detailSequence;
    detailRequest?.abort(); detailRequest = new AbortController();
    const node = page?.nodes.find(node => node.path === path);
    details.replaceChildren(element('h2', 'Selected note'));
    if (!node) { details.append(element('p', 'Select a note to see its connections.')); return; }
    details.append(element('h3', node.title), element('p', path), element('a', 'Open selected note', { href: node.href }));
    const centerButton = element('button', 'Center selected note', { type: 'button' });
    centerButton.addEventListener('click', () => center(path)); details.append(centerButton);
    const freshness = element('p', 'Loading connections…'); details.append(freshness);
    const incoming = element('ul'), outgoing = element('ul');
    const evidenceDetails = element('details'); evidenceDetails.append(element('summary', 'Technical evidence'));
    const evidenceText = element('p'); evidenceDetails.append(evidenceText);
    details.append(element('h3', 'Incoming'), incoming, element('h3', 'Outgoing and references'), outgoing, evidenceDetails);
    const seen = new Set(); let evidenceLoading = false;
    async function loadEvidence(cursor) {
      if (evidenceLoading) return; evidenceLoading = true;
      try {
        const query = new URLSearchParams({ path, direction: 'both', limit: '50', ...(cursor ? { cursor } : {}) });
        const evidence = await readJSON('/tools/links/?' + query, detailRequest.signal);
        if (closed || ticket !== detailSequence || selected !== path) return;
        if (evidence.eligibility_version !== page?.eligibility_version ||
            ['generation', 'mutation', 'relation_epoch'].some(key => evidence[key] !== page?.[key])) throw new Error('restart_required');
        if (!Array.isArray(evidence.items) || evidence.items.length > 100) throw new Error('invalid_response');
        freshness.textContent = evidence.projection_complete ? 'Saved connections' : 'Updating saved connections';
        evidenceText.textContent = `Indexed revision ${node.revision} · relation epoch ${evidence.relation_epoch} · observed ${evidence.observed_at}. Source locations are advisory; fragments are unchecked.`;
        for (const item of evidence.items) {
          if (seen.has(item.occurrence_id)) continue; seen.add(item.occurrence_id);
          const li = element('li');
          li.append(element('span', `${item.source === path ? item.destination || item.target || '(same note)' : item.source}${item.state !== 'resolved' ? ' · ' + item.state : ''}`));
          const sourceInfo = element('details'); sourceInfo.append(element('summary', 'Source evidence'),
            element('p', `${item.source} · ${item.occurrence_kind}/${item.kind} · ${item.position_precision} line ${item.position?.[0] || '?'}, column ${item.position?.[1] || '?'}`), element('code', item.source_revision));
          li.append(sourceInfo);
          if (item.source !== path) li.append(element('a', 'Open source', { href: linkTo(item.source) }));
          if (item.destination && item.resource_type === 'note') li.append(element('a', 'Open destination', { href: linkTo(item.destination) }));
          if (item.choices?.length) li.append(element('p', `Possible matches: ${item.choices.join(', ')}`));
          (item.source === path ? outgoing : incoming).append(li);
        }
        if (evidence.next_cursor) {
          const more = element('button', 'More connections', { type: 'button' });
          more.addEventListener('click', () => { more.remove(); void loadEvidence(evidence.next_cursor); }); details.append(more);
        } else if (!seen.size) outgoing.append(element('li', evidence.projection_complete ? 'No saved connections.' : 'Connections are still updating.'));
      } catch (error) {
        if (!closed && ticket === detailSequence && error.name !== 'AbortError') {
          // A denied endpoint, expired session or changed policy must not leave
          // old node titles, counts or details available in retained client UI.
          if (error.message !== 'graph_query_limited') revokeEvidence();
          say(error.message === 'authentication_required' ? 'Session expired. Sign in again to load connections.' : 'Connections changed or are unavailable. Refresh to try again.');
        }
      } finally { evidenceLoading = false; }
    }
    void loadEvidence();
  }
  function select(path, takeFocus) {
    if (!page?.nodes.some(node => node.path === path)) return;
    selected = path; if (takeFocus) focused = path;
    view?.setSelection(selected, focused);
    renderList(); showDetails(path); controls(); say(`Selected ${path}. Enter on the map opens it.`);
  }
  function offerOneHop() {
    if (!activeParams?.path || Number(activeParams.depth) <= 1) return;
    const recover = element('button', 'Try one hop', { type: 'button' });
    recover.addEventListener('click', () => { input('depth').value = '1'; loadingPaused = false; void load({ fit: true }); });
    status.append(' ', recover);
  }
  function accept(data, { append = false, fit = false } = {}) {
    if (!safePage(data)) throw new Error('invalid_response');
    pages.accept(data, append);
    page = pages.data; nextCursor = page.next_cursor;
    if (!nextCursor && !page.nodes.some(node => node.path === selected)) selected = page.nodes.some(node => node.path === activeParams?.path) ? activeParams.path : null;
    if (!nextCursor && !page.nodes.some(node => node.path === focused)) focused = page.nodes[0]?.path || null;
    let mapFailure = false;
    try {
      if (pages.changed) view?.setGraph(page, currentPath);
      if (pages.changed && page.nodes.length || !nextCursor && (selected !== view?.selected || focused !== view?.focused)) view?.setSelection(selected, focused);
    }
    catch { mapFailure = true; unavailable(); }
    if (fit && page.nodes.length && !mapFailure && !view?.cameraControlled) view?.fit();
    if (pages.changed || !append) renderList();
    if (page.nodes.some(node => node.path === selected) && (!append || !details.textContent.includes(selected))) showDetails(selected);
    presentation(); controls();
    find('[data-graph-diagnostics]').textContent = `Index ${page.freshness.state} · relation epoch ${page.relation_epoch} · observed ${page.observed_at}. ${page.limiting_reasons?.join(', ') || ''} Indexed saved content, not a disk snapshot. Hops refer to loaded edges; unsaved edits are excluded.`;
    if (page.limiting_reasons?.includes('neighborhood_limit')) {
      say('Partial graph: the neighborhood limit was reached. Try fewer hops or narrower filters.');
      offerOneHop();
    } else say(mapFailure ? 'Map resource limit reached. All loaded records remain available in the connection list.' : '');
  }
  async function load({ cursor, fit = false, append = false, params = null } = {}) {
    clearTimeout(debounce); debounce = null; cancelAutomatic(); const ticket = ++sequence;
    const retainedPositions = !append && page?.nodes.length && view ?
      new Map([...(pendingPositions || []), ...view.simulation.nodes]) : pendingPositions;
    const retainedVersion = page ? evidenceStamp(page) : pendingVersion;
    if (!append) { pendingPositions = retainedPositions; pendingVersion = retainedVersion; }
    request?.abort(); request = new AbortController();
    loadingError = false; loadingReason = '';
    if (!append) {
      const priorSelected = selected, priorFocused = focused;
      clearEvidence(); selected = priorSelected; focused = priorFocused;
    }
    activeParams = params || (cursor ? activeParams : parameters());
    if (!activeParams) activeParams = parameters();
    say(page ? 'Updating connections…' : 'Loading connections…'); controls();
    try {
      const query = { ...activeParams, ...(cursor ? { cursor } : {}) };
      const data = await readJSON('/tools/graph/?' + new URLSearchParams(query), request.signal);
      if (!closed && ticket === sequence) {
        // Coordinates alone can survive a successful revalidation in the same
        // eligibility namespace. Failed/obsolete requests drop this local copy.
        if (retainedPositions && retainedVersion !== evidenceStamp(data)) {
          pendingPositions = pendingVersion = null; selected = focused = null;
        }
        if (pendingPositions && pendingVersion === evidenceStamp(data) && view) {
          // Restore only paths validated in this response. The remaining map
          // contains coordinates only, never old graph evidence or titles.
          for (const node of data.nodes || []) if (!view.simulation.nodes.has(node.path) && pendingPositions.has(node.path)) {
            view.simulation.nodes.set(node.path, pendingPositions.get(node.path));
          }
        }
        accept(data, { append, fit });
        if (!nextCursor) pendingPositions = pendingVersion = null;
      }
    } catch (error) {
      if (!closed && ticket === sequence && error.name !== 'AbortError') {
        loadingError = true; loadingReason = error.message;
        if (error.name !== 'RangeError' && error.message !== 'continuation_stalled' && error.message !== 'graph_query_limited') { pendingPositions = pendingVersion = null; clearEvidence(); }
        say(error.name === 'RangeError' ? 'Loading stopped because this browser ran out of graph resources. Loaded results are incomplete. Try narrower filters or restart loading.' : error.message === 'authentication_required' ? 'Session expired. Sign in again to load the graph.' :
          error.message === 'restart_required' ? 'Connections changed. Restart loading to revalidate this view.' :
          error.message === 'graph_query_limited' ? 'The graph query limit was reached. Try fewer hops or narrower filters.' :
          error.message === 'graph_database_error' ? 'Connections could not load because of a database error. Refresh to try again.' :
          error.message === 'continuation_stalled' ? 'Loading stopped because the continuation did not advance. Restart loading or narrow your filters.' : 'Unable to load connections. Restart loading to try again.');
        renderList();
        if (error.message === 'graph_query_limited') offerOneHop();
      }
    } finally { if (ticket === sequence) { request = null; controls(); automaticallyContinue(); } }
  }
  function center(path) {
    if (!path) return;
    const previous = input('path').value;
    if (previous !== path && previous) trail.push(previous);
    trail = trail.slice(-20); input('path').value = path;
    loadingPaused = false; find('[data-graph-back]').disabled = !trail.length; void load({ fit: true });
  }
  listen(form, 'submit', event => { event.preventDefault(); loadingPaused = false; void load({ fit: true }); });
  for (const name of ['query', 'path', 'folder', 'tag']) listen(input(name), 'input', () => { clearTimeout(debounce); cancelAutomatic(); sequence++; request?.abort(); request = null; loadingPaused = false; pendingPositions = pendingVersion = null; clearEvidence(); debounce = setTimeout(() => { debounce = null; void load(); }, 180); });
  listen(input('depth'), 'change', () => { loadingPaused = false; void load(); });
  function changeDepth(delta) {
    if (!input('path').value) { say('Hop depth applies to a local neighborhood. Choose Local first.'); return; }
    const next = Number(input('depth').value) + delta;
    if (next < 1 || next > 8) { say(next < 1 ? 'Minimum local depth is one hop.' : 'Maximum local depth is eight hops; query resource limits may make the view partial.'); return; }
    input('depth').value = String(next); loadingPaused = false; void load();
  }
  listen(find('[data-graph-depth-down]'), 'click', () => changeDepth(-1));
  listen(find('[data-graph-depth-up]'), 'click', () => changeDepth(1));
  listen(root, 'keydown', event => {
    if (!['[', ']'].includes(event.key) || event.isComposing || event.ctrlKey || event.altKey || event.metaKey ||
        event.target.closest('input, textarea, select, [contenteditable], [role=textbox]') ||
        event.target !== map && event.target !== find('[data-graph-list-toggle]')) return;
    event.preventDefault(); event.stopPropagation(); changeDepth(event.key === '[' ? -1 : 1);
  });
  listen(root, 'keydown', event => {
    if (event.key !== 'Escape' || event.isComposing || event.ctrlKey || event.altKey || event.metaKey) return;
    if (!find('[data-graph-help]').hidden) { event.preventDefault(); event.stopImmediatePropagation(); toggleHelp(); return; }
    if (form.contains(event.target)) {
      event.preventDefault(); event.stopImmediatePropagation(); if (debounce !== null) { clearTimeout(debounce); debounce = null; void load(); } controls();
      find('[data-graph-filter-options]').open = false;
      if (listMode) find('[data-graph-list-toggle]').focus(); else map.focus({ preventScroll: true });
      say('Search closed. Escape returns to your note.');
    } else if (event.target !== map) { event.preventDefault(); event.stopImmediatePropagation(); escape(); }
  });
  listen(find('[data-graph-clear]'), 'click', () => { input('query').value = ''; void load(); });
  listen(find('[data-graph-local]'), 'click', () => center(currentPath || selected));
  listen(find('[data-graph-global]'), 'click', () => { input('path').value = ''; input('depth').disabled = false; loadingPaused = false; void load({ fit: true }); });
  listen(find('[data-graph-back]'), 'click', () => { loadingPaused = false; input('path').value = trail.pop() || currentPath; find('[data-graph-back]').disabled = !trail.length; void load({ fit: true }); });
  listen(find('[data-graph-list-toggle]'), 'click', () => { listMode = !listMode || !graphicsAvailable; if (graphicsAvailable) preferredList = listMode; presentation(); });
  listen(find('[data-graph-fit]'), 'click', () => view?.fit());
  listen(find('[data-graph-reset]'), 'click', () => view?.resetOrientation());
  for (const button of root.querySelectorAll('[data-graph-orbit]')) listen(button, 'click', () => view?.orbit(Number(button.dataset.graphOrbit), 0));
  for (const button of root.querySelectorAll('[data-graph-zoom]')) listen(button, 'click', () => view?.zoom(Number(button.dataset.graphZoom)));
  const pans = { left: [-80, 0], right: [80, 0], up: [0, -80], down: [0, 80] };
  for (const button of root.querySelectorAll('[data-graph-pan]')) listen(button, 'click', () => view?.pan(...pans[button.dataset.graphPan]));
  listen(find('[data-graph-pause]'), 'click', () => view?.setPaused(!view.paused));
  listen(find('[data-graph-bloom]'), 'input', event => { view?.setBloom(event.target.value); find('[data-graph-bloom-value]').textContent = ['Off', 'Default', 'High'][Number(event.target.value)]; });
  listen(find('[data-graph-refresh]'), 'click', () => { loadingPaused = false; void load(); });
  listen(find('[data-graph-cancel]'), 'click', () => { loadingPaused = true; sequence++; cancelAutomatic(); request?.abort(); request = null; controls(); say('Loading paused. Resume loading to continue. Motion is unchanged.'); });
  listen(find('[data-graph-resume]'), 'click', () => { loadingPaused = false; if (nextCursor) void load({ cursor: nextCursor, append: true }); else void load(); });
  listen(find('[data-graph-restart]'), 'click', () => { loadingPaused = false; void load(); });
  listen(find('[data-graph-graphics-retry]'), 'click', () => {
    view?.destroy(); view = null; createView();
    if (!graphicsAvailable) return;
    find('[data-graph-graphics-retry]').hidden = true; listMode = false;
    if (page) { view.setGraph(page, currentPath); view.setSelection(selected, focused); view.fit(); }
    presentation();
  });
  const displayForces = () => {
    for (const slider of root.querySelectorAll('[data-graph-force]')) {
      const name = slider.dataset.graphForce; slider.value = String(forces[name]);
      slider.setAttribute('aria-valuetext', `${forces[name]} times default`);
      find(`[data-graph-force-value="${name}"]`).textContent = `${forces[name]}×`;
    }
  };
  for (const slider of root.querySelectorAll('[data-graph-force]')) listen(slider, 'input', () => {
    forces = { ...forces, [slider.dataset.graphForce]: Number(slider.value) }; saveForces(storage, forces); displayForces(); view?.setForces(forces);
  });
  listen(find('[data-graph-forces-reset]'), 'click', () => { forces = { ...DEFAULT_FORCES }; saveForces(storage, forces); displayForces(); view?.setForces(forces); });
  displayForces();
  listen(find('[data-graph-help-toggle]'), 'click', toggleHelp);
  // Returning from a hidden tab must revalidate retained private evidence.
  listen(document, 'visibilitychange', () => { if (document.hidden) { sequence++; cancelAutomatic(); request?.abort(); request = null; pendingPositions = pendingVersion = null; clearEvidence(); } else if (!closed && !loadingPaused) void load(); });
  listen(window, 'pagehide', () => { sequence++; cancelAutomatic(); clearTimeout(debounce); debounce = null; request?.abort(); request = null; pendingPositions = pendingVersion = null; clearEvidence(); view?.stop(); });
  listen(window, 'pageshow', event => { if (event.persisted && !closed && !loadingPaused) void load(); });
  find('[data-graph-controls]').hidden = false; find('[data-graph-clear]').hidden = false;
  find('[data-graph-list-toggle]').hidden = false;
  createView();
  find('[data-graph-pause]').setAttribute('aria-pressed', String(view?.paused || false));
  view?.setBloom(find('[data-graph-bloom]').value); presentation();
  activeParams = parameters();
  if (initial) { accept(initial, { fit: true }); automaticallyContinue(); } else void load({ fit: true });
  return {
    focusSearch,
    focusNavigation() { if (listMode) find('[data-graph-list-toggle]').focus({ preventScroll: true }); else map.focus({ preventScroll: true }); },
    destroy() { closed = true; sequence++; detailSequence++; clearTimeout(debounce); cancelAutomatic(); request?.abort(); detailRequest?.abort(); life.abort(); view?.destroy(); pendingPositions = pendingVersion = null; pages.clear(); page = null; nextCursor = null;
      find('[data-graph-nodes]').replaceChildren(); find('[data-graph-edges]').replaceChildren();
      details.replaceChildren(); find('[data-graph-summary]').textContent = ''; say('');
    },
  };
}
const direct = document.querySelector('[data-graph-page]');
if (direct) {
  try {
    mountGraph(direct, { currentPath: direct.dataset.graphPath, initial: JSON.parse(document.querySelector('#graph-initial-data').textContent),
      onClose: () => { const path = direct.dataset.graphPath; location.assign(path ? linkTo(path) : '/'); } });
    direct.querySelector('[data-graph-server-list]').hidden = true;
  } catch { /* Keep the server-rendered connection list. */ }
}
