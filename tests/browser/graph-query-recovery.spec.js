import { showGraphLayer, graphControl, applyGraphFilter } from './support/graph.js';
import { test, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { runtime } from './support/server.js';

const meta = { schema_version: 1, scope: 'synthetic-session', snapshot_id: 'snapshot-1', state: 'ok', authoritative: false, untrusted_content: true, projection_complete: true,
  generation: 1, mutation: 1, relation_epoch: 1, eligibility_version: 'synthetic', observed_at: '2026-11-07T00:00:00Z',
  freshness: { state: 'ready' }, limiting_reasons: [], boundary_connections: false };
const node = path => ({ path, title: path, revision: 'r', href: '/notes/' + path });

async function openGraph(page, reason) {
  const requests = [];
  await page.route(/\/tools\/graph\//, route => {
    const query = new URL(route.request().url()).searchParams;
    requests.push(Object.fromEntries(query));
    if (query.get('query') !== 'saved') {
      if (reason === 'projection_incomplete') return route.fulfill({ json: { ...meta, state: 'incomplete',
        projection_complete: false, limiting_reasons: ['projection_incomplete', 'index_updating'],
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

test('bulk query limits offer restart and filter recovery without depth requests', async ({ page }) => {
  const { panel, requests } = await openGraph(page, 'graph_query_limited');
  await expect(panel.locator('[data-graph-status]')).toContainText('query limit');
  await showGraphLayer(panel,'controls');
  await expect(panel.getByRole('button', { name: 'Restart loading', exact: true })).toBeVisible();
  await applyGraphFilter(panel, 'saved');
  await expect.poll(() => requests.at(-1)?.query).toBe('saved');
  await expect(panel.locator('[data-graph-summary]')).toContainText('2 notes');
  expect(requests.at(-1)).toEqual({ query: 'saved' });
  if (!await panel.locator('[data-graph-list]').isVisible()) await panel.getByRole('button', { name: 'Connection list', exact: true }).click();
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

test('complete bulk transport of a partial index stays explicitly incomplete', async ({ page }) => {
  const { panel } = await openGraph(page, 'projection_incomplete');
  await expect(panel.locator('[data-graph-summary]')).toContainText('1 notes');
  await expect(panel.locator('[data-graph-summary]')).not.toContainText('Complete');
  await expect(panel.locator('[data-graph-summary]')).toContainText('Index updating');
  await expect(panel.getByRole('button', { name: 'Try one hop', exact: true })).toHaveCount(0);
  await applyGraphFilter(panel, 'saved');
  await expect(panel.locator('[data-graph-summary]')).toContainText('2 notes');
  await expect(panel.locator('[data-graph-summary]')).toContainText('Complete');
});

test('real two-hop hub loads one bulk snapshot and changes depth locally', async ({ page }, info) => {
  const env = { ...process.env, DJANGO_SETTINGS_MODULE: 'backstory.settings',
    BACKSTORY_WIKI_ROOT: `${runtime}/wiki`, BACKSTORY_DATA_DIR: `${runtime}/data`,
    BACKSTORY_IDENTITY_PATH: '.backstory-marker', BACKSTORY_COOKIE_MODE: 'localhost',
    BACKSTORY_ALLOWED_HOSTS: 'localhost,127.0.0.1' };
  const indexed = spawnSync('.venv/bin/python', ['-c',
    'import django; django.setup(); from django.conf import settings; from tests.fixtures.graph import populate_two_hop_hub; populate_two_hop_hub(settings.BACKSTORY_WIKI_ROOT)'],
  { env, encoding: 'utf8' });
  expect(indexed.status, indexed.stderr).toBe(0);
  await page.goto('/accounts/login/');
  await page.getByLabel('Username', { exact: true }).fill('slice');
  await page.getByLabel('Password', { exact: true }).fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.goto('/notes/Population%20Root.md');
  await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');
  const responses = [], started = performance.now();
  const observe = async response => {
    if (new URL(response.url()).pathname !== '/tools/graph/snapshot/') return;
    responses.push({ status: response.status(), data: await response.json(),
      elapsedMs: Math.round(performance.now() - started) });
  };
  page.on('response', observe);
  await page.evaluate(() => document.dispatchEvent(new Event('backstory:open-graph')));
  const panel = page.locator('[data-graph-dialog]'), summary = panel.locator('[data-graph-summary]');
  await expect.poll(() => responses.length).toBeGreaterThan(0);
  expect(responses[0].status).toBe(200);
  expect(responses[0].data.edges.length).toBeGreaterThan(0);
  await expect(summary).toContainText('93 notes · 278 directed links · Complete');
  expect(responses).toHaveLength(1);
  expect(responses.every(r => r.status === 200)).toBe(true);
  const metrics = { requests: responses.length, firstConnectedMs: responses[0].elapsedMs,
    completeMs: Math.round(performance.now() - started), scope: 'browser_HTTP_and_UI_including_client_timers' };
  page.off('response', observe);
  console.log('synthetic_population_browser', metrics);
  await info.attach('population-timing', { body: JSON.stringify(metrics), contentType: 'application/json' });
  await page.screenshot({ path: info.outputPath('population-complete.png'), fullPage: true });
  await showGraphLayer(panel, 'controls'); await panel.locator('[data-graph-control-options]').evaluate(el => { el.open = true; });
  // Change local depth while a bulk refresh is in flight. Its response must use
  // the current requested depth and retain the opening root.
  await graphControl(panel, 'Refresh');
  await graphControl(panel, 'Decrease hop depth');
  await expect(summary).toContainText('8 notes · 7 directed links · Complete');
  await graphControl(panel, 'Increase hop depth');
  await expect(summary).toContainText('93 notes · 278 directed links · Complete');
  await page.screenshot({ path: info.outputPath('population-depth-retry.png'), fullPage: true });
});
