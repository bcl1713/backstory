// This small, independent guard runs before the enhanced editor bundle. The
// server/CSS already mask raw source, so delaying this script cannot flash it.
const stage = document.querySelector('[data-editor-stage]');
if (stage) {
  const loading = document.querySelector('[data-editor-loading]');
  const readiness = document.querySelector('[data-editor-readiness]');
  let timer;
  const finish = () => {
    clearTimeout(timer);
    stage.dataset.editorState = 'ready';
    loading.hidden = true;
  };
  const fallback = () => {
    if (stage.dataset.editorState !== 'loading') return;
    stage.dataset.plainRequested = 'true';
    document.querySelector('[data-markdown-editor]').hidden = true;
    document.querySelector('[data-source-fallback]').hidden = false;
    readiness.textContent = 'Enhanced editor unavailable. Complete source is available in plain text.';
    finish();
    stage.dispatchEvent(new Event('editor-fallback'));
  };
  stage.addEventListener('editor-ready', finish);
  window.addEventListener('hashchange', () => { if (location.hash === '#plain-source') fallback(); });
  window.addEventListener('error', event => {
    if (event.target instanceof HTMLScriptElement && event.target.hasAttribute('data-editor-bundle')) fallback();
  }, true);
  // A hung network or module evaluation must not leave an invisible document.
  timer = setTimeout(fallback, 10000);
  if (location.hash === '#plain-source') fallback();
}
