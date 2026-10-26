"""Bounded, durable coalescing jobs; writes never inspect wiki files."""
from dataclasses import dataclass
from django.conf import settings
from django.db import transaction
from wiki.policy import validate_path
from .models import IndexJob, ScanState


@dataclass(frozen=True)
class JobState:
    kind: str
    state: str = 'queued'


def enqueue_note(path: str, revision: str):
    validate_path(path, 'content')
    with transaction.atomic():
        state, _ = ScanState.objects.get_or_create(pk=1)
        existing = IndexJob.objects.filter(path=path)
        if existing.exists():
            existing.update(revision=revision)
        elif IndexJob.objects.count() < getattr(settings, 'BACKSTORY_INDEX_QUEUE_LIMIT', 1000):
            IndexJob.objects.create(path=path, revision=revision)
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
