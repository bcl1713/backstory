import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test.use({ video: { mode: 'on', size: { width: 1180, height: 900 } } });

// Renderer-only maximum fixture. Server query/index measurements use real
// synthetic files through scripts/benchmark_graph.py, separately from this stub.
const fixture = () => {
  const revision = '"' + 'a'.repeat(64) + '"';
  const nodes = Array.from({ length: 200 }, (_, i) => ({ path: `Synthetic/Node ${String(i).padStart(3, '0')}.md`,
    title: i === 5 ? '<img src=https://example.invalid/tracker> Synthetic' : `Synthetic ${String(i).padStart(3, '0')}`,
    revision, href: `/notes/Synthetic/Node%20${String(i).padStart(3, '0')}.md` }));
  const edges = [];
  const add = (a, b) => edges.push({ source: nodes[a].path, destination: nodes[b].path, occurrence_count: 1,
    source_revision: revision, occurrence_id: edges.length + 1, position: [2, 1], position_precision: 'advisory' });
  for (let i = 0; i < 80; i++) for (let j = 1; j <= 5; j++) add(i, Math.floor(i / 40) * 40 + (i + j) % 40);
  add(39, 40);
  for (let i = 80; i < 119; i++) add(i, i + 1);
  for (let i = 121; i <= 160; i++) add(120, i);
  for (let i = 0; i < 20; i++) add(i, i + 9);
  return { state: 'ok', nodes, edges, authoritative: false, untrusted_content: true, projection_complete: true,
    generation: 1, mutation: 1, relation_epoch: 1, observed_at: '2026-11-07T00:00:00Z',
    freshness: { state: 'ready', scope: 'synthetic_renderer_fixture' }, limiting_reasons: [], next_cursor: null,
    limits: { nodes: 200, edges: 500 }, boundary_connections: false };
};

test('maximum vector fixture, installed palettes, bloom budgets and escaping have synthetic visual evidence', async ({ page }, info) => {
  test.setTimeout(60000);
  await page.goto('/accounts/login/');
  await page.getByLabel('Username', { exact: true }).fill('slice');
  await page.getByLabel('Password', { exact: true }).fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  const data = fixture();
  expect(data.edges).toHaveLength(500);
  await page.route(/\/tools\/graph\//, route => route.fulfill({ json: data }));
  await page.route(/\/tools\/links\//, route => {
    const path = new URL(route.request().url()).searchParams.get('path');
    const items = data.edges.filter(edge => edge.source === path || edge.destination === path).slice(0, 100).map(edge => ({
      occurrence_id: edge.occurrence_id, source: edge.source, source_revision: edge.source_revision,
      target: edge.destination, kind: 'wiki', fragment: '', position: edge.position, position_precision: 'advisory',
      occurrence_kind: 'link', state: 'resolved', destination: edge.destination, resource_type: 'note', choices: [],
    }));
    return route.fulfill({ json: { ...data, nodes: undefined, edges: undefined, items } });
  });
  await page.goto('/notes/Slice.md');
  await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');
  const started = Date.now();
  await page.evaluate(() => document.dispatchEvent(new Event('backstory:open-graph')));
  const panel = page.locator('[data-graph-dialog]');
  const map = panel.locator('[data-graph-map]');
  await expect(map.locator('[data-node-path]')).toHaveCount(200);
  await expect(map.locator('.graph-edge')).toHaveCount(500);
  const firstUsableMs = Date.now() - started;
  const network = [];
  page.on('request', r => { if (new URL(r.url()).origin !== new URL(page.url()).origin) network.push(r.url()); });
  await panel.getByRole('button', { name: 'Connection list', exact: true }).click();
  await panel.getByRole('button', { name: 'Inspect Synthetic 000', exact: true }).click();
  await panel.getByRole('button', { name: 'Connection list', exact: true }).click();
  const measurements = [];
  for (const intensity of ['0', '1', '2']) {
    await panel.getByRole('slider', { name: 'Bloom intensity' }).fill(intensity);
    const measured = await page.evaluate(async () => {
      const times = []; let previous = performance.now();
      for (let i = 0; i < 75; i++) { const now = await new Promise(requestAnimationFrame); times.push(now - previous); previous = now; }
      times.sort((a, b) => a - b);
      return { meanFrameMs: times.reduce((a, b) => a + b, 0) / times.length,
        p95FrameMs: times[Math.floor(times.length * .95)], heapBytes: performance.memory?.usedJSHeapSize ?? null };
    });
    measurements.push({ intensity: Number(intensity), ...measured });
    await map.focus(); await page.keyboard.press('ArrowDown');
  }
  await panel.getByRole('button', { name: 'Connection list', exact: true }).click();
  await panel.getByRole('button', { name: 'Inspect Synthetic 000', exact: true }).click();
  await panel.getByRole('button', { name: 'Connection list', exact: true }).click();
  const mark = map.locator('[data-node-path="Synthetic/Node 000.md"] .graph-node-mark');
  const box = await mark.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
  await page.mouse.move(box.x + 95, box.y + 60, { steps: 16 }); await page.mouse.up();
  await page.waitForTimeout(800); // Record the release and visible spring rebound.
  await panel.getByRole('button', { name: 'Pause motion' }).click();
  await panel.getByRole('button', { name: 'Fit', exact: true }).click();
  await page.screenshot({ path: info.outputPath('graph-dark-high.png'), fullPage: true });
  const camera = await map.locator('.graph-world').getAttribute('transform');
  const selected = await map.getAttribute('data-selected');
  await page.getByLabel('Import Alacritty theme').setInputFiles({ name: 'synthetic-light.toml', mimeType: 'application/toml',
    buffer: Buffer.from("colors.primary={background='#ffffff',foreground='#202020'}\ncolors.normal={blue='#173f7a',cyan='#005a62',yellow='#754400'}") });
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  expect(await map.getAttribute('data-selected')).toBe(selected);
  expect(await map.locator('.graph-world').getAttribute('transform')).toBe(camera);
  await page.screenshot({ path: info.outputPath('graph-light-high.png'), fullPage: true });
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await expect(map.locator('.graph-bloom')).toHaveCSS('display', 'none');
  await page.screenshot({ path: info.outputPath('graph-forced-colors.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await panel.locator('[data-graph-filter-options]').evaluate(el => { el.open = false; });
  await panel.locator('[data-graph-map-options]').evaluate(el => { el.open = false; });
  await panel.getByRole('button', { name: 'Connection list', exact: true }).click();
  await expect(panel.locator('[data-graph-nodes] > li')).toHaveCount(200);
  await expect(panel.locator('[data-graph-edges] > li')).toHaveCount(500);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('graph-mobile-list.png'), fullPage: true });
  expect(network).toEqual([]);
  expect(await page.locator('[data-graph-dialog] img').count()).toBe(0);
  const metrics = info.outputPath('graph-renderer-measurements.json');
  await writeFile(metrics, JSON.stringify({ fixture: 'synthetic renderer only', nodes: 200, edges: 500, firstUsableMs, measurements }, null, 2));
  await info.attach('graph-renderer-measurements.json', { path: metrics, contentType: 'application/json' });
});
