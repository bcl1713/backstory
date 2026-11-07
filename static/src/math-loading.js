let renderer;
const pending = [];
let running = false;
function pump() {
  if (running || !pending.length) return;
  running = true;
  setTimeout(async () => {
    const job = pending.shift();
    try {
      if (!job.valid()) return;
      renderer ||= import('/static/math-renderer.js');
      const module = await renderer;
      if (!job.valid()) return;
      const result = module.renderMath(job.model.expression, job.model.display, job.element.ownerDocument);
      if (!job.valid()) return;
      if (result) { job.element.replaceChildren(result); job.element.classList.add('lp-math-ready'); }
      else fallback(job.element);
    } catch { if (job.valid()) fallback(job.element); }
    finally { job.measured(); running = false; pump(); }
  }, 0);
}
function fallback(element) {
  const message = element.ownerDocument.createElement('span');
  message.className = 'lp-math-status';
  message.textContent = ' Math unavailable; source retained.';
  element.appendChild(message);
}
export function mountMath(element, model, valid, measured = () => {}) {
  // Editor virtualization bounds visible jobs; preview hydration has the same
  // note cap. Disposed jobs never render, and one expression runs per task.
  if (pending.length >= 100) { fallback(element); return; }
  pending.push({ element, model, valid, measured });
  pump();
}
