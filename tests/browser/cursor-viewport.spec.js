import { revealChrome } from './support/chrome.js';
import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { runtime } from './support/server.js';

const source = '# Cursor visibility\n\n' + Array.from({ length: 240 }, (_, n) => `Line ${String(n).padStart(3, '0')} stays editable.`).join('\n') + '\n';
const content = page => page.getByRole('textbox', { name: 'Markdown editor', exact: true });

async function open(page, vim, presentation = 'Live preview') {
  await writeFile(`${runtime}/wiki/CursorViewport.md`, source);
  await page.goto('/accounts/login/');
  await page.getByLabel('Username', { exact: true }).fill('slice');
  await page.getByLabel('Password', { exact: true }).fill('synthetic-slice-browser-only');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.goto('/notes/CursorViewport.md');
  await expect(content(page)).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  if (presentation === 'Raw source') {
    await page.keyboard.press('Control+Shift+Period');
    await page.getByRole('button', { name: 'Raw source', exact: true }).click();
    await page.keyboard.press('Control+Shift+Period');
  }
  if (vim) {
    await revealChrome(page);
    await page.getByRole('button', { name: 'Vim bindings', exact: true }).click();
    await page.keyboard.press('Control+Shift+Period');
  }
  await content(page).focus();
}

async function cursorGeometry(page) {
  return page.locator('[data-markdown-editor]').evaluate(el => {
    const view = el.markdownEditor.view;
    const cursor = view.coordsAtPos(view.state.selection.main.head);
    const overlays = [...document.querySelectorAll('.persistent-actions, [data-sync-banner]')]
      .filter(node => !node.hidden).map(node => node.getBoundingClientRect());
    const viewport = window.visualViewport;
    const top = Math.max(viewport?.offsetTop || 0, ...overlays.map(rect => rect.bottom));
    const bottom = (viewport?.offsetTop || 0) + (viewport?.height || innerHeight);
    return { visible: Boolean(cursor && cursor.top >= top && cursor.bottom <= bottom),
      cursorTop: cursor?.top, cursorBottom: cursor?.bottom, top, bottom,
      pageScroll: scrollY, editorScroll: view.scrollDOM.scrollTop,
      editorHeight: view.scrollDOM.clientHeight };
  });
}

for (const width of [1180, 390]) {
  for (const vim of [false, true]) {
    for (const presentation of ['Live preview', 'Raw source']) test(`${width}px ${vim ? 'Vim' : 'standard'} ${presentation}: movement keeps the caret inside the visible editor`, async ({ page }) => {
      await page.setViewportSize({ width, height: 640 });
      await open(page, vim, presentation);
      if (vim) await page.keyboard.type('G');
      else await page.keyboard.press('Control+End');
      await expect.poll(() => cursorGeometry(page)).toMatchObject({ visible: true });
      if (vim) await page.keyboard.type('100k');
      else for (let n = 0; n < 100; n++) await page.keyboard.press('ArrowUp');
      await expect.poll(() => cursorGeometry(page)).toMatchObject({ visible: true });
      if (vim) await page.keyboard.type('100j');
      else for (let n = 0; n < 100; n++) await page.keyboard.press('ArrowDown');
      await expect.poll(() => cursorGeometry(page)).toMatchObject({ visible: true });
      if (vim) await page.keyboard.type('gg');
      else await page.keyboard.press('Control+Home');
      await expect.poll(() => cursorGeometry(page)).toMatchObject({ visible: true });
      // A narrower or shorter window changes both the toolbar wrapping and
      // the viewport bottom. Subsequent movement must use those new bounds.
      await page.setViewportSize({ width, height: 420 });
      if (vim) await page.keyboard.type('G50k');
      else {
        await page.keyboard.press('Control+End');
        for (let n = 0; n < 50; n++) await page.keyboard.press('ArrowUp');
      }
      await expect.poll(() => cursorGeometry(page)).toMatchObject({ visible: true });
      // Browsing away from the caret is allowed; movement brings it back.
      const before = await page.evaluate(() => scrollY);
      await page.mouse.wheel(0, -1800);
      await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(before);
      if (vim) await page.keyboard.type('j');
      else await page.keyboard.press('ArrowDown');
      await expect.poll(() => cursorGeometry(page)).toMatchObject({ visible: true });
      expect(await page.locator('[data-markdown-editor]').evaluate(el => el.markdownEditor.getSource())).toBe(source);
    });
  }
}

for (const width of [1180, 390]) test(`${width}px Vim paging and reversed Visual selections keep the head visible`, async ({ page }) => {
  await page.setViewportSize({ width, height: 640 });
  await open(page, true);
  for (const key of ['Control+d', 'Control+d', 'Control+u']) {
    await page.keyboard.press(key);
    await expect.poll(() => cursorGeometry(page)).toMatchObject({ visible: true });
  }
  for (const keys of ['G100k', 'v60k', '120j']) {
    await page.keyboard.type(keys);
    await expect.poll(() => cursorGeometry(page)).toMatchObject({ visible: true });
  }
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-vim-mode]')).toHaveText('Vim · Normal');
});

for (const width of [1180, 390]) test(`${width}px Vim keeps the caret below the synchronization warning`, async ({ page }) => {
  await page.setViewportSize({ width, height: 760 });
  await open(page, true);
  await page.route('**/tools/read/**', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.locator('[data-sync-banner]')).toBeVisible();
  await content(page).focus();
  await page.keyboard.type('G100k');
  await expect.poll(() => cursorGeometry(page)).toMatchObject({ visible: true });
  await page.keyboard.type('100j');
  await expect.poll(() => cursorGeometry(page)).toMatchObject({ visible: true });
  expect(await page.locator('[data-markdown-editor]').evaluate(el => el.markdownEditor.getSource())).toBe(source);
});
