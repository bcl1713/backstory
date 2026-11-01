# Editing in Zen

Notes open in Zen: a centered writing column with a Tokyo Night Night background
and self-hosted JetBrains Mono. **Menu** reveals the file tree, Today, recently
modified notes, presentation controls and draft tools. Use **Ctrl/⌘ Shift .** to
toggle the same controls; **Escape** returns to the editor. A formatting proposal
uses Escape first to dismiss the proposal. Format, Vim bindings and recovery/restore controls are under **Menu**. Only Menu
and Save remain as persistent toolbar buttons; readiness and
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

**Vim bindings** under **Menu** enables optional modal editing for
the current editor. **Ctrl/⌘ Shift Space** toggles them while the enhanced editor is focused.
The Menu control remains available on touch devices or when the browser/OS captures
the shortcut (for example, ChromeOS uses Ctrl+Shift+Space to switch input languages).
Ctrl/⌘ Space without Shift still requests link completion. Desktop startup defaults
to **Normal**, phones to **Off**; an explicit choice is remembered in this browser. The persistent status reports
Normal, Insert, Visual or Visual line; the same button disables bindings at any
time, including on mobile. Live preview and Raw source keep the current mode,
selection and undo history. Plain text fallback suspends bindings and stays an
ordinary textarea; returning to the enhanced editor resumes in Normal mode.

Supported starting mappings:

| Key | Action |
| --- | --- |
| `h` / `j` / `k` / `l`, `w` / `b`, `gg` / `G` | Move in Normal mode |
| `i` / `a` | Enter Insert mode before / after the cursor |
| `Escape` | Return to Normal from Insert or Visual |
| `v` / `V` | Start character / line Visual selection |
| `d` in Visual | Delete selected source |
| `u` / `Ctrl+R` in Normal | Undo / redo using the shared editor history |
| `gf` / `gh` in Normal | Follow the link at the caret / go home |
| `Tab` / `Shift+Tab` | Leave the editor for ordinary page controls |

Escape first dismisses an open formatting proposal, then an open Menu; another
Escape in the editor returns to Normal. **Ctrl/⌘ S** keeps Backstory's guarded
Save behavior, and **Ctrl/⌘ Shift .** still toggles navigation in every mode.
Location, find, new tab/window, close tab and print shortcuts stay with the
browser. **Ctrl+R** is Vim redo while this editor has focus; use the browser's
reload control to refresh. Other browser/OS shortcuts may take precedence or
conflict with upstream Vim mappings. No global letter shortcuts are installed.
Use Menu and Tab/Enter for the existing file tree, Search, Today and recent notes.

The integration uses [`@replit/codemirror-vim` 6.4.0](https://github.com/replit/codemirror-vim)
under the MIT license, shipped at `/static/licenses/codemirror-vim.txt`. This is
a bounded Vim integration, with no promise of full Neovim parity or user-defined mappings.
Vim `:w` is not connected to Backstory saves; use Backstory's Save button or
shortcut. This integration does not promise full Neovim command parity.

Type **`[[`** in note text to complete an existing-note wikilink. Suggestions
match paths, filenames, titles and aliases, with the path shown beside each
choice so duplicate names remain distinguishable. Use **↑/↓ and Enter**, or tap
a suggestion. A chosen alias produces, for example,
`[[/Completion/Atlas.md|Terra]]`; otherwise the note title supplies the readable
label. Existing heading fragments, custom labels and closing brackets are
preserved. Acceptance is one undoable edit, and uses the existing autosave and
conflict handling. Dismissing suggestions leaves the typed source intact.

Completion works in Live preview and Raw source, with standard editing or Vim
Insert mode. **Escape** dismisses suggestions before a second Escape returns to
Vim Normal. **Tab** leaves the editor without accepting. **Ctrl/⌘ Space** requests
suggestions explicitly when the browser/OS permits it. In Vim, enter Insert mode
first. Plain text fallback remains ordinary editable source.

Suggestions come from the last indexed names, with current path policy and file
metadata rechecked. Up to 20 existing notes are offered; type more to narrow a
large result set. Index lag, partial indexing and unavailable suggestions are
reported separately from save status. Completion never creates a target note.
Code, front matter, tables, HTML, images, escaped syntax and a link's existing
label/heading portion do not activate suggestions. Filenames containing wikilink
delimiters (`#`, `|`, brackets or backslashes) are omitted; use an appropriate
ordinary Markdown link for those files. No heading/tag/front-matter-value,
ordinary Markdown link, language-server or AI completion is included.

User edits save automatically after five seconds without another change.
**Save** and **Ctrl/⌘ S** remain available. The status shows **Saving**, **Saved**
only when the current draft is persisted, or **Needs attention** with recovery
instructions. Edits made during a request stay in the draft; saves run one at a
time. Returned formatting maps the caret and scroll position and is undoable.
Conflicting formatting retains newer text and asks for explicit review.

The 80ch column wraps visually while typing. Leaving an edited paragraph, whole
list or table can format that block through the existing full-document
Prettier/markdownlint configuration, including configured prose wrapping.
Enter within an ongoing paragraph, list or table does not format a physical
line. Formatting does not move focus and has its own undo step.

Block formatting uses a conservative fallback: if the full-document result
changes other blocks, uncertain syntax or newline conventions, it is deferred
until Save. Front matter, fenced code, blockquotes, incomplete parses and plain
text fallback use full formatting on Save. Stale replies and results touching
the active selection are also deferred. Every save, including autosave, still
runs the complete formatting and validation pipeline.

Formatter, network/storage and sign-in errors pause automatic writes and retain
the draft. Further typing does not retry a failed or conflicting request.
Review the diagnostics or current disk version, sign in if needed, then choose
Save explicitly. **Save source without formatting** remains an explicit recovery
choice. Copy/download and protected drafts remain available. New notes need a
valid filename; linked-note creation drafts, protected recovered drafts and
historical views require an explicit first save/restoration. Composition pauses
automatic changes.

Open notes check authoritative source every five seconds while visible, when the
tab regains focus, and after a browser tool finishes writing the same note. A
clean editor reloads automatically. Changes in separate passages merge into an
unsaved draft. A reload or merge cancels pending autosave; local differences stay
unsaved until another user edit starts a new idle period or you choose **Save**.
Source checks pause during editor operations, formatting review and text
composition.

After a failed source check, a successful authoritative read clears the read
warning, including when the disk revision is unchanged. Recovery leaves any
local differences unsaved until another user edit or explicit Save. Formatting,
sign-in, conflicting or uncertain write failures keep their own pause and still
require explicit resolution.

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
they intersect. Missing wikilinks keep their warning color and offer **Create
Note** with the intended filename prefilled. Review the filename, enter content,
and choose **Create note** explicitly; previewing or activating a link creates
nothing on disk. Headings and display labels stay part of the original link,
not the new filename. Folders must already exist.

Ambiguous names and aliases open a destination chooser. Select an existing note,
or explicitly enter a new Markdown path. Unavailable storage or incomplete link
resolution offers no creation action. Attachments and external links retain
their existing behavior.

When the source has unsaved changes, creating a linked note opens a separate tab;
your source draft and undo history stay in the original tab. If the browser
blocks the tab, an explicit new-tab link remains beside the save status. Link
resolution refreshes when you return. Other navigation away from an unsaved
draft still requires confirmation.

If another writer creates the target first, the creation draft stays intact and
**Open existing note** offers access to that note. Creation never adopts its
revision for overwriting. Successful creation opens the saved note; a delayed
discovery/index update is reported separately from save success.

Pending or failed saves retain the unsaved-work protection. Closing the browser
before a save completes does not guarantee persistence; retain a copy when needed.

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

### Keyboard-first startup and navigation

Desktop layouts with a fine pointer start with the editor focused in Vim Normal
mode. Phones start with Vim off and do not open the keyboard automatically.
A manual Vim toggle is remembered only in this browser, overriding the default;
blocked browser storage does not prevent changing the mode for the current page.
Startup never takes focus from a control already being used, and heading links
retain their caret/scroll destination.

In Vim Normal mode, press `g` then `f` to follow the wiki or Markdown link under
the text caret, or `g` then `h` to return to the home page. These are sequences,
not simultaneous chords. Navigation retains ordinary unsaved-draft protection
and missing-note handling; it does not save or create a note automatically.
Code, images, and plain text are not link targets. Menu navigation remains
available. The decorative active-editor left stripe is removed; caret and other
control focus indicators remain.

### Live tables

Inactive GFM tables render within the same 80ch note column, with subtle row
separators and wrapping inside cells. Moving the caret or a selection into a
table reveals its entire Markdown source for normal editing, Vim and automatic
block formatting. Rendering does not save or rewrite source. Raw-source mode
always shows the original table.

Emphasis, code and link labels render safely. Table links are display-only:
enter source to edit them; the existing `gf` and completion exclusion for tables
is unchanged. Images and HTML remain literal text, never loaded or executed.
Wide unbroken cell text wraps rather than widening the document.

### Open an existing note

Press **Ctrl+Alt+O** (Control+Option+O on macOS), or choose **Menu → Open note**.
Search a path, title or alias, then use the arrow keys and Enter to open a result.
Tab also visits ordinary result links. Escape or Cancel returns focus to where
you started, without changing the draft or Vim mode. Unsaved-draft protection
still applies when opening a note. The chooser does not save or create files.

Results use the existing note index, with at most 20 matches. Incomplete or stale
index results are identified; refine the query or use the file tree if needed.
A failed lookup is not a statement that the wiki has no matching files.
Custom browser extensions or OS shortcuts may intercept Ctrl+Alt+O; the Menu
entry remains available, including on phones. Browser bookmark shortcuts are
not replaced, and the always-visible Zen toolbar remains Menu and Save.

This deliberately completes a narrow keyboard-discovery increment. Wikilink
completion already supports existing paths, titles and aliases; heading, tag,
and frontmatter completion are deferred until a concrete editing workflow needs
them. Wider Vim mappings are likewise not a promise of Neovim parity: `gf` and
`gh` provide note navigation, while `:w` remains unconnected to Backstory saves.
Use Save or the documented save shortcut rather than assuming a Vim command
has persisted your draft.

## Upload an image

Open Menu → Upload image to place a validated raster in the existing assets folder.
Uploading does not change your note; choose Insert into draft to append its Markdown,
then the usual Save and idle-autosave behavior applies. See
[formats, limits and safe retries](image-uploads.md).
