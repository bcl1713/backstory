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
