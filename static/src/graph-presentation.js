export function createPresentation({ graph, wakeLock = globalThis.navigator?.wakeLock, document = graph?.ownerDocument || globalThis.document, onState = () => {} }) {
  let mode = 'closed', wake = 'off', wantsWake = false, sentinel = null, destroyed = false, generation = 0;
  const ownsFullscreen = () => Boolean(document?.fullscreenElement &&
    (document.fullscreenElement === graph || graph?.contains?.(document.fullscreenElement)));
  const emit = () => onState({ mode, wake, wantsWake });
  async function releaseWake() {
    const current = sentinel; sentinel = null;
    if (current) { try { await current.release(); } catch {} }
    if (wantsWake && wake === 'active') wake = document?.hidden ? 'suspended' : 'off';
    emit();
  }
  async function acquireWake() {
    if (!wantsWake || mode === 'closed' || document?.hidden || destroyed) return;
    if (!wakeLock?.request) { wake = 'unsupported'; emit(); return; }
    try {
      const next = await wakeLock.request('screen');
      if (destroyed || !wantsWake || mode === 'closed' || document?.hidden) { await next.release(); return; }
      sentinel = next; wake = 'active';
      next.addEventListener?.('release', () => { if (sentinel === next) { sentinel = null; wake = wantsWake ? 'released' : 'off'; emit(); } }, { once: true });
    } catch { wake = 'denied'; }
    emit();
  }
  async function enter() {
    if (destroyed || mode !== 'closed') return;
    const ticket = ++generation;
    mode = 'fallback'; emit();
    try {
      if (!graph?.requestFullscreen) throw new Error('unsupported');
      await graph.requestFullscreen();
      if (destroyed || ticket !== generation) {
        if (ownsFullscreen()) { try { await document.exitFullscreen(); } catch {} }
        return;
      }
      mode = ownsFullscreen() ? 'fullscreen' : 'fallback';
    } catch {
      if (destroyed || ticket !== generation) return;
      mode = 'fallback';
    }
    emit(); await acquireWake();
  }
  async function exit() {
    if (mode === 'closed') return;
    generation++;
    wantsWake = false; mode = 'closed'; emit(); await releaseWake();
    if (ownsFullscreen()) {
      try { await document.exitFullscreen(); } catch {}
    }
    wake = 'off'; emit();
  }
  async function toggleWake() {
    if (mode === 'closed') return;
    wantsWake = !wantsWake;
    if (wantsWake) { wake = 'requesting'; emit(); await acquireWake(); }
    else { await releaseWake(); wake = 'off'; emit(); }
  }
  async function visibilityChanged(hidden) {
    if (hidden) { await releaseWake(); if (wantsWake) wake = 'suspended'; emit(); }
    else if (mode !== 'closed' && wantsWake) { wake = 'requesting'; emit(); await acquireWake(); }
  }
  function fullscreenChanged() {
    if (mode === 'closed' || destroyed) return;
    const owns = document?.fullscreenElement && (document.fullscreenElement === graph || graph?.contains?.(document.fullscreenElement));
    if (!owns && mode === 'fullscreen') { void exit(); return; }
    mode = owns ? 'fullscreen' : 'fallback'; emit();
  }
  return { enter, exit, toggleWake, visibilityChanged, fullscreenChanged,
    destroy() { destroyed = true; generation++; wantsWake = false; void releaseWake(); mode = 'closed'; wake = 'off'; emit(); } };
}
