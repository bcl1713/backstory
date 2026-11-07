import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { runtime } from './support/server.js';
const host = page => page.locator('[data-markdown-editor]');
const line = page => host(page).evaluate(el => { const s = el.markdownEditor.view.state; return s.doc.lineAt(s.selection.main.head).number; });
const chart = '{"data":{"values":[{"category":"A","value":2},{"category":"B","value":4}]},"mark":"bar","encoding":{"x":{"field":"category","type":"nominal"},"y":{"field":"value","type":"quantitative"}}}';
const cases = [
  ['table', '| Name | Value |\n| --- | --- |\n| A | 2 |', '.lp-table'],
  ['image', '![Geometry](images/geometry.png)', '.lp-image img'],
  ['inline-math', 'Formula \\(\\frac{a}{b}\\) beside prose.', '.lp-math-ready'],
  ['display-math', '$$\n\\frac{a}{b}\n$$', '.lp-math-ready'],
  ['mermaid', '```mermaid\ngraph TD\n A --> B\n B --> C\n```', '.lp-diagram iframe'],
  ['graphviz', '```graphviz\ndigraph {a->b->c}\n```', '.lp-diagram iframe'],
  ['mixed', '```mermaid\ngraph TD\n A --> B\n```\n\n![Geometry](images/geometry.png)\n\n$$\n\\frac{a}{b}\n$$\n\n| Name | Value |\n| --- | --- |\n| A | 2 |', '.lp-table'],
  ['vega-lite', '```vega-lite\n' + chart + '\n```', '.lp-diagram iframe'],
].map(([name, body, selector]) => {
  const before = Array.from({ length: 8 }, (_, i) => `Before ${i + 1}.`);
  const after = Array.from({ length: 16 }, (_, i) => `After ${i + 1}.`);
  return { name, selector, end: before.length + 1 + body.split('\n').length, source: [...before, '', body, '', ...after].join('\n') };
});
test.beforeAll(async () => {
  await mkdir(`${runtime}/wiki/images`, { recursive: true });
  execFileSync('.venv/bin/python', ['-c', 'from PIL import Image; import sys; Image.new("RGB", (800, 400), (40, 80, 150)).save(sys.argv[1])', `${runtime}/wiki/images/geometry.png`]);
  for (const c of cases) await writeFile(`${runtime}/wiki/Geometry-${c.name}.md`, c.source);
});
for (const c of cases) for (const vim of [false, true]) test(`${vim ? 'Vim' : 'arrows'} upward geometry below ${c.name}`, async ({ page }, testInfo) => {
  await page.goto('/accounts/login/');
  await page.getByLabel('Username').fill('slice');
  await page.getByLabel('Password').fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.goto(`/notes/Geometry-${c.name}.md`);
  await expect(page.locator('[data-editor-stage]')).toHaveAttribute('data-editor-state', 'ready');
  await expect(host(page).locator(c.selector)).toBeVisible();
  if (['mermaid', 'graphviz', 'vega-lite'].includes(c.name)) await expect(host(page).locator('.lp-diagram-status')).toContainText(c.name === 'vega-lite' ? 'chart.' : c.name === 'mermaid' ? 'flowchart.' : 'diagram.');
  if (c.name === 'image') await expect.poll(() => host(page).locator('.lp-image img').evaluate(el => el.complete && el.naturalWidth > 0)).toBe(true);
  for (const width of [1180, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    if (vim) await page.screenshot({ path: `${runtime}/reports/geometry-${c.name}-${width}.png`, fullPage: true });
    for (const distance of [3, 7, 13]) {
      const start = c.end + distance;
      await host(page).evaluate(el => el.markdownEditor.setVimEnabled(true));
      await page.locator('.cm-content').focus();
      await page.keyboard.type(`${start}G`);
      await expect.poll(() => line(page)).toBe(start);
      await host(page).evaluate((el, enabled) => el.markdownEditor.setVimEnabled(enabled), vim);
      const geometry = await host(page).evaluate(el => {
        const v = el.markdownEditor.view, pos = v.state.selection.main.head, coords = v.coordsAtPos(pos);
        const block = v.elementAtHeight(coords.top - 8 - v.documentTop);
        return { start: v.state.doc.lineAt(pos).number, coords, documentTop: v.documentTop,
          heightMapTarget: { fromLine: v.state.doc.lineAt(block.from).number, top: block.top, bottom: block.bottom, type: block.type },
          widgets: [...el.querySelectorAll('.lp-table,.lp-image,.lp-math,.lp-diagram')].map(e => ({ className: e.className, height: e.getBoundingClientRect().height, marginTop: getComputedStyle(e).marginTop, marginBottom: getComputedStyle(e).marginBottom })) };
      });
      await testInfo.attach(`geometry-${width}-${distance}`, { body: JSON.stringify(geometry), contentType: 'application/json' });
      await page.keyboard.press(vim ? 'k' : 'ArrowUp');
      expect.soft(await line(page), JSON.stringify({ width, distance, ...geometry })).toBe(start - 1);
      await page.keyboard.press(vim ? 'j' : 'ArrowDown');
      expect.soft(await line(page)).toBe(start);
    }
  }
  if (vim) {
    const start = c.end + 13;
    await page.keyboard.type(`${start}G2k`);
    expect(await line(page)).toBe(start - 2);
    await page.keyboard.type(`${start}Gd2k`);
    const lines = c.source.split('\n');
    lines.splice(start - 3, 3);
    expect(await host(page).evaluate(el => el.markdownEditor.getSource())).toBe(lines.join('\n'));
    await page.keyboard.type('u');
  }
  // Move through the lower boundary twice: source reveals, then renders again.
  for (let repeat = 0; repeat < 2; repeat++) {
    await host(page).evaluate(el => el.markdownEditor.setVimEnabled(true));
    await page.keyboard.type(`${c.end + 3}G`);
    await host(page).evaluate((el, enabled) => el.markdownEditor.setVimEnabled(enabled), vim);
    for (let expected = c.end + 2; expected >= c.end; expected--) {
      await page.keyboard.press(vim ? 'k' : 'ArrowUp');
      expect(await line(page)).toBe(expected);
    }
    await host(page).evaluate(el => el.markdownEditor.view.dispatch({ selection: { anchor: 0 } }));
    await expect(host(page).locator(c.selector)).toBeVisible();
  }
  expect(await host(page).evaluate(el => el.markdownEditor.getSource())).toBe(c.source);
});
