"""Relocation contracts on disposable synthetic storage."""
import importlib

import pytest
from django.test import Client
from tests.integration.test_browsing import reader
from tests.integration.test_storage import wiki

pytestmark = pytest.mark.django_db


def service():
    return importlib.import_module('wiki.relocations')


def actor(reader):
    from django.contrib.auth import get_user_model
    return get_user_model().objects.get(username='synthetic-reader')


def preview(reader, source, destination):
    return service().preview_move(actor(reader), source, destination)


def commit(reader, operation):
    return service().commit_move(actor(reader), operation.pk)


def test_folder_move_repairs_inbound_outgoing_assets_and_history(reader, wiki):
    from wiki.models import SavedRevision, RecoveryDraft
    (wiki / '01-Projects/sample').mkdir(parents=True)
    (wiki / '04-Archives/01-Projects').mkdir(parents=True)
    original = b'---\nid: stable\n---\n# Project\n[[01-Projects/sample/Other|Other label]]\n![image](../../asset.png)\n'
    (wiki / '01-Projects/sample/Main.md').write_bytes(original)
    (wiki / '01-Projects/sample/Other.md').write_text('[[Main#Heading|Go]]\n')
    (wiki / 'asset.png').write_bytes(b'synthetic-image')
    (wiki / 'Home.md').write_text('# Active\n[[01-Projects/sample/Main#Heading|Project]]\n\n`01-Projects/sample/Main`\n')
    SavedRevision.objects.create(actor=actor(reader), path='01-Projects/sample/Main.md', original=b'old', submitted=original)
    RecoveryDraft.objects.create(actor=actor(reader), path='01-Projects/sample/Main.md', source=b'draft')
    op = preview(reader, '01-Projects/sample', '04-Archives/01-Projects/sample')
    assert not (wiki / '04-Archives/01-Projects/sample').exists()
    assert op.plan['changes'] and len(op.plan['inventory']) == 3
    result = commit(reader, op)
    assert result['state'] == 'completed'
    assert not (wiki / '01-Projects/sample').exists()
    main = (wiki / '04-Archives/01-Projects/sample/Main.md').read_text()
    assert 'id: stable' in main and '../../../asset.png' in main
    assert '[[04-Archives/01-Projects/sample/Main#Heading|Project]]' in (wiki / 'Home.md').read_text()
    assert '# Active\n' in (wiki / 'Home.md').read_text()
    assert '`01-Projects/sample/Main`' in (wiki / 'Home.md').read_text()
    assert SavedRevision.objects.filter(original=b'old', path='04-Archives/01-Projects/sample/Main.md').exists()
    assert RecoveryDraft.objects.get().source == b'draft'
    assert RecoveryDraft.objects.get().path == '04-Archives/01-Projects/sample/Main.md'
    assert commit(reader, op)['state'] == 'completed'


def test_note_rename_preserves_encoding_and_frontmatter(reader, wiki):
    raw = b'\xef\xbb\xbf---\r\nid: same\r\n---\r\n# Name\r\n'
    (wiki / 'Name.md').write_bytes(raw)
    assert commit(reader, preview(reader, 'Name.md', 'Renamed.md'))['state'] == 'completed'
    assert (wiki / 'Renamed.md').read_bytes() == raw


@pytest.mark.parametrize('change', ['source', 'inbound', 'new_note', 'collision'])
def test_stale_preview_never_mutates(reader, wiki, change):
    from wiki.contracts import StorageError
    (wiki / 'From.md').write_text('# From\n')
    (wiki / 'Home.md').write_text('[[From]]\n')
    op = preview(reader, 'From.md', 'To.md')
    if change == 'source':
        (wiki / 'From.md').write_text('external edit')
    elif change == 'inbound':
        (wiki / 'Home.md').write_text('new external inbound')
    elif change == 'new_note':
        (wiki / 'New.md').write_text('[[From]]')
    else:
        (wiki / 'To.md').write_text('collision')
    with pytest.raises(StorageError):
        commit(reader, op)
    assert (wiki / 'From.md').exists()
    if change == 'collision':
        assert (wiki / 'To.md').read_text() == 'collision'
    else:
        assert not (wiki / 'To.md').exists()


@pytest.mark.parametrize('unsafe', ['.hidden', 'AGENTS.md', 'link.md', 'pipe'])
def test_folder_with_protected_or_special_descendant_is_blocked(reader, wiki, unsafe):
    import os
    from wiki.contracts import StorageError
    (wiki / 'From').mkdir()
    (wiki / 'From/Note.md').write_text('safe')
    target = wiki / 'From' / unsafe
    if unsafe == 'link.md':
        target.symlink_to(wiki / 'From/Note.md')
    elif unsafe == 'pipe':
        os.mkfifo(target)
    else:
        target.write_text('protected')
    with pytest.raises(StorageError):
        preview(reader, 'From', 'To')
    assert (wiki / 'From/Note.md').read_text() == 'safe'
    assert not (wiki / 'To').exists()


def test_interrupted_move_resumes_without_duplicate_backups_or_overwrites(reader, wiki, monkeypatch):
    from wiki.models import SavedRevision
    from wiki.contracts import StorageError
    (wiki / 'From.md').write_text('# From\n')
    (wiki / 'Home.md').write_text('[[From]]\n')
    op = preview(reader, 'From.md', 'To.md')
    real_publish = service()._publish_change
    monkeypatch.setattr(service(), '_publish_change', lambda *args, **kwargs: (_ for _ in ()).throw(OSError('synthetic disk failure')))
    failed = commit(reader, op)
    assert failed['state'] == 'recovery_required'
    assert (wiki / 'To.md').exists() and not (wiki / 'From.md').exists()
    assert reader.post('/save/Other.md', data='{"source":"# Other\\n"}', content_type='application/json', HTTP_IF_NONE_MATCH='*').status_code == 409
    count = SavedRevision.objects.count()
    monkeypatch.setattr(service(), '_publish_change', real_publish)
    assert commit(reader, op)['state'] == 'completed'
    assert SavedRevision.objects.count() == count
    assert '[[To]]' in (wiki / 'Home.md').read_text()
    assert commit(reader, op)['state'] == 'completed'


def test_recovery_refuses_external_edit(reader, wiki, monkeypatch):
    (wiki / 'From.md').write_text('old')
    (wiki / 'Home.md').write_text('[[From]]')
    op = preview(reader, 'From.md', 'To.md')
    real_publish = service()._publish_change
    monkeypatch.setattr(service(), '_publish_change', lambda *a, **k: (_ for _ in ()).throw(OSError()))
    assert commit(reader, op)['state'] == 'recovery_required'
    (wiki / 'Home.md').write_text('human changed this')
    monkeypatch.setattr(service(), '_publish_change', real_publish)
    assert commit(reader, op)['state'] == 'recovery_required'
    assert (wiki / 'Home.md').read_text() == 'human changed this'


def test_index_failure_is_separate_from_completed_move(reader, wiki, monkeypatch):
    (wiki / 'From.md').write_text('old')
    op = preview(reader, 'From.md', 'To.md')
    monkeypatch.setattr('indexing.queue.request_scan', lambda *a: (_ for _ in ()).throw(OSError()))
    result = commit(reader, op)
    assert result['state'] == 'completed' and result['index_state'] == 'failed'
    assert (wiki / 'To.md').read_text() == 'old'


def test_move_routes_require_authentication_and_csrf(reader, wiki, client):
    assert Client().get('/move/?source=From.md').status_code == 302
    user = actor(reader)
    guarded = Client(enforce_csrf_checks=True)
    guarded.force_login(user)
    assert guarded.post('/move/').status_code == 403


def test_move_review_ui_displays_inventory_and_diff_before_commit(reader, wiki):
    (wiki / 'From.md').write_text('# From\n')
    (wiki / 'Home.md').write_text('[[From|Label]]\n')
    response = reader.post('/move/', {'source': 'From.md', 'destination': 'To.md'})
    assert response.status_code == 302
    review = reader.get(response['Location'])
    assert review.status_code == 200
    assert b'Home.md' in review.content and b'[[To|Label]]' in review.content
    assert (wiki / 'From.md').exists() and not (wiki / 'To.md').exists()
    done = reader.post(response['Location'], {'action': 'commit'})
    assert done.status_code == 200 and b'completed' in done.content
    assert (wiki / 'To.md').exists()


def test_history_for_missing_descendants_follows_folder(reader, wiki):
    from wiki.models import SavedRevision
    (wiki / 'From').mkdir()
    (wiki / 'From/Here.md').write_text('here')
    row = SavedRevision.objects.create(actor=actor(reader), path='From/Deleted.md', original=b'historic', submitted=b'deleted')
    commit(reader, preview(reader, 'From', 'To'))
    row.refresh_from_db()
    assert row.path == 'To/Deleted.md'


def test_move_preview_is_actor_bound(reader, wiki, django_user_model):
    from wiki.contracts import StorageError
    (wiki / 'From.md').write_text('old')
    op = preview(reader, 'From.md', 'To.md')
    other = django_user_model.objects.create_user('other')
    with pytest.raises(StorageError, match='not_found'):
        service().commit_move(other, op.pk)
    assert (wiki / 'From.md').read_text() == 'old'


def test_missing_destination_parent_and_history_collision_are_blocked(reader, wiki):
    from wiki.models import SavedRevision
    from wiki.contracts import StorageError
    (wiki / 'From.md').write_text('old')
    with pytest.raises(StorageError):
        preview(reader, 'From.md', 'absent/To.md')
    SavedRevision.objects.create(actor=actor(reader), path='To.md', original=b'unrelated', submitted=b'')
    with pytest.raises(StorageError, match='destination_history_collision'):
        preview(reader, 'From.md', 'To.md')
    assert (wiki / 'From.md').read_text() == 'old'


def test_recovery_can_cancel_and_roll_back_without_copy_delete(reader, wiki, monkeypatch):
    (wiki / 'From.md').write_text('old')
    (wiki / 'Home.md').write_text('[[From]]')
    op = preview(reader, 'From.md', 'To.md')
    real = service()._publish_change
    monkeypatch.setattr(service(), '_publish_change', lambda *a, **k: (_ for _ in ()).throw(OSError()))
    assert commit(reader, op)['state'] == 'recovery_required'
    monkeypatch.setattr(service(), '_publish_change', real)
    result = service().rollback_move(actor(reader), op.pk)
    assert result['state'] == 'cancelled'
    assert (wiki / 'From.md').read_text() == 'old' and not (wiki / 'To.md').exists()
    assert (wiki / 'Home.md').read_text() == '[[From]]'
    assert service().rollback_move(actor(reader), op.pk)['state'] == 'cancelled'


def test_read_only_rename_failure_can_recover(reader, wiki, monkeypatch):
    (wiki / 'From.md').write_text('old')
    op = preview(reader, 'From.md', 'To.md')
    real = service()._rename_noreplace
    monkeypatch.setattr(service(), '_rename_noreplace', lambda *a: (_ for _ in ()).throw(PermissionError()))
    assert commit(reader, op)['state'] == 'recovery_required'
    assert (wiki / 'From.md').read_text() == 'old' and not (wiki / 'To.md').exists()
    monkeypatch.setattr(service(), '_rename_noreplace', real)
    assert commit(reader, op)['state'] == 'completed'


def test_recovery_does_not_accept_replacement_destination(reader, wiki, monkeypatch):
    (wiki / 'From.md').write_text('old')
    (wiki / 'Home.md').write_text('[[From]]')
    op = preview(reader, 'From.md', 'To.md')
    real = service()._publish_change
    monkeypatch.setattr(service(), '_publish_change', lambda *a, **k: (_ for _ in ()).throw(OSError()))
    assert commit(reader, op)['state'] == 'recovery_required'
    (wiki / 'To.md').rename(wiki / 'displaced.md')
    (wiki / 'To.md').write_text('third party')
    monkeypatch.setattr(service(), '_publish_change', real)
    assert commit(reader, op)['state'] == 'recovery_required'
    assert (wiki / 'To.md').read_text() == 'third party'


def test_backup_quota_refuses_before_rename(reader, wiki, settings):
    from wiki.contracts import StorageError
    (wiki / 'From.md').write_text('old')
    (wiki / 'Home.md').write_text('[[From]]')
    op = preview(reader, 'From.md', 'To.md')
    settings.BACKSTORY_REVISION_QUOTA_BYTES = 1
    with pytest.raises(StorageError, match='backup_quota_exceeded'):
        commit(reader, op)
    assert (wiki / 'From.md').read_text() == 'old'
    assert (wiki / 'Home.md').read_text() == '[[From]]'


def test_single_note_with_repaired_outgoing_links_recovers_after_final_database_failure(reader, wiki, monkeypatch):
    from django.db import OperationalError
    from wiki.models import MoveOperation
    (wiki / 'Folder').mkdir()
    (wiki / 'From.md').write_text('[asset](asset.png)\n')
    (wiki / 'asset.png').write_bytes(b'asset')
    op = preview(reader, 'From.md', 'Folder/To.md')
    real_save = MoveOperation.save
    def fail_completion(self, *args, **kwargs):
        if self.state == 'completed':
            raise OperationalError('synthetic commit failure')
        return real_save(self, *args, **kwargs)
    monkeypatch.setattr(MoveOperation, 'save', fail_completion)
    assert commit(reader, op)['state'] == 'recovery_required'
    assert (wiki / 'Folder/To.md').read_text() == '[asset](../asset.png)\n'
    monkeypatch.setattr(MoveOperation, 'save', real_save)
    assert commit(reader, op)['state'] == 'completed'


def test_rollback_restores_partial_link_updates_and_rename(reader, wiki, monkeypatch):
    (wiki / 'Folder').mkdir()
    (wiki / 'From.md').write_text('[asset](asset.png)\n')
    (wiki / 'Home.md').write_text('[[From]]')
    (wiki / 'asset.png').write_bytes(b'asset')
    op = preview(reader, 'From.md', 'Folder/To.md')
    real = service()._publish_change
    def fail_second(path, *args):
        if path == 'Home.md':
            raise OSError('synthetic')
        return real(path, *args)
    monkeypatch.setattr(service(), '_publish_change', fail_second)
    assert commit(reader, op)['state'] == 'recovery_required'
    assert (wiki / 'Folder/To.md').read_text() == '[asset](../asset.png)\n'
    monkeypatch.setattr(service(), '_publish_change', real)
    assert service().rollback_move(actor(reader), op.pk)['state'] == 'cancelled'
    assert (wiki / 'From.md').read_text() == '[asset](asset.png)\n'
    assert (wiki / 'Home.md').read_text() == '[[From]]'
    assert not (wiki / 'Folder/To.md').exists()


def test_relocation_refreshes_search_and_resolver_after_indexing(reader, wiki):
    from indexing.worker import run_batch, index_status
    from indexing.search import search_notes
    from wiki.links import resolve_link
    (wiki / 'From.md').write_text('# Synthetic discoverable unique\n')
    for _ in range(20):
        if not run_batch().pending:
            break
    assert [row.path for row in search_notes('discoverable').items] == ['From.md']
    result = commit(reader, preview(reader, 'From.md', 'To.md'))
    assert result['index_state'] == 'pending' and index_status().state != 'ready'
    for _ in range(20):
        if not run_batch().pending:
            break
    assert [row.path for row in search_notes('discoverable').items] == ['To.md']
    assert resolve_link('Home.md', 'To', 'wiki').href == '/notes/To.md'
    assert resolve_link('Home.md', 'From', 'wiki').state == 'missing'
    assert [row['path'] for row in reader.get('/folders/').json()['entries']] == ['To.md']


@pytest.mark.parametrize('changed', ['asset', 'note', 'new_descendant', 'new_inbound'])
def test_recovery_rejects_changes_outside_planned_rewrites(reader, wiki, monkeypatch, changed):
    (wiki / 'From').mkdir()
    (wiki / 'From/Main.md').write_text('original')
    (wiki / 'From/image.png').write_bytes(b'image')
    (wiki / 'Home.md').write_text('[[From/Main]]')
    op = preview(reader, 'From', 'To')
    real = service()._publish_change
    monkeypatch.setattr(service(), '_publish_change', lambda *a, **k: (_ for _ in ()).throw(OSError()))
    assert commit(reader, op)['state'] == 'recovery_required'
    if changed == 'asset':
        (wiki / 'To/image.png').write_bytes(b'externally changed')
    elif changed == 'note':
        (wiki / 'To/Main.md').write_text('externally changed')
    elif changed == 'new_descendant':
        (wiki / 'To/New.md').write_text('new')
    else:
        (wiki / 'New.md').write_text('[[From/Main]]')
    monkeypatch.setattr(service(), '_publish_change', real)
    assert commit(reader, op)['state'] == 'recovery_required'
    assert (wiki / 'Home.md').read_text() == '[[From/Main]]'


def test_folder_named_like_markdown_has_a_folder_completion_url(reader, wiki):
    (wiki / 'From').mkdir()
    result = commit(reader, preview(reader, 'From', 'To.md'))
    assert result['href'] == '/?folder=To.md'


def test_journal_capacity_refuses_before_another_preview_is_stored(reader, wiki, settings):
    from wiki.contracts import StorageError
    (wiki / 'From.md').write_text('old')
    settings.BACKSTORY_REVISION_QUOTA_BYTES = 1
    with pytest.raises(StorageError, match='move_journal_capacity'):
        preview(reader, 'From.md', 'To.md')
    assert (wiki / 'From.md').read_text() == 'old'


@pytest.mark.parametrize('entry', ['New.md', '.hidden'])
def test_rollback_refuses_unreviewed_descendants(reader, wiki, monkeypatch, entry):
    (wiki / 'From').mkdir()
    (wiki / 'From/Main.md').write_text('original')
    (wiki / 'Home.md').write_text('[[From/Main]]')
    op = preview(reader, 'From', 'To')
    real = service()._publish_change
    monkeypatch.setattr(service(), '_publish_change', lambda *a, **k: (_ for _ in ()).throw(OSError()))
    assert commit(reader, op)['state'] == 'recovery_required'
    (wiki / 'To' / entry).write_text('external')
    monkeypatch.setattr(service(), '_publish_change', real)
    assert service().rollback_move(actor(reader), op.pk)['state'] == 'recovery_required'
    assert (wiki / 'To' / entry).read_text() == 'external'
    assert not (wiki / 'From').exists()


def test_growing_history_paths_respects_backup_quota_before_mutation(reader, wiki, settings):
    from wiki.models import SavedRevision
    from wiki.contracts import StorageError
    (wiki / 'From.md').write_text('old')
    SavedRevision.objects.create(actor=actor(reader), path='From.md', original=b'x', submitted=b'y')
    op = preview(reader, 'From.md', 'LongDestination.md')
    settings.BACKSTORY_REVISION_QUOTA_BYTES = 265  # 256 overhead + 7 path + 2 bytes
    with pytest.raises(StorageError, match='backup_quota_exceeded'):
        commit(reader, op)
    assert (wiki / 'From.md').read_text() == 'old'
    assert not (wiki / 'LongDestination.md').exists()


def test_lost_completion_acknowledgment_does_not_reopen_a_terminal_journal(reader, wiki, monkeypatch):
    from wiki.models import MoveOperation
    (wiki / 'From.md').write_text('old')
    op = preview(reader, 'From.md', 'To.md')
    real = service()._relocate
    def lost_ack(operation):
        real(operation)
        raise OSError('synthetic lost terminal acknowledgement')
    monkeypatch.setattr(service(), '_relocate', lost_ack)
    assert commit(reader, op)['state'] == 'completed'
    assert MoveOperation.objects.get(pk=op.pk).state == 'completed'
    assert commit(reader, op)['state'] == 'completed'
    assert (wiki / 'To.md').read_text() == 'old'


def test_resume_cannot_claim_completion_while_directory_sync_still_fails(reader, wiki, monkeypatch):
    import os
    import stat
    (wiki / 'From.md').write_text('old')
    op = preview(reader, 'From.md', 'To.md')
    real = os.fsync
    def deny_directory_sync(fd):
        if stat.S_ISDIR(os.fstat(fd).st_mode):
            raise OSError('synthetic unavailable directory durability')
        return real(fd)
    monkeypatch.setattr(os, 'fsync', deny_directory_sync)
    assert commit(reader, op)['state'] == 'recovery_required'
    assert (wiki / 'To.md').read_text() == 'old'
    assert commit(reader, op)['state'] == 'recovery_required'
    monkeypatch.setattr(os, 'fsync', real)
    assert commit(reader, op)['state'] == 'completed'
