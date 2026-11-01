# Direct upload toolbar button (#79)

The user selected a visible Upload image button beside Menu and Save, opening
exactly the existing modal. Move the single existing trigger into the persistent
toolbar so its upload handler and focus restoration remain unchanged. Keep the
modal, explicit insertion, validation and policy unchanged. Existing flex layout
should fit phone widths; verify actual pixels before introducing CSS changes.

Verification:
- Baseline: 2 toolbar backend tests and 7 upload browser cases passed.
- New backend toolbar assertion failed with 2 buttons instead of 3.
- New browser test failed because the toolbar upload trigger was absent.
- Verify 360/390/1180px layout, visible focus, keyboard activation, Escape/Close,
  repeated open, exact unsaved CRLF source and explicit insertion with autosave
  clock paused. Inspect actual toolbar and modal screenshots.
- Run existing upload, Zen, accessibility and caret viewport regressions; build,
  full Python/Node checks and required exact-head CI. Independent review before
  final handoff. Draft PR only; parent coordinates merge. No production activity.

Observed results: build and 230 Node tests passed; all 29 focused browser
regressions passed. Actual 360px, 390px and 1180px toolbar/modal screenshots
were inspected. No CSS change was needed. Independent working-tree review
reported no findings. Full Python suite: 1366 passed. Exact-head CI evidence
follows in the PR.
