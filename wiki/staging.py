"""Track reserved siblings outside the wiki so startup needs no tree walk."""
import hashlib
import json
import os
from pathlib import Path
import re

from django.conf import settings

from .contracts import StorageError
from .policy import validate_path
from .revisions import application_lock
from .storage import open_directory, require_ready

_TEMP = re.compile(r"\.backstory-tmp-[0-9a-f]{32}\Z")


def _registry():
    return Path(settings.BACKSTORY_DATA_DIR) / "pending-saves"


def _record(path):
    return _registry() / (hashlib.sha256(path.encode()).hexdigest() + ".json")


def register_stage(path, temporary):
    root = _registry()
    root.mkdir(mode=0o700, parents=True, exist_ok=True)
    try:
        fd = os.open(_record(path), os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW | os.O_CLOEXEC, 0o600)
    except FileExistsError:
        raise StorageError("staging_cleanup_required", 503) from None
    with os.fdopen(fd, "w") as stream:
        json.dump({"path": path, "temporary": temporary}, stream)
        stream.flush()
        os.fsync(stream.fileno())
    fd = os.open(root, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW | os.O_CLOEXEC)
    try:
        os.fsync(fd)
    finally:
        os.close(fd)


def finish_stage(path):
    try:
        _record(path).unlink(missing_ok=True)
    except OSError:
        pass  # Startup can retry; publication must keep its honest result.


def _read_registration(entry):
    fd = os.open(entry.path, os.O_RDONLY | os.O_NOFOLLOW | os.O_CLOEXEC)
    with os.fdopen(fd, "rb") as stream:
        raw = stream.read(16385)
    if len(raw) > 16384:
        raise ValueError
    record = json.loads(raw)
    path, temporary = record["path"], record["temporary"]
    validate_path(path, "content")
    if _record(path).name != entry.name or not _TEMP.fullmatch(temporary):
        raise ValueError
    return path, temporary


def cleanup_staged_saves():
    """Skip active writers, unknown files, symlinks and unavailable storage."""
    try:
        require_ready()
        root = _registry()
        if not root.exists():
            return
        with os.scandir(root) as entries:
            for index, entry in enumerate(entries):
                if index >= 1024:
                    break
                if not entry.name.endswith(".json") or not entry.is_file(follow_symlinks=False):
                    continue
                try:
                    path, _ = _read_registration(entry)
                    with application_lock("note:" + path, blocking=False):
                        # A writer may have replaced the record before we locked.
                        latest_path, temporary = _read_registration(entry)
                        if latest_path != path:
                            continue
                        parent = path.rpartition("/")[0]
                        with open_directory(parent) as directory:
                            try:
                                os.unlink(temporary, dir_fd=directory)
                            except FileNotFoundError:
                                pass
                        finish_stage(path)
                except (OSError, StorageError, ValueError, KeyError, TypeError):
                    continue
    except (OSError, StorageError):
        return
