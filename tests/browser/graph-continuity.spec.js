import { test, expect } from '@playwright/test';
import { closeGraphLayer } from './support/graph.js';

const node=path=>({path,title:path,revision:'r',href:'/notes/'+path});
const fixture=()=>({schema_version:1,scope:'continuity',snapshot_id:'one',next_cursor:null,
  untrusted_content:true,authoritative:false,projection_complete:true,generation:1,mutation:1,relation_epoch:1,
  eligibility_version:'policy',observed_at:'2026-11-10T00:00:00Z',freshness:{state:'ready'},limiting_reasons:[],
  nodes:['Slice.md','B.md','C.md','D.md'].map(node),
  edges:[['Slice.md','B.md'],['Slice.md','C.md'],['B.md','D.md']].map(([source,destination])=>({source,destination,occurrence_count:1,source_revision:'r'}))});

async function open(page) {
  await page.goto('/accounts/login/');
  await page.getByLabel('Username',{exact:true}).fill('slice');
  await page.getByLabel('Password',{exact:true}).fill('synthetic-slice-browser-only');
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.goto('/notes/Slice.md');
  await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');
  await page.evaluate(()=>document.dispatchEvent(new Event('backstory:open-graph')));
  const panel=page.locator('[data-graph-dialog]'), map=panel.locator('[data-graph-map]');
  await expect(map).toHaveAttribute('data-node-count','4');
  await closeGraphLayer(panel);
  return {panel,map};
}

test('periodic refresh is quiet and reconciles added/removed notes in the mounted scene',async({page})=>{
  await page.clock.install();
  let response=fixture(), requests=0, release;
  await page.route('**/tools/graph/snapshot/**',async route=>{
    requests++;
    if(requests===2)await new Promise(resolve=>release=resolve);
    await route.fulfill({json:response});
  });
  const {panel,map}=await open(page);
  await map.evaluate(el=>{
    const v=el.graphView;v.setPaused(true);v.actions.onSelect('B.md',true);
    window.graphBefore={batch:v.batch,objects:[...v.batch.group.children],node:v.simulation.nodes.get('B.md'),camera:v.snapshot().camera};
    window.graphAnnouncements=[];
    const root=el.closest('[data-graph-panel]');
    window.graphStatusObserver=new MutationObserver(()=>graphAnnouncements.push(root.querySelector('[data-graph-status]').textContent+' '+root.querySelector('[data-graph-summary]').textContent));
    for(const selector of ['[data-graph-status]','[data-graph-summary]'])graphStatusObserver.observe(root.querySelector(selector),{childList:true,subtree:true,characterData:true});
  });
  await page.clock.fastForward(15001);await expect.poll(()=>requests).toBe(2);
  await expect(panel.locator('[data-graph-status]')).not.toContainText(/Loading|Updating/);
  await expect(panel.locator('[data-graph-summary]')).toContainText('Complete');
  response={...fixture(),snapshot_id:'two',nodes:['Slice.md','B.md','D.md','E.md','F.md'].map(node),
    edges:[['Slice.md','B.md'],['B.md','D.md'],['B.md','E.md'],['B.md','F.md']].map(([source,destination])=>({source,destination,occurrence_count:1,source_revision:'r'}))};
  release();await expect(map).toHaveAttribute('data-node-count','5');
  expect(await map.evaluate(el=>{
    const v=el.graphView,b=graphBefore;
    return {sameBatch:v.batch===b.batch,sameObjects:v.batch.group.children.every((o,i)=>o===b.objects[i]),sameNode:v.simulation.nodes.get('B.md')===b.node,
      sameCamera:JSON.stringify(v.snapshot().camera)===JSON.stringify(b.camera),removed:!v.projected.has('C.md'),drawn:v.batch.nodes.count,
      noisy:graphAnnouncements.some(text=>/Loading|Updating/.test(text))};
  })).toEqual({sameBatch:true,sameObjects:true,sameNode:true,sameCamera:true,removed:true,drawn:5,noisy:false});
});

test('idle camera follows the selection on all axes and pauses for gestures, hints and pause motion',async({page},info)=>{
  await page.clock.install();
  await page.route('**/tools/graph/snapshot/**',route=>route.fulfill({json:fixture()}));
  const {panel,map}=await open(page);
  await map.evaluate(el=>{const v=el.graphView;v.simulation.pause();v.actions.onSelect('B.md',true);});
  await page.clock.runFor(6000);
  const before=await map.evaluate(el=>el.graphView.snapshot().camera);
  await page.clock.runFor(1000);
  const after=await map.evaluate(el=>{
    const v=el.graphView,p=v.projected.get('B.md');return {...v.snapshot().camera,offset:Math.hypot(p.x-v.camera.width/2,p.y-v.camera.height/2)};
  });
  for(const axis of ['yaw','pitch','roll'])expect(after[axis]-before[axis]).toBeGreaterThan(0);
  expect(after.yaw-before.yaw).toBeLessThan(.025);expect(after.offset).toBeLessThan(.1);
  const bounds=await map.boundingBox();
  await page.mouse.move(bounds.x+20,bounds.y+bounds.height/2);await page.mouse.down();
  expect(await map.evaluate(el=>el.graphView.pointers.size)).toBe(1);
  const held=await map.evaluate(el=>el.graphView.snapshot().camera);
  await page.clock.runFor(4000);
  expect(await map.evaluate(el=>el.graphView.snapshot().camera)).toEqual(held);
  await page.mouse.up();await page.clock.runFor(1000);
  expect(await map.evaluate(el=>el.graphView.camera.yaw)).toBe(held.yaw);
  await page.clock.runFor(4000);
  expect(await map.evaluate(el=>el.graphView.camera.yaw)).toBeGreaterThan(held.yaw);
  await map.focus();await page.keyboard.press('f');
  const hints=await map.evaluate(el=>el.graphView.camera.yaw);await page.clock.runFor(4000);
  expect(await map.evaluate(el=>el.graphView.camera.yaw)).toBe(hints);
  await page.keyboard.press('Escape');
  await map.evaluate(el=>el.graphView.setPaused(true));
  const paused=await map.evaluate(el=>el.graphView.snapshot().camera);await page.clock.runFor(5000);
  expect(await map.evaluate(el=>el.graphView.snapshot().camera)).toEqual(paused);
  await page.screenshot({path:info.outputPath('graph-continuity.png')});
  await panel.getByRole('button',{name:'Close graph',exact:true}).click();
});

test('reduced motion prevents ambient rotation',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.clock.install();
  await page.route('**/tools/graph/snapshot/**',route=>route.fulfill({json:fixture()}));
  const {map}=await open(page);
  const before=await map.evaluate(el=>el.graphView.snapshot().camera);
  await page.clock.runFor(6000);
  expect(await map.evaluate(el=>el.graphView.snapshot().camera)).toEqual(before);
});
