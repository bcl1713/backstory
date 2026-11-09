"""Durable preparation jobs use real disposable storage and the application DB."""
import json

import pytest
from django.contrib.auth import get_user_model
from django.db import DatabaseError
from django.utils import timezone

from tests.integration.test_browsing import reader
from tests.integration.test_storage import wiki
from tests.integration.test_index_diagnostics import file_database

pytestmark = pytest.mark.django_db(transaction=True)


@pytest.fixture
def actor(reader):
    return get_user_model().objects.get(username='synthetic-reader')


def queued(actor, wiki):
    from wiki.move_previews import enqueue_move_preview
    (wiki / 'From.md').write_text('# From\n')
    (wiki / 'Home.md').write_text('[[From]]\n')
    return enqueue_move_preview(actor, 'From.md', 'To.md')


def test_enqueue_does_not_plan_or_wait_for_wiki_writer(actor, wiki, monkeypatch):
    from wiki import relocations
    from wiki.move_previews import enqueue_move_preview
    from wiki.revisions import application_lock
    (wiki / 'From.md').write_text('# From\n')
    def forbidden(*args):
        pytest.fail('preparation belongs to the worker')
    monkeypatch.setattr(relocations, '_plan', forbidden)
    monkeypatch.setattr(relocations, '_scan', forbidden)
    with application_lock('wiki-write'):
        job = enqueue_move_preview(actor, 'From.md', 'To.md')
    assert job.state == 'queued'
    assert job.context['kind'] == 'note'
    assert (wiki / 'From.md').read_text() == '# From\n'
    assert not (wiki / 'To.md').exists()


def test_worker_atomically_replaces_job_with_same_id_complete_plan(actor, wiki):
    from wiki.models import MoveOperation, MovePreviewJob
    from wiki.move_previews import run_pending_move_preview
    job = queued(actor, wiki)
    assert run_pending_move_preview() is True
    assert not MovePreviewJob.objects.filter(pk=job.pk).exists()
    operation = MoveOperation.objects.get(pk=job.pk)
    assert operation.state == 'preview'
    assert operation.plan['inventory'] and operation.plan['witnesses']
    assert operation.plan['changes'][0]['after']
    assert (wiki / 'From.md').read_text() == '# From\n'
    assert (wiki / 'Home.md').read_text() == '[[From]]\n'
    assert not (wiki / 'To.md').exists()
    assert run_pending_move_preview() is False


@pytest.mark.parametrize('change', ['source', 'source_parent', 'destination_parent', 'root', 'marker', 'policy', 'actor', 'expired', 'collision'])
def test_changed_context_never_publishes(actor, wiki, settings, change):
    from wiki.models import MoveOperation
    from wiki.move_previews import enqueue_move_preview, run_pending_move_preview
    (wiki / 'From').mkdir()
    (wiki / 'From/Note.md').write_text('# Note\n')
    (wiki / 'Target').mkdir()
    job = enqueue_move_preview(actor, 'From/Note.md', 'Target/Note.md')
    if change == 'source':
        (wiki / 'From/Note.md').write_text('# Replaced\n')
    elif change == 'source_parent':
        (wiki / 'From').rename(wiki / 'OldFrom')
        (wiki / 'From').mkdir()
        (wiki / 'OldFrom/Note.md').rename(wiki / 'From/Note.md')
    elif change == 'destination_parent':
        (wiki / 'Target').rename(wiki / 'OldTarget')
        (wiki / 'Target').mkdir()
    elif change == 'root':
        wiki.rename(wiki.with_name('old-wiki'))
        wiki.mkdir()
        (wiki / '.backstory-marker').write_text('replacement')
    elif change == 'marker':
        (wiki / '.backstory-marker').write_text('replacement')
    elif change == 'policy':
        settings.BACKSTORY_EXCLUSIONS = ['Target']
    elif change == 'actor':
        actor.is_active = False
        actor.save(update_fields=['is_active'])
    elif change == 'expired':
        type(job).objects.filter(pk=job.pk).update(created_at=timezone.now() - timezone.timedelta(minutes=31))
    else:
        (wiki / 'Target/Note.md').write_text('collision')
    assert run_pending_move_preview()
    job.refresh_from_db()
    assert job.state == 'failed' and job.reason_code
    assert not MoveOperation.objects.filter(pk=job.pk).exists()


@pytest.mark.parametrize('during_plan', [False, True])
def test_cancellation_wins_over_preparation(actor, wiki, monkeypatch, during_plan):
    from wiki import relocations
    from wiki.models import MoveOperation
    from wiki.move_previews import cancel_move_preview, run_pending_move_preview
    job = queued(actor, wiki)
    if during_plan:
        original = relocations._plan
        def cancelling(*args):
            plan = original(*args)
            assert cancel_move_preview(actor, job.pk).state == 'cancelled'
            return plan
        monkeypatch.setattr(relocations, '_plan', cancelling)
    else:
        assert cancel_move_preview(actor, job.pk).state == 'cancelled'
    assert run_pending_move_preview() is during_plan
    job.refresh_from_db()
    assert job.state == 'cancelled'
    assert not MoveOperation.objects.filter(pk=job.pk).exists()
    assert not (wiki / 'To.md').exists()


def test_cancellation_returns_published_operation(actor, wiki):
    from wiki.models import MoveOperation
    from wiki.move_previews import cancel_move_preview, run_pending_move_preview
    job = queued(actor, wiki)
    run_pending_move_preview()
    assert isinstance(cancel_move_preview(actor, job.pk), MoveOperation)


def test_orphan_running_job_fails_without_replay(actor, wiki, monkeypatch):
    from wiki import relocations
    from wiki.move_previews import run_pending_move_preview
    job = queued(actor, wiki)
    type(job).objects.filter(pk=job.pk).update(state='running')
    monkeypatch.setattr(relocations, '_plan', lambda *args: pytest.fail('orphan must not replay'))
    assert run_pending_move_preview()
    job.refresh_from_db()
    assert job.state == 'failed' and job.reason_code == 'move_preview_interrupted'


@pytest.mark.parametrize('lock', ['wiki-write', 'move-preview-worker'])
def test_busy_worker_leaves_job_queued(actor, wiki, lock):
    from wiki.move_previews import run_pending_move_preview
    from wiki.revisions import application_lock
    job = queued(actor, wiki)
    with application_lock(lock):
        assert run_pending_move_preview() is False
    job.refresh_from_db()
    assert job.state == 'queued'


def test_queue_quota_and_shared_active_capacity(actor, wiki, settings):
    from wiki.contracts import StorageError
    from wiki.move_previews import enqueue_move_preview
    from wiki.relocations import preview_move
    job = queued(actor, wiki)
    for _ in range(31):
        enqueue_move_preview(actor, 'From.md', 'To.md')
    for action in [enqueue_move_preview, preview_move]:
        with pytest.raises(StorageError, match='move_preview_capacity'):
            action(actor, 'From.md', 'To.md')
    type(job).objects.all().delete()
    settings.BACKSTORY_REVISION_QUOTA_BYTES = 1
    with pytest.raises(StorageError, match='move_journal_capacity'):
        enqueue_move_preview(actor, 'From.md', 'To.md')
    assert not type(job).objects.exists()


@pytest.mark.parametrize('failure', ['quota', 'insert', 'unexpected'])
def test_publication_failure_retains_failure_and_never_partial_plan(actor, wiki, settings, monkeypatch, failure):
    from wiki import relocations
    from wiki.models import MoveOperation
    from wiki.move_previews import run_pending_move_preview
    job = queued(actor, wiki)
    if failure == 'quota':
        settings.BACKSTORY_REVISION_QUOTA_BYTES = len(json.dumps(job.context).encode()) + 512
    elif failure == 'insert':
        monkeypatch.setattr(MoveOperation, 'save', lambda *args, **kwargs: (_ for _ in ()).throw(DatabaseError('private database detail')))
    else:
        monkeypatch.setattr(relocations, '_plan', lambda *args: (_ for _ in ()).throw(RuntimeError('private parser detail')))
    assert run_pending_move_preview()
    job.refresh_from_db()
    assert job.state == 'failed'
    assert 'private' not in job.reason_code
    assert not MoveOperation.objects.filter(pk=job.pk).exists()
    assert (wiki / 'From.md').read_text() == '# From\n'
    assert (wiki / 'Home.md').read_text() == '[[From]]\n'
    assert not (wiki / 'To.md').exists()


@pytest.mark.parametrize('change', ['actor', 'source', 'marker', 'policy', 'expired'])
def test_changes_during_planning_are_rechecked_before_publication(actor, wiki, settings, monkeypatch, change):
    from wiki import relocations
    from wiki.models import MoveOperation
    from wiki.move_previews import run_pending_move_preview
    job = queued(actor, wiki)
    original = relocations._plan
    def changed(*args):
        plan = original(*args)
        if change == 'actor':
            get_user_model().objects.filter(pk=actor.pk).update(is_active=False)
        elif change == 'source':
            (wiki / 'From.md').write_text('# Different\n')
        elif change == 'marker':
            (wiki / '.backstory-marker').write_text('different')
        elif change == 'policy':
            settings.BACKSTORY_EXCLUSIONS = ['From.md']
        else:
            type(job).objects.filter(pk=job.pk).update(created_at=timezone.now() - timezone.timedelta(minutes=31))
        return plan
    monkeypatch.setattr(relocations, '_plan', changed)
    assert run_pending_move_preview()
    job.refresh_from_db()
    assert job.state == 'failed'
    assert not MoveOperation.objects.filter(pk=job.pk).exists()


def test_publication_quota_replaces_job_charge_exactly(actor, wiki, settings, monkeypatch):
    from wiki import relocations
    from wiki.models import MoveOperation
    from wiki.move_previews import run_pending_move_preview
    job = queued(actor, wiki)
    original = relocations._plan
    def budget(*args):
        plan = original(*args)
        settings.BACKSTORY_REVISION_QUOTA_BYTES = len(json.dumps(plan).encode())
        return plan
    monkeypatch.setattr(relocations, '_plan', budget)
    assert run_pending_move_preview()
    assert MoveOperation.objects.filter(pk=job.pk, state='preview').exists()
    assert not type(job).objects.filter(pk=job.pk).exists()


def test_busy_quota_does_not_enqueue_or_wait(actor, wiki):
    from wiki.contracts import StorageError
    from wiki.models import MovePreviewJob
    from wiki.move_previews import enqueue_move_preview
    from wiki.revisions import application_lock
    (wiki / 'From.md').write_text('# From\n')
    with application_lock('revision-quota'):
        with pytest.raises(StorageError, match='move_preview_unavailable'):
            enqueue_move_preview(actor, 'From.md', 'To.md')
    assert not MovePreviewJob.objects.exists()


@pytest.mark.parametrize('journal', ['WAL', 'DELETE'])
@pytest.mark.parametrize('phase', ['enqueue', 'publish'])
def test_preparation_reserves_sqlite_writer_before_quota_reads(actor, wiki, file_database, journal, phase):
    import sqlite3
    from django.db import connection
    from wiki.move_previews import enqueue_move_preview, run_pending_move_preview
    (wiki / 'From.md').write_text('# From\n')
    if phase == 'publish':
        enqueue_move_preview(actor, 'From.md', 'To.md')
    connection.connection.execute('PRAGMA journal_mode=' + journal)
    competitor = sqlite3.connect(file_database, timeout=0, isolation_level=None)
    attempts = []
    def concurrent_writer(execute, sql, params, many, context):
        result = execute(sql, params, many, context)
        if (not attempts and connection.in_atomic_block and sql.lstrip().upper().startswith('SELECT')
                and 'wiki_savedrevision' in sql):
            try:
                competitor.execute('BEGIN IMMEDIATE')
                attempts.append('writer_started')
            except sqlite3.OperationalError as error:
                assert error.sqlite_errorcode & 255 == sqlite3.SQLITE_BUSY
                attempts.append('serialized')
        return result
    try:
        with connection.execute_wrapper(concurrent_writer):
            if phase == 'enqueue':
                enqueue_move_preview(actor, 'From.md', 'To.md')
            else:
                assert run_pending_move_preview()
        assert attempts == ['serialized']
        competitor.execute('BEGIN IMMEDIATE')
        competitor.rollback()
    finally:
        competitor.close()


def test_live_worker_lease_protects_running_job(actor, wiki):
    from wiki.move_previews import run_pending_move_preview
    from wiki.revisions import application_lock
    job = queued(actor, wiki)
    type(job).objects.filter(pk=job.pk).update(state='running')
    with application_lock('move-preview-worker'):
        assert run_pending_move_preview() is False
    job.refresh_from_db()
    assert job.state == 'running'


def test_old_job_failure_retained_for_hour_after_settlement(actor, wiki):
    from wiki.move_previews import run_pending_move_preview
    from wiki.revisions import _prune
    job = queued(actor, wiki)
    type(job).objects.filter(pk=job.pk).update(created_at=timezone.now() - timezone.timedelta(days=2))
    assert run_pending_move_preview()
    job.refresh_from_db()
    assert job.state == 'failed'
    _prune(timezone.now())
    assert type(job).objects.filter(pk=job.pk).exists()
    job.refresh_from_db()
    assert job.settled_at is not None
    _prune(job.settled_at + timezone.timedelta(hours=1, seconds=1))
    assert not type(job).objects.filter(pk=job.pk).exists()
