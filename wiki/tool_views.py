"""Small read-only JSON boundary for browser tools; existing session auth only."""
from dataclasses import asdict
from functools import wraps
from urllib.parse import urlencode

from django.http import JsonResponse
from django.urls import reverse

from indexing.search import search_notes
from .contracts import PathDenied, StorageError
from .policy import authorize_content
from .storage import list_folder, read_note, require_ready


def _json(data, status=200):
    return JsonResponse({'untrusted_content': True, **data}, status=status)


def _tool(view):
    @wraps(view)
    def boundary(request):
        if not request.user.is_authenticated or not request.user.is_active:
            return _json({'state': 'error', 'reason_code': 'authentication_required'}, 401)
        if request.method != 'GET':
            response = _json({'state': 'error', 'reason_code': 'method_not_allowed'}, 405)
            response['Allow'] = 'GET'
            return response
        try:
            return view(request)
        except StorageError as error:
            return _json({
                'state': 'unavailable' if error.status == 503 else 'error',
                'reason_code': error.reason_code,
                'restart': error.reason_code in {'cursor_invalid', 'search_cursor_expired'},
            }, error.status)
    return boundary


def _paging(request, default):
    try:
        raw = request.GET.get('limit', str(default))
        if len(raw) > 3:
            raise ValueError
        limit = int(raw)
        if not 1 <= limit <= 100:
            raise ValueError
    except ValueError:
        raise StorageError('invalid_limit') from None
    cursor = request.GET.get('cursor')
    if cursor is not None and (not cursor or len(cursor) > 4096):
        raise StorageError('invalid_cursor')
    return cursor, limit


@_tool
def search(request):
    # Even discovery is gated by the same authentication/policy/readiness boundary.
    authorize_content(request, '', 'folder')
    require_ready()
    cursor, limit = _paging(request, 30)
    page = search_notes(request.GET.get('query', ''), cursor, limit)
    freshness = asdict(page.freshness)
    state = ('unavailable' if freshness['state'] == 'unavailable' else
             'matches' if page.items else
             'no_matches' if freshness['state'] == 'ready' and not freshness['limited'] and not page.next_cursor else
             'incomplete')
    return _json({
        'state': state, 'items': [asdict(item) for item in page.items],
        'next_cursor': page.next_cursor, 'freshness': freshness,
        'authoritative': False,
    }, 503 if state == 'unavailable' else 200)


@_tool
def read(request):
    path = authorize_content(request, request.GET.get('path', ''), query_parameter='path')
    if not path.lower().endswith('.md'):
        raise PathDenied()
    snapshot = read_note(path)
    response = _json({
        'state': 'ok', 'path': snapshot.path, 'href': reverse('wiki:note', args=[snapshot.path]),
        'source': snapshot.source, 'revision': snapshot.revision,
        'bom': snapshot.bom, 'newline': snapshot.newline, 'authoritative': True,
    })
    response['ETag'] = snapshot.revision
    return response


@_tool
def list_notes(request):
    folder = authorize_content(request, request.GET.get('folder', ''), 'folder', query_parameter='folder')
    cursor, limit = _paging(request, 100)
    page = list_folder(folder, cursor, limit)
    entries = []
    for entry in page.entries:
        if entry.kind == 'folder':
            href = reverse('wiki:shell') + '?' + urlencode({'folder': entry.path})
        elif entry.path.lower().endswith('.md'):
            href = reverse('wiki:note', args=[entry.path])
        else:
            continue
        entries.append({**asdict(entry), 'href': href})
    return _json({'state': 'ok', 'path': page.path, 'entries': entries,
                  'next_cursor': page.next_cursor, 'authoritative': True})
