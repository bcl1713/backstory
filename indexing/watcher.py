"""Service-owned bounded Linux notifications with durable polling recovery.

Notifications are hints, never storage authority. No note/attachment bodies are
read here; the worker resolves coalesced paths through shared safe storage.
"""
import ctypes
import fcntl
import os
import select
import stat
import struct
import time

from django.conf import settings
from django.db import OperationalError
from wiki.contracts import StorageError
from wiki.policy import validate_path
from wiki.storage import open_directory
from .graph_projection import namespace_version
from .models import ScanState
from .queue import invalidate_path, require_reconciliation

# inotify ABI from Linux UAPI; no optional package or polling thread required.
_MODIFY = 0x2 | 0x4 | 0x8 | 0x40 | 0x80 | 0x100 | 0x200
_SELF = 0x400 | 0x800 | 0x2000
_OVERFLOW = 0x4000
_IGNORED = 0x8000
_ISDIR = 0x40000000
_EVENT = struct.Struct('iIII')


class NativeWatcher:
    def __init__(self):
        self.libc = ctypes.CDLL(None, use_errno=True)
        self.libc.inotify_init1.argtypes = [ctypes.c_int]
        self.libc.inotify_add_watch.argtypes = [ctypes.c_int, ctypes.c_char_p, ctypes.c_uint32]
        self.libc.inotify_rm_watch.argtypes = [ctypes.c_int, ctypes.c_int]
        self.fd = self.libc.inotify_init1(os.O_NONBLOCK | os.O_CLOEXEC)
        if self.fd < 0:
            raise OSError(ctypes.get_errno(), 'watch_unavailable')
        self.paths = {}
        self.complete = False
        self.refresh = False
        self.walk = self._coverage()

    def _coverage(self):
        # Register each directory BEFORE enumerating it. Reconciliation after
        # complete coverage catches edits made before descendant registration.
        seen = set()
        stack = []
        def enter(path):
            with open_directory(path) as directory:
                wd = self.libc.inotify_add_watch(self.fd, os.fsencode(f'/proc/self/fd/{directory}'), _MODIFY | _SELF)
                if wd < 0:
                    raise OSError(ctypes.get_errno(), 'watch_unavailable')
                self.paths[wd] = path
                seen.add(wd)
                if len(self.paths) > min(settings.BACKSTORY_INDEX_WATCH_LIMIT, 65536):
                    raise OSError('watch_limit')
                # DirEntry.stat uses the supplied fd, so retain it until the
                # directory iterator is exhausted as well as scandir's own dup.
                pinned = os.dup(directory)
                try:
                    return os.scandir(pinned), pinned
                except BaseException:
                    os.close(pinned)
                    raise
        try:
            iterator, pinned = enter('')
            stack.append(('', iterator, pinned))
            while stack:
                path, iterator, pinned = stack[-1]
                entry = next(iterator, None)
                if entry is None:
                    iterator.close()
                    os.close(pinned)
                    stack.pop()
                    continue
                candidate = '/'.join(filter(None, (path, entry.name)))
                try:
                    validate_path(candidate, 'content')
                    is_directory = stat.S_ISDIR(entry.stat(follow_symlinks=False).st_mode)
                    if is_directory:
                        validate_path(candidate, 'folder')
                        if len(stack) >= 128:
                            raise OSError('watch_limit')
                        child_iterator, child_fd = enter(candidate)
                        stack.append((candidate, child_iterator, child_fd))
                except StorageError as error:
                    if error.reason_code != 'path_denied':
                        raise
                yield
            for wd in list(self.paths):
                if wd not in seen:
                    self.libc.inotify_rm_watch(self.fd, wd)
                    self.paths.pop(wd, None)
        finally:
            for _, iterator, pinned in stack:
                iterator.close()
                os.close(pinned)

    def poll(self):
        events = []
        # A bounded read caps memory and foreground latency; remaining kernel
        # events are drained on the next tick, and overflow forces verification.
        try:
            raw = os.read(self.fd, 65536)
        except BlockingIOError:
            raw = b''
        offset = 0
        while offset + _EVENT.size <= len(raw):
            wd, mask, _, length = _EVENT.unpack_from(raw, offset)
            offset += _EVENT.size
            name = os.fsdecode(raw[offset:offset + length].split(b'\0', 1)[0])
            offset += length
            if mask & _OVERFLOW:
                events.append((None, 'overflow'))
                self.refresh = True
                continue
            if mask & _IGNORED:
                self.paths.pop(wd, None)
                continue
            parent = self.paths.get(wd)
            if parent is None:
                continue
            if mask & (_SELF | _ISDIR):
                events.append((None, 'directory_changed'))
                self.refresh = True
            elif name:
                events.append(('/'.join(filter(None, (parent, name))), 'path'))
        if self.complete and self.refresh:
            self.complete = False
            self.refresh = False
            self.walk = self._coverage()
        if not self.complete:
            started = time.monotonic()
            for _ in range(256):
                try:
                    next(self.walk)
                except StopIteration:
                    self.complete = True
                    events.append((None, 'coverage_complete'))
                    break
                if time.monotonic() - started >= .05:
                    break
        return events

    def wait(self, timeout):
        select.select([self.fd], [], [], timeout)

    def close(self):
        self.walk.close()
        os.close(self.fd)


class WatchService:
    def __init__(self, factory=NativeWatcher):
        self.factory = factory
        self.backend = None
        self.identity = None
        self.retry_at = 0
        self.lock = None
        self.owned = False
        self.status = None
        self.started = False

    def __enter__(self):
        settings.BACKSTORY_DATA_DIR.mkdir(mode=0o700, parents=True, exist_ok=True)
        self.lock = os.open(settings.BACKSTORY_DATA_DIR / 'index-watch.lock', os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
        try:
            fcntl.flock(self.lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            self.owned = True
        except BlockingIOError:
            pass
        return self

    def _status(self, mode, health, reason=''):
        value = {'mode': mode, 'health': health, 'reason': reason}
        if value != self.status:
            ScanState.objects.get_or_create(pk=1)
            ScanState.objects.filter(pk=1).update(watcher=value)
            self.status = value

    def poll(self):
        if not self.owned:
            return
        try:
            if not self.started:
                require_reconciliation()  # Durable restart gap, even polling-only.
                self.started = True
            identity = namespace_version()
            if self.identity is not None and identity != self.identity:
                require_reconciliation()
                if self.backend:
                    self.backend.close()
                    self.backend = None
                self.retry_at = 0
            self.identity = identity
            if settings.BACKSTORY_INDEX_WATCH_MODE == 'poll':
                self._status('poll', 'healthy', 'polling_configured')
                return
            if self.backend is None:
                if time.monotonic() < self.retry_at:
                    return
                self.backend = self.factory()
            events = self.backend.poll()
            repair = False
            reason = ''
            unique = set()
            for path, kind in events:
                if kind == 'path':
                    if path in unique:
                        continue
                    if len(unique) >= 256:
                        repair = True
                        reason = 'overflow'
                        continue
                    unique.add(path)
                    try:
                        invalidate_path(path)
                    except StorageError as error:
                        if error.reason_code != 'path_denied':
                            raise
                else:
                    repair = True
                    reason = kind
            if repair:
                require_reconciliation()
            self._status('native', 'healthy' if self.backend.complete else 'starting',
                         reason if reason in {'overflow', 'directory_changed'} else '')
        except (OSError, StorageError, OperationalError, AttributeError):
            if self.backend:
                self.backend.close()
                self.backend = None
            # Queue/database failure cannot silently acknowledge observed events.
            # A later successful tick durably repairs any lost in-memory hints.
            self.started = False
            self.retry_at = time.monotonic() + 30
            try:
                require_reconciliation()
                self.started = True
                self._status('poll', 'degraded', 'watch_unavailable')
            except OperationalError:
                pass

    def wait(self, timeout):
        if self.backend:
            self.backend.wait(timeout)
        else:
            time.sleep(timeout)

    def __exit__(self, *args):
        if self.backend:
            self.backend.close()
        if self.lock is not None:
            os.close(self.lock)
