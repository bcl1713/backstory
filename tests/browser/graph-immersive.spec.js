import { test, expect } from '@playwright/test';

const revision = '"' + 'a'.repeat(64) + '"';
const node = (path, title = path) => ({ path, title, revision, href: '/notes/' + encodeURIComponent(path) });
const nodes = [node('Slice.md', 'Opening note'), ...Array.from({length: 159}, (_, i) => node(`Synthetic ${i}.md`, `Synthetic ${i} long readable identity`))];
nodes.push(node('Isolated.md','Outside the current exploration'));
const edges = nodes.slice(1,-1).map(n => ({source:'Slice.md',destination:n.path,occurrence_count:3,source_revision:revision,position:[2,1],position_precision:'advisory'}));
edges.push({source:'Synthetic 1.md',destination:'Synthetic 2.md',occurrence_count:2});
const payload = {schema_version:1,scope:'synthetic',snapshot_id:'synthetic',state:'ok',authoritative:false,untrusted_content:true,projection_complete:true,generation:1,mutation:1,relation_epoch:1,observed_at:'2026-11-08T00:00:00Z',freshness:{state:'ready'},limiting_reasons:[],next_cursor:null,nodes,edges};
async function setup(page) {
  await page.route(/\/tools\/graph\//, r => r.fulfill({json:payload}));
  await page.route(/\/tools\/links\//, r => r.fulfill({json:{...payload,items:[]}}));
  await page.goto('/accounts/login/');
  await page.getByLabel('Username',{exact:true}).fill('slice');
  await page.getByLabel('Password',{exact:true}).fill('synthetic-slice-browser-only');
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.goto('/notes/Slice.md');
  await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');
  await page.evaluate(() => document.dispatchEvent(new Event('backstory:open-graph')));
  const panel = page.locator('[data-graph-dialog]'), map = panel.locator('[data-graph-map]');
  await expect(map).toHaveAttribute('data-node-count','160');
  return {panel,map};
}
const state = map => map.evaluate(el => { const v=el.graphView; return {camera:v.snapshot().camera,positions:v.simulation.all.map(n=>[n.path,n.x,n.y,n.z]),selected:v.selected,focused:v.focused,root:v.root,paused:v.paused}; });

for (const width of [1280,390,320]) test(`immersive layers and Find preserve exploration at ${width}px`, async ({page}, info) => {
  await page.setViewportSize({width,height:width===320?568:900});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const {panel,map}=await setup(page);
  test.skip(await map.getAttribute('data-renderer') !== 'webgl','This scenario requires WebGL; graph-mobile covers the list fallback.');
  // Close the launcher's initial Find, leaving the exact same exploration.
  await page.keyboard.press('Escape');
  await map.evaluate(el=>{const v=el.graphView;v.setPaused(true);v.orbit(.25,.1);v.zoom(1.1);});
  const before=await state(map),bounds=await map.boundingBox();
  await page.screenshot({path:info.outputPath('canvas.png')});
  expect(bounds.width).toBeGreaterThan(width*.95);
  expect(bounds.height).toBeGreaterThan((width===320?568:900)*.8);
  const close=panel.getByRole('button',{name:'Close graph',exact:true});
  for(const name of ['Controls','Evidence']) {
    const toggle=panel.getByRole('button',{name,exact:true});await toggle.click();
    const sheet=panel.locator(`[data-graph-overlay="${name.toLowerCase()}"]`);
    await expect(sheet).toBeVisible();
    expect(await map.boundingBox()).toEqual(bounds);expect(await state(map)).toEqual(before);
    await expect(close).toBeInViewport();
    if(name==='Evidence') {
      await expect(sheet.locator('.graph-connection').first()).toContainText('3 occurrences');
      const row=sheet.locator('.graph-connection').first();
      const count=await row.locator('.graph-connection-count').boundingBox(),action=await row.getByRole('link').boundingBox();
      expect(action.y).toBeGreaterThanOrEqual(count.y+count.height);
      await page.screenshot({path:info.outputPath('evidence.png')});
    }
    await page.keyboard.press('Escape');await expect(sheet).toBeHidden();await expect(toggle).toBeFocused();
    expect(await state(map)).toEqual(before);
  }
  await panel.getByRole('button',{name:'Find',exact:true}).click();
  const find=panel.getByRole('searchbox',{name:'Find a note',exact:true});
  await find.fill('Synthetic 11');expect(await state(map)).toEqual(before);
  await page.keyboard.press('Escape');expect(await state(map)).toEqual(before);
  await map.focus();await page.keyboard.press('/');await find.fill('Synthetic 11.md');
  await panel.getByRole('button',{name:'Select Synthetic 11 long readable identity',exact:true}).click();
  await expect(map).toHaveAttribute('data-selected','Synthetic 11.md');await expect(map).toHaveAttribute('data-root','Slice.md');
  expect((await state(map)).camera).toEqual(before.camera);
  await map.focus();await page.keyboard.press('e');await expect(panel.locator('[data-graph-overlay="evidence"]')).toBeVisible();
  await panel.getByRole('button',{name:'Close evidence',exact:true}).click();await expect(map).toBeFocused();
  await page.keyboard.press('f');await expect(map).toHaveAttribute('data-hint-mode','true');
  await page.keyboard.press('Escape');await expect(panel).toBeVisible();
  await panel.getByRole('button',{name:'Connection list',exact:true}).click();
  await expect(panel.locator('[data-graph-nodes] > li')).toHaveCount(160);
  await panel.getByRole('button',{name:'Connection list',exact:true}).click();
  await page.emulateMedia({reducedMotion:'reduce'});expect((await state(map)).paused).toBe(true);
  await close.click();await expect(panel).toBeHidden();await expect(page.locator('.cm-content')).toBeFocused();
  expect(errors).toEqual([]);
});

test('Find never requests a filtered snapshot and filter drafts require Apply',async({page})=>{
  const queries=[];page.on('request',r=>{if(r.url().includes('/tools/graph/snapshot/'))queries.push(new URL(r.url()).search);});
  const {panel,map}=await setup(page);
  const find=panel.getByRole('searchbox',{name:'Find a note',exact:true});
  await find.fill('Synthetic');await find.fill('Missing note');
  await expect(panel.locator('[data-graph-find-results]')).toContainText('No matching notes');
  await page.keyboard.press('Escape');expect(queries).toEqual(['']);
  await panel.getByRole('button',{name:'Controls',exact:true}).click();
  await panel.locator('[data-graph-filter-options] > summary').click();
  await panel.getByRole('searchbox',{name:'Title/path filter',exact:true}).fill('explicit');
  await page.keyboard.press('Escape');
  await map.focus();await page.keyboard.press(']');expect(queries).toEqual(['']);
  await panel.getByRole('button',{name:'Controls',exact:true}).click();
  await panel.getByRole('button',{name:'Refresh',exact:true}).click();
  await expect.poll(()=>queries.length).toBe(2);expect(queries).toEqual(['','']);
  await panel.getByRole('button',{name:'Apply filters',exact:true}).click();
  await expect.poll(()=>queries.length).toBe(3);expect(queries[2]).toBe('?query=explicit');
  await expect(panel.locator('[data-graph-scope]')).toContainText('Filtered by query: explicit');
});


test('Find expands a disconnected result, keyboard sheets preserve canvas, and Back restores editor',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  const {panel,map}=await setup(page);
  await expect(map).toHaveAttribute('aria-label',/Current note: Slice.md.*Selected note: Slice.md.*Keyboard focus: Slice.md.*Opening root: Slice.md/);
  await map.evaluate(el=>el.graphView.setPaused(true));
  const before=await state(map),bounds=await map.boundingBox();
  // Simulate the visual viewport contract used by mobile software keyboards.
  await page.evaluate(()=>{Object.defineProperty(visualViewport,'height',{configurable:true,value:360});visualViewport.dispatchEvent(new Event('resize'));});
  const sheet=panel.locator('[data-graph-overlay="find"]');
  await expect.poll(async()=>{const box=await sheet.boundingBox();return box.y+box.height;}).toBeLessThanOrEqual(361);
  expect(await map.boundingBox()).toEqual(bounds);expect(await state(map)).toEqual(before);
  const search=panel.getByRole('searchbox',{name:'Find a note',exact:true});
  await expect(search).toBeFocused();await search.fill('Isolated');
  await panel.getByRole('button',{name:'Select Outside the current exploration',exact:true}).click();
  await expect(map).toHaveAttribute('data-selected','Isolated.md');await expect(map).toHaveAttribute('data-root','Slice.md');
  await expect(map).toHaveAttribute('data-node-count','161');
  expect((await state(map)).camera).toEqual(before.camera);
  await page.evaluate(()=>{delete visualViewport.height;visualViewport.dispatchEvent(new Event('resize'));});
  await page.goBack();await expect(panel).toBeHidden();await expect(page.locator('.cm-content')).toBeFocused();
  await page.evaluate(()=>document.dispatchEvent(new Event('backstory:open-graph')));
  await expect(panel.locator('[data-graph-find]')).toHaveValue('');
  await page.keyboard.press('Escape');await page.keyboard.press('Escape');await expect(panel).toBeHidden();
});


test('revalidation preserves evidence focus and disclosure, then revokes Find results on authentication loss',async({page})=>{
  await page.clock.install();
  const {panel,map}=await setup(page);await page.keyboard.press('Escape');
  await map.evaluate(el=>el.graphView.setPaused(true));
  await panel.getByRole('button',{name:'Evidence',exact:true}).click();
  const source=panel.locator('.graph-connection').first().locator('details');
  await source.locator('summary').click();
  await page.route('**/tools/graph/snapshot/**',r=>r.fulfill({json:{...payload,generation:2,observed_at:'2026-11-08T00:01:00Z'}}));
  await page.clock.fastForward(15001);
  await expect(panel.locator('[data-graph-diagnostics]')).toContainText('00:01:00Z');
  await expect(source).toHaveAttribute('open','');await expect(source.locator('summary')).toBeFocused();
  await panel.getByRole('button',{name:'Find',exact:true}).click();
  await panel.getByRole('searchbox',{name:'Find a note',exact:true}).fill('Synthetic 1.md');
  await expect(panel.locator('[data-graph-find-results] button')).toHaveCount(1);
  await page.route('**/tools/graph/snapshot/**',r=>r.fulfill({status:401,json:{untrusted_content:true,reason_code:'authentication_required'}}));
  await page.clock.fastForward(15001);
  await expect(panel.locator('[data-graph-status]')).toContainText('Session expired');
  await expect(panel.locator('[data-graph-find-results] button')).toHaveCount(0);
  await expect(panel.locator('[data-graph-details]')).not.toContainText('Slice.md');
});


test('selected identity remains available when dense local label slots are full',async({page})=>{
  const {panel,map}=await setup(page);await page.keyboard.press('Escape');
  await expect(panel.locator('[data-graph-selection]')).toContainText('Selected · Opening note');
  await map.evaluate(el=>el.graphView.actions.onSelect('Synthetic 1.md',true));
  await expect(panel.locator('[data-graph-selection]')).toContainText('Selected · Synthetic 1 long readable identity');
});

test('Inspect returns focus to its loaded-note row',async({page})=>{
  const {panel}=await setup(page);await page.keyboard.press('Escape');
  await panel.getByRole('button',{name:'Connection list',exact:true}).click();
  const inspect=panel.getByRole('button',{name:'Inspect Synthetic 1 long readable identity',exact:true});
  await inspect.click();await panel.getByRole('button',{name:'Close evidence',exact:true}).click();
  await expect(inspect).toBeFocused();
});

test('hidden Find evidence is revoked on suspend',async({page})=>{
  const {panel,map}=await setup(page);await page.keyboard.press('Escape');
  await expect(panel.locator('[data-graph-find-results] button')).not.toHaveCount(0);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  await expect(map).toHaveAttribute('data-node-count','0');
  await expect(panel.locator('[data-graph-find-results] button')).toHaveCount(0);
  await expect(panel.locator('[data-graph-details]')).not.toHaveAttribute('data-path',/Slice/);
});
