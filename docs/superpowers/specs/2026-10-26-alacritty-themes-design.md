# Alacritty color imports

Issue #3 gains a browser-local color preference so users can reuse widely
available Alacritty TOML themes. Import a file from the existing menu, apply its
palette immediately, remember it across navigation/reloads, and restore Tokyo
Night Night with one button. This implements the user's request against `dev`.

## Approach

Use the existing semantic CSS variables and the already packaged `smol-toml`
parser, made an explicit dependency. A server-side theme store would introduce
account settings and upload handling; a hand-written parser would miss valid
TOML syntax. Browser-local parsing and localStorage are the implementation choice
for this bounded feature. No preset catalog, theme editor or server API is needed.

Read `colors.primary`, `normal`, `bright`, `cursor` and `selection`; require
primary background/foreground and accept hex `#RRGGBB` and legacy `0xRRGGBB`.
Support dotted keys, inline tables, comments, BOM and CellForeground/CellBackground
where Alacritty permits them. Ignore unrelated configuration; never follow imports
or fetch resources. An import-only file explains that the actual palette file is
needed. Cap input at 256 KiB and keep the previous palette on failure.

Derive surfaces from the primary pair, map ANSI accents to headings, links,
focus and errors, and fall back to the primary foreground if an accent has
insufficient contrast. Reject an unreadable primary pair (contrast below 4.5:1).
Keep selection readable in the decorated editor and plain textarea. Set the
native color scheme from background luminance for light and dark palettes.

Persist only a bounded name and validated color values; revalidate stored data
before applying it. Storage failures keep imports usable for the current page
and explain that the choice cannot be remembered. Reset always clears applied
overrides. Existing typography, 80ch column, Markdown, drafts, history and save
behavior remain untouched. Controls stay in the menu and use semantic labels and
a polite status region. No script means the existing default remains usable.

## Validation

Unit checks cover TOML forms, mappings, contrast, malformed/incomplete inputs,
size limits and unsafe values. Browser checks cover import, persistence, reset,
invalid stored values, unavailable storage, light palettes, fixed editor geometry,
unchanged draft/history/disk, fallback presentation and the existing CSP.
