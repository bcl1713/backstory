# Live editor code blocks

## Approved behavior

Brian requested ordinary code blocks render in the live editor rather than remain raw Markdown. He approved this short design on November 2, 2026: show a styled, syntax-highlighted code block while reading; reveal the Markdown fences when moving into the block to edit; unknown languages remain readable plain code; nothing executes.

## Approach

Use CodeMirror's syntax tree, highlighting and source-backed decorations. Preserve normal caret movement, selections and undo rather than replacing a block with a separate editor or iframe. Prefer a small explicit set of common language parsers and safe plain-code fallback over runtime remote language loading. Keep theme colors tied to existing palette variables.

A whole-block replacement widget was considered but is unnecessary for textual code and adds selection/navigation risk. Keeping every fence raw would not meet the approved reading behavior.

## Scope and constraints

- Ordinary fenced code, including empty/unknown language, backtick and tilde fences, must remain faithful to the source. Unfinished fences remain editable.
- On entry by keyboard or pointer, reveal exact source without rewriting or formatting. Selections crossing a block must preserve source and copy behavior.
- Known diagram languages stay owned by existing diagram rendering. Do not change diagram sandbox, renderer configuration or source-edit rules.
- No execution, network fetches of source, line-number features, copy toolbar or new settings.
- Check Chromium and Firefox on desktop plus phone-sized Chromium. Keep document width bounded and tall blocks reachable.
- No deployment. Publish through a reviewed PR to dev only after required checks pass.
