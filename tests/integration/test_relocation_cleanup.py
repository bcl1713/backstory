"""Synthetic orphan stages must not invalidate relocation's own inventory."""
import pytest
from tests.integration.test_browsing import reader
from tests.integration.test_storage import wiki
from tests.integration.test_relocations import actor
from wiki import relocations, staging
from wiki.contracts import StorageError
from wiki.models import MoveOperation, SavedRevision
pytestmark = pytest.mark.django_db


def orphan(wiki):
    parent = wiki / 'Unrelated'
    parent.mkdir(exist_ok=True)
    name = '.backstory-tmp-' + 'a' * 32
    path = parent / name
    path.write_text('synthetic interrupted stage')
    staging.register_stage('Unrelated/Other.md', name)
    return path


def notes(wiki):
    (wiki / 'From.md').write_text('# Source\n')
    (wiki / 'Home.md').write_text('[[From]]\n')


def unchanged(wiki):
    assert (wiki / 'From.md').read_text() == '# Source\n'
    assert (wiki / 'Home.md').read_text() == '[[From]]\n'
    assert not (wiki / 'To.md').exists()


def test_preview_cleans_orphan_before_recording_witnesses(reader, wiki):
    notes(wiki)
    temporary = orphan(wiki)
    operation = relocations.preview_move(actor(reader), 'From.md', 'To.md')
    assert not temporary.exists()
    assert operation.plan['witnesses'] == relocations._scan('From.md')[0]
    assert relocations.commit_move(actor(reader), operation.pk)['state'] == 'completed'
    assert (wiki / 'To.md').read_text() == '# Source\n'
    assert (wiki / 'Home.md').read_text() == '[[To]]\n'
    count = SavedRevision.objects.count()
    assert relocations.commit_move(actor(reader), operation.pk)['state'] == 'completed'
    assert SavedRevision.objects.count() == count


def test_historical_preview_requires_new_preview_after_cleanup(reader, wiki, monkeypatch):
    notes(wiki)
    temporary = orphan(wiki)
    with monkeypatch.context() as patch:
        patch.setattr(staging, 'cleanup_staged_saves', lambda: None)
        operation = relocations.preview_move(actor(reader), 'From.md', 'To.md')
    with pytest.raises(StorageError, match='move_preview_stale'):
        relocations.commit_move(actor(reader), operation.pk)
    assert not temporary.exists()
    assert MoveOperation.objects.get(pk=operation.pk).state == 'preview'
    assert SavedRevision.objects.count() == 0
    unchanged(wiki)
    fresh = relocations.preview_move(actor(reader), 'From.md', 'To.md')
    assert relocations.commit_move(actor(reader), fresh.pk)['state'] == 'completed'


def test_cleanup_never_runs_between_start_validation_and_rename(reader, wiki, monkeypatch):
    notes(wiki)
    operation = relocations.preview_move(actor(reader), 'From.md', 'To.md')
    real_start = relocations._start
    calls = []
    def cleanup():
        calls.append('cleanup')
    def start(record):
        calls.append('start')
        return real_start(record)
    monkeypatch.setattr(staging, 'cleanup_staged_saves', cleanup)
    monkeypatch.setattr(relocations, '_start', start)
    assert relocations.commit_move(actor(reader), operation.pk)['state'] == 'completed'
    assert calls == ['cleanup', 'start']


def test_resumed_pre_rename_operation_does_not_adopt_changed_witnesses(reader, wiki):
    notes(wiki)
    operation = relocations.preview_move(actor(reader), 'From.md', 'To.md')
    relocations._start(operation)
    temporary = orphan(wiki)
    result = relocations.commit_move(actor(reader), operation.pk)
    assert not temporary.exists()
    assert result['state'] == 'recovery_required'
    assert result['reason_code'] == 'move_recovery_conflict'
    unchanged(wiki)
    assert relocations.rollback_move(actor(reader), operation.pk)['state'] == 'cancelled'
    assert not MoveOperation.objects.filter(state__in=['applying', 'recovery_required']).exists()
    unchanged(wiki)


def test_external_change_after_start_still_conflicts_with_safe_path(reader, wiki, monkeypatch):
    notes(wiki)
    (wiki / 'Elsewhere.md').write_text('Original\n')
    operation = relocations.preview_move(actor(reader), 'From.md', 'To.md')
    original_start = relocations._start
    def start(record):
        original_start(record)
        (wiki / 'Elsewhere.md').write_text('External edit\n')
    monkeypatch.setattr(relocations, '_start', start)
    assert relocations.commit_move(actor(reader), operation.pk)['state'] == 'recovery_required'
    operation.refresh_from_db()
    assert operation.plan['conflicts'] == ['Elsewhere.md']
    unchanged(wiki)


@pytest.mark.parametrize('action', ['resume', 'rollback'])
def test_post_rename_recovery_cleans_registered_stage_before_validation(reader, wiki, monkeypatch, action):
    notes(wiki)
    (wiki / 'Unrelated').mkdir()
    operation = relocations.preview_move(actor(reader), 'From.md', 'To.md')
    real_publish = relocations._publish_change
    def interrupted(*args, **kwargs):
        orphan(wiki)
        raise OSError('synthetic publication interruption')
    monkeypatch.setattr(relocations, '_publish_change', interrupted)
    assert relocations.commit_move(actor(reader), operation.pk)['state'] == 'recovery_required'
    assert not (wiki / 'From.md').exists()
    assert (wiki / 'To.md').exists()
    monkeypatch.setattr(relocations, '_publish_change', real_publish)
    method = relocations.commit_move if action == 'resume' else relocations.rollback_move
    assert method(actor(reader), operation.pk)['state'] == ('completed' if action == 'resume' else 'cancelled')
    assert not list((wiki / 'Unrelated').glob('.backstory-tmp-*'))
    if action == 'rollback':
        unchanged(wiki)
    else:
        assert (wiki / 'Home.md').read_text() == '[[To]]\n'
        assert (wiki / 'To.md').read_text() == '# Source\n'


def test_conflict_paths_are_bounded_relative_and_escaped(reader, wiki, monkeypatch):
    notes(wiki)
    paths = [f'Other-{n:02d}<note>.md' for n in range(25)]
    for path in paths:
        (wiki / path).write_text('Before\n')
    operation = relocations.preview_move(actor(reader), 'From.md', 'To.md')
    original_start = relocations._start
    def start(record):
        original_start(record)
        for path in paths:
            (wiki / path).write_text('After\n')
    monkeypatch.setattr(relocations, '_start', start)
    assert relocations.commit_move(actor(reader), operation.pk)['state'] == 'recovery_required'
    operation.refresh_from_db()
    assert operation.plan['conflicts'] == paths[:20]
    response = reader.get(f'/move/{operation.pk}/')
    assert response.status_code == 200
    assert b'Other-00&lt;note&gt;.md' in response.content
    assert b'Other-00<note>.md' not in response.content
    assert str(wiki).encode() not in response.content
    unchanged(wiki)
