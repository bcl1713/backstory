"""Bounded, durable coalescing jobs; writes never inspect wiki files."""
from dataclasses import dataclass
import time
import uuid
from django.utils import timezone
from django.conf import settings
from django.db import transaction
from django.db.models import F
from wiki.policy import validate_path
from .models import IndexJob, ScanState


@dataclass(frozen=True)
class JobState:
    kind: str
    state: str = 'queued'


def enqueue_note(path: str, revision: str):
    _enqueue(path, revision, False, time.time())


def invalidate_path(path: str, *, now=None):
    """Durable path intent: no claimed content revision and no filesystem I/O."""
    _enqueue(path, "", True, time.time() if now is None else now)


def require_reconciliation():
    with transaction.atomic():
        ScanState.objects.filter(pk=1).update(reconcile_needed=F("reconcile_needed"))
        state, _ = ScanState.objects.get_or_create(pk=1)
        ScanState.objects.filter(pk=state.pk).update(reconcile_needed=True)


def _enqueue(path, revision, invalidated, now):
    validate_path(path, 'content')
    with transaction.atomic():
        # Reserve the SQLite writer before taking a read snapshot. Otherwise a
        # worker commit between SELECT and INSERT causes SQLITE_BUSY_SNAPSHOT,
        # which cannot wait for the configured busy timeout. Even a zero-row
        # UPDATE acquires write intent; bootstrap remains safe too. No note I/O
        # occurs inside this short queue transaction.
        ScanState.objects.filter(pk=1).update(reconcile_needed=F('reconcile_needed'))
        state, _ = ScanState.objects.get_or_create(pk=1)
        existing = IndexJob.objects.filter(path=path)
        job = existing.first()
        first_seen = job.first_seen if job else now
        not_before = min(first_seen + getattr(settings, "BACKSTORY_INDEX_DEBOUNCE_MAX_SECONDS", 2),
                         now + getattr(settings, "BACKSTORY_INDEX_DEBOUNCE_SECONDS", .2)) if invalidated else 0
        values = dict(revision=revision, version=uuid.uuid4(), invalidated=invalidated,
                      first_seen=first_seen, not_before=not_before, missing_since=None)
        if job:
            existing.update(**values, updated=timezone.now())
        elif IndexJob.objects.count() < getattr(settings, 'BACKSTORY_INDEX_QUEUE_LIMIT', 1000):
            IndexJob.objects.create(path=path, **values)
        else:
            state.reconcile_needed = True
            state.save(update_fields=['reconcile_needed'])


def request_scan(kind):
    if kind not in {'incremental', 'verify', 'rebuild'}:
        raise ValueError('invalid_scan_kind')
    with transaction.atomic():
        state, _ = ScanState.objects.get_or_create(pk=1)
        order = {'': 0, 'incremental': 1, 'verify': 2, 'rebuild': 3}
        if order[kind] > order[state.requested]:
            state.requested = kind
            state.save(update_fields=['requested'])
    return JobState(kind)
