# Issues 106 and 148 — creation and adapter evidence

Base: dev `5a99ee74bd5d2b5e6fdbd0914adefaad6e88d959`. Implementation in the
same commit as this record; exact merge gate and review live in the retained
candidate store. Only generated synthetic roots were mutated. The original
working checkout was left untouched apart from fetching remote refs.

## Focused checks

- New creation endpoint regression first failed with HTTP 404 (missing route):
  `/tmp/backstory-106-create-red.log`.
- `.venv/bin/python -m pytest tests/integration/test_tool_create.py tests/integration/test_tool_saves.py -q`
  initially passed 58 and failed two new test expectations: a test date provider
  incorrectly returned a date instead of ISO text, and recovery pause was
  expected as 503 rather than its existing 409. Corrected only those tests.
  `/tmp/backstory-106-create-green.log` (8.81s) retains 30 passing replacement-save
  checks, whose source and relevant inputs remained unchanged afterward.
- `.venv/bin/python -m pytest tests/integration/test_tool_create.py -q`:
  **30 passed**, 4.70s, `/tmp/backstory-106-create-green-r2.log`. Covers metadata,
  formatted authoritative readback and later revision save, malformed arguments,
  source byte bounds, safe paths/no-follow and existing parents, competing
  publication even with identical bytes, target appearing during formatting,
  two real concurrent clients, expired/revoked/disabled sessions, CSRF, unavailable
  and read-only storage, recovery pauses, formatter failure, delayed indexing
  and uncertain readback.
- `node --test tests/formatter/wiki-tools.test.mjs`: **1 passed**, ~0.05s;
  `/tmp/backstory-106-adapter-final.log`. Real adapter registration/execution with
  synthetic transport checks overlapping cross-path writes, no queued replay,
  create success/uncertainty, timezone use, consequential/read-only annotations
  and new snapshot registration. Node 22 does not support `--test-isolation=none`;
  that diagnostic command was not a passing check.
- Built only affected `static/wiki-tools.js` using the existing pinned esbuild:
  `node_modules/.bin/esbuild static/src/wiki-tools.js --bundle --minify --outfile=static/wiki-tools.js`.
- `BACKSTORY_BROWSER_RUNTIME=/tmp/backstory-106-148-browser BACKSTORY_BROWSER_PORT=19648 node_modules/.bin/playwright test tests/browser/wiki-tools.spec.js`:
  **19 passed**, 18.5s, `/tmp/backstory-106-browser-outer.log`. Real Chromium,
  HTTP, editor, formatter and storage with a controlled registration stub.
  Covers create/read/edit/collision, unchanged navigation and unrelated draft,
  matching new-editor draft rejection, shared busy guard, formatter absence,
  lost and malformed acknowledgements, plus existing replacement/folder/session
  behavior. Status/schema/runtime depth and snapshot registration are checked
  together. Screenshot: `/tmp/backstory-106-148-browser/create-preserved-draft.png`.
  The sandbox's first server attempt could not bind its loopback socket; the
  authorized external executor ran the successful scenario. This was an
  environment restriction, not an application failure.
- Graph/backend evidence: [the #148 audit](2026-11-08-webmcp-graph-audit.md),
  108 affected tests plus one strengthened all-three-operation regression.

Runtime selectors: `/tmp/backstory-128-runtime.sh`, Node 22.23.4, existing locked
Python environment, same installed dependency tree as the base checkout. Focused
checks total under two minutes. The actual proposed merge must pass the complete
release gate separately; this combined focused evidence is not a full-suite pass.

## Scope and limits

Creation reuses the existing exclusive publication service. Cooperative locks
coordinate application writers; final no-overwrite linking and descriptor-safe
parent checks cannot prevent an arbitrary external writer from later replacing a
note or an ancestor. Returned source/revision describe verified readback only.
No test disables backups, formatting, revision checks or recovery pauses.

#148's relocation, recoverable cleanup and history proposals were triaged against
existing services; they are not new mutation tools in this change. Graph snapshot
registration reuses the already implemented authorized endpoint.

Actual assistant-host discovery/invocation of the new tools and affected live
smoke tests remain pending deployment and an attached compatible browser host.
The available document-control connector supports office document surfaces, not
Backstory WebMCP. Registration stubs prove the adapter contract only. No private
live note was created, changed or deleted. Real creation acceptance needs a
disposable wiki or a verified reversible fixture lifecycle; publishing an image
is not deployment or actual-host acceptance.

## Required merge gate and concurrency fixture correction

The first proposed merge, `f8eca520fac6af53348950f61ddc780af568e493`, stopped
in Python: **1,678 passed, one failed** (161.19s). Its new threaded `Client`
concurrency fixture raced on `accounts_sessiondevice.last_seen_at` in Django's
shared-cache in-memory SQLite database, before reaching creation. It produced no
successful receipt and was neither approved nor landed. Logs remain under that
candidate's `evidence/python.log`; they are not transferable to another commit.

The correction changes only that fixture to two barrier-synchronized calls to the
real decorated creation endpoint using `RequestFactory`, an active real actor and
independent per-thread database connections, closed after each call. Writer locks,
formatting, publication and readback remain real. Dedicated `Client` tests retain
session revocation/expiry/disablement and CSRF coverage. No application guard,
SQLite setting or production middleware changed to accommodate the test.

Affected check after this correction:
`.venv/bin/python -m pytest -n 2 --dist loadfile tests/integration/test_tool_create.py -q`.
**30 passed**, 5.19s, `/tmp/backstory-106-concurrency-green.log`.
The corrected source requires a new exact merge candidate and full gate; unchanged
focused adapter/browser/graph results remain applicable and are not rerun.
