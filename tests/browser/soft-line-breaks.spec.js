import { test, expect } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { runtime } from './support/server.js';
import { revealChrome } from './support/chrome.js';
import { waitForEnhancedEditor } from './support/editor-ready.js';

// Exact public issue fixture. Never format this input: the source wraps matter.
const source = 'A paragraph with an ordinary source wrap\nbefore the next words.\n\n- [ ] A task with an ordinary source wrap\n      before a [link](https://example.com) and some more text.\n';
const phase = process.env.ISSUE177_PHASE || 'acceptance';
const host = page => page.locator('[data-markdown-editor]');
const read = page => host(page).evaluate(el => el.markdownEditor.getSource());

// Compare painted characters with an independently laid-out, single-space
// paragraph in the same font and available width. Source newlines/indentation
// cannot accidentally satisfy this by merely having the right DOM textContent.
async function flow(page, from, to, expected) {
  return host(page).evaluate((el, { from, to, expected }) => {
    const view = el.markdownEditor.view;
    const line = view.contentDOM.querySelector('.cm-line');
    const style = getComputedStyle(line);
    const reference = document.createElement('div');
    for (const key of ['font', 'letterSpacing', 'lineHeight', 'wordBreak', 'overflowWrap', 'whiteSpace', 'tabSize']) reference.style[key] = style[key];
    reference.style.cssText += `;position:absolute;visibility:hidden;left:0;top:0;width:${line.getBoundingClientRect().width}px;padding:0;border:0;`;
    reference.textContent = expected;
    document.body.appendChild(reference);
    const actual = [];
    for (let pos = from; pos < to; pos++) {
      const char = view.state.doc.sliceString(pos, pos + 1);
      if (/\s/.test(char)) continue;
      const rect = view.coordsAtPos(pos, 1);
      actual.push({ char, x: rect.left, y: rect.top });
    }
    const wanted = [];
    for (let pos = 0; pos < expected.length; pos++) {
      if (/\s/.test(expected[pos])) continue;
      const range = document.createRange();
      range.setStart(reference.firstChild, pos); range.setEnd(reference.firstChild, pos + 1);
      const rect = range.getBoundingClientRect();
      wanted.push({ char: expected[pos], x: rect.left, y: rect.top });
    }
    const normalize = values => values.map(({ char, x, y }) => ({ char, x: Math.round((x - values[0].x) * 100) / 100, y: Math.round((y - values[0].y) * 100) / 100 }));
    reference.remove();
    return { width: innerWidth, available: line.getBoundingClientRect().width, actual: normalize(actual), wanted: normalize(wanted), lines: [...view.contentDOM.querySelectorAll('.cm-line')].map(line => line.textContent) };
  }, { from, to, expected });
}

test('soft source wraps paint as spaces in live preview while source and block boundaries survive', async ({ page, browser }) => {
  await mkdir(`${runtime}/reports`, { recursive: true });
  await writeFile(`${runtime}/wiki/SoftBreaks.md`, source);
  await writeFile(`${runtime}/reports/${phase}-source.md`, source);
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/accounts/login/');
  await page.getByLabel('Username').fill('slice');
  await page.getByLabel('Password').fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.goto('/notes/SoftBreaks.md');
  await waitForEnhancedEditor(page);
  await host(page).evaluate(el => el.markdownEditor.view.dispatch({ selection: { anchor: el.markdownEditor.getSource().indexOf('\n\n') + 1 } }));
  await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeVisible();
  await expect(host(page).getByRole('link', { name: 'link', exact: true })).toHaveAttribute('href', 'https://example.com');
  const measurements = { browser: browser.version(), editor: [], reading: [] };
  for (const width of [390, 560]) {
    await page.setViewportSize({ width, height: 900 });
    await page.screenshot({ path: `${runtime}/reports/${phase}-editor-${width}.png`, fullPage: true });
    const paragraph = await flow(page, 0, source.indexOf('\n\n'), 'A paragraph with an ordinary source wrap before the next words.');
    const task = await flow(page, source.indexOf('- [ ]'), source.indexOf('[link]'), '- [ ] A task with an ordinary source wrap before a ');
    measurements.editor.push({ ...paragraph, task });
  }
  expect(await read(page)).toBe(source);
  expect(await readFile(`${runtime}/wiki/SoftBreaks.md`, 'utf8')).toBe(source);
  await page.goto('/preview/SoftBreaks.md');
  const reading = page.getByRole('region', { name: 'Markdown preview' });
  await expect(reading.getByRole('checkbox')).toBeDisabled();
  await expect(reading.getByRole('checkbox')).not.toBeChecked();
  for (const width of [390, 560]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(reading.getByRole('link', { name: 'link', exact: true })).toHaveAttribute('href', 'https://example.com');
    measurements.reading.push(await reading.evaluate(el => {
      const point = (root, word) => {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const index = walker.currentNode.textContent.indexOf(word);
          if (index < 0) continue;
          const range = document.createRange(); range.setStart(walker.currentNode, index); range.setEnd(walker.currentNode, index + word.length);
          return [...range.getClientRects()].map(r => ({ x: r.x, y: r.y, width: r.width, height: r.height }));
        }
      };
      return { width: innerWidth, html: el.innerHTML, wrap: point(el.querySelector('p'), 'wrap'), before: point(el.querySelector('p'), 'before'), checkboxes: el.querySelectorAll('input[type=checkbox]').length };
    }));
    await page.screenshot({ path: `${runtime}/reports/${phase}-reading-${width}.png`, fullPage: true });
  }
  await writeFile(`${runtime}/reports/${phase}-measurements.json`, JSON.stringify(measurements, null, 2));
  // First meaningful RED is deliberately after both actual-view captures.
  // Reintroducing source-line boundaries must fail the painted layout contract.
  for (const measured of measurements.editor) {
    expect(measured.actual, `natural paragraph flow at ${measured.width}px`).toEqual(measured.wanted);
    expect(measured.task.actual, `natural task flow at ${measured.width}px`).toEqual(measured.task.wanted);
  }
  for (const measured of measurements.reading) {
    expect(measured.before[0].y).toBe(measured.wrap[0].y);
    expect(measured.before[0].x - measured.wrap[0].x - measured.wrap[0].width).toBeCloseTo(9.6, 2);
  }
  expect(measurements.editor[0].actual.find(p => p.char === 'b').y).toBeGreaterThan(measurements.editor[1].actual.find(p => p.char === 'b').y);

  // The existing reading checkbox is intentionally disabled; interaction cannot
  // mutate the source. Task markers are edited through the actual source editor.
  await reading.getByRole('checkbox').click({ force: true });
  await expect(reading.getByRole('checkbox')).not.toBeChecked();
  expect(await readFile(`${runtime}/wiki/SoftBreaks.md`, 'utf8')).toBe(source);
  await page.goto('/notes/SoftBreaks.md');
  await waitForEnhancedEditor(page);
  await page.setViewportSize({ width: 390, height: 900 });
  await revealChrome(page);
  await page.getByRole('button', { name: 'Raw source', exact: true }).click();
  await page.locator('[data-zen-toggle]').click();
  expect(await read(page)).toBe(source);
  expect(await host(page).locator('.cm-line').allTextContents()).toContain('      before a [link](https://example.com) and some more text.');
  await page.screenshot({ path: `${runtime}/reports/${phase}-raw-390.png`, fullPage: true });
  const marker = source.indexOf('[ ]') + 1;
  await host(page).evaluate((el, marker) => {
    el.markdownEditor.setVimEnabled(false);
    el.markdownEditor.view.dispatch({ selection: { anchor: marker, head: marker + 1 } });
  }, marker);
  await host(page).locator('.cm-content').focus();
  await page.keyboard.insertText('x');
  const checked = source.replace('[ ]', '[x]');
  expect(await read(page)).toBe(checked);
  await page.keyboard.press('Control+z');
  expect(await read(page)).toBe(source);
  expect(await readFile(`${runtime}/wiki/SoftBreaks.md`, 'utf8')).toBe(source);
  // Save intentionally runs the repository's formatter. This rendering test
  // preserves that policy and checks the checked reading state on seeded data.
  await writeFile(`${runtime}/wiki/CheckedSoftBreaks.md`, checked);
  await page.goto('/preview/CheckedSoftBreaks.md');
  await expect(page.getByRole('checkbox')).toBeChecked();
  await expect(page.getByRole('checkbox')).toBeDisabled();

  const boundaries = 'Anchor\n\nSpaces hard  \nafter spaces\n\nSlash hard\\\nafter slash\n\nSeparate paragraph.\n\n- first item\n  continued first\n- second item\n\n- parent item\n  continued parent\n  - child item\n    continued child\n\n> quoted first\n> quoted second\n>\n> separate quote\n\n```text\ncode first\n  code second\n```\n';
  await writeFile(`${runtime}/wiki/SoftBreakBoundaries.md`, boundaries);
  await page.goto('/notes/SoftBreakBoundaries.md');
  await waitForEnhancedEditor(page);
  await page.setViewportSize({ width: 390, height: 1200 });
  const geometry = await host(page).evaluate((el, source) => {
    const view = el.markdownEditor.view;
    const point = word => {
      const rect = view.coordsAtPos(source.indexOf(word));
      return { x: rect.left, y: rect.top };
    };
    return Object.fromEntries(['Spaces', 'after spaces', 'Slash', 'after slash', 'Separate', 'first item', 'continued first', 'second item', 'parent item', 'continued parent', 'child item', 'continued child', 'quoted first', 'quoted second', 'separate quote', 'code first', 'code second'].map(word => [word, point(word)]));
  }, boundaries);
  await writeFile(`${runtime}/reports/${phase}-boundaries.json`, JSON.stringify(geometry, null, 2));
  await page.screenshot({ path: `${runtime}/reports/${phase}-boundaries.png`, fullPage: true });
  expect(geometry['after spaces'].y - geometry.Spaces.y).toBeCloseTo(24, 2);
  expect(geometry['after slash'].y - geometry.Slash.y).toBeCloseTo(24, 2);
  expect(geometry.Separate.y).toBeGreaterThan(geometry['after slash'].y + 24);
  expect(geometry['continued first'].y).toBe(geometry['first item'].y);
  expect(geometry['second item'].y).toBeGreaterThan(geometry['continued first'].y);
  expect(geometry['continued parent'].y).toBe(geometry['parent item'].y);
  expect(geometry['child item'].y).toBeGreaterThan(geometry['parent item'].y);
  expect(geometry['continued child'].y).toBe(geometry['child item'].y);
  expect(geometry['child item'].x).toBeGreaterThan(geometry['parent item'].x);
  expect(geometry['quoted second'].y).toBe(geometry['quoted first'].y);
  expect(geometry['separate quote'].y).toBeGreaterThan(geometry['quoted second'].y);
  expect(geometry['code second'].y).toBeGreaterThan(geometry['code first'].y);
  expect(await read(page)).toBe(boundaries);
  expect(await readFile(`${runtime}/wiki/SoftBreakBoundaries.md`, 'utf8')).toBe(boundaries);
});
