# Backstory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or, if the owner explicitly chooses delegation, superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This document does not authorize execution.

**Goal:** Deliver a local, self-hosted browser and source editor for an existing shared Markdown directory, preserving files while supporting named users and external editors.

**Architecture:** Django renders pages and protects all content; CodeMirror keeps Markdown text authoritative and applies source-preserving inline live-preview decorations, with a raw-source toggle. The existing separate safe renderer remains a secondary preview option. Files remain authoritative, SQLite stores local application state and rebuildable FTS5 projections, and one background worker performs bounded maintenance. A packaged Node helper formats only a staged note; Docker Compose ultimately supervises web and worker in one service.

**Tech Stack:** Django 5.2 LTS, a supported Python release, SQLite FTS5/WAL, CodeMirror 6, CommonMark/GFM rendering, safe YAML projection, pinned Prettier and markdownlint-cli2 on a compatible supported Node LTS, pytest/Django and Playwright.

**Spec:** [Authoritative design](../specs/2026-10-25-backstory-design.md), repository baseline `b28f943b5dfab395d811d85f08dfe5dedd8ec70d`.

**Status:** Implementation authorized; Tasks 1–12 are implemented on `feat/backstory-release-one`; the original Stage 4 review was accepted at `71ced19`. The subsequent environment/UID/private-host-data, generic trusted HTTPS proxy and optional tunnel follow-up passed combined independent review at `27d7b26` and synthetic corrected-image acceptance. Exact verification identities and unavailable deployment checks are recorded in `docs/testing/release-checklist.md`. The original planning baseline is `5dabb69`; the repository ancestor above remains historical context. The owner's subsequent direction supersedes the earlier source editor plus separate preview as the primary UI; useful read/preview and backend code is retained. This revision grants no deployment, live-storage or merge authority.

**Editor revision:** Tasks **5** and **11** change substantially; Tasks **6**, **8**, **10** and **12** gain mode-fidelity/integration evidence. Tasks 1–4 and the storage/authentication/safe-save backend contracts are retained. Task 5 first proves a small inline slice, then expands UI integration; independent safe-save backend work may proceed in parallel with that slice under separate file ownership.

## Global constraints

- Preserve existing paths and Markdown as the source of truth; other tools may edit files.
- `BACKSTORY_WIKI_ROOT`: never create a replacement root. `BACKSTORY_DATA_DIR`: separate local persistent storage; reject overlapping roots. SQLite must not reside on NFS.
- Verify the intended storage using an existing stable, non-secret file and an expected SHA-256 configured outside the wiki. Directory existence is insufficient. No automatic enrollment or hash reset.
- Default note limit is **2 MiB**. Preserve UTF-8 bytes, optional BOM and newline handling; never truncate an editable file or serialize a metadata projection into it.
- Normal saves honor optional `.prettierrc` and `.markdownlint-cli2.jsonc`, applicable ignores, safe nested config and approved data-only references. Never modify config files or execute wiki-provided code.
- Absent-config defaults: Prettier `printWidth: 80`, `proseWrap: always`, `endOfLine: auto`; markdownlint default rules with MD013 disabled.
- **Save source without formatting** is explicit recovery after formatting failure. It skips transformations only; all authorization, CSRF, path, size, readiness, revision, conflict, backup and safe-write checks remain mandatory.
- All content, preview, attachments, discovery, status, history and recovery require authentication. Named users share read/create/edit access; use a separately revocable ordinary assistant account. Administration is CLI-only in release one.
- Release one uses inline live preview over authoritative Markdown text, with a raw-source toggle and plain-text fallback. No rich-text/HTML round trips, WYSIWYG feature parity, delete/rename/bulk operations, upload, graph UI, CRDT, MCP, whole-wiki browser synchronization/index/cache or backlink work on note opening. Optional backlinks are explicit server-side requests only; their UI remains deferrable.
- Pin exact dependencies and commit lockfiles during implementation. No Redis, external database, mandatory cloud service/CDN or frontend framework. One application Compose service, localhost only by default, non-root runtime, production web server. The owner's later first-class Tunnel request permits an optional pinned `cloudflared` connector; existing connectors and ordinary HTTPS proxies need no extra application service.
- Indexing defaults: incremental scan every **five minutes**, daily rolling verification, maintenance batches up to **20 files**, **one second** yield between batches, watchers disabled by default. Saves queue only the changed note.
- Search defaults: page **30**, maximum **100**, query **256 characters**, **16 terms**; bounded snippets and SQLite execution work. Lazy folder pages, no recursive browser payloads.
- Session defaults: ordinary idle **12 hours**, absolute **24 hours**; remembered idle **14 days**, absolute **90 days**. HttpOnly, SameSite=Lax, Secure in HTTPS mode. Production rejects insecure configuration.
- Revisions/drafts: proposed **30 days**, configurable protected storage quota; never evict required backup data silently to make a save appear successful.
- Synthetic fixtures only: roughly 1,000 notes, exactly 299 dailies, varied YAML/Markdown and a roughly 699 KB note. Never use private notes or authentication files as fixtures.
- No latency targets, percentile gates, benchmark suites or optimization milestones. Exercise ordinary workflows and fix obvious hangs; retain correctness, security and preservation tests.
- Do not touch live wiki files, mounts, permissions, SilverBullet, Syncthing or Cloudflare. No production deployment or service exposure. No Neovim configuration or verification. Keep credentials and private content out of docs, logs and chat.

## Review focus

These implied input cases receive explicit tests in the owning tasks:

1. Encoded `#`, `%`, spaces and Unicode filenames: decode once, preserve spelling and avoid resolving a different note (Tasks 2, 8).
2. Mixed newlines, BOM and a final line without a newline: retain source on recovery and make any normal formatting diff visible (Tasks 4, 5).
3. Folder mutation between cursor pages: bounded navigation without leaking newly excluded paths or looping indefinitely (Tasks 2, 8).
4. Config references that cycle or change while formatting: bounded data loading, diagnostics and no transformed write based on inconsistent config (Task 4).
5. Presentation-only live/source toggles, selections spanning decorations, undo across mode changes and unsupported syntax: source/bytes/history remain intact (Tasks 5, 6, 10–11).
6. Crash after disk replacement but before index enqueue: disk remains authoritative; reopening establishes the revision and maintenance repairs discovery without replaying a save (Tasks 5, 7, 10).

## Repository findings and planning assumptions

At the baseline, the repository contains only `README.md` and the full design; no applicable `AGENTS.md`, application, dependency manifests or test infrastructure were found. Keep the design unchanged. This plan is one staged document because storage, saving and discovery share one application and preservation contract; each delivery stage has its own runnable review gate.

The design references a supplied directory structure but neither tracked document lists the folder names. Use the following explicitly synthetic layout; this is a fixture assumption, never a migration rule for the real wiki:

```text
wiki/
  Home.md                         # synthetic identity; excluded from ordinary editing tests
  notes/                          # 300 notes
  projects/active/                 # 150 notes
  projects/archive/                # 100 notes
  reference/                      # 100 notes, including Large.md
  templates/                      # 50 notes
  daily/YYYY/                     # exactly 299 date-named notes
  attachments/                    # generated inert raster/PDF samples, outside note count
```

This totals 1,000 authorized Markdown notes including `Home.md`. Small Stage 1 fixtures use the same folders and selected cases. The representative fixture sets `reference/Large.md` to 699,000 UTF-8 bytes, records counts/hashes in a manifest outside the wiki, and generates all prose and binary samples from deterministic public test strings. Adversarial path tests use inert temporary files; authentication/sensitive filenames are policy input strings, never copied or populated authentication files. Fixture generation refuses an existing/nonempty destination and operates only in a caller-supplied disposable workspace.

Implementation defaults chosen here: folder pages 100 entries; snippets 240 characters; bounded search candidate examination 300 per page; maximum 10,000 coalesced note jobs before falling back to a pending reconciliation flag. Use a configurable 10-second formatter subprocess limit, 8 MiB output cap and 200 diagnostics, independent of latency claims. Configuration reads: 64 KiB/file, 32 approved files and reference depth 8; identity file: 64 KiB maximum. Treat these as resource/security caps, with actionable errors and tests. Do not silently drop edits or jobs on overflow.

Choose maintained compatible versions at implementation time and verify their official APIs then; no package versions beyond the agreed Django line are asserted here. Use `uv` with `pyproject.toml`/`uv.lock`, npm with `package.json`/`package-lock.json`, bundled assets via esbuild, Gunicorn for production HTTP, `markdown-it-py` plus `mdit-py-plugins`, `nh3`, PyYAML with a restricted node loader, Argon2 and `django-axes`. No YAML object construction, dynamic modules or external resource fetches from documents.

## Component and file map

All paths below are future files unless identified as existing. Keep these boundaries; avoid a generic repository abstraction over ordinary filesystem operations.

| Files | Responsibility |
| --- | --- |
| `pyproject.toml`, `uv.lock`, `package.json`, `package-lock.json`, `manage.py`, `.gitignore` | Locked runtime/build/test dependencies and generated-file exclusions |
| `backstory/{settings,urls,wsgi,checks}.py` | Local/production configuration, routing, runtime checks |
| `accounts/{models,middleware,views,urls}.py`, `accounts/management/commands/{create_account,revoke_sessions}.py`, migrations | Named accounts, device sessions, login/logout and CLI administration |
| `wiki/contracts.py`, `policy.py`, `storage.py`, `readiness.py` | Shared result types, exclusions, no-follow directory-relative I/O, storage identity |
| `wiki/formatting.py`, `formatter/{config,pipeline,main}.mjs` | Bounded subprocess protocol, approved config snapshots and fixed-point formatting |
| `wiki/{saves,revisions,models}.py`, migrations | Conflict-safe save orchestration, locks, bounded protected recovery/history |
| `wiki/metadata.py`, `markdown.py`, `links.py`, `attachments.py` | Read-only metadata projection, sanitized rendering, link resolution and safe delivery |
| `wiki/{views,urls}.py`, `wiki/templates/wiki/{shell,note,conflict,status}.html` | Authenticated HTTP interfaces and server-rendered application |
| `templates/{base,registration/login}.html`, `static/src/{editor,live-preview,navigation}.js`, `static/src/app.css`, `scripts/build-assets.mjs` | Authoritative CodeMirror text, presentation-only inline decorations/source toggle, textarea fallback, secondary safe preview, dirty-state handling and responsive UI |
| `indexing/{models,schema,queue,scanner,worker,search}.py`, migrations, `indexing/management/commands/run_indexer.py` | Persistent jobs, relational/FTS generations, scans, bounded search and status |
| `tests/{conftest.py,fixtures/generate.py,unit/,integration/,browser/}` | Disposable synthetic fixtures and workflow tests |
| `Dockerfile`, `.dockerignore`, `compose.yaml`, `.env.example`, `docker/{entrypoint.sh,supervise.py}` | Local package, persistent data, non-root web/worker lifecycle |
| `wiki/management/commands/{storage_status,backup_data,prune_recovery}.py` | Readiness diagnosis, consistent application backup and bounded retention |
| `README.md` (existing), `docs/{development,operations,limitations}.md`, `docs/testing/release-checklist.md`, `.github/workflows/ci.yml` | Runnable instructions, restore procedure and correctness evidence |

Python packages also need their `__init__.py`, Django app configuration and migrations in the task introducing them. Tests live beside the relevant named test file below, not in production modules. App storage contains SQLite, generated secret material, revisions/drafts, locks and formatter scratch space. Only reserved transient siblings may be created inside the disposable wiki during save.

## Delivery order and verification conventions

Execute Tasks 1–12 in order. Dependencies are explicit below; later tasks extend earlier acceptance rather than postponing their safety requirements. Each task is one reviewable commit after its focused checks pass. Start behavior changes by writing the listed assertions, run the focused command to confirm failure, implement, then rerun to green. Commit only the named source/tests/docs for that task, never generated fixtures, application volumes or secrets. Commands below are planned commands, not evidence of tests already executed.

Use `uv run pytest <paths>` for Python tests, `npm run test:formatter` for real packaged Node helper tests and `npm run test:browser -- <file>` for Playwright tests. Define those npm scripts in Task 1. Browser tests start only localhost disposable instances with temporary wiki/data roots and synthetic accounts. Configuration, migrations and documentation checks accompany the task that needs them; do not create tests that merely duplicate implementation.

Task 1 necessarily creates the test/runtime bootstrap before its first executable red run; thereafter confirm a behavioral assertion fails rather than accepting a missing dependency as evidence. Declare shared result records in `wiki/contracts.py` as they are introduced. Node tests use the built-in test runner; Playwright settings live in `playwright.config.js` and the disposable-server lifecycle helper in `tests/browser/support/server.js`, created with the first browser workflow in Task 5.

## Stage 1 — Foundation and working local vertical slice

Deliver login → lazy browse → open → inline live preview/raw source → Format/Save/create → reopen, with storage identity, formatting recovery and conflict protection included. Search/indexed aliases may show “index not yet available”; exact disk-path links work. This stage must already run locally, even though discovery and operational polish follow.

### Task 1: Local runtime, synthetic storage and interactive accounts

**Depends on:** baseline only.

**Files:** Create dependency/build manifests, `manage.py`, `backstory/{settings,urls,wsgi,checks}.py`, `accounts/{views,urls}.py`, `accounts/management/commands/create_account.py`, `templates/registration/login.html`, `tests/fixtures/generate.py`, `tests/conftest.py`, `tests/integration/test_bootstrap.py`, initial `Dockerfile`, `.dockerignore`, `compose.yaml`, `.env.example`, `.gitignore`, `scripts/build-assets.mjs`, `docs/development.md`. Modify `README.md` when the local command works.

**Interfaces:** `generate_fixture(destination: Path, profile: Literal['small','representative']) -> FixtureManifest` writes synthetic files and outside-wiki manifest/config; `create_account` prompts for username/password with hidden password input. Configuration supplies wiki/data roots and identity relative path/hash from outside the wiki. Django's user/session tables are application state.

- [ ] Write `test_fixture_refuses_existing_destination`, `test_roots_must_not_overlap` and `test_account_bootstrap_login_logout`: no wiki fallback directory; accounts created interactively, hashed with Argon2; generic failed login; protected shell redirects anonymous visitors; CSRF required for login/logout; logout invalidates the session.
- [ ] Run `uv run pytest tests/integration/test_bootstrap.py`; confirm missing configuration/runtime behavior fails before implementation.
- [ ] Add the smallest Django runtime, locked Python/npm dependencies and bundled local assets. Validate FTS5 availability. Persist generated application secret with create-if-absent behavior in data storage; never print it. Separate explicit localhost cookie mode from fail-closed HTTPS production settings. No default accounts, password CLI arguments, self-registration or note caches.
- [ ] Add initial localhost Compose web workflow with a non-root Gunicorn process, named local data volume, explicit disposable wiki bind and `create_host_path: false`. Initially web-only; Task 7 adds the real worker/supervisor. Exclude fixtures/data/secrets from the image build context. Document interactive account creation and fixture generation; no private mount paths or secret values in examples.
- [ ] Rerun the bootstrap tests, `uv run python manage.py check` and `docker compose config --quiet` using disposable configuration. Confirm login works after restart and no files were created in an absent wiki root. Record exact commands/results in the task review.
- [ ] Commit as `feat: add local runtime and interactive accounts`.

**Acceptance:** A reviewer can generate a disposable small wiki, start the localhost application and sign in with an interactively created account. Roots are distinct, secrets persist outside the wiki, and absent wiki storage is never initialized by the application.

### Task 2: Storage identity, confinement and lazy direct reads

**Depends on:** Task 1.

**Files:** Create `wiki/{contracts,policy,storage,readiness,views,urls}.py`, `wiki/management/commands/storage_status.py`, `wiki/templates/wiki/{shell,note,status}.html`, `tests/unit/test_policy.py`, `tests/integration/{test_storage,test_browsing}.py`; modify routing/checks.

**Interfaces:** `check_readiness() -> Readiness(state, reason_code, checked_at)`; `read_note(path: str) -> NoteSnapshot(path, source, raw_bytes, revision, bom, newline)`; `list_folder(path: str, cursor: str | None, limit: int = 100) -> FolderPage`; centralized `authorize_content(request, path)` and `validate_path(path, purpose)` apply to every later route. Revision is a quoted SHA-256 ETag of exact bytes. Readiness diagnostics expose reason codes, not private filesystem paths.

- [ ] Write assertions for `test_identity_is_not_directory_existence`, `test_identity_hash_and_size_cap`, `test_no_follow_each_component`, `test_decode_once`, `test_folder_pages_are_bounded` and `test_utf8_read_is_lossless`: missing/mismatched/unreadable identity fails; in-root and escaping symlinks/special files fail; `%`, `#`, Unicode and malformed encoding are distinguished; BOM/CRLF bytes hash correctly; oversize/invalid UTF-8 gives a diagnostic, never truncated source.
- [ ] Run `uv run pytest tests/unit/test_policy.py tests/integration/test_storage.py tests/integration/test_browsing.py`; confirm failures for missing behavior.
- [ ] Implement directory-relative Linux no-follow operations with regular-file checks, bounded reads and shared exclusion policy. Deny hidden components, documented sensitive names, dependency/sync/backup/agent directories, configured exclusions and reserved `.backstory-tmp-*` siblings. Test sensitive names as strings without creating authentication files. Check identity at startup and before wiki reads, including attachments/listings; missing wiki leaves login/status available. Reject overlap after canonicalizing roots. Readiness checks never open a file for writing or automatically repair configuration.
- [ ] Add authenticated folder/source/status endpoints and one-directory enumeration with bounded pages and a local directory cursor/cache. Cache entries include directory fingerprint and policy version; mutation invalidates the cursor and requests a restart rather than looping. No recursive request or per-note parsing/formatting/index wait. Authenticated responses use `Cache-Control: no-store`.
- [ ] Rerun the focused tests; mutate a folder between pages, replace a parent with a symlink and substitute an existing empty root in disposable storage. Verify zero unauthorized bytes and a useful unavailable-storage state.
- [ ] Commit as `feat: add confined storage and lazy note reads`.

**Acceptance:** Opening a note reads bounded disk bytes directly. Intended storage is verified; existence alone never enables content access or writes. One folder request cannot enumerate descendants or return hidden configuration.

### Task 3: Independent safe preview and attachment delivery

**Depends on:** Task 2.

**Files:** Create `wiki/{markdown,links,attachments}.py`, `tests/unit/test_markdown.py`, `tests/integration/{test_preview,test_attachments}.py`; modify wiki views/URLs/templates and response headers.

**Interfaces:** `render_preview(source: str, source_path: str) -> Preview(html, diagnostics)` never writes; `resolve_link(source_path: str, target: str, kind: Literal['markdown','wiki']) -> LinkResult(state, href, label)` initially supports policy-checked disk paths; `serve_attachment(request, path)` streams an authorized bounded response. Task 8 adds indexed fallback without changing these interfaces.

- [ ] Add tests showing raw `<script>`, event handlers, SVG, unsafe schemes and malicious labels cannot execute; escaped code remains code; relative `../` inside root resolves; outside-root links fail without disclosing targets; external embedded images produce placeholders and no network requests. Missing assets do not hide source. Preview does not change any wiki bytes.
- [ ] Run `uv run pytest tests/unit/test_markdown.py tests/integration/test_preview.py tests/integration/test_attachments.py` to see failures.
- [ ] Implement CommonMark/GFM rendering with raw HTML disabled, sanitizer allowlist and restrictive CSP using bundled scripts/styles. Parse links using syntax tokens, never regex across code. Set raster/PDF types plus `nosniff`; active/unknown types download as octet-stream. Bound range requests to one range and configured stream size; reject malformed/multi-range requests. No arbitrary external fetch endpoint.
- [ ] Rerun tests with anonymous attachment/preview attempts, malformed ranges, synthetic raster/PDF samples and active-type download headers. Verify preview remains independent of the editor/save representation.
- [ ] Commit as `feat: add safe preview and attachments`.

**Acceptance:** Authenticated source can always be viewed despite malformed Markdown; preview and attachments cannot execute wiki HTML or silently load external images.

### Task 4: Packaged formatting with safe optional configuration

**Depends on:** Tasks 2–3.

**Files:** Create `wiki/{formatting,metadata}.py`, `formatter/{config,pipeline,main}.mjs`, `tests/formatter/{pipeline,config}.test.mjs`, `tests/integration/test_formatting.py`; modify manifests/lockfiles and preview/format endpoint. Task 6 extends the initial front-matter comparator into the index projection.

**Interfaces:** `format_source(path: str, source: str, original: NoteSnapshot | None) -> FormatResult(source, diagnostics, diff, outcome, config_digest)` where outcome is `ok`, `skipped` or `failed`. Python spawns fixed packaged Node entrypoint with argv and bounded JSON stdin/stdout, no shell. `compare_preservation(before: str, after: str) -> list[Diagnostic]` compares typed front-matter meaning/scalar tags and parsed link destinations. Formatting failures return diagnostics and the untouched submitted source.

- [ ] Write real-helper tests: absent/default and present configs; safe nested overrides/references; `.prettierignore`, configured gitignore behavior, markdownlint ignores and `.editorconfig`; ignored notes stay editable; exact second pipeline output equals first. Assert YAML unknown keys/nesting/types and link destinations survive, warnings alone permit saving, malformed YAML or nonconvergence yields failure, and opening/preview never invokes formatting.
- [ ] Run `npm run test:formatter` and `uv run pytest tests/integration/test_formatting.py`; confirm failures before implementing helper behavior.
- [ ] Implement a dedicated data-only config reader through confined regular-file opens. Snapshot only approved config/ignore ancestry and reference graph into private scratch storage, retaining original relative note paths. Permit JSON/JSONC/YAML and EditorConfig data in the supported documented subset; safe references stay inside the wiki and terminate within caps. Reject JS/module configs, plugins/custom rules, package/module references, unauthorized paths, reference cycles and unknown executable directives. Never load wiki `package.json`, run a shell, or let CLI root globs enumerate notes. Config remains unavailable to content routes.
- [ ] Run Prettier → supported markdownlint-cli2 fixes → Prettier → diagnostics, then run the identical pipeline once more and require byte equality. Resolve configuration explicitly from the approved snapshot; disable implicit module/config discovery and pass only the staged note. Apply each tool's ignores independently. Bound subprocess/resources, clean scratch files and expose exact failure diagnostics/diff. Use the bounded restricted YAML node comparison from Task 6 already in this slice; Task 6 expands its corpus/projection. Revalidate config digests before accepting output; changed configs fail formatting and offer source recovery.
- [ ] Rerun real-helper tests including timeout/output overflow, unsafe config, changed config during a paused helper, BOM, uniform LF/CRLF, mixed newlines and a missing final newline. Existing files retain BOM; source recovery preserves submitted source/newline sequence; normal formatting may normalize line endings according to approved config and shows its diff. Never claim byte-for-byte normal formatting preservation.
- [ ] Commit as `feat: add bounded formatting and preservation checks`.

**Acceptance:** Normal formatting honors optional configs and ignores without executing wiki code. Accepted outputs are a fixed point; preservation conflicts keep source and diagnostics without writing. No transformed pipeline processes a second wiki note.

### Task 5: Inline editor slice, conflict-safe save/create and working vertical slice

**Depends on:** Tasks 1–4.

**Files:** Create `wiki/{saves,revisions,models}.py`, migrations, `static/src/{editor,live-preview,navigation}.js`, `static/src/app.css`, `templates/base.html`, `wiki/templates/wiki/conflict.html`, `tests/integration/test_saves.py`, `tests/browser/{live-preview-slice,vertical-slice}.spec.js`, `playwright.config.js`, `tests/browser/support/server.js`, `docs/limitations.md`; modify note/format views/templates/build assets.

**Interfaces:** `save_note(actor, path: str, submitted_source: str, base_revision: str | None, mode: Literal['formatted','source_recovery'], recovery_token: str | None = None) -> SaveResult(state, source, revision, diagnostics)`; create requires `If-None-Match: *`, edit requires `If-Match`. Format failure issues a bounded server-side recovery record binding actor/path/base/source digest/diagnostics; source recovery requires explicit action and that record. Missing precondition is 428, conflict 412, formatting failure 422, unsafe input 4xx and storage failure 503. An index warning is a successful save with delayed-index status.

**Editor interfaces:** `mountMarkdownEditor({parent, source, newline, onChange}) -> {getSource(), setSource(source), setMode('live'|'source'), focus(), destroy()}` wraps one CodeMirror document. `createLivePreviewExtension()` produces only view decorations; mode/selection changes never modify text or call `onChange`. Mode reconfiguration preserves selection/history. `getSource()` retains the exact original submitted string until a real edit/explicit Format changes it; mode changes cannot normalize untouched mixed newlines. Source fallback uses the same save payload and controls. Keep server preview available secondarily.

**5a — demonstrate before expanding UI:** Add a small authenticated synthetic-note slice containing front matter, emphasis/headings, wikilinks/aliases/fragments, relative links, a table, code fences and unfamiliar syntax. Keep front matter/table/fences as visible styled source initially; decorate only syntax that can be handled predictably. Labeled Live preview/Raw source controls must use the same document and undo history. Record a screenshot or short browser demonstration plus actual assertions before expanding widgets or the full editing layout. Backend safe-save implementation/tests may proceed independently in parallel, but do not expand the UI until these assertions pass.

- [ ] Add `live-preview-slice.spec.js` first: live/source toggles, opening/repeated toggles and cursor movement leave exact source, disk bytes, ETag and mtime unchanged and never call Format/Save. Assert active syntax reveal, selected/cross-block source reveal, selection anchors, edits and undo/redo across toggles, unsupported syntax still editable, front matter/table/code fence preservation, inert unsafe HTML/external images and keyboard/touch/source fallback.
- [ ] Run `npm run test:browser -- tests/browser/live-preview-slice.spec.js` to observe missing behavior. Build a small CodeMirror Markdown syntax-tree decoration extension. Use inert/escaped DOM only, no HTML-to-Markdown editor or added service. Default to live mode; inactive basic syntax may be styled/hidden while active blocks reveal raw syntax. Ordinary clicks place the cursor; link activation is deliberate and policy-checked. Confirm the synthetic slice and record evidence before continuing UI expansion.

**5b — integrate the existing save contracts:**

- [ ] Write `test_two_editors_get_412`, `test_create_never_overwrites`, `test_noop_preserves_mtime`, `test_failure_requires_explicit_source_recovery`, `test_recovery_keeps_original_base`, `test_backup_failure_refuses_write` and `test_uncertain_replace_rereads_disk`. Compare exact bytes/revisions and assert diagnostics remain visible; source recovery never runs the formatter or refreshes ETag silently.
- [ ] Run `uv run pytest tests/integration/test_saves.py`; confirm failure. Add `vertical-slice.spec.js` for login/open/edit/Format/Save/reopen, create, two browser contexts and formatting-failure recovery.
- [ ] Implement the shared write path: policy/size/readiness/auth checks → cross-process per-path lock in app storage → read/hash base → stage formatting or explicit source → required original/submitted recovery storage → reserved same-directory temporary write/fsync → final readiness and fresh disk hash immediately before replacement → replace and directory sync. Use exclusive hard-link publication of the temporary regular file for create-if-absent; if filesystem support is unavailable, refuse create with an actionable error, never fall back to overwriting. Preserve existing basic mode. Verify no-op bytes after fresh checks and skip redundant history/mtime changes. Do not automatically create parent folders.
- [ ] Keep original/submitted recovery versions bounded outside the wiki before a changed write. On uncertain replacement, re-read disk before classifying the result; report saved/current/conflict/uncertain honestly and never replay automatically. Add `enqueue_note(path, revision)` integration boundary; until Task 7 installs the queue, indicate discovery unavailable without failing a disk save.
- [ ] Integrate the demonstrated inline-live-preview editor, labeled Raw source toggle, textarea fallback, optional secondary safe preview, visible Save/Format/create controls, Ctrl/Cmd+S and polite status states. Decorations and mode changes never mark dirty or mutate source/selection/history. Front matter remains verbatim accessible source, without a metadata form. Retain source/diagnostics on failure, source-save label after recovery, copy/download draft, dirty navigation/unload/logout guards and in-place reauthentication without losing editor memory. No localStorage/IndexedDB/service worker. New notes default to UTF-8 without BOM and LF; edits retain established BOM.
- [ ] Rerun save tests and `npm run test:browser -- tests/browser/live-preview-slice.spec.js tests/browser/vertical-slice.spec.js`. Exercise explicit Format/Save/create, ignored/no-op bytes, two-editor 412, failed-format source recovery and readiness failure in both live and raw-source modes; identical submitted source must produce identical backend outcomes. Verify undo after accepted Format and toggles never introduces decoration text into the payload. Inspect a disposable wiki for only intended notes after success/failure and verify restart can reopen the saved bytes. Record current inode/ACL/ownership/xattr and external-writer limitations in `docs/limitations.md`.
- [ ] Keep the demonstrated slice and integrated save work reviewable, with commits `feat: demonstrate source-preserving inline preview` and `feat: complete inline editing and safe saves` (independent backend work may have its own scoped commit).

**Stage 1 acceptance:** The small inline slice is demonstrated before UI expansion, with no-edit byte/selection/undo evidence. A reviewer runs the documented localhost walkthrough in both live and raw-source modes, including two-editor 412, no-op save, explicit failed-format source recovery and a readiness failure that retains edits. Reopening reflects actual disk bytes. No index or full-tree request is required to open/save a known note. This is the first complete working slice.

## Stage 2 — Preservation and indexed discovery

### Task 6: Representative corpus, typed metadata and syntax-aware edges

**Depends on:** Task 5.

**Files:** Extend `tests/fixtures/generate.py`, `wiki/{metadata,markdown,links}.py`; create `tests/unit/{test_metadata,test_links}.py`, `tests/integration/test_preservation_corpus.py`; extend real-helper tests.

**Interfaces:** `project_note(snapshot: NoteSnapshot) -> NoteProjection(path, revision, title, ids, aliases, tags, typed_metadata, edges, diagnostics)`; `extract_links(source: str) -> list[LinkEdge(target, kind, fragment, position)]`. Projections never supply saved bytes. Keep canonical typed metadata comparison in `compare_preservation` from Task 4.

- [ ] Write fixture/count/byte assertions for exactly 1,000 notes, 299 dailies and the 699,000-byte note, with varied nested YAML, unknown keys, string/boolean/numeric/null values, quoted date-like text, Unicode, tables, task/nested lists, code, wikilinks, duplicate IDs/aliases and missing attachments. Assert formatting is idempotent with/without config, accepted transformations preserve typed meaning/links, failures recover exact submitted source and diagnostics.
- [ ] Run `uv run pytest tests/unit/test_metadata.py tests/unit/test_links.py tests/integration/test_preservation_corpus.py` and `npm run test:formatter` before extending behavior.
- [ ] Implement YAML node projection with safe tags, timestamp inference disabled, no constructors and explicit input/depth/alias caps (front matter at most 256 KiB, depth 32, 50 alias references; cycles rejected). Keep scalar tags distinct, preserve unknown keys, diagnose duplicate keys, and never write projection output. On parse failure index available body/path/title with positioned diagnostics. Extend syntax-token link extraction to wikilinks; ignore fenced/inline code and preserve original source spelling.
- [ ] Rerun the focused corpus suite and real formatter pipeline. Demonstrate malformed YAML remains source-editable in both modes, formatting failure offers source recovery, and oversize YAML projection does not make an otherwise allowed note unreadable. Reuse unchanged slice evidence; add corpus-specific mode toggles proving YAML/wikilink/table/code decorations cannot rewrite source.
- [ ] Commit as `feat: add typed projections and preservation fixtures`.

**Acceptance:** Representative synthetic content proves supported round-trip preservation and fixed-point behavior; unsupported/malformed input remains recoverable without falsely claiming formatting success.

### Task 7: Durable bounded indexing and reconciliation

**Depends on:** Task 6.

**Files:** Create `indexing/{models,schema,queue,scanner,worker}.py`, migrations, `indexing/management/commands/run_indexer.py`, `docker/{entrypoint.sh,supervise.py}`, `tests/integration/{test_indexing,test_worker_lifecycle}.py`; modify save/read hooks, Compose/Docker runtime and status views.

**Interfaces:** `enqueue_note(path: str, revision: str) -> None`; `request_scan(kind: Literal['incremental','verify','rebuild']) -> JobState`; `run_batch() -> BatchResult`; `index_status() -> IndexStatus`. SQLite tables: `IndexGeneration`, `IndexedNote` (generation/path/revision/stat/projection), `LinkEdge`, coalesced `IndexJob` and `ScanState` (cursor/errors/schedule/checkpoint). FTS5 is migration-managed and keyed to document/generation; accounts/session tables are separate from rebuild operations.

- [ ] Write `test_initial_build_resumes`, `test_saved_note_preempts_bulk`, `test_queue_coalesces_and_bounds`, `test_scheduler_uses_configured_defaults`, `test_failed_scan_keeps_generation`, `test_daily_verification_catches_same_stat_edit` and `test_note_read_never_waits_for_worker`. Use a fake clock for schedule/backoff and deterministic paused batches for ordering; assert full eligible coverage, persisted cursor and deletion only after complete error-free scans plus final readiness.
- [ ] Run `uv run pytest tests/integration/test_indexing.py tests/integration/test_worker_lifecycle.py` to confirm failures.
- [ ] Implement one worker with exclusive worker lease/lock, persistent coalescing queue and nonoverlapping scans. Use local WAL, short DB transactions and file I/O outside transactions. Prioritize saved/stale-read note jobs; overflow sets persistent reconciliation-needed state. Incremental scans enumerate in bounded persisted batches; daily verification reads all eligible Markdown without attachment bodies. At most 20 maintenance files, one-second yield and lower CPU priority where supported; no watchers by default. Back off on storage/DB errors.
- [ ] Build new generations privately; continue serving the last useful generation until complete validated replacement. Track per-note revisions without letting a bulk stale snapshot overwrite a newer saved-note job: revalidate read revision before commit, replay prioritized updates into the candidate before promotion. Finalize deletions/promotion only with a complete error-free scan and successful identity check; partial traversal, unreadability and identity uncertainty preserve old rows. Retry/resume checkpoints on restart; opening the app never schedules another initial build.
- [ ] Connect saved/read note hooks and Refresh/Rebuild controls; require authentication and CSRF for scheduling. Expose processed/discovered counts, pending jobs, last completed/next scheduled scan, per-note indexed revision, partial/stale/backoff/error states; never show a percentage before total discovery. Add real web+worker supervision: either child failure exits container; SIGTERM stops both. Healthy login/status remains available when wiki readiness fails.
- [ ] Rerun focused tests with interrupted scans, queue overflow and an index failure immediately after disk save. Assert saved-with-index-delay, eventual maintenance repair and zero browser index work. Exercise container stop/restart with disposable storage.
- [ ] Commit as `feat: add resumable background indexing`.

**Acceptance:** The complete representative authorized corpus becomes indexed without blocking direct note reads; jobs/scans survive restart and coalesce. A missing or uncertain mount cannot empty the last useful index. No scan or backlink computation runs in a content request.

### Task 8: Bounded search, complete link resolution and discovery states

**Depends on:** Task 7.

**Files:** Create `indexing/search.py`, `tests/integration/{test_search,test_resolution}.py`; extend `wiki/{links,views,urls}.py`, templates, `static/src/navigation.js`, status and link tests.

**Interfaces:** `search_notes(query: str, cursor: str | None = None, limit: int = 30) -> SearchPage(items, next_cursor, freshness)`; complete `resolve_link` from Task 3. Search cursors bind query/generation/stable sort position and policy version; expired generations ask the user to restart paging. `LinkResult.state` is resolved/missing/unavailable/ambiguous; excluded targets use the same non-disclosing state as missing.

- [ ] Write tests for literal FTS punctuation/SQL-like input, 256-character/16-term limits, page defaults/max, escaped 240-character snippets, 300-candidate examination cap and bounded progress interruption. Assert search does not read note bodies, filters newly excluded/deleted hits, displays partial/stale status and opens current disk content. Test cursor invalidation after generation/policy change.
- [ ] Add resolution assertions: exact root wiki path → source-relative → unambiguous ID/alias/basename; ordinary Markdown source-relative only; optional `.md`, `[[target|label]]`, `../` within root, percent/space/Unicode filenames, heading fragments, duplicate headings, missing/ambiguous/excluded targets and code-literal false positives. A duplicate identifier never selects arbitrarily or reveals excluded candidates.
- [ ] Run `uv run pytest tests/integration/test_search.py tests/integration/test_resolution.py` to confirm failure.
- [ ] Implement parameterized literal-term FTS plus indexed filename/title lookup, bounded SQLite progress handler and stable cursor paging; stop after bounded candidates even if filtering leaves a short page. Recheck candidate authorization, confinement and existence without rereading matching bodies. On uncertain storage return unavailable/stale state, retaining the index internally without presenting it as current.
- [ ] Complete resolver fallback through the active index, rechecking disk policy before returning targets. Document heading slugs: Unicode text lowercased, inline markup removed, whitespace collapsed to hyphens, punctuation removed, duplicate suffixes `-1`, `-2`; rendering and fragment resolver share it. Unavailable/partial index never turns ambiguity into an arbitrary result. Missing notes are created only through explicit create controls. Link edges remain worker-only; no graph UI. Backlink UI may remain deferred; any optional backlink request is explicit, authenticated and bounded, and never runs from note opening or editor decoration/selection updates.
- [ ] Rerun focused tests and manually browse/search representative fixtures while indexing is incomplete and after external edits/deletions. Confirm direct opens consult disk regardless of search freshness.
- [ ] Commit as `feat: add bounded search and link discovery`.

**Stage 2 acceptance:** Background indexing covers the representative corpus, search is bounded and honest about freshness, path/ID/alias links follow documented precedence, and preservation/idempotence evidence uses real packaged tools. Initial indexing, search and note opening never trigger whole-wiki browser synchronization.

## Stage 3 — Recovery, sessions and security

### Task 9: Device session lifecycle and centralized security enforcement

**Depends on:** Task 8; foundational auth/CSRF/confinement already apply from Stage 1.

**Files:** Create `accounts/{models,middleware}.py`, migrations, `accounts/management/commands/revoke_sessions.py`, `tests/integration/{test_sessions,test_authorization,test_route_policy}.py`; extend account views/settings/checks, all route protection and response headers.

**Interfaces:** `SessionDevice(user, session_key_digest, created_at, last_seen_at, absolute_expires_at, revoked_at)` binds server sessions; `revoke_sessions(user, device_id: str | None) -> int` invalidates one/all devices. Interactive CLI disables an account or revokes assistant sessions; all content requests check active/revoked status. A session page allows the owner to revoke their own devices.

- [ ] Write expiry/renewal tests using a fake clock for the exact ordinary/remembered defaults and absolute caps; login rotates session, logout invalidates it, disabled/revoked accounts fail immediately, expired records are cleaned. Two human accounts continue working when the assistant's sessions are revoked.
- [ ] Parameterize every folder/source/create/save/source-recovery/format/preview/link/attachment/search/status/refresh/rebuild/history/draft route for anonymous, disabled and revoked users; mutations reject absent CSRF and invalid Origin/Host. Draft records are actor-scoped; shared wiki history remains authenticated and policy-checked. Forge proxy/Access email headers and assert no authentication or throttling bypass.
- [ ] Run `uv run pytest tests/integration/test_sessions.py tests/integration/test_authorization.py tests/integration/test_route_policy.py` to confirm failures.
- [ ] Implement registry/renewal/revocation, password validation and maintained account+trusted-IP throttling. Proxy trust is off by default; explicit mode requires trusted overwriting proxy/origin restrictions, no bare Access-email authentication. Apply no-store and secure headers to content/errors/drafts; production checks reject insecure cookie/host/origin/proxy settings. Redact application and web-server access logs so note paths/search terms/request bodies/credentials are not logged; use route names and safe reason codes.
- [ ] Rerun focused tests; assert logs from representative failed/successful requests contain no synthetic secret canary, source text or search query. Confirm CLI prompts hide passwords and offer no password argument.
- [ ] Commit as `feat: complete session revocation and security enforcement`.

**Acceptance:** Ordinary browser-controlled assistant access is independently revocable. All content paths share the same authentication/confinement policy, and renewal/throttling cannot be bypassed by forged headers.

### Task 10: Adversarial saves, storage loss and protected recovery/history

**Depends on:** Task 9; extend the existing safe-write path rather than add a second one.

**Files:** Extend `wiki/{saves,revisions,storage,readiness,models,views}.py`, indexing reconciliation and conflict template; create `wiki/management/commands/prune_recovery.py`, `tests/integration/{test_external_edits,test_storage_recovery,test_save_security,test_history}.py`, `tests/browser/recovery.spec.js`.

**Interfaces:** `store_draft(actor, path, base_revision, source, diagnostics) -> DraftRef` requires explicit user intent; automatic pre-write recovery versions retain submitted/original bytes as mandated by the save protocol. `restore_revision(actor, revision_id, current_base_revision) -> SaveResult` uses the same save path, never overwrites unconditionally. History/draft reads reapply path policy and actor rules; retention cleanup is quota/age bounded.

- [ ] Write a deterministic real-helper concurrency test: pause after staging, edit file from an independent process, resume, then expect 412/current revision with external bytes unchanged for normal save. Separately obtain a recovery token from a formatting failure, externally edit that note, then request source recovery with its original base and expect 412. Also race two application processes, create the same name, and replace a path component with a symlink between checks. Document the final uncoordinated-writer gap that remains after the last hash.
- [ ] Parameterize both save modes against denied paths, traversal/encoding tricks, symlinks at every depth, special files, oversize content, missing/mismatched identity, real non-root unwritability, required backup/quota failure and write/fsync/replace errors. Neither mode can convert these failures into success. Run hostile route cases across attachment/preview/history/recovery/search as well as source reads. Use no real authentication files.
- [ ] Write loss/recovery scenarios on disposable directories: rename the fixture root away and leave an empty directory at its path; remove/mismatch/make unreadable identity; then restore the original storage. Assert drafts and last useful generation survive, writes and destructive reconciliation fail, status is unavailable/stale, retry uses backoff, and recovery requires a fresh base plus explicit save. Never auto-enroll, reset a hash, purge rows or replay drafts.
- [ ] Run `uv run pytest tests/integration/test_external_edits.py tests/integration/test_storage_recovery.py tests/integration/test_save_security.py tests/integration/test_history.py` to confirm gaps; run `npm run test:browser -- tests/browser/recovery.spec.js` for browser-visible behavior in live and raw-source modes; decoration toggles cannot refresh base revisions, discard drafts or replay saves.
- [ ] Complete comparison of base/current/draft with escaped text, copy/download, confirmed reload and manual merge. Keep editor memory through failed saves/reauthentication; explicit protected draft storage supports restart recovery. Complete 30-day/quota retention, cleanup of abandoned reserved temp files only after readiness/confinement checks, and history restoration via conflict-safe saves. Refuse changed writes when required backup cannot be committed. Test process interruption before replacement, after replacement/before enqueue and after commit/before response; no corrupt authoritative bytes or automatic retries.
- [ ] Rerun the focused suites as a non-root process; use deterministic injected I/O failures only where a disposable real filesystem cannot trigger the case. Record that fixtures establish no real NFS durability or atomic CAS guarantee. Commit as `test: harden storage recovery and concurrent editing` with any required production fixes.

**Stage 3 acceptance:** Both save actions preserve authorization and storage protections under failure. External edits detected at either revision check return 412; original/current/draft remain recoverable. Losing the intended storage while its directory still exists cannot cause writes or index deletion. Return restores readiness, never auto-saves.

## Stage 4 — Polish and delivery

### Task 11: Desktop/mobile, keyboard and ordinary representative workflows

**Depends on:** Task 10.

**Files:** Extend templates, `static/src/{editor,navigation}.js`, `static/src/app.css`; create `tests/browser/{accessibility,representative-wiki}.spec.js`, `docs/testing/release-checklist.md`.

**Interfaces:** The same authoritative Markdown document powers inline live preview, Raw source and textarea fallback. Existing source/save/secondary-preview contracts stay separate; decoration widgets never serialize rendered HTML back to Markdown. Browser acceptance uses desktop/mobile viewports and two independent authenticated contexts; preserve the Task 5 slice gates rather than replacing them with visual-only snapshots.

- [ ] Add Playwright scenarios for sidebar/search/breadcrumb/inline live preview, Raw source and persistent controls on desktop; collapsible navigation and one primary pane on mobile; 699,000-byte note opening/editing; malformed YAML; format warning/failure/source recovery; empty/missing/ambiguous links; conflicts and expired authentication.
- [ ] Assert keyboard-only login, folders, search, note links, editor/textarea, live/source toggle, secondary preview, Save and Format; Ctrl/Cmd+S does not navigate; skip link and labels exist; focus is visible; Escape closes dialogs and restores focus; status live region updates without stealing focus; dirty navigation/logout asks before discarding. Assert selection/cursor navigation, focus and undo survive mode changes, raw syntax reveals around the active selection, unsupported syntax remains editable and no decorative widget traps focus or touch. Check readable contrast/touch controls and horizontal overflow manually on documented desktop/mobile sizes.
- [ ] Run `npm run test:browser -- tests/browser/accessibility.spec.js tests/browser/representative-wiki.spec.js` to confirm uncovered behavior, then adjust the UI only where these workflows fail.
- [ ] Exercise ordinary browsing/search/open/edit/recovery during paused/resumed background batches with the full synthetic wiki. Inspect network payloads: folder/search limits hold; opening fetches only requested note/assets; no scan/backlink call gates it. Inspect storage: no note data in localStorage/IndexedDB/CacheStorage and no service worker; cookies contain only opaque sessions. Block external image hosts and assert no attempted request. Fix obvious hangs or unusable behavior without adding timing gates or a benchmark harness.
- [ ] Rerun the browser suite. Record actual pass/fail/manual findings, desktop/mobile sizes and browser versions in the release checklist; mark unavailable checks explicitly. Commit as `feat: polish accessible source editing workflows`.

**Acceptance:** A person can complete normal and recovery workflows on desktop/mobile and using only the keyboard in live or raw-source mode. Opening/toggling never edits source; the conservative handling of front matter, tables, fences and unsupported syntax is visible and usable. The representative collection stays server-side; no numerical performance claim is required.

### Task 12: Container lifecycle, backup/restore and release evidence

**Depends on:** Task 11; retain runnable packaging from Tasks 1 and 7.

**Files:** Finalize `Dockerfile`, `.dockerignore`, `compose.yaml`, `.env.example`, `docker/{entrypoint.sh,supervise.py}`; create `wiki/management/commands/backup_data.py`, `tests/integration/{test_restart,test_backup_restore,test_container}.py`, `docs/operations.md`, `.github/workflows/ci.yml`; update README, development/limitations docs and release checklist.

**Interfaces:** `backup_data` uses SQLite's backup API and a consistent protected recovery-file manifest (hold the recovery mutation/prune lock while snapshotting DB and referenced immutable blobs), or document a stopped-app copy. Restore targets only a fresh disposable app directory and a separately restored synthetic wiki; the normal app never restores a whole wiki automatically. Public health reports process state only; authenticated status distinguishes wiki readiness/index freshness without leaking private paths.

- [ ] Write restart/restore/container assertions: users, server sessions, secret material, index checkpoint/generation, histories and explicitly stored drafts survive stop/start; database index rebuild leaves accounts/sessions untouched; expired sessions stay expired; interrupted rebuild resumes/retains useful index. Web/worker failure exits container and SIGTERM stops both. Missing host root is never created; login/status works when identity is unavailable after startup.
- [ ] Run `uv run pytest tests/integration/test_restart.py tests/integration/test_backup_restore.py tests/integration/test_container.py` and `docker compose config --quiet` with disposable settings before completing lifecycle behavior.
- [ ] Complete pinned builds with only packaged runtime assets, production server, non-root execution and localhost bind. Do not automatically chown/chmod a wiki, configure a mount, create a live marker or expose a public port. Document required UID/GID/write access as operator prerequisites. No real tunnel/access setup. CI runs synthetic correctness/security/preservation checks; browser/container checks use disposable roots and no private datasets or credentials.
- [ ] Write a short README entry path and detailed operations guide: install/build local fixture workflow, interactive human/assistant accounts, identity configuration outside wiki, readiness retry, inline/source controls, conservative syntax support, secondary preview/save/recovery/conflict states, queue/freshness controls, separate wiki/application backups, protecting revisions/drafts, secret material required for restore, and per-note restore through the same conflict-safe save path. Restore into disposable storage first, verify users/history, revalidate intended wiki identity and rebuild projection if needed. Document inode/ACL/xattr/ownership limits, NFS caching/hung calls and residual external-writer races honestly.
- [ ] Walk through synthetic login/search/read/edit/two-editor conflict/source recovery, revoke assistant while human remains active, restart, application backup/restore, per-note revision recovery and deliberate index rebuild. Tear down only the disposable environment after checking its generated manifest; avoid commands targeting arbitrary roots. Record commands/results and any unavailable checks.
- [ ] Run the complete correctness suite once: `uv run pytest`, `npm run test:formatter`, `npm run test:browser`, `uv run python manage.py check`, production configuration checks against disposable HTTPS settings and container checks above. If checks pass, record evidence and commit as `docs: package local delivery and recovery walkthrough`. If unavailable or failing, record the exact unresolved check and keep the release gate open.

**Stage 4 acceptance:** Local Compose delivery and operator instructions work from a clean disposable setup. Restart and restore preserve application state; search remains rebuildable from files. Evidence covers ordinary representative workflows and the full correctness/security/preservation matrix. Production use still requires owner-authorized deployment and a separately configured stable non-secret identity file/hash; this plan grants neither permission.

## Requirement-to-evidence map

| Requirement | Owning task and review evidence |
| --- | --- |
| Source/front matter/BOM/newlines, types, malformed YAML | 2, 4–6: byte assertions, typed projection and real-helper preservation corpus |
| Optional configs/ignores, data-only loading, idempotence | 4, 6: config/ignore cases, malicious/cyclic references, exact second-run equality |
| Source-save recovery with all normal safeguards | 5, 10: explicit failure token/action, retained source/diagnostics, both-mode failure matrix |
| Link resolution/duplicates/headings/missing assets | 3, 6, 8: syntax-aware edges and resolution precedence, no excluded-target disclosure |
| Concurrent editors/external edits during formatting | 5, 10: two contexts/processes, real helper barrier, 412 and unchanged external bytes |
| Unsafe HTML/URLs/attachments/external images | 3, 9, 11: parser/sanitizer/header tests and browser no-execution/no-contact assertions |
| Authentication/revocation/CSRF/proxy/header/logging | 1, 9: route matrix, session clocks, forged headers and log canaries |
| Traversal/symlinks/special files/exclusions | 2, 8–10: no-follow I/O and cross-route adversarial cases |
| Intended storage loss/mismatch/unwritability/return | 2, 7, 10: disposable root substitution, draft/index retention and refused reconciliation |
| Safe writes/no-op/create/backup errors/uncertain results | 5, 10: bytes/mtime/preconditions, non-root real errors, crash-point recovery |
| Full server indexing/bounded browser discovery | 7, 8, 11: complete corpus, queue/schedule/resume, query/payload caps, network/storage inspection |
| Restart/history/drafts/backup/restore | 7, 10, 12: persistent checkpoints/state and independent disposable restore |
| Inline mode fidelity, selection/undo and raw/source fallback | 5: demonstrated synthetic slice, unchanged bytes/ETag/mtime, no implicit format/save, selection/history assertions; 6, 10–11: corpus/recovery/mode integration |
| Desktop/mobile/keyboard and ordinary large-note use | 11: live/source browser scenarios plus recorded manual layout/contrast review |
| Local packaging/process supervision/no secret leakage | 1, 7, 12: Compose validation, process lifecycle and secret-free docs/build context |

## Planning review and handoff

The design's four delivery stages are preserved. The first slice includes identity checking, safe formatting and source-save recovery rather than deferring them until security polish. The file map, shared contracts and evidence map define task boundaries. Tasks 1–4 are implemented; their working backend remains in place. The inline revision changes upcoming UI tasks and adds a slice gate, without restarting foundation implementation. At implementation review, record each task's commit, commands and results in the release checklist, clearly separating automated/manual/unavailable checks.

No product decision blocks planning. The missing folder-name enumeration is resolved as the explicit synthetic fixture assumption above; preserve any real directory structure verbatim. Real-wiki readiness enrollment and deployment authorization are future operator prerequisites. Local fixtures cannot prove TrueNAS/NFS durability, hung-call cancellation or atomic coordination with uncooperative external writers.

The owner has authorized implementation and the inline editor direction, including continuing independent storage/authentication/safe-save work. Align and commit this revision, evaluate the synthetic slice before UI expansion, and continue the ordered implementation. Every final merge still requires explicit approval of repository, target, reviewed head and method.
