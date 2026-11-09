# Durable move preview implementation plan and design

**Goal:** Return a durable actor-owned preview handle before whole-wiki planning, so a document host with a ~15-second evaluation limit can inspect preparation and obtain its complete review/token afterward.

**Evidence:** On deployed a2bb768, native `preview_move` still returned Runtime.evaluate timeout after 14.719s; no handle reached caller. One existing synthetic note remains. Current HTTP endpoint calls the full planner before journal creation. The new regression in test_async_move_tools fails when it forbids synchronous planning in HTTP preview/status. Prior concurrency fix remains valid; this change addresses response lifecycle rather than request deadlines.

**Architecture:** A small durable MovePreviewJob metadata row owns the initial UUID. `preview_move` queues it and returns HTTP202/state preparing/operation_id/poll_after_ms1000/next_action get_move, without inventory traversal or link parsing. The existing separately supervised index-worker process prepares at most one job between batches, using the unchanged full planner, wiki-write guard and short quota-protected journal publication. The completed MoveOperation uses exactly the job UUID; job deletion and operation publication are one transaction. `get_move` is always an inspection; it never starts or resumes planning or mutation. Failed/cancelled jobs remain inspectable briefly. Existing synchronous UI/domain preview and all guarded commit/recovery behavior remain supported.

## Contract and file ownership

Backend worker implementation:
- wiki/models.py + migration0006: MovePreviewJob UUID id, actor FK, source/destination, context JSON, queued/running/failed/cancelled state, fixed reason_code, created_at, nullable settled_at. Keep existing MoveOperation states/schema unchanged.
- wiki/move_previews.py: enqueue_move_preview(actor,source,destination) -> MovePreviewJob; run_pending_move_preview() -> bool; cancel_move_preview(actor,operation_id) -> current job or completed MoveOperation. Export job_data preparation metadata if helpful, but authorization belongs to adapter. No thread launched in request workers.
- wiki/relocations.py: reuse/extract preflight and plan persistence helpers where useful; preserve synchronous preview_move and writer reservation. Worker should call existing full `_plan` under cooperative writer lock and publish a complete MoveOperation with explicit job UUID. No partial plans accepted by commit, no filesystem writes from preparation.
- wiki/revisions.py: include queue metadata in existing shared logical quota. Active preview capacity32 counts queued/running jobs plus existing preview operations, excluding current job when atomically replacing it. Failed/cancelled jobs bounded by quota and one-hour retention from settled_at (including old jobs failing after an outage); prune only settled/expired preparation metadata, never removal recovery or in-flight move journals.
- indexing/management/commands/run_indexer.py: invoke run_pending_move_preview once between index batches; preserve indexer backoff/cleanup and --once semantics. Existing process supervision owns worker lifetime.
- tests/integration/test_move_previews.py: real disposable journal/worker tests, no live access.

Adapter/browser implementation:
- wiki/management_tools.py: `_operation` resolves actor-owned completed MoveOperation or pending MovePreviewJob by same canonical UUID; authorize current source/destination/policy before disclosure. `preview_move_tool` enqueues only and returns202. `_move_data` for jobs returns bounded state preparing/preview_failed/cancelled, operation_id, source/source_path,destination,kind, reason_code,authoritative false (cancellation may describe status only),poll_after_ms,next_action. No inventory or review_token until full plan exists. get_move returns200 for inspection; no execution. Commit on a preparation job returns409 move_preview_not_ready. Explicit rollback cancels pending/failed preparation without waiting for full planner; worker must not replace cancellation with a ready plan. Completed plans keep existing review-token/commit rules.
- static/src/wiki-tools.js descriptions teach caller to retain operation_id and deliberately inspect get_move until ready; do not auto-poll/replay writes in transport. Existing draft preflight and guards remain. No new tool count or input schema required.
- Update existing management unit/browser/formatter tests for preparing -> poll -> reviewed preview. Browser lifecycle needs real worker scheduling or explicit fixture worker; preserve assertions rather than weakening them. Root owns fresh test_async_move_tools.py integration checks.
- Build generated assets once after source changes; root coordinates artifact rebuild.

## Safety and lifecycle requirements

1. Queue metadata captures policy and exact source identity, destination-parent identity and root/marker context with bounded descriptor operations; no whole-wiki scan. Worker refuses changed source/context or collision, current policy/actor revocation and expired job before publication. Full plan checks remain authoritative at commit.
2. Enqueue and GET must not wait on a long-held wiki-write lock. Use nonblocking application locks for queue/worker scheduling; short transactions reserve SQLite writer before quota reads. Existing DB busy timeout remains unchanged. Queueing never mutates note content.
3. One process owns preparation through a nonblocking exclusive worker flock. A running job left after loss of that owner becomes an inspectable preview_failed/move_preview_interrupted; do not automatically rerun a crashed job or apply content. Busy wiki lock leaves job queued without blocking HTTP or worker indefinitely.
4. Cancel queued/running jobs through an atomic conditional DB update. After planning, worker rereads state in the publication transaction and must not overwrite cancellation. Failed capacity/quota/INSERT leaves no partial MoveOperation; retain an inspectable job failure if DB available. Never catch untrusted raw exception text into a response or journal.
5. On success, atomically store complete plan under the SAME UUID and remove the job row; no moment with neither record observable. Shared quota must reflect replacing job metadata with plan, without double charging it. If ordinary active writer/contention persists, fail safely, not retry a mutation silently.
6. Reapply actor/policy/path restrictions to pending/failed/cancelled status. Complete ready review still enforces512KiB and exact token binding. History/removal protocols unchanged. UI legacy routes must never see a partial MoveOperation.

## Validation and release

- [x] RED: new HTTP regression forbids planner calls during enqueue/GET; current endpoint fails at synchronous `_plan` (0.57s).
- [x] Focused backend cases: queue without scan; same-ID complete publication; changed source/root/marker/policy; actor revoked; capacity/quota; cancellation before/during plan; crashed running job; worker/wiki lock contention; DB failure leaves no partial plan/content writes.
- [x] Focused API/browser: HTTP202 handle then nonexecuting GET; cross-actor and policy denial; pending commit refusal; completed review/commit+archive; failed preparation status/cancel; cancellation race; ordinary real HTTP/browser lifecycle with worker and existing unsaved draft guards.
- [x] Root integration: affected async, management, relocation concurrency, quota and run_indexer command checks; build/formatter affected file; one meaningful browser scenario. No broad discretionary campaigns.
- [ ] Independent review, exact current-dev proposed merge full required gate once, same-SHA atomic landing and receipt-only publication. Reuse passing evidence while inputs unchanged.
- [ ] Update #148 with exact release/image and bounded native acceptance: verify deployed version, queue existing fixture once, retain ID, poll get_move, review then commit move/archive and recoverable cleanup. Keep prior live passes and #106 closure. No claim that code alone establishes host acceptance.
