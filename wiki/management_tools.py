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
from .models import MoveOperation, SavedRevision
from .policy import authorize_content, policy_version
from .revisions import recovery_path, restore_revision
from .saves import parse_precondition
from .storage import open_directory, read_note
from .tool_views import _json, _paging, _tool
from . import relocations

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
    """Reapply current policy and no-follow checks before disclosing old paths."""
    authorize_content(request, path)
    parent, _, name = path.rpartition('/')
    try:
        with open_directory(parent) as directory:
            try:
                info = os.stat(name, dir_fd=directory, follow_symlinks=False)
            except FileNotFoundError:
                return
            if not (stat.S_ISREG(info.st_mode) or stat.S_ISDIR(info.st_mode)):
                raise PathDenied()
    except StorageError as error:
        if error.reason_code != 'not_found':
            raise


def _operation(request, value):
    try:
        if not isinstance(value, str) or len(value) != 36:
            raise ValueError
        operation_id = uuid.UUID(value)
    except (ValueError, TypeError, AttributeError):
        raise StorageError('invalid_operation_id') from None
    try:
        return MoveOperation.objects.get(pk=operation_id, actor=request.user)
    except MoveOperation.DoesNotExist:
        raise StorageError('not_found', 404) from None
    except DatabaseError:
        raise StorageError('move_unavailable', 503) from None


def _review(request, operation):
    plan = operation.plan
    source, destination = operation.source, operation.destination
    inventory = [{'path': row['path'], 'destination': destination + row['path'][len(source):],
                  'kind': row['kind'], 'size': row['size']} for row in plan['inventory']]
    changes = [{key: row[key] for key in ('path', 'destination', 'links', 'diff')} for row in plan['changes']]
    affected = sorted({source, destination} | {row[key] for row in inventory + changes for key in ('path', 'destination')})
    for path in affected:
        _eligible(request, path)
    if plan['policy'] != policy_version():
        raise StorageError('move_policy_changed', 409)
    if operation.state == 'preview' and operation.created_at < timezone.now() - timedelta(minutes=30):
        raise StorageError('move_preview_expired', 409)
    data = {'operation_id': str(operation.pk), 'source': source, 'source_path': source, 'destination': destination,
            'kind': 'note' if stat.S_ISREG(plan['source_identity'][2]) else 'folder',
            'inventory': inventory, 'changes': changes, 'affected_paths': affected}
    # Reserve room for token, envelope, state and readback metadata. Source
    # readback is separate from the review budget and uses the normal note cap.
    if len(json.dumps(data, ensure_ascii=True).encode()) + 2048 > MAX_REVIEW_BYTES:
        raise StorageError('move_review_too_large', 413)
    return data


def _review_binding(request, operation, review):
    digest = hashlib.sha256(json.dumps(review, sort_keys=True, ensure_ascii=True).encode()).hexdigest()
    return {'actor': str(request.user.pk), 'operation_id': str(operation.pk),
            'policy': policy_version(), 'digest': digest}


def _move_data(request, operation, *, expected_revision=None):
    review = _review(request, operation)
    data = {**review, 'state': operation.state, 'reason_code': operation.reason_code,
            'index_state': operation.index_state, 'authoritative': False,
            'review_token': signing.dumps(_review_binding(request, operation, review), salt=_REVIEW_SALT)}
    if operation.state in {'completed', 'cancelled'}:
        path = operation.destination if operation.state == 'completed' else operation.source
        try:
            if review['kind'] == 'note':
                note = read_note(path)
                if expected_revision and note.revision != expected_revision:
                    raise StorageError('move_readback_changed', 503)
                data.update(path=path, href=reverse('wiki:note', args=[path]), source=note.source,
                            revision=note.revision, bom=note.bom, newline=note.newline, authoritative=True)
            else:
                with open_directory(path) as directory:
                    identity = operation.plan['source_identity']
                    info = os.fstat(directory)
                    if [info.st_dev, info.st_ino] != identity[:2]:
                        raise StorageError('move_readback_changed', 503)
                data.update(path=path, verified=True, authoritative=True)
        except StorageError:
            data.update(state='uncertain', operation_state=operation.state,
                        reason_code='move_readback_unconfirmed', inspect_before_retry=True)
    elif operation.state != 'preview':
        data['inspect_before_retry'] = True
    return data


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
        operation = relocations.preview_move(request.user, body['source'], body['destination'])
    except (DatabaseError, OSError):
        raise StorageError('move_unavailable', 503) from None
    return _move_response(_move_data(request, operation))


@_tool
def get_move(request):
    query = _query(request, {'operation_id'}, {'operation_id'})
    return _move_response(_move_data(request, _operation(request, query['operation_id'])))


def _mutate_move(request, *, rollback):
    allowed = {'operation_id'} if rollback else {'operation_id', 'review_token'}
    body = _body(request, allowed, allowed)
    operation = _operation(request, body['operation_id'])
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


def _revision_id(value):
    if isinstance(value, bool) or not isinstance(value, (int, str)):
        raise StorageError('invalid_revision_id')
    spelling = str(value)
    if not spelling.isascii() or not spelling.isdigit() or len(spelling) > 18 or int(spelling) < 1:
        raise StorageError('invalid_revision_id')
    return int(spelling)


def _record(request, value):
    try:
        row = SavedRevision.objects.get(pk=_revision_id(value))
    except SavedRevision.DoesNotExist:
        raise StorageError('not_found', 404) from None
    except DatabaseError:
        raise StorageError('history_unavailable', 503) from None
    _history_path(request, row.path)
    return row


def _metadata(row):
    return {'revision_id': row.pk, 'created_at': row.created_at.isoformat(), 'base_revision': row.base_revision}


@_tool
def list_note_history(request):
    query = _query(request, {'path', 'limit', 'cursor'}, {'path'})
    path = _history_path(request, query['path'], query=True)
    cursor, limit = _paging(request, 30)
    try:
        rows = SavedRevision.objects.filter(path=path)
        generation = rows.aggregate(count=Count('pk'), latest=Max('pk'))
        binding = {'actor': str(request.user.pk), 'path': path, 'policy': policy_version(), 'generation': generation}
        after = None
        if cursor:
            try:
                decoded = signing.loads(cursor, salt=_HISTORY_SALT, max_age=900)
                if not isinstance(decoded, dict) or decoded.get('binding') != binding:
                    raise ValueError
                after = _revision_id(decoded.get('after'))
            except (signing.BadSignature, ValueError, TypeError, StorageError):
                raise StorageError('cursor_invalid') from None
        if after is not None:
            rows = rows.filter(pk__lt=after)
        # Defer payloads: history discovery must not read note bodies.
        page = list(rows.only('pk', 'created_at', 'base_revision').order_by('-pk')[:limit + 1])
        more = len(page) > limit
        page = page[:limit]
        next_cursor = signing.dumps({'binding': binding, 'after': page[-1].pk}, salt=_HISTORY_SALT) if more else None
        return _json({'state': 'ok', 'path': path, 'items': [_metadata(row) for row in page],
                      'next_cursor': next_cursor, 'authoritative': False})
    except DatabaseError:
        raise StorageError('history_unavailable', 503) from None


def _historical_source(row):
    raw = bytes(row.original)
    if len(raw) > settings.BACKSTORY_NOTE_MAX_BYTES:
        raise StorageError('note_too_large', 413)
    bom = raw.startswith(b'\xef\xbb\xbf')
    try:
        source = (raw[3:] if bom else raw).decode('utf-8')
    except UnicodeError:
        raise StorageError('history_source_invalid', 422) from None
    newline = '\r\n' if '\r\n' in source else '\r' if '\r' in source else '\n'
    return {'source': source, 'bom': bom, 'newline': newline,
            'revision': '"' + hashlib.sha256(raw).hexdigest() + '"'}


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
