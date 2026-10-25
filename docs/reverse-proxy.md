# HTTPS through an existing reverse proxy

This is the generic contract for an operator-managed HTTPS frontend and a private
HTTP origin. The application has no proxy-vendor detection or proxy-provided
account login. Nginx Proxy Manager, Caddy and other proxies use the same settings.
Prepare the [existing wiki and fresh private data](setup.md#2b-start-with-an-existing-wiki)
first. This guide supplies configuration; it does not deploy or change your live
proxy, firewall or server.

**Follow-up status:** Compose rendering, focused backend checks, a generated
localhost TLS-proxy fixture and rebuilt-image acceptance passed. Combined
independent security review accepted the corrected source at `27d7b26`; see the
[release checklist](testing/release-checklist.md). Do not treat rendering as proof
that your existing proxy and origin restrictions meet this contract.

## Header and network contract

The TLS frontend must redirect or reject browser HTTP, preserve the approved
public `Host`, and **overwrite** `X-Forwarded-Proto` with the single value `https`
for requests sent to Backstory. Do not append a scheme chain or pass a client
supplied value. Backstory accepts that assertion only from an explicitly trusted
**actual TCP peer**, before applying its HTTPS and cookie behavior.

Restrict the private origin port so only the intended proxy can connect, using
network/firewall controls appropriate to the Docker endpoint. Binding a private
interface and whitelisting a peer in the app are separate requirements. Do not
publish the origin on every interface or trust `0.0.0.0/0`, `::/0`, or an entire
shared network merely to make it work. A peer allowlist alone does not encrypt
the proxy-to-origin hop; use a protected private network for this HTTP recipe.

Keep `BACKSTORY_PROXY_CLIENT_IP_HEADER=none` initially. Forwarded client addresses
are then ignored and the TCP peer is used conservatively for IP-based throttling.
If you explicitly select `x-real-ip` or `x-forwarded-for`, the trusted proxy must
overwrite that selected header with **one literal IPv4 or IPv6 address**, not an
appended list. Present empty, malformed or multi-address values are rejected;
an absent selected header retains the TCP peer. All clients can
share the proxy's IP bucket with `none`; account protections still apply.

Backstory does not trust `X-Forwarded-Host`, `Forwarded`, forwarded user/email or
Cloudflare Access identity as application authentication. Named app accounts,
CSRF tokens and the exact configured HTTPS origin remain required.

## Configure the installation in .env

Keep the storage, UID/GID, project, image and readonly values from setup. Replace
these security settings **together** with your approved hostname and deployment
addresses. The documentation IPs below are placeholders, not live targets:

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

`BACKSTORY_BIND_ADDRESS` is a local interface address on the **Docker endpoint**,
reachable by the proxy. Long-form Compose publication supports literal IPv4 or
IPv6 without bracket/port ambiguity. For a host-process proxy on the same host,
loopback can remain appropriate. A proxy in another container cannot reach the
host's loopback through its own `127.0.0.1`; use the verified private host interface
and route. A proxy on another Docker host needs a protected private route to that
interface. No new proxy service or shared-network topology is required by the app.

`BACKSTORY_TRUSTED_PROXY_IPS` contains comma-separated actual origin-side TCP peer
IPs or narrow CIDRs. Docker NAT can make the peer a bridge/gateway address rather
than the proxy's advertised address. Determine and verify the origin-side peer for
your route; do not infer it from a public hostname or a forwarded header. Use only
controlled peers; trusting a gateway shared by other callers makes network-level
origin restrictions especially necessary. Omitted peers/origins stay empty and
trusted-mode application startup rejects them.

Hosts are exact names, without a scheme, wildcard or leading-dot suffix. Origins
are exact HTTPS origins, without a path or trailing slash; include a nonstandard
public TLS port in the origin if used. Keep ordinary hostname resolution pointed
to the TLS frontend. The app uses the preserved `Host`, not a forwarded host.

Inspect and validate before starting or updating your installation:

```sh
docker compose config
docker compose run --rm web python manage.py check --deploy --fail-level WARNING
```

Then use the same first-time migrate/account commands from setup and ordinary
`docker compose up -d --build`. Portainer uses the same values through its stack
environment form. Do not reuse a localhost-only image for a new runtime feature;
build the reviewed current source on the selected endpoint.

## Optional frontend examples

These examples illustrate the header contract; validate the effective existing
proxy configuration and network route before applying it. Neither proxy was
changed or deployed for this documentation.

For Caddy terminating TLS directly, an HTTPS site proxying to the private HTTP
origin can use:

```caddyfile
wiki.example.test {
    reverse_proxy http://192.0.2.10:8000
}
```

Caddy's HTTP-upstream defaults preserve `Host` and set `X-Forwarded-Proto`; see its
[reverse_proxy documentation](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy#defaults).
Use your real approved hostname, certificate arrangement and private route.
Additional upstream proxies/CDNs need their own reviewed trust configuration.
Leave Backstory's client-IP header at `none` unless you explicitly arrange the
single-address overwrite contract above.

For Nginx Proxy Manager, choose the exact public domain, the private origin
address/port and HTTP forwarding; configure its TLS certificate and force HTTPS.
Inspect the generated effective nginx configuration for that Proxy Host. The
[NPM v2.16.0 proxy include](https://github.com/NginxProxyManager/nginx-proxy-manager/blob/v2.16.0/docker/rootfs/etc/nginx/conf.d/include/proxy.conf)
preserves the host, derives forwarded scheme from nginx variables and appends
`X-Forwarded-For`. The product name alone does not prove that client-supplied
scheme headers are overwritten. Verify the actual `X-Forwarded-Proto` mapping,
custom snippets and upstream chain; meet the single-HTTPS contract rather than
blindly adding duplicate `proxy_set_header` directives. Keep Backstory's client-IP
header `none` with an appended forwarded-for chain.

## Verify through the real boundary

Open the approved HTTPS login URL, create/use the named accounts through the
interactive terminal workflow, and verify login, note open/save, CSRF rejection,
Secure cookies, restart persistence and unavailable-storage behavior using a
rehearsal installation. Check that an untrusted origin connection is refused,
including forged forwarding headers. Confirm actual network controls separately.
Use disposable notes; leave the marker and private auth files untouched.

The peer/header guard also covers `/health/`. Probe it through the actual TLS
proxy and canonical hostname. An origin-side diagnostic is accepted only from an
explicitly trusted peer with the canonical `Host` and exact `X-Forwarded-Proto:
https`; it is not a health-route bypass. `/health/` proves process health only;
authenticated Storage status reports marker readiness and indexing separately.
