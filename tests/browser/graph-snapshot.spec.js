import {test,expect} from '@playwright/test';

const node=path=>({path,title:path,revision:'r',href:'/notes/'+path});
const data={schema_version:1,scope:'session-policy',snapshot_id:'first',next_cursor:null,
 untrusted_content:true,authoritative:false,projection_complete:true,generation:1,mutation:1,relation_epoch:1,
 eligibility_version:'policy',observed_at:'2026-11-08T00:00:00Z',freshness:{state:'ready'},limiting_reasons:[],
 nodes:['Slice.md','B.md','C.md','D.md','E.md','Isolate.md'].map(node),
 edges:[['Slice.md','B.md'],['B.md','C.md'],['C.md','D.md'],['D.md','E.md']].map(([source,destination])=>({source,destination,occurrence_count:3,source_revision:'r'}))};

test('snapshot selection is local; refreshed generations retain presentation and revoked evidence disappears',async({page})=>{
 await page.clock.install();
 let response=data, failure=false, held=false, release;
 const requests=[],extraRequests=[];
 await page.route('**/tools/graph/snapshot/**',async route=>{
  requests.push(Object.fromEntries(new URL(route.request().url()).searchParams));
  if(held)await new Promise(resolve=>release=resolve);
  await route.fulfill(failure?{status:401,json:{untrusted_content:true,reason_code:'authentication_required'}}:{json:response}).catch(()=>{});
 });
 page.on('request',r=>{if(['/tools/graph/','/tools/links/'].includes(new URL(r.url()).pathname))extraRequests.push(r.url());});
 await page.goto('/accounts/login/');await page.getByLabel('Username',{exact:true}).fill('slice');await page.getByLabel('Password',{exact:true}).fill('synthetic-slice-browser-only');await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await page.goto('/notes/Slice.md');await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');
 await page.evaluate(()=>document.dispatchEvent(new Event('backstory:open-graph')));
 const panel=page.locator('[data-graph-dialog]'),map=panel.locator('[data-graph-map]'),summary=panel.locator('[data-graph-summary]');
 await expect(summary).toContainText('3 notes · 2 directed links · Complete');
 expect(requests).toEqual([{}]);
 await map.evaluate(el=>{const v=el.graphView;v.setPaused(true);v.orbit(.2,.1);v.actions.onSelect('C.md',true);});
 await expect(summary).toContainText('5 notes · 4 directed links · Complete');
 await expect(panel.locator('[data-graph-details]')).toContainText('D.md');
 const state=()=>map.evaluate(el=>{const v=el.graphView;return {camera:v.snapshot().camera,positions:v.simulation.all.map(n=>[n.path,n.x,n.y,n.z]),selected:v.selected,focused:v.focused,paused:v.paused,root:v.root};});
 const before=await state();
 await map.evaluate(el=>el.graphView.actions.onSelect('C.md',true));
 await expect(summary).toContainText('4 directed links');expect(requests).toHaveLength(1);expect(extraRequests).toEqual([]);
 response={...data,generation:2,snapshot_id:'second'};
 await panel.locator('[data-graph-control-options]').evaluate(el=>el.open=true);
 await panel.getByRole('button',{name:'Refresh',exact:true}).click();
 await expect.poll(()=>requests.length).toBe(2);await expect(summary).toContainText('Complete');expect(await state()).toEqual(before);
 // The visible periodic refresh revalidates even when the graph never receives input.
 failure=true;await page.clock.fastForward(15001);
 await expect(panel.locator('[data-graph-status]')).toContainText('Session expired');
 await expect(map).toHaveAttribute('data-node-count','0');await expect(panel.locator('[data-graph-details]')).not.toContainText('C.md');
 await page.clock.resume();failure=false;held=true;
 await panel.getByRole('button',{name:'Restart loading',exact:true}).click();await expect.poll(()=>Boolean(release)).toBe(true);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
 held=false;release();await page.evaluate(()=>new Promise(r=>requestAnimationFrame(r)));
 await expect(map).toHaveAttribute('data-node-count','0');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:false,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
 await expect(summary).toContainText('3 notes · 2 directed links · Complete');
 expect(extraRequests).toEqual([]);
});
