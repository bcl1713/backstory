const safeHref = href => typeof href === 'string' && (/^\/(?!\/)/.test(href) || href.startsWith('#') || /^(https?:|mailto:)/i.test(href));
export function createLinkFollower({ resolve, navigate, isCurrent, onStatus = () => {} }) {
  let generation = 0;
  let pending = false;
  const follow = async (link, source, snapshot) => {
    const request = ++generation;
    if (!link || !source) { if (pending) onStatus(''); pending = false; return; }
    pending = true;
    onStatus('Resolving link…');
    try {
      const result = await resolve({ source, target: link.target, kind: link.kind });
      if (request !== generation) return;
      pending = false;
      if (!isCurrent(snapshot)) { onStatus(''); return; }
      const href = result.action_href || result.href;
      if (!['resolved', 'external', 'missing', 'ambiguous'].includes(result.state) || !safeHref(href)) {
        onStatus('Link unavailable. No navigation performed.');
        return;
      }
      onStatus('');
      navigate(href);
    } catch {
      if (request === generation) {
        pending = false;
        onStatus(isCurrent(snapshot) ? 'Link unavailable. No navigation performed.' : '');
      }
    }
  };
  follow.cancel = () => { generation++; if (pending) onStatus(''); pending = false; };
  return follow;
}
// A connected anchor follows the same document-level draft guards as a click.
export function activateLink(href) {
  if (!safeHref(href)) return;
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.hidden = true;
  document.body.append(anchor);
  try { anchor.click(); } finally { anchor.remove(); }
}
