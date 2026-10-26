const navigation = document.querySelector('[data-site-navigation]');
if (navigation) {
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
if (pathElement && sidebar) {
  const path = JSON.parse(pathElement.textContent);
  const folder = path ? path.split('/').slice(0, -1).join('/') : JSON.parse(folderElement.textContent);
  const encode = path => path.split('/').map(encodeURIComponent).join('/');
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
  const list = document.createElement('ul');
  sidebar.append(link('Wiki root', '/'), link('New note in this folder', '/new/?' + new URLSearchParams({ folder })), list);
  // Exactly one bounded parent-folder page; no recursive tree or index request.
  fetch('/folders/' + encode(folder), { credentials: 'same-origin', cache: 'no-store', redirect: 'error' })
    .then(response => { if (!response.ok) throw new Error(); return response.json(); })
    .then(page => {
      for (const entry of page.entries) {
        const item = document.createElement('li');
        item.append(link(entry.name, entry.kind === 'folder' ? folderHref(entry.path) : (entry.path.toLowerCase().endsWith('.md') ? '/notes/' : '/attachments/') + encode(entry.path)));
        list.append(item);
      }
      if (page.next_cursor) sidebar.append(link('More in this folder', '/?' + new URLSearchParams({ folder, cursor: page.next_cursor })));
    })
    .catch(() => { const message = document.createElement('p'); message.textContent = 'Folder unavailable. Use Storage status to retry.'; sidebar.append(message); });
} else if (sidebar) sidebar.hidden = true;
