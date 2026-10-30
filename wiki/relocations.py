"""Reviewed, bounded relocations with durable, idempotent roll-forward recovery.

Application writers cooperate through wiki-write. Arbitrary external filesystem
writers do not; final hashes narrow that residual race, never promise FS CAS.
"""
import base64
from contextlib import contextmanager
import ctypes
from dataclasses import replace
from datetime import timedelta
import difflib
import errno
import hashlib
import json
import os
import posixpath
import secrets
import stat
from urllib.parse import quote, urlsplit

from django.conf import settings
from django.core.exceptions import PermissionDenied
from django.db import transaction
from django.db.models import F
from django.urls import reverse
from django.utils import timezone

from .contracts import PathDenied, StorageError
from .links import _decoded, extract_links
from .metadata import project_note
from .models import FormatRecovery, MoveOperation, RecoveryDraft, SavedRevision
from .policy import policy_version, validate_path
from .revisions import application_lock, _check_quota, _record_charge
from .storage import open_directory, read_note, read_regular, require_ready, _os_error

MAX_ENTRIES = 10000
MAX_BYTES = 64 * 1024 * 1024


def _actor(actor):
    if not actor.is_authenticated or not actor.is_active:
        raise PermissionDenied


def assert_writes_available():
    if MoveOperation.objects.filter(state__in=['applying', 'recovery_required']).exists():
        raise StorageError('move_recovery_required', 409)


@contextmanager
def wiki_write_lock():
    with application_lock('wiki-write'):
        assert_writes_available()
        yield


def _inside(path, source):
    return path == source or path.startswith(source + '/')


def _fingerprint(info):
    return [info.st_dev, info.st_ino, info.st_mode, info.st_size, info.st_mtime_ns, info.st_ctime_ns]


def _stat(path):
    parent, _, name = path.rpartition('/')
    with open_directory(parent) as directory:
        try:
            return os.stat(name, dir_fd=directory, follow_symlinks=False)
        except FileNotFoundError:
            return None
        except OSError as error:
            raise _os_error(error) from None


def _bytes(raw):
    return base64.b64encode(raw).decode('ascii')


def _raw(value):
    return base64.b64decode(value, validate=True)


def _conflict(*paths):
    error = StorageError('move_recovery_conflict', 409)
    error.conflict_paths = [path for path in sorted(set(paths)) if path][:20]
    return error


def _record_failure(operation, error):
    # A response/commit acknowledgement may be lost after the terminal state
    # was persisted. Read it back before ever reopening a recovery journal.
    persisted = MoveOperation.objects.get(pk=operation.pk)
    if persisted.state in {'completed', 'cancelled'}:
        operation.state, operation.plan = persisted.state, persisted.plan
        operation.reason_code, operation.index_state = persisted.reason_code, persisted.index_state
        return
    operation.state = 'recovery_required'
    operation.reason_code = error.reason_code if isinstance(error, StorageError) else 'move_io_error'
    fields = ['state', 'reason_code']
    if getattr(error, 'conflict_paths', None):
        # A final DB transaction may have rolled back an in-memory receipt;
        # preserve the full persisted journal when adding recovery diagnostics.
        operation.plan = persisted.plan
        operation.plan['conflicts'] = error.conflict_paths
        fields.append('plan')
    operation.save(update_fields=fields)


def _scan(source):
    """Complete eligible namespace; protected source descendants fail closed."""
    witnesses, notes, inventory = {}, {}, []
    total = 0
    stack = ['']
    while stack:
        folder = stack.pop()
        with open_directory(folder) as directory:
            before = _fingerprint(os.fstat(directory))
            witnesses[folder] = before
            with os.scandir(directory) as iterator:
                for entry in iterator:
                    path = '/'.join(filter(None, [folder, entry.name]))
                    try:
                        validate_path(path, 'content')
                    except StorageError:
                        if _inside(path, source):
                            raise StorageError('protected_move_descendant', 409) from None
                        continue
                    if len(witnesses) >= MAX_ENTRIES:
                        raise StorageError('move_inventory_limit', 413)
                    info = entry.stat(follow_symlinks=False)
                    selected = _inside(path, source)
                    regular, directory_entry = stat.S_ISREG(info.st_mode), stat.S_ISDIR(info.st_mode)
                    if not regular and not directory_entry:
                        if selected:
                            raise StorageError('unsupported_move_entry', 409)
                        witnesses[path] = _fingerprint(info)
                        continue
                    witnesses[path] = _fingerprint(info)
                    if selected:
                        if info.st_nlink > 1 and regular:
                            raise StorageError('hardlinked_move_entry', 409)
                        inventory.append({'path': path, 'kind': 'folder' if directory_entry else 'file', 'size': info.st_size if regular else 0})
                    if directory_entry:
                        if len(path.split('/')) > 100:
                            raise StorageError('move_inventory_limit', 413)
                        stack.append(path)
                    elif path.lower().endswith('.md'):
                        snapshot = read_note(path)
                        total += len(snapshot.raw_bytes)
                        notes[path] = snapshot
                        witnesses[path].append(snapshot.revision)
                    elif selected:
                        raw = read_regular(path, purpose='content', max_bytes=MAX_BYTES, too_large_code='move_inventory_limit')
                        total += len(raw)
                        witnesses[path].append(hashlib.sha256(raw).hexdigest())
                    if total > MAX_BYTES:
                        raise StorageError('move_inventory_limit', 413)
            if _fingerprint(os.fstat(directory)) != before:
                raise StorageError('move_inventory_changed', 409)
    return witnesses, notes, sorted(inventory, key=lambda row: row['path'])


def _resolver(paths, notes, blocked=(), projections=None):
    """Same root/relative/extension/name ordering as wiki.links, without stale indexes."""
    from indexing.names import note_names
    names = {}
    for path, snapshot in notes.items():
        projection = projections[path] if projections is not None else project_note(replace(snapshot, path=path))
        if any(item.code == 'projection_parse_failed' for item in projection.diagnostics):
            # Paths came from the authorized fresh scan. Never attach source or
            # exception text; one failure is enough to refuse this preview.
            validate_path(path, 'content')
            error = StorageError('incomplete_link_inventory', 409)
            failure = projection.projection_failure
            error.inventory_failure = {
                'path': path,
                'phase': failure.phase if failure else 'projection',
                'reason': failure.reason if failure else 'projection_parse_failed',
            }
            raise error
        for name, resolvable in note_names(path, projection.title, projection.ids, projection.aliases):
            if resolvable:
                names.setdefault(name, set()).add(path)

    def resolve(source_path, target, kind):
        if not isinstance(target, str) or len(target) > 4096 or '\\' in target or any(ord(c) < 32 or ord(c) == 127 for c in target):
            return None
        raw = target.partition('|')[0] if kind == 'wiki' else target
        try:
            if kind == 'wiki':
                path = raw.partition('#')[0]
            else:
                parsed = urlsplit(raw)
                if parsed.scheme or parsed.netloc or parsed.query:
                    return None
                path = _decoded(parsed.path)
            if not path:
                return source_path
            if path.startswith('/'):
                return None
            root = posixpath.normpath(path)
            relative = posixpath.normpath(posixpath.join(posixpath.dirname(source_path), path))
            bases = [root, relative] if kind == 'wiki' and root != '..' and not root.startswith('../') else [relative]
            for base in bases:
                candidates = [base, base + '.md'] if kind == 'wiki' and not base.lower().endswith('.md') else [base]
                for candidate in candidates:
                    try:
                        validate_path(candidate, 'content')
                    except StorageError:
                        continue
                    components = candidate.split('/')
                    if any('/'.join(components[:index]) in blocked for index in range(1, len(components) + 1)):
                        raise StorageError('unavailable_link_target', 409)
                    if any('/'.join(components[:index]) in paths for index in range(1, len(components))):
                        raise StorageError('unavailable_link_target', 409)
                    if candidate in paths:
                        return candidate
            if kind == 'wiki':
                matches = names.get(path.casefold(), set())
                return next(iter(matches)) if len(matches) == 1 else None
        except (ValueError, UnicodeError):
            pass
        return None
    return resolve


def _history_collision(mapping):
    for model in [SavedRevision, RecoveryDraft]:
        if model.objects.filter(path__in=mapping.values()).exclude(path__in=mapping.keys()).exists():
            raise StorageError('destination_history_collision', 409)


def _plan(source, destination):
    from .relocation_links import rewrite_links
    validate_path(source, 'content')
    validate_path(destination, 'content')
    if _inside(destination, source) or _inside(source, destination):
        raise StorageError('invalid_move_destination', 409)
    require_ready()
    source_info = _stat(source)
    if source_info is None:
        raise StorageError('not_found', 404)
    if not (stat.S_ISDIR(source_info.st_mode) or stat.S_ISREG(source_info.st_mode) and source.lower().endswith('.md')):
        raise PathDenied()
    if stat.S_ISREG(source_info.st_mode) and not destination.lower().endswith('.md'):
        raise StorageError('markdown_extension_required')
    if _stat(destination) is not None:
        raise StorageError('destination_exists', 409)
    with open_directory(destination.rpartition('/')[0]) as directory:
        destination_parent = [os.fstat(directory).st_dev, os.fstat(directory).st_ino]
    witnesses, notes, inventory = _scan(source)
    if not inventory:
        raise StorageError('not_found', 404)
    if witnesses.get(source, [])[:6] != _fingerprint(source_info):
        raise StorageError('move_inventory_changed', 409)
    mapping = {row['path']: destination + row['path'][len(source):] for row in inventory}
    # Deleted descendants can still have available history or protected drafts.
    # They keep their association when the containing folder moves too.
    from django.db.models import Q
    for model in [SavedRevision, RecoveryDraft, FormatRecovery]:
        for path in model.objects.filter(Q(path=source) | Q(path__startswith=source + '/')).values_list('path', flat=True).distinct():
            mapping[path] = destination + path[len(source):]
    for value in mapping.values():
        validate_path(value, 'content')
    _history_collision(mapping)
    files = {path for path, value in witnesses.items() if path and stat.S_ISREG(value[2])}
    blocked = {path for path, value in witnesses.items() if path and not (stat.S_ISREG(value[2]) or stat.S_ISDIR(value[2]))}
    projections = {path: project_note(snapshot) for path, snapshot in notes.items()}
    old_resolve = _resolver(files, notes, blocked, projections)
    new_notes = {mapping.get(path, path): snapshot for path, snapshot in notes.items()}
    new_files = {mapping.get(path, path) for path in files}
    new_resolve = _resolver(new_files, new_notes, blocked, {mapping.get(path, path): projection for path, projection in projections.items()})
    changes = []
    for path, snapshot in sorted(notes.items()):
        new_path = mapping.get(path, path)
        revised, updates = rewrite_links(snapshot.source, path, new_path, mapping, old_resolve)
        # Verify every link occurrence retains its resolved identity, including
        # previously missing/ambiguous references and newly shadowed names.
        before_edges = projections[path].edges
        after_edges = project_note(replace(snapshot, source=revised, path=new_path)).edges if revised != snapshot.source else before_edges
        if len(before_edges) != len(after_edges):
            raise StorageError('unsupported_link_rewrite', 409)
        for before, after in zip(before_edges, after_edges):
            old_target = old_resolve(path, before.target, before.kind)
            expected = mapping.get(old_target, old_target)
            if expected != new_resolve(new_path, after.target, after.kind):
                raise StorageError('link_resolution_changed', 409)
        output = (b'\xef\xbb\xbf' if snapshot.bom else b'') + revised.encode('utf-8')
        if output != snapshot.raw_bytes:
            if len(output) > settings.BACKSTORY_NOTE_MAX_BYTES:
                raise StorageError('note_too_large', 413)
            changes.append({'path': path, 'destination': new_path, 'before': _bytes(snapshot.raw_bytes), 'after': _bytes(output),
                'mode': stat.S_IMODE(witnesses[path][2]), 'links': updates,
                'diff': ''.join(difflib.unified_diff(snapshot.source.splitlines(keepends=True), revised.splitlines(keepends=True), fromfile=path, tofile=new_path))})
    plan = {'source': source, 'destination': destination, 'policy': policy_version(), 'source_identity': _fingerprint(source_info),
        'destination_parent': destination_parent, 'witnesses': witnesses, 'inventory': inventory, 'mapping': mapping, 'changes': changes}
    if len(json.dumps(plan).encode()) > MAX_BYTES * 2:
        raise StorageError('move_inventory_limit', 413)
    # Normalize tuple-valued parser positions to the persisted JSON shape.
    return json.loads(json.dumps(plan))


def preview_move(actor, source, destination):
    _actor(actor)
    try:
        with wiki_write_lock():
            from .staging import cleanup_staged_saves
            cleanup_staged_saves()
            # Bound abandoned previews without deleting recovery journals.
            MoveOperation.objects.filter(state='preview', created_at__lt=timezone.now() - timedelta(hours=1)).delete()
            MoveOperation.objects.filter(state__in=['completed', 'cancelled'], created_at__lt=timezone.now() - timedelta(days=30)).delete()
            if MoveOperation.objects.filter(state='preview').count() >= 32:
                raise StorageError('move_preview_capacity', 503)
            plan = _plan(source, destination)
            from django.db.models import BinaryField, Sum
            from django.db.models.functions import Cast, Length
            used = MoveOperation.objects.aggregate(total=Sum(Length(Cast('plan', BinaryField()))))['total'] or 0
            if used + len(json.dumps(plan).encode()) > settings.BACKSTORY_REVISION_QUOTA_BYTES:
                raise StorageError('move_journal_capacity', 503)
            return MoveOperation.objects.create(actor=actor, source=source, destination=destination, plan=plan)
    except OSError as error:
        raise _os_error(error) from None


def _rename_noreplace(source, destination):
    """Linux renameat2 refuses every collision, including an empty folder."""
    source_parent, _, source_name = source.rpartition('/')
    target_parent, _, target_name = destination.rpartition('/')
    with open_directory(source_parent) as src, open_directory(target_parent) as dst:
        libc = ctypes.CDLL(None, use_errno=True)
        rename = getattr(libc, 'renameat2', None)
        if rename is None:
            raise StorageError('move_unsupported_filesystem', 503)
        rename.argtypes = [ctypes.c_int, ctypes.c_char_p, ctypes.c_int, ctypes.c_char_p, ctypes.c_uint]
        rename.restype = ctypes.c_int
        if rename(src, os.fsencode(source_name), dst, os.fsencode(target_name), 1):
            code = ctypes.get_errno()
            if code in {errno.EEXIST, errno.ENOTEMPTY}:
                raise StorageError('destination_exists', 409)
            raise OSError(code, 'relocation rename failed')
        os.fsync(src)
        os.fsync(dst)


def _publish_change(path, original, output, mode):
    with application_lock('note:' + path):
        _publish_change_locked(path, original, output, mode)


def _publish_change_locked(path, original, output, mode):
    from .staging import register_stage, finish_stage
    parent, _, name = path.rpartition('/')
    with open_directory(parent) as directory:
        temporary = '.backstory-tmp-' + secrets.token_hex(16)
        fd = None
        register_stage(path, temporary)
        try:
            fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW | os.O_CLOEXEC, mode & 0o777, dir_fd=directory)
            os.fchmod(fd, mode & 0o777)
            with os.fdopen(fd, 'wb') as stream:
                fd = None
                stream.write(output)
                stream.flush()
                os.fsync(stream.fileno())
            current = read_note(path)
            if current.raw_bytes != original:
                raise StorageError('move_recovery_conflict', 409)
            with open_directory(parent) as fresh:
                if (os.fstat(fresh).st_dev, os.fstat(fresh).st_ino) != (os.fstat(directory).st_dev, os.fstat(directory).st_ino):
                    raise StorageError('parent_changed', 409)
            os.replace(temporary, name, src_dir_fd=directory, dst_dir_fd=directory)
            os.fsync(directory)
        finally:
            if fd is not None:
                os.close(fd)
            try:
                os.unlink(temporary, dir_fd=directory)
            except FileNotFoundError:
                finish_stage(path)
            except OSError:
                pass  # Retained registration permits safe startup/retry cleanup.
            else:
                finish_stage(path)


def _start(operation):
    fresh = _plan(operation.source, operation.destination)
    if fresh != operation.plan:
        raise StorageError('move_preview_stale', 409)
    plan = operation.plan
    with application_lock('revision-quota'), transaction.atomic():
        # Session/index writers do not share the filesystem locks. Reserve the
        # SQLite writer before quota/history reads, avoiding a stale read
        # snapshot upgrade if another connection commits between SELECT/INSERT.
        MoveOperation.objects.filter(pk=operation.pk).update(state=F('state'))
        # Budget both the required backups and longer associations for existing
        # history/drafts. Backups include their actual hash precondition charge.
        charge = sum(_record_charge(max([item['path'], item['destination']], key=lambda path: len(path.encode())),
            '"' + '0' * 64 + '"', _raw(item['before']), _raw(item['after'])) for item in plan['changes'])
        from django.db.models import Count
        for model in [SavedRevision, RecoveryDraft]:
            for row in model.objects.filter(path__in=plan['mapping']).values('path').annotate(count=Count('pk')):
                old = row['path']
                charge += row['count'] * max(0, len(plan['mapping'][old].encode()) - len(old.encode()))
        _check_quota(charge)
        for item in plan['changes']:
            original, output = _raw(item['before']), _raw(item['after'])
            SavedRevision.objects.create(actor=operation.actor, path=item['path'], base_revision='"' + hashlib.sha256(original).hexdigest() + '"', original=original, submitted=output)
        operation.state = 'applying'
        operation.save(update_fields=['state'])


def _relocate(operation):
    # Namespace cleanup belongs before planning, never after validation.
    plan = operation.plan
    if policy_version() != plan['policy']:
        raise StorageError('move_policy_changed', 409)
    require_ready()
    with open_directory(operation.destination.rpartition('/')[0]) as directory:
        if [os.fstat(directory).st_dev, os.fstat(directory).st_ino] != plan['destination_parent']:
            raise StorageError('parent_changed', 409)
    source, destination = _stat(operation.source), _stat(operation.destination)
    identity = plan['source_identity']
    if source is not None and destination is None:
        if _fingerprint(source) != identity:
            raise _conflict(operation.source)
        # Revalidate all descendants and inbound bytes on a resumed pre-rename
        # operation as well; never move unreviewed files after an interruption.
        witnesses, _, _ = _scan(operation.source)
        if witnesses != plan['witnesses']:
            changed = []
            for path in sorted(set(witnesses) | set(plan['witnesses'])):
                if witnesses.get(path) == plan['witnesses'].get(path) or not path:
                    continue
                try:
                    validate_path(path, 'content')
                except StorageError:
                    continue
                changed.append(path)
                if len(changed) == 20:
                    break
            raise _conflict(*changed)
        _rename_noreplace(operation.source, operation.destination)
    elif source is None and destination is not None:
        if not _moved_identity(operation, destination):
            raise StorageError('move_recovery_conflict', 409)
    else:
        raise StorageError('move_recovery_conflict', 409)
    _validate_recovery_inventory(operation)
    for item in plan['changes']:
        require_ready()
        original, output = _raw(item['before']), _raw(item['after'])
        current = read_note(item['destination'])
        if current.raw_bytes == output:
            continue  # Lost acknowledgment or process interruption: verify, skip.
        if current.raw_bytes != original:
            raise _conflict(item['destination'])
        _publish_change(item['destination'], original, output, item['mode'])
    _validate_recovery_inventory(operation, finished=True)
    _sync_directories(operation)
    # History path updates and completion are one DB transaction. No duplication
    # on retry, and available draft bytes/ownership are unchanged.
    with transaction.atomic():
        # This final history transaction also reads before writing. Filesystem
        # publication is already complete; do not retry/replay it on contention.
        MoveOperation.objects.filter(pk=operation.pk).update(state=F('state'))
        _history_collision(plan['mapping'])
        for model in [SavedRevision, RecoveryDraft, FormatRecovery]:
            for old, new in plan['mapping'].items():
                model.objects.filter(path=old).update(path=new)
        operation.state = 'completed'
        operation.reason_code = ''
        operation.index_state = 'pending'
        operation.plan = _receipt(plan)
        operation.save(update_fields=['state', 'reason_code', 'index_state', 'plan'])


def _result(operation):
    return {'operation_id': str(operation.pk), 'state': operation.state, 'reason_code': operation.reason_code,
        'source': operation.source, 'destination': operation.destination, 'index_state': operation.index_state,
        'changed_paths': [row['destination'] for row in operation.plan['changes']],
        'href': reverse('wiki:note', args=[operation.destination]) if stat.S_ISREG(operation.plan['source_identity'][2]) else '/?folder=' + quote(operation.destination)}


def commit_move(actor, operation_id):
    _actor(actor)
    with application_lock('wiki-write'):
        try:
            operation = MoveOperation.objects.get(pk=operation_id, actor=actor)
        except (MoveOperation.DoesNotExist, ValueError):
            raise StorageError('not_found', 404) from None
        if operation.state in {'completed', 'cancelled'}:
            return _result(operation)
        if operation.state == 'preview':
            assert_writes_available()
            if operation.created_at < timezone.now() - timedelta(minutes=30):
                raise StorageError('move_preview_expired', 409)
        # Cleanup may alter directory witnesses even for excluded temp siblings.
        # Existing previews must fail stale rather than adopt those changes.
        from .staging import cleanup_staged_saves
        cleanup_staged_saves()
        if operation.state == 'preview':
            _start(operation)
        try:
            if operation.plan.get('recovery_direction') == 'rollback':
                _rollback(operation)
            else:
                _relocate(operation)
        except Exception as error:
            # Persist the journal even for an unanticipated failure. Never
            # disclose exception text, delete recovery data or replay a write.
            _record_failure(operation, error)
            if operation.state not in {'completed', 'cancelled'}:
                return _result(operation)
        try:
            from indexing.queue import request_scan
            request_scan('verify')
        except Exception:
            operation.index_state = 'failed'
            operation.save(update_fields=['index_state'])
        return _result(operation)


def _moved_identity(operation, info, *, rollback=False):
    identity = operation.plan['source_identity']
    if [info.st_dev, info.st_ino, stat.S_IFMT(info.st_mode)] == [identity[0], identity[1], stat.S_IFMT(identity[2])]:
        return True
    # Replacing a relocated note during this operation changes its inode.
    # Only exact journaled bytes can explain that change, never arbitrary text.
    if stat.S_ISREG(info.st_mode):
        item = next((item for item in operation.plan['changes'] if item['path'] == operation.source), None)
        if item:
            raw = read_note(operation.destination).raw_bytes
            return raw == _raw(item['after']) or rollback and raw == _raw(item['before'])
    return False


def _rollback(operation):
    from .staging import cleanup_staged_saves
    cleanup_staged_saves()
    require_ready()
    plan = operation.plan
    if plan['policy'] != policy_version():
        raise StorageError('move_policy_changed', 409)
    source, destination = _stat(operation.source), _stat(operation.destination)
    renamed = source is None and destination is not None
    if renamed:
        if not _moved_identity(operation, destination, rollback=True):
            raise StorageError('move_recovery_conflict', 409)
    elif source is not None and destination is None:
        identity = plan['source_identity']
        if [source.st_dev, source.st_ino] != identity[:2]:
            # Rollback may itself have completed a source-note replacement.
            item = next((row for row in plan['changes'] if row['path'] == operation.source), None)
            if not item or read_note(operation.source).raw_bytes != _raw(item['before']):
                raise StorageError('move_recovery_conflict', 409)
    else:
        raise StorageError('move_recovery_conflict', 409)
    _validate_recovery_inventory(operation, rollback=True, renamed=renamed)
    for item in reversed(plan['changes']):
        path = item['destination'] if renamed else item['path']
        current = read_note(path).raw_bytes
        original, output = _raw(item['before']), _raw(item['after'])
        if current == original:
            continue
        if current != output:
            raise _conflict(path)
        _publish_change(path, output, original, item['mode'])
    if renamed:
        _rename_noreplace(operation.destination, operation.source)
    _validate_recovery_inventory(operation, finished=True, rollback=True, renamed=False)
    _sync_directories(operation, rollback=True)
    operation.state = 'cancelled'
    operation.reason_code = ''
    operation.index_state = 'pending'
    operation.plan = _receipt(plan)
    operation.save(update_fields=['state', 'reason_code', 'index_state', 'plan'])


def rollback_move(actor, operation_id):
    _actor(actor)
    with application_lock('wiki-write'):
        try:
            operation = MoveOperation.objects.get(pk=operation_id, actor=actor)
        except (MoveOperation.DoesNotExist, ValueError):
            raise StorageError('not_found', 404) from None
        if operation.state in {'completed', 'cancelled'}:
            return _result(operation)
        if operation.state == 'preview':
            operation.state = 'cancelled'
            operation.plan = _receipt(operation.plan)
            operation.save(update_fields=['state', 'plan'])
            return _result(operation)
        operation.plan['recovery_direction'] = 'rollback'
        operation.save(update_fields=['plan'])
        try:
            _rollback(operation)
        except Exception as error:
            _record_failure(operation, error)
        if operation.state == 'cancelled':
            try:
                from indexing.queue import request_scan
                request_scan('verify')
            except Exception:
                operation.index_state = 'failed'
                operation.save(update_fields=['index_state'])
        return _result(operation)


def _validate_recovery_inventory(operation, *, finished=False, rollback=False, renamed=True):
    """Only the reviewed namespace plus our journaled byte states can resume."""
    plan = operation.plan
    root = operation.destination if renamed else operation.source
    witnesses, notes, _ = _scan(root)
    expected = {(plan['mapping'].get(path, path) if renamed else path): fingerprint for path, fingerprint in plan['witnesses'].items()}
    if rollback:
        # Rollback leaves unrelated new inbound sources untouched, but must not
        # move unreviewed descendants or protected files with the original tree.
        witnesses = {path: info for path, info in witnesses.items() if _inside(path, root)}
        expected = {path: info for path, info in expected.items() if _inside(path, root)}
    if witnesses.keys() != expected.keys():
        raise _conflict(*(witnesses.keys() ^ expected.keys()))
    changes = {(item['destination'] if renamed else item['path']): item for item in plan['changes']}
    for path, previous in expected.items():
        current = witnesses[path]
        if path in changes:
            item = changes[path]
            allowed = {_raw(item['before'] if rollback else item['after'])}
            if not finished:
                allowed.add(_raw(item['after'] if rollback else item['before']))
            if path not in notes or notes[path].raw_bytes not in allowed or stat.S_IMODE(current[2]) != item['mode']:
                raise _conflict(path)
        elif stat.S_ISDIR(previous[2]):
            # Our renames and staged writes legitimately change directory times.
            # Complete path-set equality above still detects added/removed files.
            if current[:3] != previous[:3]:
                raise _conflict(path)
        elif _inside(path, root):
            # Top-level rename changes ctime, but never inode/mode/size/mtime or
            # authoritative bytes of otherwise untouched descendants/assets.
            if current[:5] != previous[:5] or current[6:] != previous[6:]:
                raise _conflict(path)
        elif current != previous:
            raise _conflict(path)


def _receipt(plan):
    """Keep review evidence without retaining a second set of recovery bytes."""
    return {key: value for key, value in plan.items() if key not in {'witnesses', 'mapping', 'changes', 'conflicts'}} | {
        'changes': [{key: value for key, value in item.items() if key not in {'before', 'after'}} for item in plan['changes']]}


def _sync_directories(operation, *, rollback=False):
    # Retry durability checks even when readback proves a previous rename/write
    # happened. Observed bytes alone do not confirm a failed directory fsync.
    paths = [operation.source, operation.destination]
    paths += [item['path' if rollback else 'destination'] for item in operation.plan['changes']]
    for parent in sorted({path.rpartition('/')[0] for path in paths}):
        with open_directory(parent) as directory:
            os.fsync(directory)
    require_ready()
