# Optional Vim editing (#2), first increment

The owner approved the first demonstrable slice and delegated implementation
details: opt-in Normal, Insert and Visual modes, visible status, a clear off
switch and predictable undo while switching editor presentation. Completion and
wider navigation mappings remain subsequent increments.

## Approach

Use `@replit/codemirror-vim` 6.4.0, the MIT-licensed CodeMirror 6 adapter. Its
declared peer dependencies accept the existing CodeMirror 6 packages; add the
required search peer explicitly. Upstream source connects undo/redo to
CodeMirror's commands. Verify actual behavior in Backstory browser tests.
Custom bindings add unnecessary modal-editor maintenance; replacing CodeMirror
would put the existing document, preview and history model at risk.

References checked 2026-10-27:
- https://github.com/replit/codemirror-vim
- https://github.com/replit/codemirror-vim/blob/master/LICENSE
- https://github.com/replit/codemirror-vim/blob/master/packages/codemirror-vim/package.json
- https://github.com/replit/codemirror-vim/blob/master/packages/codemirror-vim/src/cm_adapter.ts

## Behavior and constraints

- Standard editing remains the default on each page load; no persisted preference.
- Keep a keyboard-accessible Vim bindings toggle and a polite mode indicator in
  the persistent toolbar, including Zen. Enabling starts in Normal mode.
- A separate CodeMirror compartment installs/removes bindings without replacing
  the editor, document, selection or undo history. Live/Raw switching retains
  the active Vim mode. Visual selections reveal source on intersected lines.
- Plain text fallback suspends bindings and reports that state. Returning to an
  enhanced presentation resumes the preference in Normal mode. The toggle can
  always disable the preference; enhancement failure leaves fallback usable.
- Escape dismisses a formatting proposal first, then an open navigation panel;
  otherwise Vim handles it to return to Normal. No page-global letter mappings.
- Ctrl/Meta+S remains the guarded app save; Ctrl/Meta+Shift+Period opens/closes
  navigation. Tab/Shift+Tab leave the editor normally. Preserve common browser
  location/find/new-tab/window/print shortcuts. Vim Ctrl+R remains redo while
  the enhanced editor has focus, and is documented as a browser conflict.
- Reuse the existing authoritative Markdown, exact newline metadata, formatting,
  saves, conflicts and protected draft machinery. Do not add alternate save paths.
- Basic acceptance mappings: h/j/k/l, word motions, i/a, Escape, v/V, d, u and
  Ctrl+R. Other upstream commands are not a promise of Neovim parity.
- Keep ordinary controls, mobile layout, no-script behavior and assistant access
  functional. No completion, language server, AI service, deployment or wiki changes.

## Integration with current dev

Publication uses an isolated feature worktree based on current `dev`, retaining
its autosave, source synchronization, linked-note creation and theme support.
Vim edits use the existing five-second autosave pipeline; authoritative refreshes
retain modal state and remain undoable. Browser tests pause the clock for
draft-only operations and advance it explicitly for autosave and source refresh.

## Verification

Browser tests exercise opt-in state and off switch, Insert and Visual behavior,
selections and undo across Live/Raw and fallback, exact mixed-newline restoration,
save/conflict/formatting behavior, Escape ownership, Tab escape, browser shortcut
handling, enhancement failure and mobile controls. Run existing editor, Zen,
accessibility, recovery and save tests alongside the new slice.
