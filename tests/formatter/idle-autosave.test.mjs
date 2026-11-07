import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createIdleAutosave } from '../../static/src/idle-autosave.js';

function setup(t) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const state = { dirty: true, blocked: false, composing: false, enabled: true };
  let saves = 0;
  const idle = createIdleAutosave({ getState: () => state, save: () => { saves++; } });
  t.after(() => idle.destroy());
  return { state, idle, saves: () => saves, tick: ms => t.mock.timers.tick(ms) };
}

test('only saves after five seconds without another user edit', t => {
  const s = setup(t);
  s.idle.edited(); s.tick(4999); assert.equal(s.saves(), 0);
  s.idle.edited(); s.tick(4999); assert.equal(s.saves(), 0);
  s.tick(1); assert.equal(s.saves(), 1);
  s.tick(20000); assert.equal(s.saves(), 1);
});
test('clean and protected drafts do not save', t => {
  const s = setup(t);
  s.idle.edited(); s.state.dirty = false; s.tick(5000);
  assert.equal(s.saves(), 0);
  s.state.dirty = true; s.state.enabled = false; s.idle.edited(); s.tick(5000);
  assert.equal(s.saves(), 0);
});
test('coalesces work blocked by an in-flight operation and saves the latest draft once released', t => {
  const s = setup(t);
  s.state.blocked = true;
  s.idle.edited(); s.tick(5000); s.idle.flush(); assert.equal(s.saves(), 0);
  s.idle.edited(); s.tick(5000); s.state.blocked = false; s.idle.flush();
  s.idle.flush(); assert.equal(s.saves(), 1);
});
test('failure pause survives later typing and resume never replays old work', t => {
  const s = setup(t);
  s.idle.edited(); s.idle.pause(); s.idle.edited(); s.tick(5000); s.idle.flush();
  assert.equal(s.saves(), 0);
  s.idle.resume(); s.idle.flush(); s.tick(5000); assert.equal(s.saves(), 0);
  s.idle.edited(); s.tick(5000); assert.equal(s.saves(), 1);
});
test('composition holds a timer and a completed composition gets a fresh idle period', t => {
  const s = setup(t);
  s.state.composing = true; s.idle.edited(); s.tick(5000); assert.equal(s.saves(), 0);
  s.state.composing = false; s.idle.edited(); s.tick(4999); assert.equal(s.saves(), 0);
  s.tick(1); assert.equal(s.saves(), 1);
});
test('external reload cancellation removes pending and blocked work', t => {
  const s = setup(t);
  s.state.blocked = true; s.idle.edited(); s.tick(5000);
  s.idle.cancel(); s.state.blocked = false; s.idle.flush(); s.tick(10000);
  assert.equal(s.saves(), 0);
});
