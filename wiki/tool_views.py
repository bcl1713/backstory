"""Small JSON boundary for browser tools; existing session and save services."""
from dataclasses import asdict
from functools import wraps
import json
from urllib.parse import urlencode

from django.http import JsonResponse
from django.core.exceptions import RequestDataTooBig
from django.urls import reverse

from indexing.search import search_notes
from .contracts import PathDenied, StorageError
from .policy import authorize_content
from .storage import list_folder, read_note, require_ready
from .saves import parse_precondition, save_note


def _json(data, status=200):
    return JsonResponse({'untrusted_content': True, **data}, status=status)


def _tool(view=None, *, methods=('GET',)):
    if view is None:
        return lambda view: _tool(view, methods=methods)
    @wraps(view)
    def boundary(request):
        if not request.user.is_authenticated or not request.user.is_active:
            return _json({'state': 'error', 'reason_code': 'authentication_required'}, 401)
        if request.method not in methods:
            response = _json({'state': 'error', 'reason_code': 'method_not_allowed'}, 405)
            response['Allow'] = ', '.join(methods)
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


def csrf_failure(request, reason=''):
    if request.path.startswith('/tools/'):
        return _json({'state': 'error', 'reason_code': 'csrf_failed'}, 403)
    from django.views.csrf import csrf_failure as default_failure
    return default_failure(request, reason=reason)


@_tool(methods=('POST',))
def save(request):
    if request.content_type != 'application/json':
        raise StorageError('invalid_save_request')
    try:
        body = json.loads(request.body)
        if (not isinstance(body, dict) or set(body) - {'path', 'source', 'revision'}
                or not isinstance(body.get('source'), str)):
            raise ValueError
    except RequestDataTooBig:
        raise StorageError('note_too_large', 413) from None
    except (ValueError, UnicodeError):
        raise StorageError('invalid_save_request') from None
    path = authorize_content(request, body.get('path'))
    if not path.lower().endswith('.md'):
        raise PathDenied()
    if 'revision' not in body:
        raise StorageError('precondition_required', 428)
    # A tool can only replace an existing read revision. No create or recovery.
    if body['revision'] is None:
        raise StorageError('invalid_precondition')
    base = parse_precondition(body['revision'], None)
    result = save_note(request.user, path, body['source'], base)
    data = asdict(result)
    data.pop('recovery_token', None)
    data.pop('status', None)
    data.update(path=path, href=reverse('wiki:note', args=[path]), authoritative=False)
    status = result.status
    if result.state in {'saved', 'saved_index_delayed', 'noop'}:
        try:
            observed = read_note(path)
            if observed.revision != result.revision:
                raise StorageError('saved_readback_changed', 503)
        except StorageError:
            data.update(state='uncertain', reason_code='saved_readback_unconfirmed', read_before_retry=True)
            status = 503
        else:
            data.update(source=observed.source, revision=observed.revision,
                        bom=observed.bom, newline=observed.newline, authoritative=True)
    elif result.state == 'uncertain':
        data['read_before_retry'] = True
    # Index failure must never turn a successful publication into a retry signal.
    from indexing.worker import index_status
    try:
        data['index'] = asdict(index_status())
    except Exception:
        data['index'] = {'state': 'unavailable'}
    response = _json(data, status)
    if data['authoritative']:
        response['ETag'] = data['revision']
    return response


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
def complete(request):
    from indexing.completions import complete_notes
    authorize_content(request, '', 'folder')
    require_ready()
    page = complete_notes(request.GET.get('query', ''))
    freshness = asdict(page.freshness)
    unavailable = freshness['state'] == 'unavailable'
    return _json({
        'state': 'unavailable' if unavailable else 'suggestions',
        'items': [asdict(item) for item in page.items],
        'freshness': freshness, 'truncated': page.truncated, 'authoritative': False,
    }, 503 if unavailable else 200)


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


@_tool(methods=('POST',))
def create_folder(request):
    from .folders import create_folder as create
    if request.content_type != 'application/json':
        raise StorageError('invalid_folder_request')
    try:
        body = json.loads(request.body)
        if not isinstance(body, dict) or set(body) != {'path'}:
            raise ValueError
    except (ValueError, UnicodeError, RequestDataTooBig):
        raise StorageError('invalid_folder_request') from None
    path = authorize_content(request, body['path'], 'folder')
    result = create(path, request.user)
    return _json(result, 201 if result['state'] == 'created' else 409 if result['state'] == 'uncertain' else 200)


@_tool
def status(request):
    from .tool_status import status_snapshot
    return _json(status_snapshot())


@_tool(methods=('POST',))
def read_many(request):
    from .tool_reads import read_many as read_batch
    if request.content_type != 'application/json':
        raise StorageError('invalid_read_many_request')
    try:
        body = json.loads(request.body)
        if not isinstance(body, dict) or set(body) != {'paths'}:
            raise ValueError
    except (ValueError, UnicodeError, RequestDataTooBig):
        raise StorageError('invalid_read_many_request') from None
    return _json(read_batch(request, body['paths']))
