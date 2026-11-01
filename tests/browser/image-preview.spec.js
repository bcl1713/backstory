import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
import { runtime } from './support/server.js';
import { revealChrome } from './support/chrome.js';

const source = 'Before\n\n![Landscape](images/wide%20view.png "Local image")\n\nInline ![Reference][photo] beside text.\n\n![Missing](images/missing.png)\n\n![Denied](.git/secret.png)\n\n![Remote](https://example.invalid/tracker.png)\n\n![SVG](images/active.svg)\n\n![Broken](images/broken.png)\n\n`![Code](images/wide%20view.png)` and \\![Escaped](images/wide%20view.png)\n\n| Picture |\n| --- |\n| ![Table](images/wide%20view.png) |\n\n[photo]: images/wide%20view.png\n\nAfter\n';
const host = page => page.locator('[data-markdown-editor]');
const read = page => host(page).evaluate(el => el.markdownEditor.getSource());
const select = (page, anchor, head = anchor) => host(page).evaluate((el, selection) => el.markdownEditor.view.dispatch({ selection }), { anchor, head });
async function open(page, note = 'Images') {
  await page.goto('/accounts/login/');
  await page.getByLabel('Username').fill('slice');
  await page.getByLabel('Password').fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.goto(`/notes/${note}.md`);
  await expect(page.locator('[data-editor-stage]')).toHaveAttribute('data-editor-state', 'ready');
}
// Synthetic 1600x900 PNG, generated locally without image services or fixtures.
function png() {
  function crc(bytes) { let c = 0xffffffff; for (const byte of bytes) { c ^= byte; for (let i = 0; i < 8; i++) c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0); } return (c ^ 0xffffffff) >>> 0; }
  function chunk(name, data) { const type = Buffer.from(name), size = Buffer.alloc(4), sum = Buffer.alloc(4); size.writeUInt32BE(data.length); sum.writeUInt32BE(crc(Buffer.concat([type, data]))); return Buffer.concat([size, type, data, sum]); }
  const header = Buffer.alloc(13); header.writeUInt32BE(1600); header.writeUInt32BE(900, 4); header[8] = 8; header[9] = 2;
  const pixels = Buffer.alloc((1600 * 3 + 1) * 900);
  for (let y = 0; y < 900; y++) for (let x = 0; x < 1600; x++) { const at = y * 4801 + 1 + x * 3; pixels[at] = 35 + Math.floor(x / 10); pixels[at + 1] = 60 + Math.floor(y / 6); pixels[at + 2] = 150; }
  return Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), chunk('IHDR', header), chunk('IDAT', deflateSync(pixels)), chunk('IEND', Buffer.alloc(0))]);
}
test.beforeAll(async () => {
  await mkdir(`${runtime}/wiki/images`, { recursive: true });
  await writeFile(`${runtime}/wiki/images/wide view.png`, png());
  await writeFile(`${runtime}/wiki/images/active.svg`, '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
  await writeFile(`${runtime}/wiki/images/broken.png`, 'not an image');
  await writeFile(`${runtime}/wiki/Images.md`, source);
  await writeFile(`${runtime}/wiki/ImageMotion.md`, 'Before\n\n![Landscape](images/wide%20view.png)\n\nAfter');
});

test('local ordinary and reference images load lazily; enlargement is accessible and source-preserving', async ({ page }) => {
  await open(page);
  const image = host(page).getByRole('img', { name: 'Landscape', exact: true });
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute('src', '/attachments/images/wide%20view.png');
  await expect(image).toHaveAttribute('loading', 'lazy');
  await expect.poll(() => image.evaluate(el => el.complete && el.naturalWidth)).toBe(1600);
  await expect(host(page).getByRole('img', { name: 'Reference', exact: true })).toBeVisible();
  const selection = await host(page).evaluate(el => el.markdownEditor.view.state.selection.toJSON());
  const enlarge = page.getByRole('button', { name: 'Enlarge image: Landscape', exact: true });
  for (const dismiss of ['Escape', 'button']) {
    await enlarge.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: 'Image: Landscape', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close image', exact: true })).toBeFocused();
    if (dismiss === 'Escape') await page.keyboard.press('Escape');
    else await page.getByRole('button', { name: 'Close image', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(enlarge).toBeFocused();
  }
  expect(await host(page).evaluate(el => el.markdownEditor.view.state.selection.toJSON())).toEqual(selection);
  expect(await read(page)).toBe(source);
  await expect(page.locator('[data-editor-status]')).toHaveText('Unchanged');
});

test('source selection, source editing, undo and presentation switches preserve exact image Markdown', async ({ page }) => {
  await open(page);
  await expect(page.getByRole('button', { name: 'Enlarge image: Landscape', exact: true })).toBeVisible();
  await host(page).getByRole('img', { name: 'Landscape', exact: true }).click();
  await expect(host(page).getByRole('img', { name: 'Landscape', exact: true })).toHaveCount(0);
  expect(await host(page).evaluate(el => el.markdownEditor.view.state.selection.main.head)).toBe(source.indexOf('![Landscape]'));
  await select(page, source.indexOf('![Landscape]'), source.indexOf('![Missing]'));
  await expect(host(page).getByRole('img', { name: 'Reference', exact: true })).toHaveCount(0);
  await select(page, 0);
  await host(page).evaluate(el => el.markdownEditor.setVimEnabled(false));
  await page.locator('.cm-content').focus();
  await page.keyboard.type('X');
  await page.keyboard.press('Control+z');
  expect(await read(page)).toBe(source);
  for (const mode of ['Raw source', 'Plain text fallback', 'Live preview']) {
    await revealChrome(page);
    await page.getByRole('button', { name: mode, exact: true }).click();
    if (mode !== 'Live preview') await expect(host(page).locator('.lp-image')).not.toBeVisible();
    expect(await read(page)).toBe(source);
  }
  await select(page, 0);
  await expect(host(page).getByRole('img', { name: 'Landscape', exact: true })).toBeVisible();
});

test('missing, denied, active and corrupt images use safe fallback without external requests; table images stay literal', async ({ page }) => {
  const outbound = [];
  const imageRequests = [];
  page.on('request', request => { const url = new URL(request.url()); if (!['127.0.0.1', 'localhost'].includes(url.hostname)) outbound.push(url.href); if (url.pathname.startsWith('/attachments/')) imageRequests.push(url.pathname); });
  await open(page);
  for (const label of ['Missing', 'Denied', 'SVG', 'Broken']) await expect(host(page).getByText(`Image unavailable: ${label}`, { exact: true })).toBeVisible();
  await expect(host(page).getByText('External image blocked: Remote', { exact: true })).toBeVisible();
  await expect(host(page).getByRole('img', { name: /Code|Escaped|Table|Remote|SVG/ })).toHaveCount(0);
  await expect(page.locator('.lp-table')).toContainText('![Table](images/wide%20view.png)');
  expect(imageRequests).not.toContain('/attachments/images/active.svg');
  expect(imageRequests.some(value => value.includes('.git'))).toBe(false);
  expect(outbound).toEqual([]);
  expect(await read(page)).toBe(source);
});

for (const width of [1180, 390]) test(`image and enlarged image fit viewport at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await open(page);
  const image = host(page).getByRole('img', { name: 'Landscape', exact: true });
  await expect.poll(() => image.evaluate(el => el.complete && el.naturalWidth)).toBe(1600);
  expect(await image.evaluate(el => el.getBoundingClientRect().right <= innerWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `${runtime}/reports/images-${width}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Enlarge image: Landscape', exact: true }).click();
  expect(await page.getByRole('dialog').evaluate(el => el.getBoundingClientRect().right <= innerWidth)).toBe(true);
  await page.screenshot({ path: `${runtime}/reports/images-${width}-enlarged.png`, fullPage: true });
});

for (const vim of [false, true]) for (const direction of ['down', 'up']) test(`${vim ? 'Vim' : 'arrows'} enters tall image source ${direction} without skipping`, async ({ page }) => {
  await open(page, 'ImageMotion');
  await expect(host(page).getByRole('img', { name: 'Landscape', exact: true })).toBeVisible();
  await host(page).evaluate((el, value) => el.markdownEditor.setVimEnabled(value), vim);
  await page.locator('.cm-content').focus();
  if (vim) await page.keyboard.type(direction === 'down' ? 'gg' : 'G');
  else await page.keyboard.press(direction === 'down' ? 'Control+Home' : 'Control+End');
  const key = vim ? (direction === 'down' ? 'j' : 'k') : (direction === 'down' ? 'ArrowDown' : 'ArrowUp');
  await page.keyboard.press(key);
  await page.keyboard.press(key);
  expect(await host(page).evaluate(el => { const s = el.markdownEditor.view.state; return s.doc.lineAt(s.selection.main.head).number; })).toBe(3);
  await expect(host(page).getByRole('img', { name: 'Landscape', exact: true })).toHaveCount(0);
  expect(await read(page)).toBe('Before\n\n![Landscape](images/wide%20view.png)\n\nAfter');
});

test('late resolver responses cannot revive an old image or shift source selection', async ({ page }) => {
  let release, started;
  const gate = new Promise(resolve => { release = resolve; });
  const waiting = new Promise(resolve => { started = resolve; });
  await page.route('**/resolve/**', async route => {
    if (new URL(route.request().url()).searchParams.get('target') === 'images/wide%20view.png') { const response = await route.fetch(); started(); await gate; await route.fulfill({ response }); }
    else await route.continue();
  });
  await open(page);
  await waiting;
  await host(page).evaluate(el => el.markdownEditor.setSource('New note\n\nNo image.'));
  await select(page, 3);
  release();
  await page.waitForTimeout(150);
  await expect(host(page).locator('.lp-image')).toHaveCount(0);
  expect(await host(page).evaluate(el => el.markdownEditor.view.state.selection.main.head)).toBe(3);
  expect(await read(page)).toBe('New note\n\nNo image.');
});

test('image modal owns Escape even while navigation controls are open', async ({ page }) => {
  await open(page);
  await revealChrome(page);
  const enlarge = page.getByRole('button', { name: 'Enlarge image: Landscape', exact: true });
  await enlarge.click();
  await expect(page.getByRole('dialog', { name: 'Image: Landscape', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(enlarge).toBeFocused();
  await expect(page.getByRole('button', { name: 'Navigation and controls', exact: true })).toHaveAttribute('aria-expanded', 'true');
  expect(await read(page)).toBe(source);
});

for (const direction of ['down', 'up']) test(`Vim counts and delete/undo keep image source-line semantics ${direction}`, async ({ page }) => {
  await open(page, 'ImageMotion');
  await host(page).evaluate(el => el.markdownEditor.setVimEnabled(true));
  await page.locator('.cm-content').focus();
  const edge = direction === 'down' ? 'gg' : 'G';
  const motion = direction === 'down' ? 'j' : 'k';
  await page.keyboard.type(edge + '2' + motion);
  expect(await host(page).evaluate(el => { const s = el.markdownEditor.view.state; return s.doc.lineAt(s.selection.main.head).number; })).toBe(3);
  await page.keyboard.type(edge + 'd2' + motion);
  expect(await read(page)).not.toContain('![Landscape]');
  await page.keyboard.type('u');
  expect(await read(page)).toBe('Before\n\n![Landscape](images/wide%20view.png)\n\nAfter');
});

test('removing image syntax while its modal is open closes stale presentation without source writes', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Enlarge image: Landscape', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Image: Landscape', exact: true })).toBeVisible();
  await host(page).evaluate(el => el.markdownEditor.setSource('Replacement\n\nNo image.'));
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(host(page).locator('.lp-image')).toHaveCount(0);
  expect(await read(page)).toBe('Replacement\n\nNo image.');
});
