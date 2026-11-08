"""One exact note or empty folder, with durable actor-owned recovery.

The shared application flock serializes cooperating writers. External filesystem
writers do not participate: final descriptor and byte checks narrow that race;
they cannot make unlink a filesystem compare-and-swap.
"""
from datetime import timedelta
import json
import os
import secrets
import stat
import uuid

from django.conf import settings
from django.core.exceptions import PermissionDenied
from django.db import DatabaseError, transaction
from django.utils import timezone

from .contracts import PathDenied, StorageError
from .models import MoveOperation, RemovalOperation
from .policy import policy_version, validate_path
from .relocations import _fingerprint, _rename_noreplace, assert_writes_available
from .revisions import application_lock, _check_quota, _record_charge
from .storage import open_directory, read_note, require_ready

_RECOVERING = ['applying', 'restoring', 'recovery_required']


def _actor(actor):
    if not actor.is_authenticated or not actor.is_active:
        raise PermissionDenied


def _validate(path, kind):
    if kind not in {'note', 'folder'}:
        raise StorageError('invalid_removal_request')
    validate_path(path, 'folder' if kind == 'folder' else 'content')
    if not path or kind == 'note' and not path.lower().endswith('.md'):
        raise PathDenied()


def _identity(info):
    return [info.st_dev, info.st_ino]


def _context(parent, directory):
    with open_directory() as root, open_directory(parent) as fresh:
        if _identity(os.fstat(directory)) != _identity(os.fstat(fresh)):
            raise StorageError('removal_parent_changed', 409)
        marker = os.stat(settings.BACKSTORY_IDENTITY_PATH, dir_fd=root, follow_symlinks=False)
        return {'root': _identity(os.fstat(root)), 'marker': _fingerprint(marker),
                'parent': _identity(os.fstat(fresh)), 'policy': policy_version()}


def _verify_context(operation, directory, *, allow_parent_restore=False):
    require_ready()
    current = _context(operation.path.rpartition('/')[0], directory)
    if any(operation.plan[key] != current[key] for key in ['root', 'marker', 'policy']):
        raise StorageError('removal_context_changed', 409)
    if operation.plan['parent'] != current['parent']:
        if not allow_parent_restore or not _restored_parent(operation, current):
            raise StorageError('removal_context_changed', 409)


def _restored_parent(operation, current):
    # A separately restored empty parent has a new inode. Only a completed
    # same-actor journal linking that exact old/new inode authorizes adoption.
    parent = operation.path.rpartition('/')[0]
    if not parent:
        return False
    candidates = RemovalOperation.objects.filter(actor_id=operation.actor_id,
        path=parent, kind='folder', state='restored').only('plan')
    return any(candidate.plan['identity'][:2] == operation.plan['parent']
        and candidate.plan.get('restore_identity') == current['parent']
        and all(candidate.plan[key] == current[key] for key in ['root', 'marker', 'policy'])
        for candidate in candidates)


def _info(name, directory):
    try:
        return os.stat(name, dir_fd=directory, follow_symlinks=False)
    except FileNotFoundError:
        return None


def _empty(path):
    with open_directory(path) as directory, os.scandir(directory) as entries:
        if next(entries, None) is not None:
            raise StorageError('removal_folder_not_empty', 409)


def _exact_original(operation, directory):
    name = operation.path.rpartition('/')[2]
    info = _info(name, directory)
    if info is None or _fingerprint(info) != operation.plan['identity']:
        raise StorageError('removal_target_changed', 412)
    if operation.kind == 'note':
        if not stat.S_ISREG(info.st_mode) or info.st_nlink != 1:
            raise StorageError('removal_target_changed', 412)
        if read_note(operation.path).raw_bytes != bytes(operation.original):
            raise StorageError('removal_target_changed', 412)
    else:
        _empty(operation.path)
    # Recheck the name after reading bytes/enumerating, before any mutation.
    latest = _info(name, directory)
    if latest is None or _fingerprint(latest) != operation.plan['identity']:
        raise StorageError('removal_target_changed', 412)


def _operation(actor, operation_id):
    _actor(actor)
    try:
        canonical = uuid.UUID(str(operation_id))
        if not isinstance(operation_id, str) or operation_id != str(canonical):
            raise StorageError('invalid_removal_request')
        operation = RemovalOperation.objects.get(pk=canonical, actor=actor)
    except RemovalOperation.DoesNotExist:
        raise StorageError('not_found', 404) from None
    except (ValueError, TypeError, AttributeError):
        raise StorageError('invalid_removal_request') from None
    _validate(operation.path, operation.kind)
    return operation


def _result(operation, *, authoritative=False, reason=None):
    state = 'recovery_required' if operation.state in _RECOVERING else operation.state
    return {'operation_id': str(operation.pk), 'state': state, 'path': operation.path,
            'kind': operation.kind, 'revision': operation.base_revision,
            'reason_code': operation.reason_code if reason is None else reason,
            'index_state': operation.index_state, 'authoritative': authoritative,
            'inspect_before_retry': state == 'recovery_required', 'affected_paths': [operation.path]}


def _inspect(operation):
    if operation.state in _RECOVERING:
        return _result(operation, reason=operation.reason_code or 'removal_recovery_required')
    try:
        parent, _, name = operation.path.rpartition('/')
        with open_directory(parent) as directory:
            _verify_context(operation, directory, allow_parent_restore=operation.state in {'removed', 'restored'})
            info = _info(name, directory)
            if operation.state == 'removed':
                if info is not None:
                    return _result(operation, reason='removal_restore_collision')
            elif operation.state == 'restored':
                _verify_restored(operation, directory)
            else:
                _exact_original(operation, directory)
        return _result(operation, authoritative=True)
    except (StorageError, OSError):
        return _result(operation, reason='removal_live_unconfirmed')


def preview_removal(actor, path, kind, revision=None):
    _actor(actor)
    _validate(path, kind)
    from .saves import parse_precondition
    if kind == 'note':
        if revision is None:
            raise StorageError('precondition_required', 428)
        parse_precondition(revision, None)
    elif revision is not None:
        raise StorageError('invalid_removal_request')
    try:
        with application_lock('wiki-write'):
            assert_writes_available()
            require_ready()
            parent, _, name = path.rpartition('/')
            with open_directory(parent) as directory:
                context = _context(parent, directory)
                info = _info(name, directory)
                if info is None:
                    raise StorageError('not_found', 404)
                if kind == 'note':
                    if not stat.S_ISREG(info.st_mode):
                        raise PathDenied()
                    if info.st_nlink != 1:
                        raise StorageError('hardlinked_removal_entry', 409)
                    snapshot = read_note(path)
                    if snapshot.revision != revision:
                        raise StorageError('revision_conflict', 412)
                    original = snapshot.raw_bytes
                else:
                    if not stat.S_ISDIR(info.st_mode):
                        raise PathDenied()
                    _empty(path)
                    original = b''
                plan = {**context, 'identity': _fingerprint(info), 'mode': stat.S_IMODE(info.st_mode) & 0o777}
                operation = RemovalOperation(actor=actor, path=path, kind=kind,
                    base_revision=revision, original=original, plan=plan)
                _verify_context(operation, directory)
                _exact_original(operation, directory)
                with application_lock('revision-quota'), transaction.atomic():
                    if RemovalOperation.objects.count() >= 1024:
                        raise StorageError('removal_capacity', 503)
                    _check_quota(_record_charge(path, revision, original, json.dumps(plan).encode(), kind.encode()) + 1024)
                    operation.save(force_insert=True)
            return _result(operation, authoritative=True)
    except (OSError, DatabaseError):
        raise StorageError('removal_unavailable', 503) from None


def get_removal(actor, operation_id):
    # Inspection never retries or rolls forward a filesystem mutation.
    with application_lock('wiki-write'):
        return _inspect(_operation(actor, operation_id))


def _failure(operation):
    persisted = RemovalOperation.objects.get(pk=operation.pk)
    if persisted.state in {'removed', 'restored', 'cancelled'}:
        return persisted
    persisted.state = 'recovery_required'
    persisted.reason_code = 'removal_recovery_required'
    persisted.save(update_fields=['state', 'reason_code'])
    return persisted


def _finish(operation, state):
    operation.state = state
    operation.reason_code = ''
    operation.index_state = 'pending'
    operation.save(update_fields=['state', 'reason_code', 'index_state'])
    try:
        from indexing.queue import request_scan
        request_scan('verify')
    except Exception:
        operation.index_state = 'failed'
        operation.save(update_fields=['index_state'])


def commit_removal(actor, operation_id):
    with application_lock('wiki-write'):
        operation = _operation(actor, operation_id)
        if operation.state != 'preview':
            return _inspect(operation)
        assert_writes_available()
        if operation.created_at < timezone.now() - timedelta(minutes=30):
            raise StorageError('removal_preview_expired', 409)
        parent, _, name = operation.path.rpartition('/')
        with open_directory(parent) as directory:
            _verify_context(operation, directory)
            _exact_original(operation, directory)
            # Raw recovery bytes were durably persisted at preview. Persist intent
            # before unlink/rmdir; interruption from here requires explicit restore.
            operation.state = 'applying'
            operation.save(update_fields=['state'])
            try:
                _verify_context(operation, directory)
                _exact_original(operation, directory)
                if operation.kind == 'note':
                    os.unlink(name, dir_fd=directory)
                else:
                    os.rmdir(name, dir_fd=directory)
                os.fsync(directory)
                _verify_context(operation, directory)
                if _info(name, directory) is not None:
                    raise StorageError('removal_target_changed', 409)
                _finish(operation, 'removed')
            except Exception:
                operation = _failure(operation)
        return _inspect(operation)


def _verify_restored(operation, directory, *, allow_stage=False):
    info = _info(operation.path.rpartition('/')[2], directory)
    if info is None or _identity(info) != operation.plan.get('restore_identity'):
        raise StorageError('removal_restore_collision', 409)
    if operation.kind == 'note':
        stage = _info(operation.plan.get('temporary', ''), directory) if allow_stage and operation.plan.get('temporary') else None
        owned_links = info.st_nlink == 1 or (info.st_nlink == 2 and stage is not None
            and _identity(stage) == operation.plan.get('restore_identity'))
        if not stat.S_ISREG(info.st_mode) or not owned_links or read_note(operation.path).raw_bytes != bytes(operation.original):
            raise StorageError('removal_restore_collision', 409)
    elif not stat.S_ISDIR(info.st_mode):
        raise StorageError('removal_restore_collision', 409)
    else:
        _empty(operation.path)


def _restore_stage(operation, directory):
    """Journal the staged inode before exclusive publication, including folders."""
    temporary = operation.plan.get('temporary')
    if temporary:
        info = _info(temporary, directory)
        if info is not None:
            if _identity(info) != operation.plan.get('restore_identity'):
                raise StorageError('removal_stage_changed', 409)
            if operation.kind == 'note' and not operation.plan.get('stage_ready'):
                _write_stage(operation, directory, temporary)
            return temporary
    temporary = '.backstory-tmp-' + secrets.token_hex(16)
    operation.plan['temporary'] = temporary
    operation.plan['stage_ready'] = False
    operation.save(update_fields=['plan'])
    if operation.kind == 'folder':
        os.mkdir(temporary, mode=0o700, dir_fd=directory)
        operation.plan['restore_identity'] = _identity(os.stat(temporary, dir_fd=directory, follow_symlinks=False))
        operation.plan['stage_ready'] = True
        operation.save(update_fields=['plan'])
    else:
        descriptor = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW | os.O_CLOEXEC,
                             0o600, dir_fd=directory)
        try:
            operation.plan['restore_identity'] = _identity(os.fstat(descriptor))
            operation.save(update_fields=['plan'])
        finally:
            os.close(descriptor)
        _write_stage(operation, directory, temporary)
    return temporary


def _write_stage(operation, directory, temporary):
    descriptor = os.open(temporary, os.O_WRONLY | os.O_NOFOLLOW | os.O_NONBLOCK | os.O_CLOEXEC, dir_fd=directory)
    with os.fdopen(descriptor, 'wb') as stream:
        info = os.fstat(stream.fileno())
        if (_identity(info) != operation.plan['restore_identity']
                or not stat.S_ISREG(info.st_mode) or info.st_nlink != 1):
            raise StorageError('removal_stage_changed', 409)
        # Only a journal-owned unpublished stage may be completed after failure.
        stream.truncate(0)
        stream.write(bytes(operation.original))
        stream.flush()
        os.fsync(stream.fileno())
    operation.plan['stage_ready'] = True
    operation.save(update_fields=['plan'])


def _verify_stage(operation, directory, temporary):
    info = _info(temporary, directory)
    if info is None or _identity(info) != operation.plan.get('restore_identity'):
        raise StorageError('removal_stage_changed', 409)
    if operation.kind == 'folder':
        if not stat.S_ISDIR(info.st_mode):
            raise StorageError('removal_stage_changed', 409)
        with open_directory('/'.join(filter(None, [operation.path.rpartition('/')[0], temporary]))) as staged:
            if _identity(os.fstat(staged)) != operation.plan['restore_identity']:
                raise StorageError('removal_stage_changed', 409)
            os.fchmod(staged, operation.plan['mode'])
            os.fsync(staged)
            with os.scandir(staged) as entries:
                if next(entries, None) is not None:
                    raise StorageError('removal_stage_changed', 409)
    else:
        if not stat.S_ISREG(info.st_mode) or info.st_nlink != 1:
            raise StorageError('removal_stage_changed', 409)
        descriptor = os.open(temporary, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK | os.O_CLOEXEC, dir_fd=directory)
        with os.fdopen(descriptor, 'rb') as staged:
            if _identity(os.fstat(staged.fileno())) != operation.plan['restore_identity']:
                raise StorageError('removal_stage_changed', 409)
            if staged.read(len(operation.original) + 1) != bytes(operation.original):
                raise StorageError('removal_stage_changed', 409)
            os.fchmod(staged.fileno(), operation.plan['mode'])
            os.fsync(staged.fileno())


def _cleanup_stage(operation, directory):
    temporary = operation.plan.get('temporary')
    if not temporary:
        return
    info = _info(temporary, directory)
    if info is not None:
        if _identity(info) != operation.plan.get('restore_identity'):
            raise StorageError('removal_stage_changed', 409)
        (os.rmdir if operation.kind == 'folder' else os.unlink)(temporary, dir_fd=directory)


def restore_removal(actor, operation_id):
    with application_lock('wiki-write'):
        operation = _operation(actor, operation_id)
        if operation.state in {'restored', 'cancelled'}:
            return _inspect(operation)
        if operation.state == 'preview':
            operation.state = 'cancelled'
            operation.save(update_fields=['state'])
            return _inspect(operation)
        # Own recovery is permitted while its journal pauses ordinary writes.
        if (MoveOperation.objects.filter(state__in=['applying', 'recovery_required']).exists()
                or RemovalOperation.objects.filter(state__in=_RECOVERING).exclude(pk=operation.pk).exists()):
            raise StorageError('removal_recovery_required', 409)
        parent, _, name = operation.path.rpartition('/')
        with open_directory(parent) as directory:
            _verify_context(operation, directory, allow_parent_restore=True)
            info = _info(name, directory)
            if info is not None:
                if operation.state in _RECOVERING and not operation.plan.get('restore_identity'):
                    try:
                        _exact_original(operation, directory)
                    except StorageError:
                        return _result(operation, reason='removal_restore_collision')
                    _finish(operation, 'cancelled')
                    return _inspect(operation)
                try:
                    _verify_restored(operation, directory, allow_stage=True)
                except StorageError:
                    return _result(operation, reason='removal_restore_collision')
            operation.state = 'restoring'
            operation.reason_code = ''
            operation.save(update_fields=['state', 'reason_code'])
            try:
                if info is None:
                    temporary = _restore_stage(operation, directory)
                    _verify_stage(operation, directory, temporary)
                    _verify_context(operation, directory, allow_parent_restore=True)
                    if operation.kind == 'note':
                        os.link(temporary, name, src_dir_fd=directory, dst_dir_fd=directory, follow_symlinks=False)
                    else:
                        _rename_noreplace('/'.join(filter(None, [parent, temporary])), operation.path)
                _cleanup_stage(operation, directory)
                os.fsync(directory)
                _verify_context(operation, directory, allow_parent_restore=True)
                _verify_restored(operation, directory)
                _finish(operation, 'restored')
            except Exception:
                operation = _failure(operation)
        return _inspect(operation)
