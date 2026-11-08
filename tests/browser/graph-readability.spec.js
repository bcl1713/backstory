import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

// Synthetic graph: no private titles, source files or deployed settings.
test('dense phone labels, directed spring contrast, bloom and disclosed index phases', async ({ page }, info) => {
  test.setTimeout(60000);
  await page.setViewportSize({width:390,height:844});
  const revision='"'+'a'.repeat(64)+'"';
  const nodes=Array.from({length:93},(_,i)=>({path:i?`Synthetic ${i}.md`:'Slice.md',title:`Synthetic ${i} long readable note identity`,revision,href:i?`/notes/Synthetic%20${i}.md`:'/notes/Slice.md'}));
  const edges=[], add=(a,b)=>edges.push({source:nodes[a].path,destination:nodes[b].path,occurrence_count:1});
  for(let i=1;i<93;i++)add(0,i);
  for(let i=1;i<93;i++){add(i,i===92?1:i+1);add(i,i>90?i-90:i+2);}add(2,0);add(3,1);
  const meta={state:'ok',authoritative:false,untrusted_content:true,projection_complete:true,generation:1,mutation:1,relation_epoch:1,observed_at:'2026-11-08T00:00:00Z',freshness:{state:'ready'},limiting_reasons:[],next_cursor:null};
  await page.route(/\/tools\/graph\//,r=>r.fulfill({json:{...meta,nodes,edges}}));
  await page.route(/\/tools\/links\//,r=>r.fulfill({json:{...meta,items:[]}}));
  let indexRequests=0;
  await page.route(/\/index\/status\//,r=>{indexRequests++;return r.fulfill({json:{state:'partial',phase:'dependencies',metadata_checked:1050,parsed_notes:1,dependencies_checked:312,pending_jobs:0,last_completed:1700000000,last_verified:1700000001,watcher_mode:'native',watcher_health:'healthy',fallback_reason:''}});});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&m.text().includes('THREE.WebGLProgram'))errors.push(m.text());});
  await page.goto('/accounts/login/');await page.getByLabel('Username',{exact:true}).fill('slice');await page.getByLabel('Password',{exact:true}).fill('synthetic-slice-browser-only');await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.goto('/notes/Slice.md');await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');
  await page.evaluate(()=>document.dispatchEvent(new Event('backstory:open-graph')));
  const panel=page.locator('[data-graph-dialog]'),map=panel.locator('[data-graph-map]');
  await expect(map).toHaveAttribute('data-renderer','webgl');await expect(map).toHaveAttribute('data-node-count','93');await expect(map).toHaveAttribute('data-edge-count','278');
  expect(indexRequests).toBe(0);
  await panel.locator('[data-graph-index-status] > summary').click();await expect(panel.locator('[data-graph-index-progress]')).toContainText('Checking dependencies');await expect(panel.locator('[data-graph-index-progress]')).toContainText('0 queued changes');
  await panel.locator('[data-graph-index-status] > summary').click();
  const geometry=await map.evaluate(el=>{
    const v=el.graphView;v.setPaused(true);v.quality.level=0;v.camera.resetOrientation(true);
    const noise=(i,salt)=>{let n=Math.imul(i+salt,0x45d9f3b);n=Math.imul(n^(n>>>16),0x45d9f3b);return ((n^(n>>>16))>>>0)/4294967296;};
    // Irregular crowded clusters exercise collisions without suggesting a grid
    // layout. Production coordinates continue to come only from GraphPhysics.
    v.simulation.all.forEach((n,i)=>{
      const cluster=i%3,angle=noise(i,17)*Math.PI*2,radius=Math.sqrt(noise(i,61));
      const p=i<3?{x:110+i*5,y:180+i*3}:{x:v.camera.width*(.25+cluster*.22)+Math.cos(angle)*radius*v.camera.width*.18,y:278+cluster*28+Math.sin(angle)*radius*48};
      Object.assign(n,v.camera.world(p));
    });
    v.setSelection(v.data.nodes[1].path,v.data.nodes[2].path);v.setBloom(2);v.draw();
    return {width:v.camera.width,height:v.camera.height,labels:v.labelPlacements,marks:[...v.projected].map(([path,p])=>({path,...p})),camera:v.snapshot().camera};
  });
  const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  for(const path of ['Synthetic 1.md','Synthetic 2.md','Synthetic 3.md'])expect(geometry.labels.some(l=>l.path===path)).toBe(true);
  expect(geometry.labels.map(l=>l.path).sort()).toEqual(['Synthetic 1.md','Synthetic 2.md','Synthetic 3.md']);
  expect(geometry.labels.find(l=>l.path==='Synthetic 2.md').text).toMatch(/^f [a-z]+ · /);
  await expect(panel.getByRole('button',{name:'Node hints (f)',exact:true})).toBeVisible();
  for(const [i,l]of geometry.labels.entries())for(const other of geometry.labels.slice(i+1))expect(overlap(l.rect,other.rect)).toBe(false);
  for(const l of geometry.labels)for(const m of geometry.marks)if(m.visible){const r=['Slice.md','Synthetic 1.md','Synthetic 2.md'].includes(m.path)?19:8;expect(overlap(l.rect,{x:m.x-r,y:m.y-r,w:2*r,h:2*r})).toBe(false);}
  await writeFile(info.outputPath('label-geometry.json'),JSON.stringify(geometry,null,2));
  const contrast=await map.evaluate(el=>{const v=el.graphView;return v.data.edges.map((e,i)=>({spring:v.simulation.isSpringEdge(e.source,e.destination),direct:e.source===v.selected&&e.destination!==v.selected,line:v.batch.edges.geometry.attributes.color.getW(i*2),arrow:v.batch.arrows.geometry.attributes.color.getW(i*3)}));});
  expect(contrast.some(e=>e.spring)).toBe(true);expect(contrast.some(e=>!e.spring)).toBe(true);
  for(const e of contrast){expect(e.line).toBeCloseTo(e.spring||e.direct?1:.12);expect(e.arrow).toBeCloseTo(e.spring||e.direct?1:.12);}
  await panel.locator('[data-graph-control-options]').evaluate(el=>{el.open=false;});await map.scrollIntoViewIfNeeded();
  await panel.evaluate(el=>{const map=el.querySelector('[data-graph-map]'),header=el.querySelector('.graph-header');el.scrollTop+=map.getBoundingClientRect().top-header.getBoundingClientRect().bottom-8;});
  expect((await map.boundingBox()).y).toBeGreaterThan((await panel.locator('.graph-header').boundingBox()).y+(await panel.locator('.graph-header').boundingBox()).height);
  await map.screenshot({path:info.outputPath('phone-dark-default.png')});
  await map.evaluate(el=>el.graphView.setBloom(4));await expect(map).toHaveAttribute('data-bloom-effective','4');
  await map.screenshot({path:info.outputPath('phone-dark-high.png')});
  await page.evaluate(()=>{
    const el=document.querySelector('[data-theme-controls] input[type=file]'), transfer=new DataTransfer();
    transfer.items.add(new File(["colors.primary={background='#ffffff',foreground='#202020'}\ncolors.normal={blue='#173f7a',cyan='#005a62',yellow='#754400'}"],'synthetic-light.toml',{type:'application/toml'}));el.files=transfer.files;el.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await expect(page.locator('body')).toHaveCSS('background-color','rgb(255, 255, 255)');
  await map.screenshot({path:info.outputPath('phone-light-high.png')});await map.evaluate(el=>el.graphView.setBloom(2));await map.screenshot({path:info.outputPath('phone-light-default.png')});
  await map.evaluate(el=>{el.graphView.actions.onSelect('Synthetic 3.md',true);el.graphView.zoom(1.1);});
  await expect(map).toHaveAttribute('data-selected','Synthetic 3.md');await map.screenshot({path:info.outputPath('phone-light-selected-zoom.png')});
  await map.evaluate(el=>{const v=el.graphView;for(let n=0;n<12;n++)v.quality.sample(.05);v.themeDirty=true;v.draw();});await expect(map).toHaveAttribute('data-bloom-effective','0');
  await map.evaluate(el=>{const v=el.graphView;for(let n=0;n<180;n++)v.quality.sample(.01);v.themeDirty=true;v.draw();});await expect(map).toHaveAttribute('data-bloom-effective','2');
  await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});await expect(map).toHaveAttribute('data-bloom-effective','0');
  expect(await map.evaluate(el=>{const a=el.graphView.batch.edges.geometry.attributes.color;return Array.from({length:a.count},(_,i)=>a.getW(i)).every(v=>v===1);})).toBe(true);
  await panel.getByRole('button',{name:'Connection list',exact:true}).click();await expect(panel.locator('[data-graph-nodes] > li')).toHaveCount(93);await expect(panel.locator('[data-graph-edges] > li')).toHaveCount(250);
  await page.screenshot({path:info.outputPath('phone-forced-colors-list.png')});
  await panel.getByRole('button',{name:'Close graph',exact:true}).click();
  await page.evaluate(()=>document.dispatchEvent(new Event('backstory:open-graph')));
  await expect(panel.locator('[data-graph-index-status]')).not.toHaveAttribute('open','');
  await expect(panel.locator('[data-graph-index-progress]')).toHaveText('Open for current indexing progress.');
  expect(errors).toEqual([]);
});
