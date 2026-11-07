"""Bounded existing-note suggestions from names, never document bodies."""
from dataclasses import dataclass, replace
from pathlib import PurePosixPath

from django.db import OperationalError
from django.db.models import Case, IntegerField, Min, Value, When
from django.db.models.functions import Substr

from wiki.contracts import PathDenied, StorageError
from wiki.links import _regular
from wiki.policy import validate_path
from wiki.storage import require_ready
from .models import IndexedNote, IndexGeneration
from .scanner import file_stat
from .search import CANDIDATE_LIMIT, Freshness, sqlite_budget
from .worker import index_status

RESULT_LIMIT = 20


@dataclass(frozen=True)
class CompletionItem:
    path: str
    title: str
    label: str


@dataclass(frozen=True)
class CompletionPage:
    items: tuple
    freshness: Freshness
    truncated: bool = False


def _label(value):
    return (isinstance(value, str) and 0 < len(value) <= 512 and ']]' not in value
            and not value.endswith(']') and '\\' not in value
            and not any(ord(c) < 32 or ord(c) == 127 for c in value))


def complete_notes(query):
    if (not isinstance(query, str) or len(query) > 256 or '\\' in query
            or any(ord(c) < 32 or ord(c) == 127 for c in query)):
        raise StorageError('invalid_completion_query')
    try:
        query.encode('utf-8', errors='strict')
    except UnicodeError:
        raise StorageError('invalid_completion_query') from None
    needle = query.removeprefix('/').casefold()
    state = index_status()
    freshness = Freshness(state.state, state.last_completed, state.next_scheduled)
    if state.state == 'unavailable' or state.generation is None:
        return CompletionPage((), freshness)
    notes = (IndexedNote.objects.filter(generation_id=state.generation)
             .annotate(short_title=Substr('title', 1, 512))
             .values('id', 'path', 'short_title', 'stat'))
    if needle:
        notes = notes.filter(indexedname__name__contains=needle).annotate(rank=Min(Case(
            When(indexedname__name=needle, then=Value(0)),
            When(indexedname__name__startswith=needle, then=Value(1)),
            default=Value(2), output_field=IntegerField(),
        )))
    else:
        notes = notes.annotate(rank=Value(0, output_field=IntegerField()))
    try:
        with sqlite_budget():
            candidates = list(notes.order_by('rank', 'path')[:CANDIDATE_LIMIT + 1])
    except OperationalError:
        return CompletionPage((), replace(freshness, limited=True))
    eligible = []
    examined = 0
    for row in candidates[:CANDIDATE_LIMIT]:
        examined += 1
        path = row['path']
        if not path.lower().endswith('.md') or any(c in path for c in '#|[]'):
            continue
        try:
            validate_path(path, 'content')
            if not _regular(path):
                continue
            if file_stat(path) != row['stat']:
                freshness = replace(freshness, state='stale')
                continue
        except (PathDenied, FileNotFoundError):
            continue
        except StorageError as error:
            if error.reason_code in {'not_found', 'path_denied'}:
                continue
            raise
        except OSError:
            return CompletionPage((), replace(freshness, state='unavailable'))
        eligible.append(row)
        if len(eligible) == RESULT_LIMIT:
            break
    # Only the bounded eligible result set needs original alias spelling.
    try:
        with sqlite_budget():
            aliases = dict(IndexedNote.objects.filter(pk__in=[row['id'] for row in eligible])
                           .values_list('pk', 'aliases'))
    except OperationalError:
        return CompletionPage((), replace(freshness, limited=True))
    items = []
    for row in eligible:
        title = ''.join(' ' if ord(c) < 32 or ord(c) == 127 else c for c in row['short_title'])
        matched = next((alias for alias in aliases.get(row['id'], [])
                        if needle and _label(alias) and needle in alias.casefold()), None)
        label = matched or (title if _label(title) else PurePosixPath(row['path']).stem)
        items.append(CompletionItem(row['path'], title, label if _label(label) else ''))
    require_ready()
    if not IndexGeneration.objects.filter(pk=state.generation, state='active').exists():
        raise StorageError('completion_index_changed', 409)
    return CompletionPage(tuple(items), freshness, examined < len(candidates))
