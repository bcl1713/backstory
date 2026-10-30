"""Explicit folder creation shares the authenticated filesystem boundary."""
import pytest
from tests.integration.test_storage import wiki
from tests.integration.test_browsing import reader
pytestmark = pytest.mark.django_db(transaction=True)


def create(reader, path):
    return reader.post('/tools/create-folder/', {'path': path}, content_type='application/json')


def test_create_folder_and_existing_are_authoritative(reader, wiki):
    result = create(reader, '日本語 Folder')
    assert result.status_code == 201
    assert result.json()['state'] == 'created'
    assert result.json()['path'] == '日本語 Folder'
    assert (wiki / '日本語 Folder').is_dir()
    assert list((wiki / '日本語 Folder').iterdir()) == []
    assert create(reader, '日本語 Folder').json()['state'] == 'already_exists'
    (wiki / '日本語 Folder/note.md').write_text('kept')
    assert create(reader, '日本語 Folder').json()['state'] == 'already_exists'
    assert any(e['path'] == '日本語 Folder' for e in reader.get('/tools/list/').json()['entries'])


@pytest.mark.parametrize('path', ['', '../escape', '/absolute', '.hidden', 'AGENTS.md', 'missing/child', 'file.md', 'linked/child', 'linked'])
def test_refuses_unsafe_or_missing_parent(reader, wiki, path):
    (wiki / 'file.md').write_text('keep')
    (wiki / 'real').mkdir()
    (wiki / 'linked').symlink_to(wiki / 'real', target_is_directory=True)
    response = create(reader, path)
    assert response.status_code in (400, 404, 409)
    assert not (wiki / 'missing').exists()
    assert not (wiki / 'real/child').exists()
    assert (wiki / 'file.md').read_text() == 'keep'


def test_requires_live_session_and_ready_storage(reader, wiki):
    (wiki / '.backstory-marker').unlink()
    assert create(reader, 'new').status_code == 503
    reader.logout()
    assert create(reader, 'new').status_code == 401
    assert not (wiki / 'new').exists()


def test_folder_ui_is_explicit_and_csrf_protected(reader, wiki):
    page = reader.get('/new-folder/?folder=')
    assert page.status_code == 200
    assert b'csrfmiddlewaretoken' in page.content
    assert b'root-relative' in page.content
    result = reader.post('/new-folder/', {'path': 'UI folder'})
    assert result.status_code == 201
    assert (wiki / 'UI folder').is_dir()


def test_recovery_pause_prevents_creation(reader, wiki, monkeypatch):
    from wiki import relocations
    from wiki.contracts import StorageError
    def paused():
        raise StorageError('move_recovery_required', 409)
    monkeypatch.setattr(relocations, 'assert_writes_available', paused)
    assert create(reader, 'new').json()['reason_code'] == 'move_recovery_required'
    assert not (wiki / 'new').exists()


def test_parent_changed_before_publication_is_refused(reader, wiki, monkeypatch):
    from wiki import folders
    monkeypatch.setattr(folders, '_same_parent', lambda *a: False)
    assert create(reader, 'new').json()['reason_code'] == 'parent_changed'
    assert not (wiki / 'new').exists()


def test_parent_changed_after_publication_is_uncertain(reader, wiki, monkeypatch):
    from wiki import folders
    answers = iter([True, False])
    monkeypatch.setattr(folders, '_same_parent', lambda *a: next(answers))
    result = create(reader, 'new')
    assert result.status_code == 409
    assert result.json()['state'] == 'uncertain'
    assert result.json()['inspect_before_retry'] is True
    assert (wiki / 'new').is_dir()


def test_filesystem_failure_is_safe(reader, wiki, monkeypatch):
    from wiki import folders
    original = folders.os.mkdir
    def denied(*a, **kw):
        if 'dir_fd' not in kw:
            return original(*a, **kw)
        raise PermissionError('sensitive absolute mount path')
    monkeypatch.setattr(folders.os, 'mkdir', denied)
    response = create(reader, 'new')
    assert response.status_code == 503
    assert b'sensitive' not in response.content


def test_create_requires_csrf(reader, wiki):
    from django.test import Client
    csrf_client = Client(enforce_csrf_checks=True)
    csrf_client.cookies = reader.cookies
    assert create(csrf_client, 'new').status_code == 403
    assert not (wiki / 'new').exists()


def test_concurrent_creation_has_one_creator(wiki):
    from concurrent.futures import ThreadPoolExecutor
    from types import SimpleNamespace
    from wiki.folders import create_folder
    from django.db import close_old_connections
    def attempt():
        try:
            return create_folder('Concurrent', SimpleNamespace(is_authenticated=True, is_active=True))['state']
        finally:
            close_old_connections()
    with ThreadPoolExecutor(max_workers=2) as pool:
        outcomes = list(pool.map(lambda _: attempt(), range(2)))
    assert sorted(outcomes) == ['already_exists', 'created']


def test_replaced_parent_is_not_followed(reader, wiki, monkeypatch):
    from wiki import folders
    (wiki / 'parent').mkdir()
    original = folders._same_parent
    def replace(path, descriptor):
        (wiki / 'parent').rename(wiki / 'old-parent')
        (wiki / 'parent').mkdir()
        return original(path, descriptor)
    monkeypatch.setattr(folders, '_same_parent', replace)
    assert create(reader, 'parent/new').json()['reason_code'] == 'parent_changed'
    assert not (wiki / 'parent/new').exists()
    assert not (wiki / 'old-parent/new').exists()
