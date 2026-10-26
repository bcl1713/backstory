# Editing in Zen

Notes open in Zen: a centered writing column with a Tokyo Night Night background
and self-hosted JetBrains Mono. **Menu** reveals the file tree, Today, recently
modified notes, presentation controls and draft tools. Use **Ctrl/⌘ Shift .** to
toggle the same controls; **Escape** returns to the editor. A formatting proposal
uses Escape first to dismiss the proposal. The Menu, Save, Format, readiness and
save status remain available while navigation is hidden. Save failures,
formatting diagnostics, proposals, sign-in recovery and conflicts stay visible.

The **File tree** sits near the top of the menu. Expand a folder to browse it
without leaving the current draft, then select a file to open it. Directories
appear before files, alphabetically ignoring case. The tree highlights the
current note and opens its visible parent folders. **Show more** loads another
page within the tree; **Open folder** opens the full folder listing. The same
ordering applies to full folder listings.

On wide screens, the enhanced editor's content area is 80ch, excluding its
padding. Smaller screens reduce that width. The starting text is 16px with a 1.5
line height; headings retain the body font, size, advance and line height.
Heading levels remain semantic, and moving the caret into a heading reveals its
Markdown markers. Browser zoom and text resizing remain available. Tabs and wide
Unicode glyphs can occupy multiple character cells; decorated text and ligatures
do not promise exactly 80 arbitrary source characters on every visual row.
Ligatures, including arrows, change only glyph presentation, never characters.
The column width does not change Prettier's printWidth or formatting settings.

Choose **Live preview** for inline rendering, **Raw source** for the enhanced
source editor, or **Plain text fallback** for complete document source in one
textarea. The selected button and readiness label identify the visible
presentation. Edits made while the enhanced editor loads are retained. All
presentations share the same draft, and switching never saves or formats it.

Open notes check authoritative source every five seconds while visible, when the
tab regains focus, and after a browser tool finishes writing the same note. A
clean editor reloads automatically. Changes in separate passages merge into an
unsaved draft; only **Save** publishes your local edits. Source checks pause
during editor operations, formatting review and text composition.

Overlapping changes keep your draft and loaded base intact. A persistent
**External note changes** banner offers comparison, copy/download and another
check. **Reload current source** reads again and asks before discarding unsaved
edits. If the disk or draft changes during that decision, review again.
**Accept current revision for manual merge** retains the draft while adopting
the freshly checked disk version as the next save base; edit and Save explicitly.
Deleted/moved notes, unavailable storage and failed reads retain the draft.

Refreshes map the selection and preserve scrolling where possible. Each refresh
or automatic merge is a separate undo step. Undo restores text only: the latest
adopted revision remains the save base, and restored differences are unsaved.
Formatting, source recovery and conditional-save checks still apply. Historical
revision views keep their selected snapshot instead of following live changes.

Inactive-line wikilinks and ordinary labeled Markdown links can be clicked,
tapped or focused with Tab and followed with Enter. Move into their line with
the arrow keys to edit Markdown directly; selections reveal source on each line
they intersect. Missing, ambiguous and unavailable targets cannot be followed.
Navigating away from an unsaved draft still requires the existing confirmation.

Today shows the browser-local date and named timezone. It opens an existing
date-named note through the safe resolver; it never creates one. Recently
modified notes use the existing index and recheck current path policy/existence.
See [preview and navigation details](preview.md) for syntax and index boundaries.

Open **Menu → Color scheme → Import Alacritty theme** and select a theme `.toml`
file, for example from [Alacritty themes](https://github.com/alacritty/alacritty-theme).
The editor, plain text fallback and wiki interface immediately use its colors.
The choice is remembered in this browser for this Backstory installation;
**Restore Tokyo Night** returns to the default. If browser storage is disabled,
colors can still be changed for the current page. Theme changes preserve your
draft, undo history, document bytes, formatting settings and writing-column size.

Choose a file with `colors.primary.background` and `colors.primary.foreground`.
The importer also uses normal/bright ANSI accents, cursor and selection colors.
It accepts ordinary TOML tables, dotted keys, inline tables, `#RRGGBB` and legacy
`0xRRGGBB` strings, plus Alacritty's `CellForeground`/`CellBackground` references
for cursor and selection. Light and dark themes work. Files are limited to
256 KiB. Invalid files leave your current colors in place. The primary text pair
must have at least 4.5:1 contrast; faint accents fall back to readable palette
colors. Selection text may be adjusted for readability.

Only colors are imported. Files are read locally in the browser; font/window
settings and referenced `import` files are ignored. If your `alacritty.toml` only
imports another theme, choose that theme's palette file directly.

The default palette comes from
[Tokyo Night Night](https://github.com/folke/tokyonight.nvim/blob/main/extras/windows_terminal/tokyonight_night.json).
[JetBrains Mono v2.304](https://github.com/JetBrains/JetBrainsMono/tree/v2.304)
is included under the [SIL Open Font License](../assets/fonts/OFL.txt); builds
copy the font and its license into local static assets. No font service is used.
