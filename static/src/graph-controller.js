import { GraphView } from './graph-view.js';

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
  Array.isArray(page.nodes) && page.nodes.length <= 200 && Array.isArray(page.edges) && page.edges.length <= 500 &&
  page.nodes.every(safeNote) &&
  page.edges.every(edge => typeof edge.source === 'string' && typeof edge.destination === 'string');

async function readJSON(url, signal) {
  const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal, headers: { Accept: 'application/json' } });
  if (response.redirected || new URL(response.url).origin !== location.origin || !response.headers.get('content-type')?.startsWith('application/json')) throw new Error('invalid_response');
  const data = await response.json();
  if (!response.ok) throw new Error(response.status === 401 ? 'authentication_required' : data.restart ? 'restart_required' : data.reason_code || 'graph_unavailable');
  if (data.untrusted_content !== true) throw new Error('invalid_response');
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
  const say = text => { status.textContent = text; };
  let closed = false, sequence = 0, detailSequence = 0, request = null, detailRequest = null, debounce;
  let page = null, selected = currentPath || null, focused = currentPath || null;
  let listMode = matchMedia('(max-width: 650px)').matches, trail = [], nextCursor = null;
  let view = null;
  find('[data-graph-filter-options]').open = !listMode;
  find('[data-graph-map-options]').open = !listMode;
  const focusSearch = () => { find('[data-graph-filter-options]').open = true; input('query').focus({ preventScroll: true }); };

  const parameters = () => {
    const values = Object.fromEntries(new FormData(form));
    if (!values.path) delete values.path;
    return values;
  };
  const open = path => {
    if (!path || !page?.nodes.some(node => node.path === path)) return;
    // A real, connected anchor enters the same draft/conflict guard as the
    // editor's existing gf command. Selection itself never navigates or saves.
    const anchor = element('a', '', { href: linkTo(path), hidden: '' });
    panel.append(anchor); try { anchor.click(); } finally { anchor.remove(); }
  };
  const toggleHelp = () => { find('[data-graph-help]').hidden = !find('[data-graph-help]').hidden; };
  const escape = () => {
    if (!find('[data-graph-help]').hidden) { find('[data-graph-help]').hidden = true; return; }
    onClose();
  };
  try {
    view = new GraphView(map, {
      onSelect: (path, focus) => select(path, focus), onOpen: open, onCenter: path => center(path),
      onSearch: focusSearch, onEscape: escape, onHelp: toggleHelp,
      onPause: paused => { find('[data-graph-pause]').setAttribute('aria-pressed', String(paused)); },
      onLimit: () => say('Layout work limit reached; positions frozen. Navigation and evidence remain available.'),
    });
  } catch {
    listMode = true; say('Map unavailable. The connection list has the same relationships and navigation.');
  }

  function presentation() {
    panel.classList.toggle('graph-list-mode', listMode);
    find('[data-graph-list]').hidden = !listMode;
    map.hidden = listMode;
    if (listMode) view?.stop(); else view?.wake();
    find('[data-graph-list-toggle]').setAttribute('aria-pressed', String(listMode));
  }

  function renderList() {
    const activePath = document.activeElement?.dataset.graphInspect;
    const list = find('[data-graph-nodes]'); list.replaceChildren();
    for (const node of [...page.nodes].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0)) {
      const li = element('li');
      const inspect = element('button', `Inspect ${node.title}`, { type: 'button', 'data-graph-inspect': node.path, 'aria-pressed': String(node.path === selected) });
      listen(inspect, 'click', () => select(node.path, false));
      const openLink = element('a', `Open ${node.path}`, { href: node.href });
      if (node.path === currentPath) openLink.setAttribute('aria-current', 'page');
      const recenter = element('button', `Center ${node.path}`, { type: 'button' });
      listen(recenter, 'click', () => center(node.path));
      li.append(element('strong', node.title), element('div', node.path), inspect, openLink, recenter); list.append(li);
      if (activePath === node.path) inspect.focus({ preventScroll: true });
    }
    if (!page.nodes.length) list.append(element('li', 'No indexed connections observed in this response. Check freshness and limits.'));
    const edges = find('[data-graph-edges]'); edges.replaceChildren();
    for (const edge of page.edges) edges.append(element('li', `${edge.source} → ${edge.destination} · ${edge.occurrence_count} occurrence${edge.occurrence_count === 1 ? '' : 's'} · advisory line ${edge.position?.[0] || '?'} · indexed revision ${edge.source_revision}`));
    if (!page.edges.length) edges.append(element('li', 'No directed links in this response.'));
    const next = find('[data-graph-next]'); next.hidden = !nextCursor;
  }

  function showDetails(path) {
    const ticket = ++detailSequence;
    detailRequest?.abort(); detailRequest = new AbortController();
    const node = page?.nodes.find(node => node.path === path);
    details.replaceChildren(element('h2', 'Selected note'));
    if (!node) { details.append(element('p', 'No selection in this displayed graph. Select a note to inspect it.')); return; }
    details.append(element('h3', node.title), element('p', path),
      element('a', 'Open selected note', { href: node.href }), element('p', `Indexed revision ${node.revision}`));
    const centerButton = element('button', 'Center selected note', { type: 'button' });
    listen(centerButton, 'click', () => center(path)); details.append(centerButton);
    const freshness = element('p', 'Reading incoming and outgoing indexed evidence…'); details.append(freshness);
    const incoming = element('ul'), outgoing = element('ul');
    details.append(element('h3', 'Incoming'), incoming, element('h3', 'Outgoing and references'), outgoing);
    let displayed = 0;
    async function loadEvidence(cursor) {
      try {
        const query = new URLSearchParams({ path, direction: 'both', limit: '50', ...(cursor ? { cursor } : {}) });
        const evidence = await readJSON('/tools/links/?' + query, detailRequest.signal);
        if (closed || ticket !== detailSequence || selected !== path) return;
        if (!Array.isArray(evidence.items) || evidence.items.length > 100) throw new Error('invalid_response');
        freshness.textContent = `Index ${evidence.freshness.state} · ${evidence.projection_complete ? 'completed relation epoch' : 'incomplete evidence'} ${evidence.relation_epoch} · observed ${evidence.observed_at}. Fragment existence is unchecked. Source locations are advisory.`;
        for (const item of evidence.items) {
          const li = element('li');
          li.append(element('span', `${item.source} → ${item.destination || item.target || '(same note)'} · ${item.state} · ${item.occurrence_kind}/${item.kind}`));
          li.append(element('div', `Target: ${item.target}${item.fragment ? '#' + item.fragment : ''} · ${item.position_precision} line ${item.position[0] || '?'}, column ${item.position[1] || '?'}`));
          li.append(element('code', item.source_revision));
          if (item.source !== path) li.append(element('a', `Open source ${item.source}`, { href: linkTo(item.source) }));
          if (item.destination && item.resource_type === 'note') li.append(element('a', `Open destination ${item.destination}`, { href: linkTo(item.destination) }));
          if (item.choices?.length) li.append(element('p', `Eligible ambiguity choices: ${item.choices.join(', ')}`));
          (item.source === path ? outgoing : incoming).append(li); displayed++;
        }
        if (!displayed) outgoing.append(element('li', 'No indexed connections observed in this page. This does not prove the disk is unchanged.'));
        if (evidence.next_cursor && displayed < 200) {
          const more = element('button', 'More connection evidence', { type: 'button' });
          listen(more, 'click', () => { more.remove(); void loadEvidence(evidence.next_cursor); }); details.append(more);
        } else if (evidence.next_cursor) details.append(element('p', 'Detail display limit reached. Use the paged links tool to continue.'));
      } catch (error) {
        if (!closed && ticket === detailSequence && error.name !== 'AbortError') freshness.textContent = `Connection evidence unavailable (${error.message}). Refresh or sign in again; your editor remains unchanged.`;
      }
    }
    void loadEvidence();
  }

  function select(path, takeFocus) {
    if (!page?.nodes.some(node => node.path === path)) return;
    selected = path;
    if (takeFocus) focused = path;
    view?.setSelection(selected, focused);
    renderList(); showDetails(path);
    say(`Selected ${path}. Inspecting saved links; Enter on the map opens it.`);
  }

  function accept(data, fit = false) {
    if (!safePage(data)) throw new Error('invalid_response');
    page = data; nextCursor = data.next_cursor;
    if (!page.nodes.some(node => node.path === selected)) selected = null;
    if (!page.nodes.some(node => node.path === focused)) focused = page.nodes[0]?.path || null;
    view?.setGraph(page, currentPath); view?.setSelection(selected, focused);
    if (fit) view?.fit();
    renderList(); showDetails(selected); presentation();
    find('[data-graph-summary]').textContent = `${page.nodes.length} notes · ${page.edges.length} directed links · Index ${page.freshness.state} · relation epoch ${page.relation_epoch} · ${page.projection_complete ? 'projection complete' : 'incomplete evidence'} · observed ${page.observed_at}.${page.limiting_reasons.length ? ' Limits: ' + page.limiting_reasons.join(', ') + '.' : ''}${page.boundary_connections ? ' Some eligible connections are outside these filters.' : ''} Limits: 200 notes / 500 edges. Indexed saved content; unsaved source excluded. Not a disk snapshot.`;
    say(`${page.nodes.length} indexed notes loaded${page.projection_complete ? '' : '; evidence is incomplete'}. ${selected ? `Selected ${selected}.` : 'Select a note to inspect it.'}`);
  }

  async function load({ cursor, fit = false } = {}) {
    clearTimeout(debounce); const ticket = ++sequence;
    request?.abort(); request = new AbortController(); say('Loading saved relationship evidence…');
    try {
      const params = parameters(); if (cursor) params.cursor = cursor;
      const data = await readJSON('/tools/graph/?' + new URLSearchParams(params), request.signal);
      if (!closed && ticket === sequence) accept(data, fit);
    } catch (error) {
      if (!closed && ticket === sequence && error.name !== 'AbortError') say(`Graph unavailable (${error.message}). Refresh evidence or sign in again. Existing editor source is retained.`);
    }
  }

  function center(path) {
    if (!path) return;
    const previous = input('path').value;
    if (previous !== path) { if (previous) trail.push(previous); trail = trail.slice(-20); }
    input('path').value = path; find('[data-graph-back]').disabled = !trail.length;
    void load({ fit: true });
  }

  listen(form, 'submit', event => { event.preventDefault(); void load(); });
  listen(input('query'), 'input', () => { clearTimeout(debounce); debounce = setTimeout(() => { void load(); }, 180); });
  listen(root, 'keydown', event => {
    if (event.key !== 'Escape' || event.isComposing || event.ctrlKey || event.altKey || event.metaKey) return;
    if (!find('[data-graph-help]').hidden) { event.preventDefault(); event.stopImmediatePropagation(); toggleHelp(); return; }
    if (form.contains(event.target)) {
      event.preventDefault(); event.stopImmediatePropagation(); clearTimeout(debounce); sequence++; request?.abort();
      if (matchMedia('(max-width: 650px)').matches) find('[data-graph-filter-options]').open = false;
      if (listMode) find('[data-graph-list-toggle]').focus(); else map.focus({ preventScroll: true });
      say('Search focus ended. Selection retained. Escape closes the graph.');
    } else if (event.target !== map) { event.preventDefault(); event.stopImmediatePropagation(); escape(); }
  });
  listen(find('[data-graph-clear]'), 'click', () => { input('query').value = ''; void load(); });
  listen(find('[data-graph-local]'), 'click', () => center(selected || currentPath));
  listen(find('[data-graph-global]'), 'click', () => { input('path').value = ''; void load({ fit: true }); });
  listen(find('[data-graph-back]'), 'click', () => { input('path').value = trail.pop() || currentPath; find('[data-graph-back]').disabled = !trail.length; void load({ fit: true }); });
  listen(find('[data-graph-list-toggle]'), 'click', () => { listMode = !listMode || !view; presentation(); });
  listen(find('[data-graph-fit]'), 'click', () => view?.fit());
  for (const button of root.querySelectorAll('[data-graph-zoom]')) listen(button, 'click', () => view?.zoom(Number(button.dataset.graphZoom)));
  const pans = { left: [-80, 0], right: [80, 0], up: [0, -80], down: [0, 80] };
  for (const button of root.querySelectorAll('[data-graph-pan]')) listen(button, 'click', () => view?.pan(...pans[button.dataset.graphPan]));
  listen(find('[data-graph-pause]'), 'click', () => view?.setPaused(!view.paused));
  listen(find('[data-graph-bloom]'), 'input', event => {
    view?.setBloom(event.target.value); find('[data-graph-bloom-value]').textContent = ['Off', 'Restrained', 'High'][Number(event.target.value)];
  });
  listen(find('[data-graph-refresh]'), 'click', () => { void load(); });
  listen(find('[data-graph-next]'), 'click', () => { if (nextCursor) void load({ cursor: nextCursor }); });
  listen(find('[data-graph-help-toggle]'), 'click', toggleHelp);
  find('[data-graph-controls]').hidden = false; find('[data-graph-clear]').hidden = false;
  find('[data-graph-pause]').setAttribute('aria-pressed', String(view?.paused || false));
  view?.setBloom(find('[data-graph-bloom]').value); presentation();
  if (initial) accept(initial); else void load();
  return {
    focusSearch,
    focusNavigation() { if (listMode) find('[data-graph-list-toggle]').focus({ preventScroll: true }); else map.focus({ preventScroll: true }); },
    destroy() { closed = true; sequence++; detailSequence++; clearTimeout(debounce); request?.abort(); detailRequest?.abort(); life.abort(); view?.destroy(); },
  };
}

const direct = document.querySelector('[data-graph-page]');
if (direct) {
  try {
    mountGraph(direct, { currentPath: direct.dataset.graphPath, initial: JSON.parse(document.querySelector('#graph-initial-data').textContent),
      onClose: () => { const path = direct.dataset.graphPath; if (path) location.assign(linkTo(path)); else location.assign('/'); } });
    direct.querySelector('[data-graph-server-list]').hidden = true;
  } catch { /* The server-rendered connection list remains fully usable. */ }
}
