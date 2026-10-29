// Opening stays responsive; saves await this bounded initialization attempt.
// The server atomically accepts this only while its timezone is still unset.
export async function initializeWikiTimezone({
  fetcher = globalThis.fetch,
  csrfToken,
  browserTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone,
} = {}) {
  if (!csrfToken) return;
  try {
    const response = await fetcher('/settings/timezone/?format=json', {
      credentials: 'same-origin', cache: 'no-store', redirect: 'error',
      headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return;
    const state = await response.json();
    if (state?.source !== 'fallback' || state.can_change !== true) return;
    const timezone = browserTimezone();
    if (typeof timezone !== 'string' || !timezone.trim()) return;
    await fetcher('/settings/timezone/', {
      method: 'POST', credentials: 'same-origin', cache: 'no-store', redirect: 'error',
      headers: { Accept: 'application/json', 'X-CSRFToken': csrfToken },
      body: new URLSearchParams({ timezone, action: 'initialize' }),
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    // Offline, login expiry, or unsupported Intl: retain the server's UTC fallback.
    // No retries, focus changes, or editor state changes.
  }
}

// Shared across the separately built shell, editor and WebMCP bundles.
// A first save must not overtake the owner's one-time timezone initialization.
export function ensureWikiTimezone(options = {}, host = globalThis) {
  const key = Symbol.for('backstory.wikiTimezoneReady');
  return host[key] ??= initializeWikiTimezone(options);
}
