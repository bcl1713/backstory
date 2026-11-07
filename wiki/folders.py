"""Exclusive, non-recursive folder creation under the shared wiki write lock."""
import os
import stat
from urllib.parse import urlencode
from django.core.exceptions import PermissionDenied
from django.urls import reverse
from .contracts import PathDenied, StorageError
from .policy import validate_path
from .relocations import wiki_write_lock
from .storage import open_directory, require_ready


def _same_parent(path, pinned):
    with open_directory(path) as current:
        a, b = os.fstat(pinned), os.fstat(current)
        return (a.st_dev, a.st_ino) == (b.st_dev, b.st_ino)


def create_folder(path, actor):
    try:
        return _create_folder(path, actor)
    except OSError:
        raise StorageError('folder_creation_failed', 503) from None


def _create_folder(path, actor):
    if not actor.is_authenticated or not actor.is_active:
        raise PermissionDenied
    validate_path(path, 'folder')
    if not path:
        raise PathDenied()
    parent, _, name = path.rpartition('/')
    result = {'path': path, 'href': reverse('wiki:shell') + '?' + urlencode({'folder': path})}
    require_ready()
    with wiki_write_lock(), open_directory(parent) as directory:
        require_ready()
        if not _same_parent(parent, directory):
            raise StorageError('parent_changed', 409)
        try:
            # Default directory mode follows the deployment's umask, never chmod
            # an existing directory. mkdir is exclusive even across processes.
            os.mkdir(name, dir_fd=directory)
        except FileExistsError:
            target = os.stat(name, dir_fd=directory, follow_symlinks=False)
            if not stat.S_ISDIR(target.st_mode):
                raise StorageError('destination_conflict', 409) from None
            if not _same_parent(parent, directory):
                raise StorageError('parent_changed', 409)
            return {**result, 'state': 'already_exists', 'authoritative': True}
        except OSError:
            raise StorageError('folder_creation_failed', 503) from None
        try:
            os.fsync(directory)
            if not _same_parent(parent, directory):
                raise StorageError('parent_changed', 409)
            target = os.stat(name, dir_fd=directory, follow_symlinks=False)
            if not stat.S_ISDIR(target.st_mode):
                raise StorageError('destination_changed', 409)
        except (OSError, StorageError):
            return {**result, 'state': 'uncertain', 'reason_code': 'folder_creation_unconfirmed',
                    'inspect_before_retry': True, 'authoritative': False}
        return {**result, 'state': 'created', 'authoritative': True}
