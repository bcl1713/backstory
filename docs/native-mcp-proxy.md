# NPM-contained native MCP backend

This is an explicit alternative to [direct HTTPS+bearer](native-mcp-https.md) and
stdio. It changes no web/WebMCP authorization, jobs, actor or storage policy,
default startup, package pins or issue #46. NPM owns client HTTPS and sign-in;
Backstory serves plain Streamable HTTP only on its isolated private hop.

## Boundary required before startup

The approved edge contract is NPM2.14.0, its existing verified wildcard HTTPS
endpoint, a per-host exact `/mcp` location, approved LAN allow/deny **and**
`auth_basic` with `satisfy all`. The operator-managed verifier is
`/data/backstory-mcp-verifier.htpasswd` on NPM. Never mount it or client credentials
in Backstory. The actual deployed host, network attachments and live sign-in
remain operator work; this source increment does not establish them.

Use a dedicated unpublished internal bridge (`backstory-mcp-private` in the
placement contract) with only NPM and this backend attached. The backend joins
only that bridge, has no host port binding, and binds its exact private address.
NPM's exact distinct private transport address is the only admitted socket peer.
This two-member containment plus exact peer is the trusted boundary. A DNS name,
Host, forwarded client address or identity header cannot establish that boundary.
No shared bridge, public route, alternate upstream path, proxy/NAT workaround or
implicit downgrade is supported. A host/daemon or NPM compromise is outside this
boundary. The app cannot inspect Docker membership; operators must verify it.

## Backend selectors

All variables below are operator-supplied facts/placeholders, not discovered live
values. Select existing matching wiki and migrated data before application setup:

```sh
/path/to/optional-venv/bin/python -m backstory.native_https --proxy-only \
  --wiki-root "$WIKI_ROOT" --data-dir "$MATCHING_DATA" \
  --bind-ip "$EXACT_PRIVATE_BACKEND_IP" --port "$PRIVATE_BACKEND_PORT" \
  --npm-ip "$EXACT_DISTINCT_NPM_TRANSPORT_IP" \
  --endpoint "$CANONICAL_CLIENT_HTTPS_MCP_URL"
```

Both addresses must be canonical RFC1918 IPv4 literals; there is no listen-all,
CIDR or hostname bind. `--https` and `--proxy-only` are mutually exclusive.
Proxy mode rejects `--forge-ip`, `--lan-cidr`, `--token-file`, `--tls-cert` and
`--tls-key`. It loads no backend credentials or certificate/key files. Direct
mode still requires its TLS/bearer/peer selectors and rejects `--npm-ip`.
No mode is the default. The optional frozen `native-mcp` image target can run
either explicit mode; ordinary web image/startup remains unchanged.

The endpoint describes the **client's** HTTPS authority, independent of backend
port/address: `https://exact-host/mcp` for implicit443, or
`https://exact-host:9443/mcp` for a nondefault fixture port. Use canonical lowercase
Host, exact `/mcp`, no wildcard/userinfo/query/fragment/trailing slash. Explicit
`:443` is refused in favor of canonical implicit443. The frontend must preserve
that authority; backend `Host: backend-ip:port` refuses421. Present Origin refuses
403. Client TLS verification belongs on the NPM-facing connection and must stay
enabled with the correct trust anchor and hostname.

## NPM and client contract

The operator must validate the actual generated NPM configuration for the host.
The following is a location contract, not a command to overwrite shared config
or create a duplicate generated location. Use the established per-host NPM
mechanism and retain the required LAN policy/authentication at this exact route:

```nginx
location = /mcp {
    satisfy all;
    allow <APPROVED_LAN_CIDR>;
    deny all;
    auth_basic "Backstory MCP";
    auth_basic_user_file /data/backstory-mcp-verifier.htpasswd;
    proxy_pass http://<EXACT_PRIVATE_BACKEND_IP>:<PRIVATE_BACKEND_PORT>;
    proxy_http_version 1.1;
    proxy_set_header Host $http_host;
    proxy_set_header Authorization "";
    proxy_set_header Connection "";
    proxy_buffering off;
    client_max_body_size 16m;
}
```

Preserve Accept/Content-Type and MCP protocol headers. Authenticate before proxying;
provide no unauthenticated alternate route. Clear Authorization: any present
Authorization at the backend, even empty, is refused403 (`upstream_credentials_denied`).
Do not copy Basic to a bearer or install a second backend verifier.

NPM's `Forwarded`, `X-Forwarded-*`, `X-Real-IP` and any identity headers may be
left at NPM defaults in this mode: Backstory **ignores** them. They neither select
the actor nor replace the socket peer, scheme or configured Host. Uvicorn proxy
header trust is disabled. Direct HTTPS mode continues to reject forwarding
headers. The process owns the same storage-bound actor/Access; all edge-approved
clients receive that selected wiki access, including guarded mutations. There is
no mapping of NPM usernames to browser users. Client credential headers must never
appear in logs, images, URLs or argv.

The installed Hermes header interpolation supports an existing secret reference
whose value is the complete pre-encoded `Basic ...` Authorization header. The
operator supplies that existing reference and HTTPS URL; this document creates
no live binding names. Use a verified CA/default trust, omit Origin, and configure
no browser cookie or backend bearer. No live Hermes configuration was inspected
or activated for this increment.

## Shared operations and verification limits

The same SDK schemas/dispatcher, body/response bounds, deadline, one unqueued active
request, safe paths, revisions, collision/recovery/index outcomes and guarded
operations apply. Status transport is `streamable_http_proxy`; storage identity
remains server-owned. Unknown/lost responses require authoritative read/inspection
before deliberate retry; no automatic replay or recovery loop is introduced.

The local ASGI proof uses the production app and real SDK messages with synthetic
socket peers. It is not an NPM/TLS or deployed-containment proof. The single
representative real fixture uses disposable Nginx1.28.3+Backstory over two internal
networks: verified frontend HTTPS/Basic, admitted initialize/list/status, missing
credentials401 with no actor dispatch, and frontend-only client unable to connect
to the unpublished backend. It does not repeat the retained operator edge-policy
campaign for bad credentials or outside-LAN clients.

Retained DUM-E disposable Nginx policy evidence establishes neither real Backstory
wiring nor live placement. Even a passing new fixture is not live NPM2.14.0
deployment, actual two-member bridge, verifier availability, wildcard trust or
live sign-in evidence. Those remain separately authorized operator checks before
activation. No standalone-image re-pull, production access, deployment, release
or shared configuration/credential change is authorized by this source candidate.
