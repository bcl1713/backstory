"""Authenticated bounded JSON adapters for the durable removal service."""
import json
import uuid

from django.core.exceptions import RequestDataTooBig
from django.db import DatabaseError

from .contracts import StorageError
from .policy import authorize_content
from .tool_views import _json, _tool
from . import removals


def _body(request, allowed, required=None):
    if request.content_type != 'application/json':
        raise StorageError('invalid_removal_request')
    try:
        value = json.loads(request.body)
        if not isinstance(value, dict) or set(value) - allowed or not (required or allowed) <= set(value):
            raise ValueError
        return value
    except (ValueError, UnicodeError, RequestDataTooBig):
        raise StorageError('invalid_removal_request') from None


@_tool(methods=('POST',))
def preview_removal(request):
    body = _body(request, {'path', 'kind', 'revision'}, {'path', 'kind'})
    if body.get('kind') not in {'note', 'folder'}:
        raise StorageError('invalid_removal_request')
    path = authorize_content(request, body.get('path'), 'folder' if body['kind'] == 'folder' else 'content')
    return _json(_invoke(removals.preview_removal, request.user, path, body['kind'], body.get('revision')))


@_tool
def get_removal(request):
    if set(request.GET) != {'operation_id'} or len(request.GET.getlist('operation_id')) != 1:
        raise StorageError('invalid_removal_request')
    authorize_content(request, '', 'folder')
    return _json(_invoke(removals.get_removal, request.user, request.GET.get('operation_id')))


@_tool(methods=('POST',))
def commit_removal(request):
    return _mutate(request, removals.commit_removal)


@_tool(methods=('POST',))
def restore_removal(request):
    return _mutate(request, removals.restore_removal)


def _mutate(request, service):
    body = _body(request, {'operation_id'})
    operation_id = body['operation_id']
    try:
        if (not isinstance(operation_id, str) or len(operation_id) != 36
                or str(uuid.UUID(operation_id)) != operation_id):
            raise ValueError
    except ValueError:
        raise StorageError('invalid_removal_request') from None
    authorize_content(request, '', 'folder')
    try:
        result = service(request.user, operation_id)
    except (OSError, DatabaseError):
        # Filesystem publication can precede a failed terminal journal update.
        # Retain the validated handle for explicit inspection, never infer a
        # failed write or expose an unverified path from a broken status read.
        return _json({'state': 'uncertain', 'operation_id': operation_id,
            'reason_code': 'removal_outcome_unknown', 'authoritative': False,
            'inspect_before_retry': True, 'read_before_retry': True}, 503)
    return _json(result)


def _invoke(service, *args):
    try:
        return service(*args)
    except (OSError, DatabaseError):
        raise StorageError('removal_unavailable', 503) from None
