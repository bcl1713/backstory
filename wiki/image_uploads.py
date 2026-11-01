"""Bounded raster-only uploads; no user filename becomes a storage path."""
import hashlib
from io import BytesIO
import os
import posixpath
import re
import secrets
import stat
import warnings

from PIL import Image, ImageOps, UnidentifiedImageError

from .contracts import PathDenied, StorageError
from .folders import _same_parent
from .policy import authorize_content
from .relocations import wiki_write_lock
from .revisions import application_lock
from .staging import finish_stage, register_stage
from .storage import open_directory, read_note, require_ready
from .tool_views import _json, _tool

MAX_BYTES = 8 * 1024 * 1024
MAX_PIXELS = 16_000_000
MAX_DIMENSION = 4096
MAX_FILES = 1000
MAX_STORAGE_BYTES = 256 * 1024 * 1024
MAX_ENTRIES = 10000
_TYPES = {'.png': ('image/png', 'PNG', '.png'), '.jpg': ('image/jpeg', 'JPEG', '.jpg'),
          '.jpeg': ('image/jpeg', 'JPEG', '.jpg'), '.webp': ('image/webp', 'WEBP', '.webp')}
_NAME = re.compile(r'[A-Za-z0-9][A-Za-z0-9 _.-]{0,119}\Z')
_MANAGED = re.compile(r'upload-[0-9a-f]{64}\.(png|jpg|webp)\Z')
_FLAGS = os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK | os.O_CLOEXEC


class _BoundedOutput(BytesIO):
    def write(self, data):
        if self.tell() + len(data) > MAX_BYTES:
            raise StorageError('image_too_large', 413)
        return super().write(data)


def _decode(raw, expected):
    if not raw or len(raw) > MAX_BYTES:
        raise StorageError('image_too_large', 413)
    try:
        with warnings.catch_warnings():
            warnings.simplefilter('error', Image.DecompressionBombWarning)
            with Image.open(BytesIO(raw), formats=[expected]) as image:
                if image.format != expected or getattr(image, 'n_frames', 1) != 1:
                    raise ValueError
                width, height = image.size
                if max(width, height) > MAX_DIMENSION or width * height > MAX_PIXELS:
                    raise StorageError('image_dimensions_too_large', 413)
                image.verify()
            with Image.open(BytesIO(raw), formats=[expected]) as image:
                image.load()
                ImageOps.exif_transpose(image, in_place=True)
                width, height = image.size
                # New pixels discard EXIF, profiles, text, comments and tail data.
                converted = image.convert('RGBA' if 'A' in image.getbands() or 'transparency' in image.info else 'RGB')
                clean = Image.new(converted.mode, converted.size)
                try:
                    clean.paste(converted)
                    output = _BoundedOutput()
                    clean.save(output, format=expected, **({'quality': 95} if expected == 'JPEG' else {}))
                    return output.getvalue(), width, height
                finally:
                    converted.close()
                    clean.close()
    except (UnidentifiedImageError, OSError, ValueError, SyntaxError, Image.DecompressionBombWarning, Image.DecompressionBombError):
        raise StorageError('invalid_image') from None


def _matches(directory, name, data):
    try:
        fd = os.open(name, _FLAGS, dir_fd=directory)
    except FileNotFoundError:
        return False
    try:
        info = os.fstat(fd)
        if not stat.S_ISREG(info.st_mode) or info.st_size != len(data):
            raise StorageError('image_destination_conflict', 409)
        with os.fdopen(fd, 'rb', closefd=False) as stream:
            if stream.read(MAX_BYTES + 1) != data:
                raise StorageError('image_destination_conflict', 409)
        current = os.stat(name, dir_fd=directory, follow_symlinks=False)
        if (current.st_dev, current.st_ino) != (info.st_dev, info.st_ino):
            raise StorageError('image_destination_changed', 409)
        return True
    finally:
        os.close(fd)


def _quota(directory, additional):
    count = size = 0
    with os.scandir(directory) as entries:
        for index, entry in enumerate(entries):
            if index >= MAX_ENTRIES:
                raise StorageError('image_storage_scan_limit', 413)
            if _MANAGED.fullmatch(entry.name):
                info = entry.stat(follow_symlinks=False)
                count += 1
                size += info.st_size
    if count >= MAX_FILES or size + additional > MAX_STORAGE_BYTES:
        raise StorageError('image_storage_full', 413)


def _publish(path, data):
    name = path.split('/')[-1]
    with wiki_write_lock(), application_lock('note:' + path), open_directory('assets') as directory:
        require_ready()
        if not _same_parent('assets', directory):
            raise StorageError('parent_changed', 409)
        if _matches(directory, name, data):
            if not _same_parent('assets', directory):
                raise StorageError('parent_changed', 409)
            return 'already_exists'
        _quota(directory, len(data))
        temporary = '.backstory-tmp-' + secrets.token_hex(16)
        register_stage(path, temporary)
        attempted = False
        try:
            fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW | os.O_CLOEXEC, 0o600, dir_fd=directory)
            with os.fdopen(fd, 'wb') as stream:
                stream.write(data)
                stream.flush()
                os.fsync(stream.fileno())
            require_ready()
            if not _same_parent('assets', directory):
                raise StorageError('parent_changed', 409)
            attempted = True
            os.link(temporary, name, src_dir_fd=directory, dst_dir_fd=directory, follow_symlinks=False)
            os.fsync(directory)
            if not _same_parent('assets', directory) or not _matches(directory, name, data):
                return 'uncertain'
            return 'created'
        except (OSError, StorageError):
            if attempted:
                return 'uncertain'
            raise
        finally:
            try:
                os.unlink(temporary, dir_fd=directory)
            except FileNotFoundError:
                pass
            except OSError:
                pass  # Registered cleanup retries at startup.
            else:
                finish_stage(path)


@_tool(methods=('POST',))
def upload_image(request):
    if set(request.GET) != {'note', 'filename'} or any(len(request.GET.getlist(key)) != 1 for key in request.GET):
        raise StorageError('invalid_image_request')
    note = authorize_content(request, request.GET['note'], query_parameter='note')
    if not note.lower().endswith('.md'):
        raise PathDenied()
    filename = authorize_content(request, request.GET['filename'], query_parameter='filename')
    if not _NAME.fullmatch(filename) or '..' in filename:
        raise StorageError('invalid_image_filename')
    kind = _TYPES.get(posixpath.splitext(filename)[1].lower())
    if kind is None or request.content_type != kind[0]:
        raise StorageError('invalid_image_type')
    require_ready()
    read_note(note)  # Existing readable Markdown only; never edits source.
    authorize_content(request, 'assets', 'folder')
    try:
        with application_lock('image-upload', blocking=False):
            data, width, height = _decode(request.read(MAX_BYTES + 1), kind[1])
            digest = hashlib.sha256(data).hexdigest()
            path = authorize_content(request, 'assets/upload-' + digest + kind[2])
            state = _publish(path, data)
    except OSError:
        raise StorageError('image_storage_unavailable', 503) from None
    relative = posixpath.relpath(path, posixpath.dirname(note) or '.')
    result = {'state': state, 'authoritative': state != 'uncertain', 'path': path,
              'sha256': digest, 'bytes': len(data), 'width': width, 'height': height,
              'href': '/attachments/' + path, 'markdown': '![](' + relative + ')'}
    if state == 'uncertain':
        result.update(reason_code='image_upload_unconfirmed', inspect_before_retry=True)
    return _json(result, 201 if state == 'created' else 409 if state == 'uncertain' else 200)
