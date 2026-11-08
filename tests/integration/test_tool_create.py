"""Explicit tool creation uses the existing guarded writer on synthetic roots."""
import importlib
import json
import os
from concurrent.futures import ThreadPoolExecutor

import pytest
from django.test import Client
from tests.integration.test_browsing import reader
from tests.integration.test_storage import wiki

pytestmark = pytest.mark.django_db(transaction=True)


def create(client, path='new.md', source='# New\n', **extra):
    return client.post('/tools/create-note/', json.dumps({'path': path, 'source': source, **extra}),
                       content_type='application/json')


def test_create_formats_metadata_readback_then_revision_save(reader, wiki, settings, monkeypatch):
    settings.BACKSTORY_WIKI_TIMEZONE = 'America/Chicago'
    # The save service imports the date provider directly.
    monkeypatch.setattr(importlib.import_module('wiki.saves'), 'wiki_date', lambda: '2026-11-08')
    (wiki / 'folder').mkdir()
    response = create(reader, 'folder/new.md', '# New\n\n**bold**   words\n')
    assert response.status_code == 201
    data = response.json()
    assert data['state'] == 'created' and data['authoritative'] and data['untrusted_content']
    assert data['path'] == 'folder/new.md' and data['href'] == '/notes/folder/new.md'
    assert data['revision'] == response['ETag']
    assert 'created: 2026-11-08' in data['source'] and '**bold** words' in data['source']
    assert 'recovery_token' not in data and 'state' in data['index']
    observed = reader.get('/tools/read/', {'path': data['path']}).json()
    assert (observed['source'], observed['revision']) == (data['source'], data['revision'])
    saved = reader.post('/tools/save/', {'path': data['path'], 'source': data['source'] + '\nLater\n',
                                       'revision': data['revision']}, content_type='application/json')
    assert saved.status_code == 200 and saved.json()['revision'] != data['revision']
    assert response['Cache-Control'] == 'no-store'


@pytest.mark.parametrize('extra', [{'revision': None}, {'revision': '*'}, {'mode': 'source_recovery'},
                                  {'source': 3}, {'source': '\ud800'}, {'other': True}])
def test_create_rejects_malformed_inputs(reader, wiki, extra):
    assert create(reader, **extra).status_code == 400
    assert not (wiki / 'new.md').exists()


def test_create_requires_post_json_and_complete_source(reader, wiki):
    assert reader.get('/tools/create-note/').status_code == 405
    for raw, mime in [('[]', 'application/json'), ('{', 'application/json'), ('{}', 'text/plain'),
                      ('{"path":"new.md"}', 'application/json')]:
        assert reader.post('/tools/create-note/', raw, content_type=mime).status_code == 400
    assert not (wiki / 'new.md').exists()


@pytest.mark.parametrize('path', ['../outside.md', 'AGENTS.md', '.env', 'asset.png', 'missing/new.md', 'link/new.md'])
def test_create_path_policy_and_existing_parent(reader, wiki, tmp_path, path):
    (wiki / 'link').symlink_to(tmp_path, target_is_directory=True)
    assert create(reader, path).status_code == 404
    assert not (tmp_path / 'new.md').exists() and not (wiki / 'missing').exists()


def test_create_existing_and_symlink_targets_are_preserved(reader, wiki, tmp_path):
    (wiki / 'new.md').write_text('# Existing\n')
    assert create(reader).status_code == 412
    assert (wiki / 'new.md').read_text() == '# Existing\n'
    (wiki / 'new.md').unlink()
    (tmp_path / 'external.md').write_text('# External\n')
    (wiki / 'new.md').symlink_to(tmp_path / 'external.md')
    assert create(reader).status_code == 404
    assert (tmp_path / 'external.md').read_text() == '# External\n'


def test_create_publication_collision_never_claims_competing_bytes(reader, wiki, monkeypatch):
    real_link = os.link
    def competing(*args, **kwargs):
        (wiki / 'new.md').write_bytes((wiki / args[0]).read_bytes())
        return real_link(*args, **kwargs)
    monkeypatch.setattr(os, 'link', competing)
    response = create(reader)
    assert response.status_code == 412 and response.json()['state'] == 'conflict'
    assert (wiki / 'new.md').exists()


def test_create_target_appearing_during_format_is_preserved(reader, wiki, monkeypatch):
    service = importlib.import_module('wiki.saves')
    original = service.format_source
    def competing(*args):
        result = original(*args)
        (wiki / 'new.md').write_text('# Competitor\n')
        return result
    monkeypatch.setattr(service, 'format_source', competing)
    assert create(reader).status_code == 412
    assert (wiki / 'new.md').read_text() == '# Competitor\n'


def test_two_concurrent_creates_have_one_winner(reader, wiki):
    # Separate real HTTP clients/DB connections; the cooperative writer lock is real.
    clients = [Client(), Client()]
    for client in clients:
        client.cookies = reader.cookies.copy()
    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(lambda pair: create(pair[0], source=pair[1]),
                                zip(clients, ['# First\n', '# Second\n'])))
    assert sorted(r.status_code for r in results) == [201, 412]
    winner = next(r.json() for r in results if r.status_code == 201)
    assert (wiki / 'new.md').read_text() == winner['source']


@pytest.mark.parametrize('failure', ['marker', 'size', 'readonly', 'recovery', 'formatter'])
def test_create_storage_format_and_recovery_guards(reader, wiki, settings, monkeypatch, failure):
    if failure == 'marker':
        (wiki / '.backstory-marker').unlink()
    elif failure == 'size':
        settings.BACKSTORY_NOTE_MAX_BYTES = 3
    elif failure == 'readonly':
        original = os.open
        def deny(path, flags, *args, **kwargs):
            if str(path).startswith('.backstory-tmp-'):
                raise PermissionError(13, 'synthetic read only')
            return original(path, flags, *args, **kwargs)
        monkeypatch.setattr(os, 'open', deny)
    elif failure == 'recovery':
        from django.contrib.auth import get_user_model
        from wiki.models import MoveOperation
        MoveOperation.objects.create(actor=get_user_model().objects.get(username='synthetic-reader'),
                                     source='a.md', destination='b.md', state='recovery_required', plan={})
    response = create(reader, source='---\nx: [\n---\n' if failure == 'formatter' else '# New\n')
    assert response.status_code == {'marker': 503, 'size': 413, 'readonly': 503, 'recovery': 409, 'formatter': 422}[failure]
    if failure == 'formatter':
        assert response.json()['state'] == 'format_failed' and 'recovery_token' not in response.json()
    assert not (wiki / 'new.md').exists()


@pytest.mark.parametrize('session', ['anonymous', 'revoke', 'disable', 'expire', 'csrf'])
def test_create_requires_current_session_and_csrf(reader, wiki, session):
    from accounts.models import SessionDevice
    from django.contrib.auth import get_user_model
    from django.utils import timezone
    from datetime import timedelta
    client = reader
    if session == 'anonymous':
        client = Client()
    elif session == 'csrf':
        client = Client(enforce_csrf_checks=True)
        client.cookies = reader.cookies
    elif session == 'disable':
        get_user_model().objects.filter(username='synthetic-reader').update(is_active=False)
    elif session == 'revoke':
        SessionDevice.objects.update(revoked_at=timezone.now())
    else:
        SessionDevice.objects.update(absolute_expires_at=timezone.now() - timedelta(seconds=1))
    assert create(client).status_code == (403 if session == 'csrf' else 401)
    assert not (wiki / 'new.md').exists()


def test_create_index_failure_is_published_not_retry_signal(reader, wiki, monkeypatch):
    def fail(*args):
        raise OSError('synthetic index failure')
    monkeypatch.setattr(importlib.import_module('wiki.saves'), 'enqueue_note', fail)
    response = create(reader)
    assert response.status_code == 201 and response.json()['state'] == 'created_index_delayed'
    assert response.json()['authoritative'] and (wiki / 'new.md').exists()


def test_create_unconfirmed_readback_reports_uncertain(reader, wiki, monkeypatch):
    from wiki.contracts import StorageError
    def unavailable(*args):
        raise StorageError('storage_io_error', 503)
    monkeypatch.setattr(importlib.import_module('wiki.tool_views'), 'read_note', unavailable)
    response = create(reader)
    assert response.status_code == 503
    assert response.json()['state'] == 'uncertain' and response.json()['read_before_retry']
    assert not response.json()['authoritative'] and (wiki / 'new.md').exists()
