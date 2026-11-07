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
    for kwargs in [{'depth': 9}, {'node_limit': 201}, {'edge_limit': 501}, {'query': 'x' * 257}]:
        with pytest.raises(StorageError):
            graph.query_graph(**kwargs)


def test_unavailable_storage_withholds_all_content(wiki):
    graph = build_graph(wiki, {'a.md': '[[b]]', 'b.md': '# B'})
    (wiki / '.backstory-marker').unlink()
    page = graph.query_graph('a.md')
    assert page.state == 'unavailable' and not page.nodes and not page.edges


@pytest.mark.parametrize('stage', ['queued', 'running'])
@pytest.mark.parametrize('change', [
    'changed_source', 'dirty_source', 'deleted_endpoint', 'denied_endpoint',
    'storage_unavailable', 'namespace_mismatch', 'mutation_mismatch',
])
def test_reconciliation_retains_only_safe_relation_evidence(wiki, settings, stage, change):
    from django.db.models import F
    from indexing import worker
    from indexing.models import IndexedNote, IndexGeneration, RelationState
    from indexing.queue import request_scan

    graph = build_graph(wiki, {'a.md': '[[b]] [[b#Part]]', 'b.md': '# B',
                               'safe.md': '[[target]]', 'target.md': '# Target'})
    first = graph.query_links('a.md', 'outgoing', limit=1)
    request_scan('incremental')
    if stage == 'running':
        assert worker.run_batch().pending
    assert worker.index_status().state == ('stale' if stage == 'queued' else 'partial')

    if change == 'changed_source':
        (wiki / 'a.md').write_text('# Changed source without those links')
    elif change == 'dirty_source':
        IndexedNote.objects.filter(generation__state='active', path='a.md').update(relations_dirty=True)
        RelationState.objects.filter(generation__state='active').update(complete=False)
    elif change == 'deleted_endpoint':
        (wiki / 'b.md').unlink()
    elif change == 'denied_endpoint':
        settings.BACKSTORY_EXCLUSIONS = ['b.md']
    elif change == 'storage_unavailable':
        (wiki / '.backstory-marker').unlink()
    elif change == 'namespace_mismatch':
        RelationState.objects.filter(generation__state='active').update(namespace='unknown')
    elif change == 'mutation_mismatch':
        IndexGeneration.objects.filter(state='active').update(mutation=F('mutation') + 1)

    outgoing = graph.query_links('a.md', 'outgoing')
    pages = [outgoing, graph.query_graph(), graph.query_graph('a.md')]
    assert not outgoing.items
    if change == 'denied_endpoint':
        from wiki.contracts import PathDenied
        with pytest.raises(PathDenied):
            graph.query_links('b.md', 'incoming')
    else:
        incoming = graph.query_links('b.md', 'incoming')
        assert not incoming.items
        pages.append(incoming)
    assert all(not page.projection_complete for page in pages)
    assert not pages[2].edges
    independent_safe = change in {'changed_source', 'dirty_source', 'deleted_endpoint'}
    assert {(edge.source, edge.destination) for edge in pages[1].edges} == (
        {('safe.md', 'target.md')} if independent_safe else set())
    if change == 'denied_endpoint':
        assert all('b.md' not in str(page) for page in pages)
    if change in {'denied_endpoint', 'storage_unavailable', 'mutation_mismatch', 'dirty_source'}:
        with pytest.raises(StorageError, match='graph_cursor_expired'):
            graph.query_links('a.md', 'outgoing', limit=1, cursor=first.next_cursor)
    else:
        assert not graph.query_links('a.md', 'outgoing', limit=1, cursor=first.next_cursor).items


def test_rebuild_generation_expires_prior_relation_cursor(wiki):
    from indexing import worker
    from indexing.queue import request_scan
    from tests.integration.test_indexing import drain

    graph = build_graph(wiki, {'a.md': '[[b]] [[b#Part]]', 'b.md': '# B'})
    first = graph.query_links('a.md', 'outgoing', limit=1)
    request_scan('rebuild')
    drain(worker)
    current = graph.query_links('a.md', 'outgoing')
    assert current.generation != first.generation and len(current.items) == 2
    with pytest.raises(StorageError, match='graph_cursor_expired'):
        graph.query_links('a.md', 'outgoing', limit=1, cursor=first.next_cursor)


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


def test_cursor_from_building_projection_restarts_after_publication(wiki):
    graph = build_graph(wiki, {'a.md': '[[b]]', 'b.md': '# B'})
    from indexing.models import RelationState
    from indexing import worker
    state = RelationState.objects.get(generation__state='active')
    state.complete = False
    state.save(update_fields=['complete'])
    first = graph.query_graph(node_limit=1)
    assert first.next_cursor and not first.projection_complete
    worker.run_batch()
    with pytest.raises(StorageError, match='graph_cursor_expired'):
        graph.query_graph(node_limit=1, cursor=first.next_cursor)


def test_unindexed_or_deleted_requested_note_cannot_prove_no_links(wiki):
    graph = build_graph(wiki, {'a.md': '# A'})
    (wiki / 'new.md').write_text('[[a]]')
    for direction in ('incoming', 'outgoing', 'both'):
        assert not graph.query_links('new.md', direction).projection_complete
    (wiki / 'a.md').unlink()
    assert not graph.query_links('a.md', 'both').projection_complete


def test_denied_references_never_become_missing_diagnostics(wiki, settings):
    settings.BACKSTORY_EXCLUSIONS = ['private/**']
    graph = build_graph(wiki, {'a.md': '[[private/target]] [private](private/other.md)',
                               'private/target.md': '# Excluded'})
    page = graph.query_link_issues(issue='missing')
    assert not page.items
    assert 'private/' not in str(graph.query_links('a.md', 'outgoing'))


def test_one_hop_pages_progress_past_candidate_window_and_keep_neighbor_edges(wiki):
    files = {f'n{i:03}.md': '# Neighbor' for i in range(310)}
    files['hub.md'] = '\n'.join(f'[[n{i:03}]]' for i in range(310))
    files['n309.md'] = '[[n308]]'
    graph = build_graph(wiki, files)
    cursor = None
    observed = set()
    for _ in range(20):
        page = graph.query_graph('hub.md', node_limit=80, cursor=cursor)
        assert page.limits['examined'] <= 300
        assert len(page.nodes) <= 80
        observed.update((edge.source, edge.destination) for edge in page.edges)
        cursor = page.next_cursor
        if not cursor:
            break
    assert cursor is None
    assert {('hub.md', f'n{i:03}.md') for i in range(310)} <= observed
    assert ('n309.md', 'n308.md') in observed


def test_one_hop_filter_keeps_matching_neighbors_when_center_is_filtered_out(wiki):
    graph = build_graph(wiki, {'root.md': '[[subdir/a]]', 'subdir/a.md': '# A'})
    page = graph.query_graph('root.md', folder='subdir')
    assert [node.path for node in page.nodes] == ['subdir/a.md']
    assert page.boundary_connections


def test_eligibility_version_revokes_client_evidence_before_policy_rebuild(wiki, settings):
    graph = build_graph(wiki, {'a.md': '[[b]]', 'b.md': '# B'})
    first = graph.query_links('a.md', 'outgoing')
    settings.BACKSTORY_EXCLUSIONS = ['b.md']
    denied = graph.query_links('a.md', 'outgoing')
    assert first.eligibility_version and denied.eligibility_version != first.eligibility_version
    assert not denied.items


def test_dirty_raw_window_keeps_continuation_to_later_completed_local_edges(wiki):
    graph = build_graph(wiki, {'a.md': '\n'.join('[[Missing]]' for _ in range(305)),
                               'hub.md': '[[a]] [[b]]', 'b.md': '# B'})
    from indexing import worker
    from indexing.queue import enqueue_note
    from wiki.storage import read_note
    # Replacing the hub's edge sequence puts its clean occurrences after the
    # dirty neighbor window regardless of filesystem discovery order.
    (wiki / 'hub.md').write_text('[[a]] [[b]] [[#Heading]]')
    enqueue_note('hub.md', read_note('hub.md').revision)
    from tests.integration.test_indexing import drain
    drain(worker)
    (wiki / 'Missing.md').write_text('# Found')
    enqueue_note('Missing.md', read_note('Missing.md').revision)
    assert worker.run_batch().pending
    cursor = None
    observed = set()
    for _ in range(6):
        page = graph.query_graph('hub.md', cursor=cursor)
        observed.update((edge.source, edge.destination) for edge in page.edges)
        cursor = page.next_cursor
        if not cursor:
            break
    assert {('hub.md', 'a.md'), ('hub.md', 'b.md')} <= observed


def test_cursor_restarts_on_individual_source_publication_before_global_completion(wiki):
    graph = build_graph(wiki, {'a.md': '\n'.join('[[Missing]]' for _ in range(21)),
                               'b.md': '\n'.join('[[Missing]]' for _ in range(21))})
    from indexing import worker
    from indexing.queue import enqueue_note
    from wiki.storage import read_note
    (wiki / 'Missing.md').write_text('# Found')
    enqueue_note('Missing.md', read_note('Missing.md').revision)
    assert worker.run_batch().pending
    first = graph.query_graph(node_limit=1)
    assert first.next_cursor and not first.projection_complete
    assert worker.run_batch().pending
    with pytest.raises(StorageError, match='graph_cursor_expired'):
        graph.query_graph(node_limit=1, cursor=first.next_cursor)


def test_local_depth_traverses_shortest_eligible_links_and_shrinks_cycles(wiki):
    graph = build_graph(wiki, {'a.md': '[[b]]', 'b.md': '[[c]]', 'c.md': '[[b]] [[d]]',
                               'd.md': '[[e]]', 'e.md': '# E', 'alone.md': '# Alone'})
    two = graph.query_graph('a.md', depth=2)
    three = graph.query_graph('a.md', depth=3)
    assert {n.path for n in two.nodes} == {'a.md', 'b.md', 'c.md'}
    assert {n.path for n in three.nodes} == {'a.md', 'b.md', 'c.md', 'd.md'}
    assert {(e.source, e.destination) for e in three.edges} == {('a.md', 'b.md'), ('b.md', 'c.md'), ('c.md', 'b.md'), ('c.md', 'd.md')}
    assert {n.path for n in graph.query_graph('a.md', depth=1).nodes} == {'a.md', 'b.md'}
    assert {n.path for n in graph.query_graph('a.md', depth=8).nodes} == {'a.md', 'b.md', 'c.md', 'd.md', 'e.md'}
    assert three.limits['depth'] == 8 and three.projection_complete


def test_depth_traverses_filtered_bridge_and_revalidates_it(wiki):
    graph = build_graph(wiki, {'a.md': '[[bridge]]', 'bridge.md': '[[far]]', 'far.md': '# Far'})
    filtered = graph.query_graph('a.md', depth=2, query='far')
    assert {n.path for n in filtered.nodes} == {'far.md'}
    (wiki / 'bridge.md').unlink()
    revoked = graph.query_graph('a.md', depth=3)
    assert {n.path for n in revoked.nodes} == {'a.md'}
    assert not revoked.projection_complete
