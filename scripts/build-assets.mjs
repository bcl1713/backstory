import { build } from 'esbuild';
import { mkdir, copyFile } from 'node:fs/promises';
await build({
  entryPoints: ['static/src/app.css', 'static/src/editor.js', 'static/src/editor-startup.js', 'static/src/shell.js', 'static/src/connectivity.js', 'static/src/wiki-tools.js'],
  outdir: 'static',
  bundle: true,
  loader: { '.woff2': 'file' },
  assetNames: 'fonts/[name]-[hash]',
  minify: true,
  logLevel: 'info',
});

await mkdir('static/fonts', { recursive: true });
await copyFile('assets/fonts/OFL.txt', 'static/fonts/OFL.txt');
await mkdir('static/licenses', { recursive: true });
// The adapter and core share this MIT license and copyright notice.
await copyFile('node_modules/@replit/codemirror-vim/LICENSE', 'static/licenses/codemirror-vim.txt');
await copyFile('node_modules/@codemirror/autocomplete/LICENSE', 'static/licenses/codemirror-autocomplete.txt');
