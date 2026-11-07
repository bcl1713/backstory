"""Synthetic real-worker tests for namespace-wide relationship invalidation."""
import importlib
import pytest
from tests.integration.test_storage import wiki
from tests.integration.test_indexing import drain

pytestmark = pytest.mark.django_db(transaction=True)


def graph_api():
    try:
        return importlib.import_module('indexing.graph')
    except ImportError:
        pytest.fail('shared graph query service is missing')


def build_graph(wiki, files):
    from indexing import worker
    for path, source in files.items():
        target = wiki / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(source)
    drain(worker)
    return graph_api()


def destinations(page):
    return [item.destination for item in page.items if item.state == 'resolved']


def test_alias_projection_is_invalidated_by_exact_path_and_collision(wiki):
    graph = build_graph(wiki, {'source.md': '[[Friendly]]', 'deep/a.md': '---\naliases: [Friendly]\n---\n# A'})
    assert destinations(graph.query_links('source.md', 'outgoing')) == ['deep/a.md']
    from indexing import worker
    from indexing.queue import enqueue_note
    from wiki.storage import read_note
    (wiki / 'Friendly.md').write_text('# Exact')
    enqueue_note('Friendly.md', read_note('Friendly.md').revision)
    worker.run_batch()
    page = graph.query_links('source.md', 'outgoing')
    assert not page.projection_complete or destinations(page) == ['Friendly.md']
    drain(worker)
    assert destinations(graph.query_links('source.md', 'outgoing')) == ['Friendly.md']
    (wiki / 'Friendly.md').unlink()
    (wiki / 'deep/b.md').write_text('---\naliases: [Friendly]\n---\n# B')
    from indexing.queue import request_scan
    request_scan('verify')
    drain(worker)
    page = graph.query_links('source.md', 'outgoing')
    assert page.items[0].state == 'ambiguous'
    assert page.items[0].choices == ('deep/a.md', 'deep/b.md')
    assert not graph.query_links('deep/a.md', 'incoming').items


def test_policy_change_withholds_old_projection_and_rebuilds_in_bounded_batches(wiki, settings):
    graph = build_graph(wiki, {'source.md': '[[Alias]]', 'a.md': '---\naliases: [Alias]\n---\n# A',
                               'b.md': '---\naliases: [Alias]\n---\n# B'})
    settings.BACKSTORY_EXCLUSIONS = ['b.md']
    page = graph.query_links('source.md', 'outgoing')
    assert not page.projection_complete and not page.items
    from indexing import worker
    drain(worker)
    page = graph.query_links('source.md', 'outgoing')
    assert destinations(page) == ['a.md']
    assert 'b.md' not in str(page)


def test_parser_failure_never_proves_isolation_or_missing(wiki, monkeypatch):
    from wiki import links
    original = links.extract_links
    def limited(source):
        if 'FAIL_PARSE' in source:
            raise links.LinkStructureLimit('link_structure_limit')
        return original(source)
    monkeypatch.setattr(links, 'extract_links', limited)
    graph = build_graph(wiki, {'broken.md': 'FAIL_PARSE [[target]]', 'source.md': '[[absent]]'})
    page = graph.query_link_issues(issue='isolated')
    assert not page.projection_complete and not page.items
    assert not graph.query_link_issues(issue='missing').items


def test_relation_pass_resumes_and_bounds_occurrence_resolution(wiki, monkeypatch):
    from indexing import worker
    graph = build_graph(wiki, {'source.md': '\n'.join('[[target]]' for _ in range(63)), 'target.md': '# Target'})
    from indexing.models import RelationState
    state = RelationState.objects.get(generation__state='active')
    assert state.complete
    from indexing import graph_projection
    calls = []
    original = graph_projection.resolve_relation
    def counted(*args):
        calls.append(args)
        return original(*args)
    monkeypatch.setattr(graph_projection, 'resolve_relation', counted)
    state.complete = False
    state.after = 0
    state.save()
    worker.run_batch()
    assert 0 < len(calls) <= 20
    importlib.reload(worker)
    drain(worker)
    assert len(graph.query_links('target.md', 'incoming', limit=100).items) == 63


def relation_identity():
    from indexing.models import IndexGeneration, LinkEdge, RelationState, ResolvedRelation
    generation = IndexGeneration.objects.get(state='active')
    state = RelationState.objects.get(generation=generation)
    return (generation.mutation, state.epoch,
            list(LinkEdge.objects.order_by('pk').values_list('pk', flat=True)),
            list(ResolvedRelation.objects.order_by('pk').values_list('pk', 'occurrence_id')))


def count_resolutions(monkeypatch):
    from indexing import graph_projection
    calls = []
    original = graph_projection.resolve_relation
    def counted(source, *args):
        calls.append(source)
        return original(source, *args)
    monkeypatch.setattr(graph_projection, 'resolve_relation', counted)
    return calls


def test_unchanged_verification_preserves_occurrences_epoch_cursor_and_does_no_resolution(wiki, monkeypatch):
    graph = build_graph(wiki, {'a.md': '[[b]] [[b#Part]]', 'b.md': '# B'})
    before = relation_identity()
    first = graph.query_links('a.md', 'outgoing', limit=1)
    calls = count_resolutions(monkeypatch)
    from indexing import worker
    from indexing.queue import request_scan
    request_scan('verify')
    drain(worker)
    assert relation_identity() == before
    assert calls == []
    second = graph.query_links('a.md', 'outgoing', cursor=first.next_cursor, limit=1)
    assert second.items[0].occurrence_id != first.items[0].occurrence_id


@pytest.mark.parametrize('scan', ['incremental', 'verify', 'scheduled'])
def test_unchanged_scans_keep_links_backlinks_graph_and_pagination(wiki, monkeypatch, scan):
    from indexing import worker
    from indexing.models import ScanState
    from indexing.queue import request_scan

    graph = build_graph(wiki, {'a.md': '[[b]] [[c]]', 'b.md': '# B', 'c.md': '# C'})
    before = relation_identity()
    first_link = graph.query_links('a.md', 'outgoing', limit=1)
    first_graph = graph.query_graph(node_limit=2)
    assert first_link.next_cursor and first_graph.next_cursor
    calls = count_resolutions(monkeypatch)
    now = ScanState.objects.get(pk=1).last_completed + 1
    ScanState.objects.filter(pk=1).update(next_incremental=now + 300, next_verify=now + 86400)

    def check(freshness):
        links = graph.query_links('a.md', 'outgoing')
        backlinks = graph.query_links('b.md', 'incoming')
        pages = [links, backlinks, graph.query_graph('a.md'), graph.query_graph()]
        assert destinations(links) == ['b.md', 'c.md']
        assert [item.source for item in backlinks.items] == ['a.md']
        for page in pages[2:]:
            assert {(edge.source, edge.destination) for edge in page.edges} == {
                ('a.md', 'b.md'), ('a.md', 'c.md')}
        for page in pages:
            assert page.freshness['state'] == freshness
            assert page.projection_complete is (freshness == 'ready')
            assert page.state == ('ok' if freshness == 'ready' else 'incomplete')
        continuation = graph.query_links('a.md', 'outgoing', limit=1, cursor=first_link.next_cursor)
        assert destinations(continuation) == ['c.md']
        continued_graph = graph.query_graph(node_limit=2, cursor=first_graph.next_cursor)
        assert [(edge.source, edge.destination) for edge in continued_graph.edges] == [('a.md', 'c.md')]
        assert relation_identity() == before
        assert calls == []

    check('ready')
    if scan == 'scheduled':
        now += 300
    else:
        request_scan(scan)
        check('stale')
    assert worker.run_batch(now=now).pending
    assert ScanState.objects.get(pk=1).checkpoint['kind'] == ('incremental' if scan == 'scheduled' else scan)
    check('partial')
    drain(worker)
    check('ready')


def test_scheduler_transition_during_query_keeps_safe_relations(wiki, monkeypatch):
    from indexing.queue import request_scan
    graph = build_graph(wiki, {'a.md': '[[b]]', 'b.md': '# B'})
    original = graph.Query.check_row

    def queue_scan(query, row):
        request_scan('incremental')
        return original(query, row)

    monkeypatch.setattr(graph.Query, 'check_row', queue_scan)
    page = graph.query_links('a.md', 'outgoing')
    assert destinations(page) == ['b.md']
    assert page.freshness['state'] == 'stale'
    assert not page.projection_complete and page.state == 'incomplete'


@pytest.mark.parametrize('kind', ['links', 'missing', 'ambiguous', 'isolated'])
def test_scheduler_transition_during_query_withholds_absence_claims(wiki, monkeypatch, kind):
    from indexing.queue import request_scan
    graph = build_graph(wiki, {'a.md': '[[absent]] [[Alias]] [[target]]',
                               'b.md': '---\naliases: [Alias]\n---\n# B',
                               'c.md': '---\naliases: [Alias]\n---\n# C',
                               'target.md': '# Target', 'isolated.md': '# Isolated'})
    original = graph.Query.check_row

    def queue_scan(query, row):
        request_scan('incremental')
        return original(query, row)

    monkeypatch.setattr(graph.Query, 'check_row', queue_scan)
    if kind == 'links':
        page = graph.query_links('a.md', 'outgoing')
        assert [item.state for item in page.items] == ['unconfirmed', 'unconfirmed', 'resolved']
        assert destinations(page) == ['target.md']
    else:
        page = graph.query_link_issues(issue=kind)
        assert not page.items and page.next_cursor is None
    assert page.freshness['state'] == 'stale'
    assert not page.projection_complete and page.state == 'incomplete'


def test_body_only_refresh_preserves_relations_and_updates_revision_and_positions(wiki, monkeypatch):
    graph = build_graph(wiki, {'a.md': '[[b]]', 'b.md': '# B'})
    before = relation_identity()
    calls = count_resolutions(monkeypatch)
    from indexing import worker
    from indexing.queue import enqueue_note
    from wiki.storage import read_note
    (wiki / 'a.md').write_text('New prose\n\n[[b]]')
    revision = read_note('a.md').revision
    enqueue_note('a.md', revision)
    drain(worker)
    after = relation_identity()
    assert after[1:] == before[1:]
    assert calls == []
    item = graph.query_links('a.md', 'outgoing').items[0]
    assert item.source_revision == revision and item.position[0] == 3


def test_new_exact_target_and_negative_name_dependencies_only_resolve_affected_sources(wiki, monkeypatch):
    graph = build_graph(wiki, {'a.md': '[[Wanted]] [[Missing]]', 'b.md': '[[c]]',
                               'c.md': '# C', 'deep/alias.md': '---\naliases: [Wanted]\n---\n# Alias'})
    from indexing import worker
    from indexing.queue import enqueue_note
    from wiki.storage import read_note
    before = relation_identity()
    calls = count_resolutions(monkeypatch)
    (wiki / 'Wanted.md').write_text('# Exact')
    enqueue_note('Wanted.md', read_note('Wanted.md').revision)
    drain(worker)
    assert destinations(graph.query_links('a.md', 'outgoing')) == ['Wanted.md']
    assert calls and set(calls) == {'a.md'}
    assert relation_identity()[1] == before[1]
    calls.clear()
    (wiki / 'new.md').write_text('---\nids: [Missing]\n---\n# New')
    enqueue_note('new.md', read_note('new.md').revision)
    drain(worker)
    assert destinations(graph.query_links('a.md', 'outgoing')) == ['Wanted.md', 'new.md']
    assert calls and set(calls) == {'a.md'}
    calls.clear()
    (wiki / 'other.md').write_text('# Unrelated')
    enqueue_note('other.md', read_note('other.md').revision)
    drain(worker)
    assert calls == []


def test_retains_independently_safe_completed_sources_while_affected_source_resumes(wiki):
    graph = build_graph(wiki, {'a.md': '\n'.join('[[Missing]]' for _ in range(45)),
                               'safe.md': '[[target]]', 'target.md': '# Target'})
    from indexing import worker
    from indexing.queue import enqueue_note
    from wiki.storage import read_note
    from indexing.models import ResolvedRelation
    stable = list(ResolvedRelation.objects.filter(source='safe.md').values_list('pk', 'epoch'))
    (wiki / 'Missing.md').write_text('# Found')
    enqueue_note('Missing.md', read_note('Missing.md').revision)
    result = worker.run_batch()
    assert result.pending
    retained = graph.query_links('safe.md', 'outgoing')
    assert destinations(retained) == ['target.md']
    assert not retained.projection_complete
    assert not graph.query_links('a.md', 'outgoing').items
    drain(worker)
    assert len(graph.query_links('a.md', 'outgoing', limit=100).items) == 45
    assert list(ResolvedRelation.objects.filter(source='safe.md').values_list('pk', 'epoch')) == stable


def test_alias_collision_removal_and_rename_revisit_negative_and_ambiguous_dependents(wiki, monkeypatch):
    graph = build_graph(wiki, {'a.md': '[[Alias]]', 'old.md': '---\naliases: [Alias]\n---\n# Old',
                               'safe.md': '[[safe-target]]', 'safe-target.md': '# Safe'})
    from indexing import worker
    from indexing.queue import enqueue_note, request_scan
    from wiki.storage import read_note
    calls = count_resolutions(monkeypatch)
    (wiki / 'new.md').write_text('---\naliases: [Alias]\n---\n# New')
    enqueue_note('new.md', read_note('new.md').revision)
    drain(worker)
    item = graph.query_links('a.md', 'outgoing').items[0]
    assert item.state == 'ambiguous' and item.choices == ('new.md', 'old.md')
    assert set(calls) == {'a.md'}
    calls.clear()
    (wiki / 'old.md').unlink()
    (wiki / 'new.md').rename(wiki / 'renamed.md')
    request_scan('verify')
    drain(worker)
    assert destinations(graph.query_links('a.md', 'outgoing')) == ['renamed.md']
    assert calls and set(calls) == {'a.md'}


def test_source_publication_rejects_concurrent_namespace_mutation(wiki, monkeypatch):
    graph = build_graph(wiki, {'a.md': '[[Alias]] [[Alias]]',
                               'target.md': '---\naliases: [Alias]\n---\n# Target'})
    from indexing import graph_projection, worker
    from indexing.models import IndexGeneration
    from indexing.queue import enqueue_note
    from indexing.scanner import file_stat
    from wiki.storage import read_note
    (wiki / 'a.md').write_text('[[Alias]] [[Alias]] [[Alias]]')
    enqueue_note('a.md', read_note('a.md').revision)
    original = graph_projection.resolve_relation
    changed = False
    def race(*args):
        nonlocal changed
        result = original(*args)
        if not changed:
            changed = True
            (wiki / 'target.md').write_text('# Alias removed')
            worker._commit_projection(read_note('target.md'), file_stat('target.md'),
                                      list(IndexGeneration.objects.filter(state='active')), '')
        return result
    monkeypatch.setattr(graph_projection, 'resolve_relation', race)
    assert worker.run_batch().pending
    assert not graph.query_links('a.md', 'outgoing').items
    drain(worker)
    page = graph.query_links('a.md', 'outgoing')
    assert len(page.items) == 3 and all(item.state == 'missing' for item in page.items)


def test_large_affected_source_finishes_while_unrelated_body_edits_continue(wiki, monkeypatch):
    graph = build_graph(wiki, {'a.md': '\n'.join('[[Missing]]' for _ in range(45)),
                               'busy.md': '# Busy'})
    from indexing import worker
    from indexing.queue import enqueue_note
    from wiki.storage import read_note
    calls = count_resolutions(monkeypatch)
    (wiki / 'Missing.md').write_text('# Found')
    enqueue_note('Missing.md', read_note('Missing.md').revision)
    assert worker.run_batch().pending
    for number in range(4):
        (wiki / 'busy.md').write_text(f'# Busy\nUnrelated prose {number}')
        enqueue_note('busy.md', read_note('busy.md').revision)
        worker.run_batch()
    assert len(graph.query_links('a.md', 'outgoing', limit=100).items) == 45
    assert calls.count('a.md') == 45


def test_non_note_path_dependencies_refresh_asset_shadowing_and_missing_images(wiki, monkeypatch):
    graph = build_graph(wiki, {'source.md': '[[Alias]] ![image](pic.png)',
                               'deep/a.md': '---\naliases: [Alias]\n---\n# Alias',
                               'safe.md': '[[deep/a]]'})
    from indexing import worker
    from indexing.queue import request_scan
    before = relation_identity()
    calls = count_resolutions(monkeypatch)
    (wiki / 'Alias').write_text('extensionless attachment')
    (wiki / 'pic.png').write_text('inert')
    request_scan('verify')
    drain(worker)
    items = graph.query_links('source.md', 'outgoing').items
    assert [(item.destination, item.resource_type) for item in items] == [('Alias', 'asset'), ('pic.png', 'asset')]
    assert set(calls) == {'source.md'}
    assert relation_identity()[1:] == before[1:]
    calls.clear()
    request_scan('verify')
    drain(worker)
    assert calls == []
    (wiki / 'Alias').unlink()
    (wiki / 'pic.png').unlink()
    request_scan('verify')
    drain(worker)
    items = graph.query_links('source.md', 'outgoing').items
    assert items[0].destination == 'deep/a.md' and items[1].state == 'missing'
    assert set(calls) == {'source.md'}
