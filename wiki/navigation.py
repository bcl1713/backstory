"""Bounded note navigation; index rows are hints, storage remains authoritative."""
from dataclasses import asdict
from datetime import date
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.db.models.functions import Substr
from django.urls import reverse

from indexing.models import IndexedNote, IndexGeneration
from indexing.scanner import file_stat
from indexing.worker import index_status
from .contracts import StorageError
from .links import resolve_link
from .policy import validate_path
from .storage import require_ready


def note_navigation(day, timezone):
    try:
        if not isinstance(day, str) or date.fromisoformat(day).isoformat() != day:
            raise ValueError
        if not isinstance(timezone, str) or not timezone or len(timezone) > 128:
            raise ValueError
        ZoneInfo(timezone)
    except (ValueError, TypeError, ZoneInfoNotFoundError):
        raise StorageError('invalid_navigation_date_or_timezone') from None
    require_ready()
    today = resolve_link('Today.md', day, 'wiki')
    status = index_status()
    recent = []
    if status.generation is not None and status.state != 'unavailable':
        candidates = (IndexedNote.objects.filter(generation_id=status.generation)
                      .annotate(label=Substr('title', 1, 512))
                      .order_by('-stat__mtime', 'path')
                      .values('path', 'label', 'stat')[:100])
        for row in candidates:
            try:
                validate_path(row['path'], 'content')
                file_stat(row['path'])
            except (StorageError, OSError):
                continue
            recent.append({'path': row['path'], 'title': row['label'] or row['path'],
                           'href': reverse('wiki:note', args=[row['path']])})
            if len(recent) == 5:
                break
        if not IndexGeneration.objects.filter(pk=status.generation, state='active').exists():
            recent = []
    require_ready()
    return {'date': day, 'timezone': timezone, 'today': asdict(today),
            'recent': recent, 'index_state': status.state}
