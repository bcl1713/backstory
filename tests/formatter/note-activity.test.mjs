import test from 'node:test';
import assert from 'node:assert/strict';
import { createNoteActivity, activityPulse } from '../../static/src/note-activity.js';

test('publishes minimal canonical activity metadata and validates incoming messages', () => {
  const sent = [];
  const channel = { postMessage: value => sent.push(value), close() {} };
  const activity = createNoteActivity({ channel, now: () => 42 });
  activity.publish('folder/Note.md', 'read');
  assert.deepEqual(sent, [{ type: 'backstory:note-activity', path: 'folder/Note.md', kind: 'read', time: 42 }]);
  assert.equal(activity.parse({ type: 'backstory:note-activity', path: 'folder/Note.md', kind: 'write', time: 42 }, 42).path, 'folder/Note.md');
  for (const message of [
    { type: 'backstory:note-activity', path: '../secret.md', kind: 'read', time: 42 },
    { type: 'backstory:note-activity', path: 'Note.md', kind: 'hover', time: 42 },
    { type: 'backstory:note-activity', path: 'Note.md', kind: 'read', time: -6000 },
    { type: 'backstory:note-activity', path: 'Note.md', kind: 'read', time: 0, source: 'private' },
  ]) assert.equal(activity.parse(message, 42), null);
});

test('coalesces repeated pulses and returns to baseline after a finite capped interval', () => {
  const first = activityPulse(1000, 1000);
  assert.equal(first, 1);
  assert.equal(activityPulse(4000, 1000), 0);
  assert.equal(activityPulse(2000, 1500), 1 - 500 / 1800);
  assert.equal(activityPulse(2000, 2500, true), 0);
});

