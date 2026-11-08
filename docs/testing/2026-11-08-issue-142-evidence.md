# Authorized graph snapshot — issue #142

Implementation starts from dev `fc7bd44ddf602e4c126316df91c3aae987bd2e19`, including merged
#141/PR143 and the one-hop navigation follow-up PR145. The source changes are
identified by the commit containing this record; release identity is the later
actual tested merge candidate, not a feature-head receipt.

## Focused evidence

- Backend: `python -m pytest -q tests/integration/test_graph_snapshot.py` — final
  10 passed (5.36s). Membership fixture has 312 notes, 310 canonical counted
  edges, an isolate and JSON larger than 512 KiB. Covers body-read/SQL exclusion,
  external edit/alias rename/delete index reconciliation, incomplete evidence,
  filter boundaries, session/logout/policy/storage scope and concurrent stamps.
  An initial snapshot/unchanged adapter run passed 25 tests before final added
  payload/logout/hidden-count regressions; this is combined focused evidence.
- Browser model: `node --test tests/formatter/graph-snapshot.test.mjs` — six
  behavioral cases passed, including cumulative chain/diamond/cycle/isolate BFS,
  count stability, reconciliation, atomic invalid-payload purge, scope suspension
  and surviving display order. Module absence and ordering regression failed
  before their implementations.
- Built assets: `npm run build` passed with Node 22.23.4 and locked dependencies.
  The first attempt used a dependency symlink and failed the existing Mermaid
  loader path guard; copying dependencies locally resolved this without changing
  the build contract.
- Real Chromium/HTTP: all four changed graph-query-recovery cases passed,
  including the synthetic 93-node/278-edge hub completing in one snapshot
  response. Hop changes are local. The new snapshot lifecycle scenario passed
  after moving fake-clock installation before controller timer creation.
- Graph integration: 24/27 initially passed; the three failures exposed
  search-to-map focus and outdated absolute request-count assertions. The
  affected control check then passed. Exploration exposed lost DOM focus after
  tab suspension; preserving/restoring focus after same-scope revalidation fixed
  it. Final affected desktop/mobile expansion and large-list close checks:
  four passed (10.4s). Unaffected checks were not repeatedly rerun.
- Independent review found hidden direct-page fallback/JSON and paused-canvas
  retention; both targeted regressions failed before fixes and passed in the
  integration run. A close-time pagination-count regression also failed before
  clearing retained navigation and map metadata. Bulk metadata no longer emits
  pre-eligibility examined counts; its exclusion regression failed before fix.

Logs, traces and synthetic screenshots are retained under
`/tmp/issue142-evidence` and the associated `/tmp/issue142-*-runtime` roots on the
trusted executor. These focused checks do not claim an exhaustive fresh suite,
live-wiki performance, real-device or assistive-technology acceptance.

## Release boundary

Follow AGENTS.md and docs/ci/README.md: prepare the real proposed merge, run the
required full local gate once, retain exact-candidate independent code/UI review,
then land exactly that SHA using atomic expected leases. Publication reuses its
receipt and unchanged runtime provenance; it must not substitute feature-head
results or start another unconditional correctness run. No live notes or
production settings were used or changed. Publication does not redeploy a wiki.
