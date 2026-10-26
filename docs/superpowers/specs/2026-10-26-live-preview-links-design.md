# Live-preview links (#7)

## Intent and scope

Render supported wikilinks, including extensionless paths and display aliases,
consistently with safe server preview. Keep exact Markdown authoritative and
preserve existing save, conflict, recovery and navigation protections.

Work proceeds through #7, #8, then #1. This change supplies link behavior that
survives Zen presentation. Theme customization (#3) remains later work; link
styles must be independently addressable without changing font metrics.

## Approaches and selected interaction

- An explicit Follow link action keeps every ordinary click available for
  editing, but adds an interaction before navigation. This was proposed and the
  user chose direct navigation instead.
- Direct navigation from rendered links is the selected approach. The user
  accepts using arrow keys to enter a link's line for editing.

The active boundary is a source line, not an entire paragraph or list item:

- On a line outside every caret/selection, show a wikilink's display alias, or
  its target when unaliased. Resolved labels are actual accessible links.
- Clicking/tapping a rendered link follows its safely resolved destination.
  Tab and Enter can focus and activate it without entering source-editing mode.
- A caret on the link's source line reveals editable Markdown on that line.
  A selection reveals links on every line it intersects. This behavior depends
  on the editor selection, not hover or whether the editor currently has focus.
- Ordinary supported inline Markdown links use the same interaction. Raw source
  and plain-text fallback always retain their complete source presentation.
- Following a link retains the existing unsaved-draft guards. Same-document
  heading links retain the existing heading navigation and undo behavior.

## Implementation constraints

Extend the existing Markdown syntax parser and live-preview decorations; do not
rewrite source or serialize rendered DOM back into Markdown. Code, escapes,
front matter and unsupported syntax remain source text. Multiline link syntax
may remain source text as the current preview does.

Use the existing authenticated safe resolver for destinations, including exact
paths, extensionless paths, aliases/identifiers and heading fragments. Keep
missing, ambiguous, excluded and unavailable results non-navigable with an
understandable status. Do not guess URLs or loosen target/sanitization rules.
Bound resolution work and ignore responses for superseded source. DOM labels
are text, never unsanitized HTML.

## Verification

Use synthetic browser fixtures to prove aliased/unaliased wikilink labels and
destinations, ordinary Markdown links, keyboard/touch activation, line-based
source reveal, multiline selections, code/escape exclusions, missing and
ambiguous targets, asynchronous edits and mode switching without source changes.
Check unsaved navigation cancellation and same-note heading navigation. Retain
the existing source/newline/undo/save/conflict regression checks.

Baseline: 27 focused Python link/preview tests pass. Browser tests need the
matching Playwright Chromium executable installed before they can run.
