"""Bounded JSON adapters for the existing relocation and revision services."""
from dataclasses import asdict
from datetime import timedelta
import hashlib
import json
import os
import stat
import uuid

from django.conf import settings
from django.core import signing
from django.core.exceptions import RequestDataTooBig
from django.db import DatabaseError
from django.db.models import Count, Max
from django.urls import reverse
from django.utils import timezone

from .contracts import PathDenied, StorageError
from .models import MoveOperation, MovePreviewJob, SavedRevision
from .policy import authorize_content, policy_version
from .revisions import recovery_path, restore_revision
from .saves import parse_precondition
from .storage import open_directory, read_note
from .tool_views import _json, _paging, _tool
from . import move_previews, relocations

from . import management_service as service
from .actors import Access


def _access(request):
    return Access(request.user, lambda path, purpose='content': authorize_content(request, path, purpose))


MAX_REVIEW_BYTES = 512 * 1024
MAX_REQUEST_BYTES = 16 * 1024
_REVIEW_SALT = 'backstory.tool.move-review.v1'
_HISTORY_SALT = 'backstory.tool.history.v1'


def _body(request, allowed, required):
    if request.content_type != 'application/json':
        raise StorageError('invalid_management_request')
    try:
        raw = request.body
        if len(raw) > MAX_REQUEST_BYTES:
            raise StorageError('management_request_too_large', 413)
        body = json.loads(raw)
        if not isinstance(body, dict) or set(body) - allowed or required - set(body):
            raise ValueError
        return body
    except RequestDataTooBig:
        raise StorageError('management_request_too_large', 413) from None
    except (ValueError, UnicodeError):
        raise StorageError('invalid_management_request') from None


def _query(request, allowed, required):
    if set(request.GET) - allowed or required - set(request.GET) or any(len(request.GET.getlist(key)) != 1 for key in request.GET):
        raise StorageError('invalid_management_request')
    return request.GET


def _eligible(request, path):
    return service._eligible(_access(request), path)


def _operation(request, value):
    return service._operation(_access(request), value)


def _review(request, operation):
    return service._review(_access(request), operation, max_review_bytes=MAX_REVIEW_BYTES)


def _review_binding(request, operation, review):
    return service._review_binding(_access(request), operation, review)


def _move_data(request, operation, *, expected_revision=None):
    return service._move_data(_access(request), operation, expected_revision=expected_revision, max_review_bytes=MAX_REVIEW_BYTES)


def _preparation_data(request, job):
    return service._preparation_data(_access(request), job)


def _move_response(data):
    response = _json(data, 503 if data['state'] == 'uncertain' else 409 if data['state'] == 'recovery_required' else 200)
    if data.get('authoritative') and 'revision' in data:
        response['ETag'] = data['revision']
    return response


@_tool(methods=('POST',))
def preview_move_tool(request):
    body = _body(request, {'source', 'destination'}, {'source', 'destination'})
    for key in ('source', 'destination'):
        authorize_content(request, body[key])
    try:
        operation = move_previews.enqueue_move_preview(request.user, body['source'], body['destination'])
    except (DatabaseError, OSError):
        raise StorageError('move_unavailable', 503) from None
    try:
        return _json(_move_data(request, operation), 202)
    except (StorageError, DatabaseError, OSError):
        # Queue publication succeeded. A failed observation cannot establish
        # that no preparation exists, so retain its handle without old paths.
        return _json({'operation_id': str(operation.pk), 'state': 'uncertain',
                      'reason_code': 'move_preparation_readback_unconfirmed',
                      'authoritative': False, 'inspect_before_retry': True,
                      'read_before_retry': True}, 503)


@_tool
def get_move(request):
    query = _query(request, {'operation_id'}, {'operation_id'})
    return _move_response(_move_data(request, _operation(request, query['operation_id'])))


def _mutate_move(request, *, rollback):
    allowed = {'operation_id'} if rollback else {'operation_id', 'review_token'}
    body = _body(request, allowed, allowed)
    operation = _operation(request, body['operation_id'])
    if isinstance(operation, MovePreviewJob):
        _preparation_data(request, operation)
        if not rollback:
            raise StorageError('move_preview_not_ready', 409)
        try:
            operation = move_previews.cancel_move_preview(request.user, operation.pk)
        except DatabaseError:
            raise StorageError('move_unavailable', 503) from None
        if isinstance(operation, MovePreviewJob):
            return _move_response(_preparation_data(request, operation))
        # The worker may have published before cancellation acquired its short
        # journal transaction. Apply the normal ready-plan rollback safeguards.
    review = _review(request, operation)
    if not rollback:
        try:
            token = body['review_token']
            if not isinstance(token, str) or len(token) > 4096:
                raise ValueError
            binding = signing.loads(token, salt=_REVIEW_SALT, max_age=1800)
            if binding != _review_binding(request, operation, review):
                raise ValueError
        except (signing.BadSignature, ValueError, TypeError):
            raise StorageError('invalid_move_review') from None
    expected = None
    if not rollback and operation.state not in {'completed', 'cancelled'} and review['kind'] == 'note':
        changed = next((row for row in operation.plan['changes'] if row['path'] == operation.source), None)
        expected = ('"' + hashlib.sha256(relocations._raw(changed['after'])).hexdigest() + '"'
                    if changed else operation.plan['witnesses'][operation.source][-1])
    try:
        action = relocations.rollback_move if rollback else relocations.commit_move
        action(request.user, operation.pk)
    except StorageError:
        raise
    except Exception:
        # The writer may have published before acknowledgement failed. Inspect
        # only: retrying the domain action here could resume a partial write.
        return _move_response({**review, 'state': 'uncertain', 'reason_code': 'move_outcome_unknown',
                               'authoritative': False, 'inspect_before_retry': True})
    try:
        operation = _operation(request, str(operation.pk))
        data = _move_data(request, operation, expected_revision=expected)
    except StorageError:
        # The action has returned; a failed status/policy/readback observation
        # cannot establish that it never published. Do not echo old paths.
        data = {'operation_id': str(operation.pk), 'state': 'uncertain',
                'reason_code': 'move_readback_unconfirmed', 'authoritative': False,
                'inspect_before_retry': True}
    return _move_response(data)


@_tool(methods=('POST',))
def commit_move_tool(request):
    return _mutate_move(request, rollback=False)


@_tool(methods=('POST',))
def rollback_move_tool(request):
    return _mutate_move(request, rollback=True)


def _history_path(request, path, *, query=False):
    authorize_content(request, path, query_parameter='path' if query else None)
    return recovery_path(path)


_revision_id = service._revision_id


def _record(request, value):
    return service.history_record(_access(request), value)


_metadata = service._metadata


@_tool
def list_note_history(request):
    query = _query(request, {'path', 'limit', 'cursor'}, {'path'})
    path = _history_path(request, query['path'], query=True)
    cursor, limit = _paging(request, 30)
    return _json(service.list_history(_access(request), path, cursor=cursor, limit=limit))


_historical_source = service._historical_source


@_tool
def read_note_revision(request):
    query = _query(request, {'revision_id'}, {'revision_id'})
    row = _record(request, query['revision_id'])
    return _json({'state': 'ok', 'path': row.path, **_metadata(row), **_historical_source(row), 'authoritative': False})


@_tool(methods=('POST',))
def restore_note_revision(request):
    body = _body(request, {'path', 'revision_id', 'revision'}, {'path', 'revision_id'})
    if 'revision' not in body:
        raise StorageError('precondition_required', 428)
    if body['revision'] is None:
        raise StorageError('invalid_precondition')
    base = parse_precondition(body['revision'], None)
    path = _history_path(request, body['path'])
    row = _record(request, body['revision_id'])
    if row.path != path:
        raise StorageError('history_revision_changed', 412)
    _historical_source(row)  # Bound source size and reject non-UTF-8 before granting recovery.
    try:
        result = restore_revision(request.user, row.pk, base, expected_path=path)
    except StorageError:
        raise
    except Exception:
        return _json({'state': 'uncertain', 'path': row.path, 'reason_code': 'restore_outcome_unknown',
                      'authoritative': False, 'read_before_retry': True}, 503)
    data = asdict(result)
    data.pop('recovery_token', None)
    data.pop('status', None)
    data.update(path=row.path, href=reverse('wiki:note', args=[row.path]), authoritative=False)
    status = result.status
    if result.state in {'saved', 'saved_source', 'saved_index_delayed', 'saved_source_index_delayed', 'noop'}:
        try:
            note = read_note(row.path)
            if note.revision != result.revision:
                raise StorageError('saved_readback_changed', 503)
        except StorageError:
            data.update(state='uncertain', reason_code='saved_readback_unconfirmed', read_before_retry=True)
            status = 503
        else:
            data.update(source=note.source, revision=note.revision, bom=note.bom,
                        newline=note.newline, authoritative=True)
    elif result.state == 'uncertain':
        data['read_before_retry'] = True
    response = _json(data, status)
    if data['authoritative']:
        response['ETag'] = data['revision']
    return response
