import { test, expect } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { runtime } from './support/server.js';

const env = { ...process.env, DJANGO_SETTINGS_MODULE: 'backstory.settings', BACKSTORY_WIKI_ROOT: `${runtime}/wiki`, BACKSTORY_DATA_DIR: `${runtime}/data`, BACKSTORY_IDENTITY_PATH: '.backstory-marker', BACKSTORY_COOKIE_MODE: 'localhost', BACKSTORY_ALLOWED_HOSTS: 'localhost,127.0.0.1' };
async function login(page, tools = false) {
  if (tools) await page.addInitScript(() => {
    window.registeredWikiTools = {};
    Object.defineProperty(document, 'modelContext', { value: { registerTool(tool) { window.registeredWikiTools[tool.name] = tool; } } });
  });
  await page.goto('/accounts/login/');
  await page.getByLabel('Username', { exact: true }).fill('slice');
  await page.getByLabel('Password', { exact: true }).fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}
async function indexFixture() {
  const indexed = spawnSync('.venv/bin/python', ['-c', "import django; django.setup(); from indexing.queue import request_scan; from indexing.worker import run_batch; request_scan('verify')\nfor n in range(2000):\n r=run_batch(now=10000000000+n)\n if not r.pending: break\nelse: raise SystemExit(9)"], { env, encoding: 'utf8' });
  expect(indexed.status, indexed.stderr).toBe(0);
}
const colors = (page, path) => page.locator('[data-graph-map]').evaluate((el, path) => {
  const view = el.graphView, index = view.data.nodes.findIndex(node => node.path === path);
  return index < 0 ? null : [...view.batch.halos.geometry.attributes.color.array.slice(index * 3, index * 3 + 3)];
}, path);
test('real note page read and confirmed save pulse only the matching node in the already-open graph', async ({ page, context }, info) => {
  test.setTimeout(60000);
  await indexFixture(); await login(page); await page.goto('/notes/Slice.md');
  await expect(page.locator('[data-editor-readiness]')).toContainText('Ready');
  await page.evaluate(() => document.dispatchEvent(new Event('backstory:open-graph')));
  const panel = page.locator('[data-graph-dialog]'), map = panel.locator('[data-graph-map]');
  await expect(panel.locator('[data-graph-summary]')).toContainText('2 notes');
  const paths = await map.evaluate(el => el.graphView.data.nodes.map(node => node.path));
  expect(paths).toContain('Other.md');
  const beforeMetadataRefresh = await map.evaluate(el => [...el.graphView.activityTimes]);
  await panel.locator('[data-graph-toggle="controls"]').click();
  await panel.locator('[data-graph-refresh]').click();
  await expect(panel.locator('[data-graph-summary]')).toContainText('Complete');
  expect(await map.evaluate(el => [...el.graphView.activityTimes])).toEqual(beforeMetadataRefresh);
  await panel.locator('[data-graph-overlay="controls"] [data-graph-dismiss]').click();
  const reader = await context.newPage(); await login(reader, true); await reader.goto('/notes/Other.md');
  await expect(reader.locator('[data-editor-readiness]')).toContainText('Ready');
  const baseline = Object.fromEntries(await Promise.all(paths.map(async path => [path, await colors(page, path)])));
  await expect.poll(() => map.evaluate(el => el.graphView.activityTimes.has('Other.md'))).toBe(true);
  const afterRead = Object.fromEntries(await Promise.all(paths.map(async path => [path, await colors(page, path)])));
  expect(afterRead['Other.md']).not.toEqual(baseline['Other.md']);
  expect(await map.evaluate(el => [...el.graphView.activityTimes.keys()])).toEqual(['Other.md']);
  await map.screenshot({ path: info.outputPath('activity-after-real-read.png') });
  await expect.poll(() => colors(page, 'Other.md'), { timeout: 4000 }).not.toEqual(baseline['Other.md']);
  await page.waitForTimeout(1900);
  await expect.poll(() => map.evaluate(el => el.graphView.activityTimes.has('Other.md')), { timeout: 2000 }).toBe(false);
  await map.screenshot({ path: info.outputPath('activity-after-first-decay.png') });

  const webmcpRead = await reader.evaluate(async () => JSON.parse(await window.registeredWikiTools.read_note.execute({ path: 'Other.md' })));
  expect(webmcpRead.state).toBe('ok');
  await expect.poll(() => map.evaluate(el => el.graphView.activityTimes.has('Other.md'))).toBe(true);
  await expect.poll(() => colors(page, 'Other.md')).not.toEqual(baseline['Other.md']);
  const firstWebmcpTime = await map.evaluate(el => el.graphView.activityTimes.get('Other.md'));
  const repeatedRead = await reader.evaluate(async () => JSON.parse(await window.registeredWikiTools.read_note.execute({ path: 'Other.md' })));
  expect(repeatedRead.state).toBe('ok');
  expect(await map.evaluate(el => el.graphView.activityTimes.size)).toBe(1);
  expect(await map.evaluate(el => el.graphView.activityTimes.get('Other.md'))).toBeGreaterThanOrEqual(firstWebmcpTime);
  await page.waitForTimeout(1900);
  await expect.poll(() => map.evaluate(el => el.graphView.activityTimes.has('Other.md')), { timeout: 2000 }).toBe(false);

  const beforeWrite = await colors(page, 'Other.md');
  await reader.locator('[data-markdown-editor]').evaluate(el => el.markdownEditor.setSource('# Other updated\n\n[[Slice]]\n'));
  await reader.locator('[data-save]').click();
  await expect(reader.locator('[data-editor-status]')).toContainText('Saved.');
  await expect.poll(() => {
    const node = map.evaluate(el => el.graphView.activityTimes.get('Other.md'));
    return node;
  }).toBeTruthy();
  await expect.poll(() => colors(page, 'Other.md')).not.toEqual(beforeWrite);
  expect(await map.evaluate(el => [...el.graphView.activityTimes.keys()])).toEqual(['Other.md']);
  await indexFixture();
  const beforeFailedRead = await map.evaluate(el => el.graphView.activityTimes.get('Other.md'));
  const failedRead = await reader.evaluate(async () => JSON.parse(await window.registeredWikiTools.read_note.execute({ path: 'Missing activity.md' })));
  expect(failedRead.reason_code).toBe('not_found');
  expect(await map.evaluate(el => el.graphView.activityTimes.get('Other.md'))).toBe(beforeFailedRead);
  expect(await map.evaluate(el => [...el.graphView.activityTimes.keys()])).toEqual(['Other.md']);

  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.keyboard.press('Escape');
  await page.evaluate(() => document.dispatchEvent(new Event('backstory:open-graph')));
  await expect(panel.locator('[data-graph-summary]')).toContainText('Complete');
  expect(await map.evaluate(el => el.graphView.activityTimes.size)).toBe(0);
  const noteRead = reader.waitForResponse(response => response.url().includes('/notes/Other.md') && response.status() === 200);
  await reader.reload(); await expect(reader.locator('[data-editor-readiness]')).toContainText('Ready');
  expect((await noteRead).status()).toBe(200);
  await page.waitForTimeout(100);
  expect(await map.evaluate(el => el.graphView.activityTimes.size)).toBe(0);
  await reader.close();
});
