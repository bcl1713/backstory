// Fixed packaged entrypoint: bounded JSON stdin/stdout, one isolated worker,
// no shell and no authority over a live wiki directory.
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { LIMITS } from './config.mjs';
import { writeSync } from 'node:fs';

if (!isMainThread) {
  parentPort.postMessage({type:'stage',stage:'module_import'});
  const { formatRequest } = await import('./pipeline.mjs');
  const result = await formatRequest(workerData.request,{scratchDirectory:workerData.scratch,reportStage:stage=>parentPort.postMessage({type:'stage',stage})});
  parentPort.postMessage({type:'result',result});
} else {
  const progress = stage => {
    if (typeof stage !== 'string' || !/^(?:input|worker_start|module_import|configuration|source_math|source_diagrams|candidate_math|candidate_diagrams|worker_timeout|cleanup|output|pass[12]_(?:wikilinks|prettier|lint_fix|wikilinks_check|prettier_check|lint_check))$/.test(stage)) return;
    try { writeSync(2,'backstory-format:' + JSON.stringify({stage,elapsed_ms:Math.ceil(process.uptime()*1000)}) + '\n'); } catch {}
  };
  progress('input');
  let original = '';
  const failure = (code,message) => ({source:original,diagnostics:[{code,message,severity:'error'}],outcome:'failed'});
  let result;
  let scratch;
  let worker;
  try {
    const chunks = []; let size = 0;
    for await (const chunk of process.stdin) {
      size += chunk.length;
      if (size > LIMITS.input) throw new Error('input-limit');
      chunks.push(chunk);
    }
    const request = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    original = typeof request.source === 'string' ? request.source : '';
    scratch = await mkdtemp(path.join(tmpdir(),'backstory-formatter-'));
    progress('worker_start');
    worker = new Worker(new URL(import.meta.url),{workerData:{request,scratch},resourceLimits:{maxOldGenerationSizeMb:256,maxYoungGenerationSizeMb:32,stackSizeMb:4}});
    result = await new Promise(resolve => {
      let settled = false;
      const finish = value => {
        if (settled) return;
        settled = true; clearTimeout(timer); resolve(value);
      };
      const timer = setTimeout(()=>{ progress('worker_timeout'); void worker.terminate(); finish(failure('format-timeout','Formatting exceeded the 10 second budget.')); },Math.max(1,10000 - Math.ceil(process.uptime()*1000)));
      worker.on('message',message=>{
        if (message?.type === 'stage') progress(message.stage);
        else if (message?.type === 'result') finish(message.result);
      });
      worker.once('error',()=>finish(failure('format-worker','The isolated formatter worker failed.')));
      worker.once('exit',code=>{ if (code !== 0) finish(failure('format-worker','The isolated formatter worker exited unexpectedly.')); });
    });
  } catch {
    result = failure('format-input','Invalid or oversized formatter JSON input.');
  } finally {
    progress('cleanup');
    if (worker) await worker.terminate();
    if (scratch) await rm(scratch,{recursive:true,force:true});
  }
  let output = JSON.stringify(result);
  if (Buffer.byteLength(output) > LIMITS.output) output = JSON.stringify(failure('format-output-limit','Formatter JSON output exceeded the 8 MiB limit.'));
  progress('output');
  process.stdout.write(output);
}
