const encode = path => path.split('/').map(encodeURIComponent).join('/');
const folderHref = path => '/?' + new URLSearchParams({ folder: path });
const link = (text, href) => {
  const anchor = document.createElement('a');
  anchor.textContent = text;
  anchor.href = href;
  return anchor;
};

export function mountFileTree(sidebar, currentPath, currentFolder) {
  const tree = sidebar.querySelector('[data-file-tree]');
  const newNote = link('New note in this folder', '/new/?' + new URLSearchParams({ folder: currentFolder }));
  sidebar.querySelector('[data-tree-actions]').append(newNote);

  function mountFolder(container, path) {
    const list = document.createElement('ul');
    const status = document.createElement('p');
    status.className = 'file-tree-status';
    status.setAttribute('role', 'status');
    const more = document.createElement('button');
    more.type = 'button';
    more.className = 'file-tree-more';
    more.hidden = true;
    container.append(list, status, more);
    let loaded = false;
    let busy = false;
    let cursor = null;
    let restart = false;

    async function load() {
      if (busy) return;
      busy = true;
      more.disabled = true;
      status.textContent = 'Loading files…';
      if (restart) {
        list.replaceChildren();
        cursor = null;
        restart = false;
      }
      try {
        const query = cursor ? '?' + new URLSearchParams({ cursor }) : '';
        const response = await fetch('/folders/' + encode(path) + query, { credentials: 'same-origin', cache: 'no-store', redirect: 'error' });
        if (!response.ok) {
          restart = response.status === 409;
          throw new Error();
        }
        const page = await response.json();
        for (const entry of page.entries) {
          const item = document.createElement('li');
          if (entry.kind === 'folder') {
            const branch = document.createElement('details');
            const summary = document.createElement('summary');
            summary.textContent = entry.name;
            summary.title = entry.path;
            const openFolder = link('Open folder', folderHref(entry.path));
            openFolder.className = 'file-tree-open-folder';
            branch.append(summary, openFolder);
            const child = mountFolder(branch, entry.path);
            branch.addEventListener('toggle', () => { if (branch.open && !child.loaded()) child.load(); });
            if (currentFolder === entry.path || currentFolder.startsWith(entry.path + '/')) {
              branch.classList.add('file-tree-current-folder');
              branch.open = true;
              child.load();
            }
            item.append(branch);
          } else {
            const anchor = link(entry.name, (entry.path.toLowerCase().endsWith('.md') ? '/notes/' : '/attachments/') + encode(entry.path));
            anchor.title = entry.path;
            if (entry.path === currentPath) anchor.setAttribute('aria-current', 'page');
            item.append(anchor);
          }
          list.append(item);
        }
        loaded = true;
        cursor = page.next_cursor;
        status.textContent = list.childElementCount ? '' : 'This folder is empty.';
        more.textContent = 'Show more';
        more.hidden = !cursor;
      } catch {
        status.textContent = restart ? 'Folder changed. Reload to see the current files.' : 'Files unavailable. Retry or check Storage status.';
        more.textContent = restart ? 'Reload folder' : 'Retry';
        more.hidden = false;
      } finally {
        busy = false;
        more.disabled = false;
      }
    }
    more.addEventListener('click', load);
    return { load, loaded: () => loaded };
  }

  mountFolder(tree, '').load();
}
