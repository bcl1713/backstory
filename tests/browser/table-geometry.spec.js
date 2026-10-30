import { test, expect } from '@playwright/test';
import { tableGeometryCases } from './support/table-geometry.js';
const host = page => page.locator('[data-markdown-editor]');
const lineNumber = page => host(page).evaluate(el => { const s = el.markdownEditor.view.state; return s.doc.lineAt(s.selection.main.head).number; });

for (const fixture of tableGeometryCases) for (const vim of [false, true]) {
  test(`${vim ? 'Vim' : 'arrows'} moves normally several lines below ${fixture.rows}-row table`, async ({ page }, testInfo) => {
    await page.goto('/accounts/login/');
    await page.getByLabel('Username').fill('slice');
    await page.getByLabel('Password').fill('synthetic-slice-browser-only');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.goto(`/notes/TableGeometry-${fixture.rows}-${vim}.md`);
    await expect(page.locator('[data-editor-stage]')).toHaveAttribute('data-editor-state', 'ready');
    for (const width of [1180, 560]) {
      await page.setViewportSize({ width, height: 1000 });
    for (const distance of [3, 7, 13]) {
      const start = fixture.tableEnd + distance;
      // Use Vim's real go-to-line to set up, then exercise real keys in both modes.
      await host(page).evaluate(el => el.markdownEditor.setVimEnabled(true));
      await page.locator('.cm-content').focus();
      await page.keyboard.type(`${start}G`);
      await expect.poll(() => lineNumber(page)).toBe(start);
      await host(page).evaluate((el, enabled) => el.markdownEditor.setVimEnabled(enabled), vim);
      const geometry = await host(page).evaluate(el => {
        const v = el.markdownEditor.view, pos = v.state.selection.main.head, coords = v.coordsAtPos(pos);
        const y = coords.top - 8, block = v.elementAtHeight(y - v.documentTop);
        return { start: v.state.doc.lineAt(pos).number, coords, documentTop: v.documentTop,
          heightMapTarget: { fromLine: v.state.doc.lineAt(block.from).number, top: block.top, bottom: block.bottom, type: block.type },
          widget: [...el.querySelectorAll('.lp-table')].map(e => ({ height: e.getBoundingClientRect().height, marginTop: getComputedStyle(e).marginTop, marginBottom: getComputedStyle(e).marginBottom })) };
      });
      await testInfo.attach(`geometry-${width}-${distance}`, { body: JSON.stringify(geometry), contentType: 'application/json' });
      await page.keyboard.press(vim ? 'k' : 'ArrowUp');
      expect(await lineNumber(page), JSON.stringify(geometry)).toBe(start - 1);
      await page.keyboard.press(vim ? 'j' : 'ArrowDown');
      expect(await lineNumber(page)).toBe(start);
    }
    }
    if (vim) {
      const start = fixture.tableEnd + 13;
      await page.keyboard.type(`${start}G2k`);
      expect(await lineNumber(page)).toBe(start - 2);
      await page.keyboard.type(`${start}Gd2k`);
      const lines = fixture.source.split('\n');
      lines.splice(start - 3, 3);
      expect(await host(page).evaluate(el => el.markdownEditor.getSource())).toBe(lines.join('\n'));
      await page.keyboard.type('u');
    }
    expect(await host(page).evaluate(el => el.markdownEditor.getSource())).toBe(fixture.source);
  });
}
