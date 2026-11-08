# One-hop navigation visibility follow-up

User feedback on issue141: mobile collapsed controls hid the hint entry point,
and distant titles obscured the selected note's immediate destinations.

The implementation uses only selected/outbound titles, prefixed with their actual
`f <code>` shortcuts. Graph/selection assignments feed both ordinary titles and
frozen active hints. Destination nodes, labels and directed connections use the
installed green semantic role, with a circle cue for monochrome/forced colors.
The header hint control remains visible outside collapsed graph controls.
No topology, backend query, opening-root BFS, spring or note behavior changed.

Focused working-tree evidence on branch `improve/one-hop-navigation`, based on
`0ca625035d17c4e0b05f5a10bccd4ca396616e93`:

- New destination regressions failed before implementation: unrelated/incoming
  titles were present, passive/active shared codes were unsupported, and nearby
  nodes retained the ordinary blue color.
- Five affected Node files passed: graph-destinations, graph-exploration,
  graph-labels, graph-layout and graph-renderer. This checks one-hop-only titles,
  passive/active code agreement through visibility changes, prefix-free/frozen
  codes, node/direct-edge colors, label bounds, springs and geometry invariants.
  Log `/tmp/backstory-one-hop-node.log`.
- Chromium desktop/narrow exploration and dense-phone readability: 3 passed in
  11.9s. The updated scenarios check visible shortcuts before activation, visible
  hint entry with mobile controls collapsed, code agreement during activation,
  no distant titles, pointer/touch/keyboard selection, cumulative expansion,
  paused recovery, zoom/bloom and light/dark/forced-color states. No browser
  timing threshold was added. Log `/tmp/backstory-one-hop-browser.log`; artifacts
  `/tmp/backstory-one-hop-browser/reports/browser-artifacts`.
- Viewed synthetic phone default, dense dark/light and hint screenshots. Shortcuts
  are visible without opening controls; selected/outbound titles are separated.
  Synthetic positions make interactions reproducible and are not private notes
  or a production-layout/latency measurement.
- Unrelated existing evidence from issue141 is retained. This is focused evidence;
  the required exact-merge candidate gate and independent approval are retained
  separately before merge/publication. Native-device and screen-reader acceptance
  remain outside synthetic browser coverage.

The first candidate's full build exposed one omitted generated artifact:
`static/shell.js` serializes the semantic role map and needed the new
`destination: heading-4` entry. Its validation was interrupted before landing.
A complete local asset build regenerated that map (24 added bytes, no other
uncommitted generated output). The corrected candidate includes the generated
bundle and receives its own full gate; earlier receipts are not transferred.

The corrected candidate passed Python, formatter and Firefox code checks; its
renderer stage found one 320px layout failure (86 other scenarios passed). The
extra hint/legend row pushed the workspace below the established useful-space
bound. The hint entry now uses a compact 44px `f` button beside Close graph in the
existing header, with its accessible name and key description preserved. No new
row consumes map height. The selected/outbound drawing and advertised codes are
unchanged. Both 320px/390px Firefox scenarios passed in 7.3s and the matching
Chromium scenarios passed in 6.6s. Independent review inspected fallback, real-map
and landscape screenshots with no blockers. Logs:
`/tmp/backstory-one-hop-header-{firefox,chromium}.log`. The final source receives
its own exact-candidate gate; earlier failed/interrupted evidence is not reused as
a passing release receipt.
