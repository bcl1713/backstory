"""Indexed link suggestions never bypass the ordinary storage/session policy."""
import pytest

from tests.integration.test_storage import wiki
from tests.integration.test_browsing import reader
from tests.integration.test_indexing import drain

pytestmark = pytest.mark.django_db(transaction=True)


def indexed(wiki):
    from indexing import worker
    (wiki / 'Projects').mkdir()
    (wiki / 'Projects/Atlas.md').write_text('---\ntitle: World building\naliases: [Setting guide, Terra]\n---\n# Atlas\nBODYONLYNEEDLE\n')
    (wiki / 'Other.md').write_text('---\naliases: [Setting guide]\n---\n# Other destination\n')
    (wiki / 'Straße.md').write_text('# Grüße\n')
    drain(worker)


def suggestions(reader, query=''):
    response = reader.get('/tools/complete/', {'query': query})
    assert response.status_code == 200
    return response.json()


@pytest.mark.parametrize('query,path', [('Atl', 'Projects/Atlas.md'), ('Projects/', 'Projects/Atlas.md'),
                                      ('world', 'Projects/Atlas.md'), ('terra', 'Projects/Atlas.md'),
                                      ('STRASSE', 'Straße.md')])
def test_completion_matches_names_without_body_search(reader, wiki, query, path):
    indexed(wiki)
    result = suggestions(reader, query)
    assert path in [item['path'] for item in result['items']]
    assert result['freshness']['state'] == 'ready'
    assert result['authoritative'] is False
    assert suggestions(reader, 'BODYONLYNEEDLE')['items'] == []


def test_duplicate_aliases_keep_distinct_paths_and_original_alias_label(reader, wiki):
    indexed(wiki)
    items = suggestions(reader, 'setting')['items']
    assert [(item['path'], item['label']) for item in items] == [
        ('Other.md', 'Setting guide'), ('Projects/Atlas.md', 'Setting guide')]
    assert suggestions(reader, 'world')['items'][0]['label'] == 'World building'


def test_completion_is_bounded_and_omits_unrepresentable_paths(reader, wiki):
    from indexing import worker
    for n in range(25):
        (wiki / f'Bound{n:02}.md').write_text('# Bound note\n')
    for name in ['Bound#fragment.md', 'Bound|label.md', 'Bound[bracket].md']:
        (wiki / name).write_text('# Bound note\n')
    drain(worker)
    result = suggestions(reader, 'Bound')
    assert len(result['items']) == 20 and result['truncated'] is True
    assert all(not any(c in item['path'] for c in '#|[]') for item in result['items'])


def test_wildcards_are_literal_and_display_text_is_bounded(reader, wiki):
    from indexing import worker
    (wiki / '100%_real.md').write_text('---\ntitle: "' + 'X' * 700 + '"\n---\n')
    (wiki / '100different.md').write_text('# Different\n')
    drain(worker)
    items = suggestions(reader, '%_')['items']
    assert [item['path'] for item in items] == ['100%_real.md']
    assert len(items[0]['title']) <= 512 and len(items[0]['label']) <= 512


def test_stale_deleted_and_now_excluded_candidates_are_omitted(reader, wiki, settings):
    indexed(wiki)
    (wiki / 'Projects/Atlas.md').write_text('# Changed since indexing\n')
    (wiki / 'Other.md').unlink()
    settings.BACKSTORY_EXCLUSIONS = ['Straße.md']
    result = suggestions(reader)
    assert result['items'] == []
    assert result['freshness']['state'] == 'stale'


def test_completion_requires_live_session_and_rejects_writes(reader, wiki):
    from django.test import Client
    assert Client().get('/tools/complete/').status_code == 401
    assert reader.post('/tools/complete/', {}).status_code == 405
    reader.logout()
    assert reader.get('/tools/complete/').status_code == 401


@pytest.mark.parametrize('query', ['x' * 257, 'bad\nquery', 'bad\\query', '\x00'])
def test_invalid_completion_query_is_rejected(reader, wiki, query):
    assert reader.get('/tools/complete/', {'query': query}).status_code == 400


def test_missing_storage_hides_suggestions(reader, wiki):
    indexed(wiki)
    (wiki / '.backstory-marker').unlink()
    response = reader.get('/tools/complete/', {'query': 'Atlas'})
    assert response.status_code == 503
    assert 'Atlas' not in response.content.decode()


def test_exact_alias_precedes_prefix_and_substring_matches(reader, wiki):
    from indexing import worker
    (wiki / 'Zulu.md').write_text('---\naliases: [Quest]\n---\n# Zulu\n')
    (wiki / 'A.md').write_text('# Questing\n')
    (wiki / 'B.md').write_text('# The quest continues\n')
    drain(worker)
    assert [item['path'] for item in suggestions(reader, 'quest')['items']] == ['Zulu.md', 'A.md', 'B.md']


def test_partial_index_and_query_budget_are_reported_without_false_absence(reader, wiki, monkeypatch):
    from indexing import worker, search
    for n in range(30):
        (wiki / f'Partial{n}.md').write_text('# Partial note\n')
    worker.run_batch()
    assert suggestions(reader, 'Partial')['freshness']['state'] == 'partial'
    drain(worker)
    monkeypatch.setattr(search, 'SQLITE_VM_STEPS', 1)
    result = suggestions(reader, 'Partial')
    assert result['items'] == [] and result['freshness']['limited'] is True


def test_display_text_is_plain_but_insertion_labels_respect_wikilink_delimiters(reader, wiki):
    from indexing import worker
    (wiki / 'Display.md').write_text('---\ntitle: "<img src=x onerror=bad> ]]"\naliases: ["Bad ]] alias"]\n---\n')
    drain(worker)
    item = suggestions(reader, 'Display')['items'][0]
    assert item['title'] == '<img src=x onerror=bad> ]]'
    assert item['label'] == 'Display'


def test_no_note_contents_are_read_during_suggestion_lookup(reader, wiki, monkeypatch):
    indexed(wiki)
    from wiki import storage
    def forbid(*args, **kwargs):
        pytest.fail('completion must not read note bodies')
    monkeypatch.setattr(storage, 'read_note', forbid)
    assert suggestions(reader, '/Projects/Atl')['items'][0]['path'] == 'Projects/Atlas.md'


@pytest.mark.parametrize('title,alias', [('Array]', 'Boundary]'), ('Windows\\Linux', 'Boundary\\alias')])
def test_generated_labels_must_be_representable_by_the_existing_resolver(reader, wiki, title, alias):
    import json
    from indexing import worker
    (wiki / 'Boundary.md').write_text('---\n' + json.dumps({'title': title, 'aliases': [alias]}) + '\n---\n')
    drain(worker)
    assert suggestions(reader, 'Boundary')['items'][0]['label'] == 'Boundary'
