import json
import pytest
from tests.integration.test_saves import save, revision, reader, wiki

pytestmark = pytest.mark.django_db

@pytest.fixture(autouse=True)
def fixed_date(monkeypatch):
    monkeypatch.setattr('wiki.saves.wiki_date', lambda: '2026-10-29', raising=False)


def test_save_updates_metadata_and_returns_final_revision(reader, wiki):
    before = '---\nmodified: 2020-01-01\n---\nBody\n'
    (wiki / 'note.md').write_text(before)
    response = save(reader, before, revision(before.encode()))
    assert response.status_code == 200
    assert 'modified: 2026-10-29' in response.json()['source']
    assert response.json()['revision'] == revision((wiki / 'note.md').read_bytes())
    again = save(reader, response.json()['source'], response.json()['revision'])
    assert again.json()['state'] == 'noop'


def test_new_note_initializes_metadata(reader, wiki):
    response = save(reader, '---\ntitle: New Note\n---\nBody\n', create=True)
    assert response.status_code == 200
    for field in ('created: 2026-10-29', 'modified: 2026-10-29', 'id: "new-note"'):
        assert field in response.json()['source']


def test_tool_save_uses_same_metadata_and_authoritative_readback(reader, wiki):
    source = '---\ntitle: Old\nmodified: 2020-01-01\n---\nBody\n'
    (wiki / 'note.md').write_text(source)
    response = reader.post('/tools/save/', data=json.dumps({'path': 'note.md', 'source': source.replace('title: Old', 'title: New'), 'revision': revision(source.encode())}), content_type='application/json')
    assert response.status_code == 200
    data = response.json()
    assert data['authoritative'] is True
    assert '2026-10-29' in data['source'] and 'Old' in data['source']
    assert data['revision'] == revision((wiki / 'note.md').read_bytes())
