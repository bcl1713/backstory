"""Bounded removal journals operate only on disposable exact targets."""
import json
import os

import pytest

from tests.integration.test_storage import wiki
from tests.integration.test_browsing import reader

pytestmark = pytest.mark.django_db(transaction=True)


@pytest.fixture
def actor(django_user_model):
    return django_user_model.objects.create_user(username='removal-owner')


def preview(actor, wiki, *, raw=b'\xef\xbb\xbf# Exact\r\n', path='note.md'):
    from wiki.removals import preview_removal
    from wiki.storage import read_note
    (wiki / path).write_bytes(raw)
    return preview_removal(actor, path, 'note', read_note(path).revision)


def test_note_preview_commit_restore_exact_bom_and_no_replay(actor, wiki):
    from wiki.removals import commit_removal, get_removal, restore_removal
    from wiki.models import RemovalOperation
    raw = b'\xef\xbb\xbf# Exact\r\n'
    plan = preview(actor, wiki, raw=raw)
    assert plan['state'] == 'preview' and (wiki / 'note.md').read_bytes() == raw
    assert raw == bytes(RemovalOperation.objects.get(pk=plan['operation_id']).original)
    removed = commit_removal(actor, plan['operation_id'])
    assert removed['state'] == 'removed' and removed['authoritative']
    assert not (wiki / 'note.md').exists()
    assert get_removal(actor, plan['operation_id'])['state'] == 'removed'
    restored = restore_removal(actor, plan['operation_id'])
    assert restored['state'] == 'restored' and restored['authoritative']
    assert (wiki / 'note.md').read_bytes() == raw
    assert commit_removal(actor, plan['operation_id'])['state'] == 'restored'
    assert 'source' not in json.dumps(restored)


def test_commit_refuses_changed_note_and_nonempty_folder(actor, wiki):
    from wiki.removals import preview_removal, commit_removal
    from wiki.contracts import StorageError
    plan = preview(actor, wiki)
    (wiki / 'note.md').write_bytes(b'changed')
    with pytest.raises(StorageError, match='removal_target_changed'):
        commit_removal(actor, plan['operation_id'])
    assert (wiki / 'note.md').read_bytes() == b'changed'
    (wiki / 'Empty').mkdir()
    folder = preview_removal(actor, 'Empty', 'folder')
    (wiki / 'Empty/.hidden').write_text('protected child')
    with pytest.raises(StorageError):
        commit_removal(actor, folder['operation_id'])
    assert (wiki / 'Empty/.hidden').read_text() == 'protected child'


def test_empty_folder_roundtrip_and_restore_collision(actor, wiki):
    from wiki.removals import preview_removal, commit_removal, restore_removal
    (wiki / 'Empty').mkdir()
    plan = preview_removal(actor, 'Empty', 'folder')
    assert commit_removal(actor, plan['operation_id'])['state'] == 'removed'
    assert restore_removal(actor, plan['operation_id'])['state'] == 'restored'
    plan = preview(actor, wiki)
    commit_removal(actor, plan['operation_id'])
    (wiki / 'note.md').write_text('new owner')
    result = restore_removal(actor, plan['operation_id'])
    assert result['state'] == 'removed' and result['reason_code'] == 'removal_restore_collision'
    assert (wiki / 'note.md').read_text() == 'new owner'


@pytest.mark.parametrize('after_unlink', [False, True])
def test_failed_removal_is_durable_inspect_never_replays_and_restore_recovers(actor, wiki, monkeypatch, after_unlink):
    from wiki import removals
    from wiki.relocations import assert_writes_available
    from wiki.contracts import StorageError
    plan = preview(actor, wiki)
    unlink = os.unlink
    def fail(name, *args, **kwargs):
        if name == 'note.md':
            if after_unlink:
                unlink(name, *args, **kwargs)
            raise OSError('private failure detail')
        return unlink(name, *args, **kwargs)
    with monkeypatch.context() as patch:
        patch.setattr(os, 'unlink', fail)
        result = removals.commit_removal(actor, plan['operation_id'])
        assert result['state'] == 'recovery_required'
        assert removals.get_removal(actor, plan['operation_id'])['state'] == 'recovery_required'
    with pytest.raises(StorageError, match='removal_recovery_required'):
        assert_writes_available()
    restored = removals.restore_removal(actor, plan['operation_id'])
    assert restored['state'] == ('restored' if after_unlink else 'cancelled')
    assert (wiki / 'note.md').read_bytes() == b'\xef\xbb\xbf# Exact\r\n'
    assert_writes_available()


def test_restore_failed_ack_tracks_own_inode_and_refuses_equal_byte_collision(actor, wiki, monkeypatch):
    from wiki import removals
    plan = preview(actor, wiki)
    removals.commit_removal(actor, plan['operation_id'])
    real_sync = os.fsync
    def fail_directory(fd):
        import stat
        if stat.S_ISDIR(os.fstat(fd).st_mode):
            raise OSError('synthetic failed durability ack')
        return real_sync(fd)
    with monkeypatch.context() as patch:
        patch.setattr(os, 'fsync', fail_directory)
        assert removals.restore_removal(actor, plan['operation_id'])['state'] == 'recovery_required'
    assert removals.restore_removal(actor, plan['operation_id'])['state'] == 'restored'
    second = preview(actor, wiki)
    removals.commit_removal(actor, second['operation_id'])
    (wiki / 'note.md').write_bytes(b'\xef\xbb\xbf# Exact\r\n')
    assert removals.restore_removal(actor, second['operation_id'])['reason_code'] == 'removal_restore_collision'


def test_actor_binding_quota_retention_and_preview_expiry(actor, wiki, settings, django_user_model):
    from datetime import timedelta
    from django.utils import timezone
    from wiki.removals import get_removal, commit_removal, restore_removal
    from wiki.models import RemovalOperation
    from wiki.revisions import _check_quota, prune_recovery
    from wiki.contracts import StorageError
    plan = preview(actor, wiki)
    other = django_user_model.objects.create_user(username='other')
    for action in (get_removal, commit_removal, restore_removal):
        with pytest.raises(StorageError, match='not_found'):
            action(other, plan['operation_id'])
    settings.BACKSTORY_REVISION_QUOTA_BYTES = 1
    with pytest.raises(StorageError, match='backup_quota_exceeded'):
        _check_quota(0)
    RemovalOperation.objects.filter(pk=plan['operation_id']).update(created_at=timezone.now() - timedelta(days=40))
    prune_recovery()
    assert RemovalOperation.objects.filter(pk=plan['operation_id']).exists()
    with pytest.raises(StorageError, match='removal_preview_expired'):
        commit_removal(actor, plan['operation_id'])


def test_policy_parent_identity_and_hardlinks_fail_closed(actor, wiki, tmp_path, settings):
    from wiki.removals import commit_removal, preview_removal
    from wiki.storage import read_note
    from wiki.contracts import StorageError
    plan = preview(actor, wiki)
    settings.BACKSTORY_EXCLUSIONS = ['note.md']
    with pytest.raises(StorageError):
        commit_removal(actor, plan['operation_id'])
    settings.BACKSTORY_EXCLUSIONS = []
    os.link(wiki / 'note.md', wiki / 'same.md')
    with pytest.raises(StorageError, match='hardlinked_removal_entry'):
        preview_removal(actor, 'note.md', 'note', read_note('note.md').revision)
    (wiki / 'linked').symlink_to(tmp_path, target_is_directory=True)
    with pytest.raises(StorageError):
        preview_removal(actor, 'linked', 'folder')


def test_restore_retries_own_publication_after_stage_cleanup_failed(actor, wiki, monkeypatch):
    from wiki import removals
    plan = preview(actor, wiki)
    removals.commit_removal(actor, plan['operation_id'])
    unlink = os.unlink
    def fail_stage(name, *args, **kwargs):
        if str(name).startswith('.backstory-tmp-'):
            raise OSError('synthetic stage cleanup failure')
        return unlink(name, *args, **kwargs)
    with monkeypatch.context() as patch:
        patch.setattr(os, 'unlink', fail_stage)
        assert removals.restore_removal(actor, plan['operation_id'])['state'] == 'recovery_required'
    assert removals.restore_removal(actor, plan['operation_id'])['state'] == 'restored'
    assert os.stat(wiki / 'note.md').st_nlink == 1
    assert not list(wiki.glob('.backstory-tmp-*'))


def test_crash_intent_inspect_pauses_and_explicit_restore_cancels(actor, wiki):
    from wiki import removals
    from wiki.models import RemovalOperation
    from wiki.relocations import assert_writes_available
    from wiki.contracts import StorageError
    plan = preview(actor, wiki)
    RemovalOperation.objects.filter(pk=plan['operation_id']).update(state='applying')
    assert removals.get_removal(actor, plan['operation_id'])['state'] == 'recovery_required'
    assert (wiki / 'note.md').exists()
    with pytest.raises(StorageError):
        assert_writes_available()
    assert removals.restore_removal(actor, plan['operation_id'])['state'] == 'cancelled'
    assert_writes_available()


def test_removal_api_session_csrf_strict_schema_and_actor_boundary(reader, wiki, client, django_user_model):
    from django.test import Client
    from wiki.storage import read_note
    (wiki / 'note.md').write_text('synthetic body never in management receipts')
    payload = {'path': 'note.md', 'kind': 'note', 'revision': read_note('note.md').revision}
    anonymous = Client()
    assert anonymous.post('/tools/removals/preview/', payload, content_type='application/json').status_code == 401
    csrf_client = Client(enforce_csrf_checks=True)
    csrf_client.force_login(django_user_model.objects.get(username='synthetic-reader'))
    assert csrf_client.post('/tools/removals/preview/', payload, content_type='application/json').status_code == 403
    response = reader.post('/tools/removals/preview/', payload, content_type='application/json')
    assert response.status_code == 200
    operation_id = response.json()['operation_id']
    for params in ({'operation_id': operation_id, 'extra': 'bad'}, {}, {'operation_id': '{' + operation_id + '}'}):
        assert reader.get('/tools/removals/get/', params).status_code == 400
    assert reader.get('/tools/removals/get/?operation_id=' + operation_id + '&operation_id=' + operation_id).status_code == 400
    assert reader.post('/tools/removals/commit/', {}, content_type='application/json').status_code == 400
    assert reader.post('/tools/removals/preview/', {**payload, 'recursive': True}, content_type='application/json').status_code == 400
    response = reader.post('/tools/removals/commit/', {'operation_id': operation_id}, content_type='application/json')
    assert response.status_code == 200 and response.json()['state'] == 'removed'
    assert response['Cache-Control'] == 'no-store'
    assert b'synthetic body never' not in response.content
    other = Client()
    other.force_login(django_user_model.objects.create_user(username='other-browser'))
    assert other.get('/tools/removals/get/', {'operation_id': operation_id}).status_code == 404
    assert other.post('/tools/removals/restore/', {'operation_id': operation_id}, content_type='application/json').status_code == 404


def test_restore_refuses_tampered_stage_before_publication(actor, wiki, monkeypatch):
    from wiki import removals
    from wiki.models import RemovalOperation
    plan = preview(actor, wiki)
    removals.commit_removal(actor, plan['operation_id'])
    def fail(*args, **kwargs):
        raise OSError('synthetic before publication')
    with monkeypatch.context() as patch:
        patch.setattr(os, 'link', fail)
        assert removals.restore_removal(actor, plan['operation_id'])['state'] == 'recovery_required'
    operation = RemovalOperation.objects.get(pk=plan['operation_id'])
    (wiki / operation.plan['temporary']).write_bytes(b'changed staging bytes')
    result = removals.restore_removal(actor, plan['operation_id'])
    assert result['state'] == 'recovery_required'
    assert not (wiki / 'note.md').exists()


def test_removal_recovery_and_move_preview_share_one_quota(actor, wiki, settings):
    from wiki.relocations import preview_move
    from wiki.contracts import StorageError
    plan = preview(actor, wiki)
    # A quota occupied by retained removal data must also refuse a move journal.
    settings.BACKSTORY_REVISION_QUOTA_BYTES = 1500
    with pytest.raises(StorageError, match='move_journal_capacity'):
        preview_move(actor, 'note.md', 'Moved.md')
    assert (wiki / 'note.md').exists()


def test_restore_recovers_failed_staging_fsync_without_publishing_partial_stage(actor, wiki, monkeypatch):
    from wiki import removals
    plan = preview(actor, wiki)
    removals.commit_removal(actor, plan['operation_id'])
    real_sync = os.fsync
    def fail_file(fd):
        import stat
        if stat.S_ISREG(os.fstat(fd).st_mode):
            raise OSError('synthetic staged-byte durability failure')
        return real_sync(fd)
    with monkeypatch.context() as patch:
        patch.setattr(os, 'fsync', fail_file)
        assert removals.restore_removal(actor, plan['operation_id'])['state'] == 'recovery_required'
    assert not (wiki / 'note.md').exists()
    assert removals.restore_removal(actor, plan['operation_id'])['state'] == 'restored'
    assert (wiki / 'note.md').read_bytes() == b'\xef\xbb\xbf# Exact\r\n'


@pytest.mark.parametrize('folder_owner', ['same', 'other'])
@pytest.mark.parametrize('pin_parent', [False, True])
def test_restored_parent_is_accepted_only_with_matching_actor_owned_removal_proof(actor, wiki, django_user_model, folder_owner, pin_parent):
    from wiki import removals
    from wiki.contracts import StorageError
    (wiki / 'Folder').mkdir()
    note = preview(actor, wiki, path='Folder/note.md')
    removals.commit_removal(actor, note['operation_id'])
    owner = actor if folder_owner == 'same' else django_user_model.objects.create_user(username='folder-owner')
    folder = removals.preview_removal(owner, 'Folder', 'folder')
    # Pin the removed inode so the positive case cannot accidentally exercise
    # immediate inode reuse instead of genuine parent replacement.
    descriptor = os.open(wiki / 'Folder', os.O_RDONLY | os.O_DIRECTORY)
    original = os.fstat(descriptor)
    if not pin_parent:
        os.close(descriptor)
    try:
        assert removals.commit_removal(owner, folder['operation_id'])['state'] == 'removed'
        assert removals.restore_removal(owner, folder['operation_id'])['state'] == 'restored'
        if pin_parent:
            assert (wiki / 'Folder').stat().st_ino != original.st_ino
    finally:
        if pin_parent:
            os.close(descriptor)
    if folder_owner == 'other':
        with pytest.raises(StorageError, match='removal_context_changed'):
            removals.restore_removal(actor, note['operation_id'])
        assert not (wiki / 'Folder/note.md').exists()
    else:
        assert removals.get_removal(actor, note['operation_id'])['authoritative']
        assert removals.restore_removal(actor, note['operation_id'])['state'] == 'restored'
        assert (wiki / 'Folder/note.md').read_bytes() == b'\xef\xbb\xbf# Exact\r\n'


def test_historical_parent_proof_cannot_authorize_unrelated_reused_inode(actor, wiki):
    from wiki import removals
    from wiki.contracts import StorageError
    parent = wiki / 'Folder'
    parent.mkdir()
    note = preview(actor, wiki, path='Folder/note.md')
    assert removals.commit_removal(actor, note['operation_id'])['state'] == 'removed'
    folder = removals.preview_removal(actor, 'Folder', 'folder')
    assert removals.commit_removal(actor, folder['operation_id'])['state'] == 'removed'
    assert removals.restore_removal(actor, folder['operation_id'])['state'] == 'restored'
    restored = parent.stat()
    parent.rmdir()
    # Exercise actual allocator reuse, with a bounded diagnostic failure on a
    # filesystem that cannot reproduce it, rather than forging journal proof.
    for _ in range(256):
        parent.mkdir()
        replacement = parent.stat()
        if replacement.st_ino == restored.st_ino:
            break
        parent.rmdir()
    else:
        pytest.fail('fixture filesystem did not reproduce directory inode reuse')
    assert replacement.st_ctime_ns != restored.st_ctime_ns
    with pytest.raises(StorageError, match='removal_context_changed'):
        removals.restore_removal(actor, note['operation_id'])
    assert not (parent / 'note.md').exists()
    assert not list(parent.glob('.backstory-tmp-*'))


def test_unjournaled_parent_replacement_with_reused_inode_is_not_adopted(actor, wiki):
    from wiki import removals
    from wiki.contracts import StorageError
    parent = wiki / 'Folder'
    parent.mkdir()
    note = preview(actor, wiki, path='Folder/note.md')
    assert removals.commit_removal(actor, note['operation_id'])['state'] == 'removed'
    original = parent.stat()
    parent.rmdir()
    for _ in range(256):
        parent.mkdir()
        replacement = parent.stat()
        if replacement.st_ino == original.st_ino:
            break
        parent.rmdir()
    else:
        pytest.fail('fixture filesystem did not reproduce directory inode reuse')
    assert replacement.st_ctime_ns != original.st_ctime_ns
    with pytest.raises(StorageError, match='removal_context_changed'):
        removals.restore_removal(actor, note['operation_id'])
    assert not (parent / 'note.md').exists()
    assert not list(parent.glob('.backstory-tmp-*'))


@pytest.mark.parametrize('state', ['removed', 'recovery_required'])
def test_legacy_two_field_parent_journal_restores_under_unchanged_parent(actor, wiki, state):
    from wiki import removals
    from wiki.models import RemovalOperation
    plan = preview(actor, wiki)
    assert removals.commit_removal(actor, plan['operation_id'])['state'] == 'removed'
    operation = RemovalOperation.objects.get(pk=plan['operation_id'])
    operation.plan['parent'] = operation.plan['parent'][:2]
    operation.plan.pop('parent_journal', None)
    operation.plan.pop('root_generation', None)
    operation.plan.pop('original_generation', None)
    operation.state = state
    operation.save(update_fields=['plan', 'state'])
    result = removals.restore_removal(actor, plan['operation_id'])
    assert result['state'] == 'restored' and result['authoritative']
    assert (wiki / 'note.md').read_bytes() == bytes(operation.original)


@pytest.mark.parametrize('mutation', ['unlink', 'stage'])
def test_process_interruption_after_namespace_mutation_remains_recoverable(actor, wiki, monkeypatch, mutation):
    from wiki import removals
    from wiki.relocations import assert_writes_available
    plan = preview(actor, wiki)
    if mutation == 'stage':
        assert removals.commit_removal(actor, plan['operation_id'])['state'] == 'removed'
    real_mutation = os.unlink if mutation == 'unlink' else removals._write_stage

    def interrupt(*args, **kwargs):
        if mutation == 'unlink':
            real_mutation(*args, **kwargs)
        raise KeyboardInterrupt('synthetic process interruption before witness refresh')

    with monkeypatch.context() as patch:
        patch.setattr(os if mutation == 'unlink' else removals,
                      'unlink' if mutation == 'unlink' else '_write_stage', interrupt)
        with pytest.raises(KeyboardInterrupt):
            (removals.commit_removal if mutation == 'unlink' else removals.restore_removal)(actor, plan['operation_id'])
    assert not (wiki / 'note.md').exists()
    assert removals.restore_removal(actor, plan['operation_id'])['state'] == 'restored'
    assert (wiki / 'note.md').read_bytes() == b'\xef\xbb\xbf# Exact\r\n'
    assert_writes_available()


@pytest.mark.parametrize('kind,mode', [('note', 0o640), ('folder', 0o750)])
def test_restore_preserves_original_permissions_under_restrictive_umask(actor, wiki, kind, mode):
    import stat
    from wiki import removals
    if kind == 'note':
        plan = preview(actor, wiki)
        path = wiki / 'note.md'
        # Preview must capture the permissions selected for this exact target.
        removals.restore_removal(actor, plan['operation_id'])
        path.chmod(mode)
        from wiki.storage import read_note
        plan = removals.preview_removal(actor, 'note.md', kind, read_note('note.md').revision)
    else:
        path = wiki / 'Folder'
        path.mkdir()
        path.chmod(mode)
        plan = removals.preview_removal(actor, 'Folder', kind)
    assert removals.commit_removal(actor, plan['operation_id'])['state'] == 'removed'
    previous_umask = os.umask(0o077)
    try:
        assert removals.restore_removal(actor, plan['operation_id'])['state'] == 'restored'
    finally:
        os.umask(previous_umask)
    assert stat.S_IMODE(path.stat().st_mode) == mode


@pytest.mark.parametrize('action', ['commit', 'restore'])
def test_mutation_acknowledges_uncertainty_if_status_database_fails_after_filesystem_change(reader, wiki, monkeypatch, action):
    from django.db import DatabaseError
    from wiki.models import RemovalOperation
    from wiki.storage import read_note
    (wiki / 'note.md').write_bytes(b'\xef\xbb\xbf# Exact\r\n')
    plan = reader.post('/tools/removals/preview/', {'path': 'note.md', 'kind': 'note',
        'revision': read_note('note.md').revision}, content_type='application/json').json()
    payload = {'operation_id': plan['operation_id']}
    if action == 'restore':
        assert reader.post('/tools/removals/commit/', payload, content_type='application/json').json()['state'] == 'removed'
    save = RemovalOperation.save
    def fail_status(self, *args, **kwargs):
        if self.state in {'removed', 'restored', 'recovery_required'}:
            raise DatabaseError('synthetic terminal status and recovery status failure')
        return save(self, *args, **kwargs)
    with monkeypatch.context() as patch:
        patch.setattr(RemovalOperation, 'save', fail_status)
        response = reader.post('/tools/removals/' + action + '/', payload, content_type='application/json')
    assert response.status_code == 503
    result = response.json()
    assert result['state'] == 'uncertain'
    assert result['operation_id'] == plan['operation_id']
    assert result['reason_code'] == 'removal_outcome_unknown'
    assert result['authoritative'] is False
    assert result['inspect_before_retry'] and result['read_before_retry']
    assert 'path' not in result
    assert (wiki / 'note.md').exists() == (action == 'restore')
    inspected = reader.get('/tools/removals/get/', payload).json()
    assert inspected['state'] == 'recovery_required'


@pytest.mark.parametrize('crash_state', ['restoring', 'recovery_required'])
def test_unknown_restore_stage_requires_explicit_no_overwrite_quarantine(actor, wiki, crash_state):
    from wiki import removals
    from wiki.contracts import StorageError
    from wiki.models import RemovalOperation
    from wiki.relocations import _rename_noreplace, assert_writes_available
    raw = b'\xef\xbb\xbf# Exact\r\n'
    plan = preview(actor, wiki, raw=raw)
    assert removals.commit_removal(actor, plan['operation_id'])['state'] == 'removed'
    operation = RemovalOperation.objects.get(pk=plan['operation_id'])
    temporary = '.backstory-tmp-0123456789abcdef0123456789abcdef'
    # Simulate the filesystem-create/database-inode-proof crash window. Even
    # exact original bytes must not turn an unproven stage into owned material.
    stage = wiki / temporary
    stage.write_bytes(raw)
    original_identity = (stage.stat().st_dev, stage.stat().st_ino)
    operation.plan['temporary'] = temporary
    assert 'restore_identity' not in operation.plan
    operation.state = crash_state
    operation.save(update_fields=['plan', 'state'])

    assert removals.restore_removal(actor, plan['operation_id'])['state'] == 'recovery_required'
    retained = RemovalOperation.objects.get(pk=plan['operation_id'])
    assert bytes(retained.original) == raw
    assert 'restore_identity' not in retained.plan
    assert stage.read_bytes() == raw
    assert (stage.stat().st_dev, stage.stat().st_ino) == original_identity
    assert not (wiki / 'note.md').exists()
    with pytest.raises(StorageError, match='removal_recovery_required'):
        assert_writes_available()

    # A deliberate operator action preserves the unknown inode in a private,
    # policy-hidden fixture directory through the existing exclusive rename.
    quarantine = wiki / '.operator-quarantine'
    quarantine.mkdir(mode=0o700)
    _rename_noreplace(temporary, '.operator-quarantine/unknown-stage')
    preserved = quarantine / 'unknown-stage'
    assert not stage.exists()
    assert preserved.read_bytes() == raw
    assert (preserved.stat().st_dev, preserved.stat().st_ino) == original_identity
    assert removals.restore_removal(actor, plan['operation_id'])['state'] == 'restored'
    assert (wiki / 'note.md').read_bytes() == raw
    assert preserved.read_bytes() == raw
    assert (preserved.stat().st_dev, preserved.stat().st_ino) == original_identity
    assert_writes_available()


@pytest.mark.parametrize('state', ['removed', 'recovery_required'])
def test_uncorroborated_nested_legacy_retains_journal_and_bytes(actor, wiki, state):
    from wiki import removals
    from wiki.models import RemovalOperation
    from wiki.contracts import StorageError
    (wiki / 'Folder').mkdir()
    plan = preview(actor, wiki, path='Folder/note.md')
    assert removals.commit_removal(actor, plan['operation_id'])['state'] == 'removed'
    operation = RemovalOperation.objects.get(pk=plan['operation_id'])
    operation.plan['parent'] = operation.plan['parent'][:2]
    operation.plan.pop('root_generation', None)
    operation.state = state
    operation.save(update_fields=['plan', 'state'])
    retained_plan = operation.plan.copy()
    with pytest.raises(StorageError, match='removal_context_changed'):
        removals.restore_removal(actor, plan['operation_id'])
    operation.refresh_from_db()
    assert operation.plan == retained_plan and operation.state == state
    assert bytes(operation.original) == b'\xef\xbb\xbf# Exact\r\n'
    assert list((wiki / 'Folder').iterdir()) == []


@pytest.mark.parametrize('action', ['commit', 'restore'])
def test_unavailable_generation_provider_preserves_all_material(actor, wiki, monkeypatch, action):
    import ctypes
    from wiki import removals
    from wiki.models import RemovalOperation
    from wiki.contracts import StorageError
    plan = preview(actor, wiki)
    if action == 'restore':
        assert removals.commit_removal(actor, plan['operation_id'])['state'] == 'removed'
    operation = RemovalOperation.objects.get(pk=plan['operation_id'])
    retained_plan = operation.plan.copy()
    def unavailable(*args, **kwargs):
        raise OSError('synthetic unavailable export handle provider')
    monkeypatch.setattr(ctypes, 'CDLL', unavailable)
    with pytest.raises(StorageError, match='removal_generation_unavailable'):
        (removals.commit_removal if action == 'commit' else removals.restore_removal)(actor, plan['operation_id'])
    operation.refresh_from_db()
    assert operation.plan == retained_plan
    assert operation.state == ('preview' if action == 'commit' else 'removed')
    assert bytes(operation.original) == b'\xef\xbb\xbf# Exact\r\n'
    assert (wiki / 'note.md').exists() == (action == 'commit')
    assert not list(wiki.glob('.backstory-tmp-*'))


def test_sibling_namespace_changes_do_not_invalidate_generation(actor, wiki):
    from wiki import removals
    plan = preview(actor, wiki)
    (wiki / 'sibling.md').write_bytes(b'sibling')
    assert removals.commit_removal(actor, plan['operation_id'])['state'] == 'removed'
    (wiki / 'sibling.md').unlink()
    assert removals.restore_removal(actor, plan['operation_id'])['state'] == 'restored'


@pytest.mark.parametrize('malformation', ['empty', 'wrong_type', 'wrong_length', 'wrong_inode'])
def test_malformed_provider_success_refuses_before_staging(actor, wiki, monkeypatch, malformation):
    import ctypes
    from wiki import removals
    from wiki.models import RemovalOperation
    from wiki.contracts import StorageError
    plan = preview(actor, wiki)
    assert removals.commit_removal(actor, plan['operation_id'])['state'] == 'removed'
    operation = RemovalOperation.objects.get(pk=plan['operation_id'])
    retained = operation.plan.copy()
    real_load = ctypes.CDLL
    def load(*args, **kwargs):
        library = real_load(*args, **kwargs)
        real_call = library.name_to_handle_at
        def call(*call_args):
            result = real_call(*call_args)
            handle = call_args[2]._obj
            if malformation == 'wrong_type':
                handle.handle_type = 999
            elif malformation == 'wrong_length':
                handle.handle_bytes = 129
            elif malformation == 'wrong_inode':
                handle.f_handle[0] ^= 0xff
            else:
                for index in range(8):
                    handle.f_handle[index] = 0
            return result
        library.name_to_handle_at = call
        return library
    monkeypatch.setattr(ctypes, 'CDLL', load)
    with pytest.raises(StorageError, match='removal_generation_unavailable'):
        removals.restore_removal(actor, plan['operation_id'])
    operation.refresh_from_db()
    assert operation.plan == retained and operation.state == 'removed'
    assert bytes(operation.original) == b'\xef\xbb\xbf# Exact\r\n'
    assert not (wiki / 'note.md').exists()
    assert not list(wiki.glob('.backstory-tmp-*'))


def test_multiple_completed_parent_generations_form_exact_chain(actor, wiki):
    from wiki import removals
    (wiki / 'Folder').mkdir()
    note = preview(actor, wiki, path='Folder/note.md')
    assert removals.commit_removal(actor, note['operation_id'])['state'] == 'removed'
    for _ in range(2):
        folder = removals.preview_removal(actor, 'Folder', 'folder')
        assert removals.commit_removal(actor, folder['operation_id'])['state'] == 'removed'
        assert removals.restore_removal(actor, folder['operation_id'])['state'] == 'restored'
    assert removals.restore_removal(actor, note['operation_id'])['state'] == 'restored'
    assert (wiki / 'Folder/note.md').read_bytes() == b'\xef\xbb\xbf# Exact\r\n'


def test_parent_adoption_is_durable_before_child_stage(actor, wiki, monkeypatch):
    from wiki import removals
    from wiki.models import RemovalOperation
    (wiki / 'Folder').mkdir()
    note = preview(actor, wiki, path='Folder/note.md')
    assert removals.commit_removal(actor, note['operation_id'])['state'] == 'removed'
    original = RemovalOperation.objects.get(pk=note['operation_id']).plan.copy()
    folder = removals.preview_removal(actor, 'Folder', 'folder')
    assert removals.commit_removal(actor, folder['operation_id'])['state'] == 'removed'
    assert removals.restore_removal(actor, folder['operation_id'])['state'] == 'restored'
    def interrupt(operation, directory):
        durable = RemovalOperation.objects.get(pk=operation.pk)
        assert durable.plan['parent'] == original['parent']
        assert durable.plan['adopted_parent'] != original['parent']
        assert folder['operation_id'] in durable.plan['parent_proof']
        assert 'temporary' not in durable.plan
        raise KeyboardInterrupt('before child staging')
    with monkeypatch.context() as patch:
        patch.setattr(removals, '_restore_stage', interrupt)
        with pytest.raises(KeyboardInterrupt):
            removals.restore_removal(actor, note['operation_id'])
    assert not list((wiki / 'Folder').iterdir())
    assert removals.restore_removal(actor, note['operation_id'])['state'] == 'restored'


@pytest.mark.parametrize('kind', ['note', 'folder'])
@pytest.mark.parametrize('point', ['publication', 'cleanup'])
def test_process_interruption_after_restore_publication_or_cleanup(actor, wiki, monkeypatch, kind, point):
    from wiki import removals
    from wiki.relocations import assert_writes_available
    if kind == 'note':
        plan = preview(actor, wiki)
    else:
        (wiki / 'Empty').mkdir()
        plan = removals.preview_removal(actor, 'Empty', 'folder')
    assert removals.commit_removal(actor, plan['operation_id'])['state'] == 'removed'
    real_cleanup = removals._cleanup_stage
    def interrupt(operation, directory):
        if point == 'cleanup':
            real_cleanup(operation, directory)
        raise KeyboardInterrupt('synthetic process death after ' + point)
    with monkeypatch.context() as patch:
        patch.setattr(removals, '_cleanup_stage', interrupt)
        with pytest.raises(KeyboardInterrupt):
            removals.restore_removal(actor, plan['operation_id'])
    assert removals.get_removal(actor, plan['operation_id'])['state'] == 'recovery_required'
    assert removals.restore_removal(actor, plan['operation_id'])['state'] == 'restored'
    assert not list(wiki.glob('.backstory-tmp-*'))
    if kind == 'note':
        assert (wiki / 'note.md').read_bytes() == b'\xef\xbb\xbf# Exact\r\n'
    else:
        assert list((wiki / 'Empty').iterdir()) == []
    assert_writes_available()


@pytest.mark.parametrize('chain_length', [2, 32])
def test_parent_proof_growth_reserves_quota_before_adoption_and_child_stage(actor, wiki, settings, monkeypatch, chain_length):
    from wiki import removals
    from wiki.contracts import StorageError
    from wiki.models import RemovalOperation
    from wiki.revisions import _check_quota, _record_charge
    parent = wiki / 'Folder'
    parent.mkdir()
    note = preview(actor, wiki, path='Folder/note.md')
    assert removals.commit_removal(actor, note['operation_id'])['state'] == 'removed'
    chain = []
    for _ in range(chain_length):
        folder = removals.preview_removal(actor, 'Folder', 'folder')
        assert removals.commit_removal(actor, folder['operation_id'])['state'] == 'removed'
        assert removals.restore_removal(actor, folder['operation_id'])['state'] == 'restored'
        chain.append(folder['operation_id'])
    retained = list(RemovalOperation.objects.order_by('pk').values())
    operation = RemovalOperation.objects.get(pk=note['operation_id'])
    last = RemovalOperation.objects.get(pk=chain[-1])
    adopted = {**operation.plan,
        'adopted_parent': [*last.plan['restore_identity'], last.plan['restore_generation']],
        'parent_proof': chain}
    growth = len(json.dumps(adopted).encode()) - len(json.dumps(operation.plan).encode())
    if chain_length == 32:
        assert len(json.dumps(chain).encode()) > 1024
    total = sum(_record_charge(row.path, row.base_revision, bytes(row.original),
        json.dumps(row.plan).encode(), row.kind.encode()) + 1024
        for row in RemovalOperation.objects.all())
    settings.BACKSTORY_REVISION_QUOTA_BYTES = total + growth - 1
    stages = []
    real_stage = removals._restore_stage

    def boundary_stage(current, directory):
        stages.append(current.pk)
        durable = RemovalOperation.objects.get(pk=current.pk)
        assert durable.plan == adopted
        _check_quota(0)  # The serialized persisted proof fits at the exact boundary.
        assert not list(parent.iterdir())
        raise KeyboardInterrupt('after adoption, before child staging')

    with monkeypatch.context() as patch:
        patch.setattr(removals, '_restore_stage', boundary_stage)
        with pytest.raises(StorageError, match='backup_quota_exceeded'):
            removals.restore_removal(actor, note['operation_id'])
        assert stages == []
        assert list(RemovalOperation.objects.order_by('pk').values()) == retained
        assert not list(parent.iterdir())
        assert bytes(operation.original) == b'\xef\xbb\xbf# Exact\r\n'
        settings.BACKSTORY_REVISION_QUOTA_BYTES = total + growth
        with pytest.raises(KeyboardInterrupt):
            removals.restore_removal(actor, note['operation_id'])
        assert stages == [operation.pk]
    # Keep the existing conservative recovery growth allowance available too.
    settings.BACKSTORY_REVISION_QUOTA_BYTES += 1024
    assert removals._restore_stage is real_stage
    assert removals.restore_removal(actor, note['operation_id'])['state'] == 'restored'
    assert (parent / 'note.md').read_bytes() == bytes(operation.original)
    _check_quota(0)
