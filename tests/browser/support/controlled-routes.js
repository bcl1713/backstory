// Keep delayed test responses registered until their callbacks have finished.
export async function trackRoutes(page, pattern, handler) {
  const pending = new Set();
  const tracked = async route => {
    const task = Promise.resolve().then(() => handler(route));
    pending.add(task);
    try { await task; }
    finally { pending.delete(task); }
  };
  await page.route(pattern, tracked);
  return async () => {
    // Removing interception first can auto-continue another held request when
    // the first callback finishes. Drain while the registration still exists.
    while (pending.size) await Promise.all([...pending]);
    await page.unroute(pattern, tracked);
  };
}
