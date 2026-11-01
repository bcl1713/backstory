/** Uploading creates an asset; only explicit insertion changes the current draft. */
export function mountImageUpload({ editor, getPath }) {
  const trigger = document.querySelector('[data-image-upload]');
  const dialog = document.querySelector('[data-image-upload-dialog]');
  if (!trigger || !dialog) return;
  const file = dialog.querySelector('input[type=file]');
  const send = dialog.querySelector('[data-image-upload-send]');
  const insert = dialog.querySelector('[data-image-upload-insert]');
  const close = dialog.querySelector('[data-image-upload-close]');
  const status = dialog.querySelector('[role=status]');
  const result = dialog.querySelector('textarea');
  let snapshot, markdown = '', busy = false, active = null, unknown = false;
  const say = text => { status.textContent = text; };
  trigger.hidden = false;
  trigger.addEventListener('click', () => {
    if (busy) return;
    snapshot = { path: getPath(), source: editor.getSource() };
    markdown = '';
    result.value = '';
    insert.disabled = true;
    file.value = '';
    send.disabled = !snapshot.path;
    say(unknown ? 'Previous upload outcome is unknown. Choose the same file and Upload to check safely.' : snapshot.path ? 'Choose a PNG, JPEG or static WebP image. Uploading does not edit or save this note.' : 'Save this note first so its image path can be determined.');
    dialog.showModal();
  });
  const dismiss = () => { if (busy) { unknown = true; active?.abort(); } dialog.close(); trigger.focus(); };
  close.addEventListener('click', dismiss);
  // Own modal shortcuts before the shell's navigation handlers.
  window.addEventListener('keydown', event => {
    if (!dialog.open) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); dismiss(); }
    else if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.code === 'Period') {
      event.preventDefault(); event.stopImmediatePropagation();
    }
  }, true);
  dialog.addEventListener('cancel', event => { event.preventDefault(); dismiss(); });
  send.addEventListener('click', async () => {
    const selected = file.files[0];
    if (busy || !snapshot?.path) return;
    if (!selected || selected.size > 8 * 1024 * 1024 || !['image/png', 'image/jpeg', 'image/webp'].includes(selected.type)) {
      say('Choose a PNG, JPEG or static WebP image no larger than 8 MiB.'); return;
    }
    busy = true;
    send.disabled = file.disabled = true;
    active = new AbortController();
    const controller = active;
    const timeout = setTimeout(() => controller.abort(), 30000);
    insert.disabled = true;
    markdown = ''; result.value = '';
    say('Uploading image…');
    try {
      const response = await fetch('/tools/images/?' + new URLSearchParams({ note: snapshot.path, filename: selected.name }), {
        signal: controller.signal, method: 'POST', body: selected, credentials: 'same-origin', redirect: 'error', cache: 'no-store',
        headers: { 'Content-Type': selected.type, 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value || '', Accept: 'application/json' },
      });
      const data = await response.json();
      if (controller.signal.aborted) throw new Error('cancelled');
      if (!response.ok || !data.authoritative || !['created', 'already_exists'].includes(data.state)) {
        say(data.state === 'uncertain' ? 'Upload could not be confirmed. Choose Upload again with the same file to check safely.' :
          [401, 403].includes(response.status) ? 'Sign in again before retrying. Your draft is unchanged.' :
          `Upload unavailable (${data.reason_code || 'invalid response'}). Your draft is unchanged.`);
        return;
      }
      if (typeof data.markdown !== 'string' || !/^!\[\]\((?:\.\.\/)*(?:assets\/)?upload-[0-9a-f]{64}\.(png|jpg|webp)\)$/.test(data.markdown)) throw new Error('invalid result');
      unknown = false;
      markdown = data.markdown;
      result.value = markdown;
      insert.disabled = false;
      say('Image ready. Copy the Markdown, or insert it at the end of this draft. The note has not been saved.');
    } catch {
      unknown = true;
      say('Upload outcome is unknown. Retry the same file to check safely; your draft is unchanged.');
    } finally {
      clearTimeout(timeout);
      active = null;
      busy = false;
      send.disabled = file.disabled = close.disabled = false;
    }
  });
  insert.addEventListener('click', () => {
    if (!markdown || busy) return;
    if (getPath() !== snapshot.path || editor.getSource() !== snapshot.source || editor.isComposing()) {
      insert.disabled = true;
      say('The draft changed while uploading. Copy the Markdown and choose where to insert it; nothing was changed.');
      return;
    }
    const newline = snapshot.source.match(/\r\n|\r|\n/)?.[0] || '\n';
    editor.setSource(snapshot.source + (snapshot.source ? newline + newline : '') + markdown + newline);
    dialog.close();
    editor.focus();
  });
}
