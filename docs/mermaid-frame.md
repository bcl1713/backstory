# Mermaid renderer frame and bounded editor/preview integration

Issue #66's Mermaid stage is intentionally split. The infrastructure supplies a fixed
`GET /renderers/mermaid-frame/` shell, a reusable parent controller, a pinned local
renderer and security/compatibility fixtures. The live editor and server preview now use this controller for complete top-level
explicit fences when the request-specific origin check enables the feature.
Configuration still defaults to disabled; no production value or deployment is
supplied. See [the preview guide](preview.md#mermaid-diagrams) for source reveal,
viewport lifecycle, capacity/paused fallback and formatter-source integrity.

## Explicit opt-in configuration

`BACKSTORY_MERMAID_PARENT_ORIGIN` defaults to empty (disabled). It is one exact,
canonical application origin, **not** a CSRF allowlist or a host wildcard:

- HTTPS mode: e.g. `https://wiki.example`, optionally an explicit non-default port.
- Localhost-cookie mode: `http://127.0.0.1:8765`, `http://localhost:8765` or bracketed
  IPv6 loopback with an explicit non-default port. Default port 80 is rejected
  because browsers omit it from serialized origins.
- IP literals must use canonical dotted-decimal IPv4 or compressed lowercase
  IPv6. Browser-normalized shortened/integer/hex/octal IPv4, expanded IPv6 and
  invalid numeric-ending DNS spellings are rejected, not silently normalized.
- The exact hostname must already be in `BACKSTORY_ALLOWED_HOSTS`. No credentials,
  path, trailing slash, query, fragment, wildcard, noncanonical case/port spelling,
  or implicit localhost port. Default HTTPS port `:443` is likewise noncanonical.
- The shell request's actual validated scheme and host/port must equal this
  origin. Invalid configured values fail startup; absent/mismatched values give
  an ordinary denied 404. No production value is supplied by this change.

The base `compose.yaml`, standalone `compose.portainer.yaml` and self-contained
`compose.cloudflare.yaml` explicitly pass this variable into the web process with
an empty default. The host-data overlay inherits the base environment; Cloudflare
does **not** inherit it and carries its own mapping. All three distributed env
examples leave the optional value empty. To opt in, put the exact browser-facing
origin in the intended private Compose `.env` or Portainer's saved stack variables,
then use the normal approved stack-recreation/update process. Do not use the
internal service URL, copy the CSRF list, or change unrelated proxy/host trust.
See the [configuration reference](configuration.md#optional-mermaid-diagram-rendering).

Only a successful authenticated, active-session GET of the exact named view and
fixed response type receives the alternate headers. Query strings, non-GETs,
redirects, missing/revoked/expired/inactive sessions, invalid hosts/proxies,
exceptions and all other routes keep the existing policy. The middleware removes
Django's inner XFO header **only there**. The shell has `sandbox allow-scripts`,
nonce-only script execution, frame-local inline styles, the exact configured
`frame-ancestors`, and `none` for image/connect/font/media/object/worker/nested
frame requests. Parent/login/preview/attachment/CSRF/session policies are unchanged.

## Initial supported language and budgets

The application parser, not Mermaid's preprocessor, accepts a small positive
flowchart grammar, builds a bounded data model and reconstructs canonical input.
Only that string reaches Mermaid 12.2.0. It supports:

```text
flowchart LR
A[Start] --> B{Ready?}
B -->|Yes| C((Done))
B -.-> D(Retry)
```

`graph` or `flowchart`; directions TD/TB/BT/LR/RL; ordinary named nodes;
rectangles `[text]`, rounded `(text)`, circles `((text))`, diamonds `{text}`,
subroutine rectangles `[[text]]`; `-->`, `---`, `-.->`, `==>`; plain arrow labels
`|text|`; and chains of these edges. Statements are newline-separated (no
semicolon/comments). Labels may have optional surrounding double quotes and
contain Unicode letters/numbers, spaces and `.,!?_+-` only. A repeated node may
repeat its identical declaration, not redefine it. IDs are remapped to owned IDs.
A bare ID used before a different labeled declaration is intentionally unsupported.

Limits: 8,192 UTF-16 source units, 32 nodes, 48 edges, 80 label units, subgraph/depth
zero, two simultaneously live controllers, one render per frame, 250,000 output
units, 4,000 output elements, 20,000 output attributes and 16,000 text units.
Returned natural viewport dimensions are finite and bounded to 1,600 x 1,200 pixels.
Application-owned node-text centering and natural SVG/frame widths prevent
upscaling. Widths shrink to the available viewport; the frame aspect ratio and
resize measurement preserve fit when changing between desktop and mobile,
without rerendering or resending source. Wide and tall diagrams scale down proportionally within both bounds, keeping
the complete artwork visible without requiring an inner scrollbar. Very tall
diagrams consequently have smaller labels; split large graphs for readability.
Unsupported input fails before allocating a parent frame and again before draw
inside the child. There is no blacklist fallback to general Mermaid parsing.
Other engines, subgraphs, init directives/YAML, HTML/Markdown/resource labels,
images/icons, URLs, links/callbacks, source CSS/configuration/layout and embedded
math are unsupported and remain source. This is **not full Mermaid compatibility**.

Fixed trusted renderer settings use strict security, SVG text labels, system
Arial/sans-serif, fixed theme/dagre layout, conservative max text/edges, no error
rendering, no auto-render, and no `bindFunctions`. SVG never leaves the frame.
Final output is rebuilt through positive SVG element/attribute/owned-local-reference
checks. Finite bounded decimal geometry is canonicalized to at most eight fractional
places, so normal IEEE-754 layout precision is not mistaken for unsafe input.
Scalar/list length and spelling checks precede conversion; NaN, Infinity,
exponents and values beyond the fixed magnitude bound are rejected. The two
unconditional Mermaid 12.2 default drop-shadow definitions are omitted only after
matching their exact decorative subtree/attributes; filter machinery is not
allowed into final output, and references to omitted IDs remain invalid. Mermaid-returned CSS and data/inline-style attributes are discarded;
a small application-owned stylesheet supplies final presentation. No links,
foreignObject, images, scripts, event attributes, external references, filters,
animations or arbitrary HTML are copied. Exact typography/shape fidelity is a
browser release gate, not proven by Node tests.

## Channel and lifetime

`createMermaidFrame(container, source, {onStatus, onSize})` creates one iframe;
the caller must retain its handle and call `destroy()` on source/range/mode,
selection or document changes. It should only be invoked for eligible visible
inactive widgets. Source reveal/accessibility controls belong to the parent.
The returned `frame` is for sizing only, not DOM access.

The parent verifies concrete WindowProxy + opaque `null` origin + exact hello
shape and first-load state; the child verifies exact parent WindowProxy and
configured origin. A random 256-bit token accompanies a one-shot MessageChannel
transfer to that frame (the required `'*'` target never broadcasts source).
Only after the tokened ready on that private port does the parent send bounded
source, once. The global handshake listeners are removed. Replies contain only
fixed status and finite bounded dimensions; no SVG, HTML, URL, source or exception
text. Navigation/second loads/errors/unmount destroy the context; it never
reinitializes/resends source after navigation. The 10-second UX timer is **not**
a hard CPU deadline; shared renderer threads can block it.

## Reproducible local build

`scripts/build-mermaid-frame.mjs` checks Mermaid version **and SHA-256/exact dynamic
loader counts** for the four pinned upstream files. A documented build-time
transformation rejects all dynamic loaders except two exact flowchart loader
sites and the dagre loader. Those three imports are bundled by esbuild into one
classic IIFE with splitting disabled. Unreviewed loaders/source shapes fail the
build. Other engines, embedded KaTeX and external layout loaders are not available.
This is a packaging restriction, **not** the input-security boundary.

The content-hashed public asset is selected by a generated manifest with its
SHA-256, output/import counts and loader receipt. The build checks exactly one
output, no external imports, and no runtime import/importScripts/Worker/fetch/Wasm
signature. Tests parse it as a classic script and verify its digest/receipt.
No runtime modules, CDN, worker, font, icon pack or fallback fetch is required by
the accepted grammar. Dormant library DOM/resource-capable helpers may remain;
positive source validation and the scoped frame policy are the defenses.
Licenses are retained in the bundle and `static/licenses`. Authenticated shell
and public non-user-data bundle are intentionally separate; no CORS grant is
added to application endpoints and no authenticated resource import is used.

## Threat model and release gates

For positively validated syntax handled by the pinned trusted renderer, source
cannot choose destinations, scripts, configuration or navigation. CSP additionally
blocks the listed resource-fetch classes before transmission. **No general
network isolation against arbitrary compromised renderer JavaScript is claimed.**
A sandboxed frame can navigate itself; detecting/removing it does not prevent
that initial request. A script nonce authorizes execution, not an immutable URL
firewall. No hard CPU/memory isolation is claimed.

The local browser environment is independently known infrastructure-blocked;
this change must pass its production-like real-browser tests in CI before any
publication/integration is claimed safe. Tests capture requests before shell
load, check actual middleware/static headers, record synthetic server-side URL
receipts, check opaque DOM/storage denial, CSP success, unsupported-resource
rejection, frame-local SVG, navigation teardown and expired/missing auth.
Additional supported-browser, deployment CORP/COEP, mobile/source-navigation,
representative worst-case performance, and final integrated editor tests remain
required. Do not resolve a failed gate with allow-same-origin, wildcard/null CORS,
parent inline styles, unsafe-eval, a broad header exception, or remote fallbacks.
