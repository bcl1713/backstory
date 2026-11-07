# Five-second idle autosave and block-exit formatting (#18)

Design for `codex/idle-autosave`, based on `dev` at `9b319f2`.
User directed continuation after the proposed approach. Existing uncommitted
work in the primary checkout is excluded.

## Intent and constraints

Keep writing fluid: visually wrap the existing 80ch column, save after five
seconds without user changes, and format an edited Markdown block after leaving
it. Retain manual Save and the existing full-document Prettier/markdownlint,
authentication, conditional writes, conflict review and recovery paths. Do not
change wiki configuration, deploy, or write live notes.

## Approach

Use the existing full-document formatter for every formatting operation, and
conservatively apply block-exit output only when all changes are contained in
the exited structural block and its adjacent whitespace. This retains Markdown
context and avoids a second formatter. Reuse #16's bounded diff/merge and
selection/scroll mapping helpers.

Formatting isolated source slices would lose front matter, reference, list and
fence context. Applying all formatting on every block exit could reflow the
active block. Both alternatives violate the requested writing experience.
Full-document context plus guarded application is the recommended approach.

## Autosave and operation coordination

Track a monotonically increasing draft generation and an explicit distinction
between user edits and programmatic changes. User typing, pasting and undo/redo
reset a five-second timer. Formatting responses, external reloads/merges and
base/revision bookkeeping do not start another timer. No countdown is displayed.

Use one operation gate for manual saves, autosave, formatting, source recovery,
restoration, tool saves and external synchronization. Coalesce pending automatic
work. If the timer expires during an operation, recheck current state when it
finishes; submit only the latest eligible dirty draft. IME composition suspends
automatic requests and source replacement; completion with source changes starts
a fresh idle period. Ordinary named new notes may autosave only with a valid
filename; opening a new-note form alone never creates a file. Recovered drafts
and historical restoration views require an explicit first Save/Restore.

Capture submitted source, generation and base revision with every request.
After confirmed persistence, adopt the returned source/revision together. Apply
returned formatting directly when the submitted draft is still current. With
newer typing, use a three-way merge of submitted source, current draft and
returned formatted source. Apply only an unambiguous merge and retain newer
edits as dirty. Otherwise retain the exact current draft, explain that saved
formatting could not be reconciled, and pause automatic writes for explicit
review. Never replace newer text or report Saved for an unpersisted draft.

Show subtle Saving, Saved and Needs attention states, preserving actionable
diagnostics. Any failed, uncertain, unauthorized or conflicting write pauses
automatic writes until an explicit successful user operation. Further typing
does not dismiss that state or replay requests. Source recovery remains an
explicit choice. Manual Save retains the full pipeline and no-op behavior.

## Block exit and editor behavior

Use CodeMirror's Markdown syntax tree to identify complete top-level paragraphs,
lists and tables, including their multiline content. Track an edited block
across transactions. Moving the selection outside it or creating an actual
block boundary can request formatting; Enter within a list or another ongoing
construct does not count as leaving the structural block. Do not format while
composing, when a selection intersects the exited block or its changes, or when
parsing is incomplete.

Send the entire captured document through the existing authenticated format
endpoint. Accept the result only if source/generation, base revision, exited
block and current selection still satisfy the request's guards. The formatted
diff must affect only the exited block and adjacent separators. If it affects
front matter, fences, references, other blocks or uncertain syntax boundaries,
defer formatting until full Save and document this conservative fallback.
Do not apply an arbitrary subset of a formatter result.

Apply accepted formatting as a separate undoable transaction, mapping selection
and scroll without moving focus. Reuse line-ending history behavior. Plain text
fallback retains idle autosave and manual full formatting; without the syntax
tree it defers block formatting until Save. Programmatic transactions must not
trigger formatting/autosave feedback loops.

## Coordination with external changes (#16)

Reuse current external synchronization and its operation/version guards.
Conditional saves remain authoritative if a writer races a save. Conflicts
retain the draft and persistent review banner; autosave never accepts a newer
revision or resolves a genuine conflict on its own. External reload/merge cancels
pending automatic work, leaving merged local changes unsaved until another user
edit or explicit Save. Tool saves remain blocked by dirty/in-flight editor work.

Keep existing navigation and beforeunload guards for dirty, pending or failed
work. Do not promise persistence when the browser closes. Copy/download and
protected-draft storage remain available.

## Verification and documentation

Use synthetic notes containing configured prose wrapping, front matter, nested
lists, tables, fenced code, reference links and wikilinks. Test timer reset and
five-second inactivity; no requests per keystroke; same-block Enter versus real
exit; safe application and conservative deferral; IME; selection, scrolling and
undo; user edits during delayed saves; operation coalescing; no-op persistence;
external revisions and conflicts; failed formatting, storage/network errors and
expired login; explicit recovery; new/protected/historical drafts; pending-save
navigation warnings; and plain text fallback. Verify stored source independently.

Run focused browser tests and formatter/unit checks, then existing editor,
recovery, external-sync and tool-save regression suites. Rebuild committed static
assets. Update the editor guide with autosave, pause/recovery behavior and the
documented block-formatting fallback. No performance targets or new formatting
dependencies are required.
