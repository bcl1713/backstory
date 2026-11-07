import { test, expect } from '@playwright/test';
import { trackRoutes } from './support/controlled-routes.js';

test('controlled responses finish before unregistering overlapping routes', async ({ page }) => {
  await page.goto('/accounts/login/');
  const release = [];
  const gates = [0, 1].map(i => new Promise(resolve => { release[i] = resolve; }));
  let arrived, completedFirst;
  const bothStarted = new Promise(resolve => { arrived = resolve; });
  const firstFinished = new Promise(resolve => { completedFirst = resolve; });
  let count = 0;
  const finish = await trackRoutes(page, '**/health/?controlled=*', async route => {
    const index = Number(new URL(route.request().url()).searchParams.get('controlled'));
    if (++count === 2) arrived();
    await gates[index];
    await route.fulfill({ status: 200, contentType: 'text/plain', body: `controlled-${index}` });
    if (index === 0) completedFirst();
  });
  await page.evaluate(() => {
    window.controlledResults = Promise.all([0, 1].map(i => fetch(`/health/?controlled=${i}`).then(r => r.text())));
  });
  await bothStarted;
  release[0]();
  const finishing = finish();
  await firstFinished;
  // Give the first route's cleanup a browser roundtrip while the second stays held.
  await page.evaluate(() => new Promise(requestAnimationFrame));
  release[1]();
  await finishing;
  expect(await page.evaluate(() => window.controlledResults)).toEqual(['controlled-0', 'controlled-1']);
});
