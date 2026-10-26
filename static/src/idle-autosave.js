// Only user edits arm this timer. Operation completion can flush due work, but
// neither a formatter response nor an external refresh starts another save.
export function createIdleAutosave({ getState, save, delay = 5000 }) {
  let timer, pending = false, paused = false;
  const cancel = () => { clearTimeout(timer); timer = undefined; pending = false; };
  const flush = () => {
    if (!pending || paused) return;
    const state = getState();
    if (!state.enabled || !state.dirty) { cancel(); return; }
    if (state.blocked || state.composing) return;
    pending = false;
    void save();
  };
  return {
    edited() {
      cancel();
      if (paused || !getState().enabled) return;
      timer = setTimeout(() => { timer = undefined; pending = true; flush(); }, delay);
    },
    cancel,
    pause() { cancel(); paused = true; },
    resume() { cancel(); paused = false; },
    flush,
    destroy() { cancel(); paused = true; },
  };
}
