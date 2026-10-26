// Reads are snapshots, never write acknowledgements. Reject failed/malformed
// responses before any consumer can mistake them for an empty document.
export async function readNoteSnapshot(path, signal) {
  const response = await fetch('/tools/read/?' + new URLSearchParams({ path }), {
    credentials: 'same-origin', cache: 'no-store', redirect: 'error',
    headers: { Accept: 'application/json' }, signal,
  });
  const fail = kind => { throw Object.assign(new Error(kind), { kind }); };
  if (response.status === 401 || response.status === 403) fail('authentication');
  if (response.status === 404) fail('missing');
  if (response.status === 503) fail('storage');
  if (!response.ok || response.redirected || !response.headers.get('content-type')?.startsWith('application/json')) fail('read');
  const result = await response.json();
  if (result.state !== 'ok' || result.authoritative !== true || result.path !== path ||
      typeof result.source !== 'string' || !/^"[0-9a-f]{64}"$/.test(result.revision) ||
      response.headers.get('ETag') !== result.revision || typeof result.bom !== 'boolean' ||
      !['\n', '\r\n', '\r'].includes(result.newline)) fail('read');
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
