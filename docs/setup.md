# Set up Backstory

**Already have a wiki? [Connect the existing folder](#2b-start-with-an-existing-wiki).**
Backstory reads your Markdown files where they are: there is no import,
conversion, move, or whole-wiki formatting step. Your paths, assets and external
editors remain part of your workflow. A backup and read-only rehearsal are
recommended before enabling writes; the same setup supports your actual wiki
folder after deliberate operator configuration.

For a first look without your own files, try the [optional disposable demo](#2a-try-a-clean-disposable-demo).

This guide runs one container on <http://127.0.0.1:8000>. Public exposure,
production HTTPS and reverse proxies are outside this guide; proxy trust is
currently unsupported. See [limitations](limitations.md) before using network
storage or relying on ownership, ACLs or extended attributes.

## 1. Get the application

These commands use Linux and Bash. Install Git and [Docker Engine](https://docs.docker.com/engine/install/)
with the [Compose plugin](https://docs.docker.com/compose/install/), with permission
to use the Docker daemon. Check `git --version`, `docker version` and
`docker compose version`. Python, Node and the formatter run inside the image;
you do not need them on the host to connect an existing wiki. The generated demo
below additionally needs host Python 3.14 and [uv 0.12.19](https://docs.astral.sh/uv/getting-started/installation/).

The implemented application currently lives on `feat/backstory-release-one`;
`main` does not yet contain this release. Until it is merged, clone that branch:

```sh
git clone --branch feat/backstory-release-one https://github.com/bcl1713/backstory.git
cd backstory
```

If you already have this branch checked out, use that checkout. Build commands
need access to the pinned dependency registries. See [operations](operations.md#build-and-start-on-localhost)
if your managed build network requires a CA bundle; keep TLS verification enabled.

Three locations have different purposes:

| Location | What belongs there |
| --- | --- |
| Wiki source directory, bound to `/wiki` | Your existing Markdown files and assets, outside the application checkout/build context. Startup never creates or repairs this directory. |
| Private application data, `/var/lib/backstory` | SQLite users, sessions, index, protected drafts, revision history and the generated signing secret. Compose keeps these in the project's `backstory-data` named volume on local storage, outside the wiki. |
| Private configuration directory, outside the wiki and checkout | The dotenv configuration, identity path/hash and any Compose overrides. Do not put configuration or application backups in the wiki. |

Use one stable configuration file and Compose project name for each installation.
A different project name creates a different application volume: it can look like
accounts and history have disappeared. Reuse the same project and configuration
for every start, stop, account and backup command. Use a **fresh project name**
for each rehearsal so you do not reuse another demo's users, sessions or secret.

## 2A. Try a clean disposable demo

Choose a fixture directory, config filename and project name you have not used
before; replace the example names below if necessary. The generator refuses existing
paths and creates only synthetic notes and inert assets. `--for-containers` makes
only this new public test wiki container-writable; it is not a permission repair
command for existing files.

```sh
BS_CONFIG="$HOME/.config/backstory/demo-first.env"
BS_PROJECT=backstory-demo-first
BACKSTORY_REPO="$PWD"
BS_COMPOSE="$BACKSTORY_REPO/compose.yaml"
bs() {
  env -u BACKSTORY_WIKI_ROOT -u BACKSTORY_IDENTITY_PATH -u BACKSTORY_IDENTITY_SHA256 \
    docker compose --env-file "$BS_CONFIG" -p "$BS_PROJECT" -f "$BS_COMPOSE" "$@"
}
prepare_demo() (
  umask 077
  test ! -e "$BS_CONFIG" &&
  test ! -L "$BS_CONFIG" &&
  uv sync --frozen &&
  uv run python -m tests.fixtures.generate /tmp/backstory-first-demo --profile small --for-containers &&
  mkdir -p "$HOME/.config/backstory" &&
  (set -C; cat /tmp/backstory-first-demo/fixture.env > "$BS_CONFIG")
)
prepare_demo &&
  bs config --quiet &&
  bs build &&
  bs run --rm web python manage.py migrate &&
  bs run --rm web python manage.py create_account &&
  bs run --rm web python manage.py create_account &&
  bs up -d --no-build &&
  bs exec web id &&
  bs exec web python manage.py storage_status
```

Preparation and startup stop on failure. Use a new config filename too; if it
already exists, choose another rather than reusing it. The no-clobber copy refuses
a destination created concurrently. Keep the generated `Home.md` unchanged: it
is this fixture's identity.
The fixture's `BACKSTORY_DATA_DIR` is for native development. The supplied Compose
service overrides it with its private named volume.

Create a named human account and a separate ordinary assistant account at the
interactive prompts. Use unique strong passwords of at least 12 characters.
Password input is hidden; there are no default accounts, password arguments or
registration page. Run account creation in a terminal, without piping passwords.
Human and assistant accounts have the same access to eligible shared wiki
content; there are no per-note or per-folder user permissions. Protected drafts
are account-private; authenticated note history is shared. Choose your source
tree and exclusions accordingly before connecting an existing wiki.

Expect `id` to show UID/GID 10001 inside the container, and status to say
`ready: identity_verified`. **Read the status text**: `storage_status` can exit
successfully while reporting `unavailable`. Continue at [first use](#3-sign-in-and-check-the-workflow).
Stop this demo with `bs stop` before starting another installation: the supplied
Compose file uses the fixed localhost port 8000.

## 2B. Start with an existing wiki

### Prepare the source and its identity

Take an operator-managed backup or snapshot of the wiki, **including assets**.
Prefer a private rehearsal copy and a fresh application project first. Keep both
the wiki and its rehearsal copy outside the application checkout/Docker build
context: the image build copies checkout files into the image. Do not move or
convert the original wiki. Backstory does not configure mounts, sync or
permissions for you. Verify independently that the chosen directory is the
intended storage, with the expected notes and assets, before enrolling it.

Storage needs an operator-approved, stable, non-secret identity file already in
the wiki. It must be a regular file, at most 64 KiB, with a wiki-relative path.
Neither it nor a path component can be a symlink or hidden. It must pass the
[storage policy](storage.md): credential/auth/key files, agent rules, config and
other excluded names cannot be identities. Use identity bytes that distinguish the
intended mounted storage from a fallback directory, and verify the mount
independently before recording them.
Never hash an empty fallback directory or choose an authentication file.

Choose a file whose bytes will remain unchanged. Backstory refuses to edit its
identity file. `Home.md` is suitable only if you deliberately reserve it as
immutable; an ordinary home note that you or another editor updates is unsuitable.
Do not use a hidden marker. If no suitable file exists, deliberate administrator
enrollment outside Backstory needs explicit authorization before creating a
stable non-hidden, non-secret identity file. Backstory neither creates a marker
nor chooses a file for you.

After verifying the intended storage and approving that particular file, compute
its hash read-only. For example, **only if `Storage identity.txt` is the approved
file** in your rehearsal copy:

```sh
sha256sum -- /absolute/path/to/wiki-rehearsal/Storage\ identity.txt
```

Record the SHA-256 with the approved wiki-relative path outside the wiki. If the
expected identity later disappears or differs, restore/verify the intended
storage. Do not reset the expected hash just to make status green.

### Write private configuration

Create a private directory outside both the wiki and checkout, then edit a new
file there with your editor:

```sh
umask 077
mkdir -p "$HOME/.config/backstory"
BS_CONFIG="$HOME/.config/backstory/wiki-rehearsal.env"
```

Save the following dotenv content to that file, replacing the three source and
identity values with your approved absolute source directory, relative identity
path and complete 64-character hash. Single quotes allow spaces in paths. These
are configuration data, not shell commands: do not `source` or `eval` this file.

```dotenv
BACKSTORY_WIKI_ROOT='/absolute/path/to/wiki-rehearsal'
BACKSTORY_IDENTITY_PATH='Storage identity.txt'
BACKSTORY_IDENTITY_SHA256='REPLACE_WITH_APPROVED_64_CHARACTER_SHA256'
BACKSTORY_COOKIE_MODE=localhost
BACKSTORY_ALLOWED_HOSTS=localhost,127.0.0.1
BACKSTORY_PROXY_MODE=off
```

The supplied Compose service explicitly sets `/wiki`, `/var/lib/backstory`,
localhost cookies and allowed hosts inside the container. `BACKSTORY_WIKI_ROOT`
in the dotenv file selects the host bind source; it is not the container path.
Do not set `BACKSTORY_DATA_DIR` to your wiki: this Compose service always uses the
project's local named volume. A dotenv entry alone does not pass an arbitrary
setting into the container. For example, optional `BACKSTORY_EXCLUSIONS` requires
an explicit Compose service `environment` override; see [storage policy](storage.md).
Exclusions only add denies. If extending this recipe, keep policy overrides
separate from the temporary read-only mount override and include them on every
command, including after enabling writes.

### Check permissions, then start with a read-only wiki

The default process is UID/GID 10001 **inside the container**. Docker-socket or
Docker-group access says nothing about its access to wiki files. Rootless Docker
maps IDs differently; verify the effective mapping on your host. Reads require
file read access and directory traversal. A safe save also needs write access to
the note's parent directory to stage and replace a sibling file; file write bits
alone are insufficient.

Resolve access deliberately with your administrator. Do not apply blanket
`chmod 777`, recursive ownership changes or a wiki permission repair script.
Changing Compose's `user` alone can make the private application volume unwritable.
New notes are mode 0600, owned by the app's effective host identity; external
editors may need planned access. Replacement preserves basic mode bits, but
creates a new inode and does not copy ownership, ACLs, xattrs or hard-link
relationships. See [write limitations](limitations.md).

Start a rehearsal with the wiki bind read-only. Application metadata still
changes in SQLite: accounts, sessions and indexing need the writable private
application volume. Save this override as
`$HOME/.config/backstory/wiki-readonly.yaml`:

```yaml
services:
  web:
    volumes:
      - type: bind
        source: ${BACKSTORY_WIKI_ROOT:?Set the approved existing wiki directory}
        target: /wiki
        read_only: true
        bind:
          create_host_path: false
```

The source bind uses long syntax so a typo cannot create a replacement host
folder. Compose merges mounts by container target; this replaces the `/wiki`
bind while retaining the separate application volume.

Choose a project name never used for another installation; the example below
uses `backstory-wiki-rehearsal-first`. Use the same explicit files and project on
every later command. This helper clears
three exported variables which could otherwise override `--env-file` with stale
storage from another terminal session. It does not execute the dotenv file.
Run from the application checkout:

```sh
BS_CONFIG="$HOME/.config/backstory/wiki-rehearsal.env"
BS_PROJECT=backstory-wiki-rehearsal-first
BACKSTORY_REPO="$PWD"
BS_COMPOSE="$BACKSTORY_REPO/compose.yaml"
BS_READONLY="$HOME/.config/backstory/wiki-readonly.yaml"
bs() {
  env -u BACKSTORY_WIKI_ROOT -u BACKSTORY_IDENTITY_PATH -u BACKSTORY_IDENTITY_SHA256 \
    docker compose --env-file "$BS_CONFIG" -p "$BS_PROJECT" \
    -f "$BS_COMPOSE" -f "$BS_READONLY" "$@"
}
bs config
```

Before starting, inspect `bs config`: `/wiki` must show your approved source and
`read_only: true`. Confirm `create_host_path: false` in both source Compose files;
some Compose normalizers omit explicit false values from their output. Keep
resolved paths private.
If port 8000 is occupied, stop the earlier demo or local server before proceeding.
Then build and start, creating a human and a separate assistant interactively
with unique strong passwords of at least 12 characters (hidden terminal input).
Both accounts share access to eligible wiki content and history; there are no
per-note or per-folder user permissions. Protected drafts are account-private:

```sh
bs build &&
  bs run --rm web python manage.py migrate &&
  bs run --rm web python manage.py create_account &&
  bs run --rm web python manage.py create_account &&
  bs up -d --no-build &&
  bs exec web id &&
  bs exec web python manage.py storage_status
```

Expect UID/GID 10001 and the actual text `ready: identity_verified`; an exit code
of zero alone is insufficient. Readiness verifies readable identity bytes,
**not** permission to save. The read-only wiki should refuse a save; copy or
Store protected draft before leaving an edited page. Do not test by editing the
identity file.

Sign in, browse folders, open ordinary notes and inspect assets. Search fills in
as the background index worker runs automatically. Partial results are expected
at first; opening a note reads current disk without waiting for indexing. Check
Storage status for readiness and index progress.

### Enable writing deliberately

Enable writes only when the operator chooses to proceed, has a ready backup,
and has verified directory/file access and the filesystem limitations. Keep
using the rehearsal copy until confident. Removing the read-only override is an
explicit transition; it does not repair permissions or change the source.

Keep `BS_CONFIG`, `BS_PROJECT` and `BS_COMPOSE` unchanged. Replace the helper with
the following, then recreate the web container. If you added a separate persistent
exclusion override, retain its `-f` argument here too.

```sh
bs() {
  env -u BACKSTORY_WIKI_ROOT -u BACKSTORY_IDENTITY_PATH -u BACKSTORY_IDENTITY_SHA256 \
    docker compose --env-file "$BS_CONFIG" -p "$BS_PROJECT" -f "$BS_COMPOSE" "$@"
}
bs config
bs up -d --no-build --force-recreate
bs exec web python manage.py storage_status
```

Confirm `/wiki` now permits writing in the resolved configuration and status
still verifies the same identity. The same project retains its application
volume, accounts, secret, sessions, drafts and history. Changing from rehearsal
to original storage is a separate operator decision: verify and back up that
storage and deliberately configure its approved identity before connecting it.

## 3. Sign in and check the workflow

Open <http://127.0.0.1:8000/accounts/login/> and use the same hostname throughout
for cookies. Sign in as the human; use a separate browser context for the
assistant. There are no privileged assistant accounts.

After deliberately enabling writes, use **New note** to create a disposable
`.md` note in an existing writable folder, save it and reopen it. Keep the
identity unchanged. Startup does not recursively format notes; opening a note
does not format it either. Save runs the [formatting pipeline](formatting.md),
which can change whitespace/newlines while preserving supported meaningful front
matter. Optional formatting configuration is described there; try your own
formats on the rehearsal copy first.

For an optional conflict check, open that disposable note in two signed-in
browser contexts. Save one edit, then try the other: HTTP 412 offers
base/current/draft for manual comparison. Copy/download your draft or explicitly
**Store protected draft** before refresh. Accept the displayed current revision,
merge manually and save. Backstory never automatically retries or replays a
draft when storage returns. Formatter failure keeps the source and diagnostics;
review them and deliberately choose **Save source without formatting** if needed.
That recovery still enforces storage, conflict and backup checks.

Use [operations](operations.md#normal-and-recovery-walkthrough) for per-note
history, restoration, protected drafts and session revocation.

## 4. Stop, restart and back up

Keep the same helper/configuration/project for daily commands, including any
active read-only or exclusion overrides:

```sh
bs stop
bs up -d --no-build
bs restart
```

`bs down` removes containers/network and retains the named application volume.
Do not add `--volumes` to normal shutdown: that deletes accounts, sessions,
signing secret, protected drafts and history. Back up application data and wiki
files separately; follow [application backup and separate wiki backup](operations.md#application-backup-and-separate-wiki-backup)
and verify restores in disposable storage first. Use `bs` in place of
`docker compose` for this installation; the operations walkthrough uses its own
disposable example paths. The default recovery retention
is 30 days with a 64 MiB logical quota. Saves and protected-draft storage prune
expired recovery rows too; the explicit `prune_recovery` command supports
maintenance. Pruning is not a substitute for
backups. See the operations guide for retention and pruning.

## Troubleshooting

Preserve an unsaved draft by copying/downloading or explicitly storing it before
refreshing or restarting. Diagnose the intended storage rather than resetting
its expected identity hash.

| Symptom | What to check |
| --- | --- |
| `identity_missing`, `identity_mismatch`, `root_missing` or `identity_unreadable` | Confirm the intended mount/source and approved identity path/hash, policy, size and read/traversal access. Restore the expected storage; do not enroll whatever is visible. A missing bind source can also stop Compose before the app starts. |
| `ready` but Save gives `wiki_write_denied` or `storage_io_error` / HTTP 503 | Identity readiness only proves a read. Check whether the wiki bind is deliberately read-only, parent-directory access and filesystem health. Do not retry an uncertain save blindly; compare the current note first. |
| `staging_cleanup_required` after repeated read-only Save | Preserve the draft and avoid further read-only saves. During the deliberate writable recreation above, startup performs guarded cleanup of registered stages once storage is ready. Compare the current note before explicitly saving again; do not delete the staging registry or wiki files by hand. |
| Application data permission error after changing `user` | The named volume was prepared for UID/GID 10001. Review the effective host mapping and application-volume access with the administrator; a user override alone is insufficient. |
| Wrong wiki, missing accounts or apparently new history | Check `BS_CONFIG`, the resolved bind and exact `BS_PROJECT`. Keep the helper's `env -u` entries to clear stale exported source/identity values. Reconnect the original intended project; do not delete volumes. |
| Search has partial/stale results | Check index progress in Storage status. The automatic worker catches up; Refresh index queues maintenance, and Rebuild index explicitly replaces the projection. Direct note opening remains available. |
| Format/Save fails on source | Keep the draft and inspect diagnostics. Explicit source recovery skips formatting only; it does not bypass conflicts or storage safety checks. |
| HTTP 412 | Another writer changed the file. Compare base/current/draft, explicitly accept the current revision and merge manually. |
| Login/cookies seem inconsistent | Stay on either `127.0.0.1` or `localhost` consistently. The supplied Compose recipe uses localhost HTTP cookies; it is not a proxy configuration. |
| Port 8000 already bound | Stop the earlier demo or local server. Both example projects use the supplied fixed localhost port. |

For native development and generated test profiles, see [development](development.md).
For excluded paths and UTF-8/source-size limits, see [storage](storage.md).
