import json
from datetime import timedelta
import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from django.utils import timezone
from tests.integration.test_browsing import reader
from tests.integration.test_storage import wiki
from tests.integration.test_saves import save, revision

pytestmark = pytest.mark.django_db


def test_explicit_draft_is_actor_scoped_and_available_without_wiki(reader, wiki, settings):
    from wiki.revisions import store_draft
    from wiki.models import RecoveryDraft
    actor = get_user_model().objects.get(username='synthetic-reader')
    target = wiki / 'note.md'; target.write_bytes(b'old')
    draft = store_draft(actor, 'note.md', revision(b'old'), '\ufeffdraft\r\n', [], base_source='old', bom=True, newline='\r\n')
    (wiki / 'Identity.txt').unlink()
    page = reader.get(f'/drafts/{draft.pk}/')
    assert page.status_code == 200
    assert page['Cache-Control'] == 'no-store'
    assert '\\ufeffdraft' in page.content.decode().lower() or 'draft' in page.content.decode()
    record = RecoveryDraft.objects.get(pk=draft.pk)
    assert bytes(record.source).decode() == '\ufeffdraft\r\n'
    other = Client(); other.force_login(get_user_model().objects.create_user('other'))
    assert other.get(f'/drafts/{draft.pk}/').status_code == 404
    assert other.get(f'/drafts/{draft.pk}/download/').status_code == 404
    assert target.read_bytes() == b'old'


def test_history_restore_requires_fresh_precondition_and_same_save_path(reader, wiki):
    from wiki.models import SavedRevision
    target = wiki / 'note.md'; target.write_bytes(b'\xef\xbb\xbf\xef\xbb\xbforiginal\r\n')
    base = revision(target.read_bytes())
    assert save(reader, '# Changed\r\n', base).status_code == 200
    record = SavedRevision.objects.get()
    assert reader.get('/history/note.md').status_code == 200
    restore = lambda etag: reader.post(f'/restore/{record.pk}/', data='{}', content_type='application/json', HTTP_IF_MATCH=etag)
    assert restore(base).status_code == 412
    assert restore(revision(target.read_bytes())).status_code == 200
    assert target.read_bytes() == b'\xef\xbb\xbf\xef\xbb\xbforiginal\r\n'
    assert SavedRevision.objects.count() == 2


def test_shared_quota_and_30_day_cleanup(reader, wiki, settings):
    from wiki.revisions import store_draft, prune_recovery
    from wiki.models import RecoveryDraft, SavedRevision
    from wiki.contracts import StorageError
    actor = get_user_model().objects.get(username='synthetic-reader')
    record = store_draft(actor, 'note.md', None, 'draft', [])
    settings.BACKSTORY_REVISION_QUOTA_BYTES = 5
    with pytest.raises(StorageError, match='backup_quota_exceeded'):
        store_draft(actor, 'note.md', None, 'more', [])
    RecoveryDraft.objects.filter(pk=record.pk).update(created_at=timezone.now() - timedelta(days=31))
    prune_recovery()
    assert not RecoveryDraft.objects.exists()
    assert not SavedRevision.objects.exists()


@pytest.mark.parametrize('path', ['AGENTS.md', '../outside.md', '.hidden/note.md', 'notes/link.md'])
def test_history_and_draft_reapply_policy(reader, wiki, path):
    from wiki.models import RecoveryDraft, SavedRevision
    actor = get_user_model().objects.get(username='synthetic-reader')
    (wiki / 'notes').mkdir(exist_ok=True)
    (wiki / 'notes/link.md').symlink_to(wiki / 'Identity.txt')
    record = RecoveryDraft.objects.create(actor=actor, path=path, base_revision=None, source=b'private', base_source=b'', diagnostics=[])
    assert reader.get(f'/drafts/{record.pk}/').status_code == 404
    assert reader.get('/history/' + path).status_code == 404


def test_recovery_page_never_opens_live_path_when_unavailable(reader, wiki, monkeypatch):
    from wiki.revisions import store_draft
    actor = get_user_model().objects.get(username='synthetic-reader')
    draft = store_draft(actor, 'note.md', None, 'draft', [])
    (wiki/'Identity.txt').unlink()
    import wiki.storage as storage
    real = storage.read_regular
    def guarded(path, **kwargs):
        assert kwargs.get('purpose') == 'identity'
        return real(path, **kwargs)
    monkeypatch.setattr(storage, 'read_regular', guarded)
    assert reader.get(f'/drafts/{draft.pk}/').status_code == 200
    assert reader.get(f'/drafts/{draft.pk}/download/').content == b'draft'


def test_restore_original_encoding_bom_is_distinct_from_content_feff(reader, wiki):
    from wiki.models import SavedRevision
    target=wiki/'note.md'; original=b'\xef\xbb\xbf\xef\xbb\xbf# Original\r\n'; target.write_bytes(original)
    assert save(reader,'# Changed\r\n',revision(original)).status_code==200
    row=SavedRevision.objects.get()
    target.write_bytes(b'# External without BOM\n')
    response=reader.post(f'/restore/{row.pk}/',data='{}',content_type='application/json',HTTP_IF_MATCH=revision(target.read_bytes()))
    assert response.status_code==200
    assert target.read_bytes()==original


def test_draft_route_keeps_diagnostics_escaped_and_rejects_oversized_transport(reader,wiki,settings):
    payload={'path':'note.md','source':'draft','diagnostics':[{'code':'synthetic','message':'<script>private</script>','severity':'error'}]}
    response=reader.post('/drafts/',data=json.dumps(payload),content_type='application/json')
    assert response.status_code==201
    page=reader.get(response.json()['url'])
    assert b'\\u003Cscript\\u003Eprivate' in page.content
    assert b'<script>private</script>' not in page.content
    settings.DATA_UPLOAD_MAX_MEMORY_SIZE=10
    assert reader.post('/drafts/',data=json.dumps(payload),content_type='application/json').status_code==413


def test_history_is_shared_but_drafts_and_diagnostics_are_actor_scoped(reader,wiki):
    from wiki.models import SavedRevision
    target=wiki/'note.md'; target.write_bytes(b'# Original\n')
    assert save(reader,'# Changed\n',revision(target.read_bytes())).status_code==200
    other=Client(); other.force_login(get_user_model().objects.create_user('second-reader'))
    assert other.get('/history/note.md').status_code==200
    assert other.get(f'/revisions/{SavedRevision.objects.get().pk}/').status_code==200


def test_diagnostic_heavy_empty_drafts_cannot_bypass_shared_quota(reader,wiki,settings):
    """F3-002: exact independent probe, no partial row on any refusal."""
    from wiki.models import RecoveryDraft
    settings.BACKSTORY_REVISION_QUOTA_BYTES=1024
    payload={'path':'note.md','source':'','base_source':'','diagnostics':[{'message':'x'*60000}]}
    for _ in range(3):
        response=reader.post('/drafts/',data=json.dumps(payload),content_type='application/json')
        assert response.status_code==503
        assert not RecoveryDraft.objects.exists()


def test_empty_drafts_and_empty_backups_have_bounded_record_charge(reader,wiki,settings):
    from wiki.revisions import store_draft,store_required_backup
    from wiki.contracts import StorageError
    from wiki.models import RecoveryDraft,SavedRevision
    actor=get_user_model().objects.get(username='synthetic-reader')
    settings.BACKSTORY_REVISION_QUOTA_BYTES=1024
    successes=0
    for _ in range(20):
        try: store_draft(actor,'note.md',None,'',[])
        except StorageError as error:
            assert error.reason_code=='backup_quota_exceeded'; break
        successes+=1
    assert 0 < successes <= 4
    assert RecoveryDraft.objects.count()==successes
    count=SavedRevision.objects.count()
    with pytest.raises(StorageError,match='backup_quota_exceeded'):
        for _ in range(20): store_required_backup(actor,'note.md',None,b'',b'')
    assert SavedRevision.objects.count()-count <= 4
    assert RecoveryDraft.objects.count()==successes


@pytest.mark.parametrize('draft_first',[True,False])
def test_draft_diagnostics_and_required_backups_share_budget_without_eviction(reader,wiki,settings,draft_first):
    from wiki.revisions import store_draft,store_required_backup
    from wiki.contracts import StorageError
    from wiki.models import RecoveryDraft,SavedRevision
    actor=get_user_model().objects.get(username='synthetic-reader')
    settings.BACKSTORY_REVISION_QUOTA_BYTES=2000
    diagnostics=[{'message':'x'*900}]
    if draft_first:
        row=store_draft(actor,'note.md',None,'',diagnostics)
        with pytest.raises(StorageError,match='backup_quota_exceeded'):
            store_required_backup(actor,'note.md',None,b'a'*600,b'b'*400)
        assert RecoveryDraft.objects.filter(pk=row.pk).exists()
        assert SavedRevision.objects.count()==0
    else:
        store_required_backup(actor,'note.md',None,b'a'*600,b'b'*400)
        with pytest.raises(StorageError,match='backup_quota_exceeded'):
            store_draft(actor,'note.md',None,'',diagnostics)
        assert SavedRevision.objects.count()==1
        assert RecoveryDraft.objects.count()==0


def test_unicode_path_json_serialization_and_metadata_are_charged(reader,wiki,settings):
    from wiki.revisions import store_draft
    from wiki.contracts import StorageError
    from wiki.models import RecoveryDraft
    actor=get_user_model().objects.get(username='synthetic-reader')
    # UTF-8 path bytes and persisted JSON's escaped representation both count.
    path=('\u754c'*70+'/')*3+'note.md'
    settings.BACKSTORY_REVISION_QUOTA_BYTES=600
    with pytest.raises(StorageError,match='backup_quota_exceeded'):
        store_draft(actor,path,None,'',[])
    settings.BACKSTORY_REVISION_QUOTA_BYTES=1024
    with pytest.raises(StorageError,match='backup_quota_exceeded'):
        store_draft(actor,'note.md',None,'',[{'message':'\U0001f600'*100}])
    assert RecoveryDraft.objects.count()==0


def test_empty_required_backups_are_bounded_without_evicting_fresh_records(reader,wiki,settings):
    from wiki.revisions import store_required_backup
    from wiki.models import SavedRevision
    from wiki.contracts import StorageError
    actor=get_user_model().objects.get(username='synthetic-reader')
    settings.BACKSTORY_REVISION_QUOTA_BYTES=1024
    accepted=0
    for _ in range(20):
        try: store_required_backup(actor,'note.md',None,b'',b'')
        except StorageError as error:
            assert error.reason_code=='backup_quota_exceeded'; break
        accepted+=1
    assert 0 < accepted <= 4
    assert SavedRevision.objects.count()==accepted


def test_existing_unicode_metadata_and_json_bytes_remain_charged(reader,wiki,settings):
    from wiki.revisions import store_draft,store_required_backup
    from wiki.models import RecoveryDraft,SavedRevision
    from wiki.contracts import StorageError
    actor=get_user_model().objects.get(username='synthetic-reader')
    path=('\u754c'*70+'/')*3+'note.md'
    settings.BACKSTORY_REVISION_QUOTA_BYTES=1200
    row=store_draft(actor,path,None,'',[])
    with pytest.raises(StorageError,match='backup_quota_exceeded'):
        store_required_backup(actor,'note.md',None,b'x'*100,b'')
    assert RecoveryDraft.objects.filter(pk=row.pk).exists()
    assert not SavedRevision.objects.exists()
    RecoveryDraft.objects.all().delete()
    settings.BACKSTORY_REVISION_QUOTA_BYTES=2000
    row=store_draft(actor,'note.md',None,'',[{'message':'\U0001f600'*100}])
    with pytest.raises(StorageError,match='backup_quota_exceeded'):
        store_draft(actor,'note.md',None,'x'*400,[])
    assert RecoveryDraft.objects.count()==1


def test_quota_refusal_rolls_back_prune_and_leaves_existing_recovery_intact(reader,wiki,settings):
    from wiki.revisions import store_draft,store_required_backup
    from wiki.models import RecoveryDraft,SavedRevision
    from wiki.contracts import StorageError
    actor=get_user_model().objects.get(username='synthetic-reader')
    expired=store_draft(actor,'note.md',None,'old',[])
    RecoveryDraft.objects.filter(pk=expired.pk).update(created_at=timezone.now()-timedelta(days=31))
    store_required_backup(actor,'note.md',None,b'current',b'submitted')
    # Recreate an aged row: its deletion belongs to the failed atomic operation.
    expired=RecoveryDraft.objects.create(actor=actor,path='note.md',source=b'old',diagnostics=[])
    RecoveryDraft.objects.filter(pk=expired.pk).update(created_at=timezone.now()-timedelta(days=31))
    settings.BACKSTORY_REVISION_QUOTA_BYTES=1
    with pytest.raises(StorageError,match='backup_quota_exceeded'):
        store_draft(actor,'note.md',None,'new',[])
    assert RecoveryDraft.objects.filter(pk=expired.pk).exists()
    assert SavedRevision.objects.count()==1
