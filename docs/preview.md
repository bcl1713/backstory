# Preview and attachments

Preview renders CommonMark with GFM tables, strikethrough, autolinks and disabled
task checkboxes. Raw HTML is displayed as text. A separate nh3 allowlist sanitizes
the generated fragment; the application CSP permits only local scripts, styles
and images. External links remain ordinary navigation. External embedded images
show a placeholder without fetching their URL. Missing, excluded and non-raster
image targets show an unavailable placeholder. SVG and HTML never render inline.

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
