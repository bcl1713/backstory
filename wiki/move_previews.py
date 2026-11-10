"""Durable, read-only move preparation owned by the supervised index worker."""
from datetime import timedelta
import json
import os
import stat

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import DatabaseError, transaction
from django.db.models import F
from django.utils import timezone

from . import relocations
from .contracts import StorageError
from .models import MoveOperation, MovePreviewJob
from .policy import policy_version, validate_path
from .revisions import application_lock, _check_quota, _prune, _record_charge
from .storage import _FILE_FLAGS, _os_error, open_directory, require_ready


def _identity(directory):
    info = os.fstat(directory)
    return [info.st_dev, info.st_ino]


def _storage_context():
    require_ready()
    marker_path = validate_path(settings.BACKSTORY_IDENTITY_PATH, 'identity')
    with open_directory() as root:
        try:
            marker = os.open(marker_path, _FILE_FLAGS, dir_fd=root)
            try:
                info = os.fstat(marker)
                if not stat.S_ISREG(info.st_mode):
                    raise StorageError('move_preview_context_changed', 409)
                return {'root': _identity(root), 'marker': relocations._fingerprint(info),
                    'marker_path': marker_path, 'root_path': os.fspath(settings.BACKSTORY_WIKI_ROOT)}
            finally:
                os.close(marker)
        except OSError as error:
            raise _os_error(error) from None


def preview_context(source, destination):
    """Bounded descriptor operations only: no source read, scan, or link parse."""
    context = _storage_context()
    info, destination_parent = relocations._preflight(source, destination)
    with open_directory(source.rpartition('/')[0]) as parent:
        source_parent = _identity(parent)
    return context | {'policy': policy_version(), 'kind': 'folder' if stat.S_ISDIR(info.st_mode) else 'note',
        'source_identity': relocations._fingerprint(info), 'source_parent': source_parent,
        'destination_parent': destination_parent}


def assert_preview_storage_context(job):
    current = _storage_context()
    if any(job.context.get(key) != value for key, value in current.items()):
        raise StorageError('move_preview_context_changed', 409)


def assert_preview_context(job):
    if job.created_at <= timezone.now() - timedelta(minutes=30):
        raise StorageError('move_preview_expired', 409)
    if not get_user_model().objects.filter(pk=job.actor_id, is_active=True).exists():
        raise StorageError('move_preview_actor_revoked', 403)
    if preview_context(job.source, job.destination) != job.context:
        raise StorageError('move_preview_context_changed', 409)


def _capacity():
    if (MoveOperation.objects.filter(state='preview').count()
            + MovePreviewJob.objects.filter(state__in=['queued', 'running']).count()) >= 32:
        raise StorageError('move_preview_capacity', 503)


def _journal_quota(extra, *, exclude_job=None):
    try:
        _check_quota(extra, exclude_move_preview=exclude_job)
    except StorageError as error:
        if error.reason_code == 'backup_quota_exceeded':
            raise StorageError('move_journal_capacity', 503) from None
        raise


def enqueue_move_preview(actor, source, destination):
    relocations._actor(actor)
    context = preview_context(source, destination)
    job = MovePreviewJob(actor=actor, source=source, destination=destination, context=context)
    try:
        # Queueing never joins wiki-write or waits on another quota owner.
        with application_lock('revision-quota', blocking=False), transaction.atomic():
            MovePreviewJob.objects.filter(pk=job.pk).update(state=F('state'))
            _prune(timezone.now())
            _capacity()
            _journal_quota(_record_charge(source, destination, json.dumps(context).encode()) + 128)
            job.save(force_insert=True)
        return job
    except (DatabaseError, OSError):
        raise StorageError('move_preview_unavailable', 503) from None


def cancel_move_preview(actor, operation_id):
    relocations._actor(actor)
    try:
        # The first statement reserves SQLite's writer; publication and cancel
        # cannot both win. No filesystem lock or planner transaction is held.
        with transaction.atomic():
            MovePreviewJob.objects.filter(pk=operation_id, actor=actor,
                state__in=['queued', 'running', 'failed']).update(state='cancelled', reason_code='', settled_at=timezone.now())
            job = MovePreviewJob.objects.filter(pk=operation_id, actor=actor).first()
            if job is not None:
                return job
            operation = MoveOperation.objects.filter(pk=operation_id, actor=actor).first()
            if operation is not None:
                return operation
    except (DatabaseError, OSError):
        raise StorageError('move_preview_unavailable', 503) from None
    raise StorageError('not_found', 404)


def _fail(job, error):
    reason = error.reason_code if isinstance(error, StorageError) else 'move_preview_unavailable'
    # Only known application reason codes, never exception messages, persist.
    MovePreviewJob.objects.filter(pk=job.pk, state__in=['queued', 'running']).update(state='failed', reason_code=reason, settled_at=timezone.now())


def _run_owned():
    # Holding the exclusive worker lease proves no live owner can be preparing
    # these rows. Do not replay a process that died mid-planning.
    interrupted = MovePreviewJob.objects.filter(state='running').update(
        state='failed', reason_code='move_preview_interrupted', settled_at=timezone.now())
    job = MovePreviewJob.objects.filter(state='queued').order_by('created_at', 'id').first()
    if job is None:
        return bool(interrupted)
    try:
        with application_lock('wiki-write', blocking=False):
            relocations.assert_writes_available()
            if not MovePreviewJob.objects.filter(pk=job.pk, state='queued').update(state='running'):
                return True
            from .staging import cleanup_staged_saves
            cleanup_staged_saves()
            assert_preview_context(job)
            plan = relocations._plan(job.source, job.destination)
            assert_preview_context(job)
            if any(plan[key] != job.context[key] for key in ['policy', 'source_identity', 'destination_parent']):
                raise StorageError('move_preview_context_changed', 409)
            operation = MoveOperation(id=job.pk, actor_id=job.actor_id,
                source=job.source, destination=job.destination, plan=plan)
            with application_lock('revision-quota', blocking=False), transaction.atomic():
                MovePreviewJob.objects.filter(pk=job.pk).update(state=F('state'))
                current = MovePreviewJob.objects.get(pk=job.pk)
                if current.state != 'running':
                    return True
                # Actor/policy/identity/expiry and cancellation are checked again
                # after planning while publication owns the short DB writer.
                assert_preview_context(current)
                _journal_quota(len(json.dumps(plan).encode()), exclude_job=job.pk)
                operation.save(force_insert=True)
                current.delete()
            return True
    except BlockingIOError:
        # A busy wiki writer leaves queued metadata untouched. A busy quota
        # publisher after planning settles safely; it never retries a mutation.
        job.refresh_from_db()
        if job.state == 'running':
            _fail(job, StorageError('move_preview_unavailable', 503))
        return bool(interrupted) or job.state != 'queued'
    except Exception as error:
        try:
            _fail(job, error)
        except DatabaseError:
            # If the DB remains unavailable, the next owner marks the running
            # row interrupted. No partial operation or content was published.
            pass
        return True


def run_pending_move_preview():
    """Prepare at most one queued job, without waiting on another worker."""
    try:
        with application_lock('move-preview-worker', blocking=False):
            return _run_owned()
    except (DatabaseError, OSError):
        return False
