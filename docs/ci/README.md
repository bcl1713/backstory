# Local correctness and publication

GitHub Actions is disabled for this repository. The former workflows live under
`retired-workflows/` as an inert migration reference, not an executable workflow
or a substitute for current local evidence. No `.github/workflows/*.yml` files
remain in this branch. Do not re-enable Actions or add a hosted runner to unblock
a local test failure.

## Run the complete gate

The local candidate queue owns the full release gate **before** a release branch
advances. Development uses [focused checks](../development.md). Publication and
upload retries reuse the candidate's exact receipt; the publisher never starts
an unconditional second gate. See the [candidate sequence](#tested-merge-queue)
and [test review](../testing/2026-11-07-test-review.md).

Use a trusted Linux x86_64 machine with Linux pidfd support, Python 3.9+ for
the runner, Docker Engine/Compose, `dpkg-query`, fontconfig (`fc-match`), a working browser sandbox, Node **22.23.4**, uv **0.12.19**, and Playwright's Linux OS dependencies.
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
focused Firefox code blocks, Firefox renderer/profile projects including all 32
synthetic viewport/scaling/font/child-CSS-zoom combinations, Django deployment
checks, Compose validation and a built-container Django check. A
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

## Tested merge queue

Use one trusted controller and private state directory on the capable gate
executor. Keep GitHub Actions disabled. Update the clean controller before
preparing candidates when the gate contract changes. Never copy another commit's
receipt or synthesize a hosted check. A receipt is operator evidence, not a signed
attestation; restrict write access to the state directory.

Prepare a candidate from current same-repository PR metadata:

```sh
STATE="$HOME/.local/state/backstory-publisher"
python3 scripts/local_candidate.py --state-dir "$STATE" prepare --pr 123
# The command prints /.../candidates/<merge-sha>/candidate.json.
CANDIDATE=/path/printed/by/prepare/candidate.json
python3 scripts/local_candidate.py --state-dir "$STATE" test --candidate "$CANDIDATE"
```

Preparation creates a real two-parent merge in a disposable clone: current base
first, current PR head second. The merge's SHA is the publication source identity.
The full gate runs there before either release branch advances. Dependencies and
the pinned browser install first; runtime provenance is captured before checks
and must still match when the receipt is written and reused. It includes source
SHA/tree, complete gate contract/schema, Python/Node/npm/uv/Docker versions,
installed Python package and npm dependency-tree hashes, Firefox executable
hash, OS package hashes, selected font/config
hashes, and hashed relevant environment selectors. No token values are recorded.
Changing the toolchain, packages, font configuration or browser requires a new
candidate gate, even with the same source. Use the same executor and interpreter
for testing, landing and publication; this conservative restriction can reject
otherwise equivalent machines.

Have an independent reviewer inspect the candidate merge result, relevant UI
screenshots and retained logs. Retain a local JSON review record outside source:

```json
{"source_sha":"<exact-merge-sha>","status":"approved","reviewer":"independent reviewer","summary":"Code, merge result, UI and retained evidence reviewed; no blocking findings."}
```

An authorized operator acknowledges that exact review when landing:

```sh
python3 scripts/local_candidate.py --state-dir "$STATE" land \
  --candidate "$CANDIDATE" --reviewed-candidate <exact-merge-sha> \
  --review-record /path/to/independent-review.json
```

Landing revalidates the receipt, clean tree, PR state/repository/branch policy,
head/base and current review requirements. Outstanding change requests or unmet
required GitHub review decisions block it. When the repository has no required
GitHub reviews, independent retained local review remains mandatory. This local
record does not satisfy or bypass branch protection: a rejected remote push stops
landing; ask the repository owner to select a compatible policy, never disable
protection or forge a check. Use neither GitHub's merge button nor squash/rebase:
those can generate a different, untested SHA. Landing sends one atomic Git push with explicit expected leases on **both**
the target and PR source branches. Both refs advance to the same tested merge;
its two parents make both updates fast-forwards. A changed head or base rejects
the whole transaction. A server without atomic-push support fails closed. For a
feature PR, this intentionally advances the feature branch to its reviewed merge
result; continue new work from that result or create a new branch.

For `dev` → `main`, this atomically synchronizes **both release branches** to the
tested merge at landing. There is no later main-to-dev synchronization merge.
The publisher serially processes dev prerelease publication first, then stable
publication from the same source SHA, using one gate receipt with explicit
`landed_branches: ["dev", "main"]`. Each channel records only its actual completed
release; a stable upload failure does not undo the dev prerelease or retest it.
Stable version tags remain protected by the release runner's existing version,
source, registry and freshness validation. Coordinate one publisher executor.

A changed base or head invalidates the candidate. Prepare, review and test its
new merge result; receipts never transfer between commits. The queue serializes
local candidate operations. A transport/crash after the atomic push leaves
durable `landing` evidence. Repeating `land` recognizes both remote refs at the
exact candidate and finalizes state without testing or pushing again. If either
ref changed since then, inspect retained evidence and remote history; the tool
fails closed rather than guessing whether a partial operation succeeded.

## Automatic publication after landing

The persistent `backstory-publisher` user service on **forge** watches `dev` and
`main` every 30 seconds. It requires the release SHA's retained candidate store
under the same state directory, validates its reviewed source and receipt, and
runs only publication. Missing, failed, stale or changed evidence fails closed;
ordinary direct pushes no longer trigger a compensating post-merge gate.

Dev publishes prerelease version tags and only `:dev`. Main publishes stable
version tags, minor/major aliases and `:latest`. Attempts own fresh asset/log
directories and reuse the retained clean candidate checkout and receipt. A newer
branch supersedes old work; the release runner checks freshness before build and
again before moving aliases. Upload failures retry after five minutes without
retesting. Successful publication is recorded atomically across restarts.

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

At initial installation, baseline historical revisions only when intentionally
skipping their publication. Do not baseline an unpublished current release to
hide missing evidence. During an upgrade, stop the old publisher and retain its
state, receipts and assets first. Already published/baselined revisions remain
unchanged. An unpublished revision without a reviewed candidate record fails
closed under the new controller. Recover it manually with its same-commit valid
schema/provenance receipt, or prepare and gate a new reviewed merge candidate;
legacy receipts without runtime provenance require a real new gate. Do not copy
a receipt to a different SHA or pretend a historical merge was tested premerge.
The following baseline command is only for an intentionally ignored historical
main revision:

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
publisher first and use the retained clean candidate checkout and valid receipt.
Run the full gate only when evidence is absent or source/relevant inputs changed.
Never rerun it solely because a publication or upload failed:

```sh
python3 scripts/local_release.py --receipt /path/to/receipt.json \
  --channel dev --assets /new/path/to/release-assets --publish
```

Use `--channel stable` only for the tested current `main` commit. The script
validates the exact-commit receipt and current runtime provenance, clean checkout, expected repository and
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
operator investigation, never an overwrite. A newer source or changed runtime inputs requires a new tested candidate.

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
