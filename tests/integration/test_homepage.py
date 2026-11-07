"""Canonical home is an ordinary root note; tree URLs remain explicit."""
import pytest
from tests.integration.test_browsing import reader
from tests.integration.test_storage import wiki

pytestmark = pytest.mark.django_db

@pytest.mark.parametrize('source', ['', '# My home\n\n[[Other]] and ![image](image.png)'])
def test_home_is_normal_index_note(reader, wiki, source):
    (wiki / 'index.md').write_text(source)
    home = reader.get('/')
    note = reader.get('/notes/index.md')
    assert home.status_code == 200
    assert home.context['note'].path == 'index.md'
    assert home.context['note'].source == source
    assert home['ETag'] == note['ETag']
    assert home['Cache-Control'] == 'no-store'
    assert b'/?folder=' in home.content
    assert (wiki / 'index.md').read_text() == source


def test_home_responds_to_index_added_removed_and_exact_case(reader, wiki):
    (wiki / 'README.md').write_text('not home')
    (wiki / 'Index.md').write_text('not home')
    assert 'note' not in reader.get('/').context
    (wiki / 'index.md').write_text('home')
    assert reader.get('/').context['note'].path == 'index.md'
    (wiki / 'index.md').unlink()
    assert 'note' not in reader.get('/').context


def test_explicit_tree_and_folder_ignore_index(reader, wiki):
    (wiki / 'index.md').write_text('root home')
    (wiki / 'folder').mkdir()
    (wiki / 'folder' / 'index.md').write_text('not a folder home')
    for url in ['/?folder=', '/?folder=folder', '/?cursor=']:
        response = reader.get(url)
        assert response.status_code == 200
        assert 'note' not in response.context
        assert 'entries' in response.context


@pytest.mark.parametrize('kind', ['directory', 'symlink', 'invalid_utf8', 'excluded'])
def test_invalid_index_is_not_missing(reader, wiki, settings, kind):
    index = wiki / 'index.md'
    if kind == 'directory': index.mkdir()
    elif kind == 'symlink': index.symlink_to(wiki / 'missing.md')
    elif kind == 'invalid_utf8': index.write_bytes(b'\xff')
    else:
        index.write_text('private')
        settings.BACKSTORY_EXCLUSIONS = ['index.md']
    response = reader.get('/')
    assert response.status_code >= 400
    assert 'entries' not in response.context


def test_home_storage_failure_and_expired_login(reader, wiki):
    (wiki / 'index.md').write_text('private home')
    (wiki / '.backstory-marker').unlink()
    response = reader.get('/')
    assert b'Storage unavailable' in response.content
    assert b'private home' not in response.content
    reader.logout()
    assert reader.get('/').status_code == 302


def test_root_tree_pagination_does_not_redirect_home(reader, wiki):
    (wiki / 'index.md').write_text('home')
    for number in range(105):
        (wiki / f'note-{number:03}.md').write_text('')
    first = reader.get('/?folder=')
    next_url = first.context['next_url']
    assert 'folder=' in next_url
    second = reader.get(next_url)
    assert second.status_code == 200
    assert 'note' not in second.context
    assert len(first.context['entries']) + len(second.context['entries']) == 106


def test_home_read_error_not_masked_as_missing(reader, wiki, monkeypatch):
    from wiki.contracts import StorageError
    def unavailable(path):
        raise StorageError('storage_io_error', 503)
    monkeypatch.setattr('wiki.views.read_note', unavailable)
    response = reader.get('/')
    assert response.status_code == 503
    assert b'storage_io_error' in response.content
    assert 'entries' not in response.context
