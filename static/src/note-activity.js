export const NOTE_ACTIVITY_CHANNEL = 'backstory.note-activity.v1';
const validPath = path => typeof path === 'string' && path.length > 0 && path.length <= 4096
  && !path.startsWith('/') && !path.includes('\\') && !path.split('/').some(part => !part || part === '.' || part === '..')
  && path.toLowerCase().endsWith('.md');
export function createNoteActivity({ channel = null, now = () => Date.now(), dispatch = () => {} } = {}) {
  return {
    publish(path, kind) {
      if (!validPath(path) || !['read', 'write'].includes(kind)) return false;
      try {
        const message = { type: 'backstory:note-activity', path, kind, time: now() };
        channel?.postMessage(message); dispatch(message); return Boolean(channel || dispatch);
      }
      catch { return false; }
    },
    parse(value, current = now()) {
      if (!value || typeof value !== 'object' || Object.keys(value).length !== 4
          || value.type !== 'backstory:note-activity' || !validPath(value.path)
          || !['read', 'write'].includes(value.kind) || !Number.isFinite(value.time)
          || value.time < current - 5000 || value.time > current + 1000) return null;
      return { path: value.path, kind: value.kind, time: value.time };
    },
  };
}
export function activityPulse(now, started, reducedMotion = false) {
  if (reducedMotion || !Number.isFinite(now) || !Number.isFinite(started)) return 0;
  return Math.max(0, 1 - Math.max(0, now - started) / 1800);
}
let sharedActivity;
export function publishNoteActivity(path, kind) {
  if (!sharedActivity) {
    let channel = null;
    try { if ('BroadcastChannel' in globalThis) channel = new BroadcastChannel(NOTE_ACTIVITY_CHANNEL); } catch {}
    sharedActivity = createNoteActivity({ channel, dispatch: message => globalThis.dispatchEvent?.(new CustomEvent('backstory:note-activity', { detail: message })) });
  }
  return sharedActivity.publish(path, kind);
}
