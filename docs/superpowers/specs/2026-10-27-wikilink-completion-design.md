# Wikilink completion (#2), second increment

The owner chose link completion over a keyboard note opener and approved the
proposed defaults, delegating remaining implementation details. Typing `[[`
offers existing notes; arrows and Enter choose a suggestion, Escape dismisses
it before leaving Vim Insert mode, and Tab continues ordinary focus navigation.
The chosen note becomes `[[/folder/note.md|Title or alias]]`.

## Approach

Reuse CodeMirror's maintained autocomplete extension and the existing SQLite
name index. A custom popup would duplicate focus/accessibility behavior; loading
the entire index into the browser would bypass existing bounded discovery.
The endpoint returns at most 20 notes from at most 300 indexed candidates, under
the existing SQLite work budget. Match names case-insensitively, including path,
basename, title and aliases, with exact and prefix matches ahead of substrings.
No note body reads, recursive scans, new services or schema migration are needed.

## Behavior and boundaries

- Suggestions operate in enhanced Live preview and Raw source, in standard
  editing or Vim Insert mode. Normal/Visual modes and plain fallback stay usable.
- Complete only the target of a same-line wikilink. Ignore escaped syntax,
  front matter, code, tables, HTML, images, and the label/heading portion of a link.
- Insert a literal root-relative path, not URL encoding. Preserve an existing
  heading fragment and custom label, and do not duplicate existing closing `]]`.
  Use a matching alias when available, otherwise the note title, for new labels.
- Exclude paths that cannot be represented by this wikilink grammar, including
  `#`, `|`, brackets, backslashes and line breaks. Unsafe labels fall back to a
  representable name or a path-only link. Duplicate names show distinct paths.
- Require the normal session, storage, path-policy, regular-file and freshness
  checks. Omit changed/deleted/forbidden candidates. Surface unavailable or
  incomplete suggestions; never interpret failure as permission to create notes.
- Bound queries to 256 characters and displayed titles/labels to 512 characters.
  Cancel obsolete requests and reject malformed responses. Treat labels as text.
- Acceptance is a single isolated history transaction. Popup activity does not
  save, navigate or format; the accepted user edit uses existing autosave rules.
- Keep common browser shortcuts and Tab intact. Provide Ctrl/Meta+Space to request
  suggestions explicitly where the browser/OS permits it, plus a discoverable
  clickable completion button for mobile and assistant access.
- Keep the popup within usable viewport space below sticky controls/warnings;
  style it with the current semantic palette and preserve caret visibility.

Completion for headings, tags, front matter values, ordinary Markdown links,
arbitrary prose, language servers and AI services remains outside this increment.

## Verification

Use real SQLite/storage fixtures for query matching, bounds, stale/excluded
notes, incomplete indexing and session failures. Browser tests index synthetic
notes and exercise actual completion, undo, mixed newlines, preserved suffixes,
Vim key priority, escape/tab/fallback, stale responses, unavailable storage,
mobile popup bounds and source remaining untouched on dismissal. Build assets
before starting test servers; do not rebuild while a server caches their lengths.
