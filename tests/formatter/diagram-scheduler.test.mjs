import test from 'node:test';
import assert from 'node:assert/strict';
import{existsSync}from'node:fs';
const file=new URL('../../static/src/diagram-loading.js',import.meta.url),api=existsSync(file)?await import(file):{};
function harness(){const watched=new Map(),frames=[],states=[];const scheduler=api.createDiagramScheduler({observe:(el,callback)=>{watched.set(el,callback);return()=>watched.delete(el);},createFrame:(el,source,callbacks)=>{const frame={destroyed:false,destroy(){this.destroyed=true;},callbacks,source};frames.push(frame);return frame;}});return{scheduler,frames,states,watched,mount(id,valid=()=>true,connected=true){const element={id,isConnected:connected};const job=scheduler.mount(element,'flowchart TD\nA-->B',valid,{state:value=>states.push([id,value])});return{element,job,show:visible=>watched.get(element)?.(visible)};}};}
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
test('viewport-only two-frame capacity makes third source explicitly activatable without auto churn',async()=>{
 assert.equal(typeof api.createDiagramScheduler,'function','diagram scheduler missing');
 const h=harness(),a=h.mount('a'),b=h.mount('b'),c=h.mount('c');await tick();assert.equal(h.frames.length,0);
 a.show(true);b.show(true);c.show(true);await tick();assert.equal(h.frames.length,2);assert.ok(h.states.some(([id,s])=>id==='c'&&s==='capacity'));
 c.job.activate();await tick();assert.equal(h.frames.length,3);assert.equal(h.frames[0].destroyed,true);assert.ok(h.states.some(([id,s])=>id==='a'&&s==='paused'));
 await tick();assert.equal(h.frames.length,3);c.show(false);a.show(false);a.show(true);await tick();assert.equal(h.frames.length,4);
 a.job.destroy();b.job.destroy();c.job.destroy();assert.ok(h.frames.every(f=>f.destroyed));
});
test('source/lifetime validity, disconnected pruning and cached failures prevent stale frames/retry storms',async()=>{
 assert.equal(typeof api.createDiagramScheduler,'function');
 const h=harness();let valid=true;const a=h.mount('a',()=>valid);a.show(true);await tick();assert.equal(h.frames.length,1);
 h.frames[0].callbacks.onStatus('error');await tick();assert.ok(h.states.some(([id,s])=>id==='a'&&s==='error'));
 a.show(false);a.show(true);a.job.activate();await tick();assert.equal(h.frames.length,1);
 const b=h.mount('b');b.show(true);await tick();assert.equal(h.frames.length,1); // Same failed source is suppressed.
 a.job.destroy();b.job.destroy();
 const h2=harness(),c=h2.mount('c',()=>valid);c.show(true);valid=false;await tick();assert.equal(h2.frames.length,0);c.job.destroy();
 const d=h2.mount('d');d.show(true);await tick();assert.equal(h2.frames.length,1);d.element.isConnected=false;h2.scheduler.prune();assert.equal(h2.frames[0].destroyed,true);
});
test('explicit source reveal pauses a preview and releases its context without losing reactivation',async()=>{
 assert.equal(typeof api.createDiagramScheduler,'function');const h=harness(),a=h.mount('a');a.show(true);await tick();
 assert.equal(typeof a.job.pause,'function','preview source reveal must release frame');a.job.pause();assert.equal(h.frames[0].destroyed,true);
 a.job.activate();await tick();assert.equal(h.frames.length,2);a.job.destroy();
});
test('immediate hydration after replacing a full fragment prunes stale registrations before capacity check',async()=>{
 const h=harness(),old=Array.from({length:32},(_,i)=>h.mount('old-'+i));
 for(const registration of old)registration.element.isConnected=false;
 const replacement=h.mount('replacement');replacement.show(true);h.scheduler.prune();replacement.job.activate();await tick();
 assert.equal(h.frames.length,1,'replacement must be observed and activatable, not permanently capacity-only');
 assert.equal(h.watched.has(replacement.element),true);replacement.job.destroy();
});

test('same-turn detached CodeMirror widgets survive eager stale-job pruning until synchronous insertion',async()=>{
 const h=harness(),a=h.mount('detached-a',()=>true,false),b=h.mount('detached-b',()=>true,false);
 a.element.isConnected=true;b.element.isConnected=true;a.show(true);b.show(true);await tick();
 assert.equal(h.frames.length,2,'both newborn widgets must remain observed through the DOM construction batch');
 assert.equal(h.watched.has(a.element),true);assert.equal(h.watched.has(b.element),true);a.job.destroy();b.job.destroy();
});

test('successful disconnected previews unconditionally dispose owned measurement resources once',async()=>{
 let disposed=0,stateCalls=0,callbacks,destroyed=0;const element={isConnected:true};
 const scheduler=api.createDiagramScheduler({observe:(el,visible)=>{visible(true);return()=>{};},createFrame:(el,source,handlers)=>{callbacks=handlers;return{destroy(){destroyed++;}};}});
 const registration=scheduler.mount(element,'flowchart TD\nA-->B',()=>true,{state:()=>stateCalls++,dispose:()=>disposed++});
 await tick();callbacks.onStatus('ok');const statesBeforeDetach=stateCalls;
 element.isConnected=false;scheduler.prune();scheduler.prune();registration.destroy();
 assert.equal(destroyed,1);assert.equal(stateCalls,statesBeforeDetach,'detached status callbacks remain suppressed');assert.equal(disposed,1,'cleanup is not conditional on connected/valid status delivery');
});

test('intersection delivery order may render the third diagram while the first retains activatable capacity source',async()=>{
 const h=harness(),first=h.mount('first'),second=h.mount('second'),third=h.mount('third');
 second.show(true);third.show(true);await tick();first.show(true);await tick();
 assert.equal(h.frames.length,2);assert.ok(h.states.some(([id,status])=>id==='first'&&status==='capacity'));
 assert.equal(h.states.some(([id,status])=>id==='third'&&status==='capacity'),false);
 first.job.activate();await tick();assert.equal(h.frames.length,3);assert.equal(h.frames[0].destroyed,true);assert.equal(h.frames[1].destroyed,false);
 assert.ok(h.states.some(([id,status])=>id==='second'&&status==='paused'));
 first.job.destroy();second.job.destroy();third.job.destroy();assert.ok(h.frames.every(frame=>frame.destroyed));
});
