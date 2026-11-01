# Preview and attachments

Preview renders CommonMark with GFM tables, strikethrough, autolinks and disabled
task checkboxes. Raw HTML syntax is structurally recognized only to emit escaped
literal text tokens (including raw blocks and tag attributes), never raw HTML. A separate nh3 allowlist sanitizes
the generated fragment; the application CSP permits only local scripts, styles
and images. External links remain ordinary navigation. External embedded images
show a placeholder without fetching their URL. Missing, excluded and non-raster
image targets show an unavailable placeholder. SVG attachments and source HTML never render inline; generated Mermaid SVG stays inside its dedicated opaque renderer frame.

`render_preview(source, source_path)` returns an immutable `Preview(html,
diagnostics)` and never writes source. `/preview/<path>` accepts authenticated GET
for disk source or CSRF-protected JSON POST with a `source` string for an unsaved
draft. UTF-8 source is capped at the note limit; JSON transport has a separate
finite cap. POST returns `html` and fixed diagnostic codes. A parser failure
returns `preview_unavailable`; the note page and plain-source route still expose
the unchanged original text. Preview has no save or formatter side effects.

`resolve_link(source_path, target, kind)` returns an immutable `LinkResult(state,
href, label, action_href, create_path, choices)`. States are `resolved`,
`external`, `missing`, `ambiguous` or `unavailable`. The last three fields have
empty defaults; an action URL opens a read-only creation/selection entry point.
Unavailable results contain no candidate path or href. Markdown destinations are
source-relative URLs, decoded once. Wikilinks use literal paths, including literal
percent signs, and allow `[[path|label]]` with optional `.md`. They prefer exact
root-relative paths, then exact source-relative paths. Parent-relative links may
stay within the root. A leading `/` on a wikilink explicitly selects the wiki
root; it never addresses the host filesystem. Absolute Markdown paths,
outside-root paths, symlinks and excluded components cannot offer creation. When exact paths are absent, indexed aliases, IDs and basenames resolve only from a complete, current, unambiguous index.
Markdown can address filenames containing literal `#` using `%23`.

Enhanced-editor wikilink completion queries indexed paths, titles and aliases
through authenticated `GET /tools/complete/?query=...`. It checks current path
policy, regular-file status and indexed stat freshness, examines at most 300
candidates, and returns up to 20 suggestions under the shared SQLite work budget.
It does not read note bodies or scan folders. Queries are bounded to 256 Unicode
characters; display titles/labels to 512. Partial/limited results are explicit.
Canonical inserted targets begin with `/` and remain literal wiki paths;
completion does not URL-encode percent signs. Generated labels must fit the
existing wikilink grammar and resolver. Existing labels/fragments stay unchanged.
Unrepresentable filenames are omitted and no completion request creates a note.

Heading slugs lowercase Unicode text, remove punctuation other than underscores
and hyphens, trim whitespace, and replace whitespace runs with hyphens. An empty
slug becomes `section`. IDs start with `preview-` to avoid application-control
collisions. Duplicate headings add `-1`, `-2`, and so on, skipping IDs already
used by other headings. Fragments use the same convention; for example,
`#Hello%2C%20World!` points to `#preview-hello-world`. Link parsing uses Markdown
tokens and an inline wikilink rule; code and escaped wikilinks remain literal.
Each preview resolves at most 200 distinct destinations, then reports
`preview_link_limit`. No request scans the wiki for link candidates.

Authenticated `/attachments/<path>` supports GET and HEAD. Raster formats and
PDFs receive explicit inline MIME types and `nosniff`; active/unknown extensions
receive `application/octet-stream` and download disposition. Supported rasters
are PNG, JPEG, GIF, WebP, AVIF, BMP and ICO. MIME selection uses the extension,
not content conversion or signature validation. Wiki paths still require the
shared exclusion, storage-readiness and no-follow regular-file checks.

Full attachments have a hard 64 MiB cap; one requested byte range has a hard
8 MiB cap. Administrators may lower `BACKSTORY_ATTACHMENT_MAX_BYTES` and
`BACKSTORY_ATTACHMENT_RANGE_MAX_BYTES`. Malformed, multiple, empty or excessive
ranges return HTTP 416 with `Content-Range: bytes */<size>`. HEAD ignores Range.
Streams read at most 64 KiB at a time and stop at their advertised length, closing
on completion, cancellation or failure. A file that changes after streaming starts
can terminate the stream; headers already sent cannot be replaced with a later
error status. Normal mounted-filesystem race and blocking-I/O limits still apply.

Renderer configuration follows the [markdown-it-py API](https://markdown-it-py.readthedocs.io/en/latest/using.html),
the [task-list plugin API](https://mdit-py-plugins.readthedocs.io/en/latest/_modules/mdit_py_plugins/tasklists.html)
and the [nh3 allowlist API](https://nh3.readthedocs.io/en/stable/index.html).

Inline live preview recognizes wikilinks through its Markdown parser, including
`[[topics/example|Example topic]]`. Inactive lines show clickable labels resolved
by the same authenticated resolver as server preview. Move the caret onto a line
with the arrow keys to reveal its Markdown; selections reveal every intersected
line. Ordinary single-line labeled Markdown links behave the same way. Tab and
Enter follow rendered links; mouse/touch activation does not first move the caret
into their source. The normal unsaved-draft warning applies to ordinary navigation.

Missing eligible wikilinks keep their warning color and offer a prefilled
**Create Note** flow; ambiguous names offer an explicit destination chooser.
Creation checks require ready storage, a complete current index and an existing
parent folder. Unavailable or forbidden targets and missing attachments offer
no creation action. Rendering, hovering and GET requests never create notes.
An unsaved source draft stays in its tab while linked-note creation opens a
separate tab; a blocked popup leaves an explicit new-tab link. Resolution
refreshes on visible return or focus. Code, escaped syntax, front matter and unsupported
multiline links stay literal. Resolution is capped at 200 distinct destinations
with at most four requests in flight. Mode switches and rendering never edit source.

The presentation controls report exactly one active mode: **Live preview**, **Raw
source** (the enhanced, virtualized editor), or **Plain text fallback**. Choose
Plain text fallback for complete document source in one labeled textarea, including
front matter and the end of a long note. Loading and ready states are separate
from save status; edits made in the initial textarea while the enhanced editor
loads are retained. Switching presentations shares the current draft and never
saves or formats it.

**Today** uses the browser's local calendar date and named IANA timezone, both
shown next to the control. It resolves an existing `YYYY-MM-DD` note with the
normal exact-path/basename resolver; ambiguous or unavailable targets remain
non-navigable. It never creates a note. Reopening navigation or returning to the
browser refreshes the date across midnight or a timezone change. **Recently
modified** lists up to five eligible existing notes by indexed modification time,
with index readiness shown; opening one always reads current disk content. This
is index-backed navigation, not per-user visit tracking.

## Local images in the live editor

Inactive lines display ordinary Markdown images (`![description](photos/a.png)`)
and full, collapsed or shortcut reference images. Destinations are decoded with
Markdown escape/entity rules and passed to the existing authenticated resolver
as source-relative Markdown URLs, including percent-encoded filenames and
within-root parent-relative paths. Only resolved `/attachments/` raster targets
become image sources. No image destination is loaded directly. External,
scheme-relative, data and active URLs are blocked; missing, excluded, non-raster
and failed image loads show a safe text fallback. No rendering action writes,
formats or saves the note.

Images are lazy-loaded, constrained to the note width and viewport height, and
retain the source description as alternative text. **Enlarge image** opens a
local modal with a labeled close button; Escape closes it and restores button
focus without moving the editor selection. Click/tap the image itself or its
fallback to edit; the compact enlargement control is separate. Moving the
caret onto the line, or a selection intersecting the line reveals the original
Markdown. Arrow and Vim vertical motions reveal nearby image source before
navigation uses its geometry. Raw source and plain-text presentations always
retain the authoritative source and its existing undo history.

Math, image and diagram previews all support intentional click/tap to enter
source and render again when the caret leaves. Scrolling or dragging does not
activate editing. Tab reaches a native pencil button labeled **Edit … source**
that appears only while keyboard-focused; Enter/Space activates it. The focus outline marks
the preview, and math/image semantics remain separate from the button. Source
controls are also available to screen readers without adding permanent buttons
to prose. Rendering and activation never rewrite source.

This first stage intentionally leaves images inside table cells, images nested
inside a Markdown link, and image syntax spanning multiple lines as editable
literal source in live mode. Code, escaped images, HTML and front matter are not
reinterpreted. `![[wiki embeds]]` are not supported image syntax. The independent
server preview retains its existing Markdown image support, including table and
multiline contexts, but does not provide the live editor's enlargement modal.
Reference lookup and display are bounded to 200 definitions/images and 100,000
visited syntax nodes; excess or unresolved syntax stays literal source. At most
four image resolver requests run concurrently, with duplicate destinations
shared. Stale results cannot reintroduce removed image syntax; refresh on return
rechecks resolution. Attachment authentication, exclusions, MIME rules, byte caps
and application CSP are unchanged. Browser decoding still relies on the existing
attachment byte limits, not an image-pixel/dimension validator.

## Explicit mathematical notation

Live preview and the separate preview page share a locally bundled **KaTeX
0.19.1** renderer. Inline math uses `\(x^2\)` on one source line. Display math
uses standalone, column-zero `\[...\]` or `$$...$$` lines, or matching standalone
opening/closing lines around a paragraph-like formula. For example:

```text
\[
\frac{a}{b} + \sqrt{x}
\]
```

Bare dollars are never inline delimiters: `$5`, `$10` and `$x$` stay ordinary
text. Incomplete syntax and escaped delimiters stay source. Code spans/fences,
indented code, front matter, raw HTML, link/image labels and destinations, and
table cells are not math-enhanced. Inline math works in list/blockquote text;
display math inside nested blocks, display blocks containing internal blank
lines or interrupting Markdown block syntax, and indented/trailing-space display
delimiters are intentionally unsupported in this first stage. The editor and
server share delimiter/context fixtures. YAML front matter is presented as
escaped code in the separate preview, never interpreted as math.

The renderer uses supported direct DOM `render()` with `output: 'mathml'`.
Native MathML supplies semantic fractions, superscripts, radicals, accents,
matrices and aligned equations without a KaTeX stylesheet, downloaded fonts,
serialized HTML injection, or a CSP exception. Typography depends on native
browser MathML support; unsupported TeX, output requiring non-MathML styling,
and rendering/loading failures retain escaped source plus a fixed diagnostic.
This is mathematical notation, not a full TeX engine: packages, files, graphics,
links, HTML extensions and executable commands are not enabled. No note-selected
URL is loaded by math rendering.

Application-owned options always set `trust: false`, `strict: 'error'`,
`throwOnError: true`, `maxExpand: 200`, `maxSize: 20`, `globalGroup: false` and a
fresh macro object for every formula. A detached result must pass a positive
MathML namespace/element/attribute policy before mounting; links, images,
`mglyph`, SVG, style elements/attributes, event handlers and foreign namespaces
are rejected. Errors never expose KaTeX exception messages. Formula input is
limited to 2,048 characters, 512 lexical tokens, brace depth 32 and 64 array
separators. Generated output is limited to 4,096 nodes, depth 64 and 65,536 text
characters, with finite geometry. These are finite work budgets, not a promise
that synchronous library rendering can be forcibly timed out.

Each note enhances at most 100 formulas with at most 100 queued jobs, rendered
one per event-loop task; CodeMirror virtualization avoids mounting offscreen
widgets. Model extraction visits at most 100,000 syntax nodes. The renderer is a
separate lazy local ESM asset, not included in the editor's initial IIFE. No
formula DOM or macro state is cached across notes. Disposed, changed or selected
widgets cannot receive late results. Clicking/tapping math, its focus-revealed
**Edit math source** button, selection, and normal
arrow/Vim source-line navigation reveal the original notation; rendering never
calls save/format or changes source/undo history. Automatic block-exit formatting
skips blocks containing explicit math; the full-note formatter compares exact
parser-recognized math source before/after its passes and returns the original
source with `format-math-source` if a tool would rewrite it (including meaningful
spaces in `\verb`/`\text`). Ordinary surrounding Markdown may still format when
math is unchanged; configured line-ending conversion remains supported. Unlike
the 100-widget display limit, formatter signatures cover every recognized
formula; if the complete 100,000-visit verification budget is exhausted,
formatting refuses rather than comparing partial signatures. If a
formatted Save would rewrite TeX, the existing format-failure/recovery flow is
used: disk source is unchanged until the owner explicitly chooses **Save source
without formatting**. No save/recovery policy is bypassed. Wide/tall results scroll inside
the available width/height rather than expanding the page.

Server GET and draft-POST previews emit only application-generated, escaped,
inert math placeholders through the existing ordinary Markdown sanitizer. GET
loads the same local enhancer; without JavaScript, source and an explanatory
message remain visible. POST is a fragment API, not a rendered MathML response:
a consumer that mounts the sanitized fragment may call
`window.backstoryMathPreview.hydrate(container)` on a preview page to use the same
bounded enhancer. The ordinary sanitizer still admits no MathML/SVG/raw HTML;
attachment policy, authentication, source bytes, draft/formatter semantics and
application response policy remain unchanged.

## Mermaid diagrams

With an explicitly configured matching canonical application origin, inactive
complete top-level, column-zero `mermaid` fences display diagrams in the live
editor and separate preview. Both backtick and tilde fences work; incomplete,
nested, indented, other-language and extra-info fences remain ordinary source.
Configuration defaults to disabled: the editor creates no diagram widgets/frames
and preview does not load the diagram enhancer. See [renderer configuration,
accepted flowchart grammar and security boundary](mermaid-frame.md).

This is the bounded plain-flowchart subset described there, **not full Mermaid**.
The parser rejects unsupported syntax before allocating a renderer frame;
unsupported engines, labels or over-budget diagrams retain source with a clear
fixed fallback. No source is placed in a frame URL. SVG remains inside the
reviewed opaque sandbox; it is never imported into the editor/preview DOM.

Only visible diagrams allocate frames, at most **two live previews** per page.
Additional visible diagrams keep source and an explicit capacity status with a
**Show Mermaid diagram** button. Choosing it replaces the oldest active preview
with a paused source fallback. There is no automatic carousel or retry loop.
Scrolling away, selecting source, changing mode/document or destroying a widget
releases its frame. Scrolling back can resume eligible diagrams; failed source
is remembered within the bounded page cache and is not retried on every caret
or viewport update. Edit the source or reload after a loading/auth failure.

Click/tap a diagram or use its focus-revealed **Edit Mermaid source** button to
reveal the original fence and focus the editor without changing source, undo or
save state. Pointer interaction stays in the parent; the opaque iframe has no
edit authority and retains its sandbox and CSP. **Show Mermaid diagram** remains
a separate action for capacity/paused fallbacks. Ordinary arrows,
Vim motions/counts, selections and raw/plain-text modes use source-line semantics.
The formatter protects all parser-recognized Mermaid fences (including unsupported,
incomplete, nested and extra-info/case variants), independently of the 32-widget
presentation limit. Automatic formatting skips blocks containing such fences;
explicit formatting refuses any fence/source rewrite or incomplete safety-budget
scan with `format-mermaid-source`, retaining the original source and existing
explicit unformatted-save recovery. Surrounding Markdown/EOL conversion can still
format when diagram source is unchanged. Existing math protections stay in force.

Server GET and draft POST use only escaped inert `pre[data-mermaid-source]`
placeholders through the ordinary sanitizer; raw note HTML cannot forge them.
Without JavaScript/configuration the source stays readable. Draft-fragment
consumers on an enabled preview may call
`window.backstoryMermaidPreview.hydrate(container)`. **Show Mermaid source** pauses
a preview and restores its code without navigating or writing anything.

Real browser compatibility, layout, source navigation, CSP/network behavior and
worst-case responsiveness must pass CI before release. Screenshot tests require
actual visual inspection; authored tests alone do not establish a visual pass.
CI retains image, math, direct-edit and Mermaid PNGs from the shared browser
runtime's `reports` directory.
## Graphviz diagrams

Explicit `graphviz` and `dot` fences support bounded networks and dependency graphs after the separate Graphviz origin opt-in. Click/tap a rendered graph or use its keyboard source control to edit; leaving the source renders it again. Unsupported or failed graphs remain source. See [supported DOT syntax, limits and isolated worker policy](graphviz-frame.md). This is not full DOT compatibility.

Explicit `vega-lite` fences support bar, line and point charts from bounded inline records after their separate origin opt-in. Charts use the same direct source editing and keyboard controls as diagrams. Unsupported syntax remains readable source. See [chart fields, limits and isolated interpreter policy](vega-lite-frame.md).
