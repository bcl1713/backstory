"""Literal FTS and stable path paging: 512-character titles, 240-character snippets.

Result projections are capped in SQL; authoritative note/projection text stays intact.
"""
from contextlib import contextmanager
from dataclasses import dataclass, replace
import hashlib
import json
import re
import time

from django.core import signing
from django.db import connection, OperationalError
from django.urls import reverse
from wiki.contracts import StorageError, PathDenied
from wiki.policy import policy_version, validate_path
from wiki.storage import require_ready
from wiki.links import _regular
from .models import IndexGeneration, IndexedName
from .worker import index_status

SQLITE_VM_STEPS = 200000
SQLITE_SECONDS = .1
CANDIDATE_LIMIT = 300


@dataclass(frozen=True)
class Freshness:
    state: str
    last_completed: float
    next_scheduled: float
    limited: bool = False


@dataclass(frozen=True)
class SearchItem:
    path: str
    title: str
    snippet: str
    href: str
    revision: str


@dataclass(frozen=True)
class SearchPage:
    items: tuple
    next_cursor: str | None
    freshness: Freshness
    examined: int = 0


@contextmanager
def sqlite_budget():
    connection.ensure_connection()
    database = connection.connection
    deadline = time.monotonic() + SQLITE_SECONDS
    steps = 0
    granularity = min(1000, max(1, SQLITE_VM_STEPS))
    def interrupt():
        nonlocal steps
        steps += granularity
        return int(steps >= SQLITE_VM_STEPS or time.monotonic() >= deadline)
    database.set_progress_handler(interrupt, granularity)
    try:
        yield
    finally:
        database.set_progress_handler(None, 0)


def _cursor(query, generation, after):
    return signing.dumps({'q': hashlib.sha256(query.encode()).hexdigest(), 'g': generation,
                          'p': policy_version(), 'after': after}, salt='search-v1', compress=True)


def search_notes(query: str, cursor: str | None = None, limit: int = 30):
    if not isinstance(query, str) or len(query) > 256 or any(ord(c) < 32 and not c.isspace() for c in query):
        raise StorageError('invalid_search_query')
    terms = re.findall(r'\w+', query, re.UNICODE)
    if len(terms) > 16:
        raise StorageError('invalid_search_query')
    if type(limit) is not int or limit < 1:
        raise StorageError('invalid_limit')
    limit = min(limit, 100)
    state = index_status()
    freshness = Freshness(state.state, state.last_completed, state.next_scheduled)
    generation = state.generation
    after = ''
    if cursor:
        try:
            if not isinstance(cursor, str) or len(cursor) > 4096:
                raise ValueError
            data = signing.loads(cursor, salt='search-v1', max_age=3600)
            if data['q'] != hashlib.sha256(query.encode()).hexdigest() or data['g'] != generation or data['p'] != policy_version() or not isinstance(data['after'], str):
                raise ValueError
            after = data['after']
        except (signing.BadSignature, ValueError, KeyError, TypeError):
            raise StorageError('search_cursor_expired', 409) from None
    if freshness.state == 'unavailable' or generation is None:
        return SearchPage((), None, freshness)
    expression = ' AND '.join('"' + term.replace('"', '""') + '"' for term in terms)
    parameters = [generation, after]
    match = ''
    if query.strip():
        if expression:
            match = ' AND (n.id IN (SELECT rowid FROM indexed_fts WHERE indexed_fts MATCH %s AND generation=%s) OR n.id IN (SELECT note_id FROM indexing_indexedname WHERE name=%s))'
            parameters += [expression, generation, query.strip().casefold()]
        else:
            match = ' AND n.id IN (SELECT note_id FROM indexing_indexedname WHERE name=%s)'
            parameters += [query.strip().casefold()]
    parameters += [CANDIDATE_LIMIT]
    sql = 'SELECT n.path,substr(n.title,1,512),substr(n.body,1,240),n.revision,n.stat FROM indexing_indexednote n WHERE n.generation_id=%s AND n.path>%s' + match + ' ORDER BY n.path LIMIT %s'
    try:
        with sqlite_budget(), connection.cursor() as db:
            db.execute(sql, parameters)
            candidates = db.fetchall()
    except OperationalError:
        return SearchPage((), None, replace(freshness, limited=True))
    items = []
    examined = 0
    last = after
    for path, title, snippet, revision, indexed_stat in candidates:
        examined += 1
        last = path
        try:
            validate_path(path, 'content')
            if not _regular(path):
                continue
            from .scanner import file_stat
            if file_stat(path) != json.loads(indexed_stat):
                freshness = replace(freshness, state='stale') if freshness.state == 'ready' else freshness
        except FileNotFoundError:
            continue
        except PathDenied:
            continue
        except StorageError as error:
            if error.reason_code in {'not_found', 'path_denied'}:
                continue
            return SearchPage((), None, replace(freshness, state='unavailable'), examined)
        except OSError:
            return SearchPage((), None, replace(freshness, state='unavailable'), examined)
        items.append(SearchItem(path, title, snippet, reverse('wiki:note', args=[path]), revision))
        if len(items) == limit:
            break
    # Recheck identity and active generation after bounded candidate checks. No
    # note bodies are fetched; an uncertain mount never presents old hits.
    try:
        require_ready()
    except StorageError:
        return SearchPage((), None, replace(freshness, state='unavailable'), examined)
    if not IndexGeneration.objects.filter(pk=generation, state='active').exists():
        raise StorageError('search_cursor_expired', 409)
    more = examined < len(candidates) or len(candidates) == CANDIDATE_LIMIT or len(items) == limit
    return SearchPage(tuple(items), _cursor(query, generation, last) if more and last else None, freshness, examined)


def resolve_indexed_name(name, *, distinguish_missing=False):
    """Return eligible matches; optionally distinguish unconfirmed absence.

    Ordinary discovery keeps excluded candidates indistinguishable from absent
    notes. Creation needs the additional evidence before offering a new path.
    """
    state = index_status()
    if state.state != 'ready' or state.generation is None:
        return 'unavailable', ()
    try:
        with sqlite_budget():
            candidates = list(IndexedName.objects.filter(name=name.casefold(), resolvable=True, note__generation_id=state.generation)
                              .values_list('note__path', 'note__stat').distinct().order_by('note__path')[:CANDIDATE_LIMIT + 1])
    except OperationalError:
        return 'unavailable', ()
    if len(candidates) > CANDIDATE_LIMIT:
        return 'unavailable', ()
    paths = []
    from .scanner import file_stat
    for path, indexed_stat in candidates:
        try:
            validate_path(path, 'content')
            if _regular(path):
                # A changed eligible candidate may have added/removed this ID
                # or alias. Dropping it cannot establish another unique match.
                if file_stat(path) != indexed_stat:
                    return 'unavailable', ()
                paths.append(path)
        except PathDenied:
            continue
        except StorageError as error:
            if error.reason_code in {'not_found', 'path_denied'}:
                continue
            return 'unavailable', ()
        except OSError:
            return 'unavailable', ()
    try:
        require_ready()
    except StorageError:
        return 'unavailable', ()
    if not IndexGeneration.objects.filter(pk=state.generation, state='active').exists():
        return 'unavailable', ()
    if distinguish_missing and candidates and not paths:
        # Ineligible or stale indexed destinations cannot establish absence.
        # In particular, a now-forbidden alias must not invite a new file.
        return 'unconfirmed', ()
    return ('missing' if not paths else 'resolved' if len(paths) == 1 else 'ambiguous'), tuple(paths)
