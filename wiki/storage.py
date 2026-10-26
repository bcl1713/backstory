"""Linux descriptor-relative, no-follow access; no recursive request work."""
from collections import OrderedDict
from contextlib import contextmanager
from dataclasses import dataclass
import errno
import hashlib
import os
import secrets
import stat
import threading
import time

from django.conf import settings

from .contracts import CursorInvalid, FolderEntry, FolderPage, NoteSnapshot, PathDenied, StorageError, StorageUnavailable
from .policy import policy_version, validate_path

_DIRECTORY_FLAGS = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW | os.O_CLOEXEC
_FILE_FLAGS = os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK | os.O_CLOEXEC


def _os_error(error):
    if error.errno == errno.ENOENT:
        return StorageError("not_found", 404)
    if error.errno in {errno.ELOOP, errno.ENOTDIR}:
        return PathDenied()
    return StorageError("storage_io_error", 503)


@contextmanager
def open_directory(path=""):
    """Caller validates purpose; return a pinned directory and close every fd."""
    descriptor = None
    try:
        descriptor = os.open(settings.BACKSTORY_WIKI_ROOT, _DIRECTORY_FLAGS)
        for part in path.split("/") if path else ():
            child = os.open(part, _DIRECTORY_FLAGS, dir_fd=descriptor)
            os.close(descriptor)
            descriptor = child
        yield descriptor
    except OSError as error:
        raise _os_error(error) from None
    finally:
        if descriptor is not None:
            os.close(descriptor)


def check_marker():
    """Open only the configured marker, without reading any of its contents."""
    path = validate_path(settings.BACKSTORY_IDENTITY_PATH, "identity")
    with open_directory() as directory:
        descriptor = None
        try:
            descriptor = os.open(path, _FILE_FLAGS, dir_fd=directory)
            if not stat.S_ISREG(os.fstat(descriptor).st_mode):
                raise PathDenied()
        except OSError as error:
            raise _os_error(error) from None
        finally:
            if descriptor is not None:
                os.close(descriptor)


def read_regular(path, *, purpose, max_bytes, too_large_code):
    """Bounded reader for content and approved formatting configuration.

    A config caller must explicitly select the narrow config purpose. Public
    content entry points never accept a purpose supplied by the client.
    """
    if purpose == "identity":
        raise PathDenied()  # Marker contents are never read, even internally.
    validate_path(path, purpose)
    parent, _, name = path.rpartition("/")
    with open_directory(parent) as directory:
        descriptor = None
        try:
            descriptor = os.open(name, _FILE_FLAGS, dir_fd=directory)
            info = os.fstat(descriptor)
            if not stat.S_ISREG(info.st_mode):
                raise PathDenied()
            if info.st_size > max_bytes:
                raise StorageError(too_large_code, 413)
            chunks = []
            remaining = max_bytes + 1
            while remaining:
                chunk = os.read(descriptor, min(65536, remaining))
                if not chunk:
                    break
                chunks.append(chunk)
                remaining -= len(chunk)
            raw = b"".join(chunks)
            if len(raw) > max_bytes:
                raise StorageError(too_large_code, 413)
            return raw
        except OSError as error:
            raise _os_error(error) from None
        finally:
            if descriptor is not None:
                os.close(descriptor)


def require_ready():
    from .readiness import check_readiness
    readiness = check_readiness()
    if readiness.state != "ready":
        raise StorageUnavailable(readiness.reason_code)


def read_note(path: str) -> NoteSnapshot:
    validate_path(path, "content")
    require_ready()
    raw = read_regular(path, purpose="content", max_bytes=settings.BACKSTORY_NOTE_MAX_BYTES, too_large_code="note_too_large")
    bom = raw.startswith(b"\xef\xbb\xbf")
    try:
        source = raw.decode("utf-8-sig")
    except UnicodeError:
        raise StorageError("invalid_utf8", 422) from None
    # Mixed newline text stays unchanged; report a predominant style for editing.
    crlf = source.count("\r\n")
    newline = "\r\n" if crlf and crlf >= source.count("\n") - crlf else "\n"
    if "\r" in source and not "\n" in source:
        newline = "\r"
    return NoteSnapshot(path, source, raw, '"' + hashlib.sha256(raw).hexdigest() + '"', bom, newline)


def _fingerprint(descriptor):
    info = os.fstat(descriptor)
    return info.st_dev, info.st_ino, info.st_mtime_ns, info.st_ctime_ns


@dataclass
class _Listing:
    path: str
    fingerprint: tuple
    policy: str
    iterator: object
    descriptor: int
    expires: float

    def close(self):
        self.iterator.close()
        os.close(self.descriptor)


# Process-local cursors deliberately expire/restart on worker changes. Retain only
# one open directory iterator per cursor, never a tree or all filenames in RAM.
_CURSORS = OrderedDict()
_CURSOR_LOCK = threading.Lock()
_CURSOR_TTL = 60
_CURSOR_CAP = 32
_SCAN_CAP = 1000


def list_folder(path: str, cursor: str | None = None, limit: int = 100) -> FolderPage:
    validate_path(path, "folder")
    if not isinstance(limit, int) or not 1 <= limit <= 100:
        raise StorageError("invalid_limit")
    require_ready()
    with _CURSOR_LOCK:
        now = time.monotonic()
        for key, stale in list(_CURSORS.items()):
            if stale.expires <= now:
                _CURSORS.pop(key).close()
        listing = _CURSORS.pop(cursor, None) if cursor else None
        if cursor and listing is None:
            raise CursorInvalid()
        try:
            with open_directory(path) as directory:
                fingerprint = _fingerprint(directory)
                policy = policy_version()
                if listing is not None:
                    if listing.path != path or listing.fingerprint != fingerprint or listing.policy != policy:
                        raise CursorInvalid()
                else:
                    descriptor = os.dup(directory)
                    try:
                        iterator = os.scandir(descriptor)
                    except BaseException:
                        os.close(descriptor)
                        raise
                    listing = _Listing(path, fingerprint, policy, iterator, descriptor, now + _CURSOR_TTL)
                entries = []
                exhausted = False
                for _ in range(_SCAN_CAP):
                    try:
                        entry = next(listing.iterator)
                    except StopIteration:
                        exhausted = True
                        break
                    candidate = f"{path}/{entry.name}" if path else entry.name
                    try:
                        validate_path(candidate, "content")
                        info = entry.stat(follow_symlinks=False)
                    except (PathDenied, FileNotFoundError):
                        continue
                    if stat.S_ISDIR(info.st_mode):
                        kind = "folder"
                    elif stat.S_ISREG(info.st_mode):
                        kind = "file"
                    else:
                        continue
                    entries.append(FolderEntry(candidate, entry.name, kind))
                    if len(entries) == limit:
                        break
                # Check the pinned directory and freshly resolved name: rename or
                # replacement during enumeration must not yield a usable cursor.
                with open_directory(path) as current:
                    if _fingerprint(listing.descriptor) != fingerprint or _fingerprint(current) != fingerprint:
                        raise CursorInvalid()
                next_cursor = None
                if not exhausted:
                    next_cursor = secrets.token_urlsafe(24)
                    listing.expires = now + _CURSOR_TTL
                    while len(_CURSORS) >= _CURSOR_CAP:
                        _CURSORS.popitem(last=False)[1].close()
                    _CURSORS[next_cursor] = listing
                    listing = None
                return FolderPage(path, tuple(entries), next_cursor)
        except OSError as error:
            raise _os_error(error) from None
        finally:
            if listing is not None:
                listing.close()
