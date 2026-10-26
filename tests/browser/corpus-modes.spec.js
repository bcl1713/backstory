import { revealChrome } from './support/chrome.js';
import { test, expect } from '@playwright/test';
import { writeFile, readFile, stat } from 'node:fs/promises';
import { runtime } from './support/server.js';

for (const malformed of [false, true]) test(`corpus ${malformed ? 'malformed' : 'typed'} source remains exact through both modes`, async ({ page }) => {
  const source = `---\ntitle: Café\nunknown: {nested: [true, 1, null, "1"]}\ndate: "2026-10-25"\n${malformed ? 'broken: [\n' : ''}---\n# Café\n\n[[Other#Details|alias]]\n\n| a | b |\n| - | - |\n| x | y |\n\n- [ ] task\n  - nested\n\n\`\`\`md\n[[literal]]\n\`\`\`\n`;
  const path = `${runtime}/wiki/Corpus.md`;
  await writeFile(path, source);
  const before = await stat(path);
  await page.goto('/accounts/login/');
  await page.getByLabel('Username').fill('slice');
  await page.getByLabel('Password').fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.goto('/notes/Corpus.md');
  const read = () => page.locator('[data-markdown-editor]').evaluate(el => el.markdownEditor.getSource());
  for (let i = 0; i < 3; i++) {
    await revealChrome(page);
    await page.getByRole('button', { name: 'Raw source', exact: true }).click();
    expect(await read()).toBe(source);
    await revealChrome(page);
    await page.getByRole('button', { name: 'Live preview', exact: true }).click();
    expect(await read()).toBe(source);
  }
  expect(await readFile(path, 'utf8')).toBe(source);
  expect((await stat(path)).mtimeMs).toBe(before.mtimeMs);
  await expect(page.locator('[data-editor-status]')).toHaveText('Unchanged');
});
