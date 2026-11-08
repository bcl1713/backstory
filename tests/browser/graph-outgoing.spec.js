import { showGraphLayer, closeGraphLayer, graphControl } from './support/graph.js';
import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { runtime } from './support/server.js';

// Real HTTP membership, with incoming evidence kept separate from loaded nodes.
test('local outgoing hops, backlinks, recentering and whole wiki stay independent', async ({ page }, info) => {
  for (const [path, source] of Object.entries({
    'Outbound R.md': '# Root\n[[Outbound A]]',
    'Outbound A.md': '# A\n[[Outbound B]]', 'Outbound B.md': '# B',
    'Inbound X.md': '# X\n[[Outbound R]]', 'Inbound Y.md': '# Y\n[[Outbound A]]',
    'Disconnected.md': '# Disconnected',
  })) await writeFile(`${runtime}/wiki/${path}`, source);
  const env = { ...process.env, DJANGO_SETTINGS_MODULE: 'backstory.settings',
    BACKSTORY_WIKI_ROOT: `${runtime}/wiki`, BACKSTORY_DATA_DIR: `${runtime}/data`,
    BACKSTORY_IDENTITY_PATH: '.backstory-marker', BACKSTORY_COOKIE_MODE: 'localhost',
    BACKSTORY_ALLOWED_HOSTS: 'localhost,127.0.0.1' };
  const indexed = spawnSync('.venv/bin/python', ['-c', "import django; django.setup(); from indexing.queue import request_scan; from indexing.worker import run_batch; request_scan('verify')\nfor n in range(2000):\n r=run_batch(now=10000000000+n)\n if not r.pending: break\nelse: raise SystemExit(9)"], { env, encoding: 'utf8' });
  expect(indexed.status, indexed.stderr).toBe(0);
  await page.goto('/accounts/login/');
  await page.getByLabel('Username', { exact: true }).fill('slice');
  await page.getByLabel('Password', { exact: true }).fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.evaluate(() => localStorage.setItem('backstory.vim.v1', 'on'));
  await page.goto('/notes/Outbound%20R.md');
  await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');
  await page.locator('.cm-content').focus(); await page.keyboard.type('g/');
  const panel = page.locator('[data-graph-dialog]');
  const summary = panel.locator('[data-graph-summary]');
  const nodes = panel.locator('[data-graph-nodes] > li');
  await expect(summary).toContainText('3 notes · 2 directed links · Complete');
  if (!await panel.locator('[data-graph-list]').isVisible()) await panel.getByRole('button', { name: 'Connection list', exact: true }).click();
  await expect(nodes).toHaveCount(3);
  await expect(panel.locator('[data-graph-nodes]')).not.toContainText('Inbound');
  await panel.getByRole('button', { name: 'Inspect Root', exact: true }).click();
  await expect(panel.locator('[data-graph-details]')).toContainText('Inbound X.md');
  await expect(nodes).toHaveCount(3);
  await showGraphLayer(panel, 'controls'); await panel.locator('[data-graph-control-options]').evaluate(el => { el.open = true; });
  await graphControl(panel, 'Decrease hop depth');
  await expect(summary).toContainText('2 notes · 1 directed links · Complete');
  await expect(panel.locator('[data-graph-nodes]')).not.toContainText('Outbound B.md');
  await closeGraphLayer(panel);
  await page.screenshot({ path: info.outputPath('outgoing-one-hop.png'), fullPage: true });
  await panel.getByRole('button', { name: 'Inspect A', exact: true }).click();
  await showGraphLayer(panel,'evidence');
  await panel.getByRole('button', { name: 'Expand selected note', exact: true }).click();
  await expect(panel.locator('[name=path]')).toHaveValue('Outbound R.md');
  await expect(summary).toContainText('3 notes · 2 directed links · Complete');
  await expect(panel.locator('[data-graph-nodes]')).toContainText('Outbound R.md');
  await expect(panel.locator('[data-graph-nodes]')).toContainText('Outbound B.md');
  await graphControl(panel, 'All notes');
  await expect(summary).toContainText('Complete');
  await expect(panel.locator('[data-graph-nodes]')).toContainText('Inbound X.md');
  await expect(panel.locator('[data-graph-nodes]')).toContainText('Inbound Y.md');
  await expect(panel.locator('[data-graph-nodes]')).toContainText('Disconnected.md');
  await page.screenshot({ path: info.outputPath('whole-wiki.png'), fullPage: true });
});
