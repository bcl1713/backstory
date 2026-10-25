# Local release checks

This checklist records synthetic local evidence, not production authorization.
The planning baseline is `5dabb69`; the design's earlier repository ancestor is
`b28f943`. Tasks 1–10 have accepted independent stage gates through `3916f3c`.
External detailed logs are retained by the release operator; no private datasets
or credentials belong in this repository.

- [x] Authoritative Markdown / inline-live and raw modes preserve source,
  selection and undo; exact BOM, content FEFF and mixed-newline regressions.
- [x] Formatting, explicit source recovery, conflicts, protected drafts and
  revision restore use the same guarded save path.
- [x] Authentication, CSRF, revocation, exclusions, unsafe content, path/symlink,
  external edits, empty replacement root and required-backup failure checks.
- [x] Generated source corpus: exactly 1,000 notes, 299 date-named dailies,
  `reference/Large.md` exactly 699,000 UTF-8 bytes. Synthetic layout is Home,
  notes 300, projects/active 150, projects/archive 100, reference 100,
  templates 50, daily 299. Browser-specific slice files are additional fixtures.
- [x] Task 11 keyboard login, folders/search, editor/source/fallback, explicit
  Format, Escape focus restoration, secondary preview and Ctrl+S;
  dirty navigation/logout and expired authentication retain drafts.
- [x] Task 11 representative ordinary browsing/editing/protected recovery during
  paused/resumed maintenance; bounded folder/search payloads; no scan/backlink
  dependency on open; no note data in browser storage, service workers or
  attempted external image requests.
- [x] Visual review of live and raw source at 1440×1000 desktop and 390×844
  mobile viewports (full-page captures): readable contrast and focus, wrapped
  touch controls, collapsible navigation, one editing pane, persistent actions,
  no horizontal page overflow. Chromium 156.0.8078.4 / Playwright 1.64.1.
- [x] Task 11 complete Chromium browser suite: `npm run test:browser`, 48 passed.
  Focused new workflows: 4 passed. Assets build and diff whitespace checks passed.
- [x] Task 12 full release run: `uv run pytest` 499 passed;
  `npm run test:formatter` 21 passed; `npm run test:browser` 48 passed.
  These full suites preceded the narrow public-health route addition. After
  its 404 regression was fixed, 113 current bootstrap/session/authorization/route
  checks passed; the unchanged formatter/editor/storage evidence is reused.
- [x] Task 12 final Django system checks and HTTPS
  `check --deploy --fail-level WARNING`: no issues; migrations: no changes.
  Unsupported proxy mode explicitly rejected. Compose configuration valid.
- [x] Task 12 actual non-root final-runtime Compose walkthrough: hidden-input
  human/assistant accounts, two-context conflict, source recovery, protected draft,
  assistant revocation with human active, unavailable identity, clean restart
  from checkpoint to 1,000-note active index, deliberate completed rebuild, online
  backup and restore into a fresh app volume plus separately restored wiki, exact
  per-note recovery, web/worker failure propagation and missing-root refusal.
  All owned containers/networks/volumes removed.
- [x] Final focused restart/backup-restore/container command: 10 passed.
- [x] Backup/restore destinations refuse existing paths; shell restoration
  preflights separately reject existing and dangling-symlink paths before copies.
- [x] Independent Stage 4 review accepted at `71ced19`, with no mandatory
  findings. Earlier stage findings were corrected and independently rechecked.
  This final factual checklist update changes no runtime or operator commands.

Merge and deployment remain separate owner decisions requiring explicit approval;
neither is part of this authorized local delivery.

Physical mobile hardware, screen-reader interaction, other browser engines and
real NFS/TrueNAS behavior are unavailable locally. No claims cover those checks.
Four low npm audit entries trace to the retained transitive KaTeX advisory
GHSA-238p-pmpm-9mq7; no arbitrary dependency override or audit-zero claim.
Proxy trust remains unsupported and fails closed. Production requires separate
owner authorization, storage identity enrollment and deployment verification.

Verified runtime image: `backstory:stage4`,
`sha256:48154e34929f5950c8beada18565d6037a81eb898d8407281b51bc318e504dd0`.
It contains the final runtime code, including public process-only health, protected
SQLite backup and pruned development dependencies. Later changes are documentation,
example comments and test assertions only. CI configuration is supplied; a hosted
GitHub Actions run is not claimed by this local evidence.
