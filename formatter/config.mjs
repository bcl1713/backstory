// Resolve only the caller-approved, immutable data snapshot. Never read the wiki.
import path from 'node:path';
import { parseTree, getNodeValue } from 'jsonc-parser';
import { parseDocument } from 'yaml';
import { minimatch } from 'minimatch';
import ignore from 'ignore';

export const LIMITS = Object.freeze({source: 2 * 1024 * 1024, input: 5 * 1024 * 1024, output: 8 * 1024 * 1024, config: 64 * 1024, files: 32, depth: 8, diagnostics: 200});
const prettierNames = ['.prettierrc', '.prettierrc.json', '.prettierrc.jsonc', '.prettierrc.yaml', '.prettierrc.yml'];
const lintNames = ['.markdownlint.json', '.markdownlint.jsonc', '.markdownlint.yaml', '.markdownlint.yml'];
const cliNames = ['.markdownlint-cli2.jsonc', '.markdownlint-cli2.yaml', '.markdownlint-cli2.yml'];
const inertNames = new Set(['.prettierignore', '.markdownlintignore', '.gitignore', '.editorconfig']);
const forbiddenKeys = new Set(['__proto__', 'prototype', 'constructor']);
const p = path.posix;

export class ConfigError extends Error {
  constructor(message) { super(message); this.code = 'format-config'; }
}
const fail = message => { throw new ConfigError(message); };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const has = (obj, key) => Object.hasOwn(obj, key);
export function relativePath(value) {
  if (typeof value !== 'string' || !value || value.length > 1024 || value.includes('\\') || value.includes('\0') || /[\r\n]/.test(value) || p.isAbsolute(value) || p.normalize(value) !== value || value.split('/').some(s => s === '..' || s === '.')) fail('Expected a normalized wiki-relative path.');
  return value;
}
function treeCheck(value, seen = new Set(), depth = 0, count = {n: 0}) {
  if (depth > 32 || ++count.n > 10000) fail('Configuration data exceeds nesting or node limits.');
  if (value === null || ['string', 'boolean'].includes(typeof value)) return;
  if (typeof value === 'number' && Number.isFinite(value)) return;
  if (typeof value !== 'object' || seen.has(value)) fail('Configuration aliases must not form cycles.');
  seen.add(value);
  for (const [key, child] of Object.entries(value)) {
    if (forbiddenKeys.has(key)) fail('Configuration contains an unsafe object key.');
    treeCheck(child, seen, depth + 1, count);
  }
  seen.delete(value);
}
function parseData(file, text) {
  let value;
  if (/\.jsonc?$/.test(file) || text.trimStart().startsWith('{') || text.trimStart().startsWith('[')) {
    const errors = [];
    const root = parseTree(text, errors, {allowTrailingComma: true, disallowComments: false});
    if (errors.length || !root) fail(`Invalid JSON/JSONC data in ${file}.`);
    function duplicates(node) {
      if (node.type === 'object') {
        const keys = new Set();
        for (const child of node.children || []) {
          const key = child.children[0].value;
          if (keys.has(key)) fail(`Duplicate configuration key in ${file}.`);
          keys.add(key);
        }
      }
      for (const child of node.children || []) duplicates(child);
    }
    duplicates(root);
    value = getNodeValue(root);
  } else {
    const doc = parseDocument(text, {schema: 'core', uniqueKeys: true, maxAliasCount: 50});
    if (doc.errors.length || doc.warnings.length) fail(`Invalid or unsupported YAML data in ${file}.`);
    try { value = doc.toJS({maxAliasCount: 50}); } catch { fail(`YAML aliases exceed limits in ${file}.`); }
  }
  treeCheck(value);
  if (!object(value)) fail(`Configuration ${file} must contain a data object; package references are unsupported.`);
  // markdownlint uses instanceof Object for nested rule options. Normalize the
  // JSONC parser's null-prototype objects only after rejecting dangerous keys.
  return JSON.parse(JSON.stringify(value));
}
function glob(pattern, relative) {
  if (typeof pattern !== 'string' || pattern.length > 1024 || pattern.includes('\0') || pattern.includes('\\') || pattern.startsWith('/') || pattern.split('/').includes('..')) fail('Configuration glob must be a bounded relative pattern.');
  return minimatch(relative, pattern, {dot: true, matchBase: !pattern.includes('/'), nonegate: true});
}
const list = (value, label) => {
  const result = typeof value === 'string' ? [value] : value;
  if (!Array.isArray(result) || result.length > 200 || result.some(v => typeof v !== 'string')) fail(`${label} must be a string or bounded string array.`);
  return result;
};
function prettierOptions(value) {
  const options = {};
  const enums = {proseWrap:['always','never','preserve'],endOfLine:['lf','crlf','cr','auto'],trailingComma:['all','es5','none'],quoteProps:['as-needed','consistent','preserve'],arrowParens:['always','avoid'],htmlWhitespaceSensitivity:['css','strict','ignore'],embeddedLanguageFormatting:['auto','off'],objectWrap:['preserve','collapse'],experimentalOperatorPosition:['start','end']};
  const bools = new Set(['useTabs','singleQuote','bracketSpacing','semi','bracketSameLine','singleAttributePerLine','jsxSingleQuote','experimentalTernaries']);
  for (const [key, val] of Object.entries(value)) {
    if (key === '$schema') { if (typeof val !== 'string') fail('Invalid schema annotation.'); continue; }
    if (['extends','overrides'].includes(key)) continue;
    if (key === 'printWidth' || key === 'tabWidth') {
      if (!Number.isInteger(val) || val < 1 || val > (key === 'printWidth' ? 1000 : 16)) fail(`Invalid Prettier ${key}.`);
    } else if (enums[key]) {
      if (!enums[key].includes(val)) fail(`Invalid Prettier ${key}.`);
    } else if (bools.has(key)) {
      if (typeof val !== 'boolean') fail(`Invalid Prettier ${key}.`);
    } else fail(`Unsupported Prettier option ${key}; modules and parser overrides are prohibited.`);
    options[key] = val;
  }
  return options;
}
function rules(value) {
  if (!object(value)) fail('markdownlint config must be an object.');
  for (const [key,val] of Object.entries(value)) {
    if (key === '$schema') continue;
    if (!/^(default|MD\d{3}|[a-z][a-z0-9-]*)$/.test(key) || ['extends','plugins','customRules','modulePaths','markdownItPlugins'].includes(key)) fail(`Unsupported markdownlint rule key ${key}.`);
    if (typeof val !== 'boolean' && !object(val)) fail(`Invalid markdownlint rule setting ${key}.`);
  }
  const {$schema, ...result} = value;
  return result;
}
function ancestry(note) {
  const dirs = [''];
  let current = '';
  for (const segment of p.dirname(note).split('/')) {
    if (segment === '.') continue;
    current = current ? `${current}/${segment}` : segment;
    dirs.push(current);
  }
  return dirs;
}
function parseEditor(text, noteRelative, base, inherited) {
  let section = true;
  const result = {...inherited};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || line.startsWith(';')) continue;
    if (line.startsWith('[') && line.endsWith(']')) { section = glob(line.slice(1,-1).replace(/^\//,''), noteRelative); continue; }
    const match = line.match(/^([^=:]+)\s*[=:]\s*(.*?)\s*$/);
    if (!match) fail(`Invalid EditorConfig data in ${base}.`);
    const key = match[1].trim().toLowerCase(); const val = match[2].toLowerCase();
    if (key === 'root' || !section) continue;
    if (!['end_of_line','indent_style','indent_size','tab_width','max_line_length'].includes(key)) continue;
    if (val === 'unset') { delete result[key]; continue; }
    let value;
    if (key === 'end_of_line') {
      if (!['lf','crlf','cr'].includes(val)) fail('Invalid EditorConfig end_of_line.');
      value = val;
    } else if (key === 'indent_style') {
      if (!['space','tab'].includes(val)) fail('Invalid EditorConfig indent_style.');
      value = val === 'tab';
    } else if (['indent_size','tab_width','max_line_length'].includes(key)) {
      if (['off','tab'].includes(val)) continue;
      const n = Number(val);
      if (!Number.isInteger(n) || n < 1 || n > 1000) fail(`Invalid EditorConfig ${key}.`);
      value = n;
    }
    // Keep properties distinct until inheritance/unset is resolved. Preserve
    // assignment order when properties map to the same Prettier option.
    delete result[key]; result[key] = value;
  }
  return result;
}
function editorOptions(properties) {
  const names = {end_of_line:'endOfLine',indent_style:'useTabs',indent_size:'tabWidth',tab_width:'tabWidth',max_line_length:'printWidth'};
  const result = {};
  for (const [key,value] of Object.entries(properties)) result[names[key]] = value;
  return result;
}
export function resolveConfiguration(note, files) {
  relativePath(note);
  if (!object(files) || Object.keys(files).length > LIMITS.files) fail('Configuration snapshot exceeds file limit.');
  for (const [file,text] of Object.entries(files)) {
    relativePath(file);
    if (typeof text !== 'string' || Buffer.byteLength(text) > LIMITS.config) fail('Configuration file exceeds UTF-8 size limit.');
    if (/\.(?:[cm]?[jt]s|mts|cts)$/.test(file) || p.basename(file) === 'package.json') fail(`Executable/module configuration is prohibited: ${file}.`);
  }
  const dirs = ancestry(note);
  const known = new Set();
  const cache = new Map();
  function read(file, chain = []) {
    if (chain.length >= LIMITS.depth || chain.includes(file)) fail('Configuration references contain a cycle or exceed depth 8.');
    if (!has(files,file)) fail(`Referenced configuration is absent from approved snapshot: ${file}.`);
    known.add(file);
    if (cache.has(file)) return cache.get(file);
    let value = parseData(file, files[file]);
    let inherited = {};
    if (has(value,'extends')) {
      for (const ref of list(value.extends, 'extends')) {
        const resolved = reference(file,ref);
        inherited = {...inherited, ...read(resolved,[...chain,file])};
      }
    }
    value = {...inherited,...value}; delete value.extends;
    cache.set(file,value); return value;
  }
  function reference(file, ref) {
    if (typeof ref !== 'string' || !/^(\.\/|\.\.\/)/.test(ref) || /[\\\0:#?]/.test(ref)) fail('Configuration references must be explicit relative data paths.');
    const target = p.normalize(p.join(p.dirname(file),ref));
    relativePath(target);
    if (target.startsWith('../') || target.split('/').some(s => /^(?:\.git|\.env.*|node_modules|credentials?|secrets?)$/i.test(s)) || !(/\.(jsonc?|ya?ml)$/.test(target) || p.basename(target) === '.prettierrc')) fail('Configuration reference is outside the approved data subset.');
    return target;
  }
  const matches = (names, dir) => names.map(n => p.join(dir,n)).filter(f => has(files,f));
  let prettierFile;
  let editor = {};
  let lintConfig = {};
  let lintPresent = false;
  let lint = {};
  let lintSkipped = false;
  const toolIgnores = {prettier: [],lint: []};
  // Match the packaged CLI's cwd/root .gitignore default without consulting
  // host or live-wiki files. Lint's gitignore switch remains independent.
  if (has(files,'.gitignore')) toolIgnores.prettier.push({dir:'',text:files['.gitignore']});
  const gitIgnores = [];
  const overrideEntries = [];
  const ignorePatterns = [];
  for (const dir of dirs) {
    const relative = dir ? note.slice(dir.length+1) : note;
    for (const n of inertNames) { const f = p.join(dir,n); if (has(files,f)) known.add(f); }
    const ec = p.join(dir,'.editorconfig');
    if (has(files,ec)) {
      if (/^\s*root\s*[=:]\s*true\s*$/im.test(files[ec])) editor = {};
      editor = parseEditor(files[ec],relative,ec,editor);
    }
    for (const [name,tool] of [['.prettierignore','prettier'],['.markdownlintignore','lint']]) {
      const file = p.join(dir,name);
      if (has(files,file)) toolIgnores[tool].push({dir,text:files[file]});
    }
    const gitFile = p.join(dir,'.gitignore');
    if (has(files,gitFile)) gitIgnores.push({file:gitFile,dir,text:files[gitFile]});
    const ps = matches(prettierNames,dir); ps.forEach(f=>known.add(f)); if (ps.length) prettierFile = ps[0];
    const ls = matches(lintNames,dir); ls.forEach(f=>known.add(f));
    if (ls.length) { lintConfig = rules(read(ls[0])); lintPresent = true; }
    const cs = matches(cliNames,dir); cs.forEach(f=>known.add(f));
    if (cs.length) {
      const config = read(cs[0]); lintPresent = true;
      const allowed = new Set(['$schema','config','configFile','fix','gitignore','globs','ignores','noInlineConfig','noBanner','noProgress','showFound','overrides']);
      for (const key of Object.keys(config)) if (!allowed.has(key)) fail(`Unsupported markdownlint-cli2 directive ${key}; executable directives are prohibited.`);
      for (const key of ['fix','noInlineConfig','noBanner','noProgress','showFound']) if (has(config,key) && typeof config[key] !== 'boolean') fail(`Invalid markdownlint-cli2 ${key}.`);
      if (has(config,'configFile')) lintConfig = {...lintConfig,...rules(read(reference(cs[0],config.configFile)))};
      if (has(config,'config')) lintConfig = {...lintConfig,...rules(config.config)};
      if (has(config,'gitignore')) {
        if (typeof config.gitignore !== 'boolean' && typeof config.gitignore !== 'string') fail('Invalid markdownlint gitignore directive.');
        if (typeof config.gitignore === 'string') glob(config.gitignore,relative);
        lint.gitignore = config.gitignore;
        lint.gitignoreDirectory = dir;
      }
      if (has(config,'noInlineConfig')) lint.noInlineConfig = config.noInlineConfig;
      if (has(config,'globs')) for (const pattern of list(config.globs,'globs')) glob(pattern,relative); // Validate; never enumerate.
      if (has(config,'ignores')) ignorePatterns.push(...list(config.ignores,'ignores').map(pattern=>({dir,pattern})));
      if (has(config,'overrides')) {
        if (!Array.isArray(config.overrides) || config.overrides.length > 200) fail('Invalid markdownlint overrides.');
        for (const override of config.overrides) {
          if (!object(override) || Object.keys(override).some(k=>!['filter','combine','config'].includes(k)) || !['merge','replace'].includes(override.combine)) fail('Unsupported markdownlint override.');
          const patterns = list(override.filter,'override filter'); patterns.forEach(pattern=>glob(pattern,relative));
          const cfg = rules(override.config);
          overrideEntries.push({dir,patterns,combine:override.combine,config:cfg});
        }
      }
    }
  }
  let prettier = prettierFile ? read(prettierFile) : {printWidth:80,proseWrap:'always',endOfLine:'auto'};
  const editorSettings = editorOptions(editor);
  let options = prettierFile ? {...editorSettings,...prettierOptions(prettier)} : {...prettierOptions(prettier),...editorSettings};
  if (has(prettier,'overrides')) {
    if (!Array.isArray(prettier.overrides) || prettier.overrides.length > 200) fail('Invalid Prettier overrides.');
    const base = prettierFile ? p.dirname(prettierFile) : '.';
    const relative = p.relative(base,note);
    for (const override of prettier.overrides) {
      if (!object(override) || Object.keys(override).some(k=>!['files','excludeFiles','options'].includes(k)) || !object(override.options)) fail('Unsupported Prettier override.');
      const opts = prettierOptions(override.options);
      if (has(override.options,'extends') || has(override.options,'overrides')) fail('Nested Prettier executable/reference directives are unsupported.');
      const included = list(override.files,'override files').some(pattern=>glob(pattern,relative));
      const excluded = has(override,'excludeFiles') && list(override.excludeFiles,'override excludeFiles').some(pattern=>glob(pattern,relative));
      if (included && !excluded) options = {...options,...opts};
    }
  }
  if (!lintPresent) lintConfig = {MD013:false};
  for (const entry of overrideEntries) {
    const relative = entry.dir ? note.slice(entry.dir.length+1) : note;
    let included = false;
    for (const pattern of entry.patterns) {
      const negative = pattern.startsWith('!');
      if (glob(negative ? pattern.slice(1) : pattern,relative)) included = !negative;
    }
    if (included) lintConfig = entry.combine === 'replace' ? entry.config : {...lintConfig,...entry.config};
  }
  const ignoredBy = entries => {
    let ignored = false;
    for (const entry of entries) {
      const relative = entry.dir ? note.slice(entry.dir.length+1) : note;
      const result = ignore().add(entry.text).test(relative);
      if (result.ignored) ignored = true;
      if (result.unignored) ignored = false;
    }
    return ignored;
  };
  const prettierSkipped = ignoredBy(toolIgnores.prettier);
  lintSkipped = ignoredBy(toolIgnores.lint);
  for (const entry of ignorePatterns) {
    const negative = entry.pattern.startsWith('!');
    const relative = entry.dir ? note.slice(entry.dir.length+1) : note;
    if (glob(negative ? entry.pattern.slice(1) : entry.pattern,relative)) lintSkipped = !negative;
  }
  if (lint.gitignore) {
    const selected = lint.gitignore === true ? gitIgnores : gitIgnores.filter(e=>{
      const relative = lint.gitignoreDirectory ? p.relative(lint.gitignoreDirectory,e.file) : e.file;
      return minimatch(relative,lint.gitignore,{dot:true,nonegate:true});
    });
    lintSkipped ||= ignoredBy(selected);
  }
  for (const file of Object.keys(files)) if (!known.has(file)) fail(`Unapproved or unsupported snapshot configuration: ${file}.`);
  // Native CLI receives neither file references nor discovery/ignore/glob directives.
  return {prettier:options,lint:{config:lintConfig,noInlineConfig:lint.noInlineConfig ?? false},prettierSkipped,lintSkipped};
}
