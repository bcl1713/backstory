"""Authenticated, no-follow attachment delivery with finite stream/range caps.

Full files are limited to 64 MiB; a single requested range is limited to 8 MiB.
Administrators may lower BACKSTORY_ATTACHMENT_MAX_BYTES and
BACKSTORY_ATTACHMENT_RANGE_MAX_BYTES; neither setting can raise these hard caps.
Streaming owns its pinned file descriptor and closes it on exhaustion, error or
response.close(), including cancellation before the first body chunk is read.
"""
import os
from pathlib import PurePosixPath
import re
import stat

from django.conf import settings
from django.http import HttpResponse, StreamingHttpResponse
from django.utils.http import content_disposition_header

from .contracts import PathDenied, StorageError
from .policy import authorize_content
from .storage import _os_error, open_directory, require_ready

_RASTER_TYPES = {
    ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
    ".gif": "image/gif", ".webp": "image/webp", ".avif": "image/avif",
    ".bmp": "image/bmp", ".ico": "image/vnd.microsoft.icon",
}
INLINE_RASTER_SUFFIXES = frozenset(_RASTER_TYPES)
_MAX_FILE_BYTES = 64 * 1024 * 1024
_MAX_RANGE_BYTES = 8 * 1024 * 1024
_CHUNK_BYTES = 65536
_FILE_FLAGS = os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK | os.O_CLOEXEC


def safe_attachment_type(path):
    suffix = PurePosixPath(path).suffix.lower()
    if suffix in _RASTER_TYPES:
        return _RASTER_TYPES[suffix], True
    if suffix == ".pdf":
        return "application/pdf", True
    return "application/octet-stream", False


def _limit(name, hard_cap):
    value = getattr(settings, name, hard_cap)
    if isinstance(value, bool) or not isinstance(value, int) or value < 1:
        raise StorageError("attachment_configuration_invalid", 503)
    return min(value, hard_cap)


def _byte_range(value, size, limit):
    if len(value) > 256 or size == 0:
        raise StorageError("attachment_range_invalid", 416)
    match = re.fullmatch(r"bytes=([0-9]*)-([0-9]*)", value.strip())
    if match is None or not any(match.groups()):
        raise StorageError("attachment_range_invalid", 416)
    first, last = match.groups()
    if first:
        start = int(first)
        end = min(int(last), size - 1) if last else size - 1
        if start >= size or end < start:
            raise StorageError("attachment_range_invalid", 416)
    else:
        suffix = int(last)
        if suffix == 0:
            raise StorageError("attachment_range_invalid", 416)
        start, end = max(0, size - suffix), size - 1
    if end - start + 1 > limit:
        raise StorageError("attachment_range_too_large", 416)
    return start, end


class _AttachmentStream:
    def __init__(self, descriptor, remaining):
        self.descriptor = descriptor
        self.remaining = remaining

    def __iter__(self):
        return self

    def __next__(self):
        if self.descriptor is None or self.remaining == 0:
            self.close()
            raise StopIteration
        try:
            chunk = os.read(self.descriptor, min(_CHUNK_BYTES, self.remaining))
            if not chunk:
                raise StorageError("attachment_changed", 409)
            self.remaining -= len(chunk)
            if self.remaining == 0:
                self.close()
            return chunk
        except OSError as error:
            self.close()
            raise _os_error(error) from None
        except StorageError:
            self.close()
            raise

    def close(self):
        if self.descriptor is not None:
            descriptor, self.descriptor = self.descriptor, None
            os.close(descriptor)


def serve_attachment(request, path):
    """Return an authorized GET/HEAD response or a sanitized StorageError.

    Anonymous/disabled accounts raise policy's PermissionDenied even when called
    outside the main authenticated route. No content path is decoded a second
    time. HEAD ignores Range, which applies only to GET, and opens no body stream.
    """
    path = authorize_content(request, path)
    if request.method not in {"GET", "HEAD"}:
        raise StorageError("method_not_allowed", 405)
    require_ready()
    maximum = _limit("BACKSTORY_ATTACHMENT_MAX_BYTES", _MAX_FILE_BYTES)
    range_maximum = _limit("BACKSTORY_ATTACHMENT_RANGE_MAX_BYTES", _MAX_RANGE_BYTES)
    parent, _, name = path.rpartition("/")
    descriptor = None
    try:
        with open_directory(parent) as directory:
            descriptor = os.open(name, _FILE_FLAGS, dir_fd=directory)
            info = os.fstat(descriptor)
            if not stat.S_ISREG(info.st_mode):
                raise PathDenied()
        size = info.st_size
        if size > maximum:
            raise StorageError("attachment_too_large", 413)
        start, end, status = 0, size - 1, 200
        value = request.headers.get("Range") if request.method == "GET" else None
        if value is not None:
            try:
                start, end = _byte_range(value, size, range_maximum)
            except StorageError as error:
                error.content_range = f"bytes */{size}"
                raise
            status = 206
        length = end - start + 1
        content_type, inline = safe_attachment_type(path)
        if request.method == "HEAD":
            response = HttpResponse(content_type=content_type)
        else:
            os.lseek(descriptor, start, os.SEEK_SET)
            stream = _AttachmentStream(descriptor, length)
            response = StreamingHttpResponse(stream, status=status, content_type=content_type)
            descriptor = None  # Ownership transferred to response.close().
        response["Content-Length"] = str(length)
        response["Accept-Ranges"] = "bytes"
        response["Content-Disposition"] = content_disposition_header(not inline, name)
        response["X-Content-Type-Options"] = "nosniff"
        response["Cache-Control"] = "no-store"
        if status == 206:
            response["Content-Range"] = f"bytes {start}-{end}/{size}"
        return response
    except OSError as error:
        raise _os_error(error) from None
    finally:
        if descriptor is not None:
            os.close(descriptor)
