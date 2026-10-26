import { mergeSources } from './source-merge.js';
import { installNoteSync, readNoteSnapshot } from './note-sync.js';
import { createIdleAutosave } from './idle-autosave.js';
import { blockFormattingChanges } from './block-format.js';

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
  let baseSource = parse('#note-base-source') ?? initialSource;
  let baseRevision = isNew ? null : parse('#note-revision');
  let csrf = find('[name=csrfmiddlewaretoken]').value;
  let busy = false;
  let toolBusy = false;
  let reviewBusy = false;
  let syncVersion = 0;
  let draftVersion = 0;
  let attention = null;
  let conflictReview = false;
  let recovery = null;
  let proposal = null;
  let proposalSource = null;
  let conflict = null;
  let lastDiagnostics = [];
  const status = find('[data-editor-status]');
  const saveButton = find('[data-save]');
  const formatButton = find('[data-format]');
  const recoveryButton = find('[data-source-recovery]');
  const restoreButton = find('[data-restore-revision]');
  const restorationId = find('[data-markdown-editor]').dataset.restorationId;
  const filename = find('#note-filename');
  let explicitFirstSave = Boolean(restorationId) || find('[data-markdown-editor]').dataset.recovered === 'true';
  const encode = value => value.split('/').map(encodeURIComponent).join('/');
  const dirty = () => editor.getSource() !== baseSource || (isNew && !path && Boolean(filename?.value.trim()));
  const say = message => {
    status.textContent = attention ? `Needs attention. ${attention}` : message;
    status.dataset.state = attention ? 'attention' : busy ? 'saving' : dirty() ? 'dirty' : 'saved';
  };
  const idle = createIdleAutosave({
    getState: () => ({ dirty: dirty(), composing: editor.isComposing(),
      enabled: !explicitFirstSave && (!isNew || Boolean(path) || Boolean(filename?.value.trim().match(/^[^/\\]+\.md$/i))),
      blocked: busy || toolBusy || reviewBusy || conflictReview || proposalSource !== null }),
    save: () => perform('save', { automatic: true }),
  });
  const needsAttention = message => { attention = message; idle.pause(); say(message); };
  let compositionVersion = null;
  document.addEventListener('compositionstart', event => {
    if (event.target.closest('.cm-content, #source')) { compositionVersion = draftVersion; idle.cancel(); }
  });
  document.addEventListener('compositionend', event => {
    if (event.target.closest('.cm-content, #source') && compositionVersion !== null) {
      if (draftVersion !== compositionVersion) idle.edited();
      compositionVersion = null;
    }
  });
  window.addEventListener('pagehide', () => idle.cancel());
  const syncButtons = () => {
    const held = busy || toolBusy || reviewBusy;
    saveButton.disabled = held;
    formatButton.disabled = held;
    recoveryButton.hidden = !recovery;
    if (restoreButton) restoreButton.disabled = held || editor.getSource() !== initialSource;
    recoveryButton.disabled = held;
    find('[data-reload-current]').disabled = held || !conflict;
    find('[data-manual-merge]').disabled = held || !conflict;
    if (filename) filename.disabled = held || !isNew || Boolean(path);
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
    lastDiagnostics = Array.isArray(items) ? items : [];
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
    needsAttention('Sign in again to continue. Draft retained; no request will be replayed.');
  };
  const authenticated = response => {
    if (response.status === 401 || response.status === 403 || new URL(response.url).pathname === '/accounts/login/') {
      reauthenticate();
      return false;
    }
    return true;
  };
  const updateLinks = () => {
    find('#note-path').textContent = JSON.stringify(path);
    find('[data-note-title]').textContent = path;
    document.title = `${path} · Backstory`;
    find('[data-server-preview]').href = '/preview/' + encode(path);
    find('[data-source-download]').href = '/source/' + encode(path);
    find('[data-move-link]').href = '/move/?' + new URLSearchParams({ source: path });
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
  const banner = message => {
    find('[data-sync-message]').textContent = message;
    find('[data-sync-banner]').hidden = false;
  };
  const clearConflict = () => {
    conflict = null;
    conflictReview = false;
    find('[data-conflict]').hidden = true;
    find('[data-sync-banner]').hidden = true;
  };
  const showComparison = (snapshot, message = 'This note changed outside this view. Your draft is retained. Compare the sources, copy or download your draft, or explicitly reload the latest source.') => {
    needsAttention(message);
    conflict = snapshot;
    conflictReview = true;
    find('[data-conflict]').hidden = false;
    find('#conflict-base').value = baseSource;
    find('#conflict-draft').value = editor.getSource();
    find('#conflict-current').value = snapshot.source;
    find('[data-conflict-status]').textContent = 'Current disk snapshot shown below. Reload and manual merge recheck it before applying your choice. Undo changes text only; Save still checks the adopted revision.';
    banner(message);
    syncButtons();
  };
  const syncFailure = error => {
    // A failed read is never a valid empty note or an invitation to recreate it.
    conflict = null;
    find('[data-conflict-status]').textContent = 'The current disk source cannot be confirmed. Draft and original revision retained.';
    const message = error.kind === 'missing' ? 'This note was deleted or moved. Draft retained; locate the note before saving.'
      : error.kind === 'storage' ? 'Storage is unavailable. Draft retained; check Storage status, then check again.'
        : error.kind === 'authentication' ? 'Sign in again to check external changes. Draft retained.'
          : 'External changes could not be read. Draft retained; check the connection and try again.';
    banner(message);
    needsAttention(message);
    if (error.kind === 'authentication') reauthenticate();
    syncButtons();
  };
  const adoptSnapshot = snapshot => {
    idle.cancel();
    baseSource = snapshot.source;
    baseRevision = snapshot.revision;
    bom = snapshot.bom;
    find('#note-newline').textContent = JSON.stringify(snapshot.newline);
    syncVersion++;
    invalidateRecovery();
    clearProposal();
  };
  const receiveSnapshot = snapshot => {
    if (conflictReview) { showComparison(snapshot); return; }
    if (snapshot.revision === baseRevision) { find('[data-sync-banner]').hidden = true; return; }
    const local = editor.getSource();
    const merged = mergeSources(baseSource, local, snapshot.source);
    if (merged === null) {
      showComparison(snapshot);
      say('External revision conflict. Draft and original revision retained.');
      return;
    }
    adoptSnapshot(snapshot);
    editor.applyExternalSource(merged, snapshot.newline);
    clearConflict();
    syncButtons();
    say(dirty() ? 'External changes merged. Local edits remain unsaved.' : 'Reloaded external changes. Unchanged.');
  };
  const synchronization = installNoteSync({
    getState: () => ({ path, revision: baseRevision, version: syncVersion,
      blocked: isNew || Boolean(restorationId) || busy || toolBusy || reviewBusy || proposalSource !== null || editor.isComposing() }),
    onSnapshot: receiveSnapshot, onFailure: syncFailure,
  });
  const showConflict = async requestedPath => {
    conflictReview = true;
    conflict = null;
    banner('This note changed outside this view. Reading the current source for comparison; your draft is retained.');
    syncButtons();
    try {
      showComparison(await readNoteSnapshot(requestedPath, AbortSignal.timeout(15000)));
      needsAttention('Revision conflict. Draft and original revision retained. Compare the sources, then explicitly reload or merge.');
    } catch (error) { syncFailure(error); }
  };
  const captureRecovery = (result, submitted) => {
    if (typeof result.recovery_token === 'string' && editor.getSource() === submitted) {
      recovery = { token: result.recovery_token, source: submitted, revision: baseRevision };
    }
    syncButtons();
  };

  async function perform(kind, { automatic = false, block = null } = {}) {
    if (busy || toolBusy || reviewBusy || editor.isComposing() || (automatic && conflictReview)) return;
    const blockFormat = kind === 'block_format';
    const formatting = kind === 'format' || blockFormat;
    if (blockFormat && (attention || explicitFirstSave || proposalSource !== null || !editor.blockIsInactive(block))) return;
    const requestedPath = requestPath();
    if (!requestedPath) return;
    const submitted = editor.getSource();
    const submittedVersion = draftVersion;
    const wasPaused = Boolean(attention) || explicitFirstSave;
    const revision = baseRevision;
    const sourceRecovery = kind === 'source_recovery';
    if (sourceRecovery && (!recovery || recovery.source !== submitted || recovery.revision !== revision)) {
      invalidateRecovery();
      say('Run Format or Save again for this draft before requesting source recovery.');
      return;
    }
    if (!blockFormat) idle.cancel();
    busy = true;
    syncVersion++;
    syncButtons();
    say(formatting ? 'Checking proposed formatting…' : 'Saving…');
    const headers = { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRFToken': csrf, ...(revision === null ? { 'If-None-Match': '*' } : { 'If-Match': revision }) };
    try {
      const endpoint = kind === 'restore' ? `/restore/${restorationId}/` : `/${formatting ? 'format' : 'save'}/${encode(requestedPath)}`;
      const response = await fetch(endpoint, {
        method: 'POST', credentials: 'same-origin', cache: 'no-store', headers,
        body: JSON.stringify({ source: submitted, mode: sourceRecovery ? 'source_recovery' : 'formatted', ...(sourceRecovery ? { recovery_token: recovery.token } : {}) }),
      });
      if (!authenticated(response)) return;
      const result = await response.json();
      if (response.status === 412) {
        clearProposal();
        await showConflict(requestedPath);
        return;
      }
      if (Array.isArray(result.diagnostics)) diagnostics(result.diagnostics);
      if (response.status === 422 || result.outcome === 'failed' || result.state === 'format_failed') {
        clearProposal();
        captureRecovery(result, submitted);
        if (result.diff && editor.getSource() === submitted) displayProposal(result, submitted, true);
        needsAttention('Formatting failed. Draft retained. Review diagnostics or explicitly save source without formatting.');
        return;
      }
      if (!response.ok) {
        const nextStep = result.reason_code === 'invalid_source_recovery'
          ? 'Run Format again for this draft before requesting source recovery.'
          : response.status === 503 ? 'Check Storage status or ask the administrator to check storage and recovery space, then retry explicitly.' : 'Resolve the reported problem, then retry explicitly.';
        needsAttention(`Draft retained. ${result.reason_code || result.state || 'Request failed'} (${response.status}). ${nextStep}`);
        return;
      }
      if (formatting) {
        if (typeof result.source !== 'string' || !['ok', 'skipped'].includes(result.outcome)) throw new Error('unconfirmed response');
        invalidateRecovery();
        if (blockFormat) {
          const unchanged = submittedVersion === draftVersion && editor.getSource() === submitted && baseRevision === revision;
          const changes = unchanged && !editor.isComposing() && editor.blockIsInactive(block)
            ? blockFormattingChanges(submitted, result.source, block) : null;
          if (changes === null || !editor.blockIsInactive(block, changes)) {
            say('Block formatting deferred to Save to preserve current source and Markdown context.');
          } else if (changes.length) {
            editor.applyExternalSource(result.source, undefined, 'input.format');
            say('Block formatted. Draft remains unsaved until Save or idle autosave.');
          } else say('Block formatting unchanged.');
          return;
        }
        if (editor.getSource() !== submitted) {
          say('Draft changed while formatting. Draft retained; run Format again to review it.');
          return;
        }
        displayProposal(result, submitted);
        say(result.outcome === 'skipped' ? 'Formatting skipped by configuration. Disk unchanged.' : 'Proposed formatting ready. Disk unchanged.');
        return;
      }
      if (!['noop', 'saved', 'saved_index_delayed', 'saved_source', 'saved_source_index_delayed'].includes(result.state) || typeof result.source !== 'string' || typeof result.revision !== 'string') throw new Error('unconfirmed response');
      const current = editor.getSource();
      const sameDraft = draftVersion === submittedVersion && current === submitted;
      const merged = sameDraft ? result.source : mergeSources(submitted, current, result.source);
      baseRevision = result.revision;
      baseSource = result.source;
      const cannotApply = merged === null || (editor.isComposing() && merged !== current);
      if (!cannotApply && merged !== current) editor.applyExternalSource(merged, undefined, 'input.format');
      if (isNew) {
        path = requestedPath;
        isNew = false;
        history.replaceState(null, '', '/notes/' + encode(path));
        updateLinks();
      }
      invalidateRecovery();
      clearProposal();
      clearConflict();
      if (cannotApply) {
        needsAttention('An earlier draft was saved, but its formatting could not be reconciled with newer typing. Current draft retained. Compare the disk source, then Save explicitly.');
        return;
      }
      if (!automatic) {
        attention = null; explicitFirstSave = false;
        if (wasPaused) { idle.resume(); if (dirty() && draftVersion !== submittedVersion) idle.edited(); }
      }
      const outcome = result.state === 'noop'
        ? (sourceRecovery ? 'Unchanged source on disk; formatting skipped.' : 'Unchanged on disk.')
        : (sourceRecovery ? 'Saved without formatting.' : 'Saved.');
      say(dirty() ? 'Earlier draft saved. Newer edits remain unsaved.'
        : `${outcome}${result.state.endsWith('_index_delayed') ? ' Discovery update delayed.' : ''}`);
    } catch {
      needsAttention('Draft retained. The request could not be confirmed. Check the disk version before retrying; nothing will be replayed automatically.');
    } finally {
      busy = false;
      syncButtons();
      status.dataset.state = attention ? 'attention' : dirty() ? 'dirty' : 'saved';
      idle.flush();
    }
  }

  editor.setBlockExitHandler(block => { void perform('block_format', { automatic: true, block }); });

  saveButton.addEventListener('click', () => perform('save'));
  formatButton.addEventListener('click', () => perform('format'));
  recoveryButton.addEventListener('click', () => perform('source_recovery'));
  restoreButton?.addEventListener('click', () => perform('restore'));
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); perform('save'); }
  });
  find('[data-apply-format]').addEventListener('click', () => {
    if (busy || toolBusy || reviewBusy) return;
    if (!proposal || editor.getSource() !== proposal.submitted) { clearProposal(); say('Draft changed. Run Format again.'); return; }
    const source = proposal.source;
    clearProposal();
    editor.applyExternalSource(source, undefined, 'input.format');
    say(dirty() ? 'Formatting applied to draft. Unsaved changes.' : 'Formatting applied. Unchanged on disk.');
  });
  find('[data-dismiss-format]').addEventListener('click', () => { clearProposal(); say(dirty() ? 'Unsaved changes' : 'Unchanged'); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !find('[data-format-proposal]').hidden) {
      clearProposal(); say(dirty() ? 'Unsaved changes' : 'Unchanged'); formatButton.focus();
    }
  });
  const acceptConflictRevision = snapshot => {
    path = snapshot.path;
    adoptSnapshot(snapshot);
    isNew = false;
    history.replaceState(null, '', '/notes/' + encode(path));
    updateLinks();
  };
  if (filename) filename.addEventListener('input', () => {
    idle.edited();
    invalidateRecovery();
    clearProposal();
    clearConflict();
    say(dirty() ? 'Unsaved new note' : 'Unchanged');
  });
  const chooseConflict = async reload => {
    if (!conflict || busy || toolBusy || reviewBusy || editor.isComposing()) return;
    const displayed = conflict, local = editor.getSource();
    reviewBusy = true;
    syncVersion++;
    syncButtons();
    try {
      let latest = await readNoteSnapshot(displayed.path, AbortSignal.timeout(15000));
      const changed = () => latest.revision !== displayed.revision || editor.getSource() !== local || editor.isComposing();
      if (changed()) { showComparison(latest, 'The disk source or your draft changed during review. Draft retained; compare again before choosing.'); return; }
      if (reload && dirty()) {
        if (!window.confirm('Replace your unsaved draft with the latest disk version? Copy or download your draft first.')) return;
        // The confirmation can remain open while another writer publishes.
        latest = await readNoteSnapshot(displayed.path, AbortSignal.timeout(15000));
        if (changed()) { showComparison(latest, 'The disk source or your draft changed during confirmation. Draft retained; review again.'); return; }
      }
      acceptConflictRevision(latest);
      if (reload) editor.applyExternalSource(latest.source, latest.newline);
      clearConflict();
      if (reload) { attention = null; idle.resume(); say('Reloaded the latest disk version. Unchanged.'); }
      else needsAttention('Current revision accepted for manual merge. Draft retained; review and edit it, then explicitly Save.');
      if (!reload) editor.focus();
    } catch (error) { syncFailure(error); }
    finally { reviewBusy = false; syncButtons(); idle.flush(); }
  };
  find('[data-reload-current]').addEventListener('click', () => chooseConflict(true));
  find('[data-manual-merge]').addEventListener('click', () => chooseConflict(false));
  find('[data-sync-check]').addEventListener('click', () => synchronization.check());
  find('[data-sync-review]').addEventListener('click', () => {
    if (find('[data-conflict]').hidden) { void synchronization.check(); return; }
    find('[data-conflict]').scrollIntoView({ block: 'start' });
    find('#conflict-current').focus({ preventScroll: true });
  });
  find('[data-sync-copy]').addEventListener('click', () => find('[data-copy-draft]').click());
  find('[data-sync-download]').addEventListener('click', () => find('[data-download-draft]').click());
  find('[data-store-draft]').addEventListener('click', async () => {
    if (busy || toolBusy || reviewBusy) return;
    const requestedPath = requestPath();
    if (!requestedPath) return;
    busy = true; syncVersion++; syncButtons();
    try {
      const response = await fetch('/drafts/', {method: 'POST', credentials: 'same-origin', cache: 'no-store',
        headers: {'Content-Type': 'application/json', 'X-CSRFToken': csrf},
        body: JSON.stringify({path: requestedPath, base_revision: baseRevision, source: editor.getSource(), base_source: baseSource,
          diagnostics: lastDiagnostics, bom, newline: parse('#note-newline') || '\n'})});
      if (!authenticated(response)) return;
      const result = await response.json();
      if (!response.ok || !result.url) { needsAttention('Draft retained. Protected storage failed; copy or download it.'); return; }
      const link = find('[data-stored-draft]'); link.href = result.url; link.hidden = false;
      const message = 'Protected draft stored. Wiki changes remain subject to Save or idle autosave and a revision check.';
      if (attention) needsAttention(`${message} Choose Save explicitly to resume automatic saves.`);
      else say(message);
    } catch { needsAttention('Draft retained. Protected storage could not be confirmed; copy or download it.'); }
    finally { busy = false; syncButtons(); idle.flush(); }
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
    if (busy || toolBusy || reviewBusy) return;
    busy = true;
    syncVersion++;
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
      find('[name=csrfmiddlewaretoken]').value = csrf;
      find('[data-reauth]').hidden = true;
      needsAttention('Signed in. Draft retained. Choose Save or Format explicitly to continue.');
    } catch {
      needsAttention('Sign in was not completed. Draft retained; check your credentials and try again.');
    } finally {
      password.value = '';
      busy = false;
      button.disabled = false;
      syncButtons();
    }
  });
  const retainedDiagnostics = parse('#note-diagnostics');
  if (Array.isArray(retainedDiagnostics)) diagnostics(retainedDiagnostics);
  // Tool writes keep their existing draft and operation guards. Synchronization
  // reads authoritative source after completion, including uncertain outcomes.
  document.addEventListener('backstory:tool-save-start', event => {
    const guard = event.detail;
    guard.editorReady = true;
    const editorPath = path || (filename?.value.trim() ? [folder, filename.value.trim()].filter(Boolean).join('/') : '');
    if (guard.path !== editorPath) return;
    if (busy || toolBusy || reviewBusy || conflictReview || editor.isComposing()) { guard.reason_code = 'editor_busy'; return; }
    if (dirty()) { guard.reason_code = 'unsaved_editor_draft'; return; }
    toolBusy = true;
    syncVersion++;
    syncButtons();
    say('Browser tool save in progress. Editor source and original revision retained.');
  });
  document.addEventListener('backstory:tool-save-finish', event => {
    if (event.detail.path !== path || !toolBusy) return;
    toolBusy = false;
    syncVersion++;
    syncButtons();
    say('Browser tool request finished. Checking external changes; draft retained.');
    void synchronization.check().finally(() => idle.flush());
  });
  document.addEventListener('click', event => {
    const move = event.target.closest('a[href]');
    if (!move || new URL(move.href, location.href).pathname !== '/move/' || !dirty()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    say('Save or store your draft before moving. Unsaved source and editor history are retained.');
  }, true);
  installDraftGuards(() => dirty() || busy);
  find('[data-editor-actions]').hidden = false;
  saveButton.hidden = false;
  formatButton.hidden = false;
  syncButtons();
  return (value, { user = true } = {}) => {
    draftVersion++;
    if (user) idle.edited();
    if (proposalSource !== null && value !== proposalSource) clearProposal();
    if (recovery && (recovery.source !== value || recovery.revision !== baseRevision)) invalidateRecovery();
    if (!find('[data-conflict]').hidden) find('#conflict-draft').value = value;
    syncButtons();
    if (!attention && !busy) say(dirty() ? 'Unsaved changes' : 'Unchanged');
  };
}

// This explicit lookup complements inline link rendering. Neither lookup
// performs backlink traversal or schedules scans/index work.
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
