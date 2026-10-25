import { test, expect } from '@playwright/test';
import { readFile, writeFile, rename, mkdir, rmdir } from 'node:fs/promises';
import { runtime } from './support/server.js';
const target = `${runtime}/wiki/Recovery.md`;
const original = Buffer.from('\ufeff# Original\r\n');
async function login(page, route='/notes/Recovery.md') {
  await page.goto('/accounts/login/');
  await page.getByLabel('Username', {exact:true}).fill('slice');
  await page.getByLabel('Password', {exact:true}).fill('synthetic-slice-browser-only');
  await page.getByRole('button', {name:'Sign in',exact:true}).click();
  await page.goto(route);
}
const source = async page => {
  await page.waitForFunction(() => Boolean(document.querySelector('[data-markdown-editor]')?.markdownEditor));
  return page.locator('[data-markdown-editor]').evaluate(el => el.markdownEditor.getSource());
};
async function action(page, name, route='/save/') {
  const [response] = await Promise.all([page.waitForResponse(r => r.url().includes(route) && r.request().method()==='POST'), page.getByRole('button',{name,exact:true}).click()]);
  return response;
}
for (const mode of ['live','source']) test(`${mode}: protected draft survives reauthentication, empty mountpoint and fresh browser recovery without replay`, async ({page, context, browser}) => {
  await writeFile(target, original);
  await login(page);
  if (mode==='source') await page.getByRole('button',{name:'Raw source',exact:true}).click();
  await page.locator('.cm-content').focus();
  await page.keyboard.press('Control+a');
  await page.keyboard.insertText('\ufeff---\nx: [\n---\n# Protected draft\n');
  const draft = await source(page);
  await context.clearCookies();
  await action(page,'Save');
  await expect(page.locator('[data-reauth]')).toBeVisible();
  expect(await source(page)).toBe(draft);
  await page.getByLabel('Username for sign-in').fill('slice');
  await page.getByLabel('Password for sign-in').fill('synthetic-slice-browser-only');
  await page.getByRole('button',{name:'Sign in again',exact:true}).click();
  await expect(page.locator('[data-editor-status]')).toContainText('Signed in. Draft retained');
  expect(await readFile(target)).toEqual(original);
  await rename(`${runtime}/wiki`, `${runtime}/detached-wiki`);
  await mkdir(`${runtime}/wiki`);
  try {
    expect((await action(page,'Save')).status()).toBe(503);
    expect(await source(page)).toBe(draft);
    const stored = await action(page,'Store protected draft','/drafts/');
    expect(stored.status()).toBe(201);
    const recoveryUrl = (await stored.json()).url;
    const restartCount = Number(await readFile(`${runtime}/restart-count`, 'utf8'));
    process.kill(Number(await readFile(`${runtime}/server.pid`, 'utf8')), 'SIGUSR2');
    await expect.poll(async () => Number(await readFile(`${runtime}/restart-count`, 'utf8'))).toBeGreaterThan(restartCount);
    await expect.poll(async () => {
      try { return (await page.request.get('/accounts/login/')).status(); } catch { return 0; }
    }).toBe(200);
    await page.getByRole('button',{name:'Raw source',exact:true}).click();
    await page.getByRole('button',{name:'Live preview',exact:true}).click();
    expect(await source(page)).toBe(draft);
    const second = await browser.newContext();
    const recovery = await second.newPage();
    await login(recovery,recoveryUrl);
    expect(await source(recovery)).toBe(draft);
    await expect(recovery.locator('[data-editor-status]')).toContainText('Recovered draft');
    expect((await action(recovery,'Save')).status()).toBe(503);
    await second.close();
  } finally {
    await rmdir(`${runtime}/wiki`);
    await rename(`${runtime}/detached-wiki`,`${runtime}/wiki`);
  }
  expect(await readFile(target)).toEqual(original);
  await writeFile(target, '\ufeff# External\r\n');
  expect((await action(page,'Save')).status()).toBe(412);
  await expect(page.getByLabel('Base source',{exact:true})).toHaveValue('# Original\n');
  await expect(page.getByLabel('Current disk source',{exact:true})).toHaveValue('# External\n');
  expect(await source(page)).toBe(draft);
  await page.getByRole('button',{name:'Accept current revision for manual merge'}).click();
  expect((await action(page,'Save')).status()).toBe(422);
  expect((await action(page,'Save source without formatting')).status()).toBe(200);
  expect(await readFile(target)).toEqual(Buffer.from('\ufeff'+draft));
});

for (const mode of ['live','source']) test(`${mode}: shared history requires explicit fresh-base restoration and preserves exact bytes`, async ({page}) => {
  const historical = Buffer.from('\ufeff\ufeff# History\r\n');
  await writeFile(target,historical);
  await login(page);
  await page.locator('.cm-content').focus();
  await page.keyboard.press('Control+a');
  await page.keyboard.insertText('# Changed\n');
  expect((await action(page,'Save')).status()).toBe(200);
  await page.goto('/history/Recovery.md');
  await page.getByRole('link',{name:'Open original for comparison and explicit restoration'}).first().click();
  if(mode==='source') await page.getByRole('button',{name:'Raw source',exact:true}).click();
  expect(await source(page)).toBe('\ufeff# History\r\n');
  expect((await action(page,'Restore this revision','/restore/')).status()).toBe(412);
  await expect(page.getByLabel('Current disk source',{exact:true})).toHaveValue('# Changed\n');
  await page.getByRole('button',{name:'Accept current revision for manual merge'}).click();
  expect((await action(page,'Restore this revision','/restore/')).status()).toBe(200);
  expect(await readFile(target)).toEqual(historical);
});
