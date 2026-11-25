# Authenticated private LAN HTTPS MCP

For an NPM-authenticated, contained private backend hop, use the separate explicit
[proxy-only mode](native-mcp-proxy.md). This page describes direct TLS+bearer mode;
its existing Forge/LAN selectors and forwarding-header refusals remain unchanged.

This optional process adds authenticated private HTTPS to the shipped
[native tools](native-mcp.md). Stdio remains available. Ordinary web startup,
WebMCP/session/CSRF authorization and the default web container command do not
start it. There is no anonymous mode, OAuth implementation, Django MCP route,
browser-cookie bridge, public endpoint, or persistent client setup.
[Issue #46](https://github.com/bcl1713/backstory/issues/46) remains separate and
unchanged; only its shared-domain-service rationale is reused.

The one accepted bearer grants the process's deliberately selected wiki access,
including guarded mutations. The peer-IP restriction is an additional boundary,
not identity by itself. A successful request still uses the same server-owned,
storage-bound `LocalActor`/`Access`, path policy, revisions, collision refusal,
cooperative locks, formatter/backups, recovery journals and indexing outcomes as
stdio. All 29 tool names/schemas/results are shared. Native clients cannot see
unsaved browser buffers. Untrusted note content never grants tool authority.

## Required operator facts

Before any operator activation, establish these facts; this source change does
not discover, provision or modify them:

- A specific TrueNAS RFC1918 IPv4 interface actually present in the process's
  network namespace, an exact port, and a canonical HTTPS certificate SAN host.
- An explicitly approved private IPv4 LAN CIDR, as observed directly by the
  listener, containing the bind address. Choose exactly one `--lan-cidr` or the
  backwards compatible single-peer `--forge-ip`; neither is a default.
  Forge mode still requires one exact distinct RFC1918 source IP and accepts
  no subnet. Choosing LAN mode deliberately widens the eligible peers, so its
  actual network boundary must be approved before startup. No wildcard or proxy
  address establishes a client identity; every eligible client still authenticates.
- A server certificate/key and a CA trust anchor each client can verify, including the
  endpoint hostname. No `ssl_verify: false`, insecure bypass or anonymous trial.
- An operator-supplied single-purpose bearer in a private file on TrueNAS and
  the matching preauthorized client secret reference. Neither value belongs in
  Git, an image, URL, command line, output or log. Provisioning/rotation is a
  separately authorized operator action, not performed by this increment.
- The correct existing wiki and its matching migrated application data directory
  (`backstory.sqlite3`, storage ownership, signing secret, locks and recovery).
  Keep them together; no new database, storage initialization or root rebinding
  is selected by the HTTPS process.

The accepted addresses are deliberately restricted to RFC1918 IPv4. IPv6,
loopback, public addresses, listen-all and hostname binds fail closed. LAN CIDRs
must be canonical network/prefix notation (no host bits or dotted netmask), wholly
inside one RFC1918 range, with the bind inside that subnet. Public/spanning ranges,
malformed selectors and implicit widening fail before Django setup. The CIDR is
an operator fact, not discovered from interfaces or guessed from a bind address.
DNS endpoint names do not replace the explicit private bind. Endpoint
form is exactly `https://lowercase-host:port/mcp`, including port, with no
userinfo, query or fragment. An IP endpoint must equal the bind address.

## Exact opt-in launch

Use the existing optional `native-mcp` environment pinned to official
`mcp==2.3.0` by `uv.lock`. The default dev.307 image's virtualenv lacks this
extra; never install it inside a running container. No package changes are
required by this source increment.

The following selectors have **no defaults**. Variables stand for verified
operator facts, not values discovered or assumed by this task:

```sh
/path/to/optional-venv/bin/python -m backstory.native_https --https \
  --wiki-root "$WIKI_ROOT" --data-dir "$MATCHING_APP_DATA" \
  --bind-ip "$TRUENAS_PRIVATE_IP" --port "$MCP_HTTPS_PORT" \
  --endpoint "$EXACT_HTTPS_MCP_URL" --lan-cidr "$APPROVED_EXACT_PRIVATE_LAN_CIDR" \
  --token-file "$PRIVATE_BEARER_FILE" \
  --tls-cert "$SERVER_CERT_FILE" --tls-key "$PRIVATE_KEY_FILE"
```

`APPROVED_EXACT_PRIVATE_LAN_CIDR` is a placeholder, not an asserted real subnet.
Existing Forge-only launches keep `--forge-ip "$EXACT_FORGE_SOURCE_IP"` instead
of `--lan-cidr`; they continue to refuse every other peer. Supplying both or
neither refuses startup. Explicit HTTPS, storage, bind, port, endpoint, token and
certificate selectors remain required in either mode. No web route or default
web startup is broadened by selecting the optional LAN process.

Paths must be absolute. Wiki and database must already exist and be disjoint.
The process selects them before Django setup and never reads Hermes config.
Bearer and key must be regular no-follow files owned by the process UID, with no
group/other permission bits (for example 0400 or 0600). The token file contains
one 32–256-character ASCII bearer, optionally followed by one newline. Only its
SHA-256 digest is retained by the app; comparison uses constant-time comparison.
Certificate/key loading establishes TLS 1.2 or newer. Credentials are not logged
or echoed; HTTP access logs are disabled. Restart the optional process after a
separately authorized certificate/token replacement; there is no reload bridge.

The listener serves only POST `/mcp`, with stateless official SDK Streamable HTTP
and finite JSON replies. There is no GET stream/SSE fallback, redirect, CORS
allowance or alternate upstream route. SDK Host/Origin protection is enabled
with the exact configured host/port and no allowed origins. The outer guard also
rejects duplicate Host/Authorization headers, all present browser Origins and
forwarded-address headers before SDK/storage access. Native clients omit Origin.

The actual ASGI peer must belong to the configured LAN, or equal the selected
Forge IP in single-peer mode, on **every request**. Public, malformed and
IPv4-mapped IPv6 peers do not gain LAN membership. Uvicorn proxy
header processing is explicitly disabled and its trusted-forwarder list is
empty. Neither `Forwarded` nor `X-Forwarded-*` nor `X-Real-IP` can establish a peer.
The operator must establish source preservation before startup. A proxy/NAT
that hides an outside client behind an in-LAN address defeats a subnet boundary
because the app sees only that immediate peer; it is not a supported topology.
Do not widen the CIDR, select a proxy peer or trust headers to make a test pass.
Use a direct source-preserving route, with no wider-internet ingress to this
private bind. IP eligibility is always additional to verified TLS and bearer
authentication, never a replacement for them.

## Frozen optional TrueNAS artifact

`Dockerfile` has explicit target `native-mcp`. It derives from the normal runtime
base and adds only `uv sync --frozen --no-dev --extra native-mcp --no-cache` at
build time, then restores UID/GID 10001. Its entry point is
`python -m backstory.native_https`; missing explicit flags refuse startup. The
last/default target remains `runtime`, with the ordinary web command. No default
Compose changes or published ports are added. Existing web image dependency and
build behavior remains unchanged.

For EDITH only, after separately authorized review/commit/build prerequisites:

```sh
docker build --platform linux/amd64 --target native-mcp \
  --build-arg BACKSTORY_REVISION="$EXACT_REVIEWED_SOURCE_SHA" \
  --build-arg BACKSTORY_VERSION="$CANDIDATE_VERSION" \
  -t backstory-native-mcp:local-review .
```

Prerequisites: the exact reviewed source checkout and frozen manifests; the
existing trusted build executor with the pinned base images/Node/uv inputs and
approved public package access; any required existing build-only CA secret via
the established `proxy_ca` mechanism. No bearer or private TLS key enters the
build context. This task did **not** run Docker, build an image, publish a tag,
activate a workload, or validate a TrueNAS platform/image runtime. Local tests use
Python 3.14.4; the source's existing container base is Python 3.14.9, unchanged.
An exact image build/check for this LAN revision remains an operator prerequisite,
not a claimed pass. Prior Forge-only image/route evidence is historical and does
not certify the changed selector or two-peer LAN route.

### Eventual publication and pull, separately authorized only

Review/terminal holds and deployment restrictions still apply. This source
candidate does not authorize any publication, pull or activation. When separately
authorized, first follow the [candidate runbook](ci/README.md): prepare the exact
proposed merge, complete its required gate, retain independent exact-commit review
and land with the required atomic expected leases. These focused LAN tests are
not that gate. A changed source requires its own candidate evidence.

The existing `scripts/local_release.py`/publisher builds the default web target;
its build command has no `--target native-mcp`. Its web release/version/channel
tags therefore do **not** publish this optional SDK image. Do not pull `:dev` or
`:latest` expecting the native target or modify that publisher for this increment.

A separately approved native artifact operation must use the exact landed,
reviewed source context, frozen manifests and trusted build inputs, with a
distinct immutable native image/tag and retained digest/labels/metadata. Example
placeholders only, for that future operator action:

```sh
docker buildx build --platform linux/amd64 --target native-mcp \
  --build-arg BACKSTORY_REVISION="$EXACT_LAN_SOURCE_SHA" \
  --build-arg BACKSTORY_VERSION="$APPROVED_VERSION" \
  --label "org.opencontainers.image.revision=$EXACT_LAN_SOURCE_SHA" \
  --label "org.opencontainers.image.version=$APPROVED_VERSION" \
  --label org.opencontainers.image.source=https://github.com/bcl1713/backstory \
  --tag "$APPROVED_NATIVE_IMAGE:$IMMUTABLE_NATIVE_TAG" \
  --metadata-file "$NATIVE_BUILD_METADATA" --push "$EXACT_LAN_SOURCE_CONTEXT"
```

This is an explicit additional native-target publication, not a web publisher
feature or permission granted here. Keep existing web aliases untouched. Retain
the source/version, linux/amd64 platform, frozen-extra provenance and immutable
digest; never overwrite an immutable tag. After inspection and separate pull
authorization on the target, the corresponding command is:

```sh
docker pull --platform linux/amd64 "$APPROVED_NATIVE_IMAGE@$VERIFIED_NATIVE_DIGEST"
```

Pulling does not authorize startup. Establish the approved LAN boundary, selected
interface/port, UID/mount compatibility, trust anchor, SAN/endpoint and credentials
first. Later operator evidence must include a strict fresh-chain real two-peer
packaged TLS route, each eligible peer's initialize/list/status and credential
refusals, with only disposable data and no published public ports. The prior
`peer_probe.py` may be reused unchanged when its fixture endpoint, baseline and
version sentinel still apply; it is not production-version validation.

Minimal proposed TrueNAS/DUM-E delta: one separate optional workload using this
artifact, same existing wiki/data mounts and compatible UID, read-only private
credential/certificate mounts, and the complete selector list above. Its network
namespace must actually contain the selected private address and preserve each
client's source; a positively verified host-network arrangement is one possible operator
choice. No ingress topology is assumed, and no plain HTTP/private upstream is
created. A bridged namespace lacking the address cannot bind and must remain
stopped; never replace the bind with 0.0.0.0. Keep the ordinary web workload,
ports, account setup and stdio option unchanged. This is a proposal, not a service
management action or deployment dispatch.

Rollback: stop only the optional HTTPS workload and deactivate only its proposed
client entries through separately authorized operator controls. Retain
wiki/data/recovery material; do not purge journals or undo confirmed writes.
After any uncertain mutation, inspect before a deliberate recovery decision.
WebMCP and stdio need no rollback changes.

## Hermes source compatibility and a secrets-free example

Read-only inspection was limited to installed `tools/mcp_tool.py` and the direct
HTTP/config helpers needed for this check under the authorized Hermes source
tree. No saved profile, `.env`, real token, config loader or running Hermes was
read, changed or activated.

The shipped code supports configured `headers`, recursively resolves `${VAR}`
and `${env:VAR}` through the active profile secret resolver, and refuses unresolved
URL/header references. Its HTTP path selects the same `httpx2` module as MCP
SDK 2.x, injects configured headers into the owned client, and defaults
`ssl_verify` to true. A CA-file path is forwarded to the inner verified transport
(the installed HTTPX2 supports that path form). Source `protocol: legacy` uses
`ClientSession.initialize`; `auto` also tries initialize first. SDK 2.3.0's actual
initialize proof negotiated MCP 2025-11-25. Stateless server transport does not
require Hermes's newer discover-first mode.

Template only: replace the `.invalid` URL/port and public CA path with verified
operator facts. The secret reference is the supported syntax, not a real token:

```yaml
mcp_servers:
  backstory_private:
    url: "https://backstory.internal.invalid:9443/mcp"
    headers:
      Authorization: "Bearer ${env:BACKSTORY_PRIVATE_MCP_TOKEN}"
    ssl_verify: "/absolute/operator/public-ca-bundle.pem"
    protocol: "legacy"
    strict_redirect_headers: true
```

No OAuth entry or cookie is needed. `strict_redirect_headers` prevents the
shipped helper's SSE fallback and strips configured headers on a cross-origin
redirect. SDK 2.3.0 itself refuses unsafe cross-origin/method-changing redirects.
The server issues none. Hermes can reconnect its transport; that is not approval
to replay a mutation. Its inspected teardown fails in-flight calls. Read/inspect
unknown outcomes before a new deliberate tool request. URL/private-network policy
outside the inspected MCP connect path and the operator's active configuration
remain an actual-host check. No live Pepper/Hermes compatibility is claimed.

Hermes may apply proxy environment settings. The operator must verify a direct,
source-preserving route/bypass for this exact endpoint; do not assume an existing
proxy keeps Forge's IP. This task reads or changes no proxy/client configuration.
Hermes also caps each HTTP response at 10 MiB; the server's encoded-response cap
is 32 MiB. Prefer small explicit read batches. Escape-heavy source may exceed a
transport/client limit even within the domain byte budget. An unreadable/lost
reply is not absence and never authorizes write replay; use another supported
authoritative inspection path if the complete source cannot fit. Bodies are
never silently truncated.

## Bounds and proof boundary

Requests are capped at 16 MiB by the SDK before dispatch, with an absolute
ten-second receive deadline for the complete body. Only one request enters the application at a time;
overlap returns not-started/not-queued, with no automatic work scheduled. Responses
are buffered with a 32 MiB cap before publication. Response failure after a
mutation is `uncertain`, with read/inspect guidance. Shared dispatch retains its
guard while synchronous work finishes after cancellation. A delayed index remains
separate from the operation outcome. There is no retry/replay or recovery resume
loop in this transport.

`tests/native/test_native_https.py` starts children with isolated wiki/migrated
SQLite configuration selected before application setup. The production ASGI app
and official SDK exchange real serialized initialize/list/call HTTP messages
through `httpx2.ASGITransport` with a synthetic peer and real ASGI lifespan. The
same Uvicorn SSL configuration used for launch undergoes actual TLS record and
application-data exchanges through MemoryBIO: trusted CA succeeds, untrusted CA
and wrong hostname fail. Socket bind/listen/connect are prohibited by the proof.
These are listener-free HTTP and TLS proofs, not an end-to-end TCP/TLS route test.
`tests/native/lan_proof.py` additionally exercises two eligible private peers,
unauthenticated and outside/spoofed peers before Access, guarded save/readback,
cross-peer stale refusal without mutation, and unchanged single-peer Forge mode.
Those ASGI peers are synthetic metadata; MemoryBIO verifies real TLS separately.
The later real two-peer packaged TCP/TLS check belongs to EDITH's separately
scoped native execution after review and is not claimed by these tests.

Selected installed Hermes helper ASTs execute with only a synthetic secret resolver
and ASGI transport at the network boundary. Header interpolation, SDK initialize
and strict redirect-header stripping are exercised without importing its config
loader. This is scoped helper compatibility plus actual SDK wire behavior, not
activation of the full consumer or proof of its installed runtime/configuration.
This helper lane requires an explicit `BACKSTORY_TEST_HERMES_TOOLS` absolute
source-directory selector; ordinary HTTP/TLS tests do not import that helper or
read any Hermes checkout. With the existing optional test environment and private
scratch selected, run the portable lane with this selector unset:

```sh
/path/to/optional-venv/bin/python -m pytest tests/native/test_native_https.py -q -s
```

For a separately authorized read-only installed-source compatibility check only:

```sh
BACKSTORY_TEST_HERMES_TOOLS=/absolute/authorized/hermes-agent/tools \
  /path/to/optional-venv/bin/python -m pytest \
  tests/native/test_native_https.py::test_authenticated_https_without_bound_listener -q -s
```

The selector grants no runtime/client configuration and has no production effect.
When explicitly selected, absent/incompatible helper source fails that optional
proof rather than silently skipping it. Normal HTTP/TLS proof remains portable.

Remaining operator checks, only after separate authorization: exact optional image
build; TrueNAS address/UID/mount/peer preservation; client DNS/SAN/CA trust and
matching secret-reference resolution; positive initialize/status/read; missing and
wrong token, wrong source (including spoofed forwarded headers), wrong Host/Origin,
and untrusted/wrong-name TLS refusal. Use only approved synthetic data for any
guarded write and stale-refusal check, retaining inspection/recovery material.
Do not broaden access, disable TLS verification or deploy merely to obtain a pass.
