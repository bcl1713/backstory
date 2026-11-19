/** User-selected Files only. Keep uncertain identities; never replay a write. */
const pendingKey = 'backstory-pending-file-upload';
const maxBytes = 8 * 1024 * 1024;
export function mountFileUpload({ editor = null, getPath = () => '', getFolder = () => '' } = {}) {
  const dialog = document.querySelector('[data-file-upload-dialog]');
  const triggers = [...document.querySelectorAll('[data-file-upload]')];
  if (!dialog || !triggers.length || dialog.dataset.mounted) return;
  dialog.dataset.mounted = 'true';
  const file = dialog.querySelector('input[type=file]');
  const button = name => dialog.querySelector(`[data-file-upload-${name}]`);
  const send = button('send'), inspect = button('inspect'), copy = button('copy'), insert = button('insert');
  const status = dialog.querySelector('[role=status]'), progress = dialog.querySelector('progress');
  const result = dialog.querySelector('textarea'), download = button('download');
  const identity = button('identity'), path = button('path');
  let snapshot, pending = null, markdown = '', busy = false, active = null, trigger = null, generation = 0;
  try {
    const saved = JSON.parse(sessionStorage.getItem(pendingKey));
    if (saved && typeof saved.filename === 'string' && saved.filename.length <= 120 && /^[0-9a-f]{64}$/.test(saved.sha256) && (!saved.note || typeof saved.note === 'string' && saved.note.length <= 4096)) pending = saved;
  } catch { /* Storage may be disabled; current-tab identity still works. */ }
  const remember = () => { try { if (pending) sessionStorage.setItem(pendingKey, JSON.stringify(pending)); else sessionStorage.removeItem(pendingKey); } catch {} };
  const say = text => { status.textContent = text; };
  const controls = () => {
    send.disabled = busy || Boolean(pending); file.disabled = busy;
    inspect.hidden = !pending; inspect.disabled = busy;
    copy.disabled = !markdown || busy; insert.disabled = !markdown || !editor || busy;
    progress.hidden = !busy;
  };
  const clear = () => { markdown = ''; result.value = ''; download.hidden = true; identity.hidden = true; };
  const dismiss = () => { generation++; active?.abort(); dialog.close(); trigger?.focus(); };
  triggers.forEach(item => {
    item.hidden = false;
    item.addEventListener('click', () => {
      if (busy) return;
      trigger = item;
      snapshot = editor ? { path: getPath(), folder: getFolder(), source: editor.getSource(), selection: editor.captureSelection(), url: location.href } : null;
      clear(); file.value = ''; controls();
      say(pending ? 'Previous upload outcome needs inspection. Inspect upload status before deciding on a retry.' : 'Choose a file. Uploading does not edit or save a note.');
      dialog.showModal();
    });
  });
  button('close').addEventListener('click', dismiss);
  dialog.addEventListener('cancel', event => { event.preventDefault(); dismiss(); });
  window.addEventListener('keydown', event => {
    if (!dialog.open) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); dismiss(); }
    else if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.code === 'Period') { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  const ready = data => {
    if (data.untrusted_content !== true || data.authoritative !== true || typeof data.markdown !== 'string' ||
        !/^assets\/file-[0-9a-f]{64}-[A-Za-z0-9_-]{2,160}\.attachment$/.test(data.path) ||
        data.href !== '/attachments/' + data.path || data.sha256 !== pending?.sha256 || data.original_filename !== pending?.filename ||
        !Number.isInteger(data.bytes) || data.bytes < 0 || data.bytes > maxBytes) throw new Error('invalid acknowledgement');
    // Identity survives navigation; a relative link belongs to the receiving
    // draft, including its authorized folder before the note's first save.
    const from = (snapshot?.path ? snapshot.path.split('/').slice(0, -1) : snapshot?.folder?.split('/') || []).filter(Boolean);
    const to = data.path.split('/');
    let shared = 0;
    while (shared < from.length && from[shared] === to[shared]) shared++;
    const relative = '../'.repeat(from.length - shared) + to.slice(shared).join('/');
    const labelEnd = data.markdown.lastIndexOf('](');
    if (labelEnd < 1 || !data.markdown.endsWith(')')) throw new Error('invalid Markdown');
    markdown = data.markdown.slice(0, labelEnd + 2) + relative + ')'; result.value = markdown;
    path.textContent = data.path; identity.hidden = false;
    download.href = data.href; download.hidden = false;
    pending = null; remember();
    say(`File ready: ${data.original_filename} · ${data.bytes} bytes · SHA-256 ${data.sha256}. Copy the link or explicitly insert into draft. The note has not been saved.`);
  };
  const unknown = () => { clear(); remember(); say('Upload outcome is uncertain. Inspect upload status before any deliberate retry. Your draft is unchanged.'); };
  send.addEventListener('click', async () => {
    const selected = file.files[0];
    if (busy || pending) return;
    if (!selected || selected.size > maxBytes || new TextEncoder().encode(selected.name).length > 120) { say('Choose a file up to 8 MiB with a name up to 120 UTF-8 bytes.'); return; }
    busy = true; clear(); controls(); progress.removeAttribute('value'); say('Preparing file…');
    const started = generation;
    try {
      const bytes = await selected.arrayBuffer();
      const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(b => b.toString(16).padStart(2, '0')).join('');
      if (started !== generation) return;
      const note = snapshot?.path;
      pending = { filename: selected.name, sha256: digest, ...(note ? { note } : {}) }; remember();
      say('Uploading file…'); progress.value = 0;
      const xhr = new XMLHttpRequest(); active = xhr;
      const response = await new Promise((resolve, reject) => {
        xhr.open('POST', '/tools/files/?' + new URLSearchParams(pending)); xhr.timeout = 30000;
        xhr.setRequestHeader('Content-Type', 'application/octet-stream'); xhr.setRequestHeader('Accept', 'application/json');
        xhr.setRequestHeader('X-CSRFToken', document.querySelector('[name=csrfmiddlewaretoken]')?.value || '');
        xhr.upload.onprogress = event => { if (event.lengthComputable) progress.value = event.loaded / event.total * 100; };
        xhr.onload = () => { try { resolve({ status: xhr.status, data: JSON.parse(xhr.responseText) }); } catch { reject(new Error('invalid response')); } };
        xhr.onerror = xhr.ontimeout = xhr.onabort = () => reject(new Error('uncertain'));
        xhr.send(selected);
      });
      if (started !== generation) { unknown(); return; }
      const { status: code, data } = response;
      if ([200, 201].includes(code) && ['created', 'already_exists'].includes(data.state)) ready(data);
      else if (data.state === 'uncertain' || code >= 500) unknown();
      else { pending = null; remember(); say([401, 403].includes(code) ? 'Sign in again before retrying. Your draft is unchanged.' : `Upload rejected (${data.reason_code || code}). Your draft is unchanged.`); }
    } catch { if (pending) unknown(); else say('File preparation failed. Your draft is unchanged.'); }
    finally { active = null; busy = false; controls(); }
  });
  inspect.addEventListener('click', async () => {
    if (!pending || busy) return;
    busy = true; controls(); say('Inspecting upload status…');
    const controller = new AbortController(); active = controller;
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const inspection = { filename: pending.filename, sha256: pending.sha256, ...(snapshot?.path ? { note: snapshot.path } : {}) };
      const response = await fetch('/tools/files/inspect/?' + new URLSearchParams(inspection), { signal: controller.signal, credentials: 'same-origin', redirect: 'error', cache: 'no-store', headers: { Accept: 'application/json' } });
      const data = await response.json();
      if (controller.signal.aborted) throw new Error('cancelled');
      if (response.ok && data.state === 'confirmed') ready(data);
      else if (response.ok && data.state === 'absent' && data.authoritative === true) { pending = null; remember(); say('No matching file is present. Choose the file and deliberately Upload if still wanted.'); }
      else say(`Inspection unavailable (${data.reason_code || 'invalid response'}). No upload was retried. Sign in again if needed.`);
    } catch { say('Inspection could not be completed. No upload was retried.'); }
    finally { clearTimeout(timeout); active = null; busy = false; controls(); }
  });
  copy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(markdown); say('Attachment Markdown copied. The note has not been saved.'); }
    catch { result.focus(); result.select(); say('Select and copy the Attachment Markdown. The note has not been saved.'); }
  });
  insert.addEventListener('click', () => {
    if (!markdown || busy || !editor) return;
    if (location.href !== snapshot.url || getPath() !== snapshot.path || getFolder() !== snapshot.folder || editor.getSource() !== snapshot.source || editor.isComposing()) {
      insert.disabled = true; say('The draft changed while uploading. Copy the link and choose where to insert it; nothing was changed.'); return;
    }
    editor.insertAttachment(markdown, snapshot.selection); dialog.close(); editor.focus();
  });
}
