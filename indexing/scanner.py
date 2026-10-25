"""Persisted descriptor-safe traversal with bounded work and memory.

Directory offsets are checkpoints, not authoritative filesystem snapshots.
Fingerprint changes abort/restart the pass before any deletion/promotion. Each
batch revisits its current directory offset; no tree is materialized in memory.
"""
import os
import stat
from wiki.contracts import PathDenied, StorageError
from wiki.policy import validate_path
from wiki.storage import open_directory


def fingerprint(info):
    return [info.st_dev, info.st_ino, info.st_mtime_ns, info.st_ctime_ns]


def file_stat(path):
    parent, _, name = path.rpartition('/')
    with open_directory(parent) as directory:
        info = os.stat(name, dir_fd=directory, follow_symlinks=False)
        if not stat.S_ISREG(info.st_mode):
            raise PathDenied()
        return {'size': info.st_size, 'mtime': info.st_mtime_ns, 'inode': info.st_ino, 'device': info.st_dev}


def next_paths(checkpoint, limit=20, entry_limit=200):
    stack = checkpoint.setdefault('stack', [{'path': '', 'offset': 0}])
    paths = []
    examined = 0
    # Depth-first frames bound memory by path depth, not folder width.
    while stack and len(paths) < limit and examined < entry_limit:
        frame = stack[-1]
        with open_directory(frame['path']) as directory:
            before = fingerprint(os.fstat(directory))
            if frame.get('fingerprint', before) != before:
                raise StorageError('scan_directory_changed', 503)
            frame['fingerprint'] = before
            iterator = os.scandir(directory)
            descended = False
            exhausted = False
            with iterator:
                for _ in range(frame['offset']):
                    try:
                        next(iterator)
                    except StopIteration:
                        raise StorageError('scan_directory_changed', 503) from None
                while len(paths) < limit and examined < entry_limit:
                    try:
                        entry = next(iterator)
                    except StopIteration:
                        exhausted = True
                        break
                    frame['offset'] += 1
                    examined += 1
                    candidate = '/'.join(filter(None, [frame['path'], entry.name]))
                    try:
                        validate_path(candidate, 'content')
                        info = entry.stat(follow_symlinks=False)
                    except PathDenied:
                        continue
                    if stat.S_ISDIR(info.st_mode):
                        stack.append({'path': candidate, 'offset': 0})
                        descended = True
                        break
                    if stat.S_ISREG(info.st_mode) and candidate.lower().endswith('.md'):
                        paths.append(candidate)
            if fingerprint(os.fstat(directory)) != before:
                raise StorageError('scan_directory_changed', 503)
            if exhausted and not descended:
                stack.pop()
    return paths, not stack
