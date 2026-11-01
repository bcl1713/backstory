import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {mkdtempSync,writeFileSync,readFileSync,readdirSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

function helper(source, files = {}, notePath = 'notes/example.md', options = {}) {
  const child = spawnSync(process.execPath, [fileURLToPath(new URL('../../formatter/main.mjs',import.meta.url))], {
    input: JSON.stringify({path:notePath, source, files}), encoding: 'utf8', timeout: 12000,
    maxBuffer: 8 * 1024 * 1024, cwd: new URL('../..', import.meta.url),
    ...options,
  });
  assert.ifError(child.error);
  assert.equal(child.status, 0, child.stderr);
  return JSON.parse(child.stdout);
}

test('real packaged pipeline formats one note and reaches an exact fixed point', () => {
  const first = helper('# Title\n\n* one\n* two');
  assert.equal(first.outcome, 'ok');
  assert.equal(first.source, '# Title\n\n- one\n- two\n');
  assert.equal(helper(first.source).source, first.source);
});

test('existing configs replace absent defaults and retain lint warnings', () => {
  const source = '# Title\n\n' + 'long '.repeat(30) + '\n';
  const result = helper(source, {'.prettierrc': '{}', '.markdownlint-cli2.jsonc': '{"config":{"MD013":{"line_length":20}}}'});
  assert.equal(result.outcome, 'ok');
  assert.ok(result.diagnostics.some(d => d.code === 'MD013' && d.severity === 'warning'));
  assert.ok(result.source.includes('long '.repeat(25)));
});

test('tool ignores apply independently', () => {
  const prettierIgnored = helper('# Title\n\n* one', {'.prettierignore': 'notes/\n'});
  assert.equal(prettierIgnored.outcome, 'ok');
  assert.ok(prettierIgnored.diagnostics.some(d => d.code === 'prettier-skipped'));
  const lintIgnored = helper('# Title\n\n* one', {'.markdownlint-cli2.jsonc': '{"ignores":["notes/**"]}'});
  assert.equal(lintIgnored.source, '# Title\n\n- one\n');
  assert.ok(lintIgnored.diagnostics.some(d => d.code === 'markdownlint-skipped'));
  const both = helper('# Title\n\n* one', {'.prettierignore': 'notes/\n', '.markdownlint-cli2.jsonc': '{"ignores":["notes/**"]}'});
  assert.equal(both.outcome, 'skipped');
  assert.equal(both.source, '# Title\n\n* one');
});

test('nested data references and overrides respect original path', () => {
  const result = helper('# Title\n\n' + 'word '.repeat(20), {
    '.prettierrc': '{"extends":"./config/base.json","overrides":[{"files":"notes/*.md","options":{"printWidth":30,"proseWrap":"always"}}]}',
    'config/base.json': '{"printWidth":100,"proseWrap":"preserve"}',
    'notes/.markdownlint.json': '{"default":false}',
  });
  assert.equal(result.outcome, 'ok');
  assert.ok(result.source.split('\n').slice(2).every(line => line.length <= 30));
});

test('EditorConfig, approved gitignore, BOM and CRLF have explicit behavior', () => {
  const result = helper('\ufeff# Title\r\n\r\n* one', {'.editorconfig': 'root = true\n[*.md]\nend_of_line = crlf\nmax_line_length = 50\n'});
  assert.equal(result.outcome, 'ok');
  assert.ok(result.source.startsWith('\ufeff'));
  assert.ok(result.source.includes('\r\n'));
  assert.equal(helper(result.source, {'.editorconfig': 'root=true\n[*.md]\nend_of_line=crlf\n'}).source, result.source);
  const ignored = helper('# Title\n\n* one', {'.gitignore': 'notes/\n', '.markdownlint-cli2.jsonc': '{"gitignore":true}', '.prettierignore': 'notes/\n'});
  assert.equal(ignored.outcome, 'skipped');
});

test('root globs cannot select a second note or broaden literal input', () => {
  const result = helper('# Title\n\n* one', {'.markdownlint-cli2.jsonc':'{"globs":["**/*.md"],"config":{"default":false}}'});
  assert.equal(result.outcome, 'ok');
  assert.equal(result.source, '# Title\n\n- one\n');
});

test('unsafe config and malformed data return untouched source', () => {
  for (const files of [
    {'.prettierrc': '{"plugins":["evil"]}'},
    {'.prettierrc.js':'throw new Error("executed")'},
    {'.markdownlint-cli2.jsonc':'{"customRules":["evil"]}'},
    {'.markdownlint-cli2.jsonc':'{"outputFormatters":[["evil"]]}'},
    {'.prettierrc':'{"extends":"../../secret.json"}'},
    {'.prettierrc':'{"extends":"./base.json"}', 'base.json':'{"extends":"./.prettierrc"}'},
    {'.prettierrc':'unterminated: ['},
  ]) {
    const result = helper('* original', files);
    assert.equal(result.outcome, 'failed', JSON.stringify(files));
    assert.equal(result.source, '* original');
    assert.ok(result.diagnostics.some(d => d.severity === 'error'));
  }
});

test('an explicitly enabled rule remains enabled with default rules disabled', () => {
  const result = helper('# Synthetic\n\na synthetic paragraph that deliberately exceeds twenty columns\n', {
    '.prettierrc':'{"proseWrap":"preserve"}',
    '.markdownlint-cli2.jsonc':'{"config":{"default":false,"MD013":{"line_length":20}}}',
  });
  assert.equal(result.outcome,'ok');
  assert.ok(result.diagnostics.some(d=>d.code === 'MD013' && d.severity === 'warning'));
});

test('JSON helper bounds input and diagnostics and supports missing/mixed final newlines', () => {
  const result = helper('# Title\n\n' + 'a synthetic paragraph that exceeds twenty columns\n\n'.repeat(240), {
    '.prettierrc':'{"proseWrap":"preserve"}',
    '.markdownlint-cli2.jsonc':'{"config":{"default":false,"MD013":{"line_length":20}}}',
  });
  assert.equal(result.outcome,'ok');
  assert.equal(result.diagnostics.length,200);
  for (const source of ['# Title\n\n- item', '# Title\r\n\r\n- item\n']) {
    const first = helper(source);
    assert.equal(first.outcome,'ok');
    assert.equal(helper(first.source).source,first.source);
  }
  const oversized = helper('x'.repeat(2 * 1024 * 1024 + 1));
  assert.equal(oversized.outcome,'failed');
  assert.equal(oversized.source.length,2 * 1024 * 1024 + 1);
});

test('supported markdownlint-cli2 fixes run between the real Prettier passes', () => {
  const result = helper('# Title!\n',{
    '.markdownlint-cli2.jsonc':'{"config":{"default":false,"MD026":true}}',
  });
  assert.equal(result.outcome,'ok');
  assert.equal(result.source,'# Title\n');
});

test('fixed-point guard fails rather than accepting a changing second pipeline', async () => {
  const {requireFixedPoint} = await import('../../formatter/pipeline.mjs');
  await assert.rejects(requireFixedPoint('first', async source=>({source:source === 'first' ? 'second' : 'first',diagnostics:[]})), error=>error.code === 'format-nonconvergent');
});

test('arbitrary working directory and hostile parent configs cannot affect the one staged note', () => {
  const parent = mkdtempSync(path.join(tmpdir(),'backstory-parent-fixture-'));
  try {
    const sentinel = path.join(parent,'executed');
    const hostile = `import fs from 'node:fs'; fs.writeFileSync(${JSON.stringify(sentinel)},'executed'); export default {};`;
    writeFileSync(path.join(parent,'prettier.config.mjs'),hostile);
    writeFileSync(path.join(parent,'.markdownlint-cli2.mjs'),hostile);
    writeFileSync(path.join(parent,'other.md'),'# untouched synthetic   ');
    const result = helper('# Title!\n',{'.markdownlint-cli2.jsonc':'{"globs":["**/*.md"]}'},'nested/note.md',{cwd:parent,env:{...process.env,TMPDIR:parent}});
    assert.equal(result.outcome,'ok');
    assert.equal(result.source,'# Title\n');
    assert.equal(existsSync(sentinel),false);
    assert.equal(readFileSync(path.join(parent,'other.md'),'utf8'),'# untouched synthetic   ');
    assert.equal(readdirSync(parent).some(name=>name.startsWith('backstory-formatter-')),false);
  } finally { rmSync(parent,{recursive:true,force:true}); }
});

test('Prettier honors root gitignore while markdownlint gitignore stays independently configured', () => {
  const source = '# Title!\n\n* original';
  const lintActive = helper(source,{'.gitignore':'notes/\n'});
  assert.equal(lintActive.outcome,'ok');
  assert.ok(lintActive.diagnostics.some(d=>d.code === 'prettier-skipped'));
  assert.equal(lintActive.diagnostics.some(d=>d.code === 'markdownlint-skipped'),false);
  assert.ok(lintActive.source.startsWith('# Title\n'));
  const both = helper(source,{'.gitignore':'notes/\n','.markdownlint-cli2.jsonc':'{"gitignore":true}'});
  assert.equal(both.outcome,'skipped');
  assert.equal(both.source,source);
});

test('packaged formatter preserves explicit TeX delimiters and expressions at its fixed point', () => {
  const source = '# Math\n\nInline \\(a_1 + \\frac{b}{c}\\); $5 and $10.\n\n\\[x^2 + y^2\\]\n\n$$\n\\begin{matrix}a&b\\\\c&d\\end{matrix}\n$$\n';
  const result = helper(source);
  assert.equal(result.outcome, 'ok');
  assert.equal(result.source, source);
  assert.equal(helper(result.source).source, source);
});

test('formatting fails closed rather than rewriting exact explicit math source', () => {
  for (const source of ['# Math\n\nInline \\(\\verb|a  b|\\).\n', '# Math\n\n\\[\\text{a  b}\\]\n']) {
    const result = helper(source);
    assert.equal(result.outcome, 'failed');
    assert.equal(result.source, source);
    assert.ok(result.diagnostics.some(diagnostic => diagnostic.code === 'format-math-source'));
  }
});

test('formatting ordinary Markdown around unchanged math still works with configured EOL conversion', () => {
  const source = '# Math\n\n* item \\(x^2\\)\n';
  const result = helper(source, { '.editorconfig': 'root=true\n[*.md]\nend_of_line=crlf\n' });
  assert.equal(result.outcome, 'ok');
  assert.equal(result.source, '# Math\r\n\r\n- item \\(x^2\\)\r\n');
});

test('full formatter rejects TeX drift in the 101st formula rather than trusting the display cap', () => {
  const source = '# Math\n\n' + '\\(x\\)\n\n'.repeat(100) + '\\(\\verb|a  b|\\)\n';
  const result = helper(source);
  assert.equal(result.outcome, 'failed');
  assert.equal(result.source, source);
  assert.ok(result.diagnostics.some(diagnostic => diagnostic.code === 'format-math-source'));
});

test('formatter fails closed when full syntax verification exceeds its visit budget', () => {
  const source = '# Math\n\n' + '***\n\n'.repeat(100001) + '\\(\\verb|a  b|\\)\n';
  const result = helper(source, { '.prettierignore': 'notes/\n', '.markdownlint-cli2.jsonc': '{"config":{"default":false}}' });
  assert.equal(result.outcome, 'failed');
  assert.equal(result.source, source);
  assert.ok(result.diagnostics.some(diagnostic => diagnostic.code === 'format-math-source' && diagnostic.message.includes('safety budget')));
});

test('formatter refuses Mermaid fence rewrites including the 33rd fence beyond presentation cap',()=>{
  const ordinary='```mermaid\nflowchart TD\nA[keep  two  spaces]\n```\n\n';
  for(const source of ['# Diagram\n\n~~~~mermaid\nflowchart TD\nA-->B\n~~~~\n','# Diagram\n\n'+ordinary.repeat(32)+'~~~~mermaid\nsequenceDiagram\nA->>B: Hi\n~~~~\n']){
    const result=helper(source);assert.equal(result.outcome,'failed');assert.equal(result.source,source);
    assert.ok(result.diagnostics.some(d=>d.code==='format-mermaid-source'));
  }
});
test('unchanged Mermaid fence source permits surrounding Markdown formatting and EOL conversion',()=>{
 const source='# Diagram\n\n* item\n\n```mermaid\nflowchart TD\nA[keep  two  spaces]-->B\n```\n';
 const result=helper(source,{'.editorconfig':'root=true\n[*.md]\nend_of_line=crlf\n'});
 assert.equal(result.outcome,'ok');assert.equal(result.source,source.replace('* item','- item').replaceAll('\n','\r\n'));
});
