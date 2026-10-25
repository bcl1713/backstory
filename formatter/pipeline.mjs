import fs from 'node:fs';
import { mkdtemp, mkdir, writeFile, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import * as prettier from 'prettier';
import { main as markdownlint } from 'markdownlint-cli2';
import { LIMITS, ConfigError, relativePath, resolveConfiguration } from './config.mjs';

export class FormatError extends Error {
  constructor(code,message,line,column) { super(message); Object.assign(this,{code,line,column}); }
}
export async function requireFixedPoint(source, pass) {
  const first = await pass(source);
  const second = await pass(first.source);
  if (first.source !== second.source) throw new FormatError('format-nonconvergent','Formatting did not reach an exact fixed point. Retain the source and review configuration.');
  return second;
}
function boundedSource(source) {
  if (Buffer.byteLength(source) > LIMITS.output) throw new FormatError('format-output-limit','Formatter output exceeded the 8 MiB limit.');
  return source;
}
function diagnostic(error) {
  return {code: error.code || 'format-failed', message: error instanceof ConfigError || error instanceof FormatError ? error.message : 'The packaged formatter could not process this source.', severity:'error', ...(Number.isInteger(error.line) ? {line:error.line}:{}), ...(Number.isInteger(error.column) ? {column:error.column}:{})};
}
function noteOnlyFS(file) {
  const denied = () => Object.assign(new Error('File is unavailable in formatter scratch.'),{code:'ENOENT'});
  const same = name => typeof name === 'string' && path.resolve(name) === file;
  // Native config lookup can observe nothing. The one literal staged note is the
  // only readable/writable file; no snapshot config is passed to native loaders.
  const promises = new Proxy(fs.promises, {get(target,key) {
    if (['readFile','writeFile','access','stat','lstat'].includes(key)) return async (name,...args) => {
      if (!same(name)) throw denied();
      return target[key](name,...args);
    };
    if (key === 'readdir') return async () => [];
    return async () => { throw denied(); };
  }});
  return new Proxy(fs,{get(target,key) {
    if (key === 'promises') return promises;
    if (key === 'readdir') return (_name,_options,callback) => (callback || _options)(null,[]);
    if (['readFile','writeFile','access','stat','lstat'].includes(key)) return (name,...args) => {
      if (same(name)) return target[key](name,...args);
      const callback = args.at(-1);
      if (typeof callback === 'function') queueMicrotask(()=>callback(denied()));
      else throw denied();
    };
    if (key === 'existsSync') return name => same(name) && target.existsSync(name);
    if (typeof key === 'string' && key.endsWith('Sync')) return (name,...args) => {
      if (!same(name)) throw denied();
      return target[key](name,...args);
    };
    return target[key];
  }});
}
export async function formatRequest(request, {scratchDirectory} = {}) {
  const original = typeof request?.source === 'string' ? request.source : '';
  let scratch;
  try {
    if (!request || typeof request !== 'object' || Array.isArray(request) || Object.keys(request).some(k=>!['path','source','files'].includes(k)) || typeof request.source !== 'string') throw new FormatError('format-input','Expected path, UTF-8 source and approved configuration snapshot.');
    relativePath(request.path);
    if (!/\.md$/i.test(request.path) || Buffer.byteLength(original) > LIMITS.source) throw new FormatError('format-input','Expected one Markdown note within the 2 MiB source limit.');
    const config = resolveConfiguration(request.path,request.files ?? {});
    const skipped = [];
    if (config.prettierSkipped) skipped.push({code:'prettier-skipped',message:'Prettier skipped this note according to its approved ignore rules.',severity:'info'});
    if (config.lintSkipped) skipped.push({code:'markdownlint-skipped',message:'markdownlint skipped this note according to its approved ignore rules.',severity:'info'});
    if (config.prettierSkipped && config.lintSkipped) return {source:original,diagnostics:skipped,outcome:'skipped'};
    scratch = scratchDirectory || await mkdtemp(path.join(tmpdir(),'backstory-formatter-'));
    const staged = path.join(scratch,request.path);
    await mkdir(path.dirname(staged),{recursive:true,mode:0o700});
    const adapter = noteOnlyFS(staged);
    const bom = original.startsWith('\ufeff');
    async function prettierPass(source) {
      if (config.prettierSkipped) return source;
      try { return boundedSource(await prettier.format(source,{...config.prettier,filepath:staged,parser:'markdown'})); }
      catch (error) {
        if (error instanceof FormatError) throw error;
        throw new FormatError('format-parse','Prettier could not parse the submitted Markdown.',error.loc?.start?.line,error.loc?.start?.column);
      }
    }
    async function lintPass(fix) {
      const diagnostics = [];
      let logFailed = false;
      const capture = ({results}) => {
        for (const result of results) {
          if (diagnostics.length >= LIMITS.diagnostics - skipped.length) break;
          diagnostics.push({code:result.ruleNames?.[0] || 'markdownlint',message:result.ruleDescription || 'Markdown rule violation.',line:result.lineNumber,column:result.errorRange?.[0] || 1,severity:'warning'});
        }
      };
      const code = await markdownlint({
        directory:scratch,argv:[`:${request.path}`],noGlobs:true,noImport:true,fs:adapter,
        optionsOverride:{...config.lint,fix,noBanner:true,noProgress:true,showFound:false,gitignore:false,globs:[],ignores:[],outputFormatters:[[capture]]},
        logMessage:()=>{},logError:()=>{ logFailed=true; },
      });
      if (logFailed || code > 1) throw new FormatError('format-lint','markdownlint could not safely process the staged note.');
      return diagnostics;
    }
    const result = await requireFixedPoint(original, async source => {
      let formatted = await prettierPass(source);
      await writeFile(staged,formatted,{encoding:'utf8',mode:0o600});
      if (!config.lintSkipped) {
        await lintPass(true);
        if ((await stat(staged)).size > LIMITS.output) throw new FormatError('format-output-limit','Formatter output exceeded the 8 MiB limit.');
        formatted = boundedSource(await readFile(staged,'utf8'));
      }
      formatted = await prettierPass(formatted);
      // Preserve existing BOM even when a tool strips it.
      formatted = (bom ? '\ufeff' : '') + formatted.replace(/^\ufeff/,'');
      await writeFile(staged,formatted,'utf8');
      const diagnostics = config.lintSkipped ? [] : await lintPass(false);
      return {source:formatted,diagnostics:[...skipped,...diagnostics]};
    });
    return {...result,outcome:'ok'};
  } catch (error) {
    return {source:original,diagnostics:[diagnostic(error)],outcome:'failed'};
  } finally {
    if (scratch && !scratchDirectory) await rm(scratch,{recursive:true,force:true});
  }
}
