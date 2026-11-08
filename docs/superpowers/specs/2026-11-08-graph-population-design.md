# Issue 134: populate usable connections during indexed traversal

Status: approved by owner instruction to implement, merge and publish. Investigation and synthetic
measurements are in
[`2026-11-08-issue-134-investigation.md`](../../testing/2026-11-08-issue-134-investigation.md).
An independent builder check found no important unanswered planning questions.

## Intent

Opening the default two-hop view should promptly return confirmed connections
and automatically complete the selected outgoing-hop scope. Valid membership
and directed links must survive pagination. A retry succeeding after an earlier
budget failure is insufficient.

## Approaches

1. **Redesign population over the saved index (recommended).** Separate outgoing
   membership expansion from final-layer induced-edge retrieval, emit confirmed
   connections as traversal progresses, and use SQL limits scoped to actual SQL
   work. This retains the existing resolver, index and eligibility model while
   fixing the measured wasted work and delayed publication.
2. **Raise the request-wide budget and enlarge discovery windows.** Smaller
   implementation, but final-layer out-of-scope links still dominate loading,
   and confirmed edges still wait for full discovery. This treats symptoms and
   is insufficient as the final fix.

Parsing note bodies on demand would introduce a different consistency and
eligibility model. The owner's comparison motivates an efficiency target; it
does not request adopting that architecture.

## Proposed behavior and implementation boundaries

- Expand BFS frontiers only below the requested maximum depth. Preserve shortest
  outgoing paths through eligible bridges, independently of display filters.
- Stream confirmed directed pairs with both eligible endpoints while discovery
  is still running. Pending output must itself be paginated, so a full response
  cannot skip discovered pairs. Repeated occurrences must eventually publish the
  full aggregate, and replay must not double-count them. The client already
  replaces repeated directed-pair counts rather than summing them.
- Once membership is settled, retrieve final-layer links to members using indexed
  membership intersection. Avoid materializing or validating outside targets.
  Choose indexed raw-source scans for sparse sources and pair/member probes for
  sources whose outgoing fanout would otherwise dominate. Seekable batches must
  avoid replacing hub scans with unconditional quadratic membership work.
- Keep bounded resumable checkpoints and soft work slices. Redesign the graph
  SQL watchdog to measure SQL work independently of filesystem/setup latency,
  retaining a sensible emergency guard and explicit database-versus-budget
  errors. Search's independent query behavior should remain unchanged.
- Preserve generation, mutation, publication, epoch, namespace, policy, storage
  and signed-query binding. Revalidate both endpoints and ancestry witnesses
  before emission, including lost-response replay. Failures must not consume
  the continuation. Incomplete index evidence remains explicitly incomplete.
- Preserve the response payload bounds, cancellation, stale-response rejection,
  automatic continuation and recovery actions. Do not silently cap membership,
  drop induced edges, reduce the requested depth or declare partial data complete.

The implementation should use the existing Python/SQLite service and graph client.
The exact indexed-intersection mechanism is an implementation decision to verify
against the synthetic hub before keeping it. No deployment or publication is
part of this design approval.

## Lean validation

Add the smallest regression for early connected output, complete synthetic
membership/edges, and immunity to the reproduced non-SQL wall-time failure.
Run existing affected one-/three-hop, replay, invalidation and error-classification
checks. Record request count, server time to first connection and operation counts
on the representative hub. Perform one fresh default two-hop browser load and
one retry/depth-change check. Retain exact working-tree evidence, stop when those
checks resolve the relevant questions, and reserve the full gate for a real
merge candidate if integration is later requested.
