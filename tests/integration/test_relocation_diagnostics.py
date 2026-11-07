"""Fail-closed preview diagnostics on disposable, authorized wiki sources."""
import pytest

from tests.integration.test_browsing import reader
from tests.integration.test_storage import wiki
from tests.integration.test_relocations import preview
from wiki.contracts import StorageError
from wiki.models import MoveOperation

pytestmark = pytest.mark.django_db


@pytest.mark.parametrize('bad_path', ['From/Bad.md', 'Elsewhere/<Bad>.md'])
@pytest.mark.parametrize('exception,reason', [(ValueError, 'projection_parse_failed'), (RecursionError, 'projection_recursion_limit')])
def test_preview_identifies_first_failure_without_mutating_or_leaking(reader, wiki, monkeypatch, bad_path, exception, reason):
    from wiki import links
    (wiki / 'From').mkdir()
    (wiki / 'From/Good.md').write_text('# Good\n')
    target = wiki / bad_path
    target.parent.mkdir(exist_ok=True)
    target.write_text('---\ntitle: Bad\n---\nPRIVATE-SOURCE\n')
    (wiki / 'Inbound.md').write_text('[[From/Good]]\n')
    original = {str(path.relative_to(wiki)): path.read_bytes() for path in wiki.rglob('*.md')}
    real_extract = links.extract_links
    def fail(source):
        if 'PRIVATE-SOURCE' in source:
            raise exception('/absolute/private/path SECRET-EXCEPTION')
        return real_extract(source)
    monkeypatch.setattr(links, 'extract_links', fail)
    with pytest.raises(StorageError) as caught:
        preview(reader, 'From', 'To')
    assert caught.value.reason_code == 'incomplete_link_inventory'
    assert caught.value.inventory_failure == {'path': bad_path, 'phase': 'links', 'reason': reason}
    response = reader.post('/move/', {'source': 'From', 'destination': 'To'})
    assert response.status_code == 409
    assert response.context['inventory_failure'] == caught.value.inventory_failure
    body = response.content.decode()
    from django.utils.html import escape
    assert str(escape(bad_path)) in body
    assert 'No move or link edits occurred' in body and 'new preview' in body
    assert 'PRIVATE-SOURCE' not in body and 'SECRET-EXCEPTION' not in body
    assert '/absolute/private/path' not in body and str(wiki) not in body
    assert not MoveOperation.objects.exists() and not (wiki / 'To').exists()
    assert original == {str(path.relative_to(wiki)): path.read_bytes() for path in wiki.rglob('*.md')}
    # Correct the actual synthetic source: a new preview succeeds without index work.
    target.write_text('# Fixed\n')
    assert preview(reader, 'From', 'To').state == 'preview'


def test_protected_parse_failure_is_never_read_or_reported(reader, wiki, monkeypatch):
    from wiki import links
    (wiki / 'From.md').write_text('# From\n')
    (wiki / '.private').mkdir()
    (wiki / '.private/Hidden.md').write_text('PRIVATE-SOURCE')
    real_extract = links.extract_links
    def fail(source):
        assert 'PRIVATE-SOURCE' not in source
        return real_extract(source)
    monkeypatch.setattr(links, 'extract_links', fail)
    assert preview(reader, 'From.md', 'To.md').state == 'preview'


def test_report_is_bounded_to_one_failure(reader, wiki, monkeypatch):
    from wiki import links
    (wiki / 'From.md').write_text('# From\n')
    for name in ('A.md', 'B.md'):
        (wiki / name).write_text('---\ntitle: Invalid\n---\nFAIL\n')
    real_extract = links.extract_links
    calls = []
    def fail(source):
        if 'FAIL' in source:
            calls.append(source)
            raise ValueError('private exception')
        return real_extract(source)
    monkeypatch.setattr(links, 'extract_links', fail)
    with pytest.raises(StorageError) as caught:
        preview(reader, 'From.md', 'To.md')
    assert caught.value.inventory_failure['path'] in {'A.md', 'B.md'}
    # Source validation may project notes before resolver construction. The report
    # itself is one fixed-size failure record, not an unbounded error list.
    assert set(caught.value.inventory_failure) == {'path', 'phase', 'reason'}
    assert not MoveOperation.objects.exists()


def test_other_inventory_refusal_keeps_its_reason(reader, wiki, monkeypatch):
    from wiki import relocation_views
    (wiki / 'From.md').write_text('# From\n')
    def refuse(*args):
        raise StorageError('move_inventory_limit', 409)
    monkeypatch.setattr(relocation_views, 'preview_move', refuse)
    response = reader.post('/move/', {'source': 'From.md', 'destination': 'To.md'})
    assert response.status_code == 409
    assert response.context['inventory_failure'] is None
    assert b'move_inventory_limit' in response.content
    assert b'first failing note' not in response.content
