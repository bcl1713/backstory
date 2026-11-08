# Authorized graph snapshot implementation plan

> Execute with the Superpowers workflow; backend and browser modules have separate ownership and a fixed transport contract. Retain independent review before the exact merge candidate lands.

**Goal:** Implement Backstory #142, merge through the tested candidate queue and publish the dev release.
**Spec:** docs/superpowers/specs/2026-11-08-authorized-graph-snapshot-design.md
**Architecture:** Reuse maintained index and #141 rendering; add authenticated bulk transport, in-memory adjacency and periodic reconciliation.
**Constraints:** No note writes, graph caps, hidden metadata leakage, Actions enablement or invented gate receipts. AGENTS.md proportional testing and candidate publication rules apply.

## Tasks
- [x] Backend: `/tools/graph/snapshot/` accepts only folder/tag/query, returns existing GraphPage metadata/nodes/edges plus schema_version=1, scope and snapshot_id. Apply current session, policy, path/storage eligibility, canonical edge aggregation and coherent stamps; no body selection. Add focused membership/partial/revocation/storage/external edit regressions and run affected Python tests.
- [x] Browser: new graph-snapshot module validates and indexes bulk data, computes cumulative outgoing BFS subsets with fixed opening root, reconciles selected expansion seeds without count inflation. Adapt graph-controller to fetch snapshot, select locally, use local details, refresh each 15 seconds, fence cancellation and clear revoked/hidden data. Add focused module and controller/browser tests.
- [x] Integration: build assets, run the relevant graph browser scenario using synthetic data, document freshness/security boundary and retained results. Preserve #141 hints/geometry without retesting unchanged implementations.
- [ ] Release: push feature PR to dev, prepare and run one actual merge candidate full gate, retain independent code/UI review, land exact SHA using leases, consume same receipt for dev publication and verify source/version/multiarch digest. Do not rerun passing checks for publication alone.

## Review focus
Scope changes and failed refresh must clear old labels/counts; late loads must not install after close; an incomplete index must remain partial; same-scope refresh must retain view state; every edge must have two authorized endpoints and no body data may be transported.
