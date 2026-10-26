import test from 'node:test';
import assert from 'node:assert/strict';
import { contrast, parseAlacrittyTheme, validateTheme } from '../../static/src/theme-palette.js';

const primary = '[colors.primary]\nbackground = "#1a1b26"\nforeground = "#c0caf5"\n';

test('imports real TOML tables, comments, optional ANSI accents and legacy hex', () => {
  const theme = parseAlacrittyTheme('\ufeff' + primary + `
[colors.normal]
blue = '0x7AA2F7' # Links
magenta = '#bb9af7'
cyan = '#7dcfff'
green = '#9ece6a'
yellow = '#e0af68'
red = '#f7768e'
[colors.cursor]
cursor = 'CellForeground'
[colors.selection]
background = '#283457'
text = 'CellForeground'
[font]
size = 99
`);
  assert.equal(theme.background, '#1a1b26');
  assert.equal(theme.foreground, '#c0caf5');
  assert.equal(theme.link, '#7aa2f7');
  assert.equal(theme['heading-1'], '#bb9af7');
  assert.equal(theme.error, '#f7768e');
  assert.equal(theme.cursor, '#c0caf5');
  assert.equal(theme.selection, '#283457');
  assert.equal(theme['selection-text'], '#c0caf5');
  assert.equal(theme['color-scheme'], 'dark');
  assert.equal(theme.size, undefined);
});

test('imports inline tables, dotted and quoted keys without requiring ANSI colors', () => {
  const theme = parseAlacrittyTheme(`
colors."primary" = { background = '#ffffff', foreground = '#202020' }
colors.cursor.cursor = 'CellBackground'
colors.selection = { background = 'CellForeground', text = 'CellBackground' }
`);
  assert.equal(theme.background, '#ffffff');
  assert.equal(theme.foreground, '#202020');
  assert.equal(theme['color-scheme'], 'light');
  assert.equal(theme.cursor, '#202020'); // Invisible cursors fall back.
  assert.equal(theme.selection, '#202020');
  assert.equal(theme['selection-text'], '#ffffff');
  assert.ok(contrast(theme.link, theme.background) >= 4.5);
});

test('derives readable surfaces, accents and selections for dark and light themes', () => {
  for (const [background, foreground] of [['#000000', '#ffffff'], ['#ffffff', '#000000'], ['#777777', '#000000']]) {
    const theme = parseAlacrittyTheme(`
colors.primary = { background = '${background}', foreground = '${foreground}' }
colors.normal = { blue = '${background}', red = '${background}', yellow = '${background}' }
colors.selection = { background = '${foreground}', text = '${foreground}' }
`);
    for (const surface of ['background', 'surface', 'surface-raised']) {
      for (const text of ['foreground', 'muted', 'link', 'error', 'heading-1', 'heading-6']) {
        assert.ok(contrast(theme[text], theme[surface]) >= 4.5, `${text} on ${surface}`);
      }
      assert.ok(contrast(theme.focus, theme[surface]) >= 3);
    }
    assert.ok(contrast(theme['selection-text'], theme.selection) >= 4.5);
    assert.ok(contrast(theme.cursor, theme.background) >= 3);
  }
  assert.equal(contrast('#000000', '#ffffff'), 21);
});

test('uses bright accents when normal accents are absent', () => {
  const theme = parseAlacrittyTheme(primary + '[colors.bright]\nblue = "#7aa2f7"\n');
  assert.equal(theme.link, '#7aa2f7');
});

test('rejects malformed, missing, unreadable and unsafe colors without interpreting CSS', () => {
  for (const source of [
    '', '[colors.primary', 'colors = []',
    'colors.primary = { background = "#000000" }',
    'colors.primary = { background = "#111111", foreground = "#222222" }',
    primary + '[colors.normal]\nred = "red"',
    primary + '[colors.cursor]\ncursor = 123',
    primary + '[colors.selection]\nbackground = "url(https://example.invalid/tracker)"',
    primary + '[colors.normal]\nblue = "#fff; --note-font:serif"',
    primary + '[colors.normal]\nred = "#12345"',
    primary + '[colors.normal]\nblue = "CellForeground"',
    primary + '[colors]\nnormal = "#123456"',
    primary + '[colors.primary]\nbackground = "#000000"',
  ]) assert.throws(() => parseAlacrittyTheme(source), undefined, source);
});

test('import-only files explain that the actual palette file is needed', () => {
  assert.throws(() => parseAlacrittyTheme('[general]\nimport = ["~/themes/dracula.toml"]'), /palette file/i);
});

test('bounds input bytes and validates every persisted token before applying CSS', () => {
  assert.throws(() => parseAlacrittyTheme(primary + '# ' + 'x'.repeat(262144)), /256 KiB/);
  assert.throws(() => parseAlacrittyTheme(primary + '# ' + 'é'.repeat(140000)), /256 KiB/);
  const theme = parseAlacrittyTheme(primary);
  assert.deepEqual(validateTheme(theme), theme);
  for (const invalid of [null, {}, {...theme, background:'url(evil)'}, {...theme, link:'#000000'}, {...theme, 'color-scheme':'evil'}]) {
    assert.throws(() => validateTheme(invalid));
  }
  const clean = validateTheme({...theme, 'note-font':'serif', '--evil':'url(evil)'});
  assert.equal(clean['note-font'], undefined);
  assert.equal(clean['--evil'], undefined);
});
