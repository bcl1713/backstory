# Keyboard note discovery

Issue #2 adds a small existing-note chooser, not an IDE. Ctrl+Alt+O opens a labelled native dialog; Menu → Open note is the accessible/mobile fallback. Search uses the existing bounded path/title/alias completion endpoint. Results are real internal links, retaining the existing unsaved-navigation guard. Arrow keys and Enter open a result; Escape closes and restores the initiating control/editor selection. The chooser never edits, saves, or creates notes. Its controls are absent from the always-visible Zen toolbar.

Requests are canceled on query change and close. Stale responses cannot replace newer results. Index freshness/partial results and access/network errors remain visible; errors never imply no matching files. Paths are validated and rendered through text nodes, not HTML.

Ctrl+Alt+O avoids the known Ctrl/Cmd+Shift+O bookmark shortcut; custom OS/window-manager/extension bindings can still intercept it, so the menu fallback is essential. Existing wikilink completion, gf/gh and Vim toggle remain unchanged. Heading/tag/frontmatter completion and broader Vim commands (including :w) are deferred: no concrete workflow need justifies them in this scoped issue.
