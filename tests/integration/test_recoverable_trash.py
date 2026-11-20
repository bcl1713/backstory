"""New ordinary trash contract; real HTTP/files, bounded synthetic provider control."""
import ctypes
import hashlib
import json

import pytest
from django.test import Client
from tests.integration.test_storage import wiki

pytestmark = pytest.mark.django_db(transaction=True)
RAW = b'\xef\xbb\xbf# Disposable trash\r\nExact original bytes.\r\n'


@pytest.fixture
def trash_client(wiki, django_user_model):
    django_user_model.objects.create_user(username='trash-owner', password='synthetic-trash-password')
    client = Client(enforce_csrf_checks=True)
    assert client.get('/accounts/login/').status_code == 200
    assert client.post('/accounts/login/', {'username': 'trash-owner', 'password': 'synthetic-trash-password',
        'csrfmiddlewaretoken': client.cookies['csrftoken'].value}).status_code == 302
    client.defaults['HTTP_X_CSRFTOKEN'] = client.cookies['csrftoken'].value
    return client


def lifecycle(client, wiki):
    from wiki.models import RemovalOperation
    target = wiki / 'trash.md'
    target.write_bytes(RAW)
    read = client.get('/tools/read/', {'path': target.name})
    assert read.status_code == 200 and read.json()['authoritative']
    revision = read.json()['revision']
    assert revision == '"' + hashlib.sha256(RAW).hexdigest() + '"'
    response = client.post('/tools/removals/preview/', {'path': target.name,
        'kind': 'note', 'revision': revision}, content_type='application/json')
    assert response.status_code == 200, response.content
    result = response.json()
    operation = RemovalOperation.objects.get(pk=result['operation_id'])
    assert operation.plan['contract'] == 'recoverable-trash-v2'
    assert bytes(operation.original) == RAW and target.read_bytes() == RAW
    payload = {'operation_id': result['operation_id']}
    removed = client.post('/tools/removals/commit/', payload, content_type='application/json')
    assert removed.status_code == 200 and removed.json()['state'] == 'removed' and removed.json()['authoritative']
    assert not target.exists()
    absent = client.get('/tools/read/', {'path': target.name})
    assert absent.status_code == 404 and absent.json()['reason_code'] == 'not_found'
    assert client.get('/tools/removals/get/', payload).json()['authoritative']
    restored = client.post('/tools/removals/restore/', payload, content_type='application/json')
    assert restored.status_code == 200 and restored.json()['state'] == 'restored' and restored.json()['authoritative']
    assert target.read_bytes() == RAW
    assert client.get('/tools/read/', {'path': target.name}).json()['revision'] == revision
    print(json.dumps({'journey': 'preview-commit-absence-restore', 'contract': operation.plan['contract'],
        'original_sha256': hashlib.sha256(RAW).hexdigest(), 'disk_absent_after_commit': True,
        'read_after_commit': 404, 'exact_restored_bytes': True}))


def test_real_authenticated_trash_journey(trash_client, wiki):
    """Actual local ext4 path, with no provider mocks or calls required."""
    lifecycle(trash_client, wiki)


def test_synthetic_12_byte_provider_does_not_block_new_trash(trash_client, wiki, monkeypatch):
    """Synthetic regression only; this is not affected-ZFS execution evidence."""
    real_load = ctypes.CDLL

    def load(*args, **kwargs):
        library = real_load(*args, **kwargs)
        real_call = library.name_to_handle_at

        def call(*args):
            result = real_call(*args)
            args[2]._obj.handle_bytes = 12
            return result

        library.name_to_handle_at = call
        return library

    monkeypatch.setattr(ctypes, 'CDLL', load)
    lifecycle(trash_client, wiki)


def prepare(client, wiki):
    target = wiki / 'trash.md'
    target.write_bytes(RAW)
    revision = client.get('/tools/read/', {'path': target.name}).json()['revision']
    response = client.post('/tools/removals/preview/', {'path': target.name,
        'kind': 'note', 'revision': revision}, content_type='application/json')
    assert response.status_code == 200
    return target, {'operation_id': response.json()['operation_id']}


def test_stale_approval_preserves_changed_note_and_recovery(trash_client, wiki):
    from wiki.models import RemovalOperation
    from indexing.models import IndexJob
    target, payload = prepare(trash_client, wiki)
    operation = RemovalOperation.objects.get(pk=payload['operation_id'])
    retained = operation.plan.copy()
    target.write_bytes(b'# Changed after approval\n')
    response = trash_client.post('/tools/removals/commit/', payload, content_type='application/json')
    assert response.status_code == 412 and response.json()['reason_code'] == 'removal_target_changed'
    assert target.read_bytes() == b'# Changed after approval\n'
    operation.refresh_from_db()
    assert operation.state == 'preview' and operation.plan == retained and bytes(operation.original) == RAW
    assert not IndexJob.objects.exists() and not list(wiki.glob('.backstory-tmp-*'))


def test_occupied_restore_keeps_recovery_and_later_retry_succeeds(trash_client, wiki):
    from wiki.models import RemovalOperation
    target, payload = prepare(trash_client, wiki)
    assert trash_client.post('/tools/removals/commit/', payload, content_type='application/json').json()['authoritative']
    operation = RemovalOperation.objects.get(pk=payload['operation_id'])
    retained = operation.plan.copy()
    target.write_bytes(RAW)  # Equal contents still belong to a new occupying entry.
    before = target.stat()
    response = trash_client.post('/tools/removals/restore/', payload, content_type='application/json')
    assert response.json()['state'] == 'removed' and response.json()['reason_code'] == 'removal_restore_collision'
    assert not response.json()['authoritative'] and target.read_bytes() == RAW
    after = target.stat()
    assert (after.st_ino, after.st_mtime_ns, after.st_ctime_ns) == (before.st_ino, before.st_mtime_ns, before.st_ctime_ns)
    operation.refresh_from_db()
    assert operation.state == 'removed' and operation.plan == retained and bytes(operation.original) == RAW
    assert not list(wiki.glob('.backstory-tmp-*'))
    target.unlink()  # Remove only this test-created occupying entry.
    restored = trash_client.post('/tools/removals/restore/', payload, content_type='application/json').json()
    assert restored['state'] == 'restored' and restored['authoritative'] and target.read_bytes() == RAW


def test_new_empty_folder_then_child_restore(trash_client, wiki):
    folder = wiki / 'Folder'
    folder.mkdir()
    (folder / 'child.md').write_bytes(RAW)
    revision = trash_client.get('/tools/read/', {'path': 'Folder/child.md'}).json()['revision']
    note = trash_client.post('/tools/removals/preview/', {'path': 'Folder/child.md',
        'kind': 'note', 'revision': revision}, content_type='application/json').json()
    note_id = {'operation_id': note['operation_id']}
    assert trash_client.post('/tools/removals/commit/', note_id, content_type='application/json').json()['authoritative']
    preview = trash_client.post('/tools/removals/preview/', {'path': 'Folder', 'kind': 'folder'},
        content_type='application/json').json()
    folder_id = {'operation_id': preview['operation_id']}
    assert trash_client.post('/tools/removals/commit/', folder_id, content_type='application/json').json()['authoritative']
    assert not folder.exists()
    assert trash_client.post('/tools/removals/restore/', folder_id, content_type='application/json').json()['authoritative']
    assert trash_client.post('/tools/removals/restore/', note_id, content_type='application/json').json()['authoritative']
    assert (folder / 'child.md').read_bytes() == RAW


def test_unknown_contract_refuses_without_reinterpreting_retained_journal(trash_client, wiki):
    from wiki.models import RemovalOperation
    target, payload = prepare(trash_client, wiki)
    operation = RemovalOperation.objects.get(pk=payload['operation_id'])
    operation.plan['contract'] = 'future-trash-contract'
    operation.save(update_fields=['plan'])
    retained = operation.plan.copy()
    response = trash_client.post('/tools/removals/commit/', payload, content_type='application/json')
    assert response.status_code == 503 and response.json()['reason_code'] == 'removal_contract_unavailable'
    operation.refresh_from_db()
    assert target.read_bytes() == RAW and operation.plan == retained
    assert operation.state == 'preview' and bytes(operation.original) == RAW
