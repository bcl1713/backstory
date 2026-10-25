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
            cutoff = timezone.now() - timedelta(days=getattr(settings, "BACKSTORY_REVISION_RETENTION_DAYS", 30))
            SavedRevision.objects.filter(created_at__lt=cutoff).delete()
            # Aggregate lengths inside SQLite, never load the note corpus into RAM.
            from django.db.models import BigIntegerField, Sum
            from django.db.models.functions import Length
            usage = SavedRevision.objects.aggregate(total=Sum(Length("original") + Length("submitted"), output_field=BigIntegerField()))["total"] or 0
            if usage + len(original) + len(submitted) > getattr(settings, "BACKSTORY_REVISION_QUOTA_BYTES", 64 * 1024 * 1024):
                raise StorageError("backup_quota_exceeded", 503)
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
