# Issue #20: Create missing notes from wikilinks

Status: approved by the user on 2026-10-26; implementation in progress.

Issue: https://github.com/bcl1713/backstory/issues/20

Target: a new feature branch based on the latest `dev`, with a pull request
targeting `dev`. Preserve all unrelated changes in the existing checkout.

## Intent

A user can activate an unresolved internal wikilink, confirm its intended
destination using the existing Create Note editor, and create and edit that
note. Merely rendering or resolving a link must never write wiki content.
The source Markdown, link spelling, and displayed label remain unchanged.

## Existing behavior

`wiki/links.py` checks exact root/source-relative candidates before a bounded
indexed name lookup. `indexing/search.py` refuses to infer absence or uniqueness
from an unavailable or incomplete index. Live links and server preview currently
render unresolved links as noninteractive spans.

`wiki/views.py:new_note` validates an existing folder and renders the regular
note editor. Its save uses `If-None-Match: *` and `wiki/saves.py`; formatting,
readiness, path policy, symlink checks, and collision protection already exist.
The editor has draft navigation guards and protected draft storage.

## Approaches

1. **Extend the resolver and existing Create Note flow (recommended).** Return
   an explicit creation/selection action for eligible wikilinks and prefill the
   ordinary editor. This keeps one editor and one guarded write implementation.
2. **Add an inline creation dialog.** Avoids navigating away but duplicates
   creation, formatting, conflict, and accessibility behavior. Unnecessary for
   the requested small extension of note creation.
3. **Create immediately on link activation.** Fewer steps, but violates explicit
   confirmation and makes filename or ambiguity mistakes write wiki content.

The user approved the recommended extension of the existing flow.

## Proposed behavior

- Keep missing-link styling and add a semantic, keyboard-accessible link only
  when resolution establishes that a target is eligible for creation. Give it
  an accessible description such as “Create note: Projects/Idea.md”. Apply the
  same result in live preview and server-rendered preview.
- Share parsing and candidate construction with ordinary resolution. Preserve
  root-first/source-relative precedence, optional `.md`, literal percent signs,
  relative paths, display aliases, and heading fragments. A fragment belongs
  to navigation, never to the filename. A fragment on an existing note remains
  an ordinary existing-note link. Explicit root qualification must remain
  confined to the configured wiki root.
- The resolver must distinguish a genuinely absent eligible Markdown target
  from denied paths, unreadable files, symlinks, directories, missing parent
  folders, unavailable storage, and incomplete or stale name discovery.
  None of these uncertain or forbidden cases offers automatic creation.
- Existing attachments and external URLs retain their current behavior;
  attachment-like targets must not become invented Markdown filenames.
- Ambiguous names/aliases lead to a bounded chooser of authorized existing
  destinations. Offer explicit entry of a new Markdown path separately; do not
  select a candidate or invent an alias-derived filename automatically.
- Activation opens a read-only creation entry point which re-resolves the
  original target and validates the proposed path and existing parent folder.
  It renders the existing Create Note editor with the filename prefilled.
  No directory tree or template is created.
- If the target now exists, show an explicit Open existing note action. If it
  appears during editing or formatting, retain the creation draft, report the
  collision, and offer opening the existing note. Never adopt its revision as
  permission to overwrite it through the creation flow.
- For a dirty source editor, open the create/choose flow in a separate tab and
  leave the source draft and undo history in its original tab. Explain this
  behavior in accessible status text. If opening fails, keep the source and
  provide an explicit open-in-new-tab link. Clean editors can navigate normally.
  This is the proposed draft-preservation choice.
- Require an explicit Create note save through the existing authenticated,
  CSRF-protected revision-safe save endpoint. Recheck existence immediately
  before publication using the current collision protections.
- After creation the standard editor becomes the newly created note. Preserve
  any original fragment for navigation. Queue the existing index update and
  report an indexing delay separately from successful saving.
- Refresh live-link resolution when returning to the retained source tab so
  its original wikilink opens the newly created target without changing source.
  Use bounded re-resolution; do not schedule full scans from link rendering.

## Validation

Add focused resolver, preview, and creation integration coverage for path and
display-alias links, optional extensions, relative/root-qualified targets,
fragments, ambiguous names, existing and concurrently created notes, denied or
unavailable storage, attachments, and pending/partial indexes. Verify that
GET/resolve/preview operations create no files and preserve source bytes.

Browser coverage should exercise keyboard and mobile activation, filename
prefill, explicit creation, collision handling, retained unsaved source drafts,
index-delay messaging, and reopening the original link after creation. Run the
relevant Python and browser suites plus the asset build; broaden checks where
shared resolver and editor behavior changes warrant it.

## Boundaries and implementation choices

Use the existing Django backend, CodeMirror editor, preview sanitizer, and
synthetic test fixtures. No live wiki changes, new storage system, automatic
folder creation, new editor, or unrelated Markdown rewriting. Exact endpoint
names, result fields, chooser layout, and cache-invalidation mechanism remain
implementation details. Existing external-writer filesystem limitations still
apply; this feature must not weaken current creation collision guarantees.
