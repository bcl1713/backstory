# Releases and image publication

The first release is **v1.0.0**. A successful push/merge to `main` runs the
`release` workflow: full Python, formatter and Chromium tests, asset build,
Django checks, Compose validation and a container build/startup check must pass.
The workflow then builds the **same source commit** for linux/amd64 and
linux/arm64, pushes GHCR tags, and creates the matching GitHub release. Each
release includes the Portainer manifest, a version-pinned environment example,
the deployment guide and checksums, plus source SHA and image digest in its notes.

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

## Published artifacts

The package is [ghcr.io/bcl1713/backstory](https://github.com/bcl1713/backstory/pkgs/container/backstory).
A release publishes `:1.0.0` and `:v1.0.0` style version tags, moving `:1.0`,
`:1` and `:latest` aliases, and an OCI source/revision/version label. Use a full
numbered tag or the release's image digest for deployment; moving aliases can
advance with later releases. See the [deployment guide](portainer.md) for
Portainer pulling, named users, upgrades and rollback.

The workflow authenticates using the built-in `GITHUB_TOKEN` with
`contents: write` and `packages: write`, following
[GitHub's GHCR workflow guidance](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry#pushing-container-images).
It does not require a personal token secret. Main/tag protection rules must allow
this release workflow to create tags and releases. If an existing package has
separate access rules, grant this repository Actions write access in its package
settings. The initial GHCR package may be private even for a public repository:
check **Package settings → Change visibility → Public** after first publication
and verify an anonymous pull before advertising login-free installation.
Public visibility changes are permanent under
[GitHub's package visibility rules](https://docs.github.com/en/packages/learn-github-packages/configuring-a-packages-access-control-and-visibility#configuring-visibility-of-container-images-for-a-package).
Private package deployments instead need a Portainer GHCR credential with
`read:packages`; no local build is required.

## Failure and recovery

Main releases are serialized and publication is never canceled in progress.
GitHub Actions can replace an older pending run when rapid pushes arrive; the
next run covers all changes since the previous release. Avoid merging another
change while deliberately recovering a failed release.

If correctness or an image build fails, no GitHub release is published. If the
image push succeeds but release creation/upload fails, image tags may exist
before the public release. Fix the underlying permissions/outage, then rerun
the failed workflow. Lookup/API failures stop publication; they are never treated as a missing release.
A draft release is refreshed to the current source/digest and completed on retry; a stable tag already
pointing at the same commit reuses its version. A previously published release
for that commit is skipped, so a manual retry does not create a patch release.
An older run refuses publication after main advances, so it cannot move the image
aliases backward. Use **Actions → release → Run workflow → main** to retry the
current main head.
Never run publication from another branch or move/delete published version tags.
GitHub release and GHCR operations are separate API calls, so publication is not
an atomic registry transaction.

Image upload and GitHub release creation occur in the **same workflow**.
GitHub documents that events created by `GITHUB_TOKEN` generally
[do not trigger another workflow](https://docs.github.com/en/actions/how-tos/writing-workflows/choosing-when-your-workflow-runs/triggering-a-workflow#triggering-a-workflow-from-a-workflow);
this pipeline does not rely on a release/tag event to publish the image.

For the initial cut: land the workflow/docs with the reviewed application branch,
wait for the main correctness gate and multi-platform publication, then verify
`v1.0.0`, image labels/digest/platforms and pull access. Actual live wiki enrollment,
Portainer deployment and proxy changes remain operator-controlled steps.
