// Pinned, fail-closed loader pruning. See docs/mermaid-frame.md.
import {build} from 'esbuild';
import {readFile,mkdir,writeFile,readdir,unlink,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,relative} from 'node:path';
const root=resolve('node_modules/mermaid');
const hash=value=>createHash('sha256').update(value).digest('hex');
const pkg=JSON.parse(await readFile(`${root}/package.json`));
if(pkg.version!=='12.2.0')throw new Error('renderer dependency version changed; re-audit required');
const pinned=new Map([
 ['dist/mermaid.core.mjs',['4d085c790146a42c65d51ea21170427b24bc706de970df570331321996cbdbaf',37]],
 ['dist/chunks/mermaid.core/chunk-EJLWFMJV.mjs',['ba28f6cba12da3c5e421ec60762b44f02fa85ffdf855a3f5d9ad2dfcd32cb1b6',4]],
 ['dist/chunks/mermaid.core/chunk-DSNLSHJZ.mjs',['d5097d3469d77fe5b3e9f2623a1bb943d7b55279a88af5c254feb28c198a1123',1]],
 ['dist/chunks/mermaid.core/chunk-ZCHMQSOR.mjs',['4a00228f5838a57792463beeb82a78eee48786a9d81da972541f0f3119b3fff0',1]],
]);
for(const [file,[digest,count]]of pinned){const code=await readFile(`${root}/${file}`,'utf8');if(hash(code)!==digest||[...code.matchAll(/\bimport\("[^"]+"\)/g)].length!==count)throw new Error('renderer pinned loader source changed');}
let allowed=0, denied=0;
const plugin={name:'bounded-mermaid-loaders',setup(build){build.onLoad({filter:/\.mjs$/},async args=>{
 if(!args.path.startsWith(`${root}/`))return;
 let code=await readFile(args.path,'utf8');
 if(!/\bimport\s*\(/.test(code))return;
 const entry=pinned.get(relative(root,args.path));if(!entry||hash(code)!==entry[0])throw new Error('unreviewed renderer dynamic loader');
 code=code.replace(/\bimport\("([^"]+)"\)/g,(original,path)=>{
   if(path==='./chunks/mermaid.core/flowDiagram-IUGLLWBU.mjs'||path==='./dagre-NK4GIZVX.mjs'){allowed++;return original;}
   denied++;return 'Promise.reject(new Error("unsupported_renderer_feature"))';
 });
 return{contents:code,loader:'js'};
});}};
const result=await build({entryPoints:['static/src/mermaid-frame.js'],outdir:'static/renderers',entryNames:'mermaid-frame-[hash]',bundle:true,format:'iife',platform:'browser',target:'es2022',splitting:false,minify:true,metafile:true,write:false,plugins:[plugin],legalComments:'eof',logLevel:'info'});
if(result.outputFiles.length!==1||allowed!==3)throw new Error('unexpected renderer asset graph');
const outputs=Object.values(result.metafile.outputs);
if(outputs.length!==1||outputs.some(o=>o.imports.length))throw new Error('external renderer import');
const file=result.outputFiles[0],code=file.text;
if(/\bimport\s*\(|\bimportScripts\s*\(|\bnew\s+(?:Shared)?Worker\s*\(|\bfetch\s*\(|\bWebAssembly\b/.test(code))throw new Error('runtime renderer asset edge');
await mkdir('static/renderers',{recursive:true});
for(const name of await readdir('static/renderers'))if(/^mermaid-frame-[A-Z0-9]+\.js$/.test(name))await unlink(`static/renderers/${name}`);
await writeFile(file.path,file.contents);
await writeFile('static/renderers/manifest.json',JSON.stringify({frame:file.path.split('/').pop(),sha256:hash(file.contents),mermaid:pkg.version,outputs:1,imports:[],allowedDynamicImports:allowed,rejectedDynamicImports:denied},null,2)+'\n');
await mkdir('static/licenses',{recursive:true});await copyFile(`${root}/LICENSE`,'static/licenses/mermaid.txt');
// Retain notices for the packages actually present in this bundle, not just the
// top-level library. Missing upstream license text is a deliberate build error.
const packageRoots=new Set();
for(const input of Object.keys(result.metafile.inputs)) {
 const marker=input.lastIndexOf('node_modules/');if(marker<0)continue;
 const start=marker+'node_modules/'.length,tail=input.slice(start).split('/');
 const count=tail[0].startsWith('@')?2:1;
 packageRoots.add(input.slice(0,start)+tail.slice(0,count).join('/'));
}
await mkdir('static/licenses/mermaid',{recursive:true});
const notices=[];
for(const packageRoot of [...packageRoots].sort()) {
 const metadata=JSON.parse(await readFile(`${packageRoot}/package.json`));
 const candidates=(await readdir(packageRoot)).filter(name=>/^licen[cs]e(?:[.-]|$)/i.test(name));
 if(!candidates.length)throw new Error(`missing bundled license: ${metadata.name}`);
 for(const source of candidates) {
  const name=`${metadata.name.replace(/[^A-Za-z0-9_.-]/g,'_')}-${metadata.version}-${source}`;
  await copyFile(`${packageRoot}/${source}`,`static/licenses/mermaid/${name}`);notices.push(name);
 }
}
await writeFile('static/licenses/mermaid/NOTICE.txt',`Bundled Mermaid frame dependency license texts (${pkg.version}); see accompanying files.\n${notices.join('\n')}\n`);
