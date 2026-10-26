# Environment configuration

For a clone-free installation using `ghcr.io/bcl1713/backstory:1.0.0`, start with
the [Portainer / Compose guide](portainer.md) and `portainer.env.example`.

This is the reference for environment variables consumed by Backstory settings,
startup, Compose and its background worker. Start with the [setup steps](setup.md)
for storage preparation and interactive account creation. The examples below are
for Linux, rootful Docker without user-namespace remapping; paths and IDs are
examples to replace, never permissions to apply to existing storage.

## Minimal local installation

After verifying the existing wiki and its owner-approved `.backstory-marker`,
create a **new**, private application-data directory outside the wiki and checkout,
owned by the selected effective UID/GID. For the `1000:1000` example, the complete
local `.env` is:

```dotenv
COMPOSE_PROJECT_NAME=backstory-wikitest
COMPOSE_FILE=compose.yaml:compose.host-data.yaml
BACKSTORY_UID=1000
BACKSTORY_GID=1000
BACKSTORY_WIKI_ROOT='/absolute/path/to/testwiki'
BACKSTORY_DATA_HOST_PATH='/absolute/path/to/backstory-wikitest-data'
BACKSTORY_WIKI_READ_ONLY=true
```

Only the two storage paths are mandatory substitutions for this Compose variant.
The IDs are an operator decision: omit them only when `10001:10001` really has
the intended access. A stable project name isolates/preserves the installation;
the read-only flag deliberately makes the first rehearsal unable to save. The
default image tag is `backstory:local`, built from this checkout. Local HTTP is
published at `127.0.0.1:8000`, with localhost cookies, exact local hosts, no proxy
trust, and the default marker. No hostname, origin, proxy address, marker hash,
password or signing secret needs to be invented for this local recipe.

From the checkout, inspect `docker compose config`, then follow setup's
[build/account/start commands](setup.md#build-create-accounts-and-start). Use
`python manage.py storage_status` inside the container and read the actual
`ready: marker_present` text; a zero exit status alone does not establish readiness.
Enable writes only after the rehearsal, by deliberately setting
`BACKSTORY_WIKI_READ_ONLY=false` and recreating with the same data/project.

The base `compose.yaml` alone uses a private named volume instead of a host data
directory. It requires only `BACKSTORY_WIKI_ROOT`, defaults to `10001:10001`, and
ignores `BACKSTORY_DATA_HOST_PATH`. Use it for the
[disposable container demo](setup.md#2a-try-a-clean-disposable-demo), or retain it
for existing installations already using that volume and owner. Changing volume,
project or user is a storage migration, not a way to repair permissions.

## Minimal HTTPS / Portainer installation

Keep the prepared storage, selected IDs and read-only rehearsal. For a proxy on
another private host, add these values to the local recipe, replacing the
documentation addresses with the verified endpoint interface and actual TCP peer:

```dotenv
BACKSTORY_COOKIE_MODE=https
BACKSTORY_ALLOWED_HOSTS=wiki.example.test
BACKSTORY_PROXY_MODE=trusted
BACKSTORY_CSRF_TRUSTED_ORIGINS=https://wiki.example.test
BACKSTORY_TRUSTED_PROXY_IPS=192.0.2.20/32
BACKSTORY_BIND_ADDRESS=192.0.2.10
```

These decisions cannot be safely guessed. The public host/origin identify the
browser-facing TLS endpoint; the trusted peer identifies the connection arriving
at Backstory, possibly after Docker NAT. The bind address is an interface on the
Docker endpoint. For a same-host process proxy, the default loopback bind may be
appropriate. Restrict origin reachability to the proxy, preserve `Host`, and
overwrite `X-Forwarded-Proto` with the single value `https`. Follow the full
[proxy header/network contract](reverse-proxy.md); an IP allowlist does not
replace firewall/network restrictions. The client-IP header defaults to `none`.

For **Portainer Docker Standalone**, upload `compose.portainer.yaml` and supply
the same `BACKSTORY_*` values plus
`BACKSTORY_IMAGE=ghcr.io/bcl1713/backstory:1.0.0`. The endpoint pulls the published
image; no build or repository checkout is required.
`COMPOSE_FILE` and `COMPOSE_PROJECT_NAME` do not select the Web editor manifest or
stack name: select those explicitly in Portainer. Bind paths are on the endpoint
host, not the browser or Portainer container. Startup migrates the database;
create named accounts interactively through its console using
`python manage.py create_account`. No default account or password environment
variable exists. See the [Portainer steps](setup.md#portainer-on-a-docker-standalone-endpoint).

Run `python manage.py check --deploy --fail-level WARNING` with the final HTTPS
environment. An existing Cloudflare connector uses this same contract and needs
no Backstory token. The [optional bundled connector](cloudflare.md#optional-bundled-connector)
has additional inputs listed below.

## Where values are consumed

- Compose CLI reads `.env` as **substitution data**, not as a script. Do not
  source/eval it. Exported shell variables take precedence over `.env`. Portainer
  stack environment fields supply the corresponding substitutions.
- A `.env` entry reaches the application only when a manifest explicitly puts it
  under `services.web.environment`. Compose does not forward every entry. There
  is no automatic dotenv loader in native Django commands.
- **Host paths and process paths differ.** In Compose, `BACKSTORY_WIKI_ROOT` is the
  host bind source; the process receives `BACKSTORY_WIKI_ROOT=/wiki`.
  `BACKSTORY_DATA_HOST_PATH` maps to process `BACKSTORY_DATA_DIR=/var/lib/backstory`.
  Do not set `BACKSTORY_DATA_DIR` in the Compose `.env` to change a mount.
- The supervisor starts one Gunicorn worker (four threads, internal
  `0.0.0.0:8000`) and one `run_indexer`, sharing the same application environment.
  `BACKSTORY_BIND_ADDRESS` controls host publication/validation, not Gunicorn's
  internal listener. Native commands need the actual listener restricted too.
- Absent optional settings use the defaults below. Manifest substitutions using
  `:-` also use defaults for empty values; required `:?` substitutions reject
  missing/empty values before container creation. In native process environment,
  an explicitly empty enum or numeric setting is invalid. Restart/recreate both
  web and worker after configuration changes; saving `.env` alone changes neither.

## Application settings inventory

All entries here are non-secret configuration, though paths/network metadata can
be private. Do not put credentials in them. Invalid inputs fail settings startup
with a setting name and remedy without echoing the supplied value. For storage
loss, the application deliberately stays available for diagnostics/protected
drafts while storage readiness disables writes; it never creates a missing wiki
or marker. Mount provenance and actual access still require operator verification.

### Storage

| Name | Requirement and purpose | Accepted value; default | Safe example and omission/error consequence |
| --- | --- | --- | --- |
| `BACKSTORY_WIKI_ROOT` | Always required by settings; authoritative wiki root. Required host source in all manifests. | Absolute path; no application default. Host-bind recipes require canonical POSIX spelling. | Native `/tmp/backstory-demo/wiki`; Compose `/srv/wiki`. Missing/relative input stops startup/rendering. Missing/unreadable storage reports unavailable; it is never created. |
| `BACKSTORY_DATA_DIR` | Always required by settings; private SQLite users/sessions/index, drafts, history and signing secret. Manifests set it internally. | Absolute root disjoint from wiki; no native default; container `/var/lib/backstory`. | Native `/tmp/backstory-demo/data`. Missing, relative or overlapping roots stop startup. New native data is created privately; container host sources must already exist. Keep it on local storage and writable by the selected user. |
| `BACKSTORY_IDENTITY_PATH` | Optional override for existing installations; approved root marker filename. | One filename, no slash/backslash/control characters or `.`/`..`; default `.backstory-marker`. | `.backstory-marker`. Omission uses default; invalid name stops startup; missing, unreadable or nonregular marker makes storage unavailable. Contents are never read/hashed. The marker is excluded from all content routes and indexing. |
| `BACKSTORY_EXCLUSIONS` | Optional extra deny patterns; cannot relax built-in exclusions. | Comma-separated patterns, whitespace trimmed; default empty. | `private,work/*.md`. Empty means built-in policy only. Matching files cannot be browsed/edited/indexed; commas cannot be part of a single pattern. |
| `BACKSTORY_REVISION_QUOTA_BYTES` | Optional logical recovery-payload quota, independent of fixed 30-day retention. | Positive integer bytes; default `67108864` (64 MiB). | `134217728`. Omission uses default; empty/native, nonnumeric or nonpositive input stops startup. A valid quota too small for a save can prevent safe history capture and therefore saving; this is not a SQLite file-size limit. |

### Browser and proxy trust

| Name | Requirement and purpose | Accepted value; default | Safe example and omission/error consequence |
| --- | --- | --- | --- |
| `BACKSTORY_COOKIE_MODE` | Optional, but explicitly choose localhost for native HTTP development. | `https` or `localhost`; native default `https`; base/Portainer Compose default `localhost`; bundled tunnel fixes `https`. | `localhost` for loopback HTTP. HTTPS enables Secure cookies, redirects and HSTS. Localhost requires loopback host allowlist/bind; other values stop startup. Never expose localhost mode to a network interface. |
| `BACKSTORY_ALLOWED_HOSTS` | Always required by settings; exact accepted browser Host names. Base/Portainer provide local defaults; tunnel requires explicit input. | Comma-separated exact ASCII hostnames/IPv4 or bracketed IPv6, no scheme/port/wildcard/leading dot. No native default; Compose `localhost,127.0.0.1`. | `wiki.example.test`; local `localhost,127.0.0.1,[::1]`. Missing/invalid names stop startup. Local mode allows only loopback names (and synthetic `testserver`). A different request Host is rejected. |
| `BACKSTORY_BIND_ADDRESS` | Optional application safety assertion and Compose host publish interface. | Literal IPv4/IPv6; default `127.0.0.1`. Localhost mode requires loopback. | `192.0.2.10` for a verified private HTTPS origin. Invalid/nonloopback-local values stop settings startup. An address absent on the host fails Docker publication. It does not configure a native listener or establish a firewall. |
| `BACKSTORY_PROXY_MODE` | Optional; opt in only when using an HTTPS frontend. | `off` or `trusted`; default `off`; bundled tunnel fixes `trusted`. | `trusted`. Off ignores forwarded scheme/client identity. Trusted requires HTTPS cookie mode, explicit peers and origins. Invalid/missing related settings stop startup. |
| `BACKSTORY_CSRF_TRUSTED_ORIGINS` | Required in trusted proxy mode; otherwise optional (empty by default). Exact allowed HTTPS browser origins. | Comma-separated HTTPS origins matching allowed hosts, optional public TLS port, no path/trailing slash/credentials/query/fragment. | `https://wiki.example.test` or `https://wiki.example.test:8443`. Missing trusted-mode origins or malformed/mismatched HTTPS entries stop startup. Leave empty for localhost HTTP. This never disables CSRF tokens. |
| `BACKSTORY_TRUSTED_PROXY_IPS` | Required in trusted mode; actual origin-side TCP peers, never public client ranges. | Comma-separated literal IPs/canonical CIDRs; default empty. Universal trust (including split universal networks), multicast and unspecified single IPs are rejected. | `192.0.2.20/32,2001:db8::20/128`. Missing trusted-mode peers/invalid networks stop startup; an untrusted peer receives HTTP 400. Off mode grants no forwarding trust even if peers are configured. |
| `BACKSTORY_PROXY_CLIENT_IP_HEADER` | Optional trusted single-client-IP assertion; only enable an overwrite contract you control. | `none`, `x-real-ip`, `x-forwarded-for`; default `none`; bundled tunnel fixes `none`. | `none` ignores client headers, using peer IP for throttling (clients may share a bucket). Invalid selection stops startup. With a selected header, malformed/empty/multiple IPs get HTTP 400; absence retains the peer. |

### Background worker

These optional settings apply to the native worker and are explicitly forwarded
by base, Portainer and bundled-tunnel manifests. Requests never start scans. Keep
defaults unless maintenance behavior needs adjustment; no extra worker service,
broker, worker count or credentials are needed.

| Name | Purpose | Accepted value; default | Safe example and omission/error consequence |
| --- | --- | --- | --- |
| `BACKSTORY_INDEX_BATCH_SIZE` | Maximum note work per bounded batch, including priority saves. | Positive integer; default `20`; worker caps effective work at `20`. | `10`. Omitted uses default; larger valid values retain the cap; smaller values reduce work per batch. Invalid/native-empty/nonpositive values stop startup. |
| `BACKSTORY_INDEX_YIELD_SECONDS` | Interruptible delay between batches (also when idle). | Finite number of seconds >= `1`; default `1`; fractional values accepted. | `1.5`. Larger delays slow indexing. Omitted uses default; NaN/infinity, subsecond, negative or malformed values stop startup. |
| `BACKSTORY_INDEX_INCREMENTAL_SECONDS` | Incremental discovery/stat reconciliation interval. | Positive integer seconds; default `300`. | `600`. Omitted uses default; larger intervals delay external-change discovery; invalid/nonpositive values stop startup. |
| `BACKSTORY_INDEX_VERIFY_SECONDS` | Content verification interval for changes stat checks might miss. | Positive integer seconds; default `86400`. | `43200`. Omitted uses default; larger intervals delay full verification; invalid/nonpositive values stop startup. |
| `BACKSTORY_INDEX_QUEUE_LIMIT` | Bound on coalesced priority note jobs. | Positive integer; default `1000`. | `500`. At capacity, reconciliation is requested instead of growing the queue. Omitted uses default; invalid/nonpositive values stop startup. |

### Generated host-bind provenance (do not enter manually)

These application settings preserve the disjoint-storage guard across container
mount namespaces. Host-data, Portainer and tunnel manifests derive them from
their actual bind sources. They are not independent installation choices and
adding them to `.env` does not override those generated entries.

| Name | Purpose and accepted value | Default; example | Omission/error consequence |
| --- | --- | --- | --- |
| `BACKSTORY_STORAGE_SOURCE_MODE` | `native` for actual native roots or named-data-volume installs; `host-bind` for two host bind roots. | `native`; manifests set `host-bind`. | Native mode rejects any supplied host metadata. Unknown/empty mode stops startup. |
| `BACKSTORY_WIKI_HOST_SOURCE` | Original host wiki source; canonical absolute POSIX path without dot components, repeated separators, trailing slash, backslashes or control characters. | Unset; derived `/srv/wiki`. | Required with host-bind, forbidden with native. Missing/invalid values stop startup before private state creation. It is never opened/resolved inside the container. |
| `BACKSTORY_DATA_HOST_SOURCE` | Original host private-data source, same syntax; equal/nested wiki/data sources forbidden. | Unset; derived `/srv/backstory-data`. | Required with host-bind, forbidden with native. Missing/invalid/overlapping values stop startup. Host symlink/bind aliases still require independent provenance verification. |

## Compose / Portainer substitutions only

These configure Docker rather than Django. Bad types/paths/ports are reported by
Compose or Docker; actual ownership, storage availability and network restrictions
cannot be established by rendering a manifest.

| Name | Requirement and purpose | Accepted value; default | Safe example and omission/error consequence |
| --- | --- | --- | --- |
| `COMPOSE_FILE` | CLI selection of manifests; not a Portainer stack variable. | Colon-separated filenames on Linux; default auto-discovers `compose.yaml`. | `compose.yaml:compose.host-data.yaml`. Omission selects named-data-volume setup; wrong filename fails CLI config. Bundled tunnel uses `compose.cloudflare.yaml`. |
| `COMPOSE_PROJECT_NAME` | Optional CLI installation identity; choose a stable unique name. | Compose project name (lowercase letters/digits, hyphens/underscores, begins alphanumeric); default checkout directory name. | `backstory-wikitest`. Changing it can select a different named volume/network and conflict with an existing host port. Portainer uses its explicit stack name. |
| `BACKSTORY_IMAGE` | Image tag/reference; required for build-free Portainer/tunnel files. | Docker image reference; base default `backstory:local`, no default in standalone/tunnel. | `ghcr.io/bcl1713/backstory:1.0.0` for standalone/tunnel. Base source workflow builds `backstory:local`; build-free manifests pull the selected registry image. Missing required input fails rendering; unavailable image fails startup/pull. |
| `BACKSTORY_UID` | Optional non-root process user; choose to match effective host storage ownership. | Supported recipe: positive numeric UID; default `10001`. | `1000`. Omission retains image owner. Wrong mapping causes storage access failures; never solve that by running as root or changing live wiki permissions. |
| `BACKSTORY_GID` | Optional non-root process group, coupled to UID and storage access. | Supported recipe: positive numeric GID; default `10001`. | `1000`. Omission retains image group; wrong mapping can deny access. Rootless/userns deployments require separate mapping verification. |
| `BACKSTORY_DATA_HOST_PATH` | Required only for host-data overlay, Portainer and bundled tunnel; private host data bind. | Existing canonical absolute POSIX directory, disjoint from wiki/checkout; no default. | `/srv/backstory-data`. Missing substitution fails rendering; missing directory fails Docker startup (`create_host_path: false`). Ignored by base named-volume setup. |
| `BACKSTORY_WIKI_READ_ONLY` | Optional Docker wiki mount mode; recommended `true` for first rehearsal. | Boolean `true`/`false`; manifest default `false` for compatibility. | `true`. Readiness may still be ready while saves fail; private app data stays writable. Change to `false` deliberately to edit; this cannot grant host write permission. |
| `BACKSTORY_PORT` | Optional published HTTP origin port (base/Portainer only). | Integer TCP port `1`–`65535`; default `8000`; internal port always `8000`. | `8123`. Omission uses 8000; invalid/in-use ports fail rendering/publication. Bundled tunnel publishes no port and ignores this input. |

`BACKSTORY_WIKI_ROOT` and `BACKSTORY_BIND_ADDRESS` have both substitution and
application roles, described above. The optional host-data overlay has no
independent web service and inherits application environment from the base file.

### Optional bundled Cloudflare connector

Only `compose.cloudflare.yaml` consumes these inputs. They are all required for
that variant and ignored by the others. No token is needed to reuse an existing
connector. Use [cloudflare.env.example](../cloudflare.env.example) and follow the
[tunnel guide](cloudflare.md), including edge HTTPS and network restrictions.

| Name | Purpose / accepted value | Default; safe example | Omission/error consequence |
| --- | --- | --- | --- |
| `BACKSTORY_TUNNEL_SUBNET` | Conflict-free private IPv4 CIDR for the isolated origin network. | None; `172.30.241.0/29` after checking LAN/VPN/Docker conflicts. | Missing fails rendering; invalid/conflicting subnet fails Docker network creation. |
| `BACKSTORY_TUNNEL_CONNECTOR_IP` | Usable static IPv4 inside that subnet, dedicated to the connector. Also derives app trusted-peer `/32`. | None; `172.30.241.3`. | Missing fails rendering; invalid/out-of-subnet addresses fail validation/startup. Generic peer overrides cannot replace the manifest-derived trust. |
| `CLOUDFLARE_TUNNEL_TOKEN_FILE` | Absolute endpoint-host path to an existing private regular token file, readable by the connector's selected UID. **File contents are secret; this value is a path only.** | None; `/srv/private/cloudflare-tunnel-token`. | Missing fails rendering; missing bind fails Docker startup; unreadable/invalid token prevents connector authentication. Keep mode `600`, outside wiki, checkout and app data; never paste token contents into `.env`, commands or logs. |

## Secrets, fixed settings and migration

The application generates `BACKSTORY_DATA_DIR/application-secret` atomically,
mode `600`, and reuses it on restart. There is **no** `SECRET_KEY`, admin password
or signing-secret environment requirement. Preserve this file with the separate
application-data backup; do not delete it to fix startup. Missing permission or
damaged secret errors name `BACKSTORY_DATA_DIR` and recommend checking its mount,
effective UID/GID and restoring protected state. User passwords are hidden
interactive inputs, never environment variables. Named accounts and authentication
remain mandatory behind every proxy, tunnel or external identity layer.

`DJANGO_SETTINGS_MODULE` defaults to `backstory.settings` in `manage.py` and WSGI;
it is a developer framework selector, not an operator deployment setting. Selecting
another module bypasses this documented interface. `GUNICORN_CMD_ARGS` and
`FORWARDED_ALLOW_IPS` are Gunicorn inputs, not supported Backstory configuration:
the supervisor explicitly disables independent scheme/path/identity forwarding
and PROXY protocol so they cannot replace application peer validation. Use the
documented settings instead. Python buffering/bytecode/PATH settings in the image
and build-only package-manager/proxy CA inputs are build/runtime tooling, not
application decisions; see [development](development.md).

Session timeouts, upload limits, revision retention, Gunicorn worker/thread count,
SQLite path, DEBUG, logging and HTTPS security flags are fixed code settings, not
environment knobs. Invented `BACKSTORY_*` names are ignored; use only the names
in this reference. Native development must export settings to **both** web and
worker processes; see the [synthetic workflow](development.md).

Migration from earlier releases:

- `BACKSTORY_IDENTITY_SHA256` is obsolete and ignored. Remove it. The default
  marker changed from `Home.md` to `.backstory-marker` in issue #4. Follow the
  [owner-controlled marker migration](setup.md#migrate-from-a-visible-marker-and-hash);
  this update never creates/moves a live marker. A configured visible root marker
  remains supported on presence alone and is excluded from ordinary content.
- This configuration cleanup changes **no defaults or supported variable names**.
  Redundant default-valued lines were removed from examples; `.env.example`
  deliberately keeps the read-only rehearsal despite the manifest's `false`
  default. Existing local, proxy and storage decisions remain explicit.
- Numeric worker/quota values are now checked before private state creation:
  positive integers, and a finite yield delay >= 1 second. Previously malformed
  input could raise raw conversion errors late; zero/negative values and NaN or
  infinity could silently clamp, stall maintenance or fail later. Valid positive
  defaults are unchanged. Fix invalid native values or omit them for defaults.
  Compose/Portainer now forwards all five worker settings, so formerly ignored
  overrides become effective after recreation; review those entries first.
- Exact HTTPS hosts/origins are now checked while loading settings, consistent
  with deployment checks. Schemes/ports belong in origins as documented, never
  in the host allowlist. There is no wildcard fallback or automatic proxy trust.
