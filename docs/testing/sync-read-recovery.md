# External-read diagnosis and recovery (#23, #24)

Investigated `dev` at `cd2d78ac0206ade61682ba10958a40fe200c52a9`.
The public editor asset was identified, and owner-supplied authenticated response
metadata confirms the ETag comparison failure below. The full deployed image
revision remains unconfirmed. No live notes, proxy settings or deployments were
changed.

## Confirmed authenticated failure (2026-10-27)

The owner supplied a failing read response observed at 03:34:43 UTC. Only the
following nonprivate contract and transport facts are retained here:

- HTTP/2 200, `Content-Type: application/json`, `Cache-Control: no-store`.
- `Server: cloudflare`, `CF-Cache-Status: DYNAMIC`, `Content-Encoding: zstd`.
- JSON reports `state: ok`, `authoritative: true`, a string source, a strong
  quoted 64-hex application revision, boolean BOM and an allowed newline.
- The HTTP ETag is exactly `W/` followed by that strong JSON revision.

The served reader explicitly rejects `response.headers.get('ETag') !==
result.revision`. These observed values necessarily fail that equality check,
despite the valid authoritative response. This confirms #23's read-validation
failure; it is not a storage read failure. The existing synthetic weak-ETag
regression reproduces precisely this comparison with disposable content.

Cloudflare is confirmed on this authenticated request's path, and the compression
and weak-validator combination is consistent with its documented ETag behavior:
<https://developers.cloudflare.com/cache/reference/etag-headers/>. Without an
origin-side capture, these headers do not identify which hop changed the ETag.
No proxy adjustment is required by the application fix: the reader validates the
authoritative JSON contract and uses its strong revision for guarded writes.

Note contents, note identity, actual revision value, cookies, CSP nonces and
other private response details are deliberately excluded from this record.

## Public deployment observations (2026-10-27)

The owner supplied `https://backstory.hblucas.org` and described a path through
Cloudflare and/or Tailscale, then NGINX to the server. Read-only HTTPS probes
from this session observed:

- `/` redirects to `/accounts/login/`; the login response is 200 HTML.
- `Server: openresty` on the login, static editor and unauthenticated tools read.
- `/static/editor.js` is 540,265 decoded bytes, SHA-256
  `8586728a71c06ffbcc5209fec0190e69062df14799b04d192e2204955ab8c9ea`.
  These bytes match the committed editor asset at
  `5dae42e00c6ec30c4dba8c20e276fcd9141c00d5` (also present at merge `c4dfad5`),
  before the autosave merge. The public bundle still rejects reads whose HTTP
  ETag differs from the JSON revision. Its loaded recovery code also lacks the
  fixes on this branch.
- Both identity and gzip requests for that static asset return the same strong
  ETag, `"6adfb7e3-83e69"`, and identical decoded JavaScript. Both have
  `Cache-Control: no-store`. This is a static-asset observation, not proof that
  dynamic note-read ETags are preserved.
- `/tools/read/` without credentials returns 401 JSON. No authenticated note
  response was available. No live note path was requested.
- No `CF-Cache-Status` or `Via` header was observed. Their absence does not
  establish whether Cloudflare or Tailscale participates in this route.

The asset match identifies served browser code, not the running container's
full source revision. The image could be older or its collected static assets
could be stale. These public probes alone did not confirm the read failure;
the authenticated owner-supplied response above supplies that evidence.

## Reproduced defects

The original reader rejects valid `/tools/read/` JSON whenever the HTTP ETag is
missing, weak or different from the strong application revision. Synthetic
responses reproduce this without a failing storage read. The HTTP header is
transport metadata; the authenticated JSON contract supplies the authoritative
source and strict revision used for subsequent If-Match saves. The fix validates
state, authority, requested path, source type, strong revision, BOM and newline
individually. Empty source remains valid; null/malformed source fails safely.

Browser regressions also reproduce stale Needs attention after a valid same- or
newer-revision read. A separate read-attention value now clears on recovery;
operation failures retain their own pause. Resuming eligibility cancels pending
work. Recovery never starts a write; a later user edit or explicit Save is needed.

## Capture a deployed failure without private content

First identify the running container's `org.opencontainers.image.revision`
label and immutable image digest using the deployment operator's normal Docker
inspection. A mutable `:dev` tag or current GitHub branch does not establish
which source is deployed.

For a browser running this fix, attach the following listener in DevTools before
selecting **Check again**:

```js
document.addEventListener('backstory:sync-read-failure', event => {
  console.info('Backstory source-read check', event.detail);
});
```

The event includes status, a classified Content-Type, an allowlisted revision
ETag (or null/`other`), a reason, and contract-validity booleans when JSON parsing
succeeded. Reasons distinguish transport/body connection errors, HTTP status,
redirect, media type, invalid JSON and each rejected contract field. It excludes
paths, source, response bodies, arbitrary headers, credentials and exception text.
No persistent logging or console output is installed automatically.

On an older deployment, inspect only the failing read's HTTP status,
Content-Type and ETag in DevTools and record the validity of the JSON contract
fields, without copying source, paths, cookies, request headers or a HAR export.
Compare against a successful authoritative tools read. Reproduce with synthetic
notes under the same proxy conditions before attributing the live failure to
ETag rewriting. Other transport, authentication or malformed-response failures
remain possible.

## Regression coverage

- `tests/formatter/note-sync.test.mjs`: transport ETags, exact source, valid empty
  content, each malformed field, HTTP/JSON/network failures and safe diagnostics.
- `tests/browser/sync-recovery.spec.js`: repeated same/new revision recovery,
  typing during a read, clean/dirty status, merged drafts left unsaved, later
  autosave using the adopted strong revision, unrelated format/storage/auth/write
  pauses, protected draft storage during a read warning, real conflicts and
  stale-write rejection with a weak transport ETag.
- Existing note-sync, autosave, recovery and server save suites retain operation
  generation guards and strict conditional-write coverage.
