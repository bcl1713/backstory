// These guards retain the in-memory draft; no browser persistence is used.
export function installDraftGuards(isDirty) {
  let leaving = false;
  const permit = event => {
    if (!isDirty()) return;
    if (!window.confirm('Leave this page and discard the unsaved draft? Copy or download it first.')) {
      event.preventDefault();
      event.stopImmediatePropagation();
    } else {
      leaving = true;
      setTimeout(() => { leaving = false; }, 1000);
    }
  };
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || link.hasAttribute('download') || link.target === '_blank' || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const url = new URL(link.href, location.href);
    if (url.origin === location.origin && url.pathname === location.pathname && url.search === location.search && url.hash) return;
    permit(event);
  }, true);
  document.addEventListener('submit', event => {
    if (new URL(event.target.action, location.href).pathname === '/accounts/logout/') permit(event);
  }, true);
  window.addEventListener('beforeunload', event => {
    if (isDirty() && !leaving) { event.preventDefault(); event.returnValue = ''; }
  });
}

export function mountNoteActions({ editor, initialSource, isNew, bom }) {
  const find = selector => document.querySelector(selector);
  const parse = id => JSON.parse(find(id).textContent);
  let path = parse('#note-path');
  mountLinkDiscovery(() => path);
  const folder = parse('#note-folder');
  let baseSource = initialSource;
  let baseRevision = isNew ? null : parse('#note-revision');
  let csrf = find('[name=csrfmiddlewaretoken]').value;
  let busy = false;
  let recovery = null;
  let proposal = null;
  let proposalSource = null;
  let conflict = null;
  const status = find('[data-editor-status]');
  const saveButton = find('[data-save]');
  const formatButton = find('[data-format]');
  const recoveryButton = find('[data-source-recovery]');
  const filename = find('#note-filename');
  const encode = value => value.split('/').map(encodeURIComponent).join('/');
  const dirty = () => editor.getSource() !== baseSource || (isNew && !path && Boolean(filename?.value.trim()));
  const say = message => { status.textContent = message; };
  const syncButtons = () => {
    saveButton.disabled = busy;
    formatButton.disabled = busy;
    recoveryButton.hidden = !recovery;
    recoveryButton.disabled = busy;
    if (filename) filename.disabled = busy || !isNew || Boolean(path);
  };
  const clearProposal = () => { proposal = null; proposalSource = null; find('[data-format-proposal]').hidden = true; };
  const displayProposal = (result, submitted, rejected = false) => {
    proposal = rejected ? null : { source: result.source, submitted };
    proposalSource = submitted;
    find('[data-proposal-title]').textContent = rejected ? 'Rejected formatting' : 'Proposed formatting';
    find('[data-proposal-help]').textContent = rejected
      ? 'Formatting was rejected. This diff is for inspection only; your draft and disk are unchanged.'
      : 'Review the changes. Applying them changes this draft; it does not save to disk.';
    find('[data-proposal-source-region]').hidden = rejected;
    find('[data-apply-format]').hidden = rejected;
    if (!rejected) find('#format-proposal-source').value = result.source;
    find('[data-format-diff]').textContent = result.diff || 'No source changes proposed.';
    find('[data-format-proposal]').hidden = false;
  };
  const invalidateRecovery = () => { recovery = null; syncButtons(); };
  const diagnostics = items => {
    const list = find('[data-diagnostics]');
    list.replaceChildren();
    for (const item of Array.isArray(items) ? items : []) {
      const li = document.createElement('li');
      li.textContent = `${item.severity || 'info'}: ${item.code || 'diagnostic'}${item.line ? ` (line ${item.line}${item.column ? `, column ${item.column}` : ''})` : ''} — ${item.message || ''}`;
      list.append(li);
    }
    find('[data-diagnostics-region]').hidden = !list.childElementCount;
  };
  const reauthenticate = () => {
    find('[data-reauth]').hidden = false;
    say('Sign in again to continue. Draft retained; no request will be replayed.');
  };
  const authenticated = response => {
    if (response.status === 401 || response.status === 403 || new URL(response.url).pathname === '/accounts/login/') {
      reauthenticate();
      return false;
    }
    return true;
  };
  const updateLinks = () => {
    find('[data-note-title]').textContent = path;
    document.title = `${path} · Backstory`;
    find('[data-server-preview]').href = '/preview/' + encode(path);
    find('[data-source-download]').href = '/source/' + encode(path);
    find('[data-secondary-links]').hidden = false;
    find('[data-link-discovery]').hidden = false;
    saveButton.textContent = 'Save';
  };
  const requestPath = () => {
    if (!isNew || path) return path;
    const name = filename.value.trim();
    if (!name || name.includes('/') || name.includes('\\') || !name.toLowerCase().endsWith('.md')) {
      say('Enter a Markdown filename ending in .md in the current folder.');
      return null;
    }
    return folder ? `${folder}/${name}` : name;
  };
  const showConflict = async (result, requestedPath) => {
    conflict = null;
    find('[data-conflict]').hidden = false;
    find('#conflict-base').value = baseSource;
    find('#conflict-draft').value = editor.getSource();
    find('#conflict-current').value = '';
    find('[data-reload-current]').disabled = true;
    find('[data-manual-merge]').disabled = true;
    find('[data-conflict-status]').textContent = 'Reading the current disk version for comparison…';
    say('Revision conflict. Draft and original revision retained.');
    try {
      const response = await fetch('/source/' + encode(requestedPath), { credentials: 'same-origin', cache: 'no-store' });
      if (!authenticated(response)) return;
      if (response.status === 404 && result.revision === null) {
        conflict = { source: '', revision: null, path: requestedPath };
        find('[data-conflict-status]').textContent = 'The current file is absent. Accepting this version requires a new create-if-absent save.';
      } else if (response.ok && response.headers.get('ETag')) {
        const source = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(await response.arrayBuffer());
        conflict = { source, revision: response.headers.get('ETag'), path: requestedPath };
        find('[data-conflict-status]').textContent = 'This is the disk version read for comparison. Reload and merge require an explicit choice; Save checks it again.';
      } else throw new Error('comparison unavailable');
      find('#conflict-current').value = conflict.source;
      find('[data-reload-current]').disabled = false;
      find('[data-manual-merge]').disabled = false;
    } catch {
      find('[data-conflict-status]').textContent = 'Current source is unavailable. Draft and original revision retained; copy or download your draft.';
    }
  };
  const captureRecovery = (result, submitted) => {
    if (typeof result.recovery_token === 'string' && editor.getSource() === submitted) {
      recovery = { token: result.recovery_token, source: submitted, revision: baseRevision };
    }
    syncButtons();
  };

  async function perform(kind) {
    if (busy) return;
    const requestedPath = requestPath();
    if (!requestedPath) return;
    const submitted = editor.getSource();
    const revision = baseRevision;
    const sourceRecovery = kind === 'source_recovery';
    if (sourceRecovery && (!recovery || recovery.source !== submitted || recovery.revision !== revision)) {
      invalidateRecovery();
      say('Run Format or Save again for this draft before requesting source recovery.');
      return;
    }
    busy = true;
    syncButtons();
    say(kind === 'format' ? 'Checking proposed formatting…' : 'Saving…');
    const headers = { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRFToken': csrf, ...(revision === null ? { 'If-None-Match': '*' } : { 'If-Match': revision }) };
    try {
      const response = await fetch(`/${kind === 'format' ? 'format' : 'save'}/${encode(requestedPath)}`, {
        method: 'POST', credentials: 'same-origin', cache: 'no-store', headers,
        body: JSON.stringify({ source: submitted, mode: sourceRecovery ? 'source_recovery' : 'formatted', ...(sourceRecovery ? { recovery_token: recovery.token } : {}) }),
      });
      if (!authenticated(response)) return;
      const result = await response.json();
      if (response.status === 412) {
        clearProposal();
        await showConflict(result, requestedPath);
        return;
      }
      if (Array.isArray(result.diagnostics)) diagnostics(result.diagnostics);
      if (response.status === 422 || result.outcome === 'failed' || result.state === 'format_failed') {
        clearProposal();
        captureRecovery(result, submitted);
        if (result.diff && editor.getSource() === submitted) displayProposal(result, submitted, true);
        say('Formatting failed. Draft retained. Review diagnostics or explicitly save source without formatting.');
        return;
      }
      if (!response.ok) {
        const nextStep = result.reason_code === 'invalid_source_recovery'
          ? 'Run Format again for this draft before requesting source recovery.'
          : response.status === 503 ? 'Check Storage status or ask the administrator to check storage and recovery space, then retry explicitly.' : 'Resolve the reported problem, then retry explicitly.';
        say(`Draft retained. ${result.reason_code || result.state || 'Request failed'} (${response.status}). ${nextStep}`);
        return;
      }
      if (kind === 'format') {
        if (typeof result.source !== 'string' || !['ok', 'skipped'].includes(result.outcome)) throw new Error('unconfirmed response');
        invalidateRecovery();
        if (editor.getSource() !== submitted) {
          say('Draft changed while formatting. Draft retained; run Format again to review it.');
          return;
        }
        displayProposal(result, submitted);
        say(result.outcome === 'skipped' ? 'Formatting skipped by configuration. Disk unchanged.' : 'Proposed formatting ready. Disk unchanged.');
        return;
      }
      if (!['noop', 'saved', 'saved_index_delayed', 'saved_source', 'saved_source_index_delayed'].includes(result.state) || typeof result.source !== 'string' || typeof result.revision !== 'string') throw new Error('unconfirmed response');
      const sameDraft = editor.getSource() === submitted;
      baseRevision = result.revision;
      baseSource = result.source;
      if (sameDraft && result.source !== submitted) editor.setSource(result.source);
      if (isNew) {
        path = requestedPath;
        isNew = false;
        history.replaceState(null, '', '/notes/' + encode(path));
        updateLinks();
      }
      invalidateRecovery();
      clearProposal();
      find('[data-conflict]').hidden = true;
      conflict = null;
      const outcome = result.state === 'noop'
        ? (sourceRecovery ? 'Unchanged source on disk; formatting skipped.' : 'Unchanged on disk.')
        : (sourceRecovery ? 'Saved without formatting.' : 'Saved.');
      say(`${outcome}${result.state.endsWith('_index_delayed') ? ' Discovery update delayed.' : ''}${dirty() ? ' Newer edits remain unsaved.' : ''}`);
    } catch {
      say('Draft retained. The request could not be confirmed. Check the disk version before retrying; nothing will be replayed automatically.');
    } finally {
      busy = false;
      syncButtons();
    }
  }

  saveButton.addEventListener('click', () => perform('save'));
  formatButton.addEventListener('click', () => perform('format'));
  recoveryButton.addEventListener('click', () => perform('source_recovery'));
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); perform('save'); }
  });
  find('[data-apply-format]').addEventListener('click', () => {
    if (!proposal || editor.getSource() !== proposal.submitted) { clearProposal(); say('Draft changed. Run Format again.'); return; }
    const source = proposal.source;
    clearProposal();
    editor.setSource(source);
    say(dirty() ? 'Formatting applied to draft. Unsaved changes.' : 'Formatting applied. Unchanged on disk.');
  });
  find('[data-dismiss-format]').addEventListener('click', () => { clearProposal(); say(dirty() ? 'Unsaved changes' : 'Unchanged'); });
  const acceptConflictRevision = () => {
    path = conflict.path;
    baseRevision = conflict.revision;
    baseSource = conflict.source;
    isNew = baseRevision === null;
    if (!isNew) {
      history.replaceState(null, '', '/notes/' + encode(path));
      updateLinks();
    } else saveButton.textContent = 'Create note';
  };
  if (filename) filename.addEventListener('input', () => {
    invalidateRecovery();
    clearProposal();
    conflict = null;
    find('[data-conflict]').hidden = true;
    say(dirty() ? 'Unsaved new note' : 'Unchanged');
  });
  find('[data-reload-current]').addEventListener('click', () => {
    if (!conflict || !window.confirm('Replace your draft with the displayed disk version? Copy or download your draft first.')) return;
    acceptConflictRevision();
    editor.setSource(conflict.source);
    invalidateRecovery();
    clearProposal();
    find('[data-conflict]').hidden = true;
    conflict = null;
    say('Reloaded the displayed disk version. Unchanged.');
  });
  find('[data-manual-merge]').addEventListener('click', () => {
    if (!conflict) return;
    acceptConflictRevision();
    invalidateRecovery();
    clearProposal();
    find('[data-reload-current]').disabled = true;
    find('[data-manual-merge]').disabled = true;
    say('Current revision accepted for manual merge. Draft retained; review and edit it, then explicitly Save.');
    editor.focus();
  });
  find('[data-copy-draft]').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(editor.getSource()); say('Draft copied.'); }
    catch { editor.showFallback(); find('#source').select(); say('Select and copy the draft, or download it.'); }
  });
  find('[data-download-draft]').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([bom ? '\ufeff' : '', editor.getSource()], { type: 'text/markdown;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = (path || filename?.value || 'draft.md').split('/').at(-1);
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  find('[data-reauth-form]').addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    busy = true;
    syncButtons();
    const button = event.target.querySelector('button');
    button.disabled = true;
    const password = find('#reauth-password');
    try {
      const loginPage = await fetch('/accounts/login/', { credentials: 'same-origin', cache: 'no-store' });
      const document = new DOMParser().parseFromString(await loginPage.text(), 'text/html');
      const token = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
      if (!token) throw new Error('sign-in unavailable');
      const body = new URLSearchParams({ username: find('#reauth-username').value, password: password.value, csrfmiddlewaretoken: token, next: '/status/' });
      password.value = '';
      const response = await fetch('/accounts/login/', { method: 'POST', credentials: 'same-origin', cache: 'no-store', body });
      if (!response.ok || new URL(response.url).pathname !== '/status/') throw new Error('sign-in failed');
      const signedIn = new DOMParser().parseFromString(await response.text(), 'text/html');
      csrf = signedIn.querySelector('[name=csrfmiddlewaretoken]')?.value;
      if (!csrf) throw new Error('sign-in unavailable');
      find('[data-reauth]').hidden = true;
      say('Signed in. Draft retained. Choose Save or Format explicitly to continue.');
    } catch {
      say('Sign in was not completed. Draft retained; check your credentials and try again.');
    } finally {
      password.value = '';
      busy = false;
      button.disabled = false;
      syncButtons();
    }
  });
  installDraftGuards(dirty);
  find('[data-editor-actions]').hidden = false;
  syncButtons();
  return value => {
    if (proposalSource !== null && value !== proposalSource) clearProposal();
    if (recovery && (recovery.source !== value || recovery.revision !== baseRevision)) invalidateRecovery();
    if (!find('[data-conflict]').hidden) find('#conflict-draft').value = value;
    say(dirty() ? 'Unsaved changes' : 'Unchanged');
  };
}

// Link lookup is explicitly requested. Editor selection/decorations never call
// this endpoint or perform backlink, scan or index work.
export function mountLinkDiscovery(getPath) {
  const form = document.querySelector('[data-link-discovery]');
  if (!form) return;
  const output = form.querySelector('[data-link-result]');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    output.textContent = 'Resolving link…';
    const query = new URLSearchParams({ source: getPath(), target: form.elements.target.value, kind: form.elements.kind.value });
    try {
      const response = await fetch('/resolve/?' + query, { credentials: 'same-origin', cache: 'no-store', redirect: 'error' });
      if (!response.ok) throw new Error('Link unavailable');
      const result = await response.json();
      output.replaceChildren(document.createTextNode(`${result.state}: `));
      if (result.href && (/^\/(?!\/)/.test(result.href) || result.href.startsWith('#') || /^(https?:|mailto:)/i.test(result.href))) {
        const link = document.createElement('a');
        link.href = result.href;
        link.textContent = result.label || 'Open link';
        output.append(link);
      } else {
        output.append(document.createTextNode(result.label || 'Link unavailable'));
      }
    } catch {
      output.textContent = 'Link unavailable. Check storage and index status, or sign in again.';
    }
  });
}
