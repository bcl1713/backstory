import {test,expect} from '@playwright/test';

const fixture=()=>{
 const nodes=Array.from({length:1050},(_,i)=>({path:i?`Motion ${i}.md`:'Slice.md',title:`Motion ${i}`,revision:'r',href:i?`/notes/Motion%20${i}.md`:'/notes/Slice.md'}));
 return {schema_version:1,scope:'motion-fixture',snapshot_id:'first',next_cursor:null,untrusted_content:true,authoritative:false,
  projection_complete:true,generation:1,mutation:1,relation_epoch:1,eligibility_version:'policy',observed_at:'2026-11-08T00:00:00Z',freshness:{state:'ready'},limiting_reasons:[],
  nodes,edges:nodes.slice(1).map(node=>({source:'Slice.md',destination:node.path,occurrence_count:1,source_revision:'r'}))};
};
for(const width of [1180,390])test(`1050-node coherent motion, responsive input and cleanup at ${width}px`,async({page},info)=>{
 test.setTimeout(60000);await page.setViewportSize({width,height:900});
 let response=fixture();await page.route('**/tools/graph/snapshot/**',route=>route.fulfill({json:response}));
 await page.goto('/accounts/login/');await page.getByLabel('Username',{exact:true}).fill('slice');await page.getByLabel('Password',{exact:true}).fill('synthetic-slice-browser-only');await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await page.goto('/notes/Slice.md');await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');await page.evaluate(()=>document.fonts.ready);
 await page.evaluate(()=>document.dispatchEvent(new Event('backstory:open-graph')));
 const panel=page.locator('[data-graph-dialog]'),map=panel.locator('[data-graph-map]');
 await expect(map).toHaveAttribute('data-renderer','webgl');await expect(map).toHaveAttribute('data-node-count','1050');
 await panel.locator('[data-graph-filter-options]').evaluate(el=>el.open=false);await map.scrollIntoViewIfNeeded();
 const metrics=await map.evaluate(async el=>{
  const v=el.graphView;v.setPaused(true);v.camera.snap();
  const metrics={animationFrames:0,completedSteps:0,draws:0,partialSlices:0,partialPositionChanges:0,solverMs:0,maxSolverMs:0};
  const advance=v.simulation.advance,draw=v.draw;
  v.simulation.advance=function(dt){
   const version=this.positionVersion,steps=this.steps;
   const samples=[this.all[0],this.all[524],this.all[1049]].map(n=>[n.x,n.y,n.z]);
   const start=performance.now(),result=advance.call(this,dt),spent=performance.now()-start;
   metrics.animationFrames++;metrics.completedSteps+=this.steps-steps;metrics.solverMs+=spent;metrics.maxSolverMs=Math.max(metrics.maxSolverMs,spent);
   if(version===this.positionVersion){metrics.partialSlices++;for(let i=0;i<samples.length;i++){const n=this.all[[0,524,1049][i]];if(n.x!==samples[i][0]||n.y!==samples[i][1]||n.z!==samples[i][2])metrics.partialPositionChanges++;}}
   return result;
  };
  v.draw=function(options){metrics.draws++;return draw.call(this,options);};v.setPaused(false);
  await new Promise(resolve=>{let count=0;const next=()=>++count>=120?resolve():requestAnimationFrame(next);requestAnimationFrame(next);});
  v.simulation.advance=advance;v.draw=draw;v.setPaused(true);
  metrics.meanSolverMs=metrics.solverMs/Math.max(1,metrics.animationFrames);return metrics;
 });
 expect(metrics.completedSteps).toBeGreaterThan(0);expect(metrics.partialPositionChanges).toBe(0);
 if(metrics.partialSlices>0)expect(metrics.draws).toBeLessThan(metrics.animationFrames+2);
 await info.attach('motion-cadence',{body:JSON.stringify(metrics,null,2),contentType:'application/json'});console.log(`motion_${width}`,metrics);
 // Camera and pointer controls stay independent of solver completion.
 await map.evaluate(el=>el.graphView.setPaused(false));const yaw=await map.getAttribute('data-camera-yaw');
 await map.focus();await page.keyboard.press('+');await map.evaluate(el=>el.graphView.orbit(.3,.1));await expect(map).not.toHaveAttribute('data-camera-yaw',yaw);
 await map.evaluate(el=>{el.graphView.setPaused(true);el.graphView.fit();});
 const point=await map.evaluate(el=>el.graphView.projected.get('Slice.md')),bounds=await map.boundingBox();
 if(width===390){
  const session=await page.context().newCDPSession(page);
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:bounds.x+point.x,y:bounds.y+point.y}]});
  await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:bounds.x+point.x+35,y:bounds.y+point.y+20}]});
  await expect(map).toHaveAttribute('data-pinned','true');
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await session.detach();
 }else{
  await page.mouse.move(bounds.x+point.x,bounds.y+point.y);await page.mouse.down();await page.mouse.move(bounds.x+point.x+35,bounds.y+point.y+20,{steps:3});
  await expect(map).toHaveAttribute('data-pinned','true');await page.mouse.up();
 }
 await expect(map).toHaveAttribute('data-pinned','false');
 expect(await map.evaluate(el=>el.graphView.projected.get('Slice.md').x)).not.toBe(point.x);
 await map.focus();await page.keyboard.press('f');await expect(map).toHaveAttribute('data-hint-mode','true');await page.keyboard.press('Escape');await expect(panel).toBeVisible();
 const state=()=>map.evaluate(el=>{const v=el.graphView;return {camera:v.snapshot().camera,positions:v.simulation.all.slice(0,3).map(n=>[n.path,n.x,n.y,n.z]),root:v.root,paused:v.paused};});
 const before=await state();
 response={...response,generation:2,snapshot_id:'second',nodes:[...response.nodes,{path:'Added.md',title:'Added',revision:'r',href:'/notes/Added.md'}],edges:[...response.edges,{source:'Slice.md',destination:'Added.md',occurrence_count:1,source_revision:'r'}]};
 await panel.locator('[data-graph-control-options]').evaluate(el=>el.open=true);await panel.getByRole('button',{name:'Refresh',exact:true}).click();await expect(map).toHaveAttribute('data-node-count','1051');expect(await state()).toEqual(before);
 await page.screenshot({path:info.outputPath(`motion-${width}.png`),fullPage:true});
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});await expect(map).toHaveAttribute('data-node-count','0');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:false,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});await expect(map).toHaveAttribute('data-node-count','1051');expect(await state()).toEqual(before);
 await map.evaluate(el=>{window.closedMotion=el.graphView;});await panel.getByRole('button',{name:'Close graph',exact:true}).click();
 expect(await page.evaluate(()=>({active:closedMotion.simulation.active,pending:closedMotion.simulation.pendingStep,nodes:closedMotion.simulation.nodes.size,frame:closedMotion.frame}))).toEqual({active:false,pending:null,nodes:0,frame:null});
});
