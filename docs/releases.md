# Releases and image publication

The first stable release is **v1.0.0**. Successful pushes/merges to `dev` and
`main` run the `release` workflow: full Python, formatter and Chromium tests,
asset build, Django checks, Compose validation and a container build/startup check must pass.
The workflow then builds the **same source commit** for linux/amd64 and
linux/arm64, pushes GHCR tags, and creates the matching GitHub release. Each
release includes the Portainer manifest, a version-pinned environment example,
the deployment guide and checksums, plus source SHA and image digest in its notes.

## Branch and server workflow

1. Open feature/fix PRs against `dev`. CI tests the proposed merge. PRs to `main`
   must come from this repository's `dev` branch; the correctness check rejects
   other sources, including a fork branch named `dev`.
2. Merge into `dev` to publish a unique GitHub **prerelease**, pinned images and
   the moving `ghcr.io/bcl1713/backstory:dev` image for a test server.
3. Test that image, then open a `dev` → `main` promotion PR. Use a **merge commit**,
   preserving feature commit history for Conventional Commit version selection.
4. Merging into `main` publishes a stable GitHub release, numbered image aliases
   and `ghcr.io/bcl1713/backstory:latest` for production. The main merge commit is
   tested and built separately; production has its own gate.
5. After stable publication, merge `main` back into `dev` so the next development
   cycle includes the stable tag in its ancestry. Keep `dev` as a long-lived branch.

Use separate stacks, wiki directories, application-data directories and public
hosts for test and production. On the same Docker host, use separate ports too.
Never point both stacks at the same application database or let test writes alter
production notes. A disposable copy of the wiki works for testing.
Set `BACKSTORY_IMAGE` independently in each stack's private environment file:

```dotenv
# Test stack
BACKSTORY_IMAGE=ghcr.io/bcl1713/backstory:dev
```

```dotenv
# Production stack (or pin the full stable version/digest)
BACKSTORY_IMAGE=ghcr.io/bcl1713/backstory:latest
```

Publication makes an image available; it does **not** redeploy a server. In
Portainer pull the new image and redeploy the appropriate stack. With Compose,
use its own environment/project and run `docker compose -f compose.portainer.yaml
pull` followed by `docker compose -f compose.portainer.yaml up -d`. Pin a full
version or digest when you need an exact tested build or rollback.

Protect `dev` and `main` with PR requirements and require the aggregate
`correctness` check from **synthetic correctness** (select the actual check name
shown on a PR). This check waits for every test job; failed, canceled or skipped
jobs fail it. Disable automatic deletion of `dev` after promotion. Branch rules
and direct-push restrictions must be configured in GitHub repository settings;
workflow checks alone do not prevent direct pushes. Set ordinary PR bases to
`dev` and reserve `main` for promotion.

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

The package is [ghcr.io/bcl1713/backstory](https://github.com/bcl1713/backstory/pkgs/container/backstory).
A release publishes `:1.0.0` and `:v1.0.0` style version tags, moving `:1.0`,
`:1` and `:latest` aliases, and an OCI source/revision/version label. Use a full
numbered tag or the release's image digest for deployment; moving aliases can
advance with later releases. See the [deployment guide](portainer.md) for
Portainer pulling, named users, upgrades and rollback.

Dev publishes its full prerelease version with and without the `v` prefix and
updates **only `:dev`**. It never changes `:latest`, `:1` or `:1.0` style stable
aliases. Both channels support linux/amd64 and linux/arm64. The release page's
attached environment example pins that release's exact image.

The workflow authenticates using the built-in `GITHUB_TOKEN` with
`contents: write` and `packages: write`, following
[GitHub's GHCR workflow guidance](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry#pushing-container-images).
It does not require a personal token secret. Main/dev/tag protection rules must allow
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

Releases are serialized independently for main and dev; publication is never canceled in progress.
GitHub Actions can replace an older pending run when rapid pushes arrive; the
next run covers all changes since the previous stable release. Avoid merging another
change while deliberately recovering a failed release.

If correctness or an image build fails, no GitHub release is published. If the
image push succeeds but release creation/upload fails, image tags may exist
before the public release. Fix the underlying permissions/outage, then rerun
the failed workflow. Lookup/API failures stop publication; they are never treated as a missing release.
A draft release is refreshed to the current source/digest and completed on retry; a stable tag already
pointing at the same commit reuses its version. A previously published release
for that commit is skipped, so a manual retry does not create a patch release.
Branch head is checked before version selection and again after the image build,
before moving aliases. If the branch advances during the build, only pinned image
tags may exist; that run fails before updating channel aliases or creating the
GitHub release. Use **Actions → release → Run workflow → main/dev** to retry the
current branch head. Only main and dev may publish; other manually selected
branches are skipped. Never move/delete published version tags.
GitHub release and GHCR operations are separate API calls, so publication is not
an atomic registry transaction.

Image upload and GitHub release creation occur in the **same workflow**.
GitHub documents that events created by `GITHUB_TOKEN` generally
[do not trigger another workflow](https://docs.github.com/en/actions/how-tos/writing-workflows/choosing-when-your-workflow-runs/triggering-a-workflow#triggering-a-workflow-from-a-workflow);
this pipeline does not rely on a release/tag event to publish the image.

## CI runtime

PRs run CI once, without a duplicate feature-branch push run. Superseded PR runs
are canceled. Dev/main pushes use the release workflow's reusable correctness
gate, without a second standalone push run.

Python runs with `pytest -n 2 --dist loadfile --durations=20`, giving each process
its own disposable configuration/database and keeping a test file together.
Formatter tests, container checks and four Chromium shards run independently of
Python and each other. Each browser runner has its own server and synthetic wiki,
with one Playwright worker; shared-server tests can restart the server and mutate
storage, so increasing worker count within a runner would cause races.

uv/npm dependency caches and Docker layer caches avoid repeated setup. Browser
jobs install only Chromium's headless shell plus system dependencies. Failures
upload screenshots and retained traces for seven days. All suites remain release
gates; no tests are skipped for speed. Actual wall-clock improvement depends on
runner availability, cache hits and the slowest browser shard/container build.

For the initial cut: land the workflow/docs with the reviewed application branch,
wait for the main correctness gate and multi-platform publication, then verify
`v1.0.0`, image labels/digest/platforms and pull access. Actual live wiki enrollment,
Portainer deployment and proxy changes remain operator-controlled steps.
