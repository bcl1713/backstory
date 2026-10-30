"""Bounded authoritative independent note reads never silently truncate."""
import pytest
from tests.integration.test_storage import wiki
from tests.integration.test_browsing import reader
pytestmark = pytest.mark.django_db


def read_many(reader, paths):
    return reader.post('/tools/read-many/', {'paths': paths}, content_type='application/json')


def test_multiple_reads_preserve_complete_source_and_revisions(reader, wiki):
    (wiki / 'a.md').write_bytes(b'\xef\xbb\xbf# A\r\n')
    (wiki / 'b.md').write_text('# B\n')
    result = read_many(reader, ['a.md', 'b.md']).json()
    assert result['state'] == 'complete'
    assert result['atomic_snapshot'] is False
    assert [item['path'] for item in result['results']] == ['a.md', 'b.md']
    assert result['results'][0]['source'] == '# A\r\n'
    assert result['results'][0]['bom'] is True
    assert result['results'][0]['revision'] == reader.get('/tools/read/', {'path': 'a.md'}).json()['revision']


def test_mixed_outcomes_keep_success(reader, wiki):
    (wiki / 'ok.md').write_text('ok')
    (wiki / 'invalid.md').write_bytes(b'\xff')
    (wiki / 'symlink.md').symlink_to(wiki / 'ok.md')
    result = read_many(reader, ['ok.md', 'missing.md', '../outside.md', 'invalid.md', 'symlink.md']).json()
    assert result['state'] == 'partial'
    assert [item['state'] for item in result['results']] == ['ok', 'missing', 'denied', 'unreadable', 'denied']
    assert result['results'][0]['source'] == 'ok'


@pytest.mark.parametrize('paths', [[], ['a.md'] * 2, ['a.md'] * 9, 'a.md', [42]])
def test_invalid_top_level_is_rejected_before_read(reader, wiki, paths, monkeypatch):
    import wiki.tool_reads as reads
    monkeypatch.setattr(reads, 'read_note', lambda *a: pytest.fail('invalid request read storage'))
    assert read_many(reader, paths).status_code == 400


def test_aggregate_budget_reports_unprocessed_without_truncation(reader, wiki, monkeypatch):
    import wiki.tool_reads as reads
    monkeypatch.setattr(reads, 'MAX_TOTAL_BYTES', 5)
    (wiki / 'a.md').write_text('four')
    (wiki / 'b.md').write_text('four')
    (wiki / 'c.md').write_text('four')
    result = read_many(reader, ['a.md', 'b.md', 'c.md']).json()
    assert result['results'][0]['source'] == 'four'
    assert all(item['state'] == 'unprocessed' and 'source' not in item for item in result['results'][1:])
    assert result['state'] == 'partial'


def test_read_many_requires_live_session(reader, wiki):
    reader.logout()
    assert read_many(reader, ['a.md']).status_code == 401


def test_per_note_size_and_time_budget(reader, wiki, settings, monkeypatch):
    import wiki.tool_reads as reads
    settings.BACKSTORY_NOTE_MAX_BYTES = 4
    (wiki / 'large.md').write_text('too large')
    (wiki / 'small.md').write_text('ok')
    result = read_many(reader, ['large.md', 'small.md']).json()
    assert result['results'][0]['state'] == 'oversized'
    assert result['results'][1]['source'] == 'ok'
    times = iter([0, 0, 3])
    monkeypatch.setattr(reads.time, 'monotonic', lambda: next(times))
    result = read_many(reader, ['small.md', 'large.md']).json()
    assert result['results'][0]['source'] == 'ok'
    assert result['results'][1] == {'path': 'large.md', 'state': 'unprocessed', 'reason_code': 'time_budget'}


def test_reads_are_per_note_observations_not_a_snapshot(reader, wiki, monkeypatch):
    import wiki.tool_reads as reads
    (wiki / 'a.md').write_text('first')
    (wiki / 'b.md').write_text('before')
    original = reads.read_note
    def changing(path):
        note = original(path)
        if path == 'a.md':
            (wiki / 'b.md').write_text('after')
        return note
    monkeypatch.setattr(reads, 'read_note', changing)
    result = read_many(reader, ['a.md', 'b.md']).json()
    assert result['results'][1]['source'] == 'after'
    assert result['atomic_snapshot'] is False


def test_read_many_requires_csrf(reader, wiki):
    from django.test import Client
    protected = Client(enforce_csrf_checks=True)
    protected.cookies = reader.cookies
    assert read_many(protected, ['a.md']).status_code == 403
