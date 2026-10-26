"""One guarded path for formatted saves and explicit source recovery.

Application flock coordinates web processes. External writers do not participate;
final hashes narrow that residual race but cannot promise filesystem CAS.
"""
import errno
import hashlib
import os
import re
import secrets
import stat

from django.conf import settings
from django.core.exceptions import PermissionDenied

from .contracts import Diagnostic, FormatResult, PathDenied, SaveResult, StorageError
from .formatting import FormatFailure, format_source, snapshot_config
from .policy import validate_path
from .revisions import application_lock, get_recovery, issue_recovery, store_required_backup
from .staging import finish_stage, register_stage
from .storage import _os_error, open_directory, read_note, require_ready


def validate_save(actor, path, source):
    if not actor.is_authenticated or not actor.is_active:
        raise PermissionDenied
    validate_path(path, "content")
    if not path.lower().endswith(".md"):
        raise PathDenied()
    try:
        if not isinstance(source, str):
            raise ValueError
        raw = source.encode("utf-8", errors="strict")
    except (ValueError, UnicodeError):
        raise StorageError("invalid_save_request") from None
    if len(raw) > settings.BACKSTORY_NOTE_MAX_BYTES:
        raise StorageError("note_too_large", 413)
    require_ready()
    return raw


def parse_precondition(if_match, if_none_match):
    if if_match is None and if_none_match is None:
        raise StorageError("precondition_required", 428)
    if if_none_match == "*" and if_match is None:
        return None
    if if_none_match is not None or not isinstance(if_match, str) or not re.fullmatch(r'"[0-9a-f]{64}"', if_match):
        raise StorageError("invalid_precondition")
    return if_match


def _current(path):
    try:
        return read_note(path)
    except StorageError as error:
        if error.reason_code == "not_found":
            return None
        raise


def _check_base(current, base, source):
    if (current.revision if current else None) != base:
        return SaveResult("conflict", source, current.revision if current else None, reason_code="revision_conflict", status=412)
    return None


def failed_format(actor, path, source, base, result):
    token = issue_recovery(actor, path, base, source, result)
    return SaveResult("format_failed", source, base, result.diagnostics, result.diff, token, "format_failed", 422)


def format_with_recovery(actor, path, source, base):
    """Explicit Format with original precondition can enable safe source recovery."""
    validate_save(actor, path, source)
    try:
        with application_lock("note:" + path):
            current = _current(path)
            conflict = _check_base(current, base, source)
            if conflict:
                return conflict
            result = format_source(path, source, current)
            conflict = _check_base(_current(path), base, source)
            if conflict:
                return conflict
            token = issue_recovery(actor, path, base, source, result) if result.outcome == "failed" else None
            return result, token
    except OSError:
        raise StorageError("storage_io_error", 503) from None


def enqueue_note(path, revision):
    from indexing.queue import enqueue_note as persist
    persist(path, revision)
    return True


def _saved(source, revision, diagnostics, diff, mode, *, uncertain=False, path):
    try:
        queued = enqueue_note(path, revision)
    except Exception:
        queued = False
    state = "saved_source" if mode == "source_recovery" else "saved"
    if not queued:
        state += "_index_delayed"
    if uncertain:
        diagnostics += (Diagnostic("durability_uncertain", "Saved bytes were re-read; durability could not be confirmed.", "warning"),)
    return SaveResult(state, source, revision, diagnostics, diff)


def save_note(actor, path, submitted_source, base_revision, mode="formatted", recovery_token=None, *, restore_bom=None):
    submitted = validate_save(actor, path, submitted_source)
    if base_revision is not None and not re.fullmatch(r'"[0-9a-f]{64}"', base_revision):
        raise StorageError("invalid_precondition")
    if not isinstance(mode, str) or mode not in {"formatted", "source_recovery"}:
        raise StorageError("invalid_save_mode")
    try:
        with application_lock("note:" + path):
            recovery = get_recovery(actor, path, base_revision, submitted_source, recovery_token) if mode == "source_recovery" else None
            current = _current(path)
            conflict = _check_base(current, base_revision, submitted_source)
            if conflict:
                return conflict
            if recovery is not None:
                candidate, diagnostics, diff = submitted_source, recovery[0], recovery[1]
                result = None
            else:
                result = format_source(path, submitted_source, current)
                if result.outcome == "failed":
                    return failed_format(actor, path, submitted_source, base_revision, result)
                candidate, diagnostics, diff = result.source, result.diagnostics, result.diff
            # NoteSnapshot separates the encoding BOM; every source character
            # (including a leading U+FEFF) remains editable content.
            source = candidate
            output_bom = restore_bom if restore_bom is not None else bool(current and current.bom)
            output = (b"\xef\xbb\xbf" if output_bom else b"") + source.encode("utf-8")
            if len(output) > settings.BACKSTORY_NOTE_MAX_BYTES:
                raise StorageError("note_too_large", 413)
            original = current.raw_bytes if current else b""
            parent, _, name = path.rpartition("/")
            with open_directory(parent) as directory:
                temporary = ".backstory-tmp-" + secrets.token_hex(16)
                register_stage(path, temporary)
                descriptor = None
                attempted = False
                try:
                    # Stage first. Every final check happens after temp fsync.
                    descriptor = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW | os.O_CLOEXEC, 0o600, dir_fd=directory)
                    if current:
                        info = os.stat(name, dir_fd=directory, follow_symlinks=False)
                        if not stat.S_ISREG(info.st_mode):
                            raise PathDenied()
                        os.fchmod(descriptor, stat.S_IMODE(info.st_mode) & 0o777)
                    with os.fdopen(descriptor, "wb") as staged:
                        descriptor = None
                        staged.write(output)
                        staged.flush()
                        os.fsync(staged.fileno())
                    if output != original or current is None:
                        store_required_backup(actor, path, base_revision, original, submitted)
                    require_ready()
                    if result is not None:
                        try:
                            digest = snapshot_config(path).digest
                        except FormatFailure:
                            digest = None
                        if digest != result.config_digest:
                            failure = FormatResult(submitted_source, diagnostics + (Diagnostic("config_changed", "Formatting configuration changed. Retry formatting or recover the submitted source."),), diff, "failed", result.config_digest)
                            return failed_format(actor, path, submitted_source, base_revision, failure)
                    conflict = _check_base(_current(path), base_revision, submitted_source)
                    if conflict:
                        return conflict
                    # Refuse a parent swap rather than publish into an old folder.
                    with open_directory(parent) as fresh:
                        if (os.fstat(fresh).st_dev, os.fstat(fresh).st_ino) != (os.fstat(directory).st_dev, os.fstat(directory).st_ino):
                            raise StorageError("parent_changed", 503)
                    if current and output == original:
                        return SaveResult("noop", source, current.revision, diagnostics, diff)
                    attempted = True
                    if current is None:
                        # Atomic publication cannot overwrite an existing name.
                        os.link(temporary, name, src_dir_fd=directory, dst_dir_fd=directory, follow_symlinks=False)
                    else:
                        os.replace(temporary, name, src_dir_fd=directory, dst_dir_fd=directory)
                    os.fsync(directory)
                    revision = '"' + hashlib.sha256(output).hexdigest() + '"'
                    return _saved(source, revision, diagnostics, diff, mode, path=path)
                except OSError as error:
                    if attempted:
                        # A lost acknowledgement is not permission to replay.
                        try:
                            observed = _current(path)
                        except StorageError:
                            return SaveResult("uncertain", submitted_source, None, diagnostics, diff, reason_code="write_uncertain", status=503)
                        if observed and observed.raw_bytes == output:
                            return _saved(source, observed.revision, diagnostics, diff, mode, uncertain=True, path=path)
                        conflict = _check_base(observed, base_revision, submitted_source)
                        if conflict:
                            return conflict
                        return SaveResult("current", submitted_source, observed.revision if observed else None, diagnostics, diff, reason_code="create_link_unsupported" if current is None and error.errno in {errno.EOPNOTSUPP, errno.ENOTSUP, errno.EXDEV, errno.EPERM} else "write_not_confirmed", status=503)
                    if error.errno in {errno.EACCES, errno.EPERM}:
                        raise StorageError("wiki_write_denied", 503) from None
                    raise _os_error(error) from None
                finally:
                    if descriptor is not None:
                        os.close(descriptor)
                    try:
                        os.unlink(temporary, dir_fd=directory)
                    except FileNotFoundError:
                        finish_stage(path)
                    except OSError:
                        pass  # Registered outside wiki for startup cleanup.
                    else:
                        finish_stage(path)
    except OSError:
        raise StorageError("storage_io_error", 503) from None
