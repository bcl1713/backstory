import { test, expect } from '@playwright/test';

const meta = { state: 'ok', authoritative: false, untrusted_content: true, projection_complete: true,
  generation: 1, mutation: 1, relation_epoch: 1, eligibility_version: 'synthetic', observed_at: '2026-11-07T00:00:00Z',
  freshness: { state: 'ready' }, limiting_reasons: [], boundary_connections: false };
const node = path => ({ path, title: path, revision: 'r', href: '/notes/' + path });

async function openGraph(page, reason) {
  const requests = [];
  await page.route(/\/tools\/graph\//, route => {
    const query = new URL(route.request().url()).searchParams;
    requests.push(Object.fromEntries(query));
    if (query.get('depth') !== '1') {
      if (reason === 'neighborhood_limit') return route.fulfill({ json: { ...meta, state: 'incomplete',
        projection_complete: false, limiting_reasons: ['edge_candidate_limit', 'neighborhood_limit'],
        nodes: [node('Slice.md')], edges: [], next_cursor: null } });
      return route.fulfill({ status: 503,
        json: { untrusted_content: true, state: 'unavailable', reason_code: reason, restart: false } });
    }
    return route.fulfill({ json: { ...meta, nodes: [node('Slice.md'), node('Other.md')],
      edges: [{ source: 'Slice.md', destination: 'Other.md', occurrence_count: 1 }], next_cursor: null } });
  });
  await page.route(/\/tools\/links\//, route => route.fulfill({ json: { ...meta, items: [], next_cursor: null } }));
  await page.goto('/accounts/login/');
  await page.getByLabel('Username', { exact: true }).fill('slice');
  await page.getByLabel('Password', { exact: true }).fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.goto('/notes/Slice.md');
  await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');
  await page.evaluate(() => document.dispatchEvent(new Event('backstory:open-graph')));
  return { panel: page.locator('[data-graph-dialog]'), requests };
}

test('query limits offer one-hop recovery preserving local center and filters', async ({ page }) => {
  const { panel, requests } = await openGraph(page, 'graph_query_limited');
  await expect(panel.locator('[data-graph-status]')).toContainText('query limit');
  await panel.getByRole('searchbox', { name: 'Graph search' }).fill('saved');
  await expect.poll(() => requests.at(-1)?.query).toBe('saved');
  await expect(panel.locator('[data-graph-status]')).toContainText('query limit');
  if (!await panel.locator('[data-graph-list]').isVisible()) await panel.getByRole('button', { name: 'Connection list', exact: true }).click();
  await expect(panel.locator('[data-graph-nodes]')).not.toContainText('still being prepared');
  await panel.getByRole('button', { name: 'Try one hop', exact: true }).click();
  await expect(panel.locator('[data-graph-summary]')).toContainText('2 notes');
  expect(requests.at(-1)).toMatchObject({ path: 'Slice.md', depth: '1', query: 'saved' });
  await expect(panel.locator('[data-graph-nodes]')).toContainText('Other.md');
  await expect(panel.getByRole('button', { name: 'Try one hop', exact: true })).toHaveCount(0);
});

test('database errors remain distinct from query limits and relationship preparation', async ({ page }) => {
  const { panel } = await openGraph(page, 'graph_database_error');
  await expect(panel.locator('[data-graph-status]')).toContainText('database error');
  if (!await panel.locator('[data-graph-list]').isVisible()) await panel.getByRole('button', { name: 'Connection list', exact: true }).click();
  await expect(panel.locator('[data-graph-nodes]')).toContainText('Loading stopped');
  await expect(panel.locator('[data-graph-nodes]')).not.toContainText('still being prepared');
  await expect(panel.getByRole('button', { name: 'Try one hop', exact: true })).toHaveCount(0);
});

test('bounded partial neighborhoods retain evidence and offer a smaller scope', async ({ page }) => {
  const { panel } = await openGraph(page, 'neighborhood_limit');
  await expect(panel.locator('[data-graph-summary]')).toContainText('1 notes');
  await expect(panel.locator('[data-graph-summary]')).not.toContainText('Complete');
  await expect(panel.locator('[data-graph-status]')).toContainText('neighborhood limit');
  await panel.getByRole('button', { name: 'Try one hop', exact: true }).click();
  await expect(panel.locator('[data-graph-summary]')).toContainText('2 notes');
  await expect(panel.locator('[data-graph-summary]')).toContainText('Complete');
});
