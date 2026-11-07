# Project instructions

## Keep testing proportional

The owner explicitly wants useful testing without hours of repeated verification.
These instructions govern agent work in this repository, including when a skill
or an older plan suggests broader or repeated checks.

- Before testing, choose the smallest meaningful checks for the changed behavior
  and state what a passing result will establish. Start with relevant existing
  tests. Add regression coverage for meaningful behavior changes, not tests that
  merely mirror the implementation or check a reversible documentation edit.
- During development, run focused Python tests, formatter test files, or browser
  scenarios for the affected area. Do not run every suite after each change.
  Run broader coverage only for a concrete shared dependency, integration risk,
  failure, or an explicitly required release gate; explain the reason first.
- Stop when the selected checks pass and relevant findings are resolved. A
  review, handoff, context restart, commit, build, or request to publish does not
  by itself justify running passing tests again. Verification skills require
  evidence for claims; they do not require repeating still-applicable evidence.
- Keep a concise record in the task handoff or existing evidence directory:
  tested commit or working-tree state, commands, results, and any relevant build
  inputs or environment. Reuse passing results while those inputs are unchanged.
  After a change, rerun affected checks; retain evidence for unaffected areas.
  Do not describe combined focused evidence as a fresh full-suite pass.
- Before any rerun, identify what changed, which failure it investigates, or
  which unresolved question it will answer. If none applies, skip the rerun.
  Do not repeat a failing command unchanged without a specific diagnostic reason.
- At 15 minutes of cumulative verification for a task, report elapsed testing
  time, results, and remaining checks. Reassess scope before adding more checks.
  Treat this as a checkpoint, not a reason to kill a useful running check or
  waive a required gate. Explain any expected longer run before starting it.
  Do not silently expand verification into an hour-long cycle; defer optional
  checks and ask before an additional expensive discretionary test campaign.

## Build and publication

- The local candidate queue owns the full release gate before merge. Prepare a
  real proposed merge commit, run its full gate, retain independent review, then
  land exactly that SHA. A feature-head pass is insufficient. Changed head/base
  means a new candidate and gate; never transfer receipts between commits. Land
  with atomic expected leases on both source/target refs. Main promotion
  synchronizes dev/main to that tested merge before either channel publishes.
- The publisher consumes the landed candidate's successful receipt and unchanged
  runtime provenance. It does not rerun the gate. Retain the candidate store and
  use the same trusted executor/toolchain for test, land and publication.
- Manual `scripts/local_release.py --receipt ...` and automatic retries reuse
  valid exact-commit evidence. Preserve source/tree, branch policy, complete gate
  contract, relevant runtime inputs, version, both image architectures, immutable
  digest and freshness checks. Missing or changed evidence fails closed.
- Keep GitHub Actions disabled, preserve independent code/UI review and remote
  branch protections, and use the [candidate runbook](docs/ci/README.md).
- A publication or upload failure alone does not invalidate passing application
  tests. Retry using valid existing evidence and the documented recovery path
  when source and relevant inputs are unchanged. Keep publication authorization
  separate from whether tests need to run.
- In the final response, summarize checks actually run, reused evidence, and any
  material gaps. Do not launch another test cycle just to write that response.
