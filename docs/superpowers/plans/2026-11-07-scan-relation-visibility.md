# Scan relation visibility implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement this focused fix inline, then obtain a whole-branch code review.

**Goal:** Keep safe completed graph relations available while unchanged index scans are queued or running.

**Architecture:** In `indexing/graph.py`, separate scheduler freshness from relation validity and continuation identity. Retain active generation, mutation, namespace, source dirtiness, endpoint eligibility, storage readiness and publication checks. Report current scheduler status in freshness metadata.

**Tech Stack:** Python, Django, SQLite, pytest.

**Spec:** https://github.com/bcl1713/backstory/issues/114

## Global constraints

- No scan-duration, worker scheduling, client canvas or deployment changes.
- Focused regressions and review before merge to dev; the automatic publisher owns the full release gate and publication.
- Reuse passing evidence while tested inputs are unchanged, per AGENTS.md.

## Review focus

- Storage/policy changes must withhold old evidence and expire old cursors.
- Dirty or externally changed sources and deleted endpoints must not expose old edges during a scan.
- Generation, mutation and relation publication changes must still invalidate pagination.
- Scheduler transitions during a request must not reject otherwise unchanged evidence.
- Existing session/authentication checks remain enforced by the shared tool and HTTP layers.

### Task 1: Separate safe evidence from scan freshness

**Files:** Modify `indexing/graph.py`; extend `tests/integration/test_graph_index.py` and `tests/integration/test_graph_queries.py`; record focused evidence in `docs/testing/`.

**Interfaces:** Preserve `query_links`, `query_graph` and response contracts, including `freshness.state`.

- [x] Add regressions for manual incremental/verify scans at queued, first-batch and completed stages, and automatic incremental scans using controlled time. Assert outgoing links, backlinks, local/global graph edges, stable rows/epoch, no unnecessary resolution and valid link/graph pagination across transitions.
- [x] Run the new regression selection against the existing implementation; confirm failure caused by hidden completed evidence or expired cursors.
- [x] Remove scheduler freshness from relation validity and cursor identity/end-of-query consistency checks. Preserve all evidence and safety checks.
- [x] Add focused cases for changed and dirty sources, deleted/revoked endpoints, unavailable storage, namespace/mutation mismatch, incompatible generations and scheduler transitions during a request.
- [x] Run the graph index/query/tool/view tests; passing establishes the scoped regression is fixed and existing safety/authentication contracts still hold. Do not run the complete gate before merge.
- [ ] Review the final diff, retain evidence, commit with a Conventional Commit subject, open and merge a PR targeting dev, and monitor the automatic publisher through publication.
