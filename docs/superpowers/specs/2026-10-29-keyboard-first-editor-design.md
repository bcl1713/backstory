# Keyboard-first editor

Brian wants to start work without a mouse: desktop notes open focused in Vim Normal mode; phones retain ordinary editing without opening the keyboard. An explicit Vim toggle is remembered in the current browser and overrides the default. Startup focus happens once, only when another control has not claimed focus, preserving fragment positioning.

Normal-mode `gf` follows the wiki or Markdown link under the text caret through the existing syntax parser, server resolver and anchor activation. It preserves draft-leaving confirmation and existing missing-note creation flow. It does not create notes or save implicitly, does nothing on nonlinks, ignores code/images/frontmatter, and discards stale asynchronous results after caret/document/mode changes.

## Approaches
Reuse the existing resolver and anchor click path rather than inventing a regex or direct location navigation; the latter would diverge from link semantics and draft guards. Use a normal-only Vim custom action rather than a DOM g/f key buffer, preserving Vim prefix behavior. Browser-local preference and input-capability/layout detection avoid server or account settings. These are implementation choices supporting the user-approved behavior.

No unrelated formatting changes, shortcut reassignment, merge or deployment.

## Approved follow-up within the same keyboard work

Normal-mode sequential `gh` returns to `/`, preserving the existing root index
and folder-tree fallback plus unsaved-draft protection. Remove only the yellow
inset left stripe from the active editor, retaining the caret and other controls'
focus indicators. These additions were explicitly requested during the call.
