"""Missing wikilinks offer explicit, non-writing creation actions."""
import json
from urllib.parse import parse_qs, urlsplit

import pytest

from tests.integration.test_storage import wiki
from tests.integration.test_browsing import reader
from tests.integration.test_indexing import drain
from indexing import worker
from wiki.links import resolve_link
from wiki.markdown import render_preview

pytestmark = pytest.mark.django_db(transaction=True)


@pytest.fixture
def ready(wiki):
    (wiki / 'Notes').mkdir()
    (wiki / 'Notes/Source.md').write_bytes(b'# Source\r\n\n[[Ideas/New#Details|My label]]\n')
    (wiki / 'Ideas').mkdir()
    drain(worker)
    return wiki


@pytest.mark.parametrize(('target', 'path'), [
    ('Ideas/New#Details|My label', 'Ideas/New.md'),
    ('Ideas/New.md|Alias', 'Ideas/New.md'),
    ('../Ideas/New#Details', 'Ideas/New.md'),
    ('/Ideas/New', 'Ideas/New.md'),
    ('Fresh', 'Fresh.md'),
    ('100% new', '100% new.md'),
    ('%2e%2e', '%2e%2e.md'),
])
def test_missing_wikilink_action_preserves_target_and_prefills_path(ready, target, path):
    result = resolve_link('Notes/Source.md', target, 'wiki')
    assert result.state == 'missing' and result.href is None
    assert result.create_path == path
    action = urlsplit(result.action_href)
    assert action.path == '/new/link/'
    assert parse_qs(action.query) == {'source': ['Notes/Source.md'], 'target': [target]}
    assert not (ready / path).exists()


def test_preview_missing_alias_is_accessible_and_does_not_write(ready):
    source = (ready / 'Notes/Source.md').read_bytes()
    before = {str(p.relative_to(ready)): p.stat().st_mtime_ns for p in ready.rglob('*')}
    html = render_preview('[[Ideas/New#Details|My <label>]]', 'Notes/Source.md').html
    assert '<a ' in html and 'class="link-missing"' in html
    assert 'My &lt;label&gt;' in html and 'Create note: Ideas/New.md' in html
    assert '/new/link/?' in html and '#Details' not in html.split('href="')[1].split('"')[0]
    assert (ready / 'Notes/Source.md').read_bytes() == source
    assert {str(p.relative_to(ready)): p.stat().st_mtime_ns for p in ready.rglob('*')} == before


@pytest.mark.parametrize('target', ['AGENTS', '.hidden', 'secret', '../AGENTS.md', 'Ideas',
                                    'Ideas.png', 'Absent/New', 'https://example.org/new',
                                    '../../outside', '//example.org/new'])
def test_unsafe_non_note_and_missing_parent_targets_offer_no_creation(ready, target):
    result = resolve_link('Notes/Source.md', target, 'wiki')
    assert result.action_href is None and result.create_path is None


def test_symlink_and_unavailable_storage_offer_no_creation(ready):
    (ready / 'Linked.md').symlink_to(ready / 'Notes/Source.md')
    assert resolve_link('Notes/Source.md', 'Linked', 'wiki').action_href is None
    (ready / '.backstory-marker').unlink()
    result = resolve_link('Notes/Source.md', 'Fresh', 'wiki')
    assert result.state == 'unavailable' and result.action_href is None


def test_existing_note_missing_heading_and_attachment_do_not_create(ready):
    (ready / 'Existing.md').write_text('# Existing\n')
    (ready / 'picture.png').write_bytes(b'synthetic image')
    for target, href in [('Existing#Absent|Label', '/notes/Existing.md#preview-absent'),
                         ('/Existing#Absent', '/notes/Existing.md#preview-absent'),
                         ('picture.png', '/attachments/picture.png')]:
        result = resolve_link('Notes/Source.md', target, 'wiki')
        assert result.href == href and result.action_href is None
    assert resolve_link('Notes/Source.md', 'Missing.md', 'markdown').action_href is None


def test_ambiguous_alias_exposes_choices_without_creation_guess(ready):
    for folder in ['a', 'b']:
        (ready / folder).mkdir()
        (ready / folder / 'Target.md').write_text('---\naliases: [Shared]\n---\n# Target\n')
    from indexing.queue import request_scan
    request_scan('rebuild')
    drain(worker)
    result = resolve_link('Notes/Source.md', 'Shared#Part|Shown', 'wiki')
    assert result.state == 'ambiguous' and result.href is None
    assert result.create_path is None
    assert result.choices == ('a/Target.md', 'b/Target.md')
    assert result.action_href.startswith('/new/link/?')


def test_pending_and_partial_index_cannot_establish_missing(ready):
    from indexing.queue import request_scan
    request_scan('rebuild')
    for target in ['Fresh', 'Ideas/New']:
        result = resolve_link('Notes/Source.md', target, 'wiki')
        assert result.state == 'unavailable' and result.action_href is None


def test_link_creation_get_prefills_existing_editor_without_writes(ready, reader):
    before = {str(p.relative_to(ready)): p.stat().st_mtime_ns for p in ready.rglob('*')}
    response = reader.get('/new/link/', {'source': 'Notes/Source.md', 'target': 'Ideas/New#Details|Label'})
    assert response.status_code == 200
    html = response.content.decode()
    assert 'id="note-filename"' in html and 'value="New.md"' in html
    assert 'Ideas' in html and 'preview-details' in html
    assert response['Cache-Control'] == 'no-store'
    assert {str(p.relative_to(ready)): p.stat().st_mtime_ns for p in ready.rglob('*')} == before


def test_link_entry_rechecks_existing_note_instead_of_offering_creation(ready, reader):
    result = resolve_link('Notes/Source.md', 'Ideas/New#Part', 'wiki')
    (ready / 'Ideas/New.md').write_text('# Created concurrently\n')
    response = reader.get(result.action_href)
    assert response.status_code == 200
    assert b'/notes/Ideas/New.md#preview-part' in response.content
    assert b'Open existing note' in response.content
    assert b'id="note-filename"' not in response.content
    assert (ready / 'Ideas/New.md').read_text() == '# Created concurrently\n'


def test_ambiguous_entry_requires_explicit_destination_choice(ready, reader):
    for folder in ['a', 'b']:
        (ready / folder).mkdir()
        (ready / folder / 'Target.md').write_text('---\naliases: [Shared]\n---\n# Target\n')
    from indexing.queue import request_scan
    request_scan('rebuild')
    drain(worker)
    query = {'source': 'Notes/Source.md', 'target': 'Shared#Part|Label'}
    response = reader.get('/new/link/', query)
    assert response.status_code == 200
    assert b'/notes/a/Target.md#preview-part' in response.content
    assert b'/notes/b/Target.md#preview-part' in response.content
    assert b'id="note-filename"' not in response.content
    response = reader.get('/new/link/', {**query, 'destination': 'Ideas/Shared.md'})
    assert response.status_code == 200 and b'value="Shared.md"' in response.content
    assert not (ready / 'Ideas/Shared.md').exists()


@pytest.mark.parametrize('query', [
    'source=Notes/Source.md&target=%FF',
    'source=Notes/Source.md&target=%ZZ',
    'source=Notes/Source.md&target=Fresh&destination=%FF.md',
    'source=Notes/Source.md&target=Fresh&destination=../outside.md',
    'source=Notes/Source.md&target=Fresh&destination=AGENTS.md',
    'source=Notes/Source.md&target=Fresh&destination=Missing/New.md',
    'source=Notes/Source.md&target=Fresh&destination=picture.png',
])
def test_link_entry_rejects_invalid_encoding_and_unsafe_destinations(ready, reader, query):
    assert reader.get('/new/link/?' + query).status_code == 404


def test_link_entry_auth_method_readiness_and_literal_percent_path(ready, reader):
    from django.test import Client
    query = {'source': 'Notes/Source.md', 'target': '%2e%2e#Details|Label'}
    assert Client().get('/new/link/', query).status_code == 302
    assert reader.post('/new/link/', query).status_code == 405
    response = reader.get('/new/link/', query)
    assert response.status_code == 200 and b'value="%2e%2e.md"' in response.content
    (ready / '.backstory-marker').unlink()
    assert reader.get('/new/link/', query).status_code == 503


def test_link_creation_uses_guarded_save_and_keeps_original_source(ready, reader, monkeypatch):
    source = (ready / 'Notes/Source.md').read_bytes()
    query = {'source': 'Notes/Source.md', 'target': 'Ideas/New#Part|Label'}
    assert reader.get('/new/link/', query).status_code == 200
    body = json.dumps({'source': '# New\n', 'mode': 'formatted'})
    assert reader.post('/save/Ideas/New.md', data=body, content_type='application/json').status_code == 428
    from wiki import saves
    monkeypatch.setattr(saves, 'enqueue_note', lambda *args: False)
    response = reader.post('/save/Ideas/New.md', data=body, content_type='application/json', HTTP_IF_NONE_MATCH='*')
    assert response.status_code == 200 and response.json()['state'] == 'saved_index_delayed'
    assert reader.post('/save/Ideas/New.md', data=body, content_type='application/json', HTTP_IF_NONE_MATCH='*').status_code == 412
    result = resolve_link('Notes/Source.md', 'Ideas/New#Part|Label', 'wiki')
    assert result.href == '/notes/Ideas/New.md#preview-part'
    assert (ready / 'Notes/Source.md').read_bytes() == source


def test_publication_race_with_identical_content_is_still_a_creation_collision(ready, reader, monkeypatch):
    from wiki import saves
    original_link = saves.os.link
    def concurrent_create(staged, name, **kwargs):
        (ready / 'Ideas/New.md').write_bytes(b'# New\n')
        return original_link(staged, name, **kwargs)
    monkeypatch.setattr(saves.os, 'link', concurrent_create)
    response = reader.post('/save/Ideas/New.md', data=json.dumps({'source': '# New\n', 'mode': 'formatted'}),
                           content_type='application/json', HTTP_IF_NONE_MATCH='*')
    assert response.status_code == 412
    assert response.json()['state'] == 'conflict'
    assert (ready / 'Ideas/New.md').read_bytes() == b'# New\n'


def test_unreadable_target_never_offers_creation(ready, monkeypatch):
    from wiki import links
    original = links.os.stat
    def deny(name, *args, **kwargs):
        if name == 'Unreadable.md':
            raise PermissionError('synthetic denied target')
        return original(name, *args, **kwargs)
    monkeypatch.setattr(links.os, 'stat', deny)
    result = resolve_link('Notes/Source.md', 'Unreadable', 'wiki')
    assert result.state == 'unavailable' and result.action_href is None


def test_alias_of_now_forbidden_note_does_not_become_a_creation_candidate(ready, settings):
    (ready / 'Ideas/Private.md').write_text('---\naliases: [RestrictedAlias]\n---\n# Private\n')
    from indexing.queue import request_scan
    request_scan('rebuild')
    drain(worker)
    settings.BACKSTORY_EXCLUSIONS = ['Ideas/Private.md']
    result = resolve_link('Notes/Source.md', 'RestrictedAlias', 'wiki')
    assert result.state == 'missing' and result.action_href is None
    assert result.choices == ()
