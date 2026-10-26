import { expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { runtime } from './server.js';

export async function expireSession(context) {
  const session = (await context.cookies()).find(cookie => cookie.name === 'sessionid');
  expect(session).toBeDefined();
  const env = { ...process.env, DJANGO_SETTINGS_MODULE: 'backstory.settings', BACKSTORY_WIKI_ROOT: `${runtime}/wiki`, BACKSTORY_DATA_DIR: `${runtime}/data`, BACKSTORY_IDENTITY_PATH: '.backstory-marker', BACKSTORY_COOKIE_MODE: 'localhost', BACKSTORY_ALLOWED_HOSTS: 'localhost,127.0.0.1' };
  // Expire the actual server-side device; retain CSRF and avoid cookie deletion
  // racing session-renewal responses from other requests already in flight.
  const program = "import django,json,sys; django.setup(); from datetime import timedelta; from django.utils.timezone import now; from accounts.models import SessionDevice; count=SessionDevice.objects.filter(session_key_digest=json.load(sys.stdin)['digest'],revoked_at=None).update(absolute_expires_at=now()-timedelta(seconds=1)); assert count==1";
  const result = spawnSync('.venv/bin/python', ['-c', program], { env, input: JSON.stringify({ digest: createHash('sha256').update(session.value).digest('hex') }), encoding: 'utf8', timeout: 30000 });
  expect(result.status, result.stderr).toBe(0);
}
