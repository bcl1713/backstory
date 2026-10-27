// Reads are snapshots, never write acknowledgements. Reject failed/malformed
// responses before any consumer can mistake them for an empty document.
export async function readNoteSnapshot(path, signal) {
  // Diagnostic fields are deliberately limited: no path, source, response
  // body, credentials or exception text, even for malformed server responses.
  const diagnostic = { status: null, contentType: null, etag: null };
  const fail = (kind, reason) => {
    throw Object.assign(new Error(`Snapshot read failed: ${reason}`), {
      kind, reason, diagnostic: { ...diagnostic, reason },
    });
  };
  let response;
  try {
    response = await fetch('/tools/read/?' + new URLSearchParams({ path }), {
      credentials: 'same-origin', cache: 'no-store', redirect: 'error',
      headers: { Accept: 'application/json' }, signal,
    });
  } catch { fail('read', 'transport'); }
  diagnostic.status = response.status;
  const contentType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  diagnostic.contentType = ['application/json', 'text/html', 'text/plain'].includes(contentType) ? contentType : contentType ? 'other' : null;
  const etag = response.headers.get('ETag');
  diagnostic.etag = etag === null ? null : /^(W\/)?"[0-9a-f]{64}"$/.test(etag) ? etag : 'other';
  if (response.status === 401 || response.status === 403) fail('authentication', 'http_status');
  if (response.status === 404) fail('missing', 'http_status');
  if (response.status === 503) fail('storage', 'http_status');
  if (!response.ok) fail('read', 'http_status');
  if (response.redirected) fail('read', 'redirect');
  if (contentType !== 'application/json') fail('read', 'content_type');
  let result;
  try { result = await response.json(); }
  catch (error) { fail('read', error instanceof SyntaxError ? 'json' : 'transport'); }
  if (!result || typeof result !== 'object' || Array.isArray(result)) fail('read', 'contract');
  const valid = {
    state: result.state === 'ok', authoritative: result.authoritative === true,
    path: result.path === path, source: typeof result.source === 'string',
    revision: typeof result.revision === 'string' && /^"[0-9a-f]{64}"$/.test(result.revision),
    bom: typeof result.bom === 'boolean', newline: ['\n', '\r\n', '\r'].includes(result.newline),
  };
  diagnostic.contract = valid;
  for (const [field, accepted] of Object.entries(valid)) if (!accepted) fail('read', field);
  // The JSON revision describes note bytes; the HTTP ETag describes this JSON
  // representation and may be weakened/replaced/removed by a proxy. Only the
  // strict application revision becomes a guarded write precondition.
  return result;
}

export function installNoteSync({ getState, onSnapshot, onFailure }) {
  let active = false, again = false, stopped = false, controller;
  async function check() {
    if (stopped || document.hidden) return;
    const before = getState();
    if (!before.path || before.blocked) return;
    if (active) { again = true; return; }
    active = true;
    controller = new AbortController();
    // A stalled network read must not prevent every future refresh.
    const timeout = setTimeout(() => controller.abort(), 15000);
    const current = () => {
      const now = getState();
      return !stopped && !now.blocked && now.path === before.path && now.version === before.version && now.revision === before.revision;
    };
    try {
      const snapshot = await readNoteSnapshot(before.path, controller.signal);
      // Local text is deliberately read by onSnapshot now, after the await.
      if (current() && !again) onSnapshot(snapshot);
    } catch (error) {
      if (current() && !again) onFailure(error);
    } finally {
      clearTimeout(timeout);
      active = false;
      if (again) { again = false; queueMicrotask(check); }
    }
  }
  // Periodic ticks must not supersede every read on a slow connection.
  // Explicit focus/check requests can still ask for a fresher snapshot.
  const poll = () => { if (!active) void check(); };
  let timer = setInterval(poll, 5000);
  window.addEventListener('focus', check);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) void check(); });
  window.addEventListener('pagehide', () => { stopped = true; clearInterval(timer); controller?.abort(); });
  window.addEventListener('pageshow', event => {
    if (event.persisted) { stopped = false; timer = setInterval(poll, 5000); void check(); }
  });
  return { check };
}
