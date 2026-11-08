"""Tool adapters use real relocation and revision writers on disposable storage."""
import importlib
import json
from datetime import timedelta

import pytest
from django.test import RequestFactory
from django.utils import timezone

from tests.integration.test_browsing import reader
from tests.integration.test_storage import wiki

pytestmark = pytest.mark.django_db(transaction=True)


def actor():
    from django.contrib.auth import get_user_model
    return get_user_model().objects.get(username='synthetic-reader')


def invoke(name, payload=None, *, method='post', user=None, content_type='application/json'):
    request = getattr(RequestFactory(), method)('/tools/management/', payload or {}, content_type=content_type)
    request.user = user or actor()
    return getattr(importlib.import_module('wiki.management_tools'), name)(request)


def preview():
    return invoke('preview_move_tool', {'source': 'From.md', 'destination': 'To.md'})


def commit(review, **extra):
    return invoke('commit_move_tool', {'operation_id': review['operation_id'],
                                      'review_token': review['review_token'], **extra})


def revision(path='From.md', original=b'old\n'):
    from wiki.models import SavedRevision
    return SavedRevision.objects.create(actor=actor(), path=path, original=original, submitted=b'current\n')


def test_preview_requires_review_before_domain_move_and_hides_private_inventory(reader, wiki):
    (wiki / 'From.md').write_bytes(b'\xef\xbb\xbf# From\r\n')
    (wiki / 'Home.md').write_text('[[From]]\n')
    response = preview()
    assert response.status_code == 200
    data = json.loads(response.content)
    assert data['state'] == 'preview' and data['kind'] == 'note'
    assert set(data['affected_paths']) == {'From.md', 'To.md', 'Home.md'}
    assert data['changes'][0]['diff'] and data['review_token']
    assert all(key not in str(data) for key in ['witnesses', 'source_identity', '"before"', '"after"'])
    assert (wiki / 'From.md').exists() and not (wiki / 'To.md').exists()
    denied = invoke('commit_move_tool', {'operation_id': data['operation_id']})
    assert denied.status_code == 400
    response = commit(data)
    saved = json.loads(response.content)
    assert response.status_code == 200 and saved['state'] == 'completed' and saved['authoritative']
    assert saved['path'] == 'To.md' and saved['source'] == '# From\r\n' and saved['bom']
    assert saved['revision'] == response['ETag']
    assert '[[To]]' in (wiki / 'Home.md').read_text()
    from wiki.models import SavedRevision
    assert SavedRevision.objects.filter(path='Home.md').count() == 1


@pytest.mark.parametrize('change', ['source', 'collision', 'witness', 'policy', 'expired', 'token'])
def test_stale_or_unreviewed_moves_never_publish(reader, wiki, settings, change):
    from wiki.models import MoveOperation
    (wiki / 'From.md').write_text('original')
    review = json.loads(preview().content)
    if change == 'source':
        (wiki / 'From.md').write_text('external')
    elif change == 'collision':
        (wiki / 'To.md').write_text('competitor')
    elif change == 'witness':
        (wiki / 'Another.md').write_text('[[From]]')
    elif change == 'policy':
        settings.BACKSTORY_EXCLUSIONS = ['Other']
    elif change == 'expired':
        MoveOperation.objects.filter(pk=review['operation_id']).update(created_at=timezone.now() - timedelta(hours=1))
    else:
        review['review_token'] += 'tampered'
    response = commit(review)
    assert response.status_code in {400, 409}
    assert (wiki / 'From.md').exists()
    if change != 'collision':
        assert not (wiki / 'To.md').exists()


def test_actor_and_policy_revalidation_hide_existing_plans(reader, wiki, django_user_model, settings):
    (wiki / 'From.md').write_text('original')
    (wiki / 'Home.md').write_text('[[From]]')
    review = json.loads(preview().content)
    other = django_user_model.objects.create_user('other')
    assert invoke('get_move', {'operation_id': review['operation_id']}, method='get', user=other).status_code == 404
    settings.BACKSTORY_EXCLUSIONS = ['Home.md']
    response = invoke('get_move', {'operation_id': review['operation_id']}, method='get')
    assert response.status_code == 404 and b'Home.md' not in response.content
    assert commit(review).status_code == 404


def test_preview_cap_fails_closed_and_plan_cannot_be_committed(reader, wiki, monkeypatch):
    from wiki.models import MoveOperation
    (wiki / 'From.md').write_text('original')
    module = importlib.import_module('wiki.management_tools')
    monkeypatch.setattr(module, 'MAX_REVIEW_BYTES', 16)
    response = preview()
    assert response.status_code == 413 and b'move_review_too_large' in response.content
    op = MoveOperation.objects.get()
    assert invoke('commit_move_tool', {'operation_id': str(op.pk), 'review_token': 'invented'}).status_code == 413
    assert (wiki / 'From.md').read_text() == 'original'


def test_readback_failure_is_uncertain_and_inspect_does_not_replay(reader, wiki, monkeypatch):
    from wiki.contracts import StorageError
    module = importlib.import_module('wiki.management_tools')
    (wiki / 'From.md').write_text('original')
    review = json.loads(preview().content)
    real = module.read_note
    monkeypatch.setattr(module, 'read_note', lambda *a: (_ for _ in ()).throw(StorageError('storage_io_error', 503)))
    response = commit(review)
    data = json.loads(response.content)
    assert response.status_code == 503 and data['state'] == 'uncertain' and data['inspect_before_retry']
    assert not data['authoritative'] and (wiki / 'To.md').exists()
    monkeypatch.setattr(module, 'read_note', real)
    response = invoke('get_move', {'operation_id': review['operation_id']}, method='get')
    assert json.loads(response.content)['state'] == 'completed'
    assert not (wiki / 'From.md').exists()


def test_recovery_and_rollback_use_existing_journal(reader, wiki, monkeypatch):
    service = importlib.import_module('wiki.relocations')
    (wiki / 'From.md').write_text('original')
    (wiki / 'Home.md').write_text('[[From]]')
    review = json.loads(preview().content)
    real = service._publish_change
    monkeypatch.setattr(service, '_publish_change', lambda *a: (_ for _ in ()).throw(OSError('private failure')))
    failed = json.loads(commit(review).content)
    assert failed['state'] == 'recovery_required' and failed['inspect_before_retry']
    monkeypatch.setattr(service, '_publish_change', real)
    cancelled = invoke('rollback_move_tool', {'operation_id': review['operation_id']})
    assert json.loads(cancelled.content)['state'] == 'cancelled'
    assert (wiki / 'From.md').read_text() == 'original' and not (wiki / 'To.md').exists()


def test_history_pages_bind_path_actor_policy_and_generation_without_bodies(reader, wiki, settings, django_user_model):
    (wiki / 'From.md').write_text('current\n')
    for _ in range(3):
        revision()
    first = invoke('list_note_history', {'path': 'From.md', 'limit': 2}, method='get')
    data = json.loads(first.content)
    assert len(data['items']) == 2 and data['next_cursor']
    assert all('source' not in item and 'actor' not in item and 'original' not in item for item in data['items'])
    second = invoke('list_note_history', {'path': 'From.md', 'limit': 2, 'cursor': data['next_cursor']}, method='get')
    assert len(json.loads(second.content)['items']) == 1
    assert invoke('list_note_history', {'path': 'Other.md', 'cursor': data['next_cursor']}, method='get').status_code == 400
    other = django_user_model.objects.create_user('other')
    assert invoke('list_note_history', {'path': 'From.md', 'cursor': data['next_cursor']}, method='get', user=other).status_code == 400
    revision()
    assert invoke('list_note_history', {'path': 'From.md', 'cursor': data['next_cursor']}, method='get').status_code == 400
    settings.BACKSTORY_EXCLUSIONS = ['From.md']
    assert invoke('list_note_history', {'path': 'From.md'}, method='get').status_code == 404


def test_revision_source_restore_requires_exact_current_revision_and_preserves_backup_bom(reader, wiki):
    from wiki.storage import read_note
    from wiki.models import SavedRevision
    raw = b'\xef\xbb\xbf# Historic\r\n'
    row = revision(original=raw)
    (wiki / 'From.md').write_text('current\n')
    read = invoke('read_note_revision', {'revision_id': row.pk}, method='get')
    historical = json.loads(read.content)
    assert historical['source'] == '# Historic\r\n' and historical['bom'] and historical['newline'] == '\r\n'
    assert historical['path'] == 'From.md' and historical['authoritative'] is False
    for value in [None, '*', 'W/"bad"']:
        assert invoke('restore_note_revision', {'path': 'From.md', 'revision_id': row.pk, 'revision': value}).status_code == 400
    assert invoke('restore_note_revision', {'path': 'From.md', 'revision_id': row.pk}).status_code == 428
    assert invoke('restore_note_revision', {'path': 'From.md', 'revision_id': row.pk, 'revision': '"' + '0' * 64 + '"'}).status_code == 412
    restored = invoke('restore_note_revision', {'path': 'From.md', 'revision_id': row.pk, 'revision': read_note('From.md').revision})
    data = json.loads(restored.content)
    assert restored.status_code == 200 and data['authoritative'] and data['source'] == '# Historic\r\n'
    assert (wiki / 'From.md').read_bytes() == raw
    assert SavedRevision.objects.filter(original=b'current\n').exists()
    assert 'recovery_token' not in data


@pytest.mark.parametrize('path', ['AGENTS.md', 'link.md', 'blocked/old.md'])
def test_history_obeys_current_path_policy_and_no_follow(reader, wiki, path, tmp_path):
    row = revision(path=path)
    (wiki / 'link.md').symlink_to(tmp_path / 'private.md')
    (wiki / 'blocked').symlink_to(tmp_path, target_is_directory=True)
    assert invoke('read_note_revision', {'revision_id': row.pk}, method='get').status_code == 404
    assert invoke('list_note_history', {'path': path}, method='get').status_code == 404


@pytest.mark.parametrize('name,payload,method', [
    ('preview_move_tool', {'source': 'From.md', 'destination': 'To.md', 'extra': True}, 'post'),
    ('get_move', {'operation_id': 'not-an-id'}, 'get'),
    ('list_note_history', {'path': 'From.md', 'limit': 101}, 'get'),
    ('read_note_revision', {'revision_id': 'x'}, 'get'),
    ('restore_note_revision', {'revision_id': 1, 'revision': None, 'mode': 'unsafe'}, 'post'),
])
def test_strict_arguments_are_json_errors(reader, wiki, name, payload, method):
    response = invoke(name, payload, method=method)
    assert response.status_code == 400 and json.loads(response.content)['untrusted_content']


def test_move_retains_source_path_when_readback_source_is_note_text(reader, wiki):
    (wiki / 'From.md').write_text('original')
    review = json.loads(preview().content)
    assert review['source_path'] == 'From.md'
    done = json.loads(commit(review).content)
    assert done['source_path'] == 'From.md' and done['source'] == 'original'


@pytest.mark.parametrize('route,payload', [
    ('/tools/moves/preview/', {'source': 'From.md', 'destination': 'To.md'}),
    ('/tools/moves/commit/', {'operation_id': 'a'}),
    ('/tools/moves/rollback/', {'operation_id': 'a'}),
    ('/tools/history/restore/', {'revision_id': 1, 'revision': None}),
])
def test_mutation_routes_enforce_real_session_and_csrf(reader, wiki, route, payload):
    from django.test import Client
    assert Client().post(route, payload, content_type='application/json').status_code == 401
    guarded = Client(enforce_csrf_checks=True)
    guarded.cookies = reader.cookies
    assert guarded.post(route, payload, content_type='application/json').status_code == 403
    assert reader.get(route).status_code == 405
    assert reader.post(route, payload, content_type='text/plain').status_code == 400


@pytest.mark.parametrize('route', ['/tools/moves/get/', '/tools/history/list/', '/tools/history/read/'])
def test_inspection_routes_enforce_real_session(reader, wiki, route):
    from django.test import Client
    assert Client().get(route).status_code == 401
    assert reader.post(route, {}, content_type='application/json').status_code == 405


def test_move_domain_quota_and_index_failure_are_preserved(reader, wiki, settings, monkeypatch):
    (wiki / 'From.md').write_text('original')
    (wiki / 'Home.md').write_text('[[From]]')
    review = json.loads(preview().content)
    settings.BACKSTORY_REVISION_QUOTA_BYTES = 1
    failed = commit(review)
    assert failed.status_code == 503 and b'backup_quota_exceeded' in failed.content
    assert (wiki / 'From.md').exists() and not (wiki / 'To.md').exists()
    settings.BACKSTORY_REVISION_QUOTA_BYTES = 128 * 1024 * 1024
    monkeypatch.setattr('indexing.queue.request_scan', lambda *a: (_ for _ in ()).throw(OSError('private')))
    done = json.loads(commit(review).content)
    assert done['state'] == 'completed' and done['index_state'] == 'failed' and done['authoritative']


def test_empty_folder_move_has_verified_folder_readback(reader, wiki):
    (wiki / 'Folder').mkdir()
    previewed = invoke('preview_move_tool', {'source': 'Folder', 'destination': 'Archive.md'})
    data = json.loads(previewed.content)
    assert data['kind'] == 'folder'
    done = json.loads(commit(data).content)
    assert done['state'] == 'completed' and done['verified'] and done['authoritative']
    assert done['path'] == 'Archive.md' and (wiki / 'Archive.md').is_dir()


def test_restore_readback_failure_is_uncertain_and_does_not_repeat_writer(reader, wiki, monkeypatch):
    from wiki.contracts import StorageError
    from wiki.models import SavedRevision
    from wiki.storage import read_note
    row = revision()
    (wiki / 'From.md').write_text('current\n')
    base = read_note('From.md').revision
    module = importlib.import_module('wiki.management_tools')
    monkeypatch.setattr(module, 'read_note', lambda *a: (_ for _ in ()).throw(StorageError('storage_io_error', 503)))
    response = invoke('restore_note_revision', {'path': 'From.md', 'revision_id': row.pk, 'revision': base})
    data = json.loads(response.content)
    assert response.status_code == 503 and data['state'] == 'uncertain' and data['read_before_retry']
    assert not data['authoritative'] and (wiki / 'From.md').read_bytes() == b'old\n'
    assert SavedRevision.objects.filter(original=b'current\n').count() == 1


@pytest.mark.parametrize('invalid', ['duplicate', 'unknown', 'oversized', 'not_object'])
def test_management_strict_request_envelope(reader, wiki, invalid):
    if invalid == 'duplicate':
        response = reader.get('/tools/history/list/?path=From.md&path=Other.md')
    elif invalid == 'unknown':
        response = reader.get('/tools/history/list/', {'path': 'From.md', 'extra': 'yes'})
    elif invalid == 'oversized':
        response = reader.post('/tools/moves/preview/', {'source': 'a' * 20000, 'destination': 'To.md'}, content_type='application/json')
    else:
        response = reader.post('/tools/moves/preview/', '[]', content_type='application/json')
    assert response.status_code == (413 if invalid == 'oversized' else 400)
    assert response.json()['untrusted_content']


def test_restore_path_binding_prevents_relocation_between_preflight_and_restore(reader, wiki, monkeypatch):
    from wiki.models import SavedRevision
    from wiki.storage import read_note
    module = importlib.import_module('wiki.management_tools')
    row = revision()
    (wiki / 'From.md').write_text('current\n')
    (wiki / 'Other.md').write_text('current\n')
    real = module.restore_revision
    def relocated(*args, **kwargs):
        SavedRevision.objects.filter(pk=row.pk).update(path='Other.md')
        return real(*args, **kwargs)
    monkeypatch.setattr(module, 'restore_revision', relocated)
    response = invoke('restore_note_revision', {'path': 'From.md', 'revision_id': row.pk,
                                              'revision': read_note('From.md').revision})
    assert response.status_code == 412 and b'history_revision_changed' in response.content
    assert (wiki / 'From.md').read_text() == 'current\n' and (wiki / 'Other.md').read_text() == 'current\n'


def test_restore_writer_rechecks_history_path_under_write_lock(reader, wiki, monkeypatch):
    from wiki.contracts import StorageError
    from wiki.models import SavedRevision
    from wiki.storage import read_note
    module = importlib.import_module('wiki.revisions')
    row = revision()
    (wiki / 'From.md').write_text('current\n')
    (wiki / 'Other.md').write_text('current\n')
    real = module.issue_recovery
    def relocated(*args, **kwargs):
        token = real(*args, **kwargs)
        SavedRevision.objects.filter(pk=row.pk).update(path='Other.md')
        return token
    monkeypatch.setattr(module, 'issue_recovery', relocated)
    with pytest.raises(StorageError, match='history_revision_changed'):
        module.restore_revision(actor(), row.pk, read_note('From.md').revision)
    assert (wiki / 'From.md').read_text() == 'current\n' and (wiki / 'Other.md').read_text() == 'current\n'
    assert SavedRevision.objects.count() == 1


def test_restore_index_failure_still_returns_authoritative_source(reader, wiki, monkeypatch):
    from wiki.storage import read_note
    row = revision()
    (wiki / 'From.md').write_text('current\n')
    monkeypatch.setattr('wiki.saves.enqueue_note', lambda *a: (_ for _ in ()).throw(OSError('private')))
    response = invoke('restore_note_revision', {'path': 'From.md', 'revision_id': row.pk,
                                              'revision': read_note('From.md').revision})
    data = json.loads(response.content)
    assert response.status_code == 200 and data['state'] == 'saved_source_index_delayed'
    assert data['authoritative'] and data['source'] == 'old\n' and data['revision'] == response['ETag']


def test_lost_post_commit_status_read_is_uncertain_without_exposing_unverified_paths(reader, wiki, monkeypatch):
    from django.db import OperationalError
    from wiki.models import MoveOperation
    (wiki / 'From.md').write_text('original')
    review = json.loads(preview().content)
    real = MoveOperation.objects.get
    calls = 0
    def status_lost(*args, **kwargs):
        nonlocal calls
        calls += 1
        # Adapter preflight, domain lookup, then adapter status read.
        if calls == 3:
            raise OperationalError('private database path')
        return real(*args, **kwargs)
    monkeypatch.setattr(MoveOperation.objects, 'get', status_lost)
    response = commit(review)
    data = json.loads(response.content)
    assert response.status_code == 503 and data['state'] == 'uncertain' and data['inspect_before_retry']
    assert data['operation_id'] == review['operation_id'] and 'private' not in str(data)
    assert (wiki / 'To.md').exists() and not (wiki / 'From.md').exists()
