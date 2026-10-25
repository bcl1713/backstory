import { build } from 'esbuild';
await build({
  entryPoints: ['static/src/app.css', 'static/src/editor.js'],
  outdir: 'static',
  bundle: true,
  minify: true,
  logLevel: 'info',
});
