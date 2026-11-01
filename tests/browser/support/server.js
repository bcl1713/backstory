import { tableGeometryCases } from './table-geometry.js';
import { spawnSync, spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

export const runtime = process.env.BACKSTORY_BROWSER_RUNTIME || '/tmp/backstory-release-one/browser-runtime';
export const browserOrigin = `http://127.0.0.1:${process.env.BACKSTORY_BROWSER_PORT || '8765'}`;
export const source = '---\r\ntitle: Inline slice\naliases: [Small demo]\r\n---\n\n# Inline preview\r\n\nA **quiet emphasis** and `literal code`.\n\n## Links\r\n\n[[Other#Details|Wiki alias]] and [relative link](Other.md#Details).\n\n- A list item\n\n| Name | Value |\r\n| --- | --- |\n| unchanged | 7 |\r\n\n```js\nconst literal = "**source**";\r\n```\n\n:::unfamiliar {keep=this}\nUnfamiliar source remains editable.\n:::\n\n<script>window.noteExecuted = true</script>\n![remote](https://example.invalid/tracker.png)\n';
export const bytes = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(source)]);

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  mkdirSync(`${runtime}/wiki`, { recursive: true });
  mkdirSync(`${runtime}/data`, { recursive: true });
  mkdirSync(`${runtime}/wiki/Drafts`, { recursive: true });
  writeFileSync(`${runtime}/wiki/.prettierignore`, 'Ignored.md\n');
  writeFileSync(`${runtime}/wiki/.markdownlintignore`, 'Ignored.md\n');
  const identity = 'Synthetic browser identity\n';
  writeFileSync(`${runtime}/wiki/.backstory-marker`, identity);
  writeFileSync(`${runtime}/wiki/Slice.md`, bytes);
  writeFileSync(`${runtime}/wiki/Other.md`, '# Other\n\n## Details\n\nLocal target.\n');
  for (const suffix of ['vim-down', 'vim-up', 'arrows-down', 'arrows-up', 'count-down', 'count-up']) writeFileSync(`${runtime}/wiki/TableKeyboard-${suffix}.md`, 'Before\n\n| Name | Value |\n| --- | --- |\n| unchanged | 7 |\n\nAfter');
  for (const fixture of tableGeometryCases) for (const vim of [false, true]) writeFileSync(`${runtime}/wiki/TableGeometry-${fixture.rows}-${vim}.md`, fixture.source);
  const env = { ...process.env, DJANGO_SETTINGS_MODULE: 'backstory.settings', BACKSTORY_WIKI_ROOT: `${runtime}/wiki`, BACKSTORY_DATA_DIR: `${runtime}/data`, BACKSTORY_IDENTITY_PATH: '.backstory-marker', BACKSTORY_COOKIE_MODE: 'localhost', BACKSTORY_ALLOWED_HOSTS: 'localhost,127.0.0.1', BACKSTORY_MERMAID_PARENT_ORIGIN: browserOrigin, BACKSTORY_BROWSER_REQUEST_RECEIPTS: `${runtime}/request-receipts.jsonl` };
  const python = fileURLToPath(new URL('../../../.venv/bin/python', import.meta.url));
  for (const args of [['manage.py', 'migrate', '--noinput'], ['manage.py', 'collectstatic', '--noinput'], ['-c', 'import django; django.setup(); from django.contrib.auth import get_user_model; u, created = get_user_model().objects.get_or_create(username="slice"); (u.set_password("synthetic-slice-browser-only"), u.save()) if created else None']]) {
    const result = spawnSync(python, args, { env, stdio: 'inherit' });
    if (result.status !== 0) process.exit(result.status || 1);
  }
  const start = () => spawn(python, ['tests/browser/support/runserver.py', new URL(browserOrigin).host, '--noreload', '--nostatic'], { env, stdio: 'inherit' });
  let server = start();
  writeFileSync(`${runtime}/server.pid`, String(process.pid));
  let restarting = false;
  let restarts = 0;
  writeFileSync(`${runtime}/restart-count`, String(restarts));
  const watch = child => child.on('exit', code => { if (!restarting) process.exit(code || 0); });
  watch(server);
  process.on('SIGUSR2', () => {
    if (restarting) return;
    restarting = true;
    server.once('exit', () => { server = start(); watch(server); restarting = false; writeFileSync(`${runtime}/restart-count`, String(++restarts)); });
    server.kill('SIGTERM');
  });
  process.on('SIGTERM', () => server.kill('SIGTERM'));
  process.on('SIGINT', () => server.kill('SIGINT'));

}
