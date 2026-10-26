# Dev releases and faster CI

Agreed in conversation: publish images and GitHub prereleases automatically for
successful `dev` merges. Promote through `dev` → `main`; main continues publishing
stable releases. The test server can follow `:dev`, production `:latest`, and both
can pin versions/digests. Publishing does not redeploy either server.

## Approaches

Automatic dev images with manually created prereleases would minimize release
pages but lose automatic build history and deployment assets. The user chose
automatic images **and** prereleases. Reuse the existing release workflow for both
channels so platform support, correctness gates, assets and retry behavior match.

## Implementation decisions

- Preserve stable Conventional Commit versioning. Dev versions use the prospective
  stable version plus `-dev.<commit-count>.g<12-character-sha>`; retries are stable
  and dev tags cannot influence stable version selection.
- Both channels publish linux/amd64 and linux/arm64 with pinned tags. Dev updates
  only `:dev`, and is explicitly a prerelease with `--latest=false` on GitHub.
  Main alone updates stable major/minor aliases and `:latest`.
- Serialize publication per branch without canceling uploads. Recheck branch head
  before moving aliases, including after the build. Keep API failures fatal and
  published-release retries idempotent.
- PRs target dev; promotion PRs to main must come from this repository's dev.
  Preserve commit ancestry with merge commits for promotion. Repository protection
  remains an operator setting, with required-check guidance in release docs.
- Run Python, browser, formatter and container jobs independently. Use two pytest
  processes and four browser shards on separate runners; keep one browser worker
  per shard because tests share a mutable server. Cache uv, npm and Docker layers.
- Run PR CI once, cancel superseded PR checks, and let branch release workflows
  call the same correctness gate. Preserve every existing correctness check.
- Fix the observed browser URL assertion race with Playwright's waiting assertion.
  Retain failure traces and screenshots as CI artifacts.

## Boundaries and validation

No server/proxy changes, production data access or automatic deployment. Preserve
unrelated workspace changes. Exercise version selection with real Git histories,
release shell orchestration against controlled external CLIs, full parallel Python
and browser suites, formatter checks, asset build and workflow validation.
