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
    # A fresh hash immediately before commit rejects a stale bulk snapshot.
    projection = project_note(snapshot)
    if read_note(snapshot.path).revision != snapshot.revision or file_stat(snapshot.path) != info:
        raise StorageError('index_revision_changed', 503)
    with transaction.atomic():
        # Reserve SQLite write intent before update_or_create reads a snapshot.
        ScanState.objects.filter(pk=1).update(errors=F('errors'))
        for generation in generations:
            note, _ = IndexedNote.objects.update_or_create(generation=generation, path=snapshot.path, defaults={
                'revision': snapshot.revision, 'stat': info, 'title': projection.title,
                'ids': list(projection.ids), 'aliases': list(projection.aliases), 'tags': list(projection.tags),
                'projection': {'metadata': _json_tree(projection.typed_metadata),
                               'diagnostics': [item.code for item in projection.diagnostics]},
                'body': projection.body, 'seen': token,
            })
            from .names import note_names
            IndexedName.objects.filter(note=note).delete()
            IndexedName.objects.bulk_create([IndexedName(note=note, name=name, resolvable=resolvable) for name, resolvable in note_names(note.path, note.title, note.ids, note.aliases)])
            LinkEdge.objects.filter(note=note).delete()
            LinkEdge.objects.bulk_create([LinkEdge(note=note, target=edge.target, kind=edge.kind,
                                                    fragment=edge.fragment, position=list(edge.position)) for edge in projection.edges])
            with connection.cursor() as cursor:
                cursor.execute('DELETE FROM indexed_fts WHERE rowid = %s', [note.pk])
                cursor.execute('INSERT INTO indexed_fts(rowid,path,title,body,generation) VALUES (%s,%s,%s,%s,%s)',
                               [note.pk, note.path, note.title, note.body, generation.pk])


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
                            'stack': [{'path': '', 'offset': 0}], 'phase': 'discover'}
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
    if state.checkpoint and state.reconcile_needed:
        _restart_for_reconciliation(state)
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
        if IndexJob.objects.exists() or ScanState.objects.filter(pk=1, reconcile_needed=True).exists():
            return False
        stale = IndexedNote.objects.filter(generation=generation).exclude(seen=state.checkpoint['token'])
        with connection.cursor() as cursor:
            cursor.execute('DELETE FROM indexed_fts WHERE rowid IN (SELECT id FROM indexing_indexednote WHERE generation_id=%s AND seen != %s)', [generation.pk, state.checkpoint['token']])
        stale.delete()
        if generation.state == 'building':
            IndexGeneration.objects.filter(state='active').update(state='retired')
            generation.state = 'active'
            generation.save(update_fields=['state'])
        state.checkpoint = {}
        state.errors = 0
        state.last_error = ''
        state.backoff_until = 0
        state.last_completed = now
        state.next_incremental = now + settings.BACKSTORY_INDEX_INCREMENTAL_SECONDS
        if state.next_verify <= now:
            state.next_verify = now + settings.BACKSTORY_INDEX_VERIFY_SECONDS
        state.save(update_fields=['checkpoint', 'errors', 'last_error', 'backoff_until', 'last_completed', 'next_incremental', 'next_verify'])
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
        IndexedNote.objects.filter(path=path).delete()
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
    processed = priority = 0
    limit = max(1, min(settings.BACKSTORY_INDEX_BATCH_SIZE, BATCH_SIZE))
    # Priority work consumes the same I/O allowance as bulk work.
    for job in list(IndexJob.objects.order_by('updated', 'pk')[:limit]):
        try:
            snapshot = read_note(job.path)
        except StorageError as error:
            if error.reason_code not in {'not_found', 'path_denied'}:
                raise
            IndexJob.objects.filter(pk=job.pk, revision=job.revision).delete()
            ScanState.objects.filter(pk=1).update(reconcile_needed=True)
            continue
        _commit_projection(snapshot, file_stat(job.path), generations, token)
        IndexJob.objects.filter(pk=job.pk, revision=job.revision).delete()
        priority += 1
        progress[0] = priority
    if not cp:
        return BatchResult(priority, priority, _pending(), 'ready')
    generation = IndexGeneration.objects.get(pk=cp['generation'])
    remaining = limit - priority
    if remaining == 0:
        return BatchResult(priority, priority, True, 'partial')
    if cp['phase'] == 'discover':
        paths, complete = next_paths(cp, remaining)
        for path in paths:
            info = file_stat(path)
            existing = IndexedNote.objects.filter(generation=generation, path=path).first()
            if cp['kind'] == 'incremental' and existing and existing.stat == info:
                IndexedNote.objects.filter(pk=existing.pk).update(seen=token)
            else:
                snapshot = read_note(path)
                _commit_projection(snapshot, info, [generation], token)
            processed += 1
        state.processed += processed
        state.discovered += len(paths)
        if complete:
            cp['phase'] = 'validate'
            cp['after'] = 0
    else:
        # Candidate promotion also revalidates revisions in bounded batches.
        notes = list(IndexedNote.objects.filter(generation=generation, seen=token, pk__gt=cp.get('after', 0)).order_by('pk')[:remaining])
        for note in notes:
            info = file_stat(note.path)
            if generation.state == 'building' or info != note.stat:
                snapshot = read_note(note.path)
                if snapshot.revision != note.revision or info != note.stat:
                    _commit_projection(snapshot, info, [generation], token)
            cp['after'] = note.pk
            processed += 1
        if len(notes) < remaining:
            complete = _finish(state, generation, now)
            return BatchResult(processed + priority, priority, not complete or _pending(), 'ready' if complete else 'partial')
    state.checkpoint = cp
    state.errors = 0
    state.last_error = ''
    state.save(update_fields=['checkpoint', 'processed', 'discovered', 'errors', 'last_error'])
    return BatchResult(processed + priority, priority, True, 'partial')


def run_batch(now=None):
    now = time.time() if now is None else now
    with lease() as acquired:
        if not acquired:
            return BatchResult(pending=True, state='leased')
        progress = [0]
        try:
            return _run(now, progress)
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
                       state.errors if state else 0, state.last_error if state else '', generation.pk if generation else None)
