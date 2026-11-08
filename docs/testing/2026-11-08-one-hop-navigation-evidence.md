# One-hop navigation visibility follow-up

User feedback on issue141: mobile collapsed controls hid the hint entry point,
and distant titles obscured the selected note's immediate destinations.

The implementation uses only selected/outbound titles, prefixed with their actual
`f <code>` shortcuts. Graph/selection assignments feed both ordinary titles and
frozen active hints. Destination nodes, labels and directed connections use the
installed green semantic role, with a circle cue for monochrome/forced colors.
The hint control and legend remain visible outside collapsed graph controls.
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
