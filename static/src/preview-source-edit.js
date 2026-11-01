// A completed gesture enters source; pointer-down alone must still allow touch
// scrolling. Keep the native keyboard button separate from semantic content
// (especially MathML, whose descendants a button role would flatten).
export function bindSourceEdit(surface, { label, valid, activate }) {
  const button = surface.ownerDocument.createElement('button');
  button.type = 'button';
  button.className = 'lp-source-edit';
  button.textContent = '✎';
  button.setAttribute('aria-label', label);
  button.title = label;
  surface.classList.add('lp-direct-edit');
  surface.appendChild(button);
  let gesture;
  const control = target => target.closest?.('button,a,input,select,textarea');
  const enter = () => { if (surface.isConnected && valid()) activate(); };
  button.addEventListener('click', event => { event.stopPropagation(); enter(); });
  surface.addEventListener('mousedown', event => {
    if (event.button === 0 && !control(event.target)) event.preventDefault();
  });
  surface.addEventListener('pointerdown', event => {
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY,
      cancelled: !event.isPrimary || event.button !== 0 || !!control(event.target) };
  });
  const moved = event => {
    if (gesture && gesture.id === event.pointerId
        && Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 8) gesture.cancelled = true;
  };
  surface.addEventListener('pointermove', moved);
  surface.addEventListener('pointerup', moved);
  surface.addEventListener('pointercancel', () => { if (gesture) gesture.cancelled = true; });
  surface.addEventListener('scroll', () => { if (gesture) gesture.cancelled = true; }, true);
  surface.addEventListener('dragstart', event => { if (gesture) gesture.cancelled = true; event.preventDefault(); });
  surface.addEventListener('click', event => {
    if (control(event.target) || event.button !== 0) return;
    event.preventDefault();
    if (!gesture?.cancelled) enter();
    gesture = null;
  });
}
