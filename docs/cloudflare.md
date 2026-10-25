# Cloudflare Tunnel

**Already running a tunnel? Reuse it.** Backstory needs no Cloudflare token,
account credentials or additional connector when your existing `cloudflared`
already forwards requests. Use the [existing-tunnel path](#reuse-an-existing-tunnel)
below. The separate [bundled connector](#optional-bundled-connector) is an opt-in
installation for operators who need a connector instance managed with Backstory.
Ordinary Nginx Proxy Manager, Caddy and other reverse proxies keep the same
[generic proxy contract](reverse-proxy.md).

These are operator instructions. No live Cloudflare account, tunnel, DNS, Access
policy or public endpoint was created or changed for this feature. Local packaging
checks do not verify your Cloudflare edge, certificate or route. Combined release
acceptance is tracked in the [release checklist](testing/release-checklist.md).

## Reuse an existing tunnel

Prepare the [approved wiki, stable identity and fresh private app data](setup.md#2b-start-with-an-existing-wiki)
and select the matching non-root UID/GID. Keep your existing connector and its
credential storage as they are; do not select `compose.cloudflare.yaml` or copy
`cloudflare.env.example` for this path.

Choose how your current tunnel reaches the application:

- **Keep an existing reverse proxy**, such as NPM or Caddy: direct the tunnel's
  application route to that proxy, then configure its Backstory upstream using
  the [generic HTTPS proxy guide](reverse-proxy.md). Backstory trusts only the
  final proxy's verified origin-side TCP peer. Every frontend in this chain must
  preserve the public host and ensure the final proxy asserts HTTPS only for
  an HTTPS browser request.
- **Forward directly from existing `cloudflared`**: use the generic Compose
  host-data setup or `compose.portainer.yaml`. Bind the app port on an approved
  private endpoint interface reachable by that connector, restrict connections
  to that connector, and point its application route at that private HTTP origin.
  A host-process connector on the same Docker host can use the host loopback;
  a connector container cannot use its own loopback to reach Backstory.

For direct forwarding, the generic manifest's security values look like this;
replace these documentation addresses with your verified endpoint and peer:

```dotenv
BACKSTORY_BIND_ADDRESS=192.0.2.10
BACKSTORY_PORT=8000
BACKSTORY_COOKIE_MODE=https
BACKSTORY_ALLOWED_HOSTS=wiki.example.test
BACKSTORY_PROXY_MODE=trusted
BACKSTORY_CSRF_TRUSTED_ORIGINS=https://wiki.example.test
BACKSTORY_TRUSTED_PROXY_IPS=192.0.2.20/32
BACKSTORY_PROXY_CLIENT_IP_HEADER=none
```

The direct route's service is `http://192.0.2.10:8000` in this example. Determine
the actual TCP peer at Backstory: Docker NAT may make it a gateway address.
Trusting a shared gateway also requires controls excluding other callers behind
that gateway. Do not substitute Cloudflare's public edge IP ranges or all Docker
networks for the connector's actual origin-side peer. Follow the generic guide's
build, account and verification workflow, then the edge requirements below.

## Edge and authentication requirements

The route must cover the application at the root of its exact public hostname,
preserve the browser's public `Host`, and deliver a single `X-Forwarded-Proto:
https` to Backstory from its trusted peer. Cloudflare documents that it
[overwrites this header with the browser's scheme](https://developers.cloudflare.com/fundamentals/reference/http-headers/#x-forwarded-proto).
Redirect browser HTTP at the edge using
[Always Use HTTPS](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/always-use-https/)
or an equivalent hostname rule. Backstory rejects forwarded HTTP; do not weaken
the guard to work around a missing redirect. Additional proxies must enforce the
same [header contract](reverse-proxy.md#header-and-network-contract).

For a direct tunnel route, leave HTTP Host Header unset to preserve the request
host, or explicitly set it to the exact approved public hostname; never set it
to `web` or the private origin IP. See Cloudflare's
[origin parameters](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/configure-tunnels/origin-parameters/#httphostheader).
Keep browser cookies, login pages and authenticated responses out of any custom
cache-everything rules. Test the effective route rather than assuming an existing
hostname's settings are suitable.

Cloudflare Access may be an additional front gate if you choose to configure it.
Named Backstory accounts and CSRF checks still apply. Backstory never accepts
bare Cloudflare email/identity headers as application login. Client-IP forwarding
stays `none`: visitors share the final proxy's IP bucket for IP throttling, while
account protections remain active. An appended `X-Forwarded-For` chain does not
meet Backstory's optional single-address header contract.

## Optional bundled connector

Use this path only when you want to run a connector instance alongside Backstory.
It can join an operator-selected remotely managed tunnel; it does not need a new
tunnel if you already have a suitable one. Existing tunnel users can use the
previous section without this service or its token file.

`compose.cloudflare.yaml` is self-contained, build-free and intended for Docker
Standalone, including Portainer. It runs the usual web/indexer service plus one
optional `cloudflared` service. Neither publishes a host port. Only those two
services join a dedicated **internal origin network**; only the connector also
joins a separate egress network. Do not attach unrelated containers to the origin
network. Administrators controlling Docker can change this boundary.

The connector has one configured private IPv4 address. The manifest derives
Backstory's trusted peer as exactly that address `/32`, fixes HTTPS cookie mode,
trusted proxy mode and client-IP header `none`, and requires an explicit public
host and HTTPS CSRF origin. It never grants trust to a whole subnet. Pick an
unused private subnet that does not overlap your host, LAN, VPN or other Docker
networks, and a usable connector address inside it; change both values together.
Separate installations need separate project names, data paths and subnets.

### Prepare private storage and configuration

Complete the [storage and UID setup](setup.md#2b-start-with-an-existing-wiki)
first, including read-only hashing of an approved stable non-secret identity.
Create a **fresh**, mode-700 app-data directory outside the wiki and checkout,
owned by the app's effective host user. The example uses rootful Docker without
user-namespace remapping and a wiki owned by `1000:1000`; it requires no wiki
permission changes. Rootless/userns mappings require their own access verification.

If this connector needs credentials, obtain the remotely managed tunnel's token
through your own Cloudflare administration. Put **only the token** in a new private
regular file on the **Docker endpoint host**, outside the wiki, checkout/build
context and app-data directory. Use your private secret editor, a private parent
directory and mode `600`, owned by the selected effective user. Do not paste the
dashboard's token-bearing installation command into shell history, docs, chat or
logs, or put the token in `.env`, a command argument or a Portainer environment
field. No token is needed by the Backstory application.

Both containers run as the same chosen non-root UID/GID so this private file is
readable by the connector. This is a read-only **bind**, whose host ownership and
permissions are retained. Docker Standalone file-backed secrets would not rewrite
those permissions either; do not make the file world-readable to fix an error.
The connector receives no wiki or app-data mount, and the web service receives no
token mount. All three bind sources must already exist; missing paths are not
auto-created. Confirm the token source is a regular readable file, not a directory
or unintended symlink, without displaying its contents.

Create a new private `.env` from the tunnel example, refusing an existing file:

```sh
(umask 077; set -C; cat cloudflare.env.example > .env)
```

Edit every path, identity hash and public host/origin. `CLOUDFLARE_TUNNEL_TOKEN_FILE`
contains the **absolute host path only**. Use absolute paths without `~` and single
quotes for spaces; dotenv is data, so do not source/eval it. Keep
`COMPOSE_FILE=compose.cloudflare.yaml` for ordinary Compose commands. The example
subnet is a placeholder to check for conflicts, not a reserved allocation.
Exported `BACKSTORY_*`/`COMPOSE_*`/`CLOUDFLARE_*` variables override `.env`.

The connector image is pinned to
[cloudflared 2026.10.3](https://github.com/cloudflare/cloudflared/releases/tag/2026.10.3),
with automatic updates disabled, a read-only root filesystem, all capabilities
dropped and no-new-privileges. It reads `/run/secrets/cloudflare_tunnel_token`
using the supported
[`--token-file` option](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/configure-tunnels/run-parameters/#token-file).
Plan deliberate image updates. Outbound connectivity must meet Cloudflare's
[tunnel firewall requirements](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/configure-tunnels/tunnel-with-firewall/);
the app itself has no egress network.

### Build the app and prepare accounts

Build current reviewed source once on the **selected Docker endpoint**. The
tunnel manifest has no build context, so explicitly select the base file for this
one command even though `.env` selects the tunnel file:

```sh
docker compose -f compose.yaml build web
docker compose config
docker compose run --rm --no-deps web python manage.py check --deploy --fail-level WARNING
docker compose run --rm --no-deps web python manage.py migrate
docker compose run --rm --no-deps web python manage.py create_account
docker compose run --rm --no-deps web python manage.py create_account
docker compose run --rm --no-deps web python manage.py storage_status
```

Use the hidden interactive prompts for separate named human and assistant accounts.
Inspect config for correct paths, selected user, token **path only**, no host ports,
private origin membership and exact trusted `/32`. Read the actual storage text:
expect `ready: identity_verified`, not merely exit zero. No connector starts in
these account commands. An image from an authorized registry is another option;
no public Backstory registry image is promised. The selected endpoint must be
able to obtain exactly the image tag in `.env`.

### Configure the selected tunnel and start when ready

Use your own dashboard to select a remotely managed tunnel, or deliberately
create one if needed. Follow Cloudflare's
[dashboard guide](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/get-started/create-remote-tunnel/)
for its published application route. Use your exact approved hostname, no path
restriction, and **HTTP service `http://web:8000`**. Here `web` resolves inside the
connector's private origin network. It is not the public hostname. Apply the
edge HTTPS and Host requirements above before exposing a rehearsal installation.

Once the private token file, accounts and edge configuration are ready, starting
the optional connector is the deliberate live-connection step:

```sh
docker compose up -d
docker compose exec web id
docker compose exec web python manage.py storage_status
```

Startup applies migrations and the connector retries until its origin is ready.
There is no local published-port URL for this profile. Open the configured HTTPS
hostname; verify both `/health/` and the authenticated application through that
boundary. Test login, Secure cookies, CSRF rejection, and note open/save on a
disposable note. Rehearse with `BACKSTORY_WIKI_READ_ONLY=true` first; after backup
and approval to enable writes, set it to `false` and run `docker compose up -d`.
Keep the project name, identity and data path unchanged to retain accounts/history.

To stop just this managed connector, use `docker compose stop cloudflared`.
Stopping or removing containers preserves the host wiki, data and token file.
Token rotation belongs to your Cloudflare administration: securely replace the
private file and recreate this connector to remount/reload it. Do not enable debug
request logging or dump configuration/credentials while troubleshooting.

### Portainer alternative

Select the intended **Docker Standalone environment**. Build the app image on that
same endpoint using the explicit base-file command above, or use your authorized
registry. Add a stable stack name, upload/paste **`compose.cloudflare.yaml`**, then
load your private `.env` variables or enter its non-secret values. Portainer does
not use `COMPOSE_FILE` to choose the uploaded manifest or `COMPOSE_PROJECT_NAME`
as the UI stack name. The token file must exist on that endpoint, not on your
browser machine or inside the Portainer container. Uploading `.env` transfers
only its path, never the token file. See the
[Portainer stack workflow](https://docs.portainer.io/user/docker/stacks/add).

Before deploying, prepare accounts with the CLI commands above where possible.
Alternatively deploy **web only** using the CLI before connecting the tunnel,
or create the accounts in Portainer's web-container `/bin/sh` console as the
selected non-root user before adding a public route. Run `id`, the two interactive
`python manage.py create_account` commands, `python manage.py storage_status` and
`python manage.py check --deploy --fail-level WARNING`. Follow the existing
[Portainer account instructions](setup.md#portainer-on-a-docker-standalone-endpoint).
Review the route and edge settings before the connector serves public requests.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Existing tunnel works, but a token file seems required | Use the existing-tunnel path; the token file is only for the optional bundled connector. |
| Missing bind or connector permission denied | Verify endpoint-local regular token file, mode `600`, selected UID mapping and private parent directory; do not relax permissions. |
| Network overlap or static IP failure | Select an unused private subnet and a usable connector IPv4 within it; keep the IP and derived `/32` together. |
| Cloudflare reports unavailable origin | Verify `web` is running, the bundled route is exactly `http://web:8000`, both services join their origin network, and storage/account checks pass. For an existing connector use its verified reachable private origin instead. |
| Backstory rejects a request | Verify actual final TCP peer, public Host and exact overwritten HTTPS scheme. Do not expand trust or disable the guard. |
| All visitors share an IP throttle bucket | Expected with client-IP `none`; Backstory ignores Cloudflare/XFF client headers. |
| Health succeeds but a save fails | Health is process-only. Check authenticated Storage status, read-only setting and note-parent permissions; never change the identity just to get ready. |
