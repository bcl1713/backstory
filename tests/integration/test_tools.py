"""Read-only tools use the same disposable storage and session boundary as the UI."""
import hashlib

import pytest

from tests.integration.test_storage import wiki
from tests.integration.test_browsing import reader
from tests.integration.test_indexing import drain

pytestmark = pytest.mark.django_db(transaction=True)


def test_tools_require_live_session_and_never_accept_writes(client, reader, wiki):
    from django.test import Client
    anonymous = Client()
    for route in ('search', 'read', 'list'):
        response = anonymous.get(f'/tools/{route}/')
        assert response.status_code == 401
        assert response.json()['reason_code'] == 'authentication_required'
        assert 'Location' not in response
        assert reader.post(f'/tools/{route}/', {}).status_code == 405
    reader.logout()
    assert reader.get('/tools/read/', {'path': 'note.md'}).status_code == 401


@pytest.mark.parametrize('end_session', ['revoke', 'disable', 'expire'])
def test_tools_honor_device_revocation_disabling_and_expiration(reader, wiki, end_session):
    from accounts.models import SessionDevice
    from django.contrib.auth import get_user_model
    from django.utils import timezone
    from datetime import timedelta
    (wiki / 'note.md').write_text('private synthetic note')
    if end_session == 'disable':
        get_user_model().objects.filter(username='synthetic-reader').update(is_active=False)
    elif end_session == 'revoke':
        SessionDevice.objects.update(revoked_at=timezone.now())
    else:
        SessionDevice.objects.update(absolute_expires_at=timezone.now() - timedelta(seconds=1))
    response = reader.get('/tools/read/', {'path': 'note.md'})
    assert response.status_code == 401
    assert response.json()['reason_code'] == 'authentication_required'
    assert b'private synthetic note' not in response.content


def test_read_returns_exact_authoritative_source_revision_and_canonical_url(reader, wiki):
    raw = b'\xef\xbb\xbf# Synthetic\r\n<script>untrusted</script>\r\n'
    (wiki / '100% #日本語.md').write_bytes(raw)
    response = reader.get('/tools/read/', {'path': '100% #日本語.md'})
    assert response.status_code == 200
    result = response.json()
    assert result['source'] == '# Synthetic\r\n<script>untrusted</script>\r\n'
    assert result['revision'] == '"' + hashlib.sha256(raw).hexdigest() + '"'
    assert result['path'] == '100% #日本語.md'
    assert result['href'] == '/notes/100%25%20%23%E6%97%A5%E6%9C%AC%E8%AA%9E.md'
    assert result['bom'] is True and result['newline'] == '\r\n'
    assert result['authoritative'] is True and result['untrusted_content'] is True
    assert response['ETag'] == result['revision']
    assert response['Cache-Control'] == 'no-store'
    assert 'Access-Control-Allow-Origin' not in response


@pytest.mark.parametrize('path', ['../outside.md', '.env', 'AGENTS.md', 'secret.md', 'file.pdf', 'linked.md'])
def test_read_denies_policy_non_notes_and_symlinks(reader, wiki, path, tmp_path):
    (tmp_path / 'outside.md').write_text('must stay outside')
    (wiki / 'linked.md').symlink_to(tmp_path / 'outside.md')
    response = reader.get('/tools/read/', {'path': path})
    assert response.status_code == 404
    assert 'must stay outside' not in response.content.decode()


@pytest.mark.parametrize('encoded', ['%FF.md', '%ZZ.md', '%2e%2e/outside.md'])
def test_read_rejects_malformed_or_traversing_query_encoding(reader, wiki, encoded):
    assert reader.get('/tools/read/?path=' + encoded).status_code == 404


def test_list_is_bounded_nonrecursive_filters_attachments_and_pages(reader, wiki):
    (wiki / 'Nested').mkdir()
    (wiki / 'Nested/deep.md').write_text('never recursively returned')
    (wiki / 'visible.md').write_text('visible')
    (wiki / 'image.png').write_bytes(b'synthetic image')
    (wiki / 'AGENTS.md').write_text('not content')
    found = []
    cursor = None
    for _ in range(10):
        params = {'limit': 1, 'folder': ''}
        if cursor:
            params['cursor'] = cursor
        response = reader.get('/tools/list/', params)
        assert response.status_code == 200
        result = response.json()
        assert len(result['entries']) <= 1
        found.extend(result['entries'])
        cursor = result['next_cursor']
        if cursor is None:
            break
    assert {row['path'] for row in found} == {'Nested', 'visible.md'}
    assert next(row for row in found if row['path'] == 'Nested')['href'] == '/?folder=Nested'
    assert reader.get('/tools/list/', {'cursor': 'expired'}).json()['restart'] is True
    for limit in ('0', '101', 'bad'):
        assert reader.get('/tools/list/', {'limit': limit}).status_code == 400
    assert reader.get('/tools/list/?folder=%FF').status_code == 404


def test_search_distinguishes_no_matches_partial_stale_and_unavailable(reader, wiki):
    from indexing import worker
    (wiki / 'note.md').write_text('# Synthetic\nneedle\n')
    worker.run_batch()
    response = reader.get('/tools/search/', {'query': 'absent'})
    assert response.json()['state'] == 'incomplete'
    assert response.json()['freshness']['state'] == 'partial'
    drain(worker)
    result = reader.get('/tools/search/', {'query': 'absent'}).json()
    assert result['state'] == 'no_matches' and result['items'] == []
    (wiki / 'note.md').write_text('# Changed outside Backstory\nlonger current body\n')
    result = reader.get('/tools/search/', {'query': 'needle'}).json()
    assert result['state'] == 'matches' and result['freshness']['state'] == 'stale'
    assert result['authoritative'] is False
    assert result['items'][0]['href'] == '/notes/note.md'
    (wiki / '.backstory-marker').unlink()
    response = reader.get('/tools/search/', {'query': 'needle'})
    assert response.status_code == 503
    assert response.json()['state'] == 'unavailable'
    assert 'needle' not in response.content.decode()


def test_search_limits_signed_cursor_and_read_after_external_edit(reader, wiki):
    from indexing import worker
    for n in range(3):
        (wiki / f'n{n}.md').write_text('# Synthetic\ncommon\n')
    drain(worker)
    first = reader.get('/tools/search/', {'query': 'common', 'limit': 1}).json()
    assert len(first['items']) == 1 and first['next_cursor']
    second = reader.get('/tools/search/', {'query': 'common', 'limit': 1, 'cursor': first['next_cursor']}).json()
    assert first['items'][0]['path'] != second['items'][0]['path']
    expired = reader.get('/tools/search/', {'query': 'other', 'cursor': first['next_cursor']})
    assert expired.status_code == 409 and expired.json()['restart'] is True
    path = first['items'][0]['path']
    (wiki / path).write_text('# Current source\nexternal edit\n')
    current = reader.get('/tools/read/', {'path': path}).json()
    assert current['source'] == '# Current source\nexternal edit\n'
    assert current['revision'] != first['items'][0]['revision']
    for query in ('x' * 257, ' '.join(['x'] * 17)):
        assert reader.get('/tools/search/', {'query': query}).status_code == 400
    assert reader.get('/tools/search/', {'cursor': 'x' * 4097}).status_code == 400
