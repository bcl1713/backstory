# Local correctness and publication

GitHub Actions is disabled for this repository. The former workflows live under
`retired-workflows/` as an inert migration reference, not an executable workflow
or a substitute for current local evidence. No `.github/workflows/*.yml` files
remain in this branch. Do not re-enable Actions or add a hosted runner to unblock
a local test failure.

## Run the complete gate

Use a trusted Linux x86_64 machine with Linux pidfd support, Python 3.9+ for
the runner, Docker Engine/Compose, a working browser sandbox, Node **22.23.4**, uv **0.12.19**, and Playwright's Linux OS dependencies.
The runner installs the frozen application dependencies and browser binaries.
Install OS packages separately on the intended test machine; the runner does not
change system settings or install a Docker daemon. Stock Firefox stays pinned to
155.0.1 and geckodriver to 0.37.1 with the original checksum verification.

Commit the reviewed candidate in a clean isolated checkout, then run:

```sh
python3 scripts/local_ci.py --base dev --head your-feature-branch
```

For a `dev` to `main` promotion, verify that both branches belong to this repository
and run the proposed merge tree with `--base main --head dev`. The script checks
the stated branch policy; the reviewer must also verify the actual PR's source
repository. A local argument is not trusted GitHub PR metadata.

`--plan` prints every command without running it. `--report /new/external/path`
chooses a new evidence directory outside the checkout; otherwise a private
temporary directory is created. Use a different `--port` for another concurrent
suite. Run from separate checkouts so dependency installation and asset builds
cannot race. Browser suites run sequentially, each with its own synthetic wiki
and database, and one Playwright worker as before. Chromium runs the whole suite,
not just one former shard. Python retains its two isolated xdist workers.

The full gate includes asset build, all Python and formatter tests, Chromium,
focused Firefox code blocks, Firefox renderer tests, pinned stock Firefox, Django
deployment checks, Compose validation and a built-container Django check. A
missing tool or failed stage blocks success. There is no reduced-release or
skip-tests mode. The runner creates only synthetic fixture data, uses a unique
Compose project, and attempts cleanup of only that project's disposable volume
on exit, including timeout or interruption. Cleanup failure fails the gate.
The runner allows identified child processes time to shut down before forcefully
stopping them, including detached browser/server sessions. If a wrapper exits
abruptly before its descendants can be identified, orphaned processes may remain.
Inspect and stop those test processes before reusing a failed run's port; this
runner is not an operating-system container or a process isolation boundary.

Each stage has a log; `status.json` records progress/failure. Only a complete pass
on the same clean commit creates `receipt.json`. Keep the receipt, logs,
screenshots and traces with the review record. A locally produced receipt is
operator evidence, not a signed third-party attestation. Inspect actual screenshots
for changed UI flows before merging; automated passes do not replace UI review.
All browser screenshots, traces and fixture roots are scoped to this run’s
configured runtime directory.

## Local release

Merging no longer publishes automatically. Test the exact resulting dev/main
commit locally, and review its evidence before release. Publication requires
existing GitHub CLI and GHCR Docker authentication on the intended machine and
an existing buildx builder supporting linux/amd64 and linux/arm64. The scripts do
not create credentials, log in, register a runner, expand access or deploy a
server. Arrange missing authentication separately through the supported secure
workflow.

```sh
python3 scripts/local_release.py --receipt /path/to/receipt.json \
  --channel dev --assets /new/path/to/release-assets --publish
```

Use `--channel stable` only for the tested current `main` commit. The script
validates the exact-commit receipt, clean checkout, expected repository and
current remote branch. It builds an immutable Git archive of that commit locally,
publishes multi-platform version tags, then checks branch freshness again before
moving channel aliases. Dev updates only `:dev`; stable updates minor, major and
`:latest`. Version selection and GitHub release assets follow the prior policy.
No GitHub-hosted build runs.

Publication is serialized per channel for worktrees sharing one Git common
directory. Independent clones and different machines do not share that lock;
coordinate one publisher across all of them. Partial image/release publication is possible because registry and GitHub
operations are not atomic. Fix the cause and retry with a fresh assets directory
and the same valid receipt only if source is unchanged. Never move/delete a
published version tag to recover. A retry reuses the registry digest only when
both full version tags agree and both architectures carry the tested source and
version labels; it never rebuilds or overwrites existing version images. Registry
lookup errors, conflicting metadata or a single partially pushed tag stop
publication. For a single missing tag, inspect the existing digest and source
before restoring only the missing tag from that digest; conflicting tags require
operator investigation, never an overwrite. A newer source requires a new full local pass.

## Transition checks

- Keep repository Actions disabled, including while merging this change. Old
  branches and the historical main workflow must not restart hosted jobs.
- Check active/queued runs and cancel separately if any exist. Disabling future
  workflows does not establish that every previously started job has stopped.
- Preserve PR/code/UI review. Do not add a fake successful hosted status or weaken
  branch protection. At transition time main/dev were unprotected and the
  repository ruleset list was empty; verify current settings before any change.
- Do not claim local CI is working until the complete script succeeds on a
  capable local machine. Focused tests for these scripts are not application,
  browser or container acceptance.
