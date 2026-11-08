import { GraphView } from './graph-view.js';
import { GraphSnapshot } from './graph-snapshot.js';
import { indexProgress } from './graph-index-status.js';
import { DEFAULT_FORCES, loadForces, saveForces } from './graph-preferences.js';

let preferredList = false;
const linkTo = path => '/notes/' + path.split('/').map(encodeURIComponent).join('/');
const element = (name, text, attributes = {}) => {
  const el = document.createElement(name);
  if (text !== undefined) el.textContent = text;
  for (const [key, value] of Object.entries(attributes)) el.setAttribute(key, String(value));
  return el;
};
async function readJSON(url, signal) {
  const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal, headers: { Accept: 'application/json' } });
  if (response.redirected || new URL(response.url).origin !== location.origin || !response.headers.get('content-type')?.startsWith('application/json')) throw new Error('invalid_response');
  const data = await response.json();
  if (!response.ok) throw new Error(response.status === 401 ? 'authentication_required' : data.restart ? 'restart_required' : data.reason_code || 'graph_unavailable');
  if (data.untrusted_content !== true) throw new Error('invalid_response');
  if (data.state === 'unavailable' || data.freshness?.state === 'unavailable') throw new Error(data.reason_code || 'storage_unavailable');
  return data;
}

export function mountGraph(root, { currentPath = '', onClose = () => {} } = {}) {
  const find = selector => root.querySelector(selector);
  const panel = find('[data-graph-panel]') || root;
  const form = find('[data-graph-filters]');
  const input = name => form.elements.namedItem(name);
  const status = find('[data-graph-status]');
  const details = find('[data-graph-details]');
  const indexDisclosure = find('[data-graph-index-status]'), indexText = find('[data-graph-index-progress]');
  if (indexDisclosure) indexDisclosure.open = false;
  if (indexText) indexText.textContent = 'Open for current indexing progress.';
  let indexTimer, indexRequest;
  const stopIndexProgress = () => { clearTimeout(indexTimer); indexRequest?.abort(); indexRequest = null; };
  async function refreshIndexProgress() {
    stopIndexProgress();
    if (!indexDisclosure?.open || closed) return;
    const controller = new AbortController(); indexRequest = controller;
    try {
      const response = await fetch('/index/status/', { credentials:'same-origin',cache:'no-store',redirect:'error',signal:controller.signal,headers:{Accept:'application/json'} });
      if (!response.ok || response.redirected || new URL(response.url).origin !== location.origin || !response.headers.get('content-type')?.startsWith('application/json')) throw new Error('status_unavailable');
      const data = await response.json();
      if (!controller.signal.aborted && indexDisclosure.open && !closed) indexText.textContent = indexProgress(data);
    } catch (error) {
      if (!controller.signal.aborted) indexText.textContent = 'Index progress is unavailable. Refresh or sign in again to try.';
    } finally {
      if (indexRequest === controller) { indexRequest = null; if (indexDisclosure.open && !closed) indexTimer = setTimeout(refreshIndexProgress, 2000); }
    }
  }
  const map = find('[data-graph-map]');
  const life = new AbortController();
  const listen = (el, name, fn, options = {}) => el.addEventListener(name, fn, { ...options, signal: life.signal });
  const say = text => { if (status.textContent !== text) status.textContent = text; };
  const snapshot = new GraphSnapshot(location.origin);
  let closed = false, sequence = 0, request = null, debounce = null, refreshTimer = null;
  let page = null, selected = currentPath || null, focused = currentPath || null;
  let listMode = preferredList, graphicsAvailable = true, trail = [], activeParams = null;
  let pendingPositions = null, suspendedSelection = null;
  let view = null, loadingPaused = false, loadingError = false, loadingReason = '';
  let storage; try { storage = window.localStorage; } catch { /* Preferences remain page-local. */ }
  let forces = loadForces(storage);
  const cancelAutomatic = () => { clearTimeout(refreshTimer); refreshTimer = null; };
  const wholeWiki = () => !activeParams?.path;
  const filterKey = params => JSON.stringify(['folder', 'tag', 'query'].map(key => params?.[key] || ''));
  const scheduleRefresh = () => {
    cancelAutomatic();
    if (!closed && !document.hidden) refreshTimer = setTimeout(() => { refreshTimer = null; void load(); }, 15000);
  };
  if (indexDisclosure) listen(indexDisclosure, 'toggle', () => { if (indexDisclosure.open) void refreshIndexProgress(); else stopIndexProgress(); });

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
        onSearch: focusSearch, onEscape: escape, onHelp: toggleHelp, onHint:say,
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
    if (listMode) view?.stop(); else { view?.draw(); view?.wake(); }
    find('[data-graph-list-toggle]').setAttribute('aria-pressed', String(listMode));
    find('[data-graph-hints]').disabled = listMode || !graphicsAvailable;
  }
  function controls() {
    const global = wholeWiki(), depth = Number(input('depth').value), filters = ['query', 'folder', 'tag'].filter(name => (activeParams?.[name] || '').trim());
    find('[data-graph-cancel]').hidden = loadingPaused || loadingError || !(request);
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
      request ? 'Loading…' : snapshot.complete ? 'Complete' :
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
      request ? 'Loading connections…' : page && snapshot.complete ? 'No notes match this scope.' : 'Loaded available results. Relationships are still updating.'));
    const edges = find('[data-graph-edges]'); edges.replaceChildren();
    for (const edge of (page?.edges || []).slice(edgeOffset, edgeOffset + listWindow)) edges.append(element('li', `${edge.source} → ${edge.destination} · ${edge.occurrence_count} occurrence${edge.occurrence_count === 1 ? '' : 's'}`));
  }
  function clearEvidence({ suspend = false } = {}) {
    if (suspend) snapshot.suspend(); else { snapshot.clear(); pendingPositions = suspendedSelection = null; }
    page = null; selected = focused = null; nodeOffset = edgeOffset = 0;
    // Hidden-tab draw is intentionally skipped by the renderer. Keep its old
    // pixels concealed until accepted evidence has been drawn again.
    if (suspend) map.hidden = true;
    details.replaceChildren(element('h2', 'Selected note'), element('p', 'Select a note to see its connections.'));
    find('[data-graph-diagnostics]').textContent = '';
    view?.setGraph({ nodes: [], edges: [] }, currentPath, activeParams?.path || null); view?.setSelection(null, null);
    renderList(); controls();
  }
  function suspendEvidence() {
    // Coordinates and expansion identities can survive only a successful check
    // in the same opaque scope. Labels, revisions and edge evidence cannot.
    if (page && view) {
      pendingPositions = new Map(view.simulation.nodes);
      suspendedSelection = { selected, focused, navigationFocus: map.contains(document.activeElement) };
    }
    clearEvidence({ suspend:true });
  }
  function showDetails(path) {
    const node = snapshot.nodes.get(path);
    details.replaceChildren(element('h2', 'Selected note'));
    if (!node) { details.append(element('p', 'Select a note to see its connections.')); return; }
    details.append(element('h3', node.title), element('p', path), element('a', 'Open selected note', { href: node.href }));
    const centerButton = element('button', 'Expand selected note', { type: 'button' });
    centerButton.addEventListener('click', () => center(path)); details.append(centerButton);
    details.append(element('p', snapshot.complete ? 'Saved connections' : 'Updating saved connections'));
    const connections = snapshot.connections(path);
    for (const [direction, title] of [['incoming','Incoming'], ['outgoing','Outgoing and references']]) {
      const list = element('ul'); details.append(element('h3', title), list);
      for (const edge of connections[direction]) {
        const other = direction === 'incoming' ? edge.source : edge.destination;
        const row = element('li', `${other} · ${edge.occurrence_count} occurrence${edge.occurrence_count === 1 ? '' : 's'}`);
        row.append(element('a', direction === 'incoming' ? 'Open source' : 'Open destination', {href:snapshot.nodes.get(other).href}));
        const evidence = element('details'); evidence.append(element('summary', 'Source evidence'),
          element('p', `${edge.source} · ${edge.position_precision || 'advisory'} line ${edge.position?.[0] || '?'}, column ${edge.position?.[1] || '?'}`),
          element('code', edge.source_revision || ''));
        row.append(evidence); list.append(row);
      }
      if (!connections[direction].length) list.append(element('li', snapshot.complete ? 'No saved connections.' : 'Connections are still updating.'));
    }
    const evidence = element('details'); evidence.append(element('summary', 'Technical evidence'),
      element('p', `Indexed revision ${node.revision} · relation epoch ${page.relation_epoch} · observed ${page.observed_at}. Source locations are advisory; fragments are unchecked. Snapshot contains resolved note connections.`));
    details.append(evidence);
  }
  function renderExploration({ fit = false } = {}) {
    page = snapshot.explore(activeParams.path || null, activeParams.depth);
    if (!page) return;
    if (!page.nodes.some(node => node.path === selected)) selected = page.nodes.some(node => node.path === activeParams.path) ? activeParams.path : null;
    if (!page.nodes.some(node => node.path === focused)) focused = selected || page.nodes[0]?.path || null;
    let mapFailure = false;
    try {
      view?.setGraph(page, currentPath, activeParams.path || null);
      view?.setSelection(selected, focused);
    } catch { mapFailure = true; unavailable(); }
    if (fit && page.nodes.length && !mapFailure && !view?.cameraControlled) view?.fit();
    renderList(); showDetails(selected); presentation(); controls();
    find('[data-graph-diagnostics]').textContent = `Index ${page.freshness.state} · relation epoch ${page.relation_epoch} · observed ${page.observed_at}. ${page.limiting_reasons.join(', ')} Indexed saved content, not a disk snapshot. Hops refer to loaded edges; unsaved edits are excluded.`;
    if (!view?.hints?.active) say(mapFailure ? 'Map resource limit reached. All loaded records remain available in the connection list.' : '');
  }
  function select(path, takeFocus) {
    if (!page?.nodes.some(node => node.path === path)) return;
    selected = path; if (takeFocus) focused = path;
    if (activeParams.path) snapshot.expand(path);
    renderExploration(); say(`Selected ${path}. Enter on the map opens it.`);
  }
  function updateExploration({ fit = false } = {}) {
    const params = parameters();
    if (!snapshot.data || filterKey(params) !== filterKey(activeParams)) { void load({fit}); return; }
    activeParams = params; renderExploration({fit});
  }
  async function load({ fit = false } = {}) {
    if (closed || document.hidden) return;
    clearTimeout(debounce); debounce = null; cancelAutomatic(); const ticket = ++sequence;
    request?.abort(); const controller = new AbortController(); request = controller;
    loadingPaused = false; loadingError = false; loadingReason = '';
    const params = parameters();
    if (activeParams && filterKey(params) !== filterKey(activeParams)) clearEvidence();
    activeParams = params;
    say(page ? 'Updating connections…' : 'Loading connections…'); controls();
    try {
      const query = new URLSearchParams();
      for (const key of ['folder','tag','query']) if (params[key]?.trim()) query.set(key,params[key]);
      const data = await readJSON('/tools/graph/snapshot/?' + query, controller.signal);
      if (closed || document.hidden || controller.signal.aborted || ticket !== sequence) return;
      const hadScope = snapshot.scope !== null;
      const sameScope = snapshot.accept(data);
      const restoreNavigationFocus = sameScope && suspendedSelection?.navigationFocus;
      if (!sameScope && hadScope) {
        pendingPositions = suspendedSelection = null; selected = focused = null;
        view?.setGraph({nodes:[],edges:[]},currentPath,activeParams.path || null);
      }
      if (sameScope && pendingPositions && view) {
        for (const node of data.nodes) if (pendingPositions.has(node.path)) view.simulation.nodes.set(node.path,pendingPositions.get(node.path));
        selected = suspendedSelection?.selected || selected; focused = suspendedSelection?.focused || focused;
      }
      pendingPositions = suspendedSelection = null;
      // Depth/root may have changed locally while the transport was in flight.
      activeParams = parameters(); renderExploration({fit});
      if (restoreNavigationFocus && !listMode) map.focus({preventScroll:true});
    } catch (error) {
      if (!closed && ticket === sequence && !controller.signal.aborted) {
        loadingError = true; loadingReason = error.message; clearEvidence();
        say(error.message === 'authentication_required' ? 'Session expired. Sign in again to load the graph.' :
          error.message === 'restart_required' ? 'Connections changed. Restart loading to revalidate this view.' :
          error.message === 'graph_query_limited' ? 'The graph query limit was reached. Try narrower filters or restart loading.' :
          error.message === 'graph_database_error' ? 'Connections could not load because of a database error. Refresh to try again.' :
          'Unable to load connections. Restart loading to try again.');
      }
    } finally {
      if (ticket === sequence) { request = null; controls(); scheduleRefresh(); }
    }
  }
  function center(path) {
    if (!path) return;
    if (activeParams?.path) { select(path, true); return; }
    input('path').value = currentPath || path;
    loadingPaused = false; updateExploration({ fit:true });
  }
  listen(form, 'submit', event => { event.preventDefault(); loadingPaused = false; void load({ fit: true }); });
  for (const name of ['query', 'folder', 'tag']) listen(input(name), 'input', () => { clearTimeout(debounce); cancelAutomatic(); sequence++; request?.abort(); request = null; loadingPaused = false; clearEvidence(); debounce = setTimeout(() => { debounce = null; void load(); }, 180); });
  listen(input('path'), 'input', () => updateExploration());
  listen(input('depth'), 'change', () => updateExploration());
  function changeDepth(delta) {
    if (!input('path').value) { say('Hop depth applies to a local neighborhood. Choose Local first.'); return; }
    const next = Number(input('depth').value) + delta;
    if (next < 1 || next > 8) { say(next < 1 ? 'Minimum local depth is one hop.' : 'Maximum local depth is eight hops; query resource limits may make the view partial.'); return; }
    input('depth').value = String(next); updateExploration();
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
  listen(find('[data-graph-local]'), 'click', () => { if (!activeParams?.path) center(currentPath || selected); });
  listen(find('[data-graph-global]'), 'click', () => { input('path').value = ''; input('depth').disabled = false; updateExploration({ fit: true }); });
  listen(find('[data-graph-back]'), 'click', () => { loadingPaused = false; input('path').value = trail.pop() || currentPath; find('[data-graph-back]').disabled = !trail.length; updateExploration({ fit: true }); });
  listen(find('[data-graph-list-toggle]'), 'click', () => { view?.cancelHints(); listMode = !listMode || !graphicsAvailable; if (graphicsAvailable) preferredList = listMode; presentation(); });
  listen(find('[data-graph-hints]'), 'click', () => view?.hints?.active ? view.cancelHints(true) : view?.beginHints());
  listen(find('[data-graph-fit]'), 'click', () => view?.fit());
  listen(find('[data-graph-reset]'), 'click', () => view?.resetOrientation());
  for (const button of root.querySelectorAll('[data-graph-orbit]')) listen(button, 'click', () => view?.orbit(Number(button.dataset.graphOrbit), 0));
  for (const button of root.querySelectorAll('[data-graph-zoom]')) listen(button, 'click', () => view?.zoom(Number(button.dataset.graphZoom)));
  const pans = { left: [-80, 0], right: [80, 0], up: [0, -80], down: [0, 80] };
  for (const button of root.querySelectorAll('[data-graph-pan]')) listen(button, 'click', () => view?.pan(...pans[button.dataset.graphPan]));
  listen(find('[data-graph-pause]'), 'click', () => view?.setPaused(!view.paused));
  listen(find('[data-graph-bloom]'), 'input', event => {
    view?.setBloom(event.target.value);
    const label = ['Off', 'Default', 'High'][Number(event.target.value) / 2];
    event.target.setAttribute('aria-valuetext', label); find('[data-graph-bloom-value]').textContent = label;
  });
  listen(find('[data-graph-refresh]'), 'click', () => { loadingPaused = false; void load(); });
  listen(find('[data-graph-cancel]'), 'click', () => {
    loadingPaused = true; sequence++; cancelAutomatic(); request?.abort(); request = null;
    clearEvidence(); controls(); say('Loading paused. Resume loading to continue. Motion is unchanged.');
  });
  listen(find('[data-graph-resume]'), 'click', () => { loadingPaused = false; void load(); });
  listen(find('[data-graph-restart]'), 'click', () => { loadingPaused = false; void load(); });
  listen(find('[data-graph-graphics-retry]'), 'click', () => {
    view?.destroy(); view = null; createView();
    if (!graphicsAvailable) return;
    find('[data-graph-graphics-retry]').hidden = true; listMode = false;
    if (page) { view.setGraph(page, currentPath, activeParams?.path || null); view.setSelection(selected, focused); view.fit(); }
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
  listen(document, 'visibilitychange', () => { if (document.hidden) { stopIndexProgress(); sequence++; cancelAutomatic(); request?.abort(); request = null; suspendEvidence(); } else if (!closed) { if (indexDisclosure?.open) void refreshIndexProgress(); void load(); } });
  listen(window, 'pagehide', () => { stopIndexProgress(); sequence++; cancelAutomatic(); clearTimeout(debounce); debounce = null; request?.abort(); request = null; suspendEvidence(); view?.stop(); });
  listen(window, 'pageshow', event => { if (event.persisted && !closed) void load(); });
  find('[data-graph-hints]').hidden = false;
  find('[data-graph-controls]').hidden = false; find('[data-graph-clear]').hidden = false;
  find('[data-graph-list-toggle]').hidden = false;
  createView();
  find('[data-graph-pause]').setAttribute('aria-pressed', String(view?.paused || false));
  view?.setBloom(find('[data-graph-bloom]').value); presentation();
  activeParams = parameters();
  // Initial server data supports the fallback list only. Enhanced exploration
  // always starts with a newly authorized full snapshot.
  void load({ fit: true });
  return {
    focusSearch,
    focusNavigation() { if (listMode) find('[data-graph-list-toggle]').focus({ preventScroll: true }); else map.focus({ preventScroll: true }); },
    destroy() { closed = true; stopIndexProgress(); sequence++; clearTimeout(debounce); cancelAutomatic(); request?.abort(); life.abort(); view?.destroy(); pendingPositions = suspendedSelection = null; snapshot.clear(); page = null; selected = focused = null;
      find('[data-graph-nodes]').replaceChildren(); find('[data-graph-edges]').replaceChildren();
      for (const kind of ['notes', 'links']) {
        const navigation = find(`[data-graph-${kind}-navigation]`); navigation.replaceChildren(); navigation.hidden = true;
      }
      for (const name of ['nodeCount', 'edgeCount']) map.dataset[name] = '0';
      for (const name of ['root', 'selected', 'focused']) delete map.dataset[name];
      map.setAttribute('aria-label', '3D note relationship map');
      details.replaceChildren(); find('[data-graph-summary]').textContent = ''; find('[data-graph-diagnostics]').textContent = ''; say('');
    },
  };
}
const direct = document.querySelector('[data-graph-page]');
if (direct) {
  try {
    mountGraph(direct, { currentPath: direct.dataset.graphPath,
      onClose: () => { const path = direct.dataset.graphPath; location.assign(path ? linkTo(path) : '/'); } });
    direct.querySelector('[data-graph-server-list]')?.remove();
    document.querySelector('#graph-initial-data')?.remove();
    document.querySelector('#graph-initial-params')?.remove();
  } catch { /* Keep the server-rendered connection list. */ }
}
