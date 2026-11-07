# Development workflow

Use GitHub's `dev` branch as the development baseline. Fetch before starting.
Keep the primary checkout clean on `dev`; use an isolated feature branch and
worktree for changes. Preserve existing edits before switching or restoring files.
Push completed work and open a PR against `dev`, including
documentation and investigation handoffs. Do not leave the only copy under
`/tmp` or in an uncommitted working tree.

## Clean up every development cycle

Record task-owned temporary paths, process groups, ports, Compose projects,
images, and disposable volumes when creating them.

Before handoff, including after failure or cancellation, clean only task-owned
disposable resources after preserving unpublished work and reproducible failure
evidence:

- Stop and reap task-owned servers, browsers, workers, containers, and listeners.
  Verify cleanup with host-visible process checks when the sandbox hides them.
- Remove duplicate dependency environments, generated fixtures, test databases,
  image exports, and temporary downloads once their checks finish. Reuse shared
  caches where appropriate instead of copying them into each evidence directory.
- Keep concise receipts, logs, provenance, and needed failure evidence. Retain
  full traces or videos only while needed for an active review or investigation;
  avoid multi-gigabyte archives of completed runs. Record what was omitted when
  reducing an archive; preserve full material needed by open investigations.
- Keep the worktree for an open PR. After merge, remove its worktree, local task
  branch, and remaining task-owned scratch files after verifying publication.
- Remove obsolete completed publisher attempts after checking publisher state,
  active processes, and references from current jobs. Preserve current dev/main
  release receipts and assets, including external targets of symlinks.
- Remove task-owned disposable Docker images by recorded IDs after use. Check
  ownership and other sessions before cleaning shared build caches; bound cache
  retention with age and size limits. Avoid global system or volume pruning.
- Finish with Git status, worktree, process/resource, and disk-usage checks.
  Report any retained temporary resource with its purpose and removal condition.

Preserve live wiki data, credentials, running services, active work from other
sessions, and source/history that has not been verified published. Inspect
uncommitted changes before removing them; preserve a small verified recovery
copy when their status is uncertain.
