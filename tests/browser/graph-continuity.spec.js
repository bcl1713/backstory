import { test, expect } from '@playwright/test';
import { closeGraphLayer, showGraphLayer, graphControl } from './support/graph.js';

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
  // Node count is also populated in the hidden WebGL fallback. Never accept
  // LIST mode as evidence of a rendered, interactive graph.
  await expect(map, 'This scenario requires a working WebGL2 executor').toHaveAttribute('data-renderer','webgl');
  const listToggle=panel.locator('[data-graph-list-toggle]');
  if(await listToggle.getAttribute('aria-pressed')==='true')await listToggle.click();
  await expect(listToggle).toHaveAttribute('aria-pressed','false');
  await expect(panel.locator('[data-graph-list]')).toBeHidden();
  await graphBounds(map);
  await expect.poll(()=>map.evaluate(el=>({
    drawn:el.graphView.renderer.info.render.calls>0,
    projected:el.graphView.projected.size,
  }))).toEqual({drawn:true,projected:4});
  return {panel,map};
}

async function graphBounds(map) {
  await expect(map).toBeVisible();
  await expect(map.locator('canvas').first()).toBeVisible();
  const bounds=await map.boundingBox();
  expect(bounds, 'Visible graph must have a bounding box before pointer coordinates').not.toBeNull();
  expect(bounds.width).toBeGreaterThan(0);expect(bounds.height).toBeGreaterThan(0);
  return bounds;
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
  const bounds=await graphBounds(map);
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

// These cases deliberately use the real clock: the worker and animation frames
// must publish genuine solver motion while Playwright holds a captured pointer.
async function selectNote(panel, map, path) {
  await showGraphLayer(panel,'find');
  await panel.getByRole('button',{name:`Select ${path}`,exact:true}).click();
  await expect(map).toHaveAttribute('data-selected',path);
  await expect.poll(()=>map.evaluate((el,path)=>{
    const v=el.graphView,n=v.simulation.nodes.get(path),c=v.camera;
    return Math.hypot(c.x-n.x,c.y-n.y,c.z-n.z);
  },path)).toBeLessThan(.05);
}

async function stimulateLayout(panel) {
  // A real force control reheats the real worker, even on a slow executor where
  // the initial four-node layout has cooled during UI setup. No position writes.
  await showGraphLayer(panel,'controls');
  for(const name of ['settings','forces']) {
    const details=panel.locator(`[data-graph-${name}]`);
    if(!await details.evaluate(el=>el.open))await details.locator(':scope > summary').click();
  }
  const slider=panel.getByRole('slider',{name:'Repulsion',exact:true});
  await slider.focus();await slider.press('End');
  await expect(slider).toHaveValue('4');
  await closeGraphLayer(panel);
}

async function emptyGraphPoint(map) {
  const bounds=await graphBounds(map);
  const point=await map.evaluate(el=>{
    const v=el.graphView,r=el.getBoundingClientRect();
    for(const fy of [.35,.5,.65])for(const fx of [.2,.8,.35,.65]) {
      const p={x:r.width*fx,y:r.height*fy};
      const hit=document.elementFromPoint(r.left+p.x,r.top+p.y);
      if(hit?.closest('[data-graph-map]')===el && !v.pick(p))return p;
    }
    return null;
  });
  expect(point,'An unobstructed background point must be available for camera input').not.toBeNull();
  return {x:bounds.x+point.x,y:bounds.y+point.y};
}

// Read-only observation shared by the immediate snapshots and rAF recorder.
function focusSample(el,path) {
  const v=el.graphView,c=v.camera,n=v.simulation.nodes.get(path),p=v.projected.get(path);
  const target=[c.targetX,c.targetY,c.targetZ],center=[c.x,c.y,c.z],node=[n.x,n.y,n.z];
  return {selected:v.selected,tracked:v.trackedSelection?.path ?? null,
    running:!v.paused && !v.simulation.suspended && v.simulation.active,
    version:v.simulation.positionVersion,node,target,center,
    offset:target.map((x,i)=>x-node[i]),error:Math.hypot(...center.map((x,i)=>x-target[i])),
    radius:c.distance,targetRadius:c.targetDistance,angles:[c.yaw,c.pitch,c.roll],
    pointers:v.pointers.size,captured:[...v.pointers.keys()].every(id=>el.hasPointerCapture(id)),
    drag:v.drag && {path:v.drag.path,pan:v.drag.pan,moved:v.drag.moved},
    projection:p && {x:p.x,y:p.y,radius:p.radius,scale:p.scale,visible:p.visible},
    width:c.width,height:c.height};
}

async function heldMotion(map,path,info,label) {
  // Install only a reader, never replace tick/advance/draw or inject positions.
  await map.evaluate((el,source)=>{el.readFocusSample=(0,eval)(`(${source})`);},focusSample.toString());
  const samples=await map.evaluate(async(el,path)=>{
    const samples=[];
    await new Promise(resolve=>{
      const next=()=>{
        samples.push(el.readFocusSample(el,path));
        const first=samples[0],last=samples.at(-1);
        const moved=Math.hypot(...last.node.map((x,i)=>x-first.node[i]));
        // Wait for observed publications/displacement, bounded by frame count.
        if(samples.length>=180 || samples.length>=16 && last.version-first.version>=3 && moved>=.25)resolve();
        else requestAnimationFrame(next);
      };
      requestAnimationFrame(next);
    });
    return samples;
  },path);
  await info.attach(label,{body:JSON.stringify(samples,null,2),contentType:'application/json'});
  const first=samples[0],last=samples.at(-1);
  expect(samples.length).toBeGreaterThanOrEqual(16);
  expect(last.version-first.version,`${label}: solver must publish while held`).toBeGreaterThanOrEqual(3);
  expect(Math.hypot(...last.node.map((x,i)=>x-first.node[i])),`${label}: actual selected-node displacement`).toBeGreaterThanOrEqual(.25);
  for(const sample of samples) {
    expect(sample.running,`${label}: simulation must remain running`).toBe(true);
    expect(sample.pointers).toBe(1);expect(sample.captured).toBe(true);
    expect(sample.selected).toBe(path);expect(sample.tracked).toBe(path);
    expect(sample.drag.path).toBeNull(); // No selected-node pin/drag substitute.
    expect(sample.projection.visible).toBe(true);
    expect(sample.projection.x).toBeGreaterThan(0);expect(sample.projection.x).toBeLessThan(sample.width);
    expect(sample.projection.y).toBeGreaterThan(0);expect(sample.projection.y).toBeLessThan(sample.height);
    expect(sample.projection.radius).toBeGreaterThan(0);
    expect(sample.projection.radius/sample.projection.scale).toBeCloseTo(7,6);
    expect([...sample.node,...sample.target,...sample.center,sample.radius].every(Number.isFinite)).toBe(true);
  }
  return samples;
}

for(const gesture of ['orbit','pan','zoom'])test(`selected-node focus follows live motion through camera controls without recentering: ${gesture}`,async({page},info)=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.route('**/tools/graph/snapshot/**',route=>route.fulfill({json:fixture()}));
  const {panel,map}=await open(page);
  await selectNote(panel,map,'B.md');
  const aligned=await map.evaluate(focusSample,'B.md');
  aligned.offset.forEach(x=>expect(Math.abs(x)).toBeLessThan(1e-6));
  expect(aligned.error).toBeLessThan(.05);
  await stimulateLayout(panel);
  const point=await emptyGraphPoint(map);
  await page.mouse.move(point.x,point.y);
  if(gesture==='pan')await page.keyboard.down('Shift');
  await page.mouse.down();
  try {
    const before=await map.evaluate(focusSample,'B.md');
    expect(before.pointers).toBe(1);expect(before.captured).toBe(true);expect(before.drag.path).toBeNull();
    if(gesture==='zoom') {
      await page.mouse.wheel(0,-120);
      await expect.poll(()=>map.evaluate(el=>el.graphView.camera.targetDistance)).toBeLessThan(before.targetRadius);
    }else await page.mouse.move(point.x+36,point.y+24,{steps:6});
    const controlled=await map.evaluate(focusSample,'B.md');
    if(gesture==='orbit') {
      expect(controlled.angles[0]-before.angles[0]).toBeCloseTo(-.216,6);
      expect(controlled.angles[1]-before.angles[1]).toBeCloseTo(.144,6);
      expect(controlled.radius).toBeCloseTo(before.targetRadius,6);
    }else if(gesture==='pan') {
      expect(controlled.drag.pan).toBe(true);expect(controlled.drag.moved).toBe(true);
      expect(Math.hypot(...controlled.offset)).toBeGreaterThan(1);
      expect(controlled.angles).toEqual(before.angles);
      expect(controlled.radius).toBeCloseTo(before.targetRadius,6);
    }else {
      expect(controlled.targetRadius).toBeCloseTo(before.targetRadius/1.12,6);
      expect(Math.hypot(...controlled.offset)).toBeGreaterThan(1);
      expect(controlled.angles).toEqual(before.angles);
    }
    // Both before and after a second real input, hold through solver publications.
    for(const phase of ['first','continued']) {
      if(phase==='continued') {
        if(gesture==='zoom') {
          await page.mouse.wheel(0,-120);
          await expect.poll(()=>map.evaluate(el=>el.graphView.camera.targetDistance)).toBeLessThan(controlled.targetRadius);
        }else await page.mouse.move(point.x+48,point.y+32,{steps:3});
      }
      const reference=await map.evaluate(focusSample,'B.md');
      const samples=await heldMotion(map,'B.md',info,`${gesture}-${phase}-held-motion`);
      let error=reference.error,radius=reference.radius;
      for(const sample of samples) {
        sample.offset.forEach((x,i)=>expect(Math.abs(x-reference.offset[i]),'target offset must travel with the selected node').toBeLessThan(1e-6));
        expect(sample.targetRadius).toBeCloseTo(reference.targetRadius,6);
        expect(sample.angles).toEqual(reference.angles);
        // Existing camera easing may finish; it must not recenter, overshoot or
        // alter the user radius. Target and actual center are checked separately.
        expect(sample.error).toBeLessThanOrEqual(error+1e-6);error=sample.error;
        expect(sample.radius).toBeLessThanOrEqual(radius+1e-6);
        expect(sample.radius).toBeGreaterThanOrEqual(reference.targetRadius-1e-6);radius=sample.radius;
      }
      if(gesture!=='zoom')expect(samples.at(-1).radius).toBeCloseTo(reference.radius,6);
    }
  } finally {
    await page.mouse.up();
    if(gesture==='pan')await page.keyboard.up('Shift');
  }
  expect(await map.evaluate(el=>el.graphView.pointers.size)).toBe(0);
  // Keyboard zoom remains a natural user control after releasing the gesture.
  const released=await map.evaluate(focusSample,'B.md');
  await map.focus();await page.keyboard.press('+');
  await expect.poll(()=>map.evaluate(el=>el.graphView.camera.targetDistance)).toBeCloseTo(released.targetRadius/1.25,6);
  await expect(map).toHaveAttribute('data-selected','B.md');
  await page.screenshot({path:info.outputPath(`selected-node-camera-focus-${gesture}.png`)});
});

test('selected-node focus switches, deselects and removes tracking safely during live layout',async({page},info)=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  let response=fixture();
  await page.route('**/tools/graph/snapshot/**',route=>route.fulfill({json:response}));
  const {panel,map}=await open(page);
  await selectNote(panel,map,'B.md');
  const before=await map.evaluate(focusSample,'B.md');
  await selectNote(panel,map,'C.md');
  const switched=await map.evaluate(focusSample,'C.md');
  switched.offset.forEach(x=>expect(Math.abs(x)).toBeLessThan(1e-6));
  expect(switched.targetRadius).toBeCloseTo(before.targetRadius,6);
  expect(switched.angles).toEqual(before.angles);
  await stimulateLayout(panel);
  const point=await emptyGraphPoint(map);
  await page.mouse.move(point.x,point.y);await page.mouse.down();
  try {
    // No UI action exposes deselection. Exercise the real renderer lifecycle API;
    // the solver keeps running and the pointer prevents unrelated idle rotation.
    await map.evaluate(el=>el.graphView.setSelection(null,null));
    const samples=await map.evaluate(async el=>{
      const rows=[];
      await new Promise(resolve=>{
        const next=()=>{
          const v=el.graphView,n=v.simulation.nodes.get('C.md');
          rows.push({node:[n.x,n.y,n.z],camera:v.snapshot().camera,selected:v.selected,tracked:v.trackedSelection,
            running:!v.paused && !v.simulation.suspended && v.simulation.active,pointers:v.pointers.size,
            captured:[...v.pointers.keys()].every(id=>el.hasPointerCapture(id)),version:v.simulation.positionVersion});
          const first=rows[0],last=rows.at(-1);
          if(rows.length>=180 || rows.length>=16 && last.version-first.version>=3 && Math.hypot(...last.node.map((x,i)=>x-first.node[i]))>=.25)resolve();
          else requestAnimationFrame(next);
        };requestAnimationFrame(next);
      });return rows;
    });
    await info.attach('deselected-held-motion',{body:JSON.stringify(samples,null,2),contentType:'application/json'});
    expect(samples.at(-1).version-samples[0].version).toBeGreaterThanOrEqual(3);
    expect(Math.hypot(...samples.at(-1).node.map((x,i)=>x-samples[0].node[i]))).toBeGreaterThanOrEqual(.25);
    for(const sample of samples) {
      expect(sample.selected).toBeNull();expect(sample.tracked).toBeNull();
      expect(sample.running).toBe(true);expect(sample.pointers).toBe(1);expect(sample.captured).toBe(true);
      expect(sample.camera).toEqual(samples[0].camera);
    }
  } finally { await page.mouse.up(); }
  await selectNote(panel,map,'C.md');
  response={...fixture(),snapshot_id:'removed',generation:2,
    nodes:fixture().nodes.filter(n=>n.path!=='C.md'),edges:fixture().edges.filter(e=>e.source!=='C.md' && e.destination!=='C.md')};
  await graphControl(panel,'Refresh');await closeGraphLayer(panel);
  await expect(map).toHaveAttribute('data-node-count','3');
  await expect.poll(()=>map.evaluate(el=>{
    const v=el.graphView;
    return {removed:!v.simulation.nodes.has('C.md') && !v.projected.has('C.md'),
      selectedValid:v.selected===null || v.simulation.nodes.has(v.selected),
      focusedValid:v.focused===null || v.simulation.nodes.has(v.focused),
      trackedValid:v.trackedSelection==null || v.simulation.nodes.has(v.trackedSelection.path),
      finite:Object.values(v.snapshot().camera).every(Number.isFinite)};
  })).toEqual({removed:true,selectedValid:true,focusedValid:true,trackedValid:true,finite:true});
  await graphBounds(map);
  await page.screenshot({path:info.outputPath('selected-node-removal.png')});
});
