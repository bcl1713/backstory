import {build} from 'esbuild';
import {readFile,writeFile,mkdir,readdir,unlink,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const versions={'vega':'6.4.0','vega-lite':'6.5.0','vega-interpreter':'2.3.2','vega-runtime':'7.1.3','d3-dsv':'3.0.1'};
for(const [name,version] of Object.entries(versions))if(JSON.parse(await readFile(`node_modules/${name}/package.json`)).version!==version)throw new Error('Vega version changed; re-audit required');
const runtime=resolve('node_modules/vega-runtime');
if(createHash('sha256').update(await readFile(`${runtime}/src/expression.js`)).digest('hex')!=='daab21ef6c80bd4e4b286fe96457eb407b6ff88d44c9159f3cb5ef27af6cac4c')throw new Error('Vega default expression backend changed');
// Use the official interpreter even for the runtime's default backend. This
// removes the unused Function-constructor fallback from the shipped worker.
const interpreterOnly={name:'interpreter-only',setup(build){
 build.onResolve({filter:/^d3-dsv$/},()=>({path:'inline-records-only',namespace:'denied-dsv'}));
 build.onLoad({filter:/.*/,namespace:'denied-dsv'},()=>({contents:"export function dsvFormat(){throw new Error('unsupported_chart_data_format');}",loader:'js'}));
 build.onResolve({filter:/^vega-runtime$/},()=>({path:`${runtime}/index.js`}));
 build.onLoad({filter:/vega-runtime\/src\/expression\.js$/},args=>{
  if(args.path!==`${runtime}/src/expression.js`)throw new Error('unexpected expression backend');
  return{contents:"export {expressionInterpreter as default} from 'vega-interpreter';",loader:'js',resolveDir:runtime};
 });
}};
const options={bundle:true,format:'iife',platform:'browser',target:'es2022',minify:true,metafile:true,write:false,legalComments:'eof',logOverride:{'direct-eval':'error'}};
const worker=await build({...options,entryPoints:['static/src/vega-lite-worker.js'],plugins:[interpreterOnly]});
if(worker.outputFiles.length!==1||Object.values(worker.metafile.outputs).some(o=>o.imports.length))throw new Error('Vega worker asset edge');
const text=worker.outputFiles[0].text;
if(/\bimportScripts\s*\(|\bimport\s*\(|\bFunction\s*\(|\bWebAssembly\b/.test(text))throw new Error('Vega worker runtime eval/WASM/loader');
const result=await build({...options,entryPoints:['static/src/vega-lite-frame.js'],outdir:'static/renderers',entryNames:'vega-lite-frame-[hash]',plugins:[{name:'owned-worker',setup(build){build.onResolve({filter:/^backstory:vega-lite-worker$/},()=>({path:'worker',namespace:'owned'}));build.onLoad({filter:/.*/,namespace:'owned'},()=>({contents:`export default ${JSON.stringify(text)}`,loader:'js'}));}}]});
if(result.outputFiles.length!==1||Object.values(result.metafile.outputs).some(o=>o.imports.length))throw new Error('Vega frame asset edge');
await mkdir('static/renderers',{recursive:true});
for(const name of await readdir('static/renderers'))if(/^vega-lite-frame-[A-Z0-9]+\.js$/.test(name))await unlink(`static/renderers/${name}`);
const file=result.outputFiles[0];await writeFile(file.path,file.contents);
await writeFile('static/renderers/vega-lite-manifest.json',JSON.stringify({frame:file.path.split('/').pop(),sha256:createHash('sha256').update(file.contents).digest('hex'),versions,outputs:1,imports:[],expressionBackend:'official-interpreter-only'},null,2)+'\n');
const roots=new Set();
for(const input of Object.keys(worker.metafile.inputs)){
 const marker=input.lastIndexOf('node_modules/');if(marker<0)continue;
 const start=marker+13,parts=input.slice(start).split('/'),count=parts[0].startsWith('@')?2:1;
 roots.add(input.slice(0,start)+parts.slice(0,count).join('/'));
}
await mkdir('static/licenses/vega-lite',{recursive:true});const notices=[];
for(const root of [...roots].sort()){
 const metadata=JSON.parse(await readFile(`${root}/package.json`));
 const names=(await readdir(root)).filter(name=>/^licen[cs]e(?:[.-]|$)/i.test(name));
 if(!names.length)throw new Error(`missing bundled license: ${metadata.name}`);
 for(const source of names){const name=`${metadata.name.replace(/[^A-Za-z0-9_.-]/g,'_')}-${metadata.version}-${source}`;await copyFile(`${root}/${source}`,`static/licenses/vega-lite/${name}`);notices.push(name);}
}
await writeFile('static/licenses/vega-lite/NOTICE.txt',`Pinned Vega-Lite worker dependency licenses. Default runtime expression backend is replaced at build time with the official interpreter; see scripts/build-vega-lite-frame.mjs.\n${notices.join('\n')}\n`);
