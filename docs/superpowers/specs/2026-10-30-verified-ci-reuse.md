# Verified application-test reuse for releases

## Intent
Avoid repeating successful application tests for the identical merged source while retaining release/container checks and a fail-closed full-test path. The existing PR run and subsequent dev release tested identical trees, but the release repeated all nine jobs.

## Design
The chosen approach is evidence reuse, not simply trusting a green PR or a matching tree. A release-only read-permission job probes its test environment and verifies GitHub metadata and small, bounded JSON receipts from the original successful same-repository PR run. Reuse applies to Python, formatter, and four browser jobs together. Branch policy and container build/smoke checks always run. Multiarch publication and both current-head guards remain unchanged.

Eligibility requires a merged same-repository trusted-author PR; the release's two parents match its base/head; the tested synthetic commit has those parents and the identical tree; the CI workflow and evidence machinery are unchanged from the pre-merge branch; the expected nine original-attempt jobs all succeeded; and all six receipts match run, attempt, source, profile, environment and expected artifact names. Forks, reruns, direct pushes, rebases/squashes, partial runs, expired/missing/oversized/malformed data and API failures use full CI. The builder-selected freshness limit is 24 hours.

Setup actions used for reusable checks are pinned to the reviewed SHAs observed in current CI. Environment receipts include runner image/OS/architecture, applicable resolved runtimes, installed Python packages, and OS/browser dependency fingerprints. Receipt JSON is never executed or extracted into the workspace. Changing workflow/evidence policy itself forces full CI, including the first rollout.

The verifier has contents:read, actions:read and pull-requests:read only; it receives no publishing credentials or secrets. Same-repository, merged, reviewed code is the trust boundary; this is not a mechanism for reusing arbitrary fork artifacts. Any inability to establish equivalence is a cache miss, never permission to publish untested code.

## Alternatives
- Always repeat everything: simplest and currently safe, but wastes measured runner time and delays deployment.
- Build once and promote a tested image: worthwhile separately; the present PR image is single-platform with different version metadata, so it is not this change.
- Chosen: conservative application-test evidence reuse, retaining container/release checks and observable fallback reasons.

## Limits
A setup probe still costs time; runner/toolchain/package drift can erase savings. This is provenance for test results, not a claim of mathematically reproducible builds or a security sandbox for malicious maintainers. Current image publication is not interrupted. No deployment or new write permissions are introduced.
