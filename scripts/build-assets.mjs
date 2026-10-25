import { build } from 'esbuild';
await build({
  entryPoints: ['static/src/app.css', 'static/src/editor.js', 'static/src/shell.js'],
  outdir: 'static',
  bundle: true,
  minify: true,
  logLevel: 'info',
});
