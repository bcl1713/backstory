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

Inactive-line wikilinks and ordinary labeled Markdown links can be clicked,
tapped or focused with Tab and followed with Enter. Move into their line with
the arrow keys to edit Markdown directly; selections reveal source on each line
they intersect. Missing, ambiguous and unavailable targets cannot be followed.
Navigating away from an unsaved draft still requires the existing confirmation.

Today shows the browser-local date and named timezone. It opens an existing
date-named note through the safe resolver; it never creates one. Recently
modified notes use the existing index and recheck current path policy/existence.
See [preview and navigation details](preview.md) for syntax and index boundaries.

Colors are shared CSS custom properties, providing the foundation for #3;
user-facing color customization remains a separate follow-up. The palette comes
from [Tokyo Night Night](https://github.com/folke/tokyonight.nvim/blob/main/extras/windows_terminal/tokyonight_night.json).
[JetBrains Mono v2.304](https://github.com/JetBrains/JetBrainsMono/tree/v2.304)
is included under the [SIL Open Font License](../assets/fonts/OFL.txt); builds
copy the font and its license into local static assets. No font service is used.
