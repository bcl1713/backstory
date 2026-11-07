import { parse } from 'smol-toml';

export const MAX_THEME_BYTES = 256 * 1024;
const accents = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
const textTokens = ['foreground', 'muted', 'link', 'error', ...Array.from({ length: 6 }, (_, i) => `heading-${i + 1}`)];
const surfaces = ['background', 'surface', 'surface-raised'];
const tokens = [...surfaces, ...textTokens, 'border', 'focus', 'cursor', 'selection', 'selection-text'];

function hex(value) {
  if (typeof value !== 'string' || !/^(?:#|0x)[\da-f]{6}$/i.test(value)) {
    throw new Error('Colors must use #RRGGBB or 0xRRGGBB hex values.');
  }
  return '#' + value.slice(-6).toLowerCase();
}
const channels = color => [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16));
function luminance(color) {
  const rgb = channels(color).map(value => {
    const c = value / 255;
    return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4;
  });
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}
export function contrast(a, b) {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
}
function mix(a, b, weight) {
  const x = channels(a), y = channels(b);
  return '#' + x.map((value, i) => Math.round(value * (1 - weight) + y[i] * weight).toString(16).padStart(2, '0')).join('');
}
function table(value) {
  if (value === undefined) return {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Color sections must be TOML tables.');
  return value;
}

// Only these values may reach CSS, including when loading browser preferences.
export function validateTheme(value) {
  if (!value || typeof value !== 'object') throw new Error('Invalid saved palette.');
  const theme = Object.fromEntries(tokens.map(token => [token, hex(value[token])]));
  if (!['light', 'dark'].includes(value['color-scheme'])) throw new Error('Invalid color scheme.');
  theme['color-scheme'] = value['color-scheme'];
  for (const surface of surfaces) {
    for (const token of textTokens) {
      if (contrast(theme[token], theme[surface]) < 4.5) throw new Error('Text colors need at least 4.5:1 contrast.');
    }
    if (contrast(theme.focus, theme[surface]) < 3) throw new Error('Focus color is not visible.');
  }
  if (contrast(theme.cursor, theme.background) < 3 || contrast(theme['selection-text'], theme.selection) < 4.5) {
    throw new Error('Cursor or selection colors are not readable.');
  }
  return theme;
}

export function parseAlacrittyTheme(source) {
  if (typeof source !== 'string' || new TextEncoder().encode(source).length > MAX_THEME_BYTES) {
    throw new Error('Choose a TOML file no larger than 256 KiB.');
  }
  let config;
  try {
    config = parse(source.replace(/^\ufeff/, ''), { unsafeKeyBehaviour: 'throw' });
  } catch {
    throw new Error('Invalid TOML. Choose an Alacritty color palette file.');
  }
  const colors = table(config.colors), primary = table(colors.primary);
  if (primary.background === undefined || primary.foreground === undefined) {
    throw new Error('Choose the palette file containing colors.primary.background and foreground. Referenced imports are not loaded.');
  }
  const background = hex(primary.background), foreground = hex(primary.foreground);
  if (contrast(background, foreground) < 4.5) throw new Error('Primary foreground and background need at least 4.5:1 contrast.');
  const normal = table(colors.normal), bright = table(colors.bright);
  for (const palette of [normal, bright]) {
    for (const name of accents) if (palette[name] !== undefined) palette[name] = hex(palette[name]);
  }
  const theme = { background, foreground };
  for (const [name, weight] of [['surface', .04], ['surface-raised', .08]]) {
    const color = mix(background, foreground, weight);
    theme[name] = contrast(color, foreground) >= 4.5 ? color : background;
  }
  const readable = (candidates, ratio = 4.5) => candidates.filter(Boolean).find(color => surfaces.every(surface => contrast(color, theme[surface]) >= ratio)) || foreground;
  const accent = (name, ratio) => readable([normal[name], bright[name]], ratio);
  theme.muted = readable([primary.dim_foreground === undefined ? null : hex(primary.dim_foreground), mix(foreground, background, .15)]);
  theme.border = readable([mix(background, foreground, .4)], 3);
  theme.link = accent('blue');
  theme.focus = accent('yellow', 3);
  theme.error = accent('red');
  ['magenta', 'blue', 'cyan', 'green', 'yellow'].forEach((name, i) => { theme[`heading-${i + 1}`] = accent(name); });
  theme['heading-6'] = foreground;
  const cellColor = (value, fallback) => value === undefined ? fallback : value === 'CellForeground' ? foreground : value === 'CellBackground' ? background : hex(value);
  const cursor = table(colors.cursor), selection = table(colors.selection);
  const cursorColor = cellColor(cursor.cursor, foreground);
  theme.cursor = contrast(cursorColor, background) >= 3 ? cursorColor : foreground;
  theme.selection = cellColor(selection.background, mix(background, foreground, .2));
  const selectionText = cellColor(selection.text, foreground);
  theme['selection-text'] = [selectionText, foreground, background, '#000000', '#ffffff'].find(color => contrast(color, theme.selection) >= 4.5);
  theme['color-scheme'] = luminance(background) > .179 ? 'light' : 'dark';
  return validateTheme(theme);
}
