# One-hop destination visibility

User follow-up to issue141: make one-hop destination hotkeys visible, distinguish
one-hop nodes by color, and remove two-hop labels. The screenshot showed that
mobile collapsed controls hid entry to the existing hint mode.

- Selected node and its immediate **outbound** destinations get title labels;
  other titles are omitted even for the opening root or focused node. Topology,
  opening-root BFS and physics remain unchanged.
- One-hop labels show the actual `f <code>` sequence before activation. Stable
  graph/selection assignments feed both these labels and the frozen active hint
  session, so movement cannot change what a displayed code selects. Active hint
  mode still reaches other visible nodes.
- Destination nodes, their direct outgoing connection and label use the installed
  green semantic heading-4 role. Add a non-color ring cue and a compact header hint control
  outside collapsed mobile controls; describe the circle in existing graph help. Preserve forced colors.
- Use existing renderer/hints/label modules; no backend or new neighbor list.

## Steps

- [x] Add focused failing checks for one-hop-only labels, shared passive/active
  code assignments and destination colors; implement and run affected Node files.
- [x] Update the relevant synthetic desktop/narrow browser cases, inspect screen
  captures, and retain scoped independent code/UI review. Reuse unrelated passing
  evidence. Correct material findings before any candidate gate.
- [ ] Follow the already authorized merge/publication process and AGENTS.md exact
  candidate requirements; publisher reuses the successful candidate receipt.
