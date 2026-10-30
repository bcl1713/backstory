import { test, expect } from '@playwright/test';

const source = 'Before\n\n| Name | Value |\n| --- | --- |\n| unchanged | 7 |\n\nAfter';
const host = page => page.locator('[data-markdown-editor]');

for (const vim of [false, true]) {
  for (const direction of ['down', 'up']) {
    test(`${vim ? 'Vim Normal' : 'ordinary arrows'} enters a rendered table ${direction} without a mouse`, async ({ page }) => {
      await page.goto('/accounts/login/');
      await page.getByLabel('Username').fill('slice');
      await page.getByLabel('Password').fill('synthetic-slice-browser-only');
      await page.getByRole('button', { name: 'Sign in' }).click();
      await page.goto(`/notes/TableKeyboard-${vim ? 'vim' : 'arrows'}-${direction}.md`);
      await host(page).evaluate((el, vim) => el.markdownEditor.setVimEnabled(vim), vim);
      await page.locator('.cm-content').focus();
    await host(page).evaluate(el => {
      const view = el.markdownEditor.view;
      window.tableDebug = [];
      const dispatch = view.dispatch.bind(view);
      view.dispatch = (...specs) => {
        dispatch(...specs);
        window.tableDebug.push({kind:'dispatch', effects:specs.map(s => s.effects?.value), head:view.state.selection.main.head, widgets:view.dom.querySelectorAll('.lp-table').length});
      };
      const move = view.moveVertically.bind(view);
      view.moveVertically = (...args) => {
        const before = {kind:'move', from:args[0].head, forward:args[1], widgets:view.dom.querySelectorAll('.lp-table').length};
        const result = move(...args);
        window.tableDebug.push({...before,to:result.head});
        return result;
      };
    });
      // Navigate from the document edge with actual keys. Direct selection
      // dispatch into the table would miss a layout-driven navigation skip.
      if (vim) await page.keyboard.type(direction === 'down' ? 'gg' : 'G');
      else await page.keyboard.press(direction === 'down' ? 'Control+Home' : 'Control+End');
      await expect(page.locator('.lp-table')).toHaveCount(1);
      const key = vim ? (direction === 'down' ? 'j' : 'k') : (direction === 'down' ? 'ArrowDown' : 'ArrowUp');
      await page.keyboard.press(key);
      await page.keyboard.press(key);
      const line = await host(page).evaluate(el => { const s = el.markdownEditor.view.state; return s.doc.lineAt(s.selection.main.head).number; });
      expect(line, JSON.stringify(await page.evaluate(() => window.tableDebug))).toBe(direction === 'down' ? 3 : 5);
      await expect(page.locator('.lp-table')).toHaveCount(0);
      expect(await host(page).evaluate(el => el.markdownEditor.getSource())).toBe(source);
    });
  }
}

for (const direction of ['down', 'up']) {
  test(`Vim counts and delete/undo preserve source-line semantics entering ${direction}`, async ({ page }) => {
    await page.goto('/accounts/login/');
    await page.getByLabel('Username').fill('slice');
    await page.getByLabel('Password').fill('synthetic-slice-browser-only');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.goto(`/notes/TableKeyboard-count-${direction}.md`);
    await host(page).evaluate(el => el.markdownEditor.setVimEnabled(true));
    await page.locator('.cm-content').focus();
    await host(page).evaluate(el => {
      const view = el.markdownEditor.view;
      window.tableDebug = [];
      const dispatch = view.dispatch.bind(view);
      view.dispatch = (...specs) => {
        dispatch(...specs);
        window.tableDebug.push({kind:'dispatch', effects:specs.map(s => s.effects?.value), head:view.state.selection.main.head, widgets:view.dom.querySelectorAll('.lp-table').length});
      };
      const move = view.moveVertically.bind(view);
      view.moveVertically = (...args) => {
        const before = {kind:'move', from:args[0].head, forward:args[1], widgets:view.dom.querySelectorAll('.lp-table').length};
        const result = move(...args);
        window.tableDebug.push({...before,to:result.head});
        return result;
      };
    });
    const edge = direction === 'down' ? 'gg' : 'G';
    const motion = direction === 'down' ? 'j' : 'k';
    await page.keyboard.type(edge + 'lll');
    await expect(page.locator('.lp-table')).toHaveCount(1);
    await page.keyboard.type('2' + motion);
    expect(await host(page).evaluate(el => { const s = el.markdownEditor.view.state; return s.doc.lineAt(s.selection.main.head).number; }), JSON.stringify(await page.evaluate(() => window.tableDebug))).toBe(direction === 'down' ? 3 : 5);
    await expect(page.locator('.lp-table')).toHaveCount(0);
    await page.keyboard.type(edge);
    await expect(page.locator('.lp-table')).toHaveCount(1);
    await page.keyboard.type('d2' + motion);
    const changed = await host(page).evaluate(el => el.markdownEditor.getSource());
    if (direction === 'down') {
      expect(changed).not.toContain('| Name');
      expect(changed).toContain('| unchanged | 7 |');
    } else {
      expect(changed).toContain('| Name | Value |');
      expect(changed).not.toContain('| unchanged');
    }
    await page.keyboard.type('u');
    expect(await host(page).evaluate(el => el.markdownEditor.getSource())).toBe(source);
  });
}
