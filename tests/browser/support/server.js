import { spawnSync, spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

export const runtime = '/tmp/backstory-release-one/browser-runtime';
export const source = '---\r\ntitle: Inline slice\naliases: [Small demo]\r\n---\n\n# Inline preview\r\n\nA **quiet emphasis** and `literal code`.\n\n## Links\r\n\n[[Other#Details|Wiki alias]] and [relative link](Other.md#Details).\n\n- A list item\n\n| Name | Value |\r\n| --- | --- |\n| unchanged | 7 |\r\n\n```js\nconst literal = "**source**";\r\n```\n\n:::unfamiliar {keep=this}\nUnfamiliar source remains editable.\n:::\n\n<script>window.noteExecuted = true</script>\n![remote](https://example.invalid/tracker.png)\n';
export const bytes = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(source)]);

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  mkdirSync(`${runtime}/wiki`, { recursive: true });
  mkdirSync(`${runtime}/data`, { recursive: true });
  const identity = 'Synthetic browser identity\n';
  writeFileSync(`${runtime}/wiki/Storage identity.txt`, identity);
  writeFileSync(`${runtime}/wiki/Slice.md`, bytes);
  writeFileSync(`${runtime}/wiki/Other.md`, '# Other\n\n## Details\n\nLocal target.\n');
  const env = { ...process.env, DJANGO_SETTINGS_MODULE: 'backstory.settings', BACKSTORY_WIKI_ROOT: `${runtime}/wiki`, BACKSTORY_DATA_DIR: `${runtime}/data`, BACKSTORY_IDENTITY_PATH: 'Storage identity.txt', BACKSTORY_IDENTITY_SHA256: createHash('sha256').update(identity).digest('hex'), BACKSTORY_COOKIE_MODE: 'localhost', BACKSTORY_ALLOWED_HOSTS: 'localhost,127.0.0.1' };
  const python = fileURLToPath(new URL('../../../.venv/bin/python', import.meta.url));
  for (const args of [['manage.py', 'migrate', '--noinput'], ['manage.py', 'collectstatic', '--noinput'], ['-c', 'import django; django.setup(); from django.contrib.auth import get_user_model; u, _ = get_user_model().objects.get_or_create(username="slice"); u.set_password("synthetic-slice-browser-only"); u.save()']]) {
    const result = spawnSync(python, args, { env, stdio: 'inherit' });
    if (result.status !== 0) process.exit(result.status || 1);
  }
  const server = spawn(python, ['manage.py', 'runserver', '127.0.0.1:8765', '--noreload'], { env, stdio: 'inherit' });
  process.on('SIGTERM', () => server.kill('SIGTERM'));
  process.on('SIGINT', () => server.kill('SIGINT'));
  server.on('exit', code => process.exit(code || 0));
}
