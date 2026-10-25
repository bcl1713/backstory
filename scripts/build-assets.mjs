import { build } from 'esbuild';
await build({
  entryPoints: ['assets/app.css'],
  outdir: 'static',
  bundle: true,
  minify: true,
  logLevel: 'info',
});
