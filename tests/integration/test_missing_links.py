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
