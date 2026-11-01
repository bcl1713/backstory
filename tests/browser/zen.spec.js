import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { runtime } from './support/server.js';

const source = '# First heading\n\nBody with -> and => ligatures.\n\n## Second heading\n\nAnother line.\n';
async function open(page) {
  await writeFile(`${runtime}/wiki/Zen.md`, source);
  await page.goto('/accounts/login/');
  await page.getByLabel('Username').fill('slice');
  await page.getByLabel('Password').fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.goto('/notes/Zen.md');
  await expect(page.locator('.cm-content')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}
const read = page => page.locator('[data-markdown-editor]').evaluate(el => el.markdownEditor.getSource());

test('Zen starts with chrome hidden and accessible toggle/shortcut return focus to editing', async ({ page }) => {
  await open(page);
  const toggle = page.getByRole('button', { name: 'Navigation and controls', exact: true });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('navigation', { name: 'Main', exact: true })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Raw source', exact: true })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeVisible();
  await expect(page.locator('.persistent-actions button')).toHaveText(['Menu', 'Save', 'Upload image']);
  await expect(page.getByRole('button', { name: 'Format', exact: true })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Vim bindings', exact: true })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Complete link', exact: true })).toHaveCount(0);
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('link', { name: 'Search', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Raw source', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Format', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Vim bindings', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('.cm-content')).toBeFocused();
  await page.keyboard.press('Control+Shift+Period');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Control+Shift+Period');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(await read(page)).toBe(source);
});

for (const width of [1440, 390]) test(`Zen keeps the shared font grid and fits the viewport at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await open(page);
  await expect(page.locator('.persistent-actions button')).toHaveText(['Menu', 'Save', 'Upload image']);
  await page.locator('[data-markdown-editor]').evaluate(el => el.markdownEditor.view.dispatch({ selection: { anchor: el.markdownEditor.view.state.doc.length } }));
  const headings = page.locator('.lp-heading');
  await expect(headings).toHaveCount(2);
  await expect(headings.first()).toHaveAttribute('role', 'heading');
  await expect(headings.first()).toHaveAttribute('aria-level', '1');
  await expect(headings.nth(1)).toHaveAttribute('aria-level', '2');
  const metrics = await page.locator('.cm-content').evaluate(el => {
    const style = getComputedStyle(el);
    const heading = getComputedStyle(el.querySelector('.lp-heading'));
    const measure = document.createElement('span');
    measure.textContent = '0'.repeat(80);
    measure.style.font = style.font;
    document.body.append(measure);
    const eighty = measure.getBoundingClientRect().width;
    measure.remove();
    return { font: style.fontFamily, size: style.fontSize, line: style.lineHeight, ligatures: style.fontVariantLigatures,
      headingSize: heading.fontSize, headingLine: heading.lineHeight, headingFont: heading.fontFamily,
      contentWidth: el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight), eighty,
      background: getComputedStyle(document.body).backgroundColor, foreground: style.color };
  });
  expect(metrics.font).toContain('JetBrains Mono');
  expect(metrics.size).toBe('16px');
  expect(metrics.line).toBe('24px');
  expect(metrics.headingSize).toBe(metrics.size);
  expect(metrics.headingLine).toBe(metrics.line);
  expect(metrics.headingFont).toBe(metrics.font);
  expect(metrics.ligatures).toContain('common-ligatures');
  expect(metrics.background).toBe('rgb(26, 27, 38)');
  expect(metrics.foreground).toBe('rgb(192, 202, 245)');
  if (width === 1440) expect(Math.abs(metrics.contentWidth - metrics.eighty)).toBeLessThan(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `/tmp/backstory-release-one/reports/zen-${width}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Navigation and controls', exact: true }).click();
  await page.getByRole('button', { name: 'Raw source', exact: true }).click();
  expect(await read(page)).toBe(source);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('Zen retains visible save conflict, failure diagnostics and recovery actions', async ({ page }) => {
  await open(page);
  await expect(page.locator('.persistent-actions button')).toHaveText(['Menu', 'Save', 'Upload image']);
  await page.locator('[data-markdown-editor]').evaluate(el => el.markdownEditor.setSource('# Unsaved Zen draft\n'));
  await writeFile(`${runtime}/wiki/Zen.md`, '# External edit\n');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Revision conflict' })).toBeVisible();
  await expect(page.locator('[data-editor-status]')).toContainText('Revision conflict');
  expect(await read(page)).toBe('# Unsaved Zen draft\n');
  await expect(page.getByRole('button', { name: 'Navigation and controls', exact: true })).toHaveAttribute('aria-expanded', 'false');
  await page.screenshot({ path: '/tmp/backstory-release-one/reports/zen-conflict.png', fullPage: true });
});
