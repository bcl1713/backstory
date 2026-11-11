# Releases and image publication

All correctness tests and image builds now run locally. GitHub Actions is disabled
repository-wide, and this branch has no active workflow files. The persistent
candidate queue runs the complete gate before landing the exact tested merge.
The publisher on forge detects `dev` and `main` advancement and reuses retained
candidate evidence to build, tag and upload images and GitHub releases.
Publication does not redeploy a server.

Follow the [local CI and release runbook](ci/README.md) for the complete test gate,
exact-commit receipt, prerequisite tools, review and automatic publisher service.
The former workflow definitions are retained only as inert migration references.

## Branch and release policy

1. Feature/fix PRs target `dev`. Run focused checks, prepare the actual merge
   candidate with `local_candidate.py`, and run its full gate before landing.
2. Retain independent code/UI review of the exact candidate and current required
   GitHub review. Land only the tested SHA after rechecking head/base and evidence.
   A stale or failed candidate never advances either ref; rebuild/retest its new
   result. Landing atomically advances both target and source to the tested merge.
3. The local publisher validates and reuses the retained receipt and unchanged
   runtime inputs to publish the dev prerelease and `:dev` alias without rerunning
   application tests. A direct push without candidate evidence fails closed.
4. Promote this repository's `dev` to `main` using a separately prepared, tested
   and reviewed merge candidate. The same receipt reuse publishes its stable
   release and numbered/`:latest` aliases.
5. Main promotion atomically synchronizes `dev` and `main` at landing. The service
   publishes dev first, then stable from this same tested SHA and receipt. No
   subsequent main-to-dev merge is needed; channel failures retry independently.

Keep test and production stacks, wiki directories, data directories and ports
separate. Publication never redeploys a server. Operators choose when to pull and
redeploy, preferably using the release's immutable digest or full version.
No branch/security settings are changed by the local scripts. Do not fabricate
hosted CI success to satisfy an obsolete check requirement.

## Version selection

Use Conventional Commits in commit subjects (and squash PR titles if squash
merging). With a normal merge, constituent commits are also inspected. The
strongest change since the greatest reachable stable `vMAJOR.MINOR.PATCH` tag
wins:

| Change | Example | After 1.0.0 |
| --- | --- | --- |
| Breaking | `feat!: change storage layout`, `fix(storage)!: ...`, or a `BREAKING CHANGE: ...` footer | 2.0.0 |
| Feature | `feat: add folders` or `feat(editor): add navigation` | 1.1.0 |
| Other merged changes | `fix: correct save`, `docs: improve setup`, `chore: refresh tooling` | 1.0.1 |

Every changed main commit therefore gets a release, including docs and dependency
maintenance. With no reachable stable tags, the version is exactly 1.0.0 even
when bootstrap history contains breaking commits. Unrelated branch tags and
prerelease tags are ignored. No npm/PyPI package is published. The initial
package manifests record 1.0.0; release tags and OCI image labels are the
authoritative version for subsequent container releases, without bot commits
back to main.

Dev uses that prospective stable version followed by
`-dev.<commit-count>.g<12-character-sha>`, for example
`1.1.0-dev.42.g0123456789ab`. It is deterministic for a commit and reachable
stable history, so rerunning the same dev build reuses its prerelease version.
Dev tags never consume stable version numbers. GitHub prereleases are explicitly
excluded from the Latest release; they carry the same deployment assets as stable
releases. Their generated change notes cover changes since the previous stable
release.

## Published artifacts

Both channels publish linux/amd64 images built locally from an
immutable archive of the exact tested commit. Releases retain version/source OCI
labels, the image digest, the Portainer manifest, a version-pinned environment
example, deployment guide and checksums.

The Docker build also writes `wiki/_build_identity.json` inside the application
from the publisher's `BACKSTORY_VERSION` and `BACKSTORY_REVISION` build arguments.
The runtime user can read this image-owned file; it is not wiki data or a runtime
configuration setting. Local context copies are excluded and overwritten during
packaging. Native checkouts and builds without release arguments report unknown
identity. The authenticated `wiki_status` tool and `/tools/status/` expose only the
validated source SHA and release version from this file, with `unknown` for missing
or invalid fields. Validation accepts a lowercase 40-character Git SHA and the
publisher's stable or dev version format (at most 80 ASCII characters, no leading
zero numeric components); reads are bounded to 1 KiB.

After an operator deploys an image, read authenticated status and compare both
fields with that immutable release's source/version evidence. An unknown value
is uncertainty, not proof of deployment failure. Registry publication and a moving
branch or image alias do not establish which artifact is running. This change
does not publish or deploy an image or add credentials or runtime settings.

Dev publishes full prerelease tags and updates only `:dev`. Stable publishes
version tags, minor and major aliases and `:latest`. The local service uses existing
GitHub authentication for release and GHCR publication; it never creates tokens
or changes account access. See [Portainer deployment](portainer.md) for
operator-controlled upgrades and rollback.

## Failure and recovery

Keep the complete local test receipt and review evidence. A failed or incomplete
gate cannot land or publish. Missing/changed runtime provenance also blocks reuse.
The candidate gate owns testing once; upload retries retain its receipt.
Current remote branch identity is checked before building
and again before moving channel aliases. If source advances, retest the new
commit rather than borrowing an earlier receipt.

Image publication and GitHub release publication are separate operations. A
partial failure can leave pinned image tags or a draft release. Fix the cause,
verify the source and relevant runtime inputs are unchanged, and retry with the
same receipt and a fresh assets directory. The automatic publisher does this
without rerunning tests. Published
releases are not silently modified. Retries reuse matching existing version image
digests after verifying source/version labels and the AMD64 platform. Existing
multi-platform immutable tags are rejected and never overwritten. Incomplete or
conflicting version tags and registry lookup failures block publication; follow
the runbook to investigate without overwriting an image. Never move/delete published version tags.
No retry may re-enable or invoke GitHub-hosted workflows.
