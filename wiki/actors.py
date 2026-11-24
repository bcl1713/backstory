"""Server-owned access seam; local process authority is never a browser account."""
from dataclasses import dataclass
import os
from typing import Callable

from django.core.exceptions import PermissionDenied

from .policy import validate_path
from .contracts import StorageError


def storage_scope():
    """Stable across ordinary wiki writes, changed by root/marker replacement."""
    from django.conf import settings
    from .storage import open_directory, require_ready
    require_ready()
    with open_directory() as root:
        info = os.fstat(root)
        marker = os.stat(settings.BACKSTORY_IDENTITY_PATH, dir_fd=root, follow_symlinks=False)
    return {'root': [info.st_dev, info.st_ino],
            'marker': [marker.st_dev, marker.st_ino, marker.st_ctime_ns]}


def require_actor(actor):
    from .models import LocalActor
    if isinstance(actor, LocalActor):
        binding = LocalActor.objects.filter(pk=actor.pk, enabled=True).values_list('storage_context', flat=True).first()
        if actor.pk != 1 or binding is None:
            raise PermissionDenied
        if not binding or binding != storage_scope():
            raise StorageError('local_storage_context_changed', 503)
    elif not actor.is_authenticated or not actor.is_active:
        raise PermissionDenied


def owner_fields(actor):
    from .models import LocalActor
    require_actor(actor)
    return {'actor': None, 'local_actor': actor} if isinstance(actor, LocalActor) else {'actor': actor, 'local_actor': None}


def record_owner(record):
    return {'actor_id': record.actor_id, 'local_actor_id': record.local_actor_id}


def actor_key(actor):
    from .models import LocalActor
    require_actor(actor)
    return ('local:' if isinstance(actor, LocalActor) else '') + str(actor.pk)


@dataclass(frozen=True)
class Access:
    actor: object
    authorize: Callable

    @property
    def key(self):
        return actor_key(self.actor)


def local_access():
    """Explicit native transports only; no user lookup or client actor input."""
    from .models import LocalActor
    actor, _ = LocalActor.objects.get_or_create(pk=1, defaults={'storage_context': storage_scope()})
    require_actor(actor)

    def authorize(path, purpose='content'):
        require_actor(actor)
        return validate_path(path, purpose)
    return Access(actor, authorize)
