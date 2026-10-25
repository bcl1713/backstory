# Local operations and recovery

For first-time setup or an existing wiki, start with the [setup guide](setup.md).
The commands below are a synthetic-only operations and recovery walkthrough.

Use this path only with newly generated disposable storage. Production storage,
mount/permission changes, tunnels, public exposure and deployment require separate
owner authorization. Backstory does not enroll whatever directory is visible.
A real wiki needs an approved existing stable non-secret regular identity file
and its SHA-256 configured outside the wiki; never select authentication or
agent-rule files. Readiness checks are read-only and never reset that identity.

## Build and start on localhost

From the checkout, generate a new container fixture and explicitly export its
configuration. Exported shell values take precedence over Compose `.env` and
`--env-file`; sourcing this chosen fixture avoids stale paths/hashes in a shell.
The service overrides application-data storage to its named local volume.

```sh
uv sync --frozen
uv run python -m tests.fixtures.generate /tmp/backstory-compose-demo --profile representative --for-containers
set -a
. /tmp/backstory-compose-demo/fixture.env
set +a
export COMPOSE_PROJECT_NAME=backstory-demo
docker compose config --quiet
docker compose build
docker compose run --rm web python manage.py migrate
docker compose run --rm web python manage.py create_account
docker compose run --rm web python manage.py create_account
docker compose up -d --no-build
```

Create a named human and a distinct ordinary assistant interactively; input is
hidden, and there is no password argument. The entrypoint also applies migrations
before supervising Gunicorn and one leased index worker. Visit
<http://127.0.0.1:8000/accounts/login/>. Compose binds 127.0.0.1 only, drops all
capabilities and prevents privilege escalation. Its bind refuses a missing host
root (`create_host_path: false`). It does not create a replacement wiki.

If the managed build network needs its public CA bundle, preserve Docker's
configured endpoint/proxy and use BuildKit's temporary secret mount:

```sh
docker build --secret id=proxy_ca,src=/etc/ssl/certs/ca-certificates.crt -t backstory:local .
docker compose up -d --no-build
```

Keep TLS verification enabled. The CA is optional on ordinary networks and never
copied to image layers. Runtime includes local compiled editor assets and pinned
formatter dependencies; development browser/build packages are pruned.

Runtime UID/GID is 10001. A host's Docker-group membership grants no wiki write
permission to that UID, especially under rootless mapping. Existing wiki/data
ownership, mode/ACL and compatible UID/GID access are operator prerequisites;
Backstory never chmods/chowns an existing wiki or runs web as root to bypass it.
Only `--for-containers` at new fixture construction makes its public synthetic
wiki directories 0777/files 0666; its enclosing directory remains 0700 and
configuration/manifest 0600. The named application-data volume starts owned by
10001 and remains separate/private. Readiness proves readable identity bytes,
not write access. A denied sibling-stage write reports `wiki_write_denied`.

## Normal and recovery walkthrough

1. Sign in as the human. Browse bounded folder pages, use Search and open a note.
   Search describes partial/stale state while indexing runs. The requested note
   always reads current disk and does not wait for scanning or backlinks.
2. Edit inline live preview. Move into markup to reveal source; front matter,
   tables, fences and unfamiliar syntax remain visible. Raw source changes only
   presentation, preserving selection/undo. Plain text fallback uses the same
   source/save controller; without scripting only edit/select/copy is available.
3. Format proposes a diff. Applying it edits this draft; Save applies the fixed
   formatter pipeline and writes only after revision/readiness/required-backup
   checks. Lint warnings remain visible and do not alone block safe publication.
   Ctrl/Cmd+S invokes the same Save. Safe server preview is secondary and blocks
   external images; link resolution/navigation is explicit.
4. Open the same note in a separate signed-in browser context. Save one edit,
   then save the other: HTTP 412 shows base/current/draft. Copy/download or
   explicitly Store protected draft. Accept the displayed current revision for
   manual merging, edit, then Save. Reload requires confirmation. No blind
   overwrite, automatic retry/rebase or replay exists.
5. Try malformed front matter in a disposable note. Failed Format/Save retains
   source and diagnostics; explicitly choose Save source without formatting.
   This skips transformations only: conflicts, auth/CSRF, confinement, size,
   required backup, storage identity and final disk hash still apply.
6. Open `/history/<note-path>` and choose a revision, compare it and select
   Restore this revision. This restores exact original bytes through the same
   guarded save path with a fresh current precondition. A subsequent external
   change still gives 412. Editing historical source instead uses ordinary Save.
7. Storage status exposes readiness reasons and index freshness without private
   host paths. Retry after the administrator restores the intended storage;
   failed identity retains the useful index and protected recovery, refusing wiki
   writes/deletion reconciliation. Return never automatically saves a draft.
   Protected drafts are private to their account and survive restart. Shared
   note history remains authenticated and policy checked.
8. Refresh index queues incremental maintenance; Rebuild index deliberately
   creates a new projection generation. Both coalesce. Interrupted work resumes
   from its durable checkpoint and retains the active generation until a complete
   valid replacement. Rebuild does not reset users or sessions. Defaults: 20 files
   per maintenance batch, one-second yield, five-minute incremental scan, daily
   content verification; no filesystem watcher or browser wiki index.
9. Sign in as the assistant in another context, then revoke it interactively:

   ```sh
   docker compose exec web python manage.py revoke_sessions
   ```

   Enter the assistant name and `all` (current sessions), or `disable` to prevent
   future login too. The human stays signed in. Your sessions supports per-device
   revocation. Expired/revoked sessions remain invalid after restart/restore.
10. `docker compose restart` preserves accounts, sessions, signing material,
    checkpoints, revisions and explicit drafts in the application volume. Web or
    worker failure exits the service; SIGTERM stops both. `/health/` reports only
    process health. Authenticated Storage status separately reports readiness.

## Application backup and separate wiki backup

SQLite must stay on local storage, outside the wiki (never on NFS). Recovery
contains private source, originals, drafts and diagnostics. Default retention is
30 days (the `BACKSTORY_REVISION_RETENTION_DAYS` Django setting) and logical
quota 64 MiB. The native runtime accepts `BACKSTORY_REVISION_QUOTA_BYTES`;
the supplied Compose service uses defaults unless its service environment is
explicitly extended. Retention has no environment override in this release. Required
backup/quota failure refuses a changed save. `prune_recovery` removes expired
rows and safely cleans registered abandoned stages; it never replays writes.
Pruning does not promise immediate SQLite filesystem reclamation.

Choose a fresh destination outside both roots. Online backup uses SQLite's backup
API under the recovery mutation/prune lock, including all SQLite tables/BLOBs.
The protected manifest declares no external recovery blobs, because none exist.
It records file sizes and SHA-256 values for verification. Destination is 0700;
DB, manifest and optional signing secret are 0600. Existing paths, symlinks and
overlap are refused; original permissions/storage are never repaired.

```sh
(
set -eu
test ! -e /tmp/backstory-app-backup
test ! -L /tmp/backstory-app-backup
docker compose exec web python manage.py backup_data /tmp/backstory-app-backup --include-secret
docker compose cp web:/tmp/backstory-app-backup /tmp/backstory-app-backup
)
```

`--include-secret` is an explicit private-key export. Without it, the manifest
states `required-separately`; retain the original `application-secret` securely.
The same signing secret is required for restored existing sessions/recovery
grants. Never print, commit, email or place backups/secrets in the wiki/image.
Keep them encrypted/access-controlled in your backup system. Lost or exposed
secrets require a separately planned security response, not automatic enrollment.

Wiki files need their own backup/snapshot. For a matching pair, quiesce users and
external writers while taking the application backup and separate wiki snapshot,
or stop the app and copy the complete application directory plus wiki separately.
An online application snapshot alone is not an atomic whole-wiki backup. Do not
copy a live SQLite main file while ignoring WAL; use the command or stopped copy.

## Restore into disposable storage first

Never overwrite an existing app directory. The following native verification
restores to fresh paths; it does not change the running Compose data volume.
Stop write activity while preparing the separate synthetic wiki snapshot.
`BACKSTORY_WIKI_ROOT` below must still name the generated fixture, verified
against its outside-wiki manifest. Do not substitute an arbitrary live root.

```sh
(
set -eu
test ! -e /tmp/backstory-restored-wiki
test ! -L /tmp/backstory-restored-wiki
test ! -e /tmp/backstory-restored-data
test ! -L /tmp/backstory-restored-data
docker compose stop web
umask 077
cp -a /tmp/backstory-compose-demo/wiki /tmp/backstory-restored-wiki
mkdir -m 700 /tmp/backstory-restored-data
cp /tmp/backstory-app-backup/backstory.sqlite3 /tmp/backstory-restored-data/
cp /tmp/backstory-app-backup/application-secret /tmp/backstory-restored-data/
python - <<'PY'
from pathlib import Path
import hashlib, json, sqlite3
backup = Path('/tmp/backstory-app-backup')
manifest = json.loads((backup / 'manifest.json').read_text())
assert manifest['schema'] == 1 and manifest['external_blobs'] == []
for name, item in manifest['files'].items():
    assert name in {'backstory.sqlite3', 'application-secret'}
    with (backup / name).open('rb') as stream:
        assert hashlib.file_digest(stream, 'sha256').hexdigest() == item['sha256']
with sqlite3.connect('/tmp/backstory-restored-data/backstory.sqlite3') as db:
    assert db.execute('PRAGMA integrity_check').fetchone() == ('ok',)
PY
export BACKSTORY_WIKI_ROOT=/tmp/backstory-restored-wiki
export BACKSTORY_DATA_DIR=/tmp/backstory-restored-data
uv run python manage.py storage_status
uv run python manage.py migrate
uv run python manage.py collectstatic --noinput
uv run gunicorn backstory.wsgi:application --logger-class backstory.logging.SafeGunicornLogger --no-control-socket --bind 127.0.0.1:8001 --workers 1 --threads 4 --access-logfile /dev/null
)
```

Keep the fixture's original identity path/hash loaded; revalidate that intended
identity rather than hashing whatever is present and accepting it. On localhost
8001 verify human login, existing sessions, history and protected drafts. Open
one revision and restore that note explicitly; it still checks the restored
wiki's fresh revision, does not overwrite the original fixture and creates a
required revision backup. In a second terminal load the original fixture configuration, then export
`BACKSTORY_WIKI_ROOT=/tmp/backstory-restored-wiki` and
`BACKSTORY_DATA_DIR=/tmp/backstory-restored-data` before running
`uv run python manage.py run_indexer`. Use Rebuild index if the separately restored wiki is from a
different point in time. Projection rebuild leaves accounts/sessions/history
alone. Pending-stage registries/locks are transient, cleanup-only and are not
replayed or needed to restore this DB snapshot.

To resume the original Compose fixture, reload its `fixture.env` before running
Compose (exported restored paths otherwise override it), then `docker compose up
-d --no-build`. `docker compose down` preserves its data volume. Use
`docker compose down --volumes` only for the exact disposable project whose
manifest/configuration you checked. Never use broad prune commands or remove
arbitrary roots. Keep backups until the restore was verified.

See [release checks](testing/release-checklist.md) for actual evidence and
[limitations](limitations.md) for inode/ownership/ACL/xattr, NFS caching/hung-call
and residual external-writer races. Proxy trust is unsupported and fails closed;
this localhost Compose file is not a reverse-proxy production recipe.
