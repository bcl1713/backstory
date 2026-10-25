import importlib
import pytest
from tests.integration.test_storage import wiki
from tests.integration.test_browsing import reader
from tests.integration.test_indexing import drain

pytestmark = pytest.mark.django_db(transaction=True)


def search_api():
    try:
        return importlib.import_module('indexing.search')
    except ImportError:
        pytest.fail('bounded indexed search missing')


def indexed(wiki, count=40):
    from indexing import worker
    for n in range(count):
        (wiki / f'n{n:04}.md').write_text(f'---\ntitle: Café title {n}\n---\n# Café\n\nCommon indexed content <script> & punctuation C++ SQL SELECT\n' + 'word ' * 80)
    drain(worker)


def test_literal_search_limits_stable_paging_and_snippets(wiki):
    s = search_api()
    indexed(wiki, 120)
    page = s.search_notes('common')
    assert len(page.items) == 30 and page.next_cursor
    second = s.search_notes('common', page.next_cursor)
    assert len(second.items) == 30 and not ({x.path for x in page.items} & {x.path for x in second.items})
    assert len(s.search_notes('common', limit=999).items) == 100
    assert all(len(item.snippet) <= 240 for item in page.items)
    for query in ['C++', '" OR * NEAR(', "'; DROP TABLE indexing_indexednote; --", 'café', 'n0001.md']:
        assert s.search_notes(query).freshness.state in {'ready', 'partial', 'stale'}
    from wiki.contracts import StorageError
    for query in ['x' * 257, ' '.join(['x'] * 17)]:
        with pytest.raises(StorageError, match='invalid_search_query'):
            s.search_notes(query)


def test_search_never_reads_bodies_and_filters_policy_deletions(wiki, settings, monkeypatch):
    s = search_api()
    indexed(wiki)
    from wiki import storage
    monkeypatch.setattr(storage, 'read_note', lambda *a: pytest.fail('search read a note body'))
    (wiki / 'n0000.md').unlink()
    settings.BACKSTORY_EXCLUSIONS = ['n0001.md']
    page = s.search_notes('common')
    assert 'n0000.md' not in {x.path for x in page.items}
    assert 'n0001.md' not in {x.path for x in page.items}


def test_cursor_binds_query_generation_and_policy(wiki, settings):
    s = search_api()
    indexed(wiki)
    first = s.search_notes('common')
    from wiki.contracts import StorageError
    with pytest.raises(StorageError, match='search_cursor_expired'):
        s.search_notes('other', first.next_cursor)
    settings.BACKSTORY_EXCLUSIONS = ['not-present.md']
    with pytest.raises(StorageError, match='search_cursor_expired'):
        s.search_notes('common', first.next_cursor)
    settings.BACKSTORY_EXCLUSIONS = []
    from indexing.queue import request_scan
    from indexing import worker
    request_scan('rebuild')
    drain(worker)
    with pytest.raises(StorageError, match='search_cursor_expired'):
        s.search_notes('common', first.next_cursor)


def test_search_candidate_and_sqlite_work_caps(wiki, settings, monkeypatch):
    s = search_api()
    indexed(wiki, 350)
    settings.BACKSTORY_EXCLUSIONS = [f'n{n:04}.md' for n in range(340)]
    page = s.search_notes('common', limit=100)
    assert page.examined == 300 and len(page.items) == 0 and page.next_cursor
    monkeypatch.setattr(s, 'SQLITE_VM_STEPS', 1)
    limited = s.search_notes('common')
    assert limited.freshness.limited and limited.items == ()


def test_search_honest_partial_unavailable_and_escaped_html(wiki, reader):
    s = search_api()
    from indexing.worker import run_batch
    (wiki / 'visible.md').write_text('# Visible\n<script> & unsafe <b>Common</b>')
    run_batch()
    assert s.search_notes('common').freshness.state == 'partial'
    from indexing import worker
    drain(worker)
    response = reader.get('/search/', {'q': 'common'})
    assert response.status_code == 200 and b'&lt;script&gt;' in response.content
    assert b'<script>' not in response.content
    assert b'&amp;' in response.content
    (wiki / 'Identity.txt').unlink()
    unavailable = s.search_notes('common')
    assert unavailable.items == () and unavailable.freshness.state == 'unavailable'


def test_search_marks_metadata_changes_stale_without_body_reads(wiki, monkeypatch):
    s = search_api()
    indexed(wiki, 1)
    (wiki / 'n0000.md').write_text('# External current body with changed size\n')
    from wiki import storage
    monkeypatch.setattr(storage, 'read_note', lambda *a: pytest.fail('search read external body'))
    page = s.search_notes('common')
    assert len(page.items) == 1 and page.freshness.state == 'stale'


def test_search_and_resolver_are_authenticated_and_target_encoding_is_strict(wiki, reader):
    search_api()
    from django.test import Client
    assert Client().get('/search/').status_code == 302
    assert Client().get('/resolve/', {'source': 'note.md', 'target': 'other'}).status_code == 302
    (wiki / 'note.md').write_text('# Source')
    (wiki / '\ufffd.md').write_text('# Should not match repaired encoding')
    response = reader.get('/resolve/?source=note.md&target=%FF.md&kind=wiki')
    assert response.json()['href'] is None and response.json()['state'] != 'resolved'


def test_oversized_heading_search_payload_caps_title_without_rewriting_projection(wiki, reader):
    s = search_api()
    from indexing import worker
    from indexing.models import IndexedNote
    title = 'LongHeading' * 6000
    source = '# ' + title + '\n\nuniqueoversizedheadingneedle\n'
    (wiki / 'large-heading.md').write_text(source)
    drain(worker)
    page = s.search_notes('uniqueoversizedheadingneedle')
    assert len(page.items) == 1 and len(page.items[0].title) == 512
    assert IndexedNote.objects.get(generation__state='active', path='large-heading.md').title == title
    response = reader.get('/search/', {'q': 'uniqueoversizedheadingneedle'})
    assert response.status_code == 200 and len(response.content) < 10000
    assert (wiki / 'large-heading.md').read_text() == source
