# Verified CI Reuse Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reuse only verified identical-source application checks at release time.
**Architecture:** A standard-library evidence collector and fail-closed verifier cooperate with bounded GitHub run/job/artifact reads. CI accepts a default-false application-reuse input; release alone calculates that input, retaining container and policy checks.
**Tech Stack:** Python standard library, GitHub Actions YAML, pytest, GitHub CLI.
**Spec:** `docs/superpowers/specs/2026-10-30-verified-ci-reuse.md`

## Global Constraints
No change to active releases, publishing credentials, multiarch builds, stale-head guards, or required PR checks. Reuse failure means full CI. Freshness maximum 24 hours. No artifact execution/extraction. Read-only actions and pull-request metadata permissions only on verifier.

## Review Focus
- Forged or mismatched artifact/run/source identity must not authorize reuse.
- A newer failed/rerun/partial candidate must not fall back to older green evidence.
- Changed workflow/policy or environment must force full CI.
- Exceptions and unexpected skipped jobs must not accidentally unblock publication.
- Bounded API/ZIP parsing must reject malformed and oversized evidence.

## Tasks
1. Add failing fixture tests for exact positive eligibility and each trust/freshness/job/source/environment/ZIP negative case. Implement pure validation and bounded receipt parsing in `scripts/ci_evidence.py`.
2. Add subprocess/API adapter tests for failure fallback and exact metadata endpoints. Implement collection/probe/verification CLI with bounded reads and fixed fallback output.
3. Add workflow-structure tests for default-full PR checks, pinned setup actions, release verifier permissions, container preservation and aggregate skipped-job handling. Wire receipts, probe and reusable input.
4. Run focused and full Python tests, Node tests, workflow validation; obtain independent security/code review. Publish a draft PR and verify exact-head CI. Integrate only in the later approved batch after parent coordination.
