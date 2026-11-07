# Local correctness and publication

GitHub Actions is disabled for this repository. The former workflows live under
`retired-workflows/` as an inert migration reference, not an executable workflow
or a substitute for current local evidence. No `.github/workflows/*.yml` files
remain in this branch. Do not re-enable Actions or add a hosted runner to unblock
a local test failure.

## Run the complete gate

The automatic publisher owns this gate during ordinary releases. Development
uses [focused checks](../development.md); do not routinely run the complete gate
before merge and then repeat it through the publisher. Run it manually for
manual release recovery or a specific integration risk that warrants it. Reuse
a valid exact-commit receipt for subsequent manual publication attempts while
the relevant inputs are unchanged. The publisher currently starts a new full
gate for every automatic attempt; changing its retry/reuse behavior is separate
work. See the [test review](../testing/2026-11-07-test-review.md).

Use a trusted Linux x86_64 machine with Linux pidfd support, Python 3.9+ for
the runner, Docker Engine/Compose, a working browser sandbox, Node **22.23.4**, uv **0.12.19**, and Playwright's Linux OS dependencies.
The runner installs the frozen application dependencies and browser binaries.
Install OS packages separately on the intended test machine; the runner does not
change system settings or install a Docker daemon. Both automatic browser lanes
use Playwright's supported patched Firefox: exact `@playwright/test` **1.64.1**
and the npm lockfile select Firefox **157.0**, revision **1555**. Install through
Playwright; substituting a stock executable is unsupported. The separate pinned
stock Firefox/geckodriver smoke is opt-in. See the [assertion inventory, measured
baseline, browser update policy and compatibility command](../testing/2026-11-07-issue-117-evidence.md).

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
and database, and one Playwright worker as before. The automatic gate uses the
focused Firefox suites; the catch-all Chromium suite (440 tests at removal) is
no longer run or required by release receipts, and browser installation is limited
to Firefox. Python retains its two
isolated xdist workers. For individual issues, run the relevant tests directly.

The full gate includes asset build, all Python and formatter tests,
focused Firefox code blocks, Firefox renderer tests including all 32 synthetic
viewport/scaling/font/child-CSS-zoom combinations, Django deployment checks,
Compose validation and a built-container Django check. A
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
on the same clean commit creates `receipt.json`. Schema2 requires the consolidated
gate set and rejects legacy stock-lane receipts. Keep the receipt, logs,
screenshots and traces with the review record. A locally produced receipt is
operator evidence, not a signed third-party attestation. Inspect actual screenshots
for changed UI flows before merging; automated passes do not replace UI review.
All browser screenshots, traces and fixture roots are scoped to this run’s
configured runtime directory.

## Automatic publication on merge

The persistent `backstory-publisher` user service on **forge** watches `dev` and
`main` every 30 seconds. A merge starts the complete local gate on the resulting
exact commit, then automatically builds/uploads multiarch images, tags them and
publishes the matching GitHub release. No post-merge publication command is
required. Ordinary pushes to these release branches are detected too; PR review
still happens before merging. GitHub Actions stays disabled.

Dev publishes prerelease version tags and only `:dev`. Main publishes stable
version tags, minor/major aliases and `:latest`. Every attempt owns a private
checkout and evidence/assets directories. A newer branch supersedes old work;
the release runner checks freshness again before moving aliases. A failed gate
never uploads an image. Failures retain logs and retry after five minutes; a
new commit starts without waiting for an older failure's retry. Successful
publication is recorded atomically and skipped across service restarts.

### Publisher setup and status

The controller is a dedicated checkout at
`~/.local/share/backstory-publisher/controller`; runtime state and attempt logs
live at `~/.local/state/backstory-publisher`. Keep these separate from personal
development checkouts. Install the pinned Node under
`~/.local/share/backstory-publisher/tools` and make uv/Python available in
`~/.local/bin`. Install Playwright OS dependencies, including `fonts-liberation`
for Graphviz's Arial-compatible metrics. The included fontconfig template also
supports private fonts under `~/.local/share/backstory-publisher/fonts`.

The service template is `scripts/systemd/backstory-publisher.service`. Copy it
to `~/.config/systemd/user/`, and copy `scripts/systemd/fonts.conf` to the fonts
directory above. Optional machine-specific non-secret selectors can override
defaults through `~/.config/backstory-publisher/environment`.

The publication builder selector applies only to release uploads. Correctness
uses Docker's local default builder so its disposable test images are loaded
for Compose and Docker integration checks.

Existing `gh` authentication needs repository/release and `write:packages`
access. Service startup passes that existing token through stdin to GHCR login
in its private Docker configuration; it never prints or creates a token. Create
a dedicated multiarch builder using those same selectors before enabling it:

```sh
export DOCKER_HOST="unix://$XDG_RUNTIME_DIR/docker.sock"
export DOCKER_CONFIG="$HOME/.local/state/backstory-publisher/docker"
install -d -m 0700 "$DOCKER_CONFIG"
docker buildx create --name backstory-publisher --driver docker-container --bootstrap
```

At initial migration only, baseline the existing historical main revision without
publishing it. Leave dev unbaselined so the service catches up the current merge:

```sh
cd "$HOME/.local/share/backstory-publisher/controller"
python3 scripts/local_publisher.py --state-dir "$HOME/.local/state/backstory-publisher" --baseline-current main
systemctl --user daemon-reload
systemctl --user enable --now backstory-publisher.service
journalctl --user -u backstory-publisher.service -f
```

Ensure the user manager survives logout/reboot (`loginctl show-user "$USER" -p
Linger`); an administrator can enable lingering if needed. The baseline is an
explicit ignored revision, never a claim of successful publication. Later main
merges publish normally. Baseline initialization refuses an already initialized
channel.

Inspect the live branch/attempt state without disturbing the running service:

```sh
python3 scripts/local_publisher.py --state-dir "$HOME/.local/state/backstory-publisher" --status
systemctl --user status backstory-publisher.service
```

Stop drains the current attempt, including any upload, before exiting. To update
the controller itself, stop the service, update its dedicated clean checkout to
the reviewed dev revision, then restart it. New application commits are fetched
automatically into attempt checkouts; they do not require controller updates.
One service lock serializes both channels. Logs and synthetic attempt directories
are retained for review; remove old completed attempts only when no job uses them.

### Manual recovery

Manual publication remains available for operator recovery. Stop the automatic
publisher first, use an isolated clean checkout and run the full exact-commit
gate. The service already performs these steps during ordinary operation:

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
No GitHub-hosted build runs. These low-level scripts do not register a runner,
expand account access or deploy a server.

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
