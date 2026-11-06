# Releases and image publication

All correctness tests and image builds now run locally. GitHub Actions is disabled
repository-wide, and this branch has no active workflow files. Merging or pushing
code does not publish an image or redeploy a server.

Follow the [local CI and release runbook](ci/README.md) for the complete test gate,
exact-commit receipt, prerequisite tools, review and explicit publication command.
The former workflow definitions are retained only as inert migration references.

## Branch and release policy

1. Feature/fix PRs target `dev`. Verify the intended merge tree locally and retain
   the full test record plus code/UI review before merging.
2. Test the resulting current `dev` commit locally, then explicitly publish its
   unique prerelease and `ghcr.io/bcl1713/backstory:dev` alias.
3. Promote this repository's `dev` to `main` through a reviewed merge commit,
   preserving Conventional Commit history. Test that resulting commit separately.
4. Explicitly publish the stable main release and numbered/`:latest` aliases.
5. Merge main back into dev after stable publication to retain tag ancestry.

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

Both channels publish linux/amd64 and linux/arm64 images built locally from an
immutable archive of the exact tested commit. Releases retain version/source OCI
labels, the image digest, the Portainer manifest, a version-pinned environment
example, deployment guide and checksums.

Dev publishes full prerelease tags and updates only `:dev`. Stable publishes
version tags, minor and major aliases and `:latest`. The explicit local release
script requires existing GitHub CLI and GHCR Docker authentication; it never
creates tokens or changes access. See [Portainer deployment](portainer.md) for
operator-controlled upgrades and rollback.

## Failure and recovery

Keep the complete local test receipt and review evidence. A failed or incomplete
gate cannot publish. Current remote branch identity is checked before building
and again before moving channel aliases. If source advances, retest the new
commit rather than borrowing an earlier receipt.

Image publication and GitHub release publication are separate operations. A
partial failure can leave pinned image tags or a draft release. Fix the cause,
verify the source is unchanged, and retry with a fresh assets directory. Published
releases are not silently modified. Retries reuse matching existing version image
digests after verifying source/version labels and both platforms. Incomplete or
conflicting version tags and registry lookup failures block publication; follow
the runbook to investigate without overwriting an image. Never move/delete published version tags.
No retry may re-enable or invoke GitHub-hosted workflows.
