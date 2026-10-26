# Editor modes and Zen (#8, #1)

The user delegated remaining design and execution decisions after choosing
inactive-line direct link navigation for #7. This design records the resulting
choices for the next two issues.

Keep CodeMirror as the one enhanced document, including while the complete-source
textarea is visible. A single presentation state controls visible surfaces,
pressed buttons and a separate loading/ready label. Compare the initial textarea
with its browser-normalized default value so edits during loading are retained
without mistaking HTML newline parsing for an edit. Raw source remains virtualized;
Plain text fallback offers complete source without a second divergent model.

Use the browser's local date and named IANA timezone for Today, shown explicitly.
Reuse safe exact-path/basename resolution for an existing date-named note. Missing
or ambiguous notes stay non-navigable; navigation never creates one. Prefer a
bounded recently modified list from the existing index over a new per-user visit
store. Recheck storage policy and existence; indexed ordering can lag external
modifications. Refresh when navigation reopens or the browser regains focus.

Use default Zen with a small persistent Menu/Save/Format/status toolbar. Menu and
Ctrl/Meta+Shift+Period reveal the existing navigation and editor/draft tools in
one panel; Escape returns focus to the current editor. Keep critical diagnostics,
format proposals, reauthentication and conflicts outside the hidden panel. Retain
usable no-script source/navigation. No browser fullscreen API is needed.

Use the Tokyo Night Night palette through semantic CSS custom properties, making
#3's later color customization possible without changing typography. Self-host
JetBrains Mono v2.304 regular under its OFL license. Use 16px initial size, 1.5
line height, enabled ligatures and an 80ch content area excluding padding. Shrink
on narrow screens, retain browser zoom and use identical font metrics for headings,
body, live preview and raw source. Live headings carry semantic levels even when
source markers are hidden or revealed. These choices never change Markdown,
front matter, Prettier printWidth or configuration.

Alternative choices rejected: a separate full-source model would add divergence;
a per-user recent-visit store would add persistence for a small navigation need;
a second mobile controls overlay would obscure the editor tools. User-facing
color customization and daily-note creation remain later/outside this scope.
