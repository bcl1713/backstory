import { test } from 'node:test';
import assert from 'node:assert/strict';
import { indexProgress } from '../../static/src/graph-index-status.js';

test('index disclosure distinguishes phase work and quiet watcher from completion',()=>{
  const text=indexProgress({state:'partial',phase:'dependencies',metadata_checked:1050,parsed_notes:0,dependencies_checked:312,pending_jobs:0,last_completed:1700000000,last_verified:1700000001,watcher_mode:'native',watcher_health:'healthy',fallback_reason:''});
  assert.match(text,/Checking dependencies/);assert.match(text,/1,050 metadata/);assert.match(text,/312 dependencies/);assert.match(text,/0 queued/);
  assert.match(text,/Last reconciliation/);assert.match(text,/Last content verification/);assert.match(text,/native/);
});

test('unexpected status diagnostics never echo arbitrary paths or note content',()=>{
  const text=indexProgress({state:'private/note.md',phase:'private/title',fallback_reason:'private/path',watcher_mode:'private/mount',watcher_health:'private/error',metadata_checked:NaN,last_completed:Infinity});
  assert.doesNotMatch(text,/private/);assert.match(text,/Unknown/);
});
