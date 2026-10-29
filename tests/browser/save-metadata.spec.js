import { test, expect } from '@playwright/test';
import { readFile, writeFile, rm } from 'node:fs/promises';
import { runtime } from './support/server.js';

const target = `${runtime}/wiki/Metadata.md`;
const original = '---\ntitle: Old title\nid: stable\nmodified: 2020-01-01\n---\n\n# Old title\n';

test('autosave accepts authoritative metadata without another dirty save', async ({ page }) => {
  await writeFile(target, original);
  try {
    await page.goto('/accounts/login/');
    await page.getByLabel('Username', { exact: true }).fill('slice');
    await page.getByLabel('Password', { exact: true }).fill('synthetic-slice-browser-only');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    const now = new Date('2026-10-29T15:00:00Z');
    await page.clock.install({ time: now });
    await page.clock.pauseAt(new Date(now.getTime() + 1000));
    await page.goto('/notes/Metadata.md');
    await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');
    const saves = [];
    page.on('request', request => { if (request.url().includes('/save/Metadata.md')) saves.push(request); });
    await page.locator('[data-markdown-editor]').evaluate(el => {
      const source = el.markdownEditor.getSource().replace('title: Old title', 'title: New title');
      el.markdownEditor.setSource(source);
    });
    await page.clock.runFor(5000);
    await expect(page.locator('[data-editor-status]')).toContainText('Saved');
    const saved = await readFile(target, 'utf8');
    expect(saved).toContain('id: stable');
    expect(saved).toContain('aliases:');
    expect(saved).toContain('Old title');
    expect(saved).not.toContain('modified: 2020-01-01');
    expect(await page.locator('[data-markdown-editor]').evaluate(el => el.markdownEditor.getSource())).toBe(saved);
    await page.clock.runFor(15000);
    expect(saves).toHaveLength(1);
  } finally { await rm(target, { force: true }); }
});
