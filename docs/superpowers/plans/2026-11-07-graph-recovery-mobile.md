# Graph query recovery and mobile controls implementation plan

> **For agentic workers:** Use systematic debugging and focused regression checks;
> AGENTS.md governs proportional verification and the exact candidate release gate.

**Goal:** Implement and publish issues #123 and #124 through the dev candidate queue.

**Architecture:** Retain the current graph API, SQL budget, eligibility checks and
native disclosure UI. Diagnose the eager two-hop traversal with synthetic data,
fix the demonstrated query cost, and expose truthful query-limit recovery. Scope
navigation CSS to its actual drawer and collapse mobile graph controls with a
touch-accessible native disclosure while keeping scope and loading state visible.

**Spec:** GitHub issues [123](https://github.com/bcl1713/backstory/issues/123) and
[124](https://github.com/bcl1713/backstory/issues/124), explicitly authorized for
implementation, merge and publication by the owner.

## Constraints and review focus

- Preserve the 200,000 VM step / 0.1 second SQL budget and all existing response,
  privacy, eligibility, endpoint revocation and pagination bounds.
- Query-limit errors must not claim that relationships are still being prepared.
  Offer one-hop recovery while preserving filters and the local center.
- Preserve stale-request handling and clear unsafe evidence after policy errors.
- Test Menu-open graph entry and the direct graph page separately; preserve
  guarded navigation, focus return and a reachable sticky modal close control.
- Retain screenshots from synthetic notes only; distinguish touch emulation from
  physical-device/browser-chrome/software-keyboard evidence.

## Tasks

- [x] Reproduce the two-hop query failure in backend graph tests, identify the
  expensive path and add the smallest meaningful regression. Implement the
  bounded fix and source-free error diagnostics; run affected graph tests.
- [x] Add a browser regression for query-limited error text and one-hop recovery;
  update `static/src/graph-controller.js` without discarding existing stale-request
  and privacy handling. Keep failures distinct from preparation and empty success.
- [x] Reproduce mobile drawer CSS on a narrow touch viewport. Update `app.css`,
  `graph.css`, graph templates and launcher as necessary; add a focused mobile
  browser spec and retain before/after computed styles and screenshots.
- [x] Include the two focused browser specs in the existing Firefox release lane.
  Retain commands/results and independent code/UI review, resolving findings.
- [ ] Commit and open a PR to dev, prepare a real merge candidate with the trusted
  controller, run its complete gate once, independently review that exact SHA,
  and land atomically with source/target leases. Observe publication reusing the
  successful receipt; report version, checks and material limitations.
