"""Transport-neutral bounded relocation reviews and retained history reads."""
from datetime import timedelta
import hashlib
import json
import os
import stat
import uuid

from django.conf import settings
from django.core import signing
from django.db import DatabaseError
from django.db.models import Count, Max
from django.urls import reverse
from django.utils import timezone

from .actors import owner_fields
from .contracts import PathDenied, StorageError
from .models import MoveOperation, MovePreviewJob, SavedRevision
from .policy import policy_version
from .revisions import recovery_path, restore_revision
from .storage import open_directory, read_note
from . import move_previews, relocations

MAX_REVIEW_BYTES = 512 * 1024
_REVIEW_SALT = 'backstory.tool.move-review.v1'
_HISTORY_SALT = 'backstory.tool.history.v1'

def _eligible(access, path):
    """Reapply current policy and no-follow checks before disclosing old paths."""
    access.authorize(path)
    parent, _, name = path.rpartition('/')
    try:
        with open_directory(parent) as directory:
            try:
                info = os.stat(name, dir_fd=directory, follow_symlinks=False)
            except FileNotFoundError:
                return
            if not (stat.S_ISREG(info.st_mode) or stat.S_ISDIR(info.st_mode)):
                raise PathDenied()
    except StorageError as error:
        if error.reason_code != 'not_found':
            raise

def _operation(access, value):
    try:
        if not isinstance(value, str) or len(value) != 36:
            raise ValueError
        operation_id = uuid.UUID(value)
    except (ValueError, TypeError, AttributeError):
        raise StorageError('invalid_operation_id') from None
    try:
        try:
            if access.key.startswith('local:'):
                raise MovePreviewJob.DoesNotExist
            return MovePreviewJob.objects.get(pk=operation_id, actor=access.actor)
        except MovePreviewJob.DoesNotExist:
            # Publication replaces job -> operation atomically. Looking for the
            # job first permits a stale preparing read, never an absent handle.
            return MoveOperation.objects.get(pk=operation_id, **owner_fields(access.actor))
    except MoveOperation.DoesNotExist:
        raise StorageError('not_found', 404) from None
    except DatabaseError:
        raise StorageError('move_unavailable', 503) from None

def _review(access, operation, *, max_review_bytes=MAX_REVIEW_BYTES):
    plan = operation.plan
    source, destination = operation.source, operation.destination
    inventory = [{'path': row['path'], 'destination': destination + row['path'][len(source):],
                  'kind': row['kind'], 'size': row['size']} for row in plan['inventory']]
    changes = [{key: row[key] for key in ('path', 'destination', 'links', 'diff')} for row in plan['changes']]
    affected = sorted({source, destination} | {row[key] for row in inventory + changes for key in ('path', 'destination')})
    for path in affected:
        _eligible(access, path)
    if plan['policy'] != policy_version():
        raise StorageError('move_policy_changed', 409)
    if operation.state == 'preview' and operation.created_at < timezone.now() - timedelta(minutes=30):
        raise StorageError('move_preview_expired', 409)
    data = {'operation_id': str(operation.pk), 'source': source, 'source_path': source, 'destination': destination,
            'kind': 'note' if stat.S_ISREG(plan['source_identity'][2]) else 'folder',
            'inventory': inventory, 'changes': changes, 'affected_paths': affected}
    # Reserve room for token, envelope, state and readback metadata. Source
    # readback is separate from the review budget and uses the normal note cap.
    if len(json.dumps(data, ensure_ascii=True).encode()) + 2048 > max_review_bytes:
        raise StorageError('move_review_too_large', 413)
    return data

def _review_binding(access, operation, review):
    digest = hashlib.sha256(json.dumps(review, sort_keys=True, ensure_ascii=True).encode()).hexdigest()
    return {'actor': access.key, 'operation_id': str(operation.pk),
            'policy': policy_version(), 'digest': digest}

def _move_data(access, operation, *, expected_revision=None, max_review_bytes=MAX_REVIEW_BYTES):
    if isinstance(operation, MovePreviewJob):
        return _preparation_data(access, operation)
    review = _review(access, operation, max_review_bytes=max_review_bytes)
    data = {**review, 'state': operation.state, 'reason_code': operation.reason_code,
            'index_state': operation.index_state, 'authoritative': False,
            'review_token': signing.dumps(_review_binding(access, operation, review), salt=_REVIEW_SALT)}
    if operation.state in {'completed', 'cancelled'}:
        path = operation.destination if operation.state == 'completed' else operation.source
        try:
            if review['kind'] == 'note':
                note = read_note(path)
                if expected_revision and note.revision != expected_revision:
                    raise StorageError('move_readback_changed', 503)
                data.update(path=path, href=reverse('wiki:note', args=[path]), source=note.source,
                            revision=note.revision, bom=note.bom, newline=note.newline, authoritative=True)
            else:
                with open_directory(path) as directory:
                    identity = operation.plan['source_identity']
                    info = os.fstat(directory)
                    if [info.st_dev, info.st_ino] != identity[:2]:
                        raise StorageError('move_readback_changed', 503)
                data.update(path=path, verified=True, authoritative=True)
        except StorageError:
            data.update(state='uncertain', operation_state=operation.state,
                        reason_code='move_readback_unconfirmed', inspect_before_retry=True)
    elif operation.state != 'preview':
        data['inspect_before_retry'] = True
    return data

def _preparation_data(access, job):
    for path in (job.source, job.destination):
        _eligible(access, path)
    if job.context['policy'] != policy_version():
        raise StorageError('move_policy_changed', 409)
    move_previews.assert_preview_storage_context(job)
    state = {'queued': 'preparing', 'running': 'preparing',
             'failed': 'preview_failed', 'cancelled': 'cancelled'}[job.state]
    data = {'operation_id': str(job.pk), 'source': job.source, 'source_path': job.source,
            'destination': job.destination, 'kind': job.context['kind'],
            'affected_paths': [job.source, job.destination], 'state': state,
            'reason_code': job.reason_code, 'authoritative': False}
    if state == 'preparing':
        data.update(poll_after_ms=1000, next_action='get_move')
    return data

def _revision_id(value):
    if isinstance(value, bool) or not isinstance(value, (int, str)):
        raise StorageError('invalid_revision_id')
    spelling = str(value)
    if not spelling.isascii() or not spelling.isdigit() or len(spelling) > 18 or int(spelling) < 1:
        raise StorageError('invalid_revision_id')
    return int(spelling)

def _metadata(row):
    return {'revision_id': row.pk, 'created_at': row.created_at.isoformat(), 'base_revision': row.base_revision}

def _historical_source(row):
    raw = bytes(row.original)
    if len(raw) > settings.BACKSTORY_NOTE_MAX_BYTES:
        raise StorageError('note_too_large', 413)
    bom = raw.startswith(b'\xef\xbb\xbf')
    try:
        source = (raw[3:] if bom else raw).decode('utf-8')
    except UnicodeError:
        raise StorageError('history_source_invalid', 422) from None
    newline = '\r\n' if '\r\n' in source else '\r' if '\r' in source else '\n'
    return {'source': source, 'bom': bom, 'newline': newline,
            'revision': '"' + hashlib.sha256(raw).hexdigest() + '"'}


def history_record(access, value):
    try:
        row = SavedRevision.objects.get(pk=_revision_id(value))
    except SavedRevision.DoesNotExist:
        raise StorageError('not_found', 404) from None
    except DatabaseError:
        raise StorageError('history_unavailable', 503) from None
    access.authorize(row.path)
    recovery_path(row.path)
    return row


def list_history(access, path, *, cursor=None, limit=30):
    access.authorize(path)
    path = recovery_path(path)
    try:
        rows = SavedRevision.objects.filter(path=path)
        generation = rows.aggregate(count=Count('pk'), latest=Max('pk'))
        binding = {'actor': access.key, 'path': path, 'policy': policy_version(), 'generation': generation}
        after = None
        if cursor:
            try:
                decoded = signing.loads(cursor, salt=_HISTORY_SALT, max_age=900)
                if not isinstance(decoded, dict) or decoded.get('binding') != binding:
                    raise ValueError
                after = _revision_id(decoded.get('after'))
            except (signing.BadSignature, ValueError, TypeError, StorageError):
                raise StorageError('cursor_invalid') from None
        if after is not None:
            rows = rows.filter(pk__lt=after)
        page = list(rows.only('pk', 'created_at', 'base_revision').order_by('-pk')[:limit + 1])
        more = len(page) > limit
        page = page[:limit]
        next_cursor = signing.dumps({'binding': binding, 'after': page[-1].pk}, salt=_HISTORY_SALT) if more else None
        return {'state': 'ok', 'path': path, 'items': [_metadata(row) for row in page],
                'next_cursor': next_cursor, 'authoritative': False}
    except DatabaseError:
        raise StorageError('history_unavailable', 503) from None


def mutate_move(access, operation_id, *, review_token=None, rollback=False):
    operation = _operation(access, operation_id)
    if isinstance(operation, MovePreviewJob):
        raise StorageError('move_preview_not_ready', 409)
    review = _review(access, operation)
    if not rollback:
        try:
            binding = signing.loads(review_token, salt=_REVIEW_SALT, max_age=1800)
            if binding != _review_binding(access, operation, review):
                raise ValueError
        except (signing.BadSignature, ValueError, TypeError):
            raise StorageError('invalid_move_review') from None
    expected = None
    if not rollback and operation.state not in {'completed', 'cancelled'} and review['kind'] == 'note':
        changed = next((row for row in operation.plan['changes'] if row['path'] == operation.source), None)
        expected = ('"' + hashlib.sha256(relocations._raw(changed['after'])).hexdigest() + '"'
                    if changed else operation.plan['witnesses'][operation.source][-1])
    try:
        action = relocations.rollback_move if rollback else relocations.commit_move
        action(access.actor, operation.pk)
    except StorageError:
        raise
    except Exception:
        return {**review, 'state': 'uncertain', 'reason_code': 'move_outcome_unknown',
                'authoritative': False, 'inspect_before_retry': True}
    try:
        return _move_data(access, _operation(access, str(operation.pk)), expected_revision=expected)
    except (StorageError, DatabaseError, OSError):
        return {'operation_id': str(operation.pk), 'state': 'uncertain',
                'reason_code': 'move_readback_unconfirmed', 'authoritative': False,
                'inspect_before_retry': True}
