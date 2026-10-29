const key = 'backstory.vim.v1';
export function initialVimEnabled(storage, desktop) {
  try {
    const saved = storage?.getItem(key);
    if (saved === 'on' || saved === 'off') return saved === 'on';
  } catch { /* Browser storage is optional. */ }
  return desktop;
}
export function rememberVimEnabled(storage, enabled) {
  try { storage?.setItem(key, enabled ? 'on' : 'off'); } catch { /* Page-local choice still works. */ }
}
export function shouldFocusEditor(desktop, active, body, root) {
  return desktop && (!active || active === body || active === root);
}
