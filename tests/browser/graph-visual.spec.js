import { test, expect } from '@playwright/test';
import { revealChrome } from './support/chrome.js';

test.use({ video: { mode: 'on', size: { width: 1180, height: 900 } } });
const fixture = () => {
  const revision = '"' + 'a'.repeat(64) + '"';
  const nodes = Array.from({ length: 240 }, (_, i) => ({ path: i === 0 ? 'Slice.md' : `Synthetic/Node ${String(i).padStart(3, '0')}.md`,
    title: i === 5 ? '<img src=https://example.invalid/tracker> Synthetic' : `Synthetic ${String(i).padStart(3, '0')}`,
    revision, href: i === 0 ? '/notes/Slice.md' : `/notes/Synthetic/Node%20${String(i).padStart(3, '0')}.md` }));
  const edges = [];
  const add = (a, b) => edges.push({ source: nodes[a].path, destination: nodes[b].path, occurrence_count: 2,
    source_revision: revision, occurrence_id: edges.length + 1, position: [2, 1], position_precision: 'advisory' });
  for (let i = 1; i < 239; i++) add(0, i);
  for (let i = 1; i < 200; i++) { add(i, i + 1); if (i < 100) add(i, i + 2); }
  const meta = { schema_version:1, scope:'synthetic-policy', snapshot_id:'synthetic-snapshot', state: 'ok', authoritative: false, untrusted_content: true, projection_complete: true,
    generation: 1, mutation: 1, relation_epoch: 1, observed_at: '2026-11-07T00:00:00Z',
    freshness: { state: 'ready', scope: 'synthetic_renderer_fixture' }, limiting_reasons: [], boundary_connections: false };
  return { nodes, edges, meta };
};
async function login(page) {
  await page.goto('/accounts/login/'); await page.getByLabel('Username', { exact: true }).fill('slice');
  await page.getByLabel('Password', { exact: true }).fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}
async function stub(page) {
  const data = fixture();
  await page.route(/\/tools\/graph\/snapshot\//, route => route.fulfill({json:{...data.meta,nodes:data.nodes,edges:data.edges,next_cursor:null}}));
  return data;
}

test('bulk 3D graph retains selection, selection and camera, with theme, phone and context recovery evidence', async ({ page }, info) => {
  test.setTimeout(60000); await login(page); const data = await stub(page);
  const external = []; page.on('request', r => { if (new URL(r.url()).origin !== new URL(page.url()).origin) external.push(r.url()); });
  await page.goto('/notes/Slice.md'); await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');
  await page.evaluate(() => document.dispatchEvent(new Event('backstory:open-graph')));
  const panel = page.locator('[data-graph-dialog]'), map = panel.locator('[data-graph-map]');
  await expect(panel.locator('[data-graph-summary]')).toContainText('239 notes');
  await expect(map).toHaveAttribute('data-renderer', 'webgl');
  await expect(map.locator('canvas')).toHaveCount(2);
  await panel.locator('[data-graph-map-options]').evaluate(el => { el.open = true; });
  await panel.getByRole('button', { name: 'Pause motion' }).click();
  await panel.getByRole('button', { name: 'Connection list', exact: true }).click();
  await panel.getByRole('button', { name: 'Inspect Synthetic 000', exact: true }).click();
  await panel.getByRole('button', { name: 'Connection list', exact: true }).click();
  const camera = await map.getAttribute('data-camera-yaw'), selection = await map.getAttribute('data-selected');
  await panel.locator('[data-graph-control-options]').evaluate(el=>el.open=true);
  await panel.getByRole('button',{name:'All notes',exact:true}).click();
  await expect(panel.locator('[data-graph-summary]')).toContainText('240 notes');
  await expect(panel.locator('[data-graph-summary]')).toContainText('Complete');
  await expect(map).toHaveAttribute('data-node-count', '240');
  await expect(map).toHaveAttribute('data-edge-count', String(data.edges.length));
  expect(await map.getAttribute('data-selected')).toBe(selection);
  expect(await map.getAttribute('data-camera-yaw')).toBe(camera);
  await panel.getByRole('button', { name: 'Orbit right', exact: true }).click();
  await expect(map).not.toHaveAttribute('data-camera-yaw', camera);
  await panel.getByRole('button', { name: 'Reset orientation', exact: true }).click();
  for (const intensity of ['0', '2', '4']) {
    await panel.getByRole('slider', { name: 'Bloom intensity' }).fill(intensity);
    await expect(map).toHaveAttribute('data-bloom', intensity);
  }
  await panel.locator('[data-graph-filter-options]').evaluate(el => { el.open = false; });
  await panel.locator('[data-graph-map-options]').evaluate(el => { el.open = false; });
  await page.screenshot({ path: info.outputPath('graph-desktop-dark.png'), fullPage: true });
  const stableCamera = await map.getAttribute('data-camera-yaw');
  // Exercise installed theme controls using the same palette importer in normal use.
  await page.evaluate(() => {
    const el = document.querySelector('[data-theme-controls] input[type=file]');
    const transfer = new DataTransfer(); transfer.items.add(new File(["colors.primary={background='#ffffff',foreground='#202020'}\ncolors.normal={blue='#173f7a',cyan='#005a62',yellow='#754400'}"], 'synthetic-light.toml', { type: 'application/toml' }));
    el.files = transfer.files; el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  expect(await map.getAttribute('data-camera-yaw')).toBe(stableCamera); expect(await map.getAttribute('data-selected')).toBe(selection);
  await page.screenshot({ path: info.outputPath('graph-desktop-light.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(map).toBeVisible();
  await expect(panel.getByRole('button', { name: 'Close graph', exact: true })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('graph-phone-light.png'), fullPage: true });
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await expect(panel.locator('[data-graph-pause]')).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({ path: info.outputPath('graph-phone-forced-colors.png'), fullPage: true });
  // A real context loss must retain the accumulated list and its controls.
  await map.locator('canvas').first().evaluate(canvas => {
    window.graphContextExtension = canvas.getContext('webgl2').getExtension('WEBGL_lose_context');
    window.graphContextExtension.loseContext();
  });
  await expect(panel.locator('[data-graph-list]')).toBeVisible();
  await expect(panel.locator('[data-graph-nodes] > li')).toHaveCount(240);
  await page.evaluate(() => window.graphContextExtension.restoreContext());
  await expect(panel.locator('[data-graph-status]')).toContainText(/Map ready|restored/i);
  await panel.getByRole('button', { name: 'Connection list', exact: true }).click();
  await expect(map).toBeVisible();
  expect(await page.locator('[data-graph-dialog] img').count()).toBe(0); expect(external).toEqual([]);
});

test('obsolete filter and closed-graph responses cannot repopulate retained private results', async ({ page }) => {
  await login(page); const data = fixture(); let finish;
  await page.route(/\/tools\/graph\//, async route => {
    const params = new URL(route.request().url()).searchParams;
    if (params.get('query') === 'slow') await new Promise(resolve => { finish = resolve; });
    await route.fulfill({ json: { ...data.meta, nodes: params.get('query') === 'slow' ? [data.nodes[0]] : [], edges: [], next_cursor: null } }).catch(() => {});
  });
  await page.goto('/notes/Slice.md'); await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');
  await page.evaluate(() => document.dispatchEvent(new Event('backstory:open-graph')));
  const panel = page.locator('[data-graph-dialog]');
  await panel.getByRole('searchbox', { name: 'Graph search' }).fill('slow');
  await expect.poll(() => Boolean(finish)).toBe(true);
  await panel.getByRole('searchbox', { name: 'Graph search' }).fill('new');
  await expect(panel.locator('[data-graph-summary]')).toContainText('0 notes');
  finish(); await expect(panel.locator('[data-graph-summary]')).toContainText('0 notes');
  await panel.getByRole('button', { name: 'Close graph', exact: true }).click(); await expect(panel).not.toBeVisible();
});

for(const fault of ['session','unavailable','policy'])test(`retained graph clears removed evidence on ${fault} refresh`,async({page})=>{
 await login(page);const data=fixture();let refreshed=false;
 await page.route(/\/tools\/graph\/snapshot\//,route=>{
  if(refreshed && fault==='session')return route.fulfill({status:401,json:{untrusted_content:true,reason_code:'authentication_required'}});
  if(refreshed && fault==='unavailable')return route.fulfill({status:503,json:{untrusted_content:true,state:'unavailable',reason_code:'storage_unavailable'}});
  return route.fulfill({json:{...data.meta,scope:refreshed?'new-policy':data.meta.scope,nodes:refreshed?[]:data.nodes.slice(0,2),edges:[],next_cursor:null}});
 });
 await page.goto('/notes/Slice.md');await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');
 await page.evaluate(()=>document.dispatchEvent(new Event('backstory:open-graph')));
 const panel=page.locator('[data-graph-dialog]');
 // Whole-wiki visibility includes the isolate without changing backend scope.
 await panel.locator('[data-graph-control-options]').evaluate(el=>el.open=true);
 await expect(panel.locator('[data-graph-summary]')).toContainText('1 notes');
 await panel.getByRole('button',{name:'All notes',exact:true}).click();
 await expect(panel.locator('[data-graph-summary]')).toContainText('2 notes');
 if(!await panel.locator('[data-graph-list]').isVisible())await panel.getByRole('button',{name:'Connection list',exact:true}).click();
 await panel.getByRole('button',{name:'Inspect Synthetic 000',exact:true}).click();
 refreshed=true;await panel.getByRole('button',{name:'Refresh',exact:true}).click();
 await expect(panel.locator('[data-graph-nodes] > li strong')).toHaveCount(0);
 await expect(panel.locator('[data-graph-details]')).not.toContainText('Synthetic');
});

test('orbit changes parallax, node dragging tugs neighbors and cancellation releases pins', async ({ page }) => {
  await login(page); const data = fixture();
  await page.route(/\/tools\/graph\//, route => route.fulfill({ json: { ...data.meta, nodes: data.nodes.slice(0, 3), edges: data.edges.slice(0, 2), next_cursor: null } }));
  await page.route(/\/tools\/links\//, route => route.fulfill({ json: { ...data.meta, items: [], next_cursor: null } }));
  await page.goto('/notes/Slice.md'); await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');
  await page.evaluate(() => document.dispatchEvent(new Event('backstory:open-graph')));
  const panel = page.locator('[data-graph-dialog]'), map = panel.locator('[data-graph-map]');
  await expect(map).toHaveAttribute('data-node-count', '3');
  await panel.locator('[data-graph-filter-options]').evaluate(el => { el.open = false; });
  await panel.locator('[data-graph-map-options]').evaluate(el => { el.open = true; });
  await panel.getByRole('button', { name: 'Pause motion' }).click();
  const snapshot = () => map.evaluate(el => el.graphView.snapshot());
  const before = await snapshot();
  await map.focus(); await page.keyboard.press('ArrowRight');
  await expect(map).toHaveAttribute('data-selected', /Synthetic/);
  expect((await snapshot()).camera).toEqual(before.camera);
  const selectedBefore = await map.getAttribute('data-selected'), positionedBefore = await snapshot();
  await panel.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(map).toHaveAttribute('data-node-count', '3');
  await expect(map).toHaveAttribute('data-selected', selectedBefore);
  expect((await snapshot()).projected).toEqual(positionedBefore.projected);
  await panel.getByRole('button', { name: 'Orbit right', exact: true }).click();
  const after = await snapshot();
  expect(after.projected.map(p => [p.x, p.y, p.depth])).not.toEqual(before.projected.map(p => [p.x, p.y, p.depth]));
  expect(after.camera.distance).toBe(before.camera.distance);
  await panel.getByRole('button', { name: 'Pause motion' }).click();
  const node = (await snapshot()).projected[0], bounds = await map.boundingBox();
  await map.evaluate(el => el.addEventListener('pointerdown', event => { window.graphDragPointer = event.pointerId; }, { once: true }));
  await page.mouse.move(bounds.x + node.x, bounds.y + node.y); await page.mouse.down();
  const neighbor = (await snapshot()).projected[1];
  await page.mouse.move(bounds.x + node.x + 80, bounds.y + node.y + 40, { steps: 12 });
  await expect(map).toHaveAttribute('data-pinned', 'true');
  await expect.poll(async () => (await snapshot()).projected[1].x).not.toBe(neighbor.x);
  await map.dispatchEvent('pointercancel', { pointerId: await page.evaluate(() => window.graphDragPointer) });
  await expect(map).toHaveAttribute('data-pinned', 'false'); await page.mouse.up();
  await panel.locator('[data-graph-map-options]').evaluate(el => { el.open = false; });
  await page.setViewportSize({ width: 390, height: 844 });
  await map.scrollIntoViewIfNeeded();
  const touchBounds = await map.boundingBox(), touch = await page.context().newCDPSession(page);
  const point = { x: touchBounds.x + touchBounds.width / 2, y: touchBounds.y + touchBounds.height / 2 };
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: point.x + 25, y: point.y + 15 }] });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  await touch.detach();
  await expect(map).toHaveAttribute('data-pinned', 'false');
});

test('explicit list choice survives reopening and phone controls remain reachable at 200% text zoom', async ({ page }, info) => {
  await login(page); await stub(page); await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/notes/Slice.md'); await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');
  await page.evaluate(() => document.dispatchEvent(new Event('backstory:open-graph')));
  const panel = page.locator('[data-graph-dialog]');
  await expect(panel.locator('[data-graph-summary]')).toContainText('239 notes');
  await page.keyboard.press('Escape');
  await panel.getByRole('button', { name: 'Connection list', exact: true }).click();
  await panel.getByRole('button', { name: 'Close graph', exact: true }).click(); await expect(panel).not.toBeVisible();
  await page.evaluate(() => document.dispatchEvent(new Event('backstory:open-graph')));
  await expect(panel.locator('[data-graph-list]')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await expect(panel.getByRole('button', { name: 'Close graph', exact: true })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('phone-list-text-zoom.png'), fullPage: true });
  await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
  await panel.getByRole('button', { name: 'Connection list', exact: true }).click();
  await panel.evaluate(el => { el.scrollTop = 0; });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.screenshot({ path: info.outputPath('phone-graph-default.png'), fullPage: true });
});
