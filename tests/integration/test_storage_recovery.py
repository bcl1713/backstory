import pytest
from tests.integration.test_browsing import reader
from tests.integration.test_storage import wiki
from tests.integration.test_saves import save, revision

pytestmark = pytest.mark.django_db


def test_existing_empty_root_retains_index_and_protected_draft(reader, wiki, tmp_path):
    from django.contrib.auth import get_user_model
    from wiki.revisions import store_draft
    from wiki.models import RecoveryDraft
    from indexing.worker import run_batch
    from indexing.queue import request_scan
    from indexing.models import IndexedNote
    target = wiki / 'note.md'; target.write_bytes(b'# Original\n')
    request_scan('rebuild')
    for _ in range(30):
        run_batch()
    count = IndexedNote.objects.count()
    assert count
    actor = get_user_model().objects.get(username='synthetic-reader')
    draft = store_draft(actor, 'note.md', revision(target.read_bytes()), '# Draft\n', [], base_source='# Original\n')
    moved = wiki.with_name('detached'); wiki.rename(moved); wiki.mkdir()
    try:
        assert save(reader, '# Draft\n', revision(b'# Original\n')).status_code == 503
        assert reader.get(f'/drafts/{draft.pk}/').status_code == 200
        assert reader.get('/index/status/').json()['state'] == 'unavailable'
        request_scan('rebuild')
        run_batch()
        from indexing.models import ScanState
        import time
        state = ScanState.objects.get(pk=1)
        assert state.backoff_until > time.time()
        before = state.backoff_until
        run_batch()
        state.refresh_from_db()
        assert state.backoff_until == before
        assert IndexedNote.objects.count() == count
        assert RecoveryDraft.objects.filter(pk=draft.pk).exists()
        assert not list(wiki.iterdir())
    finally:
        wiki.rmdir(); moved.rename(wiki)
    assert target.read_bytes() == b'# Original\n'
    assert reader.get('/status/').status_code == 200
    assert target.read_bytes() == b'# Original\n'
    assert save(reader, '# Draft\n', revision(target.read_bytes())).status_code == 200
