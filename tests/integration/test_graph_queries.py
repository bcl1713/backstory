import json
from dataclasses import asdict
import pytest
from tests.integration.test_storage import wiki
from tests.integration.test_graph_index import build_graph
from wiki.contracts import StorageError

pytestmark = pytest.mark.django_db(transaction=True)


def test_shared_graph_aggregates_directions_and_preserves_occurrences(wiki, monkeypatch):
    graph = build_graph(wiki, {'a.md': '# A\n[[b#Part]] [[b]] [[#Heading]] ![asset](photo.png) [remote](https://example.invalid)',
                               'b.md': '# B\n[[a]]', 'photo.png': 'inert'})
    from wiki import storage, metadata
    monkeypatch.setattr(storage, 'read_note', lambda *a: pytest.fail('graph read source bodies'))
    monkeypatch.setattr(metadata, 'project_note', lambda *a: pytest.fail('request reparsed notes'))
    page = graph.query_graph('a.md')
    assert {node.path for node in page.nodes} == {'a.md', 'b.md'}
    assert {(e.source, e.destination, e.occurrence_count) for e in page.edges} == {('a.md', 'b.md', 2), ('b.md', 'a.md', 1)}
    links = graph.query_links('a.md', 'outgoing')
    assert len(links.items) == 5
    assert links.items[0].source_revision.startswith('"')
    assert all(item.position_precision == 'advisory' for item in links.items)
    assert {'self', 'asset', 'external', 'note'} <= {item.resource_type for item in links.items}
    assert page.authoritative is False and page.untrusted_content is True
    assert page.projection_complete and len(json.dumps(asdict(page)).encode()) <= 512 * 1024


def test_paging_binds_query_policy_generation_and_mutation(wiki):
    graph = build_graph(wiki, {'a.md': '[[b]] [[b#Part]] [[c]]', 'b.md': '# B', 'c.md': '# C'})
    first = graph.query_links('a.md', 'outgoing', limit=1)
    assert first.next_cursor
    second = graph.query_links('a.md', 'outgoing', cursor=first.next_cursor, limit=1)
    assert first.items[0].occurrence_id != second.items[0].occurrence_id
    with pytest.raises(StorageError, match='graph_cursor_expired'):
        graph.query_links('a.md', 'incoming', cursor=first.next_cursor, limit=1)
    from indexing import worker
    from indexing.queue import enqueue_note
    from wiki.storage import read_note
    (wiki / 'b.md').write_text('# B changed')
    enqueue_note('b.md', read_note('b.md').revision)
    worker.run_batch()
    with pytest.raises(StorageError, match='graph_cursor_expired'):
        graph.query_links('a.md', 'outgoing', cursor=first.next_cursor, limit=1)


def test_stale_denied_deleted_and_symlink_nodes_do_not_leak_edges(wiki, settings):
    graph = build_graph(wiki, {'a.md': '[[b]]', 'b.md': '# Private title'})
    (wiki / 'b.md').unlink()
    page = graph.query_graph('a.md')
    assert not page.edges and not page.projection_complete
    assert 'Private title' not in str(page)
    (wiki / 'b.md').symlink_to(wiki / 'a.md')
    assert not graph.query_graph('a.md').edges
    settings.BACKSTORY_EXCLUSIONS = ['b.md']
    assert 'b.md' not in str(graph.query_graph('a.md'))


def test_local_depth_filters_boundary_and_global_caps(wiki):
    graph = build_graph(wiki, {'a.md': '[[folder/b]]', 'folder/b.md': '---\ntags: [topic]\n---\n[[c]]', 'c.md': '# C'})
    assert {n.path for n in graph.query_graph('a.md').nodes} == {'a.md', 'folder/b.md'}
    assert {n.path for n in graph.query_graph('a.md', depth=2).nodes} == {'a.md', 'folder/b.md', 'c.md'}
    filtered = graph.query_graph(folder='folder', tag='topic')
    assert [n.path for n in filtered.nodes] == ['folder/b.md']
    assert filtered.boundary_connections is True
    bounded = graph.query_graph(node_limit=1)
    assert len(bounded.nodes) == 1 and bounded.next_cursor and bounded.limiting_reasons
    assert [n.path for n in graph.query_graph(node_limit=1, cursor=bounded.next_cursor).nodes] != [n.path for n in bounded.nodes]
    for kwargs in [{'depth': 3}, {'node_limit': 201}, {'edge_limit': 501}, {'query': 'x' * 257}]:
        with pytest.raises(StorageError):
            graph.query_graph(**kwargs)


def test_unavailable_storage_withholds_all_content(wiki):
    graph = build_graph(wiki, {'a.md': '[[b]]', 'b.md': '# B'})
    (wiki / '.backstory-marker').unlink()
    page = graph.query_graph('a.md')
    assert page.state == 'unavailable' and not page.nodes and not page.edges


def test_graph_pages_include_cross_page_edge_endpoints_and_local_center(wiki):
    graph = build_graph(wiki, {'z.md': '[[a]] [[b]]', 'a.md': '[[b]]', 'b.md': '# B'})
    cursor = None
    observed = set()
    for _ in range(12):
        page = graph.query_graph(node_limit=2, cursor=cursor)
        paths = {node.path for node in page.nodes}
        for edge in page.edges:
            assert {edge.source, edge.destination} <= paths
            observed.add((edge.source, edge.destination))
        cursor = page.next_cursor
        if not cursor:
            break
    assert observed == {('z.md', 'a.md'), ('z.md', 'b.md'), ('a.md', 'b.md')}
    local = graph.query_graph('z.md', node_limit=1)
    assert [node.path for node in local.nodes] == ['z.md']
    assert 'node_limit' in local.limiting_reasons


def test_known_unindexed_target_withholds_complete_absence(wiki, settings):
    graph = build_graph(wiki, {'a.md': '[[b]]'})
    (wiki / 'b.md').write_text('# New external target')
    settings.BACKSTORY_EXCLUSIONS = ['unrelated.md']
    from indexing import worker
    from tests.integration.test_indexing import drain
    drain(worker)
    page = graph.query_links('a.md', 'outgoing')
    assert not page.projection_complete


def test_assets_and_isolation_recheck_all_incident_eligibility(wiki):
    graph = build_graph(wiki, {'private/a.md': '[[public/b]] [asset](../images/photo.png)',
                               'public/b.md': '# B', 'images/photo.png': 'inert'})
    (wiki / 'images/photo.png').unlink()
    page = graph.query_links('private/a.md', 'outgoing')
    assert not page.projection_complete
    assert not any(item.resource_type == 'asset' and item.state == 'resolved' for item in page.items)
    (wiki / 'private/a.md').unlink()
    isolated = graph.query_link_issues(folder='public', issue='isolated')
    assert not isolated.projection_complete and not isolated.items


def test_graph_cursor_stays_bounded_for_long_valid_paths(wiki):
    import hashlib
    folder = '/'.join(hashlib.sha256(str(i).encode()).hexdigest() * 3 for i in range(19))
    path = folder + '/long.md'
    graph = build_graph(wiki, {path: '[[short]]', 'short.md': '# Short'})
    page = graph.query_graph(node_limit=1)
    assert page.next_cursor and len(page.next_cursor) <= 4096
    graph.query_graph(node_limit=1, cursor=page.next_cursor)


def test_request_occurrence_select_excludes_unused_note_metadata(wiki, django_assert_num_queries):
    graph = build_graph(wiki, {'a.md': '[[missing]]', 'b.md': '# B'})
    from django.test.utils import CaptureQueriesContext
    from django.db import connection
    with CaptureQueriesContext(connection) as captured:
        graph.query_link_issues()
    occurrence_queries = [query['sql'] for query in captured if 'INNER JOIN "indexing_linkedge"' in query['sql'] and 'target_text' in query['sql']]
    assert occurrence_queries
    assert all('"indexing_indexednote"."body"' not in query and '"indexing_indexednote"."projection"' not in query for query in occurrence_queries)
