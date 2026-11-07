"""Synthetic local graph continuations, with production query budgets enabled."""
from dataclasses import asdict
import json

import pytest

from tests.integration.test_storage import wiki
from tests.integration.test_graph_index import build_graph
from wiki.contracts import StorageError

pytestmark = pytest.mark.django_db(transaction=True)


def collect(graph, path, **kwargs):
    cursor = None
    nodes, edges, pages = set(), {}, []
    for _ in range(2000):
        page = graph.query_graph(path, cursor=cursor, **kwargs)
        paths = {node.path for node in page.nodes}
        assert page.limits['examined'] <= 300
        assert len(page.nodes) <= kwargs.get('node_limit', 200)
        assert len(page.edges) <= kwargs.get('edge_limit', 500)
        assert len(json.dumps(asdict(page)).encode()) <= 512 * 1024
        for edge in page.edges:
            assert {edge.source, edge.destination} <= paths
            edges[edge.source, edge.destination] = edge.occurrence_count
        nodes.update(paths)
        pages.append(page)
        cursor = page.next_cursor
        if cursor is None:
            return nodes, edges, pages
        assert len(cursor) <= 4096
    pytest.fail('local graph continuation did not terminate')


@pytest.mark.parametrize('bounds', [{}, {'node_limit': 4, 'edge_limit': 2}])
@pytest.mark.parametrize('depth', [1, 2])
def test_high_degree_intermediate_resumes_all_members_and_induced_edges(wiki, bounds, depth):
    files = {f'leaf{i:03}.md': '# Leaf' for i in range(620)}
    files.update({'root.md': '[[bridge]]',
                  'bridge.md': '\n'.join(f'[[leaf{i:03}]]' for i in range(620)),
                  'leaf619.md': '[[leaf618]] [[leaf618#Again]] [[outside]]',
                  'outside.md': '# Beyond two hops'})
    files.update({f'incoming{i:03}.md': '[[root]] [[bridge]] [[incoming-hub]]' for i in range(40)})
    files['incoming-hub.md'] = '[[incoming-leaf]]'
    files['incoming-leaf.md'] = '# Incoming only'
    graph = build_graph(wiki, files)
    root = 'bridge.md' if depth == 1 else 'root.md'
    nodes, edges, pages = collect(graph, root, depth=depth, **bounds)
    assert nodes == {f'leaf{i:03}.md' for i in range(620)} | ({'bridge.md'} if depth == 1 else {'root.md', 'bridge.md'})
    assert len(edges) == (621 if depth == 1 else 622)
    assert edges['leaf619.md', 'leaf618.md'] == 2
    assert pages[-1].projection_complete
    assert not any('neighborhood_limit' in page.limiting_reasons for page in pages)


def test_local_display_filter_does_not_remove_bridge_but_dirty_bridge_does(wiki):
    from indexing.models import IndexedNote
    graph = build_graph(wiki, {'root.md': '[[bridge]]', 'bridge.md': '[[shown/far]]',
                               'shown/far.md': '# Far'})
    nodes, _, pages = collect(graph, 'root.md', depth=2, folder='shown')
    assert nodes == {'shown/far.md'}
    assert pages[-1].boundary_connections
    IndexedNote.objects.filter(path='bridge.md').update(relations_dirty=True)
    nodes, _, _ = collect(graph, 'root.md', depth=2, folder='shown')
    assert not nodes


def test_local_continuation_rejects_changed_query_and_mutation(wiki):
    from django.db.models import F
    from indexing.models import IndexGeneration
    graph = build_graph(wiki, {'root.md': '[[bridge]]', 'bridge.md': '[[one]] [[two]]',
                               'one.md': '# One', 'two.md': '# Two'})
    first = graph.query_graph('root.md', depth=2, node_limit=2, edge_limit=1)
    assert first.next_cursor
    with pytest.raises(StorageError, match='graph_cursor_expired'):
        graph.query_graph('root.md', depth=3, node_limit=2, edge_limit=1, cursor=first.next_cursor)
    IndexGeneration.objects.filter(state='active').update(mutation=F('mutation') + 1)
    with pytest.raises(StorageError, match='graph_cursor_expired'):
        graph.query_graph('root.md', depth=2, node_limit=2, edge_limit=1, cursor=first.next_cursor)


def test_retry_of_lost_continuation_response_preserves_page_and_following_cursor(wiki):
    graph = build_graph(wiki, {'root.md': '[[bridge]]', 'bridge.md': '[[one]] [[two]]',
                               'one.md': '# One', 'two.md': '# Two'})
    first = graph.query_graph('root.md', depth=2, node_limit=2, edge_limit=1)
    second = graph.query_graph('root.md', depth=2, node_limit=2, edge_limit=1, cursor=first.next_cursor)
    replay = graph.query_graph('root.md', depth=2, node_limit=2, edge_limit=1, cursor=first.next_cursor)
    assert replay.nodes == second.nodes and replay.edges == second.edges
    assert replay.next_cursor == second.next_cursor
    assert replay.next_cursor
    following = graph.query_graph('root.md', depth=2, node_limit=2, edge_limit=1, cursor=replay.next_cursor)
    assert following.edges != second.edges


@pytest.mark.parametrize('change', ['publication', 'epoch', 'generation', 'namespace', 'missing_state', 'expired_state', 'bridge'])
def test_local_continuation_revokes_stale_membership(wiki, settings, monkeypatch, change):
    from django.db.models import F
    from indexing.models import IndexGeneration, RelationState
    from indexing import graph_traversal
    graph = build_graph(wiki, {'root.md': '[[bridge]]', 'bridge.md': '[[one]] [[two]]',
                               'one.md': '# One', 'two.md': '# Two'})
    first = graph.query_graph('root.md', depth=2, node_limit=2, edge_limit=1)
    assert first.next_cursor
    if change in {'publication', 'epoch'}:
        RelationState.objects.update(**{change: F(change) + 1})
    elif change == 'generation':
        IndexGeneration.objects.update(state='retired')
        IndexGeneration.objects.create(state='active')
    elif change == 'namespace':
        settings.BACKSTORY_EXCLUSIONS = ['bridge.md']
    elif change == 'missing_state':
        for file in (settings.BACKSTORY_DATA_DIR / 'graph-traversals').glob('*.sqlite3'):
            file.unlink()
    elif change == 'expired_state':
        from types import SimpleNamespace
        import time
        monkeypatch.setattr(graph_traversal, 'time', SimpleNamespace(
            monotonic=time.monotonic, time=lambda: time.time() + 3601))
    elif change == 'bridge':
        (wiki / 'bridge.md').unlink()
    with pytest.raises(StorageError, match='graph_cursor_expired'):
        graph.query_graph('root.md', depth=2, node_limit=2, edge_limit=1, cursor=first.next_cursor)


def test_eight_hop_shortest_outgoing_membership_preserves_cycle_edges(wiki):
    files = {f'n{i}.md': f'[[n{i + 1}]]' for i in range(9)}
    files.update({'n9.md': '# Outside', 'in.md': '[[n0]]', 'n3.md': '[[n4]] [[n1]]'})
    graph = build_graph(wiki, files)
    nodes, edges, pages = collect(graph, 'n0.md', depth=8, node_limit=2, edge_limit=1)
    assert nodes == {f'n{i}.md' for i in range(9)}
    assert len(edges) == 9 and pages[-1].projection_complete


def test_interrupted_page_rolls_back_and_can_retry_same_cursor(wiki, monkeypatch):
    graph = build_graph(wiki, {'root.md': '[[bridge]]', 'bridge.md': '[[one]] [[two]]',
                               'one.md': '# One', 'two.md': '# Two'})
    first = graph.query_graph('root.md', depth=2, node_limit=2, edge_limit=1)
    original = graph.Query.finish
    def fail_finish(*args, **kwargs):
        raise StorageError('synthetic_interruption', 503)
    monkeypatch.setattr(graph.Query, 'finish', fail_finish)
    with pytest.raises(StorageError, match='synthetic_interruption'):
        graph.query_graph('root.md', depth=2, node_limit=2, edge_limit=1, cursor=first.next_cursor)
    monkeypatch.setattr(graph.Query, 'finish', original)
    second = graph.query_graph('root.md', depth=2, node_limit=2, edge_limit=1, cursor=first.next_cursor)
    assert {(edge.source, edge.destination) for edge in second.edges} == {('bridge.md', 'one.md')}


def test_one_hop_small_page_does_not_stall_on_neighbor_to_neighbor_edge(wiki):
    graph = build_graph(wiki, {'root.md': '[[a]] [[b]]', 'a.md': '[[b]]', 'b.md': '# B'})
    cursor, observed = None, set()
    for _ in range(8):
        page = graph.query_graph('root.md', node_limit=2, edge_limit=1, cursor=cursor)
        observed.update((edge.source, edge.destination) for edge in page.edges)
        cursor = page.next_cursor
        if cursor is None:
            break
    assert observed == {('root.md', 'a.md'), ('root.md', 'b.md'), ('a.md', 'b.md')}
    assert cursor is None


def test_occurrence_counts_cross_multiple_discovery_windows(wiki):
    graph = build_graph(wiki, {'root.md': '[[bridge]]',
                               'bridge.md': '[[leaf]] ' * 350 + '[[far]]',
                               'leaf.md': '# Leaf', 'far.md': '# Far'})
    nodes, edges, pages = collect(graph, 'root.md', depth=2, node_limit=2, edge_limit=1)
    assert len(nodes) == 4
    assert edges == {('root.md', 'bridge.md'): 1, ('bridge.md', 'leaf.md'): 350, ('bridge.md', 'far.md'): 1}
    assert pages[-1].projection_complete


def test_private_state_io_failure_is_explicit_and_redacted(wiki, monkeypatch, caplog):
    from indexing import graph_traversal
    graph = build_graph(wiki, {'root.md': '[[bridge]]', 'bridge.md': '# Bridge'})
    def fail_cleanup(*args):
        raise OSError('synthetic private path and secret source')
    monkeypatch.setattr(graph_traversal, '_cleanup', fail_cleanup)
    with pytest.raises(StorageError, match='graph_traversal_unavailable'):
        graph.query_graph('root.md', depth=2)
    events = [record.index_event for record in caplog.records if hasattr(record, 'index_event')]
    assert events[-1]['reason_code'] == 'index_io_error'
    assert 'secret source' not in str(events)


def test_slow_setup_soft_deadline_still_advances_discovery_and_output(wiki, monkeypatch):
    import itertools
    import time
    from types import SimpleNamespace
    from indexing import graph_traversal
    graph = build_graph(wiki, {'root.md': '[[bridge]]', 'bridge.md': '[[leaf]]', 'leaf.md': '# Leaf'})
    # Each local time sample exceeds the cooperative slice, as slow setup can
    # do in practice. Keep the actual SQLite hard budget and clock unchanged.
    ticks = itertools.count(step=.03)
    monkeypatch.setattr(graph_traversal, 'time', SimpleNamespace(
        time=time.time, monotonic=lambda: next(ticks)))
    cursor, nodes, edges = None, set(), set()
    for _ in range(40):
        page = graph.query_graph('root.md', depth=2, node_limit=2, edge_limit=1, cursor=cursor)
        nodes.update(node.path for node in page.nodes)
        edges.update((edge.source, edge.destination) for edge in page.edges)
        cursor = page.next_cursor
        if cursor is None:
            break
    assert cursor is None
    assert nodes == {'root.md', 'bridge.md', 'leaf.md'}
    assert edges == {('root.md', 'bridge.md'), ('bridge.md', 'leaf.md')}


@pytest.mark.parametrize('depth', range(1, 9))
def test_local_membership_counts_only_outgoing_hops_and_recenters(wiki, depth):
    graph = build_graph(wiki, {'r.md': '[[a]]', 'a.md': '[[b]]', 'b.md': '# B',
                               'x.md': '[[r]]', 'y.md': '[[a]]', 'alone.md': '# Alone'})
    nodes, edges, pages = collect(graph, 'r.md', depth=depth, node_limit=2, edge_limit=1)
    assert nodes == ({'r.md', 'a.md'} if depth == 1 else {'r.md', 'a.md', 'b.md'})
    assert edges == ({('r.md', 'a.md'): 1} if depth == 1 else {('r.md', 'a.md'): 1, ('a.md', 'b.md'): 1})
    assert pages[-1].projection_complete
    # Recentering starts a new directed search, even at the same selected depth.
    assert collect(graph, 'a.md', depth=depth)[0] == {'a.md', 'b.md'}
    assert collect(graph, 'b.md', depth=depth)[0] == {'b.md'}


@pytest.mark.parametrize('reverse', [False, True])
@pytest.mark.parametrize('depth', [1, 2, 3])
def test_outgoing_diamond_keeps_all_induced_directed_records(wiki, depth, reverse):
    files = {'r.md': '[[a]] [[b]] [[a#Again]]', 'a.md': '[[c]] [[b]] [[r]]',
             'b.md': '[[c]] [[a]]', 'c.md': '[[r]] [[a]] [[a#Again]] [[d]]',
             'd.md': '# D', 'x.md': '[[r]] [[c]]'}
    if reverse:
        files = dict(reversed(list(files.items())))
    graph = build_graph(wiki, files)
    nodes, edges, pages = collect(graph, 'r.md', depth=depth, node_limit=2, edge_limit=1)
    expected = {('r.md', 'a.md'): 2, ('r.md', 'b.md'): 1,
                ('a.md', 'b.md'): 1, ('a.md', 'r.md'): 1, ('b.md', 'a.md'): 1}
    if depth >= 2:
        expected.update({('a.md', 'c.md'): 1, ('b.md', 'c.md'): 1,
                         ('c.md', 'r.md'): 1, ('c.md', 'a.md'): 2})
    if depth == 3:
        expected['c.md', 'd.md'] = 1
    assert nodes == ({'r.md', 'a.md', 'b.md'} | ({'c.md'} if depth >= 2 else set())
                     | ({'d.md'} if depth == 3 else set()))
    assert edges == expected and pages[-1].projection_complete
    for page in pages:
        for edge in page.edges:
            assert edge.source_revision and edge.occurrence_id
            assert edge.position


def test_backlink_inspection_and_whole_wiki_do_not_change_outgoing_membership(wiki):
    graph = build_graph(wiki, {'r.md': '[[a]]', 'a.md': '# A', 'x.md': '[[r]]',
                               'y.md': '[[a]]', 'alone.md': '# Alone'})
    assert collect(graph, 'r.md', depth=2)[0] == {'r.md', 'a.md'}
    incoming = graph.query_links('r.md', 'incoming')
    assert [item.source for item in incoming.items] == ['x.md']
    assert collect(graph, 'r.md', depth=2)[0] == {'r.md', 'a.md'}
    nodes, edges, pages = collect(graph, None, depth=8, node_limit=2, edge_limit=1)
    assert nodes == {'r.md', 'a.md', 'x.md', 'y.md', 'alone.md'}
    assert edges == {('r.md', 'a.md'): 1, ('x.md', 'r.md'): 1, ('y.md', 'a.md'): 1}
    assert pages[-1].projection_complete


@pytest.mark.parametrize('depth', [1, 2])
def test_legacy_undirected_local_cursor_requires_restart(wiki, depth):
    import hashlib
    from django.core import signing
    graph = build_graph(wiki, {'r.md': '[[a]] [[b]]', 'a.md': '# A', 'b.md': '# B'})
    first = graph.query_graph('r.md', depth=depth, node_limit=2, edge_limit=1)
    assert first.next_cursor
    data = signing.loads(first.next_cursor, salt='graph-v1')
    legacy_arguments = {'kind': 'graph', 'path': 'r.md', 'depth': depth, 'folder': '', 'tag': '',
                        'query': '', 'node_limit': 2, 'edge_limit': 1}
    data['q'] = hashlib.sha256(json.dumps(legacy_arguments, sort_keys=True).encode()).hexdigest()
    legacy_cursor = signing.dumps(data, salt='graph-v1', compress=True)
    with pytest.raises(StorageError, match='graph_cursor_expired'):
        graph.query_graph('r.md', depth=depth, node_limit=2, edge_limit=1, cursor=legacy_cursor)
