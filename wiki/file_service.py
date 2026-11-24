"""Shared bounded attachment identity, publication and inspection; no HTTP context."""
import base64
from contextlib import nullcontext
import hashlib
import os
import posixpath
import re
import secrets
import stat
from urllib.parse import quote

from .attachments import _limit, _MAX_FILE_BYTES
from .contracts import StorageError
from .folders import _same_parent
from .relocations import wiki_write_lock
from .revisions import application_lock
from .staging import register_stage, finish_stage
from .storage import open_directory, read_note, require_ready

MAX_BYTES = 8 * 1024 * 1024
MAX_FILES = 1000
MAX_STORAGE_BYTES = 256 * 1024 * 1024
MAX_ENTRIES = 10000
CHUNK_BYTES = 65536
RECEIVE_SECONDS = 30
MAX_ENCODED_BYTES = 256 * 1024
MAX_BASE64_CHARS = 349528
MAX_JSON_BYTES = 360 * 1024
_DIGEST = re.compile(r'[0-9a-f]{64}\Z')
_NAME = re.compile(r'file-([0-9a-f]{64})-([A-Za-z0-9_-]{2,160})\.attachment\Z')
_RASTER = re.compile(r'upload-[0-9a-f]{64}\.(png|jpg|webp)\Z')
_FLAGS = os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK | os.O_CLOEXEC


def display_name(value):
    if not isinstance(value, str) or not value or value in {'.', '..'}:
        raise StorageError('invalid_file_name')
    try:
        encoded = value.encode('utf-8', errors='strict')
    except UnicodeError:
        raise StorageError('invalid_file_name') from None
    if len(encoded) > 120 or any(ord(c) < 32 or ord(c) == 127 or c in '/\\' for c in value):
        raise StorageError('invalid_file_name')
    return value

def asset_name(filename, digest):
    display_name(filename)
    if not isinstance(digest, str) or not _DIGEST.fullmatch(digest):
        raise StorageError('invalid_file_digest')
    encoded = base64.urlsafe_b64encode(filename.encode()).decode().rstrip('=')
    return 'file-' + digest + '-' + encoded + '.attachment'

def original_name(path):
    """Decode only canonical root upload identities, never arbitrary path metadata."""
    if not path.startswith('assets/') or path.count('/') != 1:
        return None
    match = _NAME.fullmatch(path[7:])
    if not match:
        return None
    try:
        name = base64.urlsafe_b64decode(match[2] + '=' * (-len(match[2]) % 4)).decode('utf-8')
        return name if asset_name(name, match[1]) == path[7:] else None
    except (ValueError, UnicodeError, StorageError):
        return None

def _result(filename, digest, path, note, state, size=None):
    relative = posixpath.relpath(path, posixpath.dirname(note) or '.') if note else path
    # Every punctuation character significant to Markdown is escaped in labels;
    # destinations use percent encoding rather than raw punctuation/parentheses.
    label = re.sub(r'([\\`*_{}\[\]()#+.!<>|~-])', r'\\\1', filename)
    return {'state': state, 'authoritative': state in {'created', 'already_exists', 'confirmed', 'absent'},
            'path': path, 'href': '/attachments/' + quote(path, safe='/'),
            'original_filename': filename, 'bytes': size, 'sha256': digest,
            'markdown': '[' + label + '](' + quote(relative, safe='/.-_') + ')',
            'inspect_before_retry': state == 'uncertain'}

def _quota(directory, additional, *, max_files=MAX_FILES, max_bytes=MAX_STORAGE_BYTES, max_entries=MAX_ENTRIES):
    count = size = 0
    with os.scandir(directory) as entries:
        for index, entry in enumerate(entries):
            if index >= max_entries:
                raise StorageError('file_storage_scan_limit', 413)
            if _NAME.fullmatch(entry.name) or _RASTER.fullmatch(entry.name):
                info = entry.stat(follow_symlinks=False)
                count += 1
                size += info.st_size
    if count >= max_files or size + additional > max_bytes:
        raise StorageError('file_storage_full', 413)
    return max_bytes - size

def _observe(directory, name, digest, maximum):
    try:
        fd = os.open(name, _FLAGS, dir_fd=directory)
    except FileNotFoundError:
        return None
    with os.fdopen(fd, 'rb') as stream:
        info = os.fstat(stream.fileno())
        if not stat.S_ISREG(info.st_mode) or info.st_size > maximum:
            raise StorageError('file_destination_conflict', 409)
        hashed = hashlib.sha256()
        size = 0
        while chunk := stream.read(min(CHUNK_BYTES, maximum + 1 - size)):
            size += len(chunk)
            if size > maximum:
                raise StorageError('file_destination_conflict', 409)
            hashed.update(chunk)
        final = os.fstat(stream.fileno())
        current = os.stat(name, dir_fd=directory, follow_symlinks=False)
        fingerprint = lambda s: (s.st_dev, s.st_ino, s.st_size, s.st_mtime_ns, s.st_ctime_ns)
        if (size != info.st_size or hashed.hexdigest() != digest or
                fingerprint(info) != fingerprint(final) or fingerprint(info) != fingerprint(current)):
            raise StorageError('file_destination_conflict', 409)
        return size

def publish(filename, digest, path, note, *, receive, revalidate, receiver_locked=False,
            maximum=None, max_files=MAX_FILES, max_bytes=MAX_STORAGE_BYTES, max_entries=MAX_ENTRIES):
    maximum = min(MAX_BYTES, _limit('BACKSTORY_ATTACHMENT_MAX_BYTES', _MAX_FILE_BYTES)) if maximum is None else maximum
    name = path[7:]
    temporary = '.backstory-tmp-' + secrets.token_hex(16)
    attempted = registered = False
    with (nullcontext() if receiver_locked else application_lock('file-upload', blocking=False)), wiki_write_lock(blocking=False), application_lock('note:' + path, blocking=False), open_directory('assets') as directory:
        require_ready()
        if not _same_parent('assets', directory):
            raise StorageError('parent_changed', 409)
        existing = _observe(directory, name, digest, maximum)
        allowance = maximum if existing is not None else min(maximum, _quota(directory, 0, max_files=max_files, max_bytes=max_bytes, max_entries=max_entries))
        try:
            register_stage(path, temporary)
            registered = True
            size, observed = receive(directory, temporary, allowance)
            if observed != digest:
                raise StorageError('file_digest_mismatch', 409)
            require_ready()
            revalidate()
            if not _same_parent('assets', directory):
                raise StorageError('parent_changed', 409)
            if existing is not None:
                if _observe(directory, name, digest, maximum) != size:
                    raise StorageError('file_destination_conflict', 409)
                state = 'already_exists'
            else:
                attempted = True
                os.link(temporary, name, src_dir_fd=directory, dst_dir_fd=directory, follow_symlinks=False)
                os.fsync(directory)
                if not _same_parent('assets', directory) or _observe(directory, name, digest, maximum) != size:
                    raise StorageError('file_readback_unconfirmed', 409)
                state = 'created'
            result = _result(filename, digest, path, note, state, size)
        except (OSError, StorageError):
            if not attempted:
                raise
            result = _result(filename, digest, path, note, 'uncertain')
            result['reason_code'] = 'file_upload_unconfirmed'
        finally:
            if registered:
                try:
                    os.unlink(temporary, dir_fd=directory)
                except FileNotFoundError:
                    finish_stage(path)
                except OSError:
                    pass  # Existing registered-stage startup cleanup owns retry.
                else:
                    finish_stage(path)
    return result


def identity(access, filename, digest, note=None):
    filename = display_name(filename)
    path = access.authorize('assets/' + asset_name(filename, digest))
    access.authorize('assets', 'folder')
    if note is not None:
        note = access.authorize(note)
        if not note.lower().endswith('.md'):
            raise StorageError('path_denied', 404)
        read_note(note)
    require_ready()
    return filename, digest, path, note


def upload_encoded(access, filename, data_base64, note=None):
    """Canonical <=256KiB byte upload, using the ordinary publication service."""
    try:
        if not isinstance(data_base64, str) or len(data_base64) > MAX_BASE64_CHARS:
            raise StorageError('encoded_file_too_large', 413)
        data = base64.b64decode(data_base64, validate=True)
        if len(data) > MAX_ENCODED_BYTES:
            raise StorageError('encoded_file_too_large', 413)
        if base64.b64encode(data).decode() != data_base64:
            raise ValueError
    except (ValueError, UnicodeError):
        raise StorageError('invalid_encoded_file') from None
    selected = identity(access, filename, hashlib.sha256(data).hexdigest(), note)

    def receive(directory, temporary, maximum):
        # Same staged fsync/receive semantics, already bounded in memory.
        if len(data) > maximum:
            raise StorageError('file_too_large_or_storage_full', 413)
        fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW | os.O_CLOEXEC, 0o600, dir_fd=directory)
        with os.fdopen(fd, 'wb') as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        return len(data), hashlib.sha256(data).hexdigest()

    return publish(*selected, receive=receive,
                   revalidate=lambda: access.authorize('assets', 'folder'))


def inspect(access, filename, sha256, note=None):
    filename, digest, path, note = identity(access, filename, sha256, note)
    maximum = min(MAX_BYTES, _limit('BACKSTORY_ATTACHMENT_MAX_BYTES', _MAX_FILE_BYTES))
    with application_lock('file-upload', blocking=False), open_directory('assets') as directory:
        size = _observe(directory, path[7:], digest, maximum)
        require_ready()
        if not _same_parent('assets', directory):
            raise StorageError('parent_changed', 409)
    return _result(filename, digest, path, note, 'absent' if size is None else 'confirmed', size)
