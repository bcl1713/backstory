import os
import pytest
from tests.integration.test_storage import wiki
from tests.integration.test_browsing import reader
from tests.integration.test_resolution import build

pytestmark = pytest.mark.django_db(transaction=True)


def test_navigation_requires_authentication(client, wiki):
    assert client.get('/navigation/?date=2026-10-26&timezone=UTC').status_code == 302


@pytest.mark.parametrize('query', [
    {}, {'date': '2026-02-30', 'timezone': 'UTC'},
    {'date': '20261026', 'timezone': 'UTC'},
    {'date': '2026-10-26', 'timezone': 'Not/A_Zone'},
    {'date': '2026-10-26', 'timezone': ''},
])
def test_navigation_rejects_implicit_or_invalid_dates_and_timezones(reader, wiki, query):
    assert reader.get('/navigation/', query).status_code == 400


def test_today_resolves_existing_date_named_note_without_creating_missing_notes(reader, wiki):
    build(wiki, {'daily/2026/2026-10-26.md': '# Today', 'other.md': '# Other'})
    before = set(wiki.rglob('*'))
    response = reader.get('/navigation/', {'date': '2026-10-26', 'timezone': 'Pacific/Kiritimati'})
    assert response.status_code == 200
    result = response.json()
    assert result['date'] == '2026-10-26' and result['timezone'] == 'Pacific/Kiritimati'
    assert result['today']['href'] == '/notes/daily/2026/2026-10-26.md'
    missing = reader.get('/navigation/', {'date': '2026-10-27', 'timezone': 'America/Adak'}).json()
    assert missing['today']['state'] == 'missing' and missing['today']['href'] is None
    assert set(wiki.rglob('*')) == before


def test_ambiguous_today_is_not_arbitrarily_selected(reader, wiki):
    build(wiki, {'one/2026-10-26.md': '# One', 'two/2026-10-26.md': '# Two'})
    data = reader.get('/navigation/', {'date': '2026-10-26', 'timezone': 'UTC'}).json()
    assert data['today']['state'] == 'ambiguous' and data['today']['href'] is None


def test_recent_notes_are_bounded_ordered_and_revalidated(reader, wiki, settings):
    files = {f'note-{n}.md': '# Synthetic' for n in range(9)}
    build(wiki, files)
    for n in range(9):
        os.utime(wiki / f'note-{n}.md', ns=(1700000000000000000 + n, 1700000000000000000 + n))
    from indexing.queue import request_scan
    from tests.integration.test_indexing import drain
    from indexing import worker
    request_scan('incremental')
    drain(worker)
    settings.BACKSTORY_EXCLUSIONS = ['note-8.md']
    (wiki / 'note-7.md').unlink()
    result = reader.get('/navigation/', {'date': '2026-10-26', 'timezone': 'UTC'}).json()
    assert [entry['path'] for entry in result['recent']] == ['note-6.md', 'note-5.md', 'note-4.md', 'note-3.md', 'note-2.md']
    assert all(entry['href'].startswith('/notes/') for entry in result['recent'])
    (wiki / '.backstory-marker').unlink()
    assert reader.get('/navigation/', {'date': '2026-10-26', 'timezone': 'UTC'}).status_code == 503
