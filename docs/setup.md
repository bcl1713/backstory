# Set up Backstory

**Already have a wiki? [Connect the existing folder](#2b-start-with-an-existing-wiki).**
Backstory edits Markdown files where they are; no import or conversion is needed.
The main workflow is a private `.env` and ordinary `docker compose` commands.
A [disposable demo](#2a-try-a-clean-disposable-demo) is also available.

The defaults publish on the Docker host's `127.0.0.1`, with localhost cookies
and proxy trust off. Open <http://127.0.0.1:8000> on that host. For a server behind
an existing HTTPS proxy, use the [generic proxy setup](reverse-proxy.md) after
preparing storage below. The same app supports compatible Nginx Proxy Manager,
Caddy and other proxies through one explicit header/peer contract. Portainer is
an alternative way to manage the same Docker Standalone service.

## 1. Get the application

Use Linux, Git, Docker Engine and the Docker Compose plugin. Check
`git --version`, `docker version` and `docker compose version`. Connecting an
existing wiki needs no host Python or Node: they run inside the image.

Until this release is merged, clone the feature branch:

```sh
git clone --branch feat/backstory-release-one https://github.com/bcl1713/backstory.git
cd backstory
```

Keep the wiki and application data outside this checkout: the image build copies
checkout files. Use local storage for application SQLite data, outside the wiki.
Verify canonical host roots are distinct and neither contains the other. Run
`realpath -e -- /absolute/path/to/testwiki /absolute/path/to/backstory-wikitest-data`
after creating the data directory below, and inspect mount provenance with
`findmnt -T` for each path. Different printed paths can still alias through bind
mounts: verify the actual sources. Container paths `/wiki` and `/var/lib/backstory`
cannot prove that the host roots are disjoint. The provided host-data manifests
also pass their actual bind-source values to an early startup guard: equal or
nested roots are rejected before private state is created. Use absolute canonical
POSIX paths without `.`/`..`, repeated separators or trailing slashes; alternate
spellings are rejected. This lexical check cannot detect host symlink or bind-mount
aliases, so the host provenance checks above remain required. Do not bind a wiki
subdirectory, alias or application checkout as private data.
The `.env` in this checkout is ignored by Git and excluded from the image build.
Keep it private; do not put passwords, authentication-file contents or application
signing secrets in it. Each installation needs its own stable project name and
configuration. Run the commands below from that same checkout.

## 2B. Start with an existing wiki

### Verify the source and stable identity

Take a backup or snapshot including assets. Prefer a rehearsal copy first.
Verify the intended mount and source directory before recording its identity.
Backstory never creates a missing wiki or repairs its permissions.

Choose an approved existing stable non-secret regular file in the wiki, at most
64 KiB, with a relative non-hidden path and no symlink components. It must pass
[storage policy](storage.md): authentication files, keys, configuration and agent
rules cannot be identities. Backstory refuses to edit the chosen identity.
`identity.txt` is suitable when deliberately reserved for that purpose; `Home.md`
is unsuitable if an editor will change it. If no suitable identity exists,
creating one is a separate deliberate enrollment decision outside Backstory.

Only after verifying the storage and approving that particular file, hash it
read-only. For example, if `identity.txt` is the approved file:

```sh
sha256sum -- /absolute/path/to/testwiki/identity.txt
```

An empty regular identity file is accepted by the current policy. Its hash cannot
distinguish two empty files, so independently verifying the intended mount is
especially necessary. Never use an authentication file as the identity or reset
the hash merely to make readiness green.

### Match the owner and create fresh private application data

For ordinary **rootful Docker without user-namespace remapping**, a process with
container UID/GID `1000:1000` accesses bind mounts as host `1000:1000`. If your
wiki directories are `755`, notes are `644`, and both are owned by `1000:1000`,
run Backstory as `1000:1000`. The owner can read the notes and write their parent
directories for safe replacement. No wiki `chmod` or `chown` is needed.

Check on the **Docker endpoint host**, as the owner of the wiki:

```sh
id -u
id -g
stat -c '%u:%g %a %n' /absolute/path/to/testwiki /absolute/path/to/testwiki/example.md
docker info --format '{{json .SecurityOptions}}'
```

The following concrete example assumes both `id` commands print `1000` and the
Docker security options do **not** contain `rootless` or `userns`. For other
owners use their positive numeric non-root UID/GID. Docker-group membership does
not grant the app file access. Rootless Docker and user-namespace remapping have
different host mappings; this `1000:1000` recipe does not establish their access.

Create a **new**, private local application-data directory as that host owner:

```sh
mkdir -m 700 "$HOME/backstory-wikitest-data"
stat -c '%u:%g %a %n' "$HOME/backstory-wikitest-data"
```

For this example expect `1000:1000 700`. The command intentionally fails if the
directory exists; choose another fresh name instead of changing an existing one.
Put its full absolute path in `.env` below. This new directory holds users,
sessions, the index, drafts, history and the generated signing secret. It remains
writable even while the **wiki** mount is read-only.

Do not reuse an existing `10001`-owned application volume with a `1000` process:
that is a different storage configuration and may be unwritable. This fresh-data
path starts with no accounts or history and leaves the old volume intact. To
retain old application state, keep its original project, UID and named-volume
configuration until you have a separately planned backup/migration.

### Put configuration in .env

Create a private new `.env` from the example. The no-clobber copy refuses an
existing file so it cannot overwrite another installation's configuration:

```sh
(umask 077; set -C; cat .env.example > .env)
```

Edit `.env`, replacing paths and hash with the approved values. Host paths must
be absolute, with no `~`; single quotes allow spaces. This is dotenv data, not a
shell script: do not `source` or `eval` it.

```dotenv
COMPOSE_PROJECT_NAME=backstory-wikitest
COMPOSE_FILE=compose.yaml:compose.host-data.yaml
BACKSTORY_IMAGE=backstory:local
BACKSTORY_UID=1000
BACKSTORY_GID=1000
BACKSTORY_WIKI_ROOT='/absolute/path/to/testwiki'
BACKSTORY_DATA_HOST_PATH='/home/YOUR_USER/backstory-wikitest-data'
BACKSTORY_IDENTITY_PATH=identity.txt
BACKSTORY_IDENTITY_SHA256=REPLACE_WITH_APPROVED_64_CHARACTER_SHA256
BACKSTORY_WIKI_READ_ONLY=true
BACKSTORY_BIND_ADDRESS=127.0.0.1
BACKSTORY_PORT=8000
BACKSTORY_COOKIE_MODE=localhost
BACKSTORY_ALLOWED_HOSTS=localhost,127.0.0.1
BACKSTORY_PROXY_MODE=off
BACKSTORY_CSRF_TRUSTED_ORIGINS=
BACKSTORY_TRUSTED_PROXY_IPS=
BACKSTORY_PROXY_CLIENT_IP_HEADER=none
BACKSTORY_EXCLUSIONS=
BACKSTORY_REVISION_QUOTA_BYTES=67108864
```

`COMPOSE_FILE` selects the host-data overlay automatically on every ordinary
Compose command. Both required bind sources use `create_host_path: false`: a
missing wiki or data directory stops the container instead of creating a folder.
The host wiki maps to `/wiki`; host application data maps to `/var/lib/backstory`.
Do not set `BACKSTORY_DATA_DIR` for Compose: that key is for native development.

Exclusions are comma-separated additional deny patterns, for example
`private,work/*.md`; they cannot weaken built-in policy. Quota is logical recovery
payload accounting, not SQLite file size. These settings are explicitly forwarded
by the manifests. The security defaults above are for host-local HTTP. Change the
security settings together using the [HTTPS proxy guide](reverse-proxy.md), rather
than exposing localhost cookie mode to a network interface. Exported shell
variables override `.env`; start in a clean shell or
unset previously exported `BACKSTORY_*` and `COMPOSE_*` values before using it.

### Build, create accounts and start

First inspect `docker compose config`: confirm the approved sources, user
`1000:1000`, wiki `read_only: true`, writable data and loopback port. Keep the
resolved paths private. Some Compose versions omit explicit false values when
normalizing; the source manifests explicitly refuse host-path creation.

```sh
docker compose config
docker compose build &&
  docker compose run --rm web python manage.py migrate &&
  docker compose run --rm web python manage.py create_account &&
  docker compose run --rm web python manage.py create_account &&
  docker compose up -d --build &&
  docker compose exec web id &&
  docker compose exec web python manage.py storage_status
```

Use the interactive terminal prompts for a named human account and a separate
ordinary assistant account. Passwords are hidden, must be at least 12 characters,
and have no command-line argument or default. Do not pipe passwords. Both accounts
can access eligible shared notes and history; protected drafts are account-private.
There are no per-note or per-folder account permissions, so select the source and
exclusions deliberately. Keep private authentication files mode `600`; never put
their contents into this configuration or terminal commands.

Expect the selected UID/GID and the actual text `ready: identity_verified`.
`storage_status` can exit zero while reporting unavailable; read the text.
Readiness proves a readable identity, not permission to save. Sign in locally,
browse notes and assets, and wait for the automatic background index to fill search.
Opening a note reads current disk without waiting for indexing.

### Enable writes

After the read-only rehearsal and backup, edit just this value in `.env`:

```dotenv
BACKSTORY_WIKI_READ_ONLY=false
```

Then recreate using the same configuration, project name and data path:

```sh
docker compose config
docker compose up -d --build
docker compose exec web python manage.py storage_status
```

This preserves accounts, sessions, secret and history. It changes the wiki mount
mode; it does not change host permissions. Test a disposable ordinary note, never
the identity. Existing-note replacement preserves basic mode bits but makes a
new inode owned by the app's effective host user; matching UID `1000` retains that
owner in this rootful example. New notes are `600`, readable by that same host
owner. Ownership, ACLs, xattrs and hard-link relationships are not copied; review
[write limitations](limitations.md) for other filesystems or shared-editor needs.

## 2A. Try a clean disposable demo

This alternative keeps the original image UID/GID `10001:10001` and private named
volume. It needs host Python 3.14 and uv 0.12.19 for synthetic fixture generation.
Use a fresh directory/project and a fresh checkout without the host-data `.env`
above. `--for-containers` grants access only when generating new public synthetic
files; never apply it to an existing wiki.

```sh
uv sync --frozen
uv run python -m tests.fixtures.generate /tmp/backstory-first-demo --profile small --for-containers
(umask 077; set -C; cat /tmp/backstory-first-demo/fixture.env > .env)
```

Append `COMPOSE_PROJECT_NAME=backstory-demo-first` to that new `.env`, then use the
build/account/start commands above. Leave `COMPOSE_FILE`, UID/GID and host-data
path unset: the base `compose.yaml` keeps the named volume and user `10001:10001`.
Its native fixture `BACKSTORY_DATA_DIR` is intentionally ignored by Compose.
Keep the generated `Home.md` identity unchanged. Use a different `BACKSTORY_PORT`
or stop the other installation before starting another demo.

## Portainer on a Docker Standalone endpoint

If you already have Cloudflare Tunnel, use the [existing-tunnel setup](cloudflare.md#reuse-an-existing-tunnel)
with this manifest. Backstory needs no tunnel token or second connector.
The [optional bundled connector](cloudflare.md#optional-bundled-connector) has its
own manifest for installations that want to manage a connector alongside the app.

`compose.portainer.yaml` is self-contained and build-free for **Docker Standalone**.
It is not a Swarm recipe. Prepare the storage and `.env` above on the selected
Docker endpoint; for a remote browser also prepare the [HTTPS proxy settings](reverse-proxy.md).
All bind paths refer to that **endpoint host**, not your browser computer or the
Portainer container. Use absolute canonical paths, verified owners and disjoint
wiki/data roots outside the checkout.

The image must already exist on the selected endpoint or in an accessible
registry. No public Backstory registry image is promised. On that endpoint, from
this checkout with the configured `.env`, run `docker compose build`. Keep the
same `BACKSTORY_IMAGE` tag in Portainer. A web-editor stack cannot build this
checkout from `build: .`; the standalone file therefore has no build context.
Distributing an image to a different endpoint is a separate operator step.

When proceeding with your own deployment, select the intended Standalone
environment, then **Stacks → Add stack** and a stable installation name. Paste
`compose.portainer.yaml` into **Web editor**, or upload that file. Under environment
variables, use **Load variables from .env file** or enter the `BACKSTORY_*` fields.
Every supported value is explicitly interpolated by this manifest. The CLI-only
`COMPOSE_FILE` and `COMPOSE_PROJECT_NAME` do not select files or the stack name in
this form; use the standalone manifest and stable stack name explicitly. No
`stack.env` or host-side `env_file` path is required. These UI steps follow the
[Portainer stack documentation](https://docs.portainer.io/user/docker/stacks/add).
Review the resolved paths, image, user, binding and security values before deploying.

Startup applies database migrations. Once running, select **Containers → this
stack's web container → Console**, choose `/bin/sh` and the configured non-root
user (for example `1000:1000`), then **Connect**. Follow
[Portainer's console instructions](https://docs.portainer.io/user/docker/containers/console)
and run interactively:

```sh
id
python manage.py create_account
python manage.py create_account
python manage.py storage_status
```

Use hidden terminal password prompts for the human and assistant; never put
passwords in environment fields. Check the UID and actual readiness text. For
HTTPS proxy mode, also run `python manage.py check --deploy --fail-level WARNING`.
Update the stack's environment and redeploy to change the wiki-readonly flag;
keep its name and data path unchanged. Open the approved HTTPS hostname from your
browser. With the default localhost configuration, open the local URL on the
Docker host instead: Portainer does not make loopback reachable remotely.

Actual Portainer UI deployment and the operator's proxy/network/firewall setup
are not part of the local synthetic verification. The combined trusted-proxy
release gate is recorded separately in the [release checklist](testing/release-checklist.md).

## 3. Sign in and check the workflow

For the default local setup, open <http://127.0.0.1:8000/accounts/login/> (or your
configured local port) on the Docker host. In HTTPS proxy mode, use only the
configured `https://` hostname. Use the same hostname throughout for cookies.
Use a separate browser context for the assistant. After enabling writes, create a disposable `.md` note
in an existing writable folder, save and reopen it. Startup and opening a note do
not format the wiki. Save runs the [formatting pipeline](formatting.md).

For a conflict check, open that note in two signed-in browser contexts. Save one
edit, then try the other: HTTP 412 offers base/current/draft for manual comparison.
Copy/download your draft or explicitly **Store protected draft** before refreshing.
Accept the current revision, merge manually and save. Backstory never blindly
retries a draft. Formatter failure retains source and diagnostics; deliberately
choose **Save source without formatting** for recovery, with the same storage,
conflict and backup protections. See [operations](operations.md#normal-and-recovery-walkthrough).

## 4. Daily commands and backup

From the same checkout with the same `.env`:

```sh
docker compose up -d --build
docker compose stop
docker compose up -d
docker compose restart
```

`docker compose down` keeps application data. Do not remove the host data directory
or use `down --volumes` on the named-volume alternative: accounts, sessions, signing
secret, drafts and history live there. Changing the project or data path can look
like lost accounts. Back up application data and wiki separately using
[operations](operations.md#application-backup-and-separate-wiki-backup), and verify
restores in disposable storage. Recovery retention is 30 days; quota defaults to
64 MiB. Pruning is not a substitute for backups.

## Troubleshooting

Preserve a draft before refreshing. Diagnose the intended storage instead of
resetting its expected identity.

| Symptom | What to check |
| --- | --- |
| Missing-bind error before startup | Both absolute host directories must already exist on the Docker endpoint; no automatic replacement directory is created. |
| Application-data permission error with UID 1000 | Confirm the host-data overlay is selected, the fresh data directory is owned by the mapped user, and a previous UID10001 named volume is not being reused. |
| Ready but Save returns `wiki_write_denied` / HTTP 503 | Check `BACKSTORY_WIKI_READ_ONLY`, actual UID mapping and write/traversal access on the note's parent directory. File write bits alone are insufficient for atomic replacement. |
| `identity_missing`, `identity_mismatch`, `root_missing`, `identity_unreadable` | Verify the intended source, mount and approved identity path/hash. Restore expected storage rather than enrolling whatever is visible. |
| Wrong wiki or apparently new accounts/history | Inspect resolved `.env`, exported overrides, exact project/stack name and application-data path. Keep existing data; reconnect the intended configuration. |
| `staging_cleanup_required` after read-only Save | Preserve the draft and stop retrying. Deliberate writable recreation performs guarded cleanup once storage is ready; compare the current note before saving again. |
| Search is incomplete | Check index progress in Storage status. Refresh index queues maintenance; Rebuild creates a new projection while retaining the previous usable generation. |

The [storage policy](storage.md), [limitations](limitations.md) and
[operations guide](operations.md) describe the remaining boundaries.
