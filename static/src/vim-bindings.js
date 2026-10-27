import { Compartment, Transaction } from '@codemirror/state';
import { vim, getCM } from '@replit/codemirror-vim';

const browserKeys = new Set(['l', 'f', 't', 'w', 'n', 'p']);
function keepBrowserShortcut(event) {
  if (event.key === 'Tab' || (!event.altKey && (event.ctrlKey || event.metaKey) && browserKeys.has(event.key.toLowerCase()))) {
    // Let the browser perform its default action without invoking editor keymaps.
    event.stopPropagation();
  }
}

// Bindings have their own lifetime, independent of preview decorations/history.
export function createVimBindings(onModeChange) {
  const compartment = new Compartment();
  let adapter = null;
  let removeGuards = () => {};
  const changed = ({ mode, subMode }) => {
    onModeChange(mode === 'visual' && subMode ? `visual ${subMode === 'linewise' ? 'line' : 'block'}` : mode);
  };
  return {
    extension: compartment.of([]),
    setEnabled(view, enabled) {
      if (Boolean(adapter) === enabled) return;
      adapter?.off('vim-mode-change', changed);
      removeGuards();
      view.dispatch({
        effects: compartment.reconfigure(enabled ? vim() : []),
        annotations: Transaction.addToHistory.of(false),
      });
      adapter = enabled ? getCM(view) : null;
      adapter?.on('vim-mode-change', changed);
      if (adapter) {
        view.dom.addEventListener('keydown', keepBrowserShortcut, true);
        removeGuards = () => view.dom.removeEventListener('keydown', keepBrowserShortcut, true);
      }
      onModeChange(adapter ? 'normal' : 'off');
    },
    destroy() { adapter?.off('vim-mode-change', changed); removeGuards(); },
  };
}
