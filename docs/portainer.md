# Deploy the published image with Portainer

Backstory v1.0.0 runs from `ghcr.io/bcl1713/backstory:1.0.0` on
**linux/amd64 or linux/arm64**. This guide uses Docker Standalone, an existing
wiki folder, and either an existing Cloudflare Tunnel connector or Nginx Proxy
Manager (NPM) for HTTPS remote access. You need no repository checkout, Git,
host Python/Node, or local image build. Swarm is not covered.

## 1. Download the release files

Download `compose.portainer.yaml` and `portainer.env.example` from the
[v1.0.0 release](https://github.com/bcl1713/backstory/releases/tag/v1.0.0).
Save a private copy of the environment example as `.env`. Optional `SHA256SUMS`
checks the downloaded deployment files. Release assets stay with their version;
use the assets belonging to your selected release for later upgrades.

For a shell installation, these commands download the initial release without
cloning anything (use a new private working directory):

```sh
mkdir -m 700 backstory-deploy
cd backstory-deploy
curl --fail --location --output compose.portainer.yaml https://github.com/bcl1713/backstory/releases/download/v1.0.0/compose.portainer.yaml
(umask 077; curl --fail --location --output .env https://github.com/bcl1713/backstory/releases/download/v1.0.0/portainer.env.example)
```

The GHCR package is intended to be public; a public package needs no registry
login. If your installation uses a private package, add a GHCR registry in
Portainer with a GitHub user and a classic PAT with `read:packages`, following
[GitHub's registry authentication guide](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry#authenticating-to-the-container-registry).
Keep registry credentials in Portainer's registry settings, outside app variables.
A permission-denied pull is a registry visibility/credential problem; building
from source is unnecessary.

## 2. Prepare the Docker endpoint's storage

Bind paths are on the **Docker endpoint host**, even if Portainer and your browser
run elsewhere. Use an approved existing wiki (prefer a backup/rehearsal copy).
Verify its mount and take a backup including attachments before enrolling it.
Backstory edits Markdown in place and never imports it.

On the endpoint, as the wiki owner, check:

```sh
id -u
id -g
stat -c '%u:%g %a %n' /absolute/path/to/wiki
findmnt -T /absolute/path/to/wiki
docker info --format '{{json .SecurityOptions}}'
```

The example `.env` assumes Linux **rootful Docker without rootless/userns
remapping**, with a wiki owned by `1000:1000`. Replace both IDs with the verified
positive non-root owner IDs. For rootless/userns Docker, verify the actual mapped
host identity separately; setting container UID 1000 does not establish host
access. Do not recursively change ownership or permissions on an existing wiki.

Reserve an empty regular `.backstory-marker` in the verified wiki root, with the
wiki owner's approval, readable by the app user. If it already exists, keep it.
For an absent marker, after checking the source, the owner can create it without
overwriting an existing file:

```sh
(umask 022; set -C; : > /absolute/path/to/wiki/.backstory-marker)
```

This dedicated file is excluded from wiki content. Its bytes are never read or
hashed; no hash belongs in `.env`. A missing/unreadable marker disables writes.
Do not create a marker in a missing/unmounted share's empty mountpoint.

Create a **new** private local directory as that same host owner, outside the wiki:

```sh
mkdir -m 700 /absolute/path/to/backstory-data
realpath -e /absolute/path/to/wiki /absolute/path/to/backstory-data
findmnt -T /absolute/path/to/backstory-data
```

Both roots must exist, be canonical absolute POSIX paths and be disjoint: neither
may contain the other. Check symlink/bind-mount aliases and actual provenance.
The manifest refuses missing sources and startup rejects lexical source overlap.
Data holds SQLite, named accounts, sessions, drafts, history, and the automatically
created signing secret. Keep this path stable across upgrades; never put it inside
the wiki or replace it to fix a login issue.

## 3. Edit .env for the chosen HTTPS route

The complete starting file is `portainer.env.example`. Change these entries:

| Variable | Set it to |
| --- | --- |
| `BACKSTORY_IMAGE` | `ghcr.io/bcl1713/backstory:1.0.0` |
| `BACKSTORY_UID`, `BACKSTORY_GID` | Verified non-root wiki owner IDs |
| `BACKSTORY_WIKI_ROOT` | Existing canonical wiki path on the endpoint |
| `BACKSTORY_DATA_HOST_PATH` | New private application-data path on the endpoint |
| `BACKSTORY_WIKI_READ_ONLY` | `true` for the initial rehearsal |
| `BACKSTORY_COOKIE_MODE` | `https` |
| `BACKSTORY_ALLOWED_HOSTS` | Exact public hostname, e.g. `wiki.example.com` |
| `BACKSTORY_PROXY_MODE` | `trusted` |
| `BACKSTORY_CSRF_TRUSTED_ORIGINS` | Exact origin, e.g. `https://wiki.example.com` |
| `BACKSTORY_MERMAID_PARENT_ORIGIN` | Optional; leave empty for source-only diagrams. Deliberate opt-in uses one exact browser origin, not the CSRF list; see [renderer configuration](mermaid-frame.md). |
| `BACKSTORY_BIND_ADDRESS` | Private interface IP on the Docker endpoint reachable by the proxy |
| `BACKSTORY_PORT` | Available private origin port, normally `8000` |
| `BACKSTORY_TRUSTED_PROXY_IPS` | Actual origin-side connector/proxy peer IP with `/32` (IPv6 `/128`) |
| `BACKSTORY_PROXY_CLIENT_IP_HEADER` | `none` |

Replace the example `192.0.2.*` addresses; they are documentation placeholders.
The trusted peer means the address arriving at Backstory's TCP socket, possibly a
Docker gateway after NAT. Determine it for the actual route. Do not trust
Cloudflare's public edge ranges, a whole Docker/LAN subnet, or `0.0.0.0/0`.
Restrict origin-port reachability to the intended connector/proxy using network
and firewall controls effective for Docker-published ports. The app allowlist
complements those controls. Protect the private HTTP hop too.

A connector or NPM process running **on the endpoint host** can use
`BACKSTORY_BIND_ADDRESS=127.0.0.1` and upstream `http://127.0.0.1:8000`.
A connector/NPM **container** cannot reach the app via its own loopback. Use the
endpoint's verified private interface and route instead; no new shared Docker
network is required. A Docker bridge route may translate the source peer.
The [proxy contract](reverse-proxy.md) covers exact peer/header verification.

`.env` is Compose substitution data; do not source/eval it. Portainer imports its
values into stack substitutions. A local CLI uses it automatically beside the
manifest. Preserve quotes around paths containing spaces. Never put passwords,
tunnel tokens or the application's signing secret in these fields. See the
[full variable reference](configuration.md) for exclusions and index settings.

### Option A: Reuse an existing Cloudflare Tunnel

Keep your existing `cloudflared` connector and credentials. Backstory needs no
Cloudflare token and you do not add another connector to this stack.

In your existing tunnel's published application route, select the exact public
hostname and service `http://PRIVATE_ENDPOINT_IP:8000` (or host loopback only for
a same-host process connector). The route must serve the app at the hostname
root, with no path-prefix rewrite. Leave **HTTP Host Header** unset to preserve
the browser's host, or explicitly set your exact public hostname; do not set it
to the private IP or `web`.

Require browser HTTPS with Cloudflare's **Always Use HTTPS** or an equivalent
hostname redirect rule. The request reaching Backstory must retain the approved
`Host` and one `X-Forwarded-Proto: https`; Cloudflare documents its
[scheme-header overwrite](https://developers.cloudflare.com/fundamentals/reference/http-headers/#x-forwarded-proto).
Exclude authenticated Backstory pages from cache-everything rules. Optional
Cloudflare Access is an additional gate; create Backstory accounts as described
below even when Access is enabled. Keep client-IP forwarding `none`.

If your tunnel already forwards through NPM, follow the next option for the final
hop and trust NPM's actual peer. Ensure the final proxy preserves the original
HTTPS assertion through that chain. The [Cloudflare guide](cloudflare.md) covers
additional origin settings and the optional separately managed bundled connector.

### Option B: Use Nginx Proxy Manager for remote HTTPS

In your existing NPM instance, add a **Proxy Host**:

- Domain: the exact hostname in `BACKSTORY_ALLOWED_HOSTS`.
- Forward scheme: `http`; forward hostname/IP: the private endpoint IP;
  forward port: `BACKSTORY_PORT`.
- SSL: a valid certificate for that hostname and **Force SSL** enabled.
- DNS: point the hostname to your NPM ingress; expose its HTTPS listener using
  your existing router/firewall arrangement. Keep Backstory's origin private.

Backstory needs ordinary HTTP proxying, with no WebSocket setting required.
Verify NPM's effective configuration preserves the public `Host` and overwrites
`X-Forwarded-Proto` with the single value `https` for browser HTTPS. Custom NPM
snippets and upstream proxy chains can change this behavior. Avoid blindly adding
duplicate `proxy_set_header` directives. NPM's appended `X-Forwarded-For` chain is
why Backstory's client-IP header remains `none`. Use the actual NPM origin-side
peer in the app allowlist. Details and reference configuration are in the
[NPM proxy contract](reverse-proxy.md#optional-frontend-examples).

## 4. Deploy the stack and provision named users

In Portainer, select the **Docker Standalone** environment, then
**Stacks → Add stack**. Choose a stable name such as `backstory`. Paste the
release's `compose.portainer.yaml` into **Web editor**, or upload it. Under
**Environment variables → Load variables from .env file**, load your edited
private `.env`; alternatively enter the values individually. These steps follow
[Portainer's stack workflow](https://docs.portainer.io/user/docker/stacks/add).

The file contains no `build:` and no `env_file:`. You need no `stack.env`, cloned
repository, or host build directory. Do not paste the developer `compose.yaml`.
`COMPOSE_FILE` and `COMPOSE_PROJECT_NAME` do not select the Portainer manifest or
stack name; choose those in the UI. Review the image, both paths, UID/GID, private
bind address and HTTPS settings, then **Deploy the stack**.

Startup runs database migrations automatically, then starts the web server and
index worker. Check container logs for successful startup; a storage-unready app
can still run. No default account, automatic signup or password environment
variable exists.

Open **Containers → this stack's web container → Console**, select `/bin/sh` and
the configured non-root UID/GID, enable an interactive terminal, then **Connect**.
Run:

```sh
id
python manage.py check --deploy --fail-level WARNING
python manage.py storage_status
python manage.py create_account
python manage.py create_account
```

Verify `id` matches your chosen identity and read `storage_status` output:
expect **`ready: marker_present`**, not just exit zero. Use the first interactive
account prompt for your own named login. Repeat for each other user or assistant
that needs an independent login; the second command is optional. Password entry
is hidden and validated; do not pipe it, put it in an environment variable, or
reuse a shared account. All named users share the same configured wiki/exclusions;
there are no per-folder roles in v1.0.0. `create_account` does not create Django
superusers. Accounts and the signing secret persist in private application data.

For the downloaded-file CLI alternative, from the directory containing `.env`:

```sh
docker compose -p backstory -f compose.portainer.yaml config --quiet
docker compose -p backstory -f compose.portainer.yaml pull
docker compose -p backstory -f compose.portainer.yaml up -d
docker compose -p backstory -f compose.portainer.yaml exec web python manage.py check --deploy --fail-level WARNING
docker compose -p backstory -f compose.portainer.yaml exec web python manage.py storage_status
docker compose -p backstory -f compose.portainer.yaml exec web python manage.py create_account
```

These commands pull the published image; none builds it. Keep `-p backstory`
and the same file/data paths for every later operation on this installation.

## 5. Verify access and deliberately enable writes

Open `https://YOUR_HOST/accounts/login/`, sign in, browse notes/search, and check
Storage status. In the read-only rehearsal, saving must be refused. Verify Secure
cookies, HTTP-to-HTTPS redirect, and that the private origin is unreachable from
unapproved callers even with forged forwarding headers. `/health/` through the
approved HTTPS host checks process health; authenticated Storage status checks
wiki/marker readiness. It is normal for direct plain origin health probes to be
rejected in trusted proxy mode.

After reviewing your rehearsal, set `BACKSTORY_WIKI_READ_ONLY=false` in the
Portainer stack environment and **Update the stack/redeploy**. Editing your local
`.env` does not change a deployed Portainer stack; update its saved variables too.
For CLI, edit `.env` then repeat `up -d`. Use a disposable note to verify save and
conflict handling, then restart the container and confirm login/data persistence.
Keep the same stack name, data path and user. Back up before moving from a
rehearsal wiki to the approved live wiki.

## 6. Upgrade, recover and roll back

Pin a numbered image such as `:1.0.0`. Every successful main release publishes
`:MAJOR.MINOR.PATCH`, `:vMAJOR.MINOR.PATCH`, and moving `:MAJOR.MINOR`, `:MAJOR`
and `:latest` aliases. A release also records its immutable image digest and tested
source commit. For a digest pin, set `BACKSTORY_IMAGE=ghcr.io/bcl1713/backstory@sha256:...`
using that release's actual digest. Backstory never auto-updates your Portainer
stack when a new version is published.

Read the next [release's notes](https://github.com/bcl1713/backstory/releases),
back up both the wiki and private data (including its signing secret), and retain
your current image reference and configuration. Stop the stack for a consistent
filesystem copy, or use `python manage.py backup_data /tmp/backstory-app-backup --include-secret`
and export its output using the full
[backup/restore procedure](operations.md#application-backup-and-separate-wiki-backup). Do not copy a live
SQLite file by itself. Set the new numbered image in Portainer, review any new
manifest/environment requirements, then update with image pulling enabled.
Verify login, readiness, search and a disposable edit after updating.

For CLI, change the image in `.env`, then run `pull` and `up -d` with the same
`-p backstory -f compose.portainer.yaml` options. Startup applies new migrations.
Rollback can require restoring the pre-upgrade **private-data backup and wiki
snapshot together**, because an older image may not understand a newer database
schema or data. Stop the app, restore into the intended private storage with the
correct owner, select the previous image/configuration and restart following the
release's compatibility notes. Never delete the data directory to roll back.

To change a user's password, use `python manage.py changepassword USERNAME`
in the interactive console. To revoke that user's sessions immediately, run
`python manage.py revoke_sessions` and select the user and `all` action. See [operations](operations.md) for
session/device revocation, lockouts, protected drafts, history and storage loss.
There is no account reset on container restart.
