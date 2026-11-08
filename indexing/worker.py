"""One leased, restartable worker. All filesystem reads occur outside DB writes."""
from contextlib import contextmanager
from dataclasses import dataclass
import fcntl
import os
import time
import uuid

from django.conf import settings
from django.db import connection, transaction, OperationalError
from django.db.models import F

from wiki.contracts import StorageError
from wiki.metadata import project_note
from wiki.readiness import check_readiness
from wiki.storage import read_note, require_ready
from .models import IndexGeneration, IndexedNote, IndexedName, IndexJob, LinkEdge, ScanState
from .scanner import file_stat, next_paths
from .diagnostics import record_failure, failure_reason

BATCH_SIZE = 20
YIELD_SECONDS = 1


@dataclass(frozen=True)
class BatchResult:
    processed: int = 0
    priority: int = 0
    pending: bool = False
    state: str = 'idle'
    expensive: int = 0


@dataclass(frozen=True)
class IndexStatus:
    state: str
    processed: int
    discovered: int
    pending_jobs: int
    last_completed: float
    next_scheduled: float
    errors: int
    reason_code: str
    generation: int | None
    phase: str = "idle"
    metadata_checked: int = 0
    parsed_notes: int = 0
    dependencies_checked: int = 0
    last_verified: float = 0
    watcher_mode: str = "poll"
    watcher_health: str = "starting"
    fallback_reason: str = ""


@contextmanager
def lease():
    settings.BACKSTORY_DATA_DIR.mkdir(mode=0o700, parents=True, exist_ok=True)
    descriptor = os.open(settings.BACKSTORY_DATA_DIR / 'index-worker.lock', os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
    try:
        try:
            fcntl.flock(descriptor, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            yield False
        else:
            yield True
    finally:
        os.close(descriptor)


def _json_tree(value):
    if isinstance(value, (tuple, list, frozenset)):
        return [_json_tree(item) for item in sorted(value, key=repr)] if isinstance(value, frozenset) else [_json_tree(item) for item in value]
    return value


def _commit_projection(snapshot, info, generations, token):
    from .graph_projection import (dirty_dependents, namespace_keys, namespace_version,
                                   record_mutation, replace_dependencies)
    from .names import note_names
    # Capture source identities before parsing/I/O, then compare under the writer
    # lock. A stale projection cannot overwrite a later committed source.
    expected = dict(IndexedNote.objects.filter(generation__in=generations, path=snapshot.path)
                    .values_list('generation_id', 'revision'))
    namespace = namespace_version()
    needs_projection = any(expected.get(generation.pk) != snapshot.revision for generation in generations)
    projection = project_note(snapshot) if needs_projection else None
    if (read_note(snapshot.path).revision != snapshot.revision or file_stat(snapshot.path) != info
            or namespace_version() != namespace):
        raise StorageError('index_revision_changed', 503)
    with transaction.atomic():
        ScanState.objects.filter(pk=1).update(errors=F('errors'))
        for generation in generations:
            note = IndexedNote.objects.filter(generation=generation, path=snapshot.path).first()
            if (note.revision if note else None) != expected.get(generation.pk):
                raise StorageError('index_revision_changed', 503)
            if note and note.revision == snapshot.revision:
                # Verification and duplicate save notifications are graph no-ops.
                IndexedNote.objects.filter(pk=note.pk).update(stat=info, seen=token)
                continue
            new_source = note is None
            old_keys = namespace_keys(note) if note else set()
            old_edges = list(LinkEdge.objects.filter(note=note).order_by('pk')) if note else []
            old_names = note_names(note.path, note.title, note.ids, note.aliases) if note else []
            was_complete = note.relations_complete if note else False
            if note is None:
                note = IndexedNote(generation=generation, path=snapshot.path)
            note.revision, note.stat, note.seen = snapshot.revision, info, token
            note.title, note.body = projection.title, projection.body
            note.ids, note.aliases, note.tags = list(projection.ids), list(projection.aliases), list(projection.tags)
            note.projection = {'metadata': _json_tree(projection.typed_metadata),
                               'diagnostics': [item.code for item in projection.diagnostics]}
            note.relations_complete = not projection.diagnostics
            def signature(edge):
                return edge.target, edge.kind, edge.fragment, edge.occurrence_kind
            same_edges = ([signature(edge) for edge in old_edges] ==
                          [signature(edge) for edge in projection.edges])
            source_changed = not same_edges or was_complete != note.relations_complete
            if source_changed:
                note.relations_dirty = True
                note.relation_after = note.relation_build_version = 0
                note.relation_version += 1
            note.save()
            names = note_names(note.path, note.title, note.ids, note.aliases)
            if names != old_names:
                IndexedName.objects.filter(note=note).delete()
                IndexedName.objects.bulk_create([IndexedName(note=note, name=name, resolvable=resolvable)
                                                 for name, resolvable in names])
            if same_edges:
                refreshed = []
                for edge, fresh in zip(old_edges, projection.edges):
                    if edge.position != list(fresh.position) or edge.position_precision != fresh.position_precision:
                        edge.position = list(fresh.position)
                        edge.position_precision = fresh.position_precision
                        refreshed.append(edge)
                if refreshed:
                    LinkEdge.objects.bulk_update(refreshed, ['position', 'position_precision'])
            else:
                LinkEdge.objects.filter(note=note).delete()
                LinkEdge.objects.bulk_create([LinkEdge(note=note, target=edge.target, kind=edge.kind,
                                                       fragment=edge.fragment, position=list(edge.position),
                                                       occurrence_kind=edge.occurrence_kind,
                                                       position_precision=edge.position_precision)
                                              for edge in projection.edges])
                replace_dependencies(note, projection.edges)
            if new_source and same_edges:
                replace_dependencies(note, projection.edges)
            new_keys = namespace_keys(note)
            if new_keys != old_keys:
                dirty_dependents(generation, old_keys | new_keys)
            record_mutation(generation)
            with connection.cursor() as cursor:
                cursor.execute('DELETE FROM indexed_fts WHERE rowid = %s', [note.pk])
                cursor.execute('INSERT INTO indexed_fts(rowid,path,title,body,generation) VALUES (%s,%s,%s,%s,%s)',
                               [note.pk, note.path, note.title, note.body, generation.pk])
    return needs_projection


def _process_invalidation(path, generations, token, *, allow_missing=False):
    """Confirm final safe path state; attachment invalidation never reads bytes."""
    from .graph_projection import (dirty_dependents, namespace_keys, namespace_version,
                                   path_fingerprint, record_mutation)
    from wiki.storage import open_directory
    namespace = namespace_version()
    kind = path_fingerprint(path)
    parsed = False
    if path.lower().endswith('.md') and kind == 'file':
        snapshot = read_note(path)
        parsed = _commit_projection(snapshot, file_stat(path), generations, token)
    elif kind == 'missing':
        if not allow_missing:
            # It disappeared after the caller checked; retry with a fresh
            # observed-absence grace period, preserving the event version.
            raise StorageError('index_revision_changed', 503)
        # Missing parents/permission errors need complete reconciliation. Never
        # infer deletion from an inaccessible tree or a lost storage mount.
        parent = path.rpartition('/')[0]
        try:
            with open_directory(parent):
                pass
        except StorageError:
            from .queue import require_reconciliation
            require_reconciliation()
            return
        require_ready()
        if path_fingerprint(path) != 'missing' or namespace_version() != namespace:
            raise StorageError('index_revision_changed', 503)
        with transaction.atomic():
            ScanState.objects.filter(pk=1).update(errors=F('errors'))
            for generation in generations:
                notes = list(IndexedNote.objects.filter(generation=generation, path=path)
                             .defer('body', 'projection', 'tags', 'stat'))
                for note in notes:
                    dirty_dependents(generation, namespace_keys(note))
                    with connection.cursor() as cursor:
                        cursor.execute('DELETE FROM indexed_fts WHERE rowid=%s', [note.pk])
                    note.delete()
                if notes:
                    record_mutation(generation)
    elif kind == 'denied':
        from .queue import require_reconciliation
        require_reconciliation()
        return
    # Reuse recorded path evidence for positive and negative exact lookups.
    # Update only dependents of this path, keeping unrelated sources published.
    from .models import RelationPath
    if namespace_version() != namespace:
        raise StorageError('index_namespace_changed', 503)
    with transaction.atomic():
        ScanState.objects.filter(pk=1).update(errors=F('errors'))
        for generation in generations:
            records = RelationPath.objects.filter(generation=generation, path=path)
            changed = records.exclude(fingerprint=kind, namespace=namespace).exists()
            if changed:
                records.update(fingerprint=kind, namespace=namespace)
                dirty_dependents(generation, {'path:' + path})
                record_mutation(generation)
    return parsed


def _claim_reconciliation():
    # UPDATE is the first statement in the caller's short write transaction.
    # Its row count atomically claims the currently persisted intent. A later
    # enqueue writes after commit and cannot be overwritten by a stale object.
    return bool(ScanState.objects.filter(pk=1, reconcile_needed=True).update(reconcile_needed=False))


def _start(state, kind):
    active = IndexGeneration.objects.filter(state='active').first()
    requested = state.requested
    with transaction.atomic():
        if _claim_reconciliation() and kind != 'rebuild':
            kind = 'verify'
        generation = IndexGeneration.objects.create() if kind == 'rebuild' or active is None else active
        state.checkpoint = {'kind': kind, 'generation': generation.pk, 'token': uuid.uuid4().hex,
                            'stack': [{'path': '', 'offset': 0}], 'phase': 'discover',
                            'metadata_checked': 0, 'parsed_notes': 0, 'dependencies_checked': 0}
        state.processed = state.discovered = state.errors = 0
        state.requested = ''
        state.initialized = True
        state.reconcile_needed = False
        state.save(update_fields=['checkpoint', 'processed', 'discovered', 'errors', 'initialized'])
        ScanState.objects.filter(pk=1, requested=requested).update(requested='')


def _restart_for_reconciliation(state):
    with transaction.atomic():
        if not _claim_reconciliation():
            return
        # An overflow during an existing pass must verify content again,
        # including paths already visited before the dropped revision arrived.
        state.checkpoint.pop('scan_policy', None)
        state.checkpoint.pop('cursor_token', None)
        state.checkpoint.pop('paths', None)
        state.checkpoint.update(kind='verify', phase='discover', token=uuid.uuid4().hex,
                                stack=[{'path': '', 'offset': 0}])
        state.processed = state.discovered = state.errors = 0
        state.reconcile_needed = False
        state.save(update_fields=['checkpoint', 'processed', 'discovered', 'errors'])


def _pending():
    return (IndexJob.objects.exists()
            or ScanState.objects.filter(pk=1, reconcile_needed=True).exists()
            or ScanState.objects.filter(pk=1).exclude(requested='').exists())


def _schedule(state, now):
    changes = []
    if not state.next_incremental:
        state.next_incremental = now + settings.BACKSTORY_INDEX_INCREMENTAL_SECONDS
        state.next_verify = now + settings.BACKSTORY_INDEX_VERIFY_SECONDS
        changes += ['next_incremental', 'next_verify']
    if not state.checkpoint:
        kind = state.requested
        if not state.initialized:
            kind = 'rebuild'
        elif not kind and now >= state.next_verify:
            kind = 'verify'
        elif not kind and (state.reconcile_needed or now >= state.next_incremental):
            kind = 'verify' if state.reconcile_needed else 'incremental'
        if kind:
            _start(state, kind)
    if changes:
        state.save(update_fields=changes)


def _finish(state, generation, now):
    require_ready()
    # Prioritized writes are replayed into both generations before publication.
    with transaction.atomic():
        # Keep the pending-work check and publication in one serialized write.
        ScanState.objects.filter(pk=1).update(errors=F('errors'))
        if IndexJob.objects.exists():
            return False
        if ScanState.objects.filter(pk=1, reconcile_needed=True).exists():
            _restart_for_reconciliation(state)
            return False
        stale = IndexedNote.objects.filter(generation=generation).exclude(seen=state.checkpoint['token'])
        with connection.cursor() as cursor:
            cursor.execute('DELETE FROM indexed_fts WHERE rowid IN (SELECT id FROM indexing_indexednote WHERE generation_id=%s AND seen != %s)', [generation.pk, state.checkpoint['token']])
        from .graph_projection import dirty_dependents, namespace_keys, record_mutation
        # Deletion invalidates absent-path and name lookups before their inputs
        # disappear, in the same transaction as namespace publication.
        removed = False
        for note in stale.defer('body', 'projection', 'tags', 'stat').order_by('pk')[:BATCH_SIZE]:
            dirty_dependents(generation, namespace_keys(note))
            note.delete()
            removed = True
        if removed:
            record_mutation(generation)
        if stale.exists():
            return False
        if generation.state == 'building':
            IndexGeneration.objects.filter(state='active').update(state='retired')
            generation.state = 'active'
            generation.save(update_fields=['state'])
        if state.checkpoint.get("kind") in {"verify", "rebuild"}:
            state.last_verified = now
        state.checkpoint = {}
        state.errors = 0
        state.last_error = ''
        state.backoff_until = 0
        state.last_completed = now
        state.next_incremental = now + settings.BACKSTORY_INDEX_INCREMENTAL_SECONDS
        if state.next_verify <= now:
            state.next_verify = now + settings.BACKSTORY_INDEX_VERIFY_SECONDS
        state.save(update_fields=['checkpoint', 'errors', 'last_error', 'backoff_until', 'last_completed', 'last_verified', 'next_incremental', 'next_verify'])
    return True


def _remove_marker_entries():
    """Revoke administrative metadata only, independently of storage health.

    This is a policy cleanup, never an inference that other notes disappeared.
    Search/resolution already recheck policy while this maintenance is pending.
    """
    path = settings.BACKSTORY_IDENTITY_PATH
    with transaction.atomic():
        with connection.cursor() as cursor:
            cursor.execute('DELETE FROM indexed_fts WHERE path=%s', [path])
        IndexedNote.objects.filter(path=path).only('id').delete()
        IndexJob.objects.filter(path=path).delete()


def _run(now, progress):
    _remove_marker_entries()
    state, _ = ScanState.objects.get_or_create(pk=1)
    if state.backoff_until > now:
        return BatchResult(pending=True, state='backoff')
    _schedule(state, now)
    require_ready()
    cp = state.checkpoint
    generations = list(IndexGeneration.objects.filter(state__in=['active', 'building']))
    token = cp.get('token', '')
    processed = priority = expensive = 0
    started = time.monotonic()
    limit = max(1, min(settings.BACKSTORY_INDEX_BATCH_SIZE, 128))
    metadata_limit = max(1, min(getattr(settings, 'BACKSTORY_INDEX_METADATA_BATCH_SIZE', 256), 1024))
    # Each path job carries an independent version. Repeated/same-revision events
    # arriving during a read/commit survive acknowledgement of the older job.
    for job in list(IndexJob.objects.filter(not_before__lte=now).order_by('updated', 'pk')[:limit]):
        if priority and time.monotonic() - started >= .1:
            break
        observed_kind = None
        if job.invalidated:
            from .graph_projection import path_fingerprint
            observed_kind = path_fingerprint(job.path)
            if observed_kind != 'missing' and job.missing_since is not None:
                # Reappearance ends the prior absence, even if another rename
                # races the next check. A later absence needs fresh grace.
                IndexJob.objects.filter(pk=job.pk, version=job.version).update(missing_since=None)
                job.missing_since = None
            if observed_kind == 'missing':
                if job.missing_since is None:
                    # Absence starts its own grace period even for a long-lived
                    # coalesced edit. Newer versions reset this observation.
                    IndexJob.objects.filter(pk=job.pk, version=job.version).update(
                        missing_since=now, not_before=now + 2)
                    continue
                if now < job.missing_since + 2:
                    continue
        if job.invalidated:
            parsed = _process_invalidation(job.path, generations, token,
                                           allow_missing=observed_kind == 'missing' and job.missing_since is not None and now >= job.missing_since + 2)
            if cp:
                cp['parsed_notes'] = cp.get('parsed_notes', 0) + bool(parsed)
        else:
            try:
                snapshot = read_note(job.path)
            except StorageError as error:
                if error.reason_code not in {'not_found', 'path_denied'}:
                    raise
                from .queue import require_reconciliation
                require_reconciliation()
            else:
                parsed = _commit_projection(snapshot, file_stat(job.path), generations, token)
                if cp:
                    cp['parsed_notes'] = cp.get('parsed_notes', 0) + bool(parsed)
        IndexJob.objects.filter(pk=job.pk, version=job.version).delete()
        priority += 1
        expensive += 1
        progress[0] = priority
    if not cp:
        return BatchResult(priority, priority, _pending(), 'ready', expensive)
    generation = IndexGeneration.objects.get(pk=cp['generation'])
    remaining = limit - priority
    if remaining == 0:
        state.checkpoint = cp
        state.save(update_fields=['checkpoint'])
        return BatchResult(priority, priority, True, 'partial', expensive)
    if cp['phase'] == 'discover':
        # Keep discovered-but-not-read paths in a bounded durable buffer. Cheap
        # stat work has its own budget; expensive reads still honor note limits.
        paths = cp.get('paths', [])
        if not paths:
            paths, cp['walk_complete'] = next_paths(cp, metadata_limit, entry_limit=metadata_limit * 2)
        existing = dict(IndexedNote.objects.filter(generation=generation, path__in=paths)
                        .values_list('path', 'stat'))
        unchanged = []
        consumed = 0
        for path in paths:
            if expensive >= limit or time.monotonic() - started >= .1:
                break
            info = file_stat(path)
            cp['metadata_checked'] = cp.get('metadata_checked', 0) + 1
            if cp['kind'] == 'incremental' and existing.get(path) == info:
                unchanged.append(path)
            else:
                snapshot = read_note(path)
                parsed = _commit_projection(snapshot, info, [generation], token)
                expensive += 1
                cp['parsed_notes'] = cp.get('parsed_notes', 0) + bool(parsed)
            consumed += 1
            processed += 1
        if unchanged:
            IndexedNote.objects.filter(generation=generation, path__in=unchanged).update(seen=token)
        cp['paths'] = paths[consumed:]
        state.processed += processed
        state.discovered += consumed
        if not cp['paths'] and cp.get('walk_complete'):
            cp.update(phase='validate', after=0)
    elif cp['phase'] == 'validate':
        # Full candidate body validation remains mandatory. Ordinary active
        # reconciliation only reads metadata columns in bounded sets.
        budget = remaining if generation.state == 'building' else metadata_limit
        notes = list(IndexedNote.objects.filter(generation=generation, seen=token, pk__gt=cp.get('after', 0))
                     .only('id', 'path', 'revision', 'stat').order_by('pk')[:budget])
        for note in notes:
            if expensive >= limit or time.monotonic() - started >= .1:
                break
            info = file_stat(note.path)
            cp['metadata_checked'] = cp.get('metadata_checked', 0) + 1
            if generation.state == 'building' or info != note.stat:
                snapshot = read_note(note.path)
                expensive += 1
                if snapshot.revision != note.revision or info != note.stat:
                    parsed = _commit_projection(snapshot, info, [generation], token)
                    cp['parsed_notes'] = cp.get('parsed_notes', 0) + bool(parsed)
            cp['after'] = note.pk
            processed += 1
        if len(notes) < budget and processed == len(notes):
            cp.update(phase='dependencies', after=0)
    else:
        from .graph_projection import verify_path_batch
        previous = cp.get('after', 0)
        counts = []
        cp['after'], complete = verify_path_batch(generation, previous, metadata_limit, checked_count=counts)
        cp['dependencies_checked'] = cp.get('dependencies_checked', 0) + counts[0]
        if complete:
            complete = _finish(state, generation, now)
            return BatchResult(processed + priority, priority, not complete or _pending(), 'ready' if complete else 'partial', expensive)
    state.checkpoint = cp
    state.errors = 0
    state.last_error = ''
    state.save(update_fields=['checkpoint', 'processed', 'discovered', 'errors', 'last_error'])
    return BatchResult(processed + priority, priority, True, 'partial', expensive)


def run_batch(now=None):
    now = time.time() if now is None else now
    with lease() as acquired:
        if not acquired:
            return BatchResult(pending=True, state='leased')
        progress = [0]
        try:
            from .graph_projection import run_relation_batch
            relation_pending = run_relation_batch()
            if relation_pending is not None:
                return BatchResult(pending=relation_pending, state='relations' if relation_pending else 'ready')
            result = _run(now, progress)
            if not result.pending and result.state == 'ready':
                relation_pending = run_relation_batch()
                if relation_pending:
                    return BatchResult(result.processed, result.priority, True, 'relations')
            return result
        except (StorageError, OSError, OperationalError) as error:
            record_failure("worker", error)
            try:
                state, _ = ScanState.objects.get_or_create(pk=1)
                state.errors += 1
                state.last_error = error.reason_code if isinstance(error, StorageError) else failure_reason(error)
                state.backoff_until = now + min(300, 5 * 2 ** min(state.errors - 1, 6))
                if state.checkpoint:
                    # Retry the complete scan, retaining useful old rows and the
                    # candidate. A failed pass never performs reconciliation.
                    cp = state.checkpoint
                    cp.pop('scan_policy', None)
                    cp.pop('cursor_token', None)
                    cp.pop('paths', None)
                    cp.update(stack=[{'path': '', 'offset': 0}], phase='discover', token=uuid.uuid4().hex)
                    state.checkpoint = cp
                    state.processed = state.discovered = 0
                state.save(update_fields=['checkpoint', 'errors', 'last_error', 'backoff_until', 'processed', 'discovered'])
            except OperationalError as persist_error:
                record_failure("worker_failure_state", persist_error)
            return BatchResult(progress[0], progress[0], pending=True, state='backoff')


def index_status():
    state = ScanState.objects.filter(pk=1).first()
    generation = IndexGeneration.objects.filter(state='active').first()
    ready = check_readiness().state == 'ready'
    status = 'unavailable' if not ready else 'backoff' if state and state.backoff_until > time.time() else 'partial' if not generation or state and state.checkpoint else 'stale' if state and (state.requested or state.reconcile_needed or IndexJob.objects.exists()) else 'ready'
    return IndexStatus(status, state.processed if state else 0, state.discovered if state else 0,
                       IndexJob.objects.count(), state.last_completed if state else 0,
                       min(state.next_incremental, state.next_verify) if state else 0,
                       state.errors if state else 0, state.last_error if state else '', generation.pk if generation else None,
                       state.checkpoint.get('phase', 'relations' if generation and IndexedNote.objects.filter(generation=generation, relations_dirty=True).exists() else 'idle') if state else 'idle',
                       state.checkpoint.get('metadata_checked', 0) if state else 0,
                       state.checkpoint.get('parsed_notes', 0) if state else 0,
                       state.checkpoint.get('dependencies_checked', 0) if state else 0,
                       state.last_verified if state else 0,
                       state.watcher.get('mode', 'poll') if state else 'poll',
                       state.watcher.get('health', 'starting') if state else 'starting',
                       state.watcher.get('reason', '') if state else '')
