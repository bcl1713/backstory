"""Read-only preparation for one guarded literal edit; never a save fallback."""
from django.conf import settings

from .actors import require_actor
from .contracts import StorageError
from .formatting import FormatFailure, snapshot_config
from .metadata import MetadataError
from .relocations import wiki_write_lock
from .revisions import application_lock
from .save_metadata import literal_edit_context, wiki_date
from .saves import (_current, _literal_arguments, _literal_matches, _literal_submission,
                    _prepare_formatted, validate_save)
from .storage import require_ready


def preview_edit_note(actor, path, old_text, new_text, revision):
    base = _literal_arguments(old_text, new_text, revision)
    validate_save(actor, path, '')
    try:
        with wiki_write_lock(), application_lock('note:' + path):
            current = _current(path)
            if current is None or current.revision != base:
                raise StorageError('revision_conflict', 412)
            submitted, start = _literal_submission(current, old_text, new_text)
            validate_save(actor, path, submitted)
            today = wiki_date()
            try:
                formatted = _prepare_formatted(path, submitted, current, today)
            except MetadataError:
                raise StorageError('edit_format_unavailable', 422) from None
            if formatted.outcome == 'failed':
                raise StorageError('edit_format_unavailable', 422)
            end = start + len(old_text)
            contexts = {(current.source[:start], current.source[end:])}
            try:
                managed = literal_edit_context(current.source, start, end, new_text, today)
            except MetadataError:
                managed = None
            if managed is not None:
                contexts.add(managed)
            replacements = {formatted.source[len(prefix):len(formatted.source) - len(suffix) if suffix else None]
                for prefix, suffix in contexts if len(formatted.source) >= len(prefix) + len(suffix)
                and formatted.source.startswith(prefix) and formatted.source.endswith(suffix)}
            if len(replacements) != 1:
                raise StorageError('edit_would_change_other_content', 422)
            replacement = replacements.pop()
            if len(replacement.encode('utf-8')) > 4096:
                raise StorageError('edit_preview_too_large', 413)
            # Check precisely what edit_note will construct, not just the first
            # formatter output: managed scalar shifts may depend on this text.
            returned_source, _ = _literal_submission(current, old_text, replacement)
            validate_save(actor, path, returned_source)
            try:
                checked = _prepare_formatted(path, returned_source, current, today)
            except MetadataError:
                raise StorageError('edit_format_unavailable', 422) from None
            if checked.outcome == 'failed':
                raise StorageError('edit_format_unavailable', 422)
            if checked.source != formatted.source or not _literal_matches(current, start, old_text, replacement,
                                                                         returned_source, checked.source, today):
                raise StorageError('edit_would_change_other_content', 422)
            if len(checked.source.encode('utf-8')) + (3 if current.bom else 0) > settings.BACKSTORY_NOTE_MAX_BYTES:
                raise StorageError('note_too_large', 413)
            require_actor(actor)
            require_ready()
            latest = _current(path)
            if latest is None or latest.revision != base:
                raise StorageError('revision_conflict', 412)
            try:
                config = snapshot_config(path).digest
            except FormatFailure:
                config = None
            if formatted.config_digest != checked.config_digest or checked.config_digest != config:
                raise StorageError('edit_config_changed', 412)
            return {'state': 'preview', 'revision': base, 'authoritative': True,
                    'new_text': replacement, 'formatter_config': config,
                    'indexing': {'state': 'not_requested'}}
    except OSError:
        raise StorageError('storage_io_error', 503) from None
