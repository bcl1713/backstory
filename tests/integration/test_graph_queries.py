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
