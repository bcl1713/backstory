import { test, expect } from '@playwright/test';

const meta = { state: 'ok', authoritative: false, untrusted_content: true, projection_complete: true,
  generation: 1, mutation: 1, relation_epoch: 1, eligibility_version: 'synthetic', observed_at: '2026-11-07T00:00:00Z',
  freshness: { state: 'ready' }, limiting_reasons: [], boundary_connections: false };
const node = path => ({ path, title: path, revision: 'r', href: '/notes/' + path });
const nodes = ['Slice.md', 'B.md', 'C.md', 'D.md', 'Alone.md'].map(node);
const edges = [0, 1, 2].map(i => ({ source: nodes[i].path, destination: nodes[i+1].path, occurrence_count: 3 }));
const payload = (all, links = [], next_cursor = null, extra = {}) => ({ ...meta, nodes: all, edges: links, next_cursor, ...extra });
const panel = page => page.locator('[data-graph-dialog]');
const map = page => panel(page).locator('[data-graph-map]');
async function setup(page, handler) {
  await page.route(/\/tools\/graph\//, handler || (route => {
    const query = new URL(route.request().url()).searchParams;
    const count = query.has('path') ? Math.min(4, Number(query.get('depth') || 1) + 1) : 5;
    return route.fulfill({ json: payload(nodes.slice(0, count), edges.slice(0, count - 1)) });
  }));
  await page.route(/\/tools\/links\//, route => route.fulfill({ json: { ...meta, items: [], next_cursor: null } }));
  await page.goto('/accounts/login/'); await page.getByLabel('Username', { exact: true }).fill('slice');
  await page.getByLabel('Password', { exact: true }).fill('synthetic-slice-browser-only'); await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.evaluate(() => localStorage.setItem('backstory.vim.v1', 'on'));
  await page.goto('/notes/Slice.md'); await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');
}
async function navigation(page) { return await map(page).isVisible() ? map(page) : panel(page).getByRole('button', { name: 'Connection list', exact: true }); }
async function open(page) {
  await page.locator('.cm-content').focus(); await page.keyboard.type('g/');
  await expect(panel(page).getByRole('searchbox', { name: 'Graph search' })).toBeFocused();
  await expect(panel(page).locator('[data-graph-summary]')).toContainText('3 notes');
  // Mobile entry gives the map priority; these scenarios exercise its controls.
  await panel(page).locator('[data-graph-control-options]').evaluate(el => { el.open = true; });
}

test('current-note two-hop entry, bracket depth, stable scope/camera and typing guards', async ({ page }) => {
  await setup(page); await open(page);
  await expect(panel(page).locator('[data-graph-depth-value]')).toContainText('2 hops');
  await page.keyboard.type('[]'); await expect(panel(page).getByRole('searchbox')).toHaveValue('[]');
  await panel(page).getByRole('searchbox').fill(''); await page.keyboard.press('Escape');
  await expect(await navigation(page)).toBeFocused();
  await expect(map(page)).toHaveAttribute('data-node-count', '3');
  await map(page).evaluate(el => { el.graphView.setPaused(true); el.graphView.orbit(.3, .1); el.graphView.actions.onSelect('B.md', true); });
  const before = await map(page).evaluate(el => el.graphView.snapshot());
  await page.keyboard.press(']'); await expect(map(page)).toHaveAttribute('data-node-count', '4');
  await expect(panel(page).locator('[name=path]')).toHaveValue('Slice.md');
  await expect(map(page)).toHaveAttribute('data-selected', 'B.md');
  expect((await map(page).evaluate(el => el.graphView.snapshot())).camera).toEqual(before.camera);
  await page.keyboard.press('['); await expect(map(page)).toHaveAttribute('data-node-count', '3');
  await page.keyboard.press('['); await expect(map(page)).toHaveAttribute('data-node-count', '2');
  await expect(panel(page).getByRole('button', { name: 'Decrease hop depth' })).toBeDisabled();
  await page.keyboard.press('Escape'); await expect(panel(page)).not.toBeVisible();
  await open(page); await panel(page).getByRole('button', { name: 'All notes', exact: true }).click();
  await expect(panel(page).locator('[data-graph-depth-controls]')).toBeHidden();
  await panel(page).getByRole('button', { name: 'Close graph', exact: true }).click();
  await open(page); await expect(panel(page).locator('[name=path]')).toHaveValue('Slice.md');
  await expect(panel(page).locator('[name=depth]')).toHaveValue('2');
});

for (const width of [1180, 390]) test(`live low/default/high force controls persist and respect pause at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 900 }); await setup(page); await open(page); await page.keyboard.press('Escape');
  expect(['webgl', 'unavailable']).toContain(await map(page).getAttribute('data-renderer'));
  await panel(page).locator('[data-graph-settings]').evaluate(el => { el.open = true; });
  await panel(page).locator('[data-graph-forces]').evaluate(el => { el.open = true; });
  const positions = () => map(page).evaluate(el => [...el.graphView.simulation.nodes].map(([path,n]) => [path,n.x,n.y,n.z]));
  await panel(page).getByRole('button', { name: 'Pause motion', exact: true }).click();
  const before = await positions(), camera = await map(page).evaluate(el => el.graphView.snapshot().camera);
  for (const value of ['0.25', '1', '4']) {
    for (const name of ['Spring strength', 'Repulsion', 'Gravity']) await panel(page).getByRole('slider', { name, exact: true }).fill(value);
    expect(await positions()).toEqual(before);
    await expect(panel(page).getByRole('button', { name: 'Pause motion', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(await map(page).evaluate(el => el.graphView.simulation.forces)).toEqual({ spring: Number(value), repulsion: Number(value), gravity: Number(value) });
  }
  expect(await map(page).evaluate(el => el.graphView.snapshot().camera)).toEqual(camera);
  await panel(page).getByRole('button', { name: 'Pause motion', exact: true }).click();
  const measurements = {};
  for (const name of ['Spring strength', 'Repulsion', 'Gravity']) {
    measurements[name] = [];
    for (const value of ['0.25', '1', '4']) {
      await panel(page).getByRole('button', { name: 'Reset defaults', exact: true }).click();
      await panel(page).getByRole('slider', { name, exact: true }).fill(value);
      const settled = await map(page).evaluate(el => {
        const sim = el.graphView.simulation; sim.settle(720); el.graphView.draw();
        const a = sim.nodes.get('Slice.md'), b = sim.nodes.get('B.md');
        return { active: sim.active, finite: sim.all.every(n => [n.x,n.y,n.z].every(Number.isFinite)),
          distance: Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z), radius: sim.all.reduce((sum,n) => sum + Math.hypot(n.x,n.y,n.z),0) };
      });
      expect(settled.active).toBe(false); expect(settled.finite).toBe(true); measurements[name].push(settled);
      if (name === 'Repulsion') await page.screenshot({ path: info.outputPath(`graph-forces-${width}-${value}.png`), fullPage: true });
    }
  }
  expect(measurements['Spring strength'][0].distance).toBeGreaterThan(measurements['Spring strength'][2].distance);
  expect(measurements.Repulsion[0].distance).toBeLessThan(measurements.Repulsion[2].distance);
  expect(measurements.Gravity[0].radius).toBeGreaterThan(measurements.Gravity[2].radius);
  await info.attach('force-range-measurements', { body: JSON.stringify(measurements), contentType: 'application/json' });
  for (const name of ['Spring strength', 'Repulsion', 'Gravity']) await panel(page).getByRole('slider', { name, exact: true }).fill('4');
  await panel(page).getByRole('button', { name: 'Close graph', exact: true }).click(); await open(page);
  expect(await map(page).evaluate(el => el.graphView.simulation.forces.spring)).toBe(4);
  await page.reload(); await open(page); expect(await map(page).evaluate(el => el.graphView.simulation.forces.gravity)).toBe(4);
  await panel(page).locator('[data-graph-settings]').evaluate(el => { el.open = true; }); await panel(page).locator('[data-graph-forces]').evaluate(el => { el.open = true; });
  await panel(page).getByRole('button', { name: 'Reset defaults', exact: true }).click();
  expect(await map(page).evaluate(el => el.graphView.simulation.forces)).toEqual({ spring: 1, repulsion: 1, gravity: 1 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await panel(page).getByRole('slider', { name: 'Repulsion', exact: true }).fill('2');
  await expect(panel(page).getByRole('button', { name: 'Pause motion', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(panel(page).getByRole('button', { name: 'Pause motion', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('whole wiki automatically accumulates empty continuing pages and canonical repeated edges', async ({ page }) => {
  const requests = [];
  const pages = { '': payload(nodes.slice(0,2), [edges[0]], 'two'), two: payload([], [], 'three'), three: payload(nodes.slice(1), edges, null) };
  await setup(page, route => {
    const q = new URL(route.request().url()).searchParams;
    if (q.has('path')) return route.fulfill({ json: payload(nodes.slice(0,3), edges.slice(0,2)) });
    const cursor = q.get('cursor') || ''; requests.push(cursor); return route.fulfill({ json: pages[cursor] });
  });
  await open(page); await panel(page).getByRole('button', { name: 'All notes', exact: true }).click();
  await expect(panel(page).locator('[data-graph-summary]')).toContainText('5 notes · 3 directed links · Complete');
  expect(requests).toEqual(['', 'two', 'three']);
  await expect(panel(page).getByRole('button', { name: 'Load more', exact: true })).toBeHidden();
  await panel(page).getByRole('button', { name: 'Connection list', exact: true }).click();
  await expect(panel(page).locator('[data-graph-edges]')).toContainText('3 occurrences');
});

test('loading pause/resume, retry and expired cursors never mislabel partial results', async ({ page }) => {
  let held, calls = 0, failure = false;
  await setup(page, async route => {
    const q = new URL(route.request().url()).searchParams;
    if (q.has('path')) return route.fulfill({ json: payload(nodes.slice(0,3), edges.slice(0,2)) });
    if (!q.has('cursor')) return route.fulfill({ json: payload(nodes.slice(0,2), [edges[0]], 'two') });
    calls++;
    if (calls === 1) await new Promise(resolve => { held = resolve; });
    if (failure) return route.fulfill({ status: 409, json: { untrusted_content: true, restart: true } }).catch(() => {});
    return route.fulfill({ json: payload(nodes.slice(2), [], null) }).catch(() => {});
  });
  await open(page); await panel(page).getByRole('button', { name: 'All notes', exact: true }).click();
  await expect.poll(() => Boolean(held)).toBe(true);
  await map(page).evaluate(el => { el.graphView.setPaused(true); el.graphView.orbit(.2, .1); el.graphView.actions.onSelect('Slice.md', true); });
  const retained = await map(page).evaluate(el => el.graphView.snapshot().camera);
  await panel(page).getByRole('button', { name: 'Pause loading', exact: true }).click(); held();
  await expect(panel(page).locator('[data-graph-summary]')).toContainText('Loading paused');
  await expect(map(page)).toHaveAttribute('data-node-count', '2');
  await panel(page).getByRole('button', { name: 'Resume loading', exact: true }).click();
  await expect(panel(page).locator('[data-graph-summary]')).toContainText('Complete');
  expect(await map(page).evaluate(el => el.graphView.snapshot().camera)).toEqual(retained);
  await expect(map(page)).toHaveAttribute('data-selected', 'Slice.md');
  failure = true; await panel(page).getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(panel(page).getByRole('button', { name: 'Restart loading', exact: true })).toBeVisible();
  await expect(panel(page).locator('[data-graph-summary]')).not.toContainText('Complete');
  failure = false; await panel(page).getByRole('button', { name: 'Restart loading', exact: true }).click();
  await expect(panel(page).locator('[data-graph-summary]')).toContainText('5 notes');
});

test('rapid scopes, close/reopen, repeated cursors and mixed generations discard obsolete data', async ({ page }) => {
  let release, mode = 'slow';
  await setup(page, async route => {
    const q = new URL(route.request().url()).searchParams;
    if (q.has('path')) return route.fulfill({ json: payload(nodes.slice(0, Math.min(4, Number(q.get('depth')) + 1)), []) });
    if (!q.has('cursor')) return route.fulfill({ json: payload([nodes[4]], [], 'two') });
    if (mode === 'slow') await new Promise(resolve => { release = resolve; });
    return route.fulfill({ json: payload([nodes[4]], [], mode === 'repeat' ? 'two' : null, mode === 'mixed' ? { relation_epoch: 2 } : {}) }).catch(() => {});
  });
  await open(page); await panel(page).getByRole('button', { name: 'All notes', exact: true }).click(); await expect.poll(() => Boolean(release)).toBe(true);
  await panel(page).getByRole('button', { name: 'Local', exact: true }).click(); release();
  await expect(map(page)).toHaveAttribute('data-node-count', '3');
  await (await navigation(page)).focus(); await page.keyboard.press(']'); await page.keyboard.press('[');
  await expect(map(page)).toHaveAttribute('data-node-count', '3');
  release = null; await panel(page).getByRole('button', { name: 'All notes', exact: true }).click();
  await expect.poll(() => Boolean(release)).toBe(true);
  await panel(page).getByRole('button', { name: 'Close graph', exact: true }).click(); await open(page); release();
  await expect(map(page)).toHaveAttribute('data-node-count', '3');
  mode = 'repeat'; await panel(page).getByRole('button', { name: 'All notes', exact: true }).click();
  await expect(panel(page).getByRole('button', { name: 'Restart loading', exact: true })).toBeVisible();
  await expect(panel(page).locator('[data-graph-summary]')).not.toContainText('Complete');
  mode = 'mixed'; await panel(page).getByRole('button', { name: 'Restart loading', exact: true }).click();
  await expect(panel(page).locator('[data-graph-status]')).toContainText('changed');
  await expect(panel(page).locator('[data-graph-nodes] > li strong')).toHaveCount(0);
  await panel(page).getByRole('button', { name: 'Close graph', exact: true }).click(); await open(page);
});


test('superseded depth requests retain surviving coordinates and camera until revalidation', async ({ page }) => {
  let release;
  await setup(page, async route => {
    const q = new URL(route.request().url()).searchParams, depth = Number(q.get('depth'));
    if (depth === 3) await new Promise(resolve => { release = resolve; });
    return route.fulfill({ json: payload(nodes.slice(0, Math.min(4, depth + 1)), []) }).catch(() => {});
  });
  await open(page); await page.keyboard.press('Escape');
  await map(page).evaluate(el => { el.graphView.setPaused(true); el.graphView.pan(20, 30); });
  const before = await map(page).evaluate(el => ({ camera: el.graphView.snapshot().camera, positions: el.graphView.simulation.all.map(n => [n.path,n.x,n.y,n.z]) }));
  await page.keyboard.press(']'); await expect.poll(() => Boolean(release)).toBe(true); await page.keyboard.press(']');
  await expect(map(page)).toHaveAttribute('data-node-count', '4'); release();
  const after = await map(page).evaluate(el => ({ camera: el.graphView.snapshot().camera, positions: el.graphView.simulation.all.slice(0,3).map(n => [n.path,n.x,n.y,n.z]) }));
  expect(after).toEqual(before);
  await expect(panel(page).locator('[data-graph-depth-value]')).toContainText('4 hops');
});
