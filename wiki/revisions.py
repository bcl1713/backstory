"""Bounded required backups and short-lived, source-bound recovery grants."""
from contextlib import contextmanager
from datetime import timedelta
import fcntl
import hashlib
import os
from pathlib import Path
import secrets

from django.conf import settings
from django.db import DatabaseError, transaction
from django.utils import timezone

from .contracts import Diagnostic, StorageError
from .models import FormatRecovery, SavedRevision


@contextmanager
def application_lock(key, *, blocking=True):
    root = Path(settings.BACKSTORY_DATA_DIR) / "locks"
    root.mkdir(mode=0o700, parents=True, exist_ok=True)
    fd = os.open(root / (hashlib.sha256(key.encode()).hexdigest() + ".lock"), os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW | os.O_CLOEXEC, 0o600)
    try:
        fcntl.flock(fd, fcntl.LOCK_EX | (0 if blocking else fcntl.LOCK_NB))
        yield
    finally:
        os.close(fd)


def store_required_backup(actor, path, base_revision, original, submitted):
    try:
        with application_lock("revision-quota"), transaction.atomic():
            _prune(timezone.now())
            _check_quota(len(original) + len(submitted))
            SavedRevision.objects.create(actor=actor, path=path, base_revision=base_revision, original=original, submitted=submitted)
    except (DatabaseError, OSError):
        raise StorageError("backup_unavailable", 503) from None


def issue_recovery(actor, path, base_revision, source, result):
    from dataclasses import asdict
    try:
        with application_lock("format-recovery"), transaction.atomic():
            FormatRecovery.objects.filter(expires_at__lte=timezone.now()).delete()
            if FormatRecovery.objects.count() >= 1024:
                raise StorageError("recovery_capacity", 503)
            token = secrets.token_urlsafe(32)
            FormatRecovery.objects.create(token_digest=hashlib.sha256(token.encode()).hexdigest(), actor=actor, path=path,
                base_revision=base_revision, source_digest=hashlib.sha256(source.encode()).hexdigest(),
                diagnostics=[asdict(item) for item in result.diagnostics], diff=result.diff[:65536],
                expires_at=timezone.now() + timedelta(minutes=30))
            return token
    except (DatabaseError, OSError):
        raise StorageError("recovery_unavailable", 503) from None


def get_recovery(actor, path, base_revision, source, token):
    if not isinstance(token, str) or not 20 <= len(token) <= 128:
        raise StorageError("invalid_source_recovery")
    try:
        grant = FormatRecovery.objects.get(token_digest=hashlib.sha256(token.encode()).hexdigest(), actor=actor, path=path,
            base_revision=base_revision, source_digest=hashlib.sha256(source.encode()).hexdigest(), expires_at__gt=timezone.now())
    except FormatRecovery.DoesNotExist:
        raise StorageError("invalid_source_recovery") from None
    except DatabaseError:
        raise StorageError("recovery_unavailable", 503) from None
    return tuple(Diagnostic(**item) for item in grant.diagnostics), grant.diff


def _prune(timestamp):
    from .models import RecoveryDraft
    cutoff = timestamp - timedelta(days=getattr(settings, 'BACKSTORY_REVISION_RETENTION_DAYS', 30))
    SavedRevision.objects.filter(created_at__lt=cutoff).delete()
    RecoveryDraft.objects.filter(created_at__lt=cutoff).delete()
    FormatRecovery.objects.filter(expires_at__lte=timestamp).delete()


def _check_quota(extra):
    from .models import RecoveryDraft
    from django.db.models import BigIntegerField, Sum
    from django.db.models.functions import Length
    total = SavedRevision.objects.aggregate(total=Sum(Length('original') + Length('submitted'), output_field=BigIntegerField()))['total'] or 0
    total += RecoveryDraft.objects.aggregate(total=Sum(Length('source') + Length('base_source'), output_field=BigIntegerField()))['total'] or 0
    if total + extra > settings.BACKSTORY_REVISION_QUOTA_BYTES:
        raise StorageError('backup_quota_exceeded', 503)


def prune_recovery():
    with application_lock('revision-quota'), transaction.atomic():
        _prune(timezone.now())


def recovery_path(path):
    """Policy always applies. Never follow live paths while storage is unavailable."""
    import stat
    from .policy import validate_path
    from .storage import open_directory
    from .readiness import check_readiness
    from .contracts import PathDenied
    validate_path(path, 'content')
    if path == settings.BACKSTORY_IDENTITY_PATH or not path.lower().endswith('.md'):
        raise PathDenied()
    if check_readiness().state != 'ready':
        return path
    parent, _, name = path.rpartition('/')
    try:
        with open_directory(parent) as directory:
            try:
                info = os.stat(name, dir_fd=directory, follow_symlinks=False)
            except FileNotFoundError:
                return path
            if not stat.S_ISREG(info.st_mode):
                raise PathDenied()
    except StorageError as error:
        if error.reason_code != 'not_found':
            raise
    return path


def store_draft(actor, path, base_revision, source, diagnostics, *, base_source='', bom=False, newline='\n'):
    """Only explicit callers store drafts; storage loss never blocks protected recovery."""
    import json
    import re
    from django.core.exceptions import PermissionDenied
    from .models import RecoveryDraft
    if not actor.is_authenticated or not actor.is_active:
        raise PermissionDenied
    recovery_path(path)
    if base_revision is not None and (not isinstance(base_revision, str) or not re.fullmatch(r'"[0-9a-f]{64}"', base_revision)):
        raise StorageError('invalid_precondition')
    try:
        if not isinstance(source, str) or not isinstance(base_source, str) or newline not in {'\n', '\r\n', '\r'} or not isinstance(bom, bool):
            raise ValueError
        raw, base = source.encode('utf-8'), base_source.encode('utf-8')
        serialized = json.dumps(diagnostics)
        if not isinstance(diagnostics, list) or len(serialized) > 65536:
            raise ValueError
    except (ValueError, TypeError, UnicodeError):
        raise StorageError('invalid_draft') from None
    if max(len(raw), len(base)) > settings.BACKSTORY_NOTE_MAX_BYTES:
        raise StorageError('note_too_large', 413)
    try:
        with application_lock('revision-quota'), transaction.atomic():
            _prune(timezone.now())
            _check_quota(len(raw) + len(base))
            return RecoveryDraft.objects.create(actor=actor, path=path, base_revision=base_revision, source=raw, base_source=base, diagnostics=diagnostics, bom=bom, newline=newline)
    except (OSError, DatabaseError):
        raise StorageError('recovery_unavailable', 503) from None


def restore_revision(actor, revision_id, current_base_revision):
    from django.core.exceptions import PermissionDenied
    from .contracts import FormatResult
    from .saves import save_note
    if not actor.is_authenticated or not actor.is_active:
        raise PermissionDenied
    try:
        record = SavedRevision.objects.get(pk=revision_id)
    except SavedRevision.DoesNotExist:
        raise StorageError('not_found', 404) from None
    recovery_path(record.path)
    raw = bytes(record.original)
    source = (raw[3:] if raw.startswith(b'\xef\xbb\xbf') else raw).decode('utf-8')
    # Explicit restore uses the same source-recovery grant and guarded write path.
    result = FormatResult(source, (Diagnostic('history_restore', 'Explicit restoration; formatting skipped.', 'warning'),), '', 'failed', '')
    token = issue_recovery(actor, record.path, current_base_revision, source, result)
    return save_note(actor, record.path, source, current_base_revision, 'source_recovery', token, restore_bom=raw.startswith(b'\xef\xbb\xbf'))
