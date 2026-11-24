"""Bounded owner-scoped journal discovery after a lost initial preview response.

Metadata only: never reads plans/recovery bytes, starts work or claims disk state.
"""
import hashlib
import json
import os
import uuid

from django.conf import settings
from django.core import signing
from django.db.models import Count, Max

from .actors import owner_fields
from .contracts import StorageError
from .management_service import _eligible
from .models import MoveOperation, RemovalOperation
from .policy import policy_version
from .storage import open_directory, require_ready

_SALT = 'backstory.native.operation-list.v1'
_STATES = {'preview', 'applying', 'recovery_required', 'completed', 'cancelled',
           'removed', 'restoring', 'restored'}


def _scope(access):
    require_ready()
    with open_directory() as root:
        info = os.fstat(root)
        marker = os.stat(settings.BACKSTORY_IDENTITY_PATH, dir_fd=root, follow_symlinks=False)
    identity = [access.key, policy_version(), info.st_dev, info.st_ino,
                marker.st_dev, marker.st_ino, marker.st_ctime_ns]
    return hashlib.sha256(json.dumps(identity).encode()).hexdigest()


def list_operations(access, kind, *, limit=30, cursor=None):
    if kind not in {'move', 'removal'} or type(limit) is not int or not 1 <= limit <= 100:
        raise StorageError('invalid_arguments')
    model = MoveOperation if kind == 'move' else RemovalOperation
    fields = ('source', 'destination') if kind == 'move' else ('path',)
    rows = model.objects.filter(**owner_fields(access.actor))
    membership = rows.aggregate(count=Count('pk'), latest=Max('created_at'))
    binding = {'scope': _scope(access), 'kind': kind, 'limit': limit,
               'count': membership['count'],
               'latest': membership['latest'].isoformat() if membership['latest'] else None}
    after = None
    if cursor is not None:
        try:
            if not isinstance(cursor, str) or not 1 <= len(cursor) <= 4096:
                raise ValueError
            decoded = signing.loads(cursor, salt=_SALT, max_age=900)
            if not isinstance(decoded, dict) or decoded.get('binding') != binding:
                raise ValueError
            after = uuid.UUID(decoded['after'])
        except (signing.BadSignature, ValueError, KeyError, TypeError, AttributeError):
            raise StorageError('cursor_invalid', 409) from None
    if after is not None:
        rows = rows.filter(pk__gt=after)
    # Limit examined records as well as returned records; no payload columns.
    page = list(rows.only('id', 'state', 'created_at', *fields).order_by('id')[:limit + 1])
    more = len(page) > limit
    page = page[:limit]
    items = []
    for row in page:
        try:
            for field in fields:
                _eligible(access, getattr(row, field))
        except StorageError as error:
            if error.status == 404:
                continue  # Withhold paths current policy/storage would not disclose.
            raise
        items.append({'operation_id': str(row.pk), 'kind': kind,
                      'state': row.state if row.state in _STATES else 'unknown',
                      'created_at': row.created_at.isoformat(),
                      **{field: getattr(row, field) for field in fields}})
    next_cursor = signing.dumps({'binding': binding, 'after': str(page[-1].pk)}, salt=_SALT) if more else None
    return {'state': 'ok', 'items': items, 'next_cursor': next_cursor,
            'enumeration_complete': not more, 'authoritative': False,
            'examined': len(page), 'scope': 'actor_owned_journal_metadata'}
