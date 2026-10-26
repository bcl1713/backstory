import { mountFileTree } from './file-tree.js';

const zenToggle = document.querySelector('[data-zen-toggle]');
if (zenToggle) {
  document.body.classList.add('zen-enabled');
  zenToggle.hidden = false;
  const setChrome = open => {
    document.body.classList.toggle('chrome-open', open);
    zenToggle.setAttribute('aria-expanded', String(open));
    const navigation = document.querySelector('[data-site-navigation]');
    if (navigation) navigation.open = open;
    if (open) {
      document.querySelector('[data-site-navigation] a')?.focus();
    } else {
      const parent = document.querySelector('[data-markdown-editor]');
      if (parent?.markdownEditor && !parent.hidden) parent.markdownEditor.focus();
      else document.querySelector('#source')?.focus();
    }
    document.dispatchEvent(new Event('zen-navigation-change'));
  };
  zenToggle.addEventListener('click', () => setChrome(zenToggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.code === 'Period') {
      event.preventDefault();
      event.stopPropagation();
      setChrome(zenToggle.getAttribute('aria-expanded') !== 'true');
    } else if (event.key === 'Escape' && zenToggle.getAttribute('aria-expanded') === 'true') {
      // A formatting proposal owns Escape first; its handler returns focus.
      const proposal = document.querySelector('[data-format-proposal]');
      if (proposal && !proposal.hidden) return;
      event.preventDefault();
      setChrome(false);
    }
  }, true);
}
const navigation = document.querySelector('[data-site-navigation]');
if (navigation && !zenToggle) {
  const media = matchMedia('(min-width: 601px)');
  const resize = () => { navigation.open = media.matches; };
  resize();
  media.addEventListener('change', resize);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navigation.open && !media.matches) {
      navigation.open = false;
      navigation.querySelector('summary').focus();
    }
  });
}
const pathElement = document.querySelector('#note-path');
const folderElement = document.querySelector('#note-folder');
const sidebar = document.querySelector('[data-folder-sidebar]');
const path = pathElement ? JSON.parse(pathElement.textContent) : '';
const folder = path ? path.split('/').slice(0, -1).join('/') : folderElement ? JSON.parse(folderElement.textContent) : new URLSearchParams(location.search).get('folder') || '';
if (sidebar) mountFileTree(sidebar, path, folder);
if (pathElement) {
  const folderHref = path => '/?' + new URLSearchParams({ folder: path });
  const link = (text, href) => { const a = document.createElement('a'); a.textContent = text; a.href = href; return a; };
  const breadcrumb = document.querySelector('[data-breadcrumb]');
  breadcrumb.append(link('Wiki', '/'));
  const parts = (path || folder).split('/').filter(Boolean);
  parts.forEach((part, index) => {
    breadcrumb.append(document.createTextNode(' / '));
    if (path && index === parts.length - 1) breadcrumb.append(document.createTextNode(part));
    else breadcrumb.append(link(part, folderHref(parts.slice(0, index + 1).join('/'))));
  });
}

// Explicit browser-local calendar date: never substitute the server's date.
const noteNavigation = document.querySelector('[data-note-navigation]');
if (noteNavigation) {
  let busy = false;
  const refresh = async () => {
    const now = new Date();
    const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (busy) return;
    busy = true;
    const context = noteNavigation.querySelector('[data-today-context]');
    const today = noteNavigation.querySelector('[data-today-result]');
    const recent = noteNavigation.querySelector('[data-recent-notes]');
    const status = noteNavigation.querySelector('[data-recent-status]');
    context.textContent = `Today · ${day} · ${timezone} (browser timezone)`;
    today.textContent = 'Looking for today’s existing note…';
    try {
      const response = await fetch('/navigation/?' + new URLSearchParams({ date: day, timezone }), { credentials: 'same-origin', cache: 'no-store', redirect: 'error' });
      if (!response.ok) throw new Error();
      const result = await response.json();
      today.replaceChildren();
      if (result.today.href) {
        const link = document.createElement('a');
        link.textContent = 'Today';
        link.href = result.today.href;
        today.append(link);
      } else today.textContent = `Today: ${result.today.state}. No note was created.`;
      recent.replaceChildren();
      for (const note of result.recent) {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.textContent = note.title;
        link.href = note.href;
        link.title = note.path;
        li.append(link);
        recent.append(li);
      }
      status.textContent = `Index ${result.index_state}. ${result.recent.length ? 'Up to five existing notes, by indexed modification time.' : 'No recent notes available.'}`;
    } catch {
      today.textContent = 'Today unavailable. Check storage or sign in again.';
      recent.replaceChildren();
      status.textContent = 'Recent notes unavailable.';
    } finally { busy = false; }
  };
  refresh();
  window.addEventListener('focus', refresh);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  navigation?.addEventListener('toggle', () => { if (navigation.open) refresh(); });
  document.addEventListener('zen-navigation-change', refresh);
}
