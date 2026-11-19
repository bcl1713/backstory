"""Exact-byte root attachments: bounded receive, exclusive publication, inspection."""
import base64
from contextlib import contextmanager, nullcontext
import hashlib
from io import BytesIO
import json
import os
import posixpath
import re
import secrets
import socket
import stat
import threading
import time
from urllib.parse import quote

from .attachments import _limit, _MAX_FILE_BYTES
from .contracts import StorageError
from .folders import _same_parent
from .policy import authorize_content
from .relocations import wiki_write_lock
from .revisions import application_lock
from .staging import register_stage, finish_stage
from .storage import open_directory, read_note, require_ready
from .tool_views import _tool, _json

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


def _identity(request, values=None):
    query = values is None
    values = request.GET if query else values
    if (set(values) - {'filename', 'sha256', 'note'} or
            not {'filename', 'sha256'} <= set(values) or
            query and any(len(values.getlist(key)) != 1 for key in values)):
        raise StorageError('invalid_file_request')
    filename = display_name(values['filename'])
    # Validate original query encoding without applying content policy to the
    # display name (AGENTS.md, config names etc. are safe opaque attachments).
    from .policy import _strict_uri_component
    for pair in request.META.get('QUERY_STRING', '').split('&'):
        key, _, value = pair.partition('=')
        _strict_uri_component(key, form=True)
        _strict_uri_component(value, form=True)
    path = authorize_content(request, 'assets/' + asset_name(filename, values['sha256']))
    authorize_content(request, 'assets', 'folder')
    note = values.get('note')
    if note is not None:
        note = authorize_content(request, note, query_parameter='note' if query else None)
        if not note.lower().endswith('.md'):
            raise StorageError('path_denied', 404)
        read_note(note)
    require_ready()
    return filename, values['sha256'], path, note


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


@contextmanager
def _receive_deadline(request):
    """Gunicorn's socket is request-owned; stop blocked reads as well as loops.

    Test/development WSGI input may already be buffered and lack a socket; those
    inputs still have the between-read budget. Production uses pinned Gunicorn.
    """
    deadline = time.monotonic() + RECEIVE_SECONDS
    connection = request.META.get('gunicorn.socket')
    active = threading.Lock()
    expired = threading.Event()
    finished = False
    def interrupt():
        with active:
            if finished:
                return
            expired.set()
            try:
                connection.shutdown(socket.SHUT_RD)
            except OSError:
                pass
    timer = threading.Timer(RECEIVE_SECONDS, interrupt) if connection is not None else None
    if timer:
        timer.daemon = True
        timer.start()
    def check():
        if expired.is_set() or time.monotonic() >= deadline:
            raise StorageError('file_receive_timeout', 408)
    try:
        yield check
        check()
    finally:
        if timer:
            with active:
                finished = True
                timer.cancel()


def _receive(request, directory, temporary, maximum, source=None):
    hashed, size = hashlib.sha256(), 0
    fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW | os.O_CLOEXEC, 0o600, dir_fd=directory)
    # Gunicorn supplies an HTTP-framed stream, including chunked requests with
    # no Content-Length. Django's LimitedStream otherwise treats those as empty.
    source = source if source is not None else request.META['wsgi.input'] if request.META.get('wsgi.input_terminated') is True else request
    with os.fdopen(fd, 'wb') as stream, _receive_deadline(request) as check:
        while True:
            check()
            chunk = source.read(min(CHUNK_BYTES, maximum + 1 - size))
            check()
            if not chunk:
                break
            size += len(chunk)
            if size > maximum:
                raise StorageError('file_too_large_or_storage_full', 413)
            hashed.update(chunk)
            stream.write(chunk)
        stream.flush()
        os.fsync(stream.fileno())
    return size, hashed.hexdigest()


def _upload(request, filename, digest, path, note, *, source=None, receiver_locked=False):
    maximum = min(MAX_BYTES, _limit('BACKSTORY_ATTACHMENT_MAX_BYTES', _MAX_FILE_BYTES))
    name = path[7:]
    temporary = '.backstory-tmp-' + secrets.token_hex(16)
    attempted = registered = False
    with (nullcontext() if receiver_locked else application_lock('file-upload', blocking=False)), wiki_write_lock(blocking=False), application_lock('note:' + path, blocking=False), open_directory('assets') as directory:
        require_ready()
        if not _same_parent('assets', directory):
            raise StorageError('parent_changed', 409)
        existing = _observe(directory, name, digest, maximum)
        allowance = maximum if existing is not None else min(maximum, _quota(directory, 0, max_files=MAX_FILES, max_bytes=MAX_STORAGE_BYTES, max_entries=MAX_ENTRIES))
        try:
            register_stage(path, temporary)
            registered = True
            size, observed = _receive(request, directory, temporary, allowance, **({'source': source} if source is not None else {}))
            if observed != digest:
                raise StorageError('file_digest_mismatch', 409)
            require_ready()
            _revalidate_session(request)
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
    return _json(result, 201 if result['state'] == 'created' else 409 if result['state'] == 'uncertain' else 200)


def _revalidate_session(request):
    # Receipt may take seconds; the request's cached user is insufficient after
    # an account/session is revoked while bytes are arriving.
    from accounts import sessions
    from accounts.models import SessionDevice
    from django.contrib.auth import get_user_model
    device = SessionDevice.objects.filter(user_id=request.user.pk,
        session_key_digest=sessions.digest(request.session.session_key), revoked_at=None).first()
    now = sessions.now()
    if (not device or now >= device.absolute_expires_at or
            now >= device.last_seen_at + sessions.idle(device.remembered) or
            not get_user_model().objects.filter(pk=request.user.pk, is_active=True).exists()):
        raise StorageError('authentication_required', 401)


@_tool(methods=('POST',))
def upload_file(request):
    identity = _identity(request)
    if request.content_type != 'application/octet-stream':
        raise StorageError('invalid_file_request')
    try:
        return _upload(request, *identity)
    except OSError:
        raise StorageError('file_storage_unavailable_or_busy', 503) from None


@_tool(methods=('POST',))
def upload_encoded(request):
    try:
        with application_lock('file-upload', blocking=False):
            return _encoded(request)
    except OSError:
        raise StorageError('file_storage_unavailable_or_busy', 503) from None


def _encoded(request):
    if request.content_type != 'application/json' or request.GET:
        raise StorageError('invalid_file_request')
    # Bound the encoded request before JSON parsing, including a framed chunked
    # body. The decoded bytes then enter the same publication service.
    source = request.META['wsgi.input'] if request.META.get('wsgi.input_terminated') is True else request
    try:
        with _receive_deadline(request) as check:
            raw = bytearray()
            while len(raw) <= MAX_JSON_BYTES:
                check()
                chunk = source.read(min(CHUNK_BYTES, MAX_JSON_BYTES + 1 - len(raw)))
                check()
                if not chunk:
                    break
                raw.extend(chunk)
        if len(raw) > MAX_JSON_BYTES:
            raise StorageError('encoded_file_too_large', 413)
        values = json.loads(raw)
        if not isinstance(values, dict) or 'data_base64' not in values:
            raise ValueError
        encoded = values.pop('data_base64')
        identity = _identity(request, values)
        if not isinstance(encoded, str):
            raise ValueError
        if len(encoded) > MAX_BASE64_CHARS:
            raise StorageError('encoded_file_too_large', 413)
        data = base64.b64decode(encoded, validate=True)
        if len(data) > MAX_ENCODED_BYTES:
            raise StorageError('encoded_file_too_large', 413)
        if base64.b64encode(data).decode() != encoded:
            raise ValueError
        return _upload(request, *identity, source=BytesIO(data), receiver_locked=True)
    except (ValueError, UnicodeError):
        raise StorageError('invalid_encoded_file') from None
    except OSError:
        raise StorageError('file_storage_unavailable_or_busy', 503) from None


@_tool
def inspect_upload(request):
    filename, digest, path, note = _identity(request)
    maximum = min(MAX_BYTES, _limit('BACKSTORY_ATTACHMENT_MAX_BYTES', _MAX_FILE_BYTES))
    try:
        with application_lock('file-upload', blocking=False), open_directory('assets') as directory:
            size = _observe(directory, path[7:], digest, maximum)
            require_ready()
            if not _same_parent('assets', directory):
                raise StorageError('parent_changed', 409)
        return _json(_result(filename, digest, path, note, 'absent' if size is None else 'confirmed', size))
    except OSError:
        raise StorageError('file_storage_unavailable_or_busy', 503) from None
