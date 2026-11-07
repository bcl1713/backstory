// Advisory only: connectivity heuristics never authorize/retry a write or reload
// a document. Existing save/conflict/protected-draft handling stays authoritative.
const status = document.querySelector('[data-connectivity-status]');
if (status) {
  const refresh = () => { status.hidden = navigator.onLine !== false; };
  refresh();
  window.addEventListener('online', refresh);
  window.addEventListener('offline', refresh);
}
