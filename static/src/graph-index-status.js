// Diagnostics use fixed public vocabulary; never echo arbitrary server strings.
const phases = { idle:'Idle', discover:'Discovering changes', validate:'Validating notes', dependencies:'Checking dependencies', relations:'Projecting relationships', priority:'Processing changed paths', backoff:'Waiting to retry', ready:'Ready' };
const states = { ready:'Ready', partial:'Updating', stale:'Changes pending', backoff:'Waiting to retry', unavailable:'Storage unavailable' };
const modes = { native:'native notifications', poll:'polling', polling:'polling', disabled:'polling', starting:'starting', unknown:'unknown' };
const health = { healthy:'healthy', ready:'healthy', starting:'starting', degraded:'reconciliation required', unavailable:'unavailable', polling:'polling', stopped:'stopped', disabled:'disabled', unknown:'unknown' };
const reasons = { polling_configured:'Polling-only mode', watch_unavailable:'Notifications unavailable', overflow:'Notification overflow', directory_changed:'Directory coverage changed', watcher_unavailable:'Notifications unavailable', watcher_overflow:'Notification overflow', queue_overflow:'Queue overflow', watcher_restart:'Watcher restart', storage_changed:'Storage identity changed', watch_limit:'Watch limit reached', watcher_failed:'Watcher failed', coverage_uncertain:'Coverage uncertain', polling_only:'Polling-only mode' };
const count = value => Number.isSafeInteger(value) && value >= 0 ? value.toLocaleString('en-US') : '0';
const timestamp = value => {
  const date = new Date(Number(value)*1000);
  return Number.isFinite(value) && value > 0 && Number.isFinite(date.getTime()) ? date.toISOString().replace('T',' ').replace('.000Z',' UTC') : 'not yet completed';
};
export function indexProgress(data) {
  return `${states[data.state] || 'Unknown'} · ${phases[data.phase] || 'Unknown phase'}. ${count(data.metadata_checked)} metadata entries checked · ${count(data.parsed_notes)} changed notes parsed · ${count(data.dependencies_checked)} dependencies checked · ${count(data.pending_jobs)} queued changes. Last reconciliation: ${timestamp(data.last_completed)}. Last content verification: ${timestamp(data.last_verified)}. Watcher: ${modes[data.watcher_mode] || 'unknown'} · ${health[data.watcher_health] || 'unknown'}.${data.fallback_reason ? ` Fallback: ${reasons[data.fallback_reason] || 'Reconciliation required'}.` : ''}`;
}
