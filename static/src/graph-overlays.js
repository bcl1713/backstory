// Layers change only DOM presentation. They never touch graph or camera state.
export function graphOverlays(root, { navigation, onShow = () => {}, onHide = () => {} }) {
  const life = new AbortController(), sheets = [...root.querySelectorAll('[data-graph-overlay]')];
  const toggles = [...root.querySelectorAll('[data-graph-toggle]')];
  let active = null, returnFocus = null;
  const listen = (el, name, fn) => el.addEventListener(name, fn, {signal:life.signal});
  function close({ restore = true } = {}) {
    if (!active) return false;
    onHide(active.dataset.graphOverlay); active.hidden = true; active = null;
    for (const toggle of toggles) toggle.setAttribute('aria-expanded','false');
    const destination = typeof returnFocus === 'function' ? returnFocus() : returnFocus;
    if (restore) (destination?.isConnected && !destination.closest('[hidden]') && root.contains(destination) ? destination : navigation()).focus({preventScroll:true});
    returnFocus = null; return true;
  }
  function show(name, opener = document.activeElement) {
    const sheet = sheets.find(el => el.dataset.graphOverlay === name); if (!sheet) return;
    if (active === sheet) { close(); return; }
    // Switching layers keeps the original graph/toolbar focus destination.
    const previousFocus = typeof opener !== 'function' && active?.contains(opener) ? returnFocus : opener;
    close({restore:false}); active = sheet; returnFocus = previousFocus;
    active.hidden = false;
    for (const toggle of toggles) toggle.setAttribute('aria-expanded',String(toggle.dataset.graphToggle === name));
    onShow(name);
    (active.querySelector('[data-graph-find]') || active.querySelector('[data-graph-dismiss]') || active).focus({preventScroll:true});
  }
  for (const sheet of sheets) {
    sheet.hidden = true;
    for (const button of sheet.querySelectorAll('[data-graph-dismiss]')) listen(button,'click',()=>close());
  }
  for (const toggle of toggles) listen(toggle,'click',()=>show(toggle.dataset.graphToggle,toggle));
  // Visual viewport changes (including software keyboard) size only sheets.
  // The canvas stays attached to the stable small viewport behind them.
  function sizeSheets() {
    const panel = root.querySelector('[data-graph-panel]') || root, bounds = panel.getBoundingClientRect();
    const viewport = window.visualViewport;
    const top = viewport?.offsetTop || 0, bottom = top + (viewport?.height || innerHeight);
    panel.style.setProperty('--graph-keyboard-inset',`${Math.max(0,bounds.bottom-bottom)}px`);
    panel.style.setProperty('--graph-sheet-height',`${Math.max(80,Math.min(bounds.height,bottom-Math.max(bounds.top,top))-76)}px`);
  }
  if (window.visualViewport) { listen(window.visualViewport,'resize',sizeSheets); listen(window.visualViewport,'scroll',sizeSheets); }
  const resize = new ResizeObserver(sizeSheets); resize.observe(root.querySelector('[data-graph-panel]') || root);
  listen(window,'resize',sizeSheets); sizeSheets();
  return { show, close, get active() { return active?.dataset.graphOverlay || null; }, destroy() { close({restore:false}); resize.disconnect(); life.abort(); } };
}
