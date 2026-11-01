import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { runtime } from './support/server.js';
import { revealChrome } from './support/chrome.js';

const source = String.raw`Before

Inline \(x_1^2 + \frac{1}{\sqrt{x}}\) after; $5 and $10 stay literal.

\[
\begin{bmatrix}a&b\\c&d\end{bmatrix}
\]

$$
\begin{aligned}x&=y+1\\z&=2\end{aligned}
$$

\(\frac{\)

\(\includegraphics{/math-probe-private}\)

\(\href{https://example.invalid/math-probe-remote}{x}\)

\(\htmlStyle{background:url(/math-probe-css)}{x}\)

` + '`\\(code\\)` and \\\\(escaped\\)\n\n| Cell |\n| --- |\n| \\(table\\) |\n\nAfter\n';
const formatSource = 'Before\n\nInline \\(\\verb|a  b|\\).\n\nAfter';
const motionSource = 'Before\n\n$$\n\\begin{matrix}1\\\\2\\\\3\\\\4\\\\5\\\\6\\\\7\\\\8\\\\9\\\\10\\end{matrix}\n$$\n\nAfter';
const host = page => page.locator('[data-markdown-editor]');
const read = page => host(page).evaluate(el => el.markdownEditor.getSource());
const select = (page, anchor, head = anchor) => host(page).evaluate((el, selection) => el.markdownEditor.view.dispatch({ selection }), { anchor, head });
async function open(page, note = 'Math') {
  await page.goto('/accounts/login/');
  await page.getByLabel('Username').fill('slice');
  await page.getByLabel('Password').fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.goto(`/notes/${note}.md`);
  await expect(page.locator('[data-editor-stage]')).toHaveAttribute('data-editor-state', 'ready');
}
test.beforeAll(async () => {
  await mkdir(`${runtime}/wiki`, { recursive: true });
  await writeFile(`${runtime}/wiki/Math.md`, source);
  await writeFile(`${runtime}/wiki/MathMotion.md`, motionSource);
  await writeFile(`${runtime}/wiki/MathFormatting.md`, formatSource);
  await writeFile(`${runtime}/wiki/MathLazy.md`, 'Before\n\n`\\(code\\)`\n\n$5 and $10\n');
});

test('native math is local, semantic and source-preserving with fixed malformed fallback', async ({ page }) => {
  const requests = [], violations = [], sideEffects = [];
  page.on('request', request => { requests.push(request.url()); if (request.method() === 'POST' && /\/(?:save|format|draft)/.test(request.url())) sideEffects.push(request.url()); });
  await page.addInitScript(() => { window.mathViolations = []; document.addEventListener('securitypolicyviolation', event => window.mathViolations.push(event.violatedDirective)); });
  await open(page);
  await expect(host(page).locator('math')).toHaveCount(5); // Three formulas plus two inert unsupported trust commands.
  await expect(host(page).locator('.lp-math-status')).toHaveCount(2);
  await expect(host(page).locator('math mfrac')).toHaveCount(1);
  await expect(host(page).locator('math mtable')).toHaveCount(2);
  await expect(host(page).locator('math annotation').first()).toHaveText('x_1^2 + \\frac{1}{\\sqrt{x}}');
  expect(requests.filter(value => !['127.0.0.1', 'localhost'].includes(new URL(value).hostname))).toEqual([]);
  expect(requests.filter(value => value.includes('math-probe'))).toEqual([]);
  expect(requests.filter(value => new URL(value).pathname === '/static/math-renderer.js')).toHaveLength(1);
  expect(await page.evaluate(() => window.mathViolations)).toEqual(violations);
  expect(sideEffects).toEqual([]);
  expect(await read(page)).toBe(source);
  await expect(page.locator('[data-editor-status]')).toHaveText('Unchanged');
  await expect(host(page).locator('.lp-table')).toContainText('\\(table\\)');
});

test('code and currency do not load the renderer; delayed import cannot revive stale widgets or selection', async ({ page }) => {
  const rendererRequests = [];
  page.on('request', request => { if (request.url().endsWith('/static/math-renderer.js')) rendererRequests.push(request.url()); });
  await open(page, 'MathLazy');
  expect(rendererRequests).toEqual([]);
  let started, release;
  const waiting = new Promise(resolve => { started = resolve; });
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/static/math-renderer.js', async route => { const response = await route.fetch(); started(); await gate; await route.fulfill({ response }); });
  await host(page).evaluate(el => el.markdownEditor.setSource('Before\n\n\\(x\\)'));
  await waiting;
  await host(page).evaluate(el => el.markdownEditor.setSource('Replacement\n\nNo math.'));
  await select(page, 3);
  release();
  await expect(host(page).locator('.lp-math')).toHaveCount(0);
  expect(await read(page)).toBe('Replacement\n\nNo math.');
  expect(await host(page).evaluate(el => el.markdownEditor.view.state.selection.main.head)).toBe(3);
});

test('math source entry, selection, edit/undo and mode switches retain authoritative source', async ({ page }) => {
  await open(page);
  await expect(host(page).locator('math').first()).toBeVisible();
  await host(page).locator('math').first().click();
  expect(await host(page).evaluate(el => el.markdownEditor.view.state.selection.main.head)).toBe(source.indexOf('\\('));
  await expect(host(page).locator('math mfrac')).toHaveCount(0);
  await select(page, 0, source.length);
  await expect(host(page).locator('.lp-math')).toHaveCount(0);
  await select(page, 0);
  await host(page).evaluate(el => el.markdownEditor.setVimEnabled(false));
  await page.locator('.cm-content').focus();
  await page.keyboard.type('X');
  await page.keyboard.press('Control+z');
  expect(await read(page)).toBe(source);
  for (const mode of ['Raw source', 'Plain text fallback', 'Live preview']) {
    await revealChrome(page);
    await page.getByRole('button', { name: mode, exact: true }).click();
    if (mode !== 'Live preview') await expect(host(page).locator('.lp-math')).not.toBeVisible();
    expect(await read(page)).toBe(source);
  }
});

for (const vim of [false, true]) for (const direction of ['down', 'up']) test(`${vim ? 'Vim' : 'arrows'} enters tall display source ${direction} without skipping`, async ({ page }) => {
  await open(page, 'MathMotion');
  await expect(host(page).locator('math')).toBeVisible();
  await host(page).evaluate((el, value) => el.markdownEditor.setVimEnabled(value), vim);
  await page.locator('.cm-content').focus();
  if (vim) await page.keyboard.type(direction === 'down' ? 'gg' : 'G');
  else await page.keyboard.press(direction === 'down' ? 'Control+Home' : 'Control+End');
  const key = vim ? (direction === 'down' ? 'j' : 'k') : (direction === 'down' ? 'ArrowDown' : 'ArrowUp');
  await page.keyboard.press(key);
  await page.keyboard.press(key);
  expect(await host(page).evaluate(el => { const s = el.markdownEditor.view.state; return s.doc.lineAt(s.selection.main.head).number; })).toBe(direction === 'down' ? 3 : 5);
  await expect(host(page).locator('math')).toHaveCount(0);
  expect(await read(page)).toBe(motionSource);
});
for (const direction of ['down', 'up']) test(`Vim counts and delete/undo preserve display source-line semantics ${direction}`, async ({ page }) => {
  await open(page, 'MathMotion');
  await expect(host(page).locator('math')).toBeVisible();
  await host(page).evaluate(el => el.markdownEditor.setVimEnabled(true));
  await page.locator('.cm-content').focus();
  const edge = direction === 'down' ? 'gg' : 'G', motion = direction === 'down' ? 'j' : 'k';
  await page.keyboard.type(edge + '2' + motion);
  expect(await host(page).evaluate(el => { const s = el.markdownEditor.view.state; return s.doc.lineAt(s.selection.main.head).number; })).toBe(direction === 'down' ? 3 : 5);
  await page.keyboard.type(edge + 'd4' + motion);
  expect(await read(page)).not.toContain('\\begin{matrix}');
  await page.keyboard.type('u');
  expect(await read(page)).toBe(motionSource);
});
for (const width of [1180, 390]) test(`native math fits ${width}px with production CSP and screenshot evidence`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await open(page, 'MathMotion');
  await expect(host(page).locator('math')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const box = await host(page).locator('math').boundingBox();
  expect(box.height).toBeGreaterThan(80);
  expect(await host(page).locator('math').evaluate(el => getComputedStyle(el).fontFamily)).toContain('math');
  expect(await host(page).locator('math').evaluate(el => getComputedStyle(el).color === getComputedStyle(el.closest('.cm-content')).color)).toBe(true);
  await page.screenshot({ path: `${runtime}/reports/math-${width}.png`, fullPage: true });
  await host(page).evaluate(el => el.markdownEditor.setSource('Before\n\n$$' + 'x+'.repeat(150) + 'x$$\n\nAfter'));
  await expect(host(page).locator('math')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `${runtime}/reports/math-${width}-overflow.png`, fullPage: true });
});

test('GET and draft POST preview share inert placeholders and the same local renderer without saves', async ({ page }) => {
  await open(page);
  await page.goto('/preview/Math.md');
  await expect(page.locator('[aria-label="Markdown preview"] math')).toHaveCount(5);
  const response = await page.request.post('/preview/Math.md', { data: { source: 'Draft \\(\\frac{a}{b}\\)' }, headers: { 'X-CSRFToken': (await page.context().cookies()).find(cookie => cookie.name === 'csrftoken').value } });
  expect(response.ok()).toBe(true);
  const draft = await response.json();
  expect(draft.html).toContain('data-math-source');
  expect(draft.html).not.toContain('<math');
  await page.locator('[aria-label="Markdown preview"]').evaluate((el, html) => { el.innerHTML = html; window.backstoryMathPreview.hydrate(el); }, draft.html);
  await expect(page.locator('[aria-label="Markdown preview"] math mfrac')).toBeVisible();
  await page.goto('/notes/Math.md');
  await expect(page.locator('[data-editor-stage]')).toHaveAttribute('data-editor-state', 'ready');
  expect(await read(page)).toBe(source);
});

test('renderer loading failure leaves editable source and no renderer exception disclosure', async ({ page }) => {
  await page.route('**/static/math-renderer.js', route => route.fulfill({ status: 503, contentType: 'text/javascript', body: 'Unavailable' }));
  await open(page, 'MathMotion');
  await expect(host(page).locator('math')).toHaveCount(0);
  await expect(host(page).getByText('Math unavailable; source retained.', { exact: false })).toBeVisible();
  await expect(host(page).locator('code')).toContainText('\\begin{matrix}');
  await host(page).getByRole('button', { name: 'Edit math source', exact: true }).focus();
  await page.keyboard.press('Enter');
  expect(await host(page).evaluate(el => el.markdownEditor.view.state.selection.main.head)).toBe(motionSource.indexOf('$$'));
  expect(await read(page)).toBe(motionSource);
});

test('bounded hostile macros, source sizes and dimensions recover safely with isolated definitions', async ({ page }) => {
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  await open(page, 'MathLazy');
  const hostile = 'Before\n\n' + [String.raw`\(\def\a{\a\a}\a\)`, String.raw`\(\gdef\private{a}\private\)`, String.raw`\(\private\)`, '\\(' + '{'.repeat(40) + 'x' + '}'.repeat(40) + '\\)', '\\(' + 'x+'.repeat(2000) + '\\)', String.raw`\(\rule{999em}{999em}\)`, String.raw`\(\def\evil{\includegraphics}\evil{/math-probe-alias}\)`].join('\n\n');
  await host(page).evaluate((el, value) => el.markdownEditor.setSource(value), hostile);
  await expect(host(page).locator('.lp-math-status')).toHaveCount(4);
  await expect(host(page).locator('math')).toHaveCount(3);
  await expect(host(page).locator('math mspace[width="20em"][height="20em"]')).toHaveCount(1);
  expect(requests.filter(value => value.includes('math-probe'))).toEqual([]);
  expect(await read(page)).toBe(hostile);
  await host(page).evaluate(el => el.markdownEditor.setSource('Recovered\n\n\\(x+1\\)'));
  await expect(host(page).locator('math')).toBeVisible();
  expect(await read(page)).toBe('Recovered\n\n\\(x+1\\)');
});

test('switching to source during a delayed renderer load prevents stale math mounting', async ({ page }) => {
  let release, started;
  const gate = new Promise(resolve => { release = resolve; });
  const waiting = new Promise(resolve => { started = resolve; });
  await page.route('**/static/math-renderer.js', async route => { const response = await route.fetch(); started(); await gate; await route.fulfill({ response }); });
  await open(page, 'MathMotion');
  await waiting;
  await revealChrome(page);
  await page.getByRole('button', { name: 'Raw source', exact: true }).click();
  release();
  await expect(host(page).locator('.lp-math')).toHaveCount(0);
  expect(await read(page)).toBe(motionSource);
  await page.getByRole('button', { name: 'Live preview', exact: true }).click();
  await expect(host(page).locator('math')).toBeVisible();
  expect(await read(page)).toBe(motionSource);
});

test('math-containing blocks avoid automatic formatting and explicit formatting retains meaningful TeX spaces', async ({ page }) => {
  await open(page, 'MathFormatting');
  const source = formatSource;
  await host(page).evaluate(el => el.markdownEditor.setVimEnabled(false));
  const requests = [];
  page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/format/')) requests.push(request.url()); });
  await select(page, source.indexOf('Inline'));
  await page.locator('.cm-content').focus();
  await page.keyboard.insertText('New ');
  await select(page, (await read(page)).indexOf('After'));
  expect(requests).toEqual([]);
  const edited = source.replace('Inline', 'New Inline');
  expect(await read(page)).toBe(edited);
  await revealChrome(page);
  await page.locator('[data-format]').click();
  await expect(page.locator('[data-diagnostics]')).toContainText('Formatting would change mathematical source.');
  await expect(page.locator('[data-format-proposal]')).not.toBeVisible();
  expect(await read(page)).toBe(edited);
});
