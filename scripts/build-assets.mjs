import { build } from 'esbuild';
import { mkdir, copyFile } from 'node:fs/promises';
await build({
  entryPoints: ['static/src/app.css', 'static/src/editor.js', 'static/src/editor-startup.js', 'static/src/shell.js', 'static/src/connectivity.js', 'static/src/wiki-tools.js', 'static/src/math-preview-page.js', 'static/src/diagram-preview-page.js'],
  outdir: 'static',
  bundle: true,
  external: ['/static/math-renderer.js'],
  loader: { '.woff2': 'file' },
  assetNames: 'fonts/[name]-[hash]',
  minify: true,
  logLevel: 'info',
});

// Separate ESM entry: the editor's IIFE import stays a real lazy local load.
await build({ entryPoints: ['static/src/math-renderer.js'], outdir: 'static', bundle: true, format: 'esm', minify: true, logLevel: 'info' });

await mkdir('static/fonts', { recursive: true });
await copyFile('assets/fonts/OFL.txt', 'static/fonts/OFL.txt');
await mkdir('static/licenses', { recursive: true });
// The adapter and core share this MIT license and copyright notice.
await copyFile('node_modules/@replit/codemirror-vim/LICENSE', 'static/licenses/codemirror-vim.txt');
await copyFile('node_modules/@codemirror/autocomplete/LICENSE', 'static/licenses/codemirror-autocomplete.txt');

await copyFile('node_modules/katex/LICENSE', 'static/licenses/katex.txt');
await copyFile('node_modules/@lezer/markdown/LICENSE', 'static/licenses/lezer-markdown.txt');
// Separate public classic bundle; source only crosses the private frame port.
await import('./build-mermaid-frame.mjs');
await import('./build-graphviz-frame.mjs');
