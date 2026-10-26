import { MAX_THEME_BYTES, parseAlacrittyTheme, validateTheme } from './theme-palette.js';

const storageKey = 'backstory.theme.v1';

export function mountThemes() {
  const controls = document.querySelector('[data-theme-controls]');
  if (!controls) return;
  const input = controls.querySelector('input');
  const reset = controls.querySelector('button');
  const status = controls.querySelector('[data-theme-status]');
  const root = document.documentElement;
  let applied = [];
  let revision = 0;
  const apply = palette => {
    for (const token of applied) root.style.removeProperty(token === 'color-scheme' ? token : `--${token}`);
    applied = Object.keys(palette || {});
    for (const token of applied) root.style.setProperty(token === 'color-scheme' ? token : `--${token}`, palette[token]);
  };
  const displayName = name => typeof name === 'string' ? name.replace(/\.toml$/i, '').slice(0, 100).trim() || 'Imported theme' : 'Imported theme';
  status.textContent = 'Tokyo Night (default).';
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      if (raw.length > 16384) throw new Error('Invalid saved theme.');
      const saved = JSON.parse(raw);
      if (saved.version !== 1) throw new Error('Unknown saved theme version.');
      apply(validateTheme(saved.palette));
      status.textContent = `${displayName(saved.name)} · Remembered in this browser.`;
    }
  } catch {
    status.textContent = 'Tokyo Night (default). Saved theme unavailable.';
  }
  controls.hidden = false;
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const current = ++revision;
    try {
      if (file.size > MAX_THEME_BYTES) throw new Error('Choose a TOML file no larger than 256 KiB.');
      const palette = parseAlacrittyTheme(await file.text());
      if (current !== revision) return;
      const name = displayName(file.name);
      apply(palette);
      try {
        localStorage.setItem(storageKey, JSON.stringify({ version: 1, name, palette }));
        status.textContent = `${name} · Remembered in this browser.`;
      } catch {
        status.textContent = `${name} · Applied for this page; this choice cannot be remembered because browser storage is unavailable.`;
      }
    } catch (error) {
      if (current === revision) status.textContent = `Could not import theme. ${error.message}`;
    }
  });
  reset.addEventListener('click', () => {
    ++revision;
    apply(null);
    input.value = '';
    try {
      localStorage.removeItem(storageKey);
      status.textContent = 'Tokyo Night (default) restored.';
    } catch {
      status.textContent = 'Tokyo Night restored for this page; this choice cannot be remembered because browser storage is unavailable.';
    }
  });
}
