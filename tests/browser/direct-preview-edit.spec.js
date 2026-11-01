import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
import { runtime } from './support/server.js';

const host = page => page.locator('[data-markdown-editor]');
const read = page => host(page).evaluate(el => el.markdownEditor.getSource());
const select = (page, anchor = 0) => host(page).evaluate((el, anchor) => el.markdownEditor.view.dispatch({ selection: { anchor } }), anchor);
const formulas = 'Inline \\(x^2+1\\) after.\n\n$$\n\\frac{a}{b}\n$$';
const diagram = '```mermaid\nflowchart TD\nA[Start] --> B[Finish]\n```';
const source = `Before\n\n${formulas}\n\n![Dot](images/direct.png)\n\n${diagram}\n\nAfter\n\n${'Further paragraph.\n\n'.repeat(60)}`;
function picture(width = 320, height = 120) {
  const chunk = (name, bytes) => {
    const type = Buffer.from(name), length = Buffer.alloc(4), crc = Buffer.alloc(4);
    length.writeUInt32BE(bytes.length);
    let c = 0xffffffff;
    for (const byte of Buffer.concat([type, bytes])) { c ^= byte; for (let i = 0; i < 8; i++) c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0); }
    crc.writeUInt32BE((c ^ 0xffffffff) >>> 0);
    return Buffer.concat([length, type, bytes, crc]);
  };
  const header = Buffer.alloc(13); header.writeUInt32BE(width); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 2;
  const stride = width * 3 + 1, pixels = Buffer.alloc(stride * height, 120);
  for (let y = 0; y < height; y++) pixels[y * stride] = 0;
  return Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), chunk('IHDR', header), chunk('IDAT', deflateSync(pixels)), chunk('IEND', Buffer.alloc(0))]);
}
test.beforeAll(async () => {
  await mkdir(`${runtime}/wiki/images`, { recursive: true });
  await writeFile(`${runtime}/wiki/images/direct.png`, picture());
  await writeFile(`${runtime}/wiki/images/tiny.png`, picture(16, 16));
  await writeFile(`${runtime}/wiki/images/direct-broken.png`, 'broken');
  await writeFile(`${runtime}/wiki/DirectPreview.md`, source);
});
async function open(page) {
  await page.goto('/accounts/login/');
  await page.getByLabel('Username').fill('slice');
  await page.getByLabel('Password').fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.goto('/notes/DirectPreview.md');
  await expect(page.locator('[data-editor-stage]')).toHaveAttribute('data-editor-state', 'ready');
  await expect(host(page).locator('math')).toHaveCount(2);
  await expect(host(page).getByText('Mermaid flowchart.', { exact: true })).toBeVisible();
}
const cases = [
  { name: 'inline math', selector: '.lp-math:not(.lp-math-display)', anchor: source.indexOf('\\('), label: 'Edit math source' },
  { name: 'display math', selector: '.lp-math-display', anchor: source.indexOf('$$'), label: 'Edit math source' },
  { name: 'image', selector: '.lp-image', anchor: source.indexOf('!['), label: 'Edit image source: Dot' },
  { name: 'diagram', selector: '.lp-diagram', anchor: source.indexOf('```'), label: 'Edit Mermaid source' },
];
for (const touch of [false, true]) for (const item of cases) test(`${touch ? 'tap' : 'click'} ${item.name} enters source and renders again`, async ({ page }) => {
  await page.setViewportSize({ width: touch ? 390 : 1180, height: 1000 });
  await open(page);
  for (let repeat = 0; repeat < 2; repeat++) {
    const surface = host(page).locator(item.selector);
    await expect(surface).toBeVisible();
    // Hit rendered content, never the keyboard source control or enlargement.
    const target = item.name.includes('math') ? surface.locator('math') : item.name === 'diagram' ? surface.locator('iframe') : surface.locator('img');
    if (item.name === 'diagram') await expect(surface.getByText('Mermaid flowchart.', { exact: true })).toBeVisible();
    if (item.name === 'image') await expect.poll(() => target.evaluate(el => el.complete && el.naturalWidth > 0)).toBe(true);
    await target.scrollIntoViewIfNeeded();
    const box = await target.boundingBox();
    if (touch) await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    else await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(surface).toHaveCount(0);
    expect(await host(page).evaluate(el => el.markdownEditor.view.state.selection.main.head)).toBe(item.anchor);
    expect(await read(page)).toBe(source);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await select(page);
    await expect(surface).toBeVisible();
  }
});

test('source buttons do not occupy prose but are keyboard reachable with visible focus and native math semantics', async ({ page }) => {
  await open(page);
  const math = host(page).locator('.lp-math').first();
  expect(await math.locator('math').evaluate(el => !!el.closest('button,[role="button"]'))).toBe(false);
  for (const item of cases) {
    const surface = host(page).locator(item.selector);
    const edit = surface.getByRole('button', { name: item.label, exact: true });
    expect((await edit.boundingBox()).height).toBeLessThanOrEqual(1);
    for (let steps = 0; steps < 20 && !(await edit.evaluate(el => el === document.activeElement)); steps++) await page.keyboard.press('Tab');
    await expect(edit).toBeFocused();
    expect(await edit.evaluate(el => getComputedStyle(el).outlineStyle)).not.toBe('none');
    expect((await edit.boundingBox()).height).toBeLessThanOrEqual(48);
    if (item.name === 'inline math' || item.name === 'diagram') await page.screenshot({ path: `${runtime}/reports/math-direct-edit-focus-${item.name.replace(' ', '-')}.png` });
    await page.keyboard.press(item.name === 'image' ? 'Space' : 'Enter');
    await expect(surface).toHaveCount(0);
    expect(await read(page)).toBe(source);
    await select(page);
  }
});

test('pointer drag and actual touch scrolling preserve rendered source', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 650 });
  await open(page);
  const math = host(page).locator('.lp-math').first();
  const box = await math.boundingBox();
  await page.mouse.move(box.x + 5, box.y + 5);
  await page.mouse.down();
  await page.mouse.move(box.x + 40, box.y + 5, { steps: 5 });
  await page.mouse.up();
  await expect(math).toBeVisible();
  const session = await context.newCDPSession(page);
  const y = box.y + box.height / 2, x = box.x + box.width / 2;
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let offset = 20; offset <= 100; offset += 20) await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - offset }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  expect(await host(page).evaluate(el => el.markdownEditor.view.state.selection.main.head)).toBe(0);
  expect(await read(page)).toBe(source);
});

for (const width of [390, 1180]) test(`direct rendering screenshot at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  await open(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `${runtime}/reports/math-direct-edit-${width}.png` });
});

test('compact enlargement is separate from editing and restores focus', async ({ page }) => {
  await open(page);
  const enlarge = page.getByRole('button', { name: 'Enlarge image: Dot', exact: true });
  const bounds = await enlarge.boundingBox();
  expect(bounds.width).toBeLessThanOrEqual(48);
  expect(bounds.height).toBeLessThanOrEqual(48);
  await enlarge.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(enlarge).toBeFocused();
  expect(await host(page).evaluate(el => el.markdownEditor.view.state.selection.main.head)).toBe(0);
  expect(await read(page)).toBe(source);
});

test('changed image syntax and discarded widgets cannot activate stale source', async ({ page }) => {
  await open(page);
  const old = await host(page).locator('.lp-image').elementHandle();
  const changed = source.replace('![Dot](images/direct.png)', '![Dot](images/direct.png "new title")');
  await host(page).evaluate((el, value) => el.markdownEditor.setSource(value), changed);
  await select(page);
  await host(page).locator('.lp-image img').click();
  await expect(host(page).locator('.lp-image')).toHaveCount(0);
  expect(await read(page)).toBe(changed);
  await host(page).evaluate(el => el.markdownEditor.setSource('Replacement\n\nNo rendering.'));
  await select(page, 3);
  await old.evaluate(el => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  expect(await host(page).evaluate(el => el.markdownEditor.view.state.selection.main.head)).toBe(3);
  expect(await read(page)).toBe('Replacement\n\nNo rendering.');
});

test('unsupported diagram and malformed math retain direct and keyboard source access', async ({ page }) => {
  await open(page);
  const fallback = 'Before\n\n\\(\\frac{\\)\n\n```mermaid\nsequenceDiagram\nA->>B:Hi\n```\n\nAfter';
  await host(page).evaluate((el, value) => el.markdownEditor.setSource(value), fallback);
  await select(page);
  await expect(host(page).locator('.lp-math-status')).toBeVisible();
  await host(page).locator('.lp-math code').click();
  await expect(host(page).locator('.lp-math')).toHaveCount(0);
  await select(page);
  const edit = host(page).getByRole('button', { name: 'Edit Mermaid source', exact: true });
  await edit.focus();
  await page.keyboard.press('Enter');
  await expect(host(page).locator('.lp-diagram')).toHaveCount(0);
  expect(await read(page)).toBe(fallback);
});

test('small image pixels remain editable without hitting enlargement', async ({ page }) => {
  await open(page);
  await host(page).evaluate(el => el.markdownEditor.setSource('Before\n\n![Tiny](images/tiny.png)\n\nAfter'));
  await select(page);
  const image = host(page).getByRole('img', { name: 'Tiny', exact: true });
  await expect.poll(() => image.evaluate(el => el.complete && el.naturalWidth)).toBe(16);
  const box = await image.boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(host(page).locator('.lp-image')).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('broken image leaves one text fallback and remains editable', async ({ page }) => {
  await open(page);
  await host(page).evaluate(el => el.markdownEditor.setSource('Before\n\n![Broken](images/direct-broken.png)\n\nAfter'));
  await select(page);
  await expect(host(page).getByText('Image unavailable: Broken', { exact: true })).toBeVisible();
  await expect(host(page).locator('.lp-image img')).not.toBeVisible();
  await expect(host(page).getByRole('button', { name: 'Enlarge image: Broken' })).not.toBeVisible();
  await host(page).getByText('Image unavailable: Broken', { exact: true }).click();
  await expect(host(page).locator('.lp-image')).toHaveCount(0);
});
