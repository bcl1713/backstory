"""Tool replacement saves exercise real session, formatting and storage services."""
import importlib
import json
import os

import pytest
from django.test import Client

from tests.integration.test_browsing import reader
from tests.integration.test_storage import wiki

pytestmark = pytest.mark.django_db(transaction=True)


def replace(reader, base, source='# Replacement\n', **extra):
    return reader.post('/tools/save/', data=json.dumps({
        'path': 'note.md', 'source': source, 'revision': base, **extra,
    }), content_type='application/json')


def initial(reader, wiki, raw=b'# Original\n'):
    (wiki / 'note.md').write_bytes(raw)
    return reader.get('/tools/read/', {'path': 'note.md'}).json()['revision']


def test_tool_save_formats_reads_back_and_attributes_backup(reader, wiki):
    from wiki.models import SavedRevision
    base = initial(reader, wiki, b'\xef\xbb\xbf# Original\r\n')
    response = replace(reader, base, '# Replacement\r\n\r\n**strong**   text\r\n')
    assert response.status_code == 200
    result = response.json()
    assert result['state'] == 'saved'
    assert result['source'] == '# Replacement\r\n\r\n**strong** text\r\n'
    assert result['diff'] and isinstance(result['diagnostics'], list)
    assert result['authoritative'] is True and result['untrusted_content'] is True
    assert result['bom'] is True and result['newline'] == '\r\n'
    assert result['href'] == '/notes/note.md' and result['path'] == 'note.md'
    assert result['revision'] == response['ETag'] != base
    assert 'state' in result['index']
    readback = reader.get('/tools/read/', {'path': 'note.md'}).json()
    assert (readback['source'], readback['revision']) == (result['source'], result['revision'])
    assert (wiki / 'note.md').read_bytes() == b'\xef\xbb\xbf' + result['source'].encode()
    backup = SavedRevision.objects.get()
    assert backup.actor.username == 'synthetic-reader'
    assert bytes(backup.original) == b'\xef\xbb\xbf# Original\r\n'
    assert bytes(backup.submitted) == b'# Replacement\r\n\r\n**strong**   text\r\n'
    assert response['Cache-Control'] == 'no-store'
    assert 'Access-Control-Allow-Origin' not in response


def test_tool_save_noop_does_not_publish_or_create_backup(reader, wiki):
    from wiki.models import SavedRevision
    base = initial(reader, wiki)
    before = (wiki / 'note.md').stat()
    result = replace(reader, base, '# Original\n').json()
    assert result['state'] == 'noop' and result['revision'] == base
    assert (wiki / 'note.md').stat().st_ino == before.st_ino
    assert (wiki / 'note.md').stat().st_mtime_ns == before.st_mtime_ns
    assert not SavedRevision.objects.exists()


@pytest.mark.parametrize('extra,status', [
    ({'revision': None}, 400), ({'revision': '*'}, 400),
    ({'revision': '"' + '0' * 64 + '"'}, 412),
    ({'mode': 'source_recovery'}, 400), ({'recovery_token': 'anything'}, 400),
    ({'source': 5}, 400), ({'source': '\ud800'}, 400),
    ({'path': '../outside.md'}, 404), ({'path': 'AGENTS.md'}, 404),
    ({'path': '.env'}, 404), ({'path': 'asset.png'}, 404),
    ({'path': 'secret.md'}, 404), ({'path': 'missing.md'}, 412),
])
def test_tool_save_rejects_invalid_input_and_never_creates(reader, wiki, extra, status):
    base = initial(reader, wiki)
    response = replace(reader, base, **extra)
    assert response.status_code == status
    assert (wiki / 'note.md').read_bytes() == b'# Original\n'
    assert not (wiki / 'missing.md').exists()


def test_tool_save_requires_revision_and_post_json(reader, wiki):
    initial(reader, wiki)
    assert reader.get('/tools/save/').status_code == 405
    missing = reader.post('/tools/save/', {'path': 'note.md', 'source': '# Draft\n'}, content_type='application/json')
    assert missing.status_code == 428
    for data, content_type in [('[]', 'application/json'), ('{', 'application/json'), ('{}', 'text/plain')]:
        assert reader.post('/tools/save/', data=data, content_type=content_type).status_code == 400
    assert (wiki / 'note.md').read_bytes() == b'# Original\n'


def test_tool_save_honors_csrf_and_session(reader, wiki):
    base = initial(reader, wiki)
    assert replace(Client(), base).status_code == 401
    strict = Client(enforce_csrf_checks=True)
    strict.cookies = reader.cookies
    response = replace(strict, base)
    assert response.status_code == 403
    assert response.json()['reason_code'] == 'csrf_failed'
    # The signed-in page provides a masked token; no cookie extraction is needed.
    import re
    page = strict.get('/notes/note.md')
    token = re.search(rb'name="csrfmiddlewaretoken" value="([^"]+)"', page.content)[1].decode()
    response = strict.post('/tools/save/', {'path': 'note.md', 'source': '# Replacement\n', 'revision': base},
                           content_type='application/json', HTTP_X_CSRFTOKEN=token)
    assert response.status_code == 200


@pytest.mark.parametrize('end_session', ['revoke', 'disable', 'expire'])
def test_tool_save_rejects_dead_sessions(reader, wiki, end_session):
    from accounts.models import SessionDevice
    from django.contrib.auth import get_user_model
    from django.utils import timezone
    from datetime import timedelta
    base = initial(reader, wiki)
    if end_session == 'disable':
        get_user_model().objects.filter(username='synthetic-reader').update(is_active=False)
    elif end_session == 'revoke':
        SessionDevice.objects.update(revoked_at=timezone.now())
    else:
        SessionDevice.objects.update(absolute_expires_at=timezone.now() - timedelta(seconds=1))
    assert replace(reader, base).status_code == 401
    assert (wiki / 'note.md').read_bytes() == b'# Original\n'


def test_tool_save_external_edit_and_format_failure_preserve_disk(reader, wiki):
    base = initial(reader, wiki)
    (wiki / 'note.md').write_bytes(b'# External\n')
    response = replace(reader, base)
    assert response.status_code == 412 and response.json()['state'] == 'conflict'
    base = reader.get('/tools/read/', {'path': 'note.md'}).json()['revision']
    failed = replace(reader, base, '---\nx: [\n---\n').json()
    assert failed['state'] == 'format_failed' and failed['diagnostics']
    assert 'recovery_token' not in failed
    assert (wiki / 'note.md').read_bytes() == b'# External\n'


@pytest.mark.parametrize('failure', ['marker', 'quota', 'size', 'symlink'])
def test_tool_save_preserves_storage_and_backup_guards(reader, wiki, settings, tmp_path, failure):
    base = initial(reader, wiki)
    if failure == 'marker':
        (wiki / '.backstory-marker').unlink()
    elif failure == 'quota':
        settings.BACKSTORY_REVISION_QUOTA_BYTES = 0
    elif failure == 'size':
        settings.BACKSTORY_NOTE_MAX_BYTES = 3
    else:
        (wiki / 'note.md').unlink()
        (tmp_path / 'outside.md').write_bytes(b'# Original\n')
        (wiki / 'note.md').symlink_to(tmp_path / 'outside.md')
    response = replace(reader, base)
    assert response.status_code == {'marker': 503, 'quota': 503, 'size': 413, 'symlink': 404}[failure]
    assert (wiki / 'note.md').read_bytes() == b'# Original\n'


def test_tool_save_lost_publish_ack_is_verified_without_replay(reader, wiki, monkeypatch):
    base = initial(reader, wiki)
    real_replace = os.replace
    def lost_ack(*args, **kwargs):
        real_replace(*args, **kwargs)
        raise OSError('synthetic lost acknowledgement')
    monkeypatch.setattr(os, 'replace', lost_ack)
    response = replace(reader, base)
    assert response.status_code == 200 and response.json()['state'] == 'saved'
    assert response.json()['authoritative'] is True
    assert 'durability_uncertain' in [d['code'] for d in response.json()['diagnostics']]
    assert (wiki / 'note.md').read_bytes() == b'# Replacement\n'


def test_tool_save_unreadable_after_publication_is_uncertain(reader, wiki, monkeypatch):
    base = initial(reader, wiki)
    def unavailable(*args):
        from wiki.contracts import StorageError
        raise StorageError('storage_io_error', 503)
    monkeypatch.setattr(importlib.import_module('wiki.tool_views'), 'read_note', unavailable)
    response = replace(reader, base)
    assert response.status_code == 503
    assert response.json()['state'] == 'uncertain'
    assert response.json()['read_before_retry'] is True
    assert response.json()['authoritative'] is False
    assert (wiki / 'note.md').read_bytes() == b'# Replacement\n'


def test_tool_save_index_failure_still_reports_saved(reader, wiki, monkeypatch):
    base = initial(reader, wiki)
    def unavailable(*args):
        raise OSError('synthetic unavailable index')
    monkeypatch.setattr(importlib.import_module('wiki.saves'), 'enqueue_note', unavailable)
    response = replace(reader, base)
    assert response.status_code == 200
    assert response.json()['state'] == 'saved_index_delayed'
    assert (wiki / 'note.md').read_bytes() == b'# Replacement\n'


def test_tool_save_external_change_before_readback_is_uncertain(reader, wiki, monkeypatch):
    base = initial(reader, wiki)
    from wiki.storage import read_note
    def external_change(path):
        (wiki / path).write_bytes(b'# External writer after tool save\n')
        return read_note(path)
    monkeypatch.setattr(importlib.import_module('wiki.tool_views'), 'read_note', external_change)
    response = replace(reader, base)
    assert response.status_code == 503
    assert response.json()['state'] == 'uncertain'
    assert response.json()['authoritative'] is False
    assert response.json()['read_before_retry'] is True
    assert (wiki / 'note.md').read_bytes() == b'# External writer after tool save\n'


def test_tool_save_unknown_publication_outcome_retains_read_before_retry(reader, wiki, monkeypatch):
    base = initial(reader, wiki)
    service = importlib.import_module('wiki.saves')
    real_replace, real_current = os.replace, service._current
    published = False
    def lost_ack(*args, **kwargs):
        nonlocal published
        real_replace(*args, **kwargs)
        published = True
        raise OSError('synthetic lost acknowledgement')
    def unavailable_after_publish(path):
        from wiki.contracts import StorageError
        if published:
            raise StorageError('storage_io_error', 503)
        return real_current(path)
    monkeypatch.setattr(os, 'replace', lost_ack)
    monkeypatch.setattr(service, '_current', unavailable_after_publish)
    response = replace(reader, base)
    assert response.status_code == 503
    assert response.json()['state'] == 'uncertain'
    assert response.json()['read_before_retry'] is True
    assert response.json()['revision'] is None
    assert (wiki / 'note.md').read_bytes() == b'# Replacement\n'
