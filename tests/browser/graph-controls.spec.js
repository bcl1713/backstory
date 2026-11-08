import { showGraphLayer, closeGraphLayer, graphControl, applyGraphFilter } from './support/graph.js';
import { test, expect } from '@playwright/test';

const meta = { schema_version: 1, scope: 'synthetic-session-policy', snapshot_id: 'snapshot', state: 'ok', authoritative: false, untrusted_content: true, projection_complete: true,
  generation: 1, mutation: 1, relation_epoch: 1, eligibility_version: 'synthetic', observed_at: '2026-11-07T00:00:00Z',
  freshness: { state: 'ready' }, limiting_reasons: [], boundary_connections: false };
const node = path => ({ path, title: path, revision: 'r', href: '/notes/' + path });
const nodes = ['Slice.md', 'B.md', 'C.md', 'D.md', 'Alone.md'].map(node);
const edges = [0, 1, 2].map(i => ({ source: nodes[i].path, destination: nodes[i+1].path, occurrence_count: 3 }));
const payload = (all, links = [], next_cursor = null, extra = {}) => ({ ...meta, nodes: all, edges: links, next_cursor, ...extra });
const panel = page => page.locator('[data-graph-dialog]');
const map = page => panel(page).locator('[data-graph-map]');
async function visibility(page, hidden) {
  await page.evaluate(value => {
    Object.defineProperty(document, 'hidden', { configurable: true, value });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
}

test('returning to the graph restores selected springs and layout after private evidence is revalidated', async ({ page }, info) => {
  let response = payload(nodes, edges), held = false, release;
  await setup(page, async route => {
    if (held) await new Promise(resolve => { release = resolve; });
    await route.fulfill({ json: response });
  });
  await open(page);
  response = payload(nodes, edges);
  await graphControl(panel(page), 'All notes');
  await expect(map(page)).toHaveAttribute('data-node-count', '5');
  await map(page).evaluate(el => {
    const v = el.graphView; v.setPaused(true); v.actions.onSelect('B.md', true); v.orbit(.3, .1);
    v.simulation.nodes.get('B.md').x = 1234; v.draw();
  });
  const state = () => map(page).evaluate(el => {
    const v = el.graphView;
    return { selected: v.selected, focused: v.focused, paused: v.paused, camera: v.snapshot().camera,
      positions: v.simulation.all.map(n => [n.path, n.x, n.y, n.z]),
      springs: v.simulation.springs.map(([a,b]) => [a.path,b.path]) };
  });
  const before = await state();
  expect(before.springs).toEqual([['B.md','C.md'], ['C.md','D.md']]);
  held = true;
  await visibility(page, true);
  await expect(map(page)).toHaveAttribute('data-node-count', '0');
  await expect(panel(page).locator('[data-graph-edges]')).toBeEmpty();
  await visibility(page, false);
  await expect.poll(() => Boolean(release)).toBe(true);
  await expect(map(page)).toHaveAttribute('data-node-count', '0');
  held = false; release();
  await expect(map(page)).toHaveAttribute('data-node-count', '5');
  expect(await state()).toEqual(before);
  if (await map(page).isVisible()) {
    await map(page).evaluate(el => el.graphView.fit());
    await map(page).scrollIntoViewIfNeeded();
  }
  await page.screenshot({ path: info.outputPath('graph-focus-restored.png'), fullPage: true });
  // Removed roots cannot retain springs or selected-note evidence.
  await visibility(page, true);
  response = payload(nodes.filter(n => n.path !== 'B.md'), []);
  await visibility(page, false);
  await expect(map(page)).toHaveAttribute('data-node-count', '4');
  expect((await state()).selected).toBe(null);
  expect((await state()).springs).toEqual([]);
});

for (const outcome of ['namespace change', 'authentication failure']) test(`graph resume discards retained presentation on ${outcome}`, async ({ page }) => {
  let resumed = false;
  await setup(page, route => route.fulfill(resumed && outcome === 'authentication failure' ?
    { status: 401, json: { untrusted_content: true, reason_code: 'authentication_required' } } :
    { json: payload(nodes.slice(0,3), edges.slice(0,2), null, resumed ? { eligibility_version: 'changed', scope: 'changed-policy' } : {}) }));
  await page.route(/\/tools\/links\//, route => route.fulfill({ json: { ...meta,
    eligibility_version: resumed ? 'changed' : meta.eligibility_version, items: [], next_cursor: null } }));
  await open(page);
  await map(page).evaluate(el => {
    const v = el.graphView; v.setPaused(true); v.actions.onSelect('B.md', true);
    v.simulation.nodes.get('B.md').x = 1234;
  });
  // A real navigation can deliver both lifecycle events; neither may erase the
  // retained namespace and thereby allow stale coordinates into the new one.
  await visibility(page, true);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
  resumed = true;
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
  });
  if (outcome === 'authentication failure') {
    await expect(panel(page).locator('[data-graph-status]')).toContainText('Session expired');
    await expect(map(page)).toHaveAttribute('data-node-count', '0');
    await expect(panel(page).locator('[data-graph-nodes] > li strong')).toHaveCount(0);
  } else {
    await expect(map(page)).toHaveAttribute('data-node-count', '3');
    expect(await map(page).evaluate(el => el.graphView.simulation.nodes.get('B.md').x)).not.toBe(1234);
    await expect(map(page)).toHaveAttribute('data-selected', 'Slice.md');
  }
});
async function setup(page, handler) {
  await page.route(/\/tools\/graph\/snapshot\//, handler || (route => route.fulfill({ json: payload(nodes, edges) })));
  await page.route(/\/tools\/links\//, route => route.fulfill({ json: { ...meta, items: [], next_cursor: null } }));
  await page.goto('/accounts/login/'); await page.getByLabel('Username', { exact: true }).fill('slice');
  await page.getByLabel('Password', { exact: true }).fill('synthetic-slice-browser-only'); await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.evaluate(() => localStorage.setItem('backstory.vim.v1', 'on'));
  await page.goto('/notes/Slice.md'); await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');
}
async function navigation(page) { return await map(page).isVisible() ? map(page) : panel(page).getByRole('button', { name: 'Connection list', exact: true }); }
async function open(page, search = false) {
  await page.locator('.cm-content').focus(); await page.keyboard.type('g/');
  await expect(panel(page).getByRole('searchbox', { name: 'Find a note' })).toBeFocused();
  await expect(panel(page).locator('[data-graph-summary]')).toContainText('3 notes');
  // Mobile entry gives the map priority; these scenarios exercise its controls.
  if (!search) await showGraphLayer(panel(page), 'controls');
}

test('current-note two-hop entry, bracket depth, stable scope/camera and typing guards', async ({ page }) => {
  await setup(page); await open(page, true);
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
  await page.keyboard.press('['); await expect(map(page)).toHaveAttribute('data-node-count', '4');
  await page.keyboard.press('['); await expect(map(page)).toHaveAttribute('data-node-count', '3');
  await showGraphLayer(panel(page),'controls');
  await expect(panel(page).getByRole('button', { name: 'Decrease hop depth' })).toBeDisabled();
  await closeGraphLayer(panel(page));
  await page.keyboard.press('Escape'); await expect(panel(page)).not.toBeVisible();
  await open(page); await graphControl(panel(page), 'All notes');
  await expect(panel(page).locator('[data-graph-depth-controls]')).toBeHidden();
  await panel(page).getByRole('button', { name: 'Close graph', exact: true }).click();
  await open(page); await expect(panel(page).locator('[name=path]')).toHaveValue('Slice.md');
  await expect(panel(page).locator('[name=depth]')).toHaveValue('2');
});

for (const width of [1180, 390]) test(`live low/default/high force controls persist and respect pause at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 900 }); await setup(page); await open(page); await page.keyboard.press('Escape');
  expect(['webgl', 'unavailable']).toContain(await map(page).getAttribute('data-renderer'));
  await showGraphLayer(panel(page), 'controls'); await panel(page).locator('[data-graph-settings]').evaluate(el => { el.open = true; });
  await panel(page).locator('[data-graph-forces]').evaluate(el => { el.open = true; });
  const positions = () => map(page).evaluate(el => [...el.graphView.simulation.nodes].map(([path,n]) => [path,n.x,n.y,n.z]));
  await graphControl(panel(page), 'Pause motion');
  const before = await positions(), camera = await map(page).evaluate(el => el.graphView.snapshot().camera);
  for (const value of ['0.25', '1', '4']) {
    for (const name of ['Spring strength', 'Repulsion', 'Gravity']) await panel(page).getByRole('slider', { name, exact: true }).fill(value);
    expect(await positions()).toEqual(before);
    await expect(panel(page).getByRole('button', { name: 'Pause motion', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(await map(page).evaluate(el => el.graphView.simulation.forces)).toEqual({ spring: Number(value), repulsion: Number(value), gravity: Number(value) });
  }
  expect(await map(page).evaluate(el => el.graphView.snapshot().camera)).toEqual(camera);
  await graphControl(panel(page), 'Pause motion');
  const measurements = {};
  for (const name of ['Spring strength', 'Repulsion', 'Gravity']) {
    measurements[name] = [];
    for (const value of ['0.25', '1', '4']) {
      await graphControl(panel(page), 'Reset defaults');
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
  await showGraphLayer(panel(page), 'controls'); await panel(page).locator('[data-graph-settings]').evaluate(el => { el.open = true; }); await panel(page).locator('[data-graph-forces]').evaluate(el => { el.open = true; });
  await graphControl(panel(page), 'Reset defaults');
  expect(await map(page).evaluate(el => el.graphView.simulation.forces)).toEqual({ spring: 1, repulsion: 1, gravity: 1 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await panel(page).getByRole('slider', { name: 'Repulsion', exact: true }).fill('2');
  await expect(panel(page).getByRole('button', { name: 'Pause motion', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(panel(page).getByRole('button', { name: 'Pause motion', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('whole wiki and cumulative selection use one canonical bulk snapshot', async ({ page }) => {
  const requests = [];
  await setup(page, route => { requests.push(new URL(route.request().url()).search); return route.fulfill({json:payload(nodes,edges)}); });
  await open(page);
  await map(page).evaluate(el => el.graphView.actions.onSelect('C.md', true));
  await expect(panel(page).locator('[data-graph-summary]')).toContainText('4 notes · 3 directed links · Complete');
  await graphControl(panel(page), 'All notes');
  await expect(panel(page).locator('[data-graph-summary]')).toContainText('5 notes · 3 directed links · Complete');
  await map(page).evaluate(el => el.graphView.actions.onSelect('C.md', true));
  expect(requests).toHaveLength(1);
  if (!await panel(page).locator('[data-graph-list]').isVisible()) await panel(page).getByRole('button', {name:'Connection list',exact:true}).click();
  await expect(panel(page).locator('[data-graph-edges]')).toContainText('3 occurrences');
});

test('pausing an in-flight snapshot clears private evidence and resume retains motion controls', async ({page}) => {
  let hold=false, release;
  await setup(page,async route=>{
    if(hold) await new Promise(resolve=>release=resolve);
    await route.fulfill({json:payload(nodes,edges)}).catch(()=>{});
  });
  await open(page);await map(page).evaluate(el=>{el.graphView.setPaused(true);el.graphView.orbit(.2,.1);});
  const camera=await map(page).evaluate(el=>el.graphView.snapshot().camera);
  hold=true;await graphControl(panel(page), 'Refresh');await expect.poll(()=>Boolean(release)).toBe(true);
  await graphControl(panel(page), 'Pause loading');hold=false;release();
  await expect(map(page)).toHaveAttribute('data-node-count','0');
  await expect(panel(page).locator('[data-graph-details]')).not.toContainText('Slice.md');
  await graphControl(panel(page), 'Resume loading');
  await expect(panel(page).locator('[data-graph-summary]')).toContainText('Complete');
  expect(await map(page).evaluate(el=>el.graphView.snapshot().camera)).toEqual(camera);
  expect(await map(page).evaluate(el=>el.graphView.paused)).toBe(true);
});

test('rapid filter scopes and close/reopen reject obsolete snapshot responses',async({page})=>{
 let release,hold=false;
 await setup(page,async route=>{
  const q=new URL(route.request().url()).searchParams;
  if(hold && q.get('query')==='old')await new Promise(resolve=>release=resolve);
  await route.fulfill({json:payload(q.get('query')==='old'?[node('Obsolete.md')]:nodes,q.get('query')==='old'?[]:edges)}).catch(()=>{});
 });
 await open(page);hold=true;
 await applyGraphFilter(panel(page), 'old');await expect.poll(()=>Boolean(release)).toBe(true);
 await applyGraphFilter(panel(page), 'new');
 await expect(map(page)).toHaveAttribute('data-node-count','3');release();
 await expect(panel(page).locator('[data-graph-nodes]')).not.toContainText('Obsolete.md');
 release=null;await applyGraphFilter(panel(page), 'old');await expect.poll(()=>Boolean(release)).toBe(true);
 await panel(page).getByRole('button',{name:'Close graph',exact:true}).click();await open(page);release();
 await expect(map(page)).toHaveAttribute('data-node-count','3');
});

test('local depth changes retain surviving coordinates without transport requests',async({page})=>{
 let calls=0;
 await setup(page,route=>{calls++;return route.fulfill({json:payload(nodes,edges)});});
 await open(page);await page.keyboard.press('Escape');await (await navigation(page)).focus();
 await map(page).evaluate(el=>{el.graphView.setPaused(true);el.graphView.pan(20,30);});
 const before=await map(page).evaluate(el=>({camera:el.graphView.snapshot().camera,positions:el.graphView.simulation.all.map(n=>[n.path,n.x,n.y,n.z])}));
 await page.keyboard.press(']');await page.keyboard.press(']');
 await expect(map(page)).toHaveAttribute('data-node-count','4');
 const after=await map(page).evaluate(el=>({camera:el.graphView.snapshot().camera,positions:el.graphView.simulation.all.slice(0,3).map(n=>[n.path,n.x,n.y,n.z])}));
 expect(after).toEqual(before);expect(calls).toBe(1);
});

for(const width of [1180,390])test(`bulk local evidence retains every record and windows the list at ${width}px`,async({page},info)=>{
 await page.setViewportSize({width,height:900});
 const all=[node('Slice.md'),...Array.from({length:320},(_,i)=>node(`N${String(i).padStart(3,'0')}.md`))];
 const links=all.slice(1).map(n=>({source:'Slice.md',destination:n.path,occurrence_count:2}));let calls=0;
 await setup(page,route=>{calls++;return route.fulfill({json:payload(all,links,null,{projection_complete:false,limiting_reasons:['index_updating','projection_incomplete']})});});
 await page.evaluate(()=>document.dispatchEvent(new Event('backstory:open-graph')));
 const dialog=panel(page);
 await expect(dialog.locator('[data-graph-summary]')).toContainText('321 notes · 320 directed links · Loaded available results · Index updating');
 await closeGraphLayer(dialog);
 if(!await dialog.locator('[data-graph-list]').isVisible())await dialog.getByRole('button',{name:'Connection list',exact:true}).click();
 await expect(dialog.locator('[data-graph-nodes] > li')).toHaveCount(250);
 await dialog.getByRole('button',{name:'Next notes',exact:true}).click();
 await expect(dialog.getByRole('button',{name:'Previous notes',exact:true})).toBeFocused();
 await expect(dialog.locator('[data-graph-nodes]')).toContainText('Slice.md');
 await expect(dialog.locator('[data-graph-nodes] > li')).toHaveCount(71);
 await dialog.getByRole('button',{name:'Next links',exact:true}).click();
 await expect(dialog.locator('[data-graph-edges]')).toContainText('N319.md');expect(calls).toBe(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:info.outputPath(`bulk-local-${width}.png`),fullPage:true});
 await dialog.getByRole('button',{name:'Close graph',exact:true}).click();
 await expect(dialog.locator('[data-graph-notes-navigation]')).toBeEmpty();
 await expect(dialog.locator('[data-graph-links-navigation]')).toBeEmpty();
 await expect(map(page)).toHaveAttribute('data-node-count','0');
});

for (const width of [1180, 390]) test(`opening-root BFS retains dense links and camera through reselection at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 900 });
  const all = [node('Slice.md'), ...Array.from({ length: 119 }, (_, i) => node(`Dense${i}.md`))];
  const links = [0, 1].flatMap(hub => all.slice(2).map(n => ({ source: all[hub].path, destination: n.path, occurrence_count: 3 })));
  links.push({ source: all[0].path, destination: all[1].path, occurrence_count: 1 });
  await setup(page, route => route.fulfill({ json: payload(all, links) }));
  await page.evaluate(() => document.dispatchEvent(new Event('backstory:open-graph')));
  await expect(map(page)).toHaveAttribute('data-node-count', '120');
  await map(page).evaluate(el => {
    const view = el.graphView; view.setPaused(true); view.orbit(.3,.1);
    view.actions.onSelect('Slice.md', true);
  });
  const before = await map(page).evaluate(el => ({ camera: el.graphView.snapshot().camera, positions: el.graphView.simulation.all.map(n => [n.path,n.x,n.y,n.z]) }));
  expect(await map(page).evaluate(el => el.graphView.simulation.springs.length)).toBe(119);
  await map(page).evaluate(el => el.graphView.actions.onSelect('Dense0.md', true));
  expect(await map(page).evaluate(el => el.graphView.simulation.springs.length)).toBe(119);
  const after = await map(page).evaluate(el => ({ camera: el.graphView.snapshot().camera, positions: el.graphView.simulation.all.map(n => [n.path,n.x,n.y,n.z]) }));
  expect(after).toEqual(before);
  expect(await map(page).evaluate(el => el.graphView.data.edges.length)).toBe(237);
  expect(await map(page).evaluate(el => el.graphView.paused)).toBe(true);
  await closeGraphLayer(panel(page)); await panel(page).locator('[data-graph-filter-options]').evaluate(el => { el.open = false; });
  await panel(page).locator('[data-graph-control-options]').evaluate(el => { el.open = false; });
  await map(page).evaluate(el => {
    const view = el.graphView, sim = view.simulation;
    view.actions.onSelect('Slice.md', true);
    sim.settle(240); view.fit(); view.draw();
  });
  await page.screenshot({ path: info.outputPath(`dense-bfs-${width}.png`), fullPage: true });
  // Comparison uses the same synthetic topology with the previous all-pairs rule.
  await map(page).evaluate(el => {
    const view = el.graphView, sim = view.simulation, seen = new Set();
    sim.springs = [];
    for (const edge of view.data.edges) {
      const key = JSON.stringify([edge.source, edge.destination].sort());
      if (seen.has(key)) continue; seen.add(key);
      sim.springs.push([sim.nodes.get(edge.source), sim.nodes.get(edge.destination)]);
    }
    sim.reheat(); sim.settle(240); view.fit(); view.draw();
  });
  await page.screenshot({ path: info.outputPath(`dense-all-pairs-comparison-${width}.png`), fullPage: true });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await map(page).evaluate(el => el.graphView.actions.onSelect('Dense0.md', true));
  expect(await map(page).evaluate(el => el.graphView.paused)).toBe(true);
});

for(const width of [1180,390])test(`snapshot refresh keeps frame and presentation stable at ${width}px`,async({page},info)=>{
 await page.setViewportSize({width,height:900});let hold=false,release;
 await setup(page,async route=>{
  if(hold){const result=await new Promise(resolve=>release=resolve);await route.fulfill(result).catch(()=>{});}
  else await route.fulfill({json:payload(nodes,edges)});
 });
 await open(page);await page.keyboard.press('Escape');await (await navigation(page)).focus();
 await map(page).evaluate(el=>{const v=el.graphView;v.setPaused(true);v.orbit(.2,.1);v.actions.onSelect('B.md',true);});
 const snapshot=()=>map(page).evaluate(el=>{const v=el.graphView;return {camera:v.snapshot().camera,positions:v.simulation.all.map(n=>[n.path,n.x,n.y,n.z]),selected:v.selected,focused:v.focused,paused:v.paused};});
 const before=await snapshot(),bounds=await panel(page).locator('.graph-workspace').boundingBox();
 hold=true;await graphControl(panel(page), 'Refresh');await expect.poll(()=>Boolean(release)).toBe(true);
 expect(await snapshot()).toEqual(before);expect(await panel(page).locator('.graph-workspace').boundingBox()).toEqual(bounds);
 release({json:payload(nodes,edges,null,{generation:2,snapshot_id:'new'})});
 await expect(panel(page).locator('[data-graph-summary]')).toContainText('Complete');expect(await snapshot()).toEqual(before);
 await page.screenshot({path:info.outputPath(`stable-snapshot-${width}.png`),fullPage:true});
 release=null;await graphControl(panel(page), 'Refresh');await expect.poll(()=>Boolean(release)).toBe(true);
 release({status:401,json:{untrusted_content:true,reason_code:'authentication_required'}});
 await expect(panel(page).locator('[data-graph-status]')).toContainText('Session expired');
 await expect(map(page)).toHaveAttribute('data-node-count','0');
 await expect(panel(page).locator('[data-graph-nodes] > li strong')).toHaveCount(0);
 expect(await panel(page).locator('.graph-workspace').boundingBox()).toEqual(bounds);
});
