"""Bounded diagnostic discovery never needs wiki bodies or a second parser."""
import importlib

import pytest
from django.db import connection
from django.test import Client
from django.test.utils import CaptureQueriesContext
from tests.integration.test_browsing import reader
from tests.integration.test_storage import wiki
from tests.integration.test_graph_index import build_graph

pytestmark = pytest.mark.django_db(transaction=True)


def query(**kwargs):
    return importlib.import_module('indexing.graph_diagnostics').query_diagnostics(scope='synthetic-scope', **kwargs)


def test_diagnostics_identifies_parse_source_without_source_reads(wiki, monkeypatch):
    build_graph(wiki, {'bad.md': '---\nx: [\n---\n# Private body\n', 'good.md': '# Good'})
    from wiki import storage, metadata
    monkeypatch.setattr(storage, 'read_note', lambda *a: pytest.fail('diagnostic request read body'))
    monkeypatch.setattr(metadata, 'project_note', lambda *a: pytest.fail('diagnostic request reparsed body'))
    with CaptureQueriesContext(connection) as statements:
        data = query()
    assert data['state'] == 'incomplete' and not data['projection_complete']
    assert data['enumeration_complete'] and not data['next_cursor']
    assert [i['path'] for i in data['items']] == ['bad.md']
    assert data['items'][0]['diagnostic_codes'] == ['metadata_parse_error']
    assert data['items'][0]['parsing_complete'] is False
    assert data['items'][0]['source_revision'].startswith('"')
    assert 'Private body' not in str(data)
    assert not any('"body"' in q['sql'] for q in statements)
    assert all('"projection"' not in q['sql'] or 'JSON_EXTRACT' in q['sql'] for q in statements)


def test_diagnostic_pages_bind_scope_filters_limits_and_publication(wiki):
    build_graph(wiki, {f'folder/bad-{i}.md': '---\nx: [\n---\nBody' for i in range(3)})
    first = query(folder='folder', limit=1)
    second = query(folder='folder', limit=1, cursor=first['next_cursor'])
    assert first['next_cursor'] and not first['enumeration_complete']
    assert first['items'][0]['path'] != second['items'][0]['path']
    from wiki.contracts import StorageError
    for args in [{'scope': 'another'}, {'folder': ''}, {'limit': 2}]:
        with pytest.raises(StorageError, match='graph_cursor_expired'):
            importlib.import_module('indexing.graph_diagnostics').query_diagnostics(
                **({'scope': 'synthetic-scope', 'folder': 'folder', 'limit': 1, 'cursor': first['next_cursor']} | args))
    from indexing.models import RelationState
    from django.db.models import F
    RelationState.objects.update(publication=F('publication') + 1)
    with pytest.raises(StorageError, match='graph_cursor_expired'):
        query(folder='folder', limit=1, cursor=first['next_cursor'])


@pytest.mark.parametrize('change', ['excluded', 'symlink', 'changed', 'missing'])
def test_diagnostics_withholds_ineligible_source(wiki, settings, change):
    build_graph(wiki, {'private.md': '---\nx: [\n---\nBody'})
    if change == 'excluded':
        settings.BACKSTORY_EXCLUSIONS = ['private.md']
    elif change == 'symlink':
        (wiki / 'private.md').unlink()
        (wiki / 'private.md').symlink_to(wiki / 'outside.md')
    elif change == 'changed':
        (wiki / 'private.md').write_text('# Now corrected')
    else:
        (wiki / 'private.md').unlink()
    data = query()
    assert not data['items'] and not data['enumeration_complete']
    assert 'private.md' not in str(data)


def test_diagnostics_unknown_stored_codes_are_redacted_and_pending_is_separate(wiki):
    build_graph(wiki, {'bad.md': '---\nx: [\n---\nBody'})
    from indexing.models import IndexedNote
    IndexedNote.objects.update(projection={'metadata': {'private': 'secret'}, 'diagnostics': ['private_source_text']}, relations_dirty=True)
    data = query()
    item = data['items'][0]
    assert item['pending'] and item['diagnostic_codes'] == ['index_diagnostic_unknown']
    assert not item['resolution_complete']
    assert 'private_source_text' not in str(data) and 'secret' not in str(data)


def test_diagnostics_http_auth_schema_and_no_store(reader, wiki):
    build_graph(wiki, {'bad.md': '---\nx: [\n---\nBody'})
    assert Client().get('/tools/index-diagnostics/').status_code == 401
    assert reader.post('/tools/index-diagnostics/').status_code == 405
    for args in [{'limit': 101}, {'limit': '1.5'}, {'folder': '../'}, {'other': 1}, {'folder': ['a', 'b']}]:
        assert reader.get('/tools/index-diagnostics/', args).status_code in {400, 404}
    response = reader.get('/tools/index-diagnostics/')
    assert response.status_code == 200 and response['Cache-Control'] == 'no-store'
    assert response.json()['untrusted_content'] and not response.json()['authoritative']
    (wiki / '.backstory-marker').unlink()
    unavailable = reader.get('/tools/index-diagnostics/')
    assert unavailable.status_code == 503 and not unavailable.json().get('items')
