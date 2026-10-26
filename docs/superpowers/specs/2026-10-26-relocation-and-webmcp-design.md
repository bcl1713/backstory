# Relocation and browser tools

Issues #9 and #10 are implemented using the existing Django filesystem, session,
path policy, revision database and index services. The user delegated design and
review decisions. No live wiki move or deployment is part of implementation.

## Approaches and decisions

A filesystem rename alone loses relative links; copy/delete creates independent
copies and unsafe retries. Choose a bounded, source-preserving link inventory,
reviewed preview, no-clobber rename and durable roll-forward journal. Ordinary
note/folder moves and archival share one destination-path workflow. Destination
parents must already exist; the preview never creates a hierarchy implicitly.
Unrepresentable links, protected descendants, symlinks, incomplete inventories,
collisions and stale previews block the operation.

A journal records source identity, revisions, exact byte changes and actor before
mutation. Revalidate the complete eligible inventory immediately before starting.
Serialize application saves/drafts/moves. Interrupted operations block new writes
and expose an authenticated resume workflow; retries check actual bytes and inode
identity, never overwrite third-party edits. Keep original and replacement bytes
until completion. Filesystem, database and indexing are not one atomic transaction.
External writers do not share application locks and remain a documented residual
race. Preserve IDs/front matter and relocate available revision/draft associations.
Only actual link destinations change; navigation indexes get the same reviewed
link repairs without editorial heading changes. Index scheduling failure is
reported separately from a completed move.

For WebMCP, choose a progressive adapter over authenticated read/list/search JSON
responses. Feature-detect document.modelContext.registerTool, follow current
Chrome guidance, treat note data as untrusted, and leave ordinary browsing usable.
The actual assistant browser is unavailable here. Stubbed browser checks prove
registration and endpoint integration only. Stage 2 saves remain unimplemented
until actual-host discovery, search and full-source reading succeed.

## Validation

Use disposable synthetic filesystem and database fixtures. Cover moved notes,
folders/assets, links/aliases/anchors/code/prose, history/drafts, collisions,
protected paths, stale revisions, partial failures and idempotent recovery,
authorization/CSRF/readiness, indexing delay and browser unsaved drafts. Browser
tool checks cover full source, pagination/freshness, host fallback and expiry.
