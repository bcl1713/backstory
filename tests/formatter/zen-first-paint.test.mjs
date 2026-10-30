import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transform } from 'esbuild';

test('render-blocking CSS declares the closed note layout before shell initialization', async () => {
  const source = await readFile(new URL('../../static/src/app.css', import.meta.url), 'utf8');
  const { code, warnings } = await transform(source, { loader: 'css', minify: true });
  assert.equal(warnings.length, 0);
  // Independent of .zen-enabled, which arrives only after the deferred bundle.
  // Restrict it to scripting-enabled clients so no-JS browsing stays usable.
  assert.ok(code.includes('@media(scripting:enabled){.note-page:not(.chrome-open) .zen-chrome{display:none}.note-page:not(.chrome-open) .app-layout{grid-template-columns:minmax(0,1fr)}}'));
});

test('note markup keeps a native navigation route if enhancement fails', async () => {
  const template = await readFile(new URL('../../wiki/templates/wiki/note.html', import.meta.url), 'utf8');
  assert.match(template, /<a\b[^>]*data-navigation-fallback[^>]*href="\/\?folder="[^>]*>Menu<\/a>/);
});
