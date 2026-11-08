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
def test_restored_parent_is_accepted_only_with_matching_actor_owned_removal_proof(actor, wiki, django_user_model, folder_owner):
    from wiki import removals
    from wiki.contracts import StorageError
    (wiki / 'Folder').mkdir()
    note = preview(actor, wiki, path='Folder/note.md')
    removals.commit_removal(actor, note['operation_id'])
    owner = actor if folder_owner == 'same' else django_user_model.objects.create_user(username='folder-owner')
    folder = removals.preview_removal(owner, 'Folder', 'folder')
    assert removals.commit_removal(owner, folder['operation_id'])['state'] == 'removed'
    assert removals.restore_removal(owner, folder['operation_id'])['state'] == 'restored'
    if folder_owner == 'other':
        with pytest.raises(StorageError, match='removal_context_changed'):
            removals.restore_removal(actor, note['operation_id'])
        assert not (wiki / 'Folder/note.md').exists()
    else:
        assert removals.get_removal(actor, note['operation_id'])['authoritative']
        assert removals.restore_removal(actor, note['operation_id'])['state'] == 'restored'
        assert (wiki / 'Folder/note.md').read_bytes() == b'\xef\xbb\xbf# Exact\r\n'


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
