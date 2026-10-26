# Relocation and WebMCP Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for native implementation. Independent link-source and browser-tool work is delegated under dispatching-parallel-agents.

**Goal:** Implement #9 and the gated read-only stage of #10 safely.
**Architecture:** Existing services plus a relocation journal and progressive browser adapter.
**Tech Stack:** Django, SQLite, descriptor-relative Linux filesystem access, JavaScript, pytest, Playwright.
**Spec:** docs/superpowers/specs/2026-10-26-relocation-and-webmcp-design.md

## Global Constraints

- Synthetic fixtures only; no deployment or live move.
- Preserve authoritative bytes, identities and history; never overwrite collisions.
- Actual-host proof gates WebMCP saves.

## Review Focus

- Ambiguous/newly shadowed links must not change their meaning after relocation.
- Recovery must reject unrelated destination content and changed intermediate files.
- Other editor tabs must retain unsaved drafts and stale bases.
- Protected descendants must prevent moving an otherwise eligible folder.
- Index errors must not misreport a completed move as failed.

### Task 1: Source-preserving link repair

Files: wiki/relocation_links.py, tests/unit/test_relocation_links.py.
Interface: rewrite_links(source, old_path, new_path, relocated, resolve) returns source and reviewed changes.
- [x] Write and run failing syntax/fidelity tests.
- [x] Implement precise source-span destination changes with the existing parser.
- [x] Run focused tests; reject required repairs that cannot be represented safely.

### Task 2: Relocation service and recovery

Files: wiki/relocations.py, wiki/models.py, migration, tests/integration/test_relocations.py.
Interfaces: preview_move(actor, source, destination) -> MoveOperation; commit_move(actor, id) -> result dict.
- [x] Write failing note/folder/history/security/staleness/recovery tests.
- [x] Build a bounded filesystem and link inventory independent of index freshness.
- [x] Persist exact reviewed bytes, revalidate, apply no-clobber rename/link changes and migrate history.
- [x] Add shared write serialization and recovery blocking to existing saves and drafts.
- [x] Verify focused tests, including read-only failures and idempotent retry.

### Task 3: Reviewed move UI

Files: wiki/relocation_views.py, wiki/urls.py, wiki/templates/wiki/move.html, wiki/templates/wiki/shell.html, wiki/templates/wiki/note.html, static/src/editor.js.
- [x] Add authenticated preview/review/commit/recovery pages and note/folder entry points.
- [x] Preserve unsaved drafts in initiating and other tabs; never automatically replay a write.
- [x] Exercise synthetic browser moves and draft guards.

### Task 4: Read-only WebMCP

Files: wiki/tool_views.py, wiki/tool_urls.py, static/wiki-tools.js, focused backend/browser tests, docs/webmcp.md.
- [x] Write failing authenticated JSON/fidelity/freshness tests and registration checks.
- [x] Implement bounded adapters and progressive document tool registration.
- [x] Verify read-only tool interaction and unsupported-host fallback; document actual-host limitation.

### Task 5: Integration and review

- [x] Run pytest, formatter tests, build and browser suite.
- [x] Review filesystem/security/recovery behavior independently, fix material findings.
- [x] Update user docs and report exact verification and remaining host gate.

Pre-flight: Task 1 produces the rewrite interface consumed by Task 2. Task 3 consumes persisted previews/results from Task 2. Task 4 has independent files; parent wires its include and script into shared files.

## Execution evidence

- Independent review reproduced unsafe post-interruption namespace changes and incomplete parser projections. Both were fixed with failing-to-passing regressions. Denied-candidate resolution, rollback descendants, history growth quotas, terminal acknowledgment loss and repeated directory sync failure also have focused regression coverage.
- Final verification: 891 pytest tests, 73 Playwright tests, 21 formatter tests; asset build, Django checks, migration consistency and whitespace checks passed. Browser/formatter helpers required approved sandbox escalation for localhost binding and subprocess execution.
- Actual assistant-host WebMCP discovery remains unverified. No Stage 2 save tool, deployment or live wiki relocation was performed.
- Integration decision delegated by user: publish the tested feature branch as a draft PR, retaining #10's host gate.
