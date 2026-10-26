import { build } from 'esbuild';
import { mkdir, copyFile } from 'node:fs/promises';
await build({
  entryPoints: ['static/src/app.css', 'static/src/editor.js', 'static/src/shell.js'],
  outdir: 'static',
  bundle: true,
  loader: { '.woff2': 'file' },
  assetNames: 'fonts/[name]-[hash]',
  minify: true,
  logLevel: 'info',
});

await mkdir('static/fonts', { recursive: true });
await copyFile('assets/fonts/OFL.txt', 'static/fonts/OFL.txt');
