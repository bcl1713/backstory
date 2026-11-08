"""Descriptor-safe traversal with durable offsets and bounded live cursors.

Offsets are checkpoints, never filesystem snapshots. A small process-local
iterator cache avoids replaying directory prefixes during ordinary batches.
After restart/eviction, prefix replay consumes the same entry budget as discovery.
Directory identity/timestamps are checked on every resume and before returning;
a changed directory aborts the pass before deletion or generation publication.
"""
import atexit
from collections import OrderedDict
from dataclasses import dataclass
import os
import stat
import threading
import time
import uuid

from wiki.contracts import PathDenied, StorageError
from wiki.policy import policy_version, validate_path
from wiki.storage import open_directory


_CURSOR_LIMIT = 32
_CURSOR_SECONDS = 60
_CURSORS = OrderedDict()
_CURSOR_LOCK = threading.Lock()


@dataclass
class _Cursor:
    descriptor: int
    iterator: object
    fingerprint: list
    offset: int = 0
    touched: float = 0

    def close(self):
        try:
            self.iterator.close()
        finally:
            os.close(self.descriptor)


def clear_cursors():
    """Release transient traversal resources; durable checkpoints remain usable."""
    with _CURSOR_LOCK:
        while _CURSORS:
            _, cursor = _CURSORS.popitem(last=False)
            cursor.close()


atexit.register(clear_cursors)


def fingerprint(info):
    return [info.st_dev, info.st_ino, info.st_mtime_ns, info.st_ctime_ns]


def file_stat(path):
    parent, _, name = path.rpartition('/')
    with open_directory(parent) as directory:
        info = os.stat(name, dir_fd=directory, follow_symlinks=False)
        if not stat.S_ISREG(info.st_mode):
            raise PathDenied()
        return {'size': info.st_size, 'mtime': info.st_mtime_ns, 'inode': info.st_ino, 'device': info.st_dev}


def _drop(key):
    cursor = _CURSORS.pop(key, None)
    if cursor is not None:
        cursor.close()


def _next_paths(checkpoint, limit, entry_limit):
    token = checkpoint.setdefault('cursor_token', uuid.uuid4().hex)
    policy = policy_version()
    if checkpoint.setdefault('scan_policy', policy) != policy:
        raise StorageError('scan_directory_changed', 503)
    now = time.monotonic()
    for key, cursor in list(_CURSORS.items()):
        if now - cursor.touched >= _CURSOR_SECONDS:
            _drop(key)
    stack = checkpoint.setdefault('stack', [{'path': '', 'offset': 0}])
    paths = []
    examined = 0
    while stack and len(paths) < limit and examined < entry_limit:
        frame = stack[-1]
        key = (token, frame['path'])
        # Reopen through shared no-follow storage on every resume. The retained
        # descriptor alone cannot prove that the directory still has this path.
        with open_directory(frame['path']) as directory:
            before = fingerprint(os.fstat(directory))
            if frame.get('fingerprint', before) != before:
                raise StorageError('scan_directory_changed', 503)
            frame['fingerprint'] = before
            cursor = _CURSORS.get(key)
            if cursor and (cursor.fingerprint != before or cursor.offset > frame['offset']):
                _drop(key)
                cursor = None
            if cursor is None:
                while len(_CURSORS) >= _CURSOR_LIMIT:
                    _drop(next(iter(_CURSORS)))
                descriptor = os.dup(directory)
                try:
                    iterator = os.scandir(descriptor)
                except BaseException:
                    os.close(descriptor)
                    raise
                cursor = _Cursor(descriptor, iterator, before)
                _CURSORS[key] = cursor
            _CURSORS.move_to_end(key)
            cursor.touched = now
            exhausted = False
            # Replaying a durable offset is real enumeration work. Retain the
            # replay cursor when its budget expires instead of starting again.
            while cursor.offset < frame['offset'] and examined < entry_limit:
                try:
                    next(cursor.iterator)
                except StopIteration:
                    raise StorageError('scan_directory_changed', 503) from None
                cursor.offset += 1
                examined += 1
            while cursor.offset == frame['offset'] and len(paths) < limit and examined < entry_limit:
                try:
                    entry = next(cursor.iterator)
                except StopIteration:
                    exhausted = True
                    break
                cursor.offset += 1
                frame['offset'] += 1
                examined += 1
                candidate = '/'.join(filter(None, [frame['path'], entry.name]))
                try:
                    validate_path(candidate, 'content')
                    info = entry.stat(follow_symlinks=False)
                    if stat.S_ISDIR(info.st_mode):
                        validate_path(candidate, 'folder')
                except PathDenied:
                    continue
                if stat.S_ISDIR(info.st_mode):
                    stack.append({'path': candidate, 'offset': 0})
                    break
                if stat.S_ISREG(info.st_mode) and candidate.lower().endswith('.md'):
                    paths.append(candidate)
            if (fingerprint(os.fstat(directory)) != before
                    or fingerprint(os.fstat(cursor.descriptor)) != before):
                raise StorageError('scan_directory_changed', 503)
            if exhausted:
                _drop(key)
                stack.pop()
    return paths, not stack


def next_paths(checkpoint, limit=20, entry_limit=200):
    with _CURSOR_LOCK:
        try:
            return _next_paths(checkpoint, max(1, limit), max(1, entry_limit))
        except BaseException:
            # A failed/restarted pass must not retain stale descriptors.
            token = checkpoint.get('cursor_token')
            for key in list(_CURSORS):
                if key[0] == token:
                    _drop(key)
            raise
