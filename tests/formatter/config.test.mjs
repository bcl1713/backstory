import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveConfiguration } from '../../formatter/config.mjs';

test('config reader rejects executable directives and bounded reference cycles', () => {
  for (const files of [
    {'.prettierrc': '{"parser":"evil"}'},
    {'.prettierrc': '{"overrides":[{"files":"*.md","options":{"plugins":["evil"]}}]}'},
    {'.markdownlint-cli2.jsonc':'{"frontMatter":"(a+)+"}'},
    {'.prettierrc': '{"extends":"./base.json"}', 'base.json':'{"extends":"./.prettierrc"}'},
    {'.prettierrc':'{"printWidth":80,"printWidth":20}'},
    {'.prettierrc':'a: &a [*a]'},
    {'.prettierrc':'{"__proto__":{"plugins":["evil"]}}'},
  ]) assert.throws(() => resolveConfiguration('nested/note.md', files));
});

test('safe local reference and nested cli2 overrides resolve without native discovery', () => {
  const config = resolveConfiguration('nested/note.md', {
    '.prettierrc.yaml': 'printWidth: 100\nproseWrap: preserve\n',
    'nested/.prettierrc': '{"printWidth":40}',
    '.markdownlint-cli2.jsonc': '{"configFile":"./rules.json","overrides":[{"filter":["nested/**"],"combine":"merge","config":{"MD013":false}}]}',
    'rules.json':'{"default":false,"MD001":true}',
  });
  assert.equal(config.prettier.printWidth, 40);
  assert.equal(config.prettier.proseWrap, undefined);
  assert.equal(config.lint.config.default, false);
  assert.equal(config.lint.config.MD001, true);
  assert.equal(config.lint.config.MD013, false);
});

test('ignore negation, nested relative bases and EditorConfig root boundary', () => {
  const config = resolveConfiguration('nested/keep.md', {
    '.prettierignore': '*.md\n!nested/keep.md\n',
    '.editorconfig':'root=true\n[*.md]\nindent_size=8\n',
    'nested/.editorconfig':'root=true\n[*.md]\nindent_size=3\n',
    '.markdownlintignore':'nested/keep.md\n',
  });
  assert.equal(config.prettierSkipped, false);
  assert.equal(config.lintSkipped, true);
  assert.equal(config.prettier.tabWidth, 3);
});

test('EditorConfig overrides application defaults only while explicit Prettier takes precedence', () => {
  const editor = '.editorconfig';
  const text = 'root=true\n[*.md]\nend_of_line=crlf\nmax_line_length=42\n';
  assert.equal(resolveConfiguration('note.md', {[editor]:text}).prettier.endOfLine,'crlf');
  assert.equal(resolveConfiguration('note.md', {[editor]:text}).prettier.printWidth,42);
  assert.equal(resolveConfiguration('note.md', {[editor]:text,'.prettierrc':'{"endOfLine":"lf"}'}).prettier.endOfLine,'lf');
});

test('snapshot caps, missing references and arbitrary note files fail closed', () => {
  assert.throws(()=>resolveConfiguration('note.md',{'.prettierrc':' '.repeat(65537)}));
  assert.throws(()=>resolveConfiguration('note.md',Object.fromEntries(Array.from({length:33},(_,i)=>[`c${i}.json`,'{}']))));
  assert.throws(()=>resolveConfiguration('note.md',{'.prettierrc':'{"extends":"./missing.json"}'}));
  assert.throws(()=>resolveConfiguration('note.md',{'other.md':'# unapproved'}));
  assert.throws(()=>resolveConfiguration('../note.md',{}));
});

test('a configured gitignore filename selects only that relative ignore file', () => {
  const files = {'.markdownlint-cli2.jsonc':'{"gitignore":".gitignore"}', '.gitignore':'unrelated.md\n','nested/.gitignore':'note.md\n'};
  assert.equal(resolveConfiguration('nested/note.md',files).lintSkipped,false);
});
