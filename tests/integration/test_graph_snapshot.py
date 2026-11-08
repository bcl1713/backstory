"""Full authorized saved-index snapshots; synthetic filesystem and users only."""
import pytest
from django.db import connection
from django.test import Client
from django.test.utils import CaptureQueriesContext
from tests.integration.test_storage import wiki
from tests.integration.test_browsing import reader
from tests.integration.test_graph_index import build_graph
from tests.integration.test_indexing import drain

pytestmark = pytest.mark.django_db(transaction=True)


def snapshot(**kwargs):
    from indexing.graph_snapshot import query_snapshot
    return query_snapshot(scope='synthetic-session', **kwargs)


def paths(data):
    return {node['path'] for node in data['nodes']}


def pairs(data):
    return {(edge['source'], edge['destination'], edge['occurrence_count']) for edge in data['edges']}


def test_bulk_membership_exceeds_legacy_limits_preserves_counts_isolates_and_no_bodies(wiki, monkeypatch):
    # JSON escaping these full metadata titles also exceeds the legacy 512KiB
    # payload cap; a bulk response must carry the complete membership.
    files = {f'n{i:03}.md': '# ' + '界' * 512 for i in range(310)}
    files['root.md'] = '\n'.join(f'[[n{i:03}]] [[n{i:03}#Part]]' for i in range(310))
    files['isolate.md'] = '# Alone'
    build_graph(wiki, files)
    from wiki import storage, metadata
    monkeypatch.setattr(storage, 'read_note', lambda *a: pytest.fail('snapshot read a body'))
    monkeypatch.setattr(metadata, 'project_note', lambda *a: pytest.fail('snapshot parsed a body'))
    with CaptureQueriesContext(connection) as queries:
        data = snapshot()
    import json
    assert len(json.dumps(data, ensure_ascii=True).encode()) > 512 * 1024
    assert len(data['nodes']) == 312 and len(data['edges']) == 310
    assert len({(e['source'], e['destination']) for e in data['edges']}) == 310
    assert all(e['occurrence_count'] == 2 and e['occurrence_id'] and e['position'] for e in data['edges'])
    assert data['projection_complete'] and data['next_cursor'] is None
    assert data['schema_version'] == 1 and data['scope'] and data['snapshot_id']
    assert not any('"body"' in q['sql'] or '"projection"' in q['sql'] for q in queries)
    again = snapshot()
    assert again['snapshot_id'] == data['snapshot_id']


def test_partial_dirty_projection_and_changed_endpoints_never_leak_stale_edges(wiki):
    build_graph(wiki, {'a.md': '[[b]] [[b]]', 'b.md': '# B', 'safe.md': '[[target]]', 'target.md': '# Target'})
    first = snapshot()
    (wiki / 'a.md').write_text('# External replacement')
    current = snapshot()
    assert 'a.md' not in paths(current)
    assert pairs(current) == {('safe.md', 'target.md', 1)}
    assert not current['projection_complete'] and current['state'] == 'incomplete'
    assert current['snapshot_id'] != first['snapshot_id']
    from indexing.models import IndexedNote, RelationState
    IndexedNote.objects.filter(path='safe.md').update(relations_dirty=True)
    RelationState.objects.update(complete=False)
    dirty = snapshot()
    assert not dirty['edges'] and not dirty['projection_complete']
    assert 'projection_incomplete' in dirty['limiting_reasons']


def test_external_edit_alias_resolution_rename_and_delete_reconcile_via_maintained_index(wiki):
    build_graph(wiki, {'source.md': '[[Friendly]]', 'old.md': '---\naliases: [Friendly]\n---\n# Old'})
    from indexing import worker
    from indexing.queue import invalidate_path
    first = snapshot()
    assert pairs(first) == {('source.md', 'old.md', 1)}
    (wiki / 'old.md').rename(wiki / 'new.md')
    invalidate_path('old.md', now=0)
    invalidate_path('new.md', now=0)
    drain(worker)
    renamed = snapshot()
    assert pairs(renamed) == {('source.md', 'new.md', 1)}
    assert paths(renamed) == {'source.md', 'new.md'} and renamed['snapshot_id'] != first['snapshot_id']
    (wiki / 'source.md').write_text('# Edited outside Backstory')
    invalidate_path('source.md', now=0)
    drain(worker)
    assert not snapshot()['edges']
    (wiki / 'new.md').unlink()
    invalidate_path('new.md', now=0)
    drain(worker)
    assert paths(snapshot()) == {'source.md'}


def test_scope_revokes_for_policy_storage_and_session_changes(reader, wiki, settings, tmp_path):
    build_graph(wiki, {'a.md': '[[b]]', 'b.md': '# Private B'})
    first = reader.get('/tools/graph/snapshot/').json()
    second_client = Client()
    from django.contrib.auth import get_user_model
    second_client.force_login(get_user_model().objects.get(username='synthetic-reader'))
    second = second_client.get('/tools/graph/snapshot/').json()
    assert second['scope'] != first['scope']
    settings.BACKSTORY_EXCLUSIONS = ['b.md']
    denied = reader.get('/tools/graph/snapshot/').json()
    assert denied['scope'] != first['scope'] and 'b.md' not in paths(denied)
    assert not denied['edges'] and 'Private B' not in str(denied)
    replacement = tmp_path / 'replacement'
    replacement.mkdir()
    (replacement / '.backstory-marker').touch()
    settings.BACKSTORY_WIKI_ROOT = replacement
    swapped = reader.get('/tools/graph/snapshot/').json()
    assert swapped['scope'] != denied['scope'] and not swapped['nodes'] and not swapped['edges']
    (replacement / '.backstory-marker').unlink()
    unavailable = reader.get('/tools/graph/snapshot/')
    assert unavailable.status_code == 503
    assert not unavailable.json().get('nodes') and not unavailable.json().get('edges')
    reader.logout()
    revoked = reader.get('/tools/graph/snapshot/')
    assert revoked.status_code == 401 and 'nodes' not in revoked.json() and 'edges' not in revoked.json()



def test_snapshot_limits_never_disclose_excluded_note_counts(wiki, settings):
    build_graph(wiki, {'public.md': '# Public', 'private/a.md': '# Hidden A',
                       'private/b.md': '# Hidden B'})
    settings.BACKSTORY_EXCLUSIONS = ['private']
    data = snapshot()
    assert paths(data) == {'public.md'}
    assert data['limits'] == {'nodes': None, 'edges': None,
                              'examined_candidates': None, 'payload_bytes': None}


def test_snapshot_filters_keep_isolates_and_honest_boundary(wiki):
    build_graph(wiki, {'a.md': '[[folder/b]]', 'folder/b.md': '---\ntags: [topic]\n---\n# Beta',
                       'folder/isolate.md': '---\ntags: [topic]\n---\n# Isolate'})
    filtered = snapshot(folder='folder', tag='topic')
    assert paths(filtered) == {'folder/b.md', 'folder/isolate.md'}
    assert not filtered['edges'] and filtered['boundary_connections']
    assert paths(snapshot(query='Beta')) == {'folder/b.md'}


def test_snapshot_http_strict_auth_method_schema_and_no_store(reader, wiki):
    build_graph(wiki, {'a.md': '# A'})
    assert Client().get('/tools/graph/snapshot/').status_code == 401
    assert reader.post('/tools/graph/snapshot/').status_code == 405
    for params in [{'path': 'a.md'}, {'cursor': 'x'}, {'node_limit': '10'}, {'tag': ['x', 'y']}, {'query': 'x' * 257}]:
        assert reader.get('/tools/graph/snapshot/', params).status_code == 400
    response = reader.get('/tools/graph/snapshot/')
    assert response.status_code == 200 and response['Cache-Control'] == 'no-store'
    assert response.json()['authoritative'] is False and response.json()['untrusted_content'] is True


@pytest.mark.parametrize('change', ['mutation', 'publication', 'namespace'])
def test_concurrent_stamps_reject_entire_snapshot(reader, wiki, monkeypatch, settings, change):
    build_graph(wiki, {'a.md': '[[b]]', 'b.md': '# B'})
    from indexing import graph_snapshot
    from indexing.models import IndexGeneration, RelationState
    from django.db.models import F
    original = graph_snapshot.file_stat
    changed = False
    def concurrent(path):
        nonlocal changed
        result = original(path)
        if not changed:
            changed = True
            if change == 'mutation':
                IndexGeneration.objects.update(mutation=F('mutation') + 1)
            elif change == 'publication':
                RelationState.objects.update(publication=F('publication') + 1)
            else:
                settings.BACKSTORY_EXCLUSIONS = ['b.md']
        return result
    monkeypatch.setattr(graph_snapshot, 'file_stat', concurrent)
    response = reader.get('/tools/graph/snapshot/')
    assert response.status_code == 409 and response.json()['restart']
    assert 'nodes' not in response.json() and 'edges' not in response.json()
