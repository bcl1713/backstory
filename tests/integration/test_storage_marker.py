"""Storage metadata is presence-only and never public wiki content."""
import json
import os

import pytest
from django.contrib.auth import get_user_model
from django.db import connection

from tests.integration.test_browsing import reader
from tests.integration.test_indexing import drain
from tests.integration.test_storage import wiki


@pytest.fixture
def marker(wiki, settings):
    settings.BACKSTORY_IDENTITY_PATH = '.backstory-marker'
    path = wiki / settings.BACKSTORY_IDENTITY_PATH
    path.touch()
    return path


def test_hidden_marker_is_readable_presence_without_reading_contents(marker, monkeypatch):
    from wiki.readiness import check_readiness
    # Even large/non-UTF-8 contents are irrelevant; a read would fail this check.
    marker.write_bytes(b'\xff' * 100000)
    def no_read(*args, **kwargs):
        pytest.fail('readiness must never read marker contents')
    monkeypatch.setattr(os, 'read', no_read)
    assert check_readiness().state == 'ready'
    marker.write_bytes(b'changed')
    assert check_readiness().state == 'ready'


@pytest.mark.parametrize('kind', ['missing', 'directory', 'symlink', 'dangling', 'fifo', 'unreadable'])
def test_invalid_marker_means_unavailable(marker, kind, wiki):
    from wiki.readiness import check_readiness
    marker.unlink()
    if kind == 'directory':
        marker.mkdir()
    elif kind in {'symlink', 'dangling'}:
        target = wiki / 'ordinary-target.txt'
        if kind == 'symlink':
            target.write_bytes(b'existing symlink target')
        marker.symlink_to(target)
    elif kind == 'fifo':
        os.mkfifo(marker)
    elif kind == 'unreadable':
        marker.touch(mode=0)
    try:
        assert check_readiness().state == 'unavailable'
    finally:
        if kind == 'unreadable':
            marker.chmod(0o600)


@pytest.mark.parametrize('path', ['.env', '.silverbullet.auth.json', '.prettierrc', '.git', '.hidden/note.md', '../outside', '/absolute', 'a/../marker', '.backstory-tmp-marker'])
def test_marker_exception_does_not_admit_other_hidden_or_unsafe_files(marker, path):
    from wiki.policy import validate_path
    from wiki.contracts import PathDenied
    with pytest.raises(PathDenied):
        validate_path(path, 'identity')
    with pytest.raises(PathDenied):
        validate_path(path, 'content')


@pytest.mark.parametrize('configured', ['.backstory-marker', 'Reserved.md'])
@pytest.mark.django_db
def test_configured_marker_excluded_from_every_content_route(reader, wiki, settings, configured):
    from wiki.storage import list_folder
    settings.BACKSTORY_IDENTITY_PATH = configured
    marker = wiki / configured
    marker.write_bytes(b'administrative marker contents')
    (wiki / 'ordinary.md').write_text('# Ordinary')
    assert configured not in [entry.path for entry in list_folder('').entries]
    for route in ['notes', 'source', 'preview', 'attachments', 'history', 'folders']:
        response = reader.get(f'/{route}/{configured}')
        assert response.status_code == 404, (route, response.status_code)
        assert b'administrative marker contents' not in response.content
    for route in ['save', 'format', 'preview']:
        for mode in ['formatted', 'source_recovery']:
            response = reader.post(f'/{route}/{configured}', data=json.dumps({'source': '# Changed', 'mode': mode}),
                                   content_type='application/json', HTTP_IF_NONE_MATCH='*')
            assert response.status_code == 404, (route, mode, response.status_code)
    response = reader.post('/drafts/', data=json.dumps({'path': configured, 'source': 'draft'}), content_type='application/json')
    assert response.status_code == 404
    assert marker.read_bytes() == b'administrative marker contents'
    marker.unlink()
    assert reader.post(f'/save/{configured}', data=json.dumps({'source': '# New'}),
                       content_type='application/json', HTTP_IF_NONE_MATCH='*').status_code == 404
    assert not marker.exists()


@pytest.mark.django_db
def test_stale_marker_is_hidden_then_removed_without_unrelated_index_loss(reader, wiki, settings):
    from indexing.models import IndexedNote, IndexedName, IndexJob, LinkEdge
    from indexing.search import search_notes, resolve_indexed_name
    from indexing.worker import run_batch
    from wiki.links import resolve_link
    from wiki.models import RecoveryDraft, SavedRevision
    for name in ['Reserved.md', 'keep.md']:
        (wiki / name).write_text(f'# {name}\n\n[[keep]]')
    drain(__import__('indexing.worker', fromlist=['run_batch']))
    reserved = IndexedNote.objects.get(path='Reserved.md')
    assert IndexedName.objects.filter(note=reserved).exists()
    actor = get_user_model().objects.get(username='synthetic-reader')
    draft = RecoveryDraft.objects.create(actor=actor, path='Reserved.md', source=b'private', base_source=b'')
    revision = SavedRevision.objects.create(actor=actor, path='Reserved.md', original=b'private', submitted=b'private', base_revision=reserved.revision)
    settings.BACKSTORY_IDENTITY_PATH = 'Reserved.md'
    IndexJob.objects.create(path='Reserved.md', revision=reserved.revision)
    assert [item.path for item in search_notes('').items] == ['keep.md']
    assert resolve_indexed_name('Reserved')[1] == ()
    for kind in ['markdown', 'wiki']:
        assert resolve_link('keep.md', 'Reserved.md', kind).href is None
    for route in [f'/drafts/{draft.pk}/', f'/drafts/{draft.pk}/download/', f'/revisions/{revision.pk}/']:
        assert reader.get(route).status_code == 404
    assert reader.post(f'/restore/{revision.pk}/', data='{}', content_type='application/json', HTTP_IF_MATCH=reserved.revision).status_code == 404
    # Metadata revocation is safe even during an outage; no unrelated rows go.
    (wiki / 'Reserved.md').unlink()
    (wiki / 'keep.md').unlink()
    run_batch()
    assert not IndexedNote.objects.filter(path='Reserved.md').exists()
    assert not IndexedName.objects.filter(note_id=reserved.pk).exists()
    assert not LinkEdge.objects.filter(note_id=reserved.pk).exists()
    assert not IndexJob.objects.filter(path='Reserved.md').exists()
    with connection.cursor() as db:
        db.execute('SELECT count(*) FROM indexed_fts WHERE path=%s', ['Reserved.md'])
        assert db.fetchone()[0] == 0
    assert IndexedNote.objects.filter(path='keep.md').exists()
    assert RecoveryDraft.objects.filter(pk=draft.pk).exists()


def test_startup_defaults_to_hidden_marker_without_hash(tmp_path):
    import subprocess
    import sys
    env = dict(os.environ, BACKSTORY_WIKI_ROOT=str(tmp_path / 'wiki'),
               BACKSTORY_DATA_DIR=str(tmp_path / 'data'))
    env.pop('BACKSTORY_IDENTITY_PATH', None)
    env.pop('BACKSTORY_IDENTITY_SHA256', None)
    result = subprocess.run([sys.executable, '-c',
        'import django; django.setup(); from django.conf import settings; print(settings.BACKSTORY_IDENTITY_PATH)'],
        env=env, text=True, capture_output=True, timeout=30)
    assert result.returncode == 0, result.stderr
    assert result.stdout.strip() == '.backstory-marker'
    assert not (tmp_path / 'wiki').exists()


@pytest.mark.parametrize('configured', ['.env', '.silverbullet.auth.json', '.prettierrc', '.git', '.syncthing-test', 'AGENTS.md', 'nested/.marker', '.backstory-tmp-test'])
def test_configuring_sensitive_file_never_grants_marker_access(wiki, settings, configured):
    from wiki.readiness import check_readiness
    from wiki.policy import validate_path
    from wiki.contracts import PathDenied
    settings.BACKSTORY_IDENTITY_PATH = configured
    # Names only: no synthetic credential file needs to be created.
    assert check_readiness().state == 'unavailable'
    for purpose in ['content', 'identity', 'config', 'config-reference']:
        with pytest.raises(PathDenied):
            validate_path(configured, purpose)


@pytest.mark.django_db
def test_marker_loss_and_return_preserve_draft_index_and_conflict_checks(reader, wiki, marker):
    from indexing.models import IndexedNote
    from indexing.worker import run_batch, index_status
    from wiki.models import RecoveryDraft
    from wiki.revisions import store_draft
    from tests.integration.test_saves import save, revision
    original = b'# Original\n'
    note = wiki / 'note.md'
    note.write_bytes(original)
    draft = store_draft(get_user_model().objects.get(username='synthetic-reader'),
                        'note.md', revision(original), '# Retained draft\n', [])
    drain(__import__('indexing.worker', fromlist=['run_batch']))
    marker.unlink()
    assert save(reader, '# Retained draft\n', revision(original)).status_code == 503
    run_batch()
    assert index_status().state == 'unavailable'
    assert IndexedNote.objects.filter(path='note.md').exists()
    assert reader.get(f'/drafts/{draft.pk}/download/').content == b'# Retained draft\n'
    assert note.read_bytes() == original
    note.write_bytes(b'# External edit\n')
    marker.touch()  # Owner restores disposable storage; no automatic draft replay.
    assert index_status().state in {'backoff', 'stale', 'partial', 'ready'}
    assert RecoveryDraft.objects.filter(pk=draft.pk).exists()
    assert note.read_bytes() == b'# External edit\n'
    assert save(reader, '# Retained draft\n', revision(original)).status_code == 412
    assert save(reader, '# Retained draft\n', revision(note.read_bytes())).status_code == 200
