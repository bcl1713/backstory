"""A slow inventory must not hide the caller's durable preview handle."""
import pytest

from tests.integration.test_browsing import reader
from tests.integration.test_storage import wiki
from tests.integration.test_index_diagnostics import file_database

pytestmark = pytest.mark.django_db(transaction=True)


def test_preview_returns_handle_before_planning_and_get_never_runs_it(reader, wiki, monkeypatch):
    from wiki import relocations
    (wiki / 'From.md').write_text('# Disposable source\n')

    def forbidden(*args, **kwargs):
        pytest.fail('HTTP preview/status performed synchronous whole-wiki planning')

    monkeypatch.setattr(relocations, '_plan', forbidden)
    response = reader.post('/tools/moves/preview/', {'source': 'From.md', 'destination': 'To.md'},
                           content_type='application/json')
    assert response.status_code == 202
    pending = response.json()
    assert pending['state'] == 'preparing' and pending['operation_id']
    assert pending['next_action'] == 'get_move' and pending['poll_after_ms'] >= 100
    assert 'review_token' not in pending and 'inventory' not in pending
    status = reader.get('/tools/moves/get/', {'operation_id': pending['operation_id']})
    assert status.status_code == 200 and status.json()['state'] == 'preparing'
    assert (wiki / 'From.md').read_text() == '# Disposable source\n'
    assert not (wiki / 'To.md').exists()


def test_status_remains_inspectable_while_worker_holds_planner_lock(reader, wiki, file_database, monkeypatch):
    from concurrent.futures import ThreadPoolExecutor
    from threading import Event
    from django.db import connections
    from wiki import relocations
    from wiki.move_previews import run_pending_move_preview

    (wiki / 'From.md').write_text('# Disposable source\n')
    queued = reader.post('/tools/moves/preview/', {'source': 'From.md', 'destination': 'To.md'},
                         content_type='application/json').json()
    entered, release = Event(), Event()
    real_plan = relocations._plan

    def paused_plan(*args, **kwargs):
        entered.set()
        release.wait(timeout=5)
        return real_plan(*args, **kwargs)

    def worker():
        try:
            return run_pending_move_preview()
        finally:
            connections.close_all()

    monkeypatch.setattr(relocations, '_plan', paused_plan)
    with ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(worker)
        try:
            if not entered.wait(timeout=5):
                future.result(timeout=1)
                pytest.fail('worker never reached planning')
            status = reader.get('/tools/moves/get/', {'operation_id': queued['operation_id']})
            assert status.status_code == 200 and status.json()['state'] == 'preparing'
            assert not future.done() and 'review_token' not in status.json()
        finally:
            release.set()
        assert future.result(timeout=5)
    ready = reader.get('/tools/moves/get/', {'operation_id': queued['operation_id']}).json()
    assert ready['state'] == 'preview' and ready['operation_id'] == queued['operation_id']
    assert ready['review_token']


def test_supervised_command_prepares_one_job_without_content_mutation(reader, wiki, file_database, monkeypatch):
    import signal
    from django.core.management import call_command
    from indexing.management.commands import run_indexer
    from wiki.models import MoveOperation, MovePreviewJob

    (wiki / 'From.md').write_text('# Disposable source\n')
    response = reader.post('/tools/moves/preview/', {'source': 'From.md', 'destination': 'To.md'},
                           content_type='application/json')
    assert response.status_code == 202
    operation_id = response.json()['operation_id']
    previous = {sig: signal.getsignal(sig) for sig in (signal.SIGTERM, signal.SIGINT)}
    monkeypatch.setattr(run_indexer.os, 'nice', lambda value: None)
    try:
        call_command('run_indexer', once=True)
    finally:
        for sig, handler in previous.items():
            signal.signal(sig, handler)
    assert not MovePreviewJob.objects.filter(pk=operation_id).exists()
    assert MoveOperation.objects.get(pk=operation_id).state == 'preview'
    assert (wiki / 'From.md').read_text() == '# Disposable source\n'
    assert not (wiki / 'To.md').exists()


def test_unready_commit_is_refused_and_pending_preview_can_cancel(reader, wiki):
    from wiki.models import MoveOperation, MovePreviewJob
    (wiki / 'From.md').write_text('# Disposable source\n')
    operation_id = reader.post('/tools/moves/preview/', {'source': 'From.md', 'destination': 'To.md'},
                               content_type='application/json').json()['operation_id']
    refused = reader.post('/tools/moves/commit/', {'operation_id': operation_id, 'review_token': 'unreviewed'},
                          content_type='application/json')
    assert refused.status_code == 409 and refused.json()['reason_code'] == 'move_preview_not_ready'
    assert MovePreviewJob.objects.get(pk=operation_id).state == 'queued'
    cancelled = reader.post('/tools/moves/rollback/', {'operation_id': operation_id},
                            content_type='application/json')
    assert cancelled.status_code == 200 and cancelled.json()['state'] == 'cancelled'
    assert cancelled.json()['authoritative'] is False
    assert not MoveOperation.objects.filter(pk=operation_id).exists()
    assert reader.get('/tools/moves/get/', {'operation_id': operation_id}).json()['state'] == 'cancelled'
    assert (wiki / 'From.md').read_text() == '# Disposable source\n'


def test_failed_preparation_is_inspectable_and_can_cancel(reader, wiki, monkeypatch):
    from wiki import relocations
    from wiki.contracts import StorageError
    from wiki.move_previews import run_pending_move_preview
    from wiki.models import MoveOperation
    (wiki / 'From.md').write_text('# Disposable source\n')
    operation_id = reader.post('/tools/moves/preview/', {'source': 'From.md', 'destination': 'To.md'},
                               content_type='application/json').json()['operation_id']

    def fail(*args):
        raise StorageError('incomplete_link_inventory', 409)

    monkeypatch.setattr(relocations, '_plan', fail)
    assert run_pending_move_preview()
    failed = reader.get('/tools/moves/get/', {'operation_id': operation_id})
    assert failed.status_code == 200 and failed.json()['state'] == 'preview_failed'
    assert failed.json()['reason_code'] == 'incomplete_link_inventory' and 'review_token' not in failed.json()
    cancelled = reader.post('/tools/moves/rollback/', {'operation_id': operation_id},
                            content_type='application/json')
    assert cancelled.status_code == 200 and cancelled.json()['state'] == 'cancelled'
    assert not MoveOperation.objects.filter(pk=operation_id).exists()
    assert (wiki / 'From.md').read_text() == '# Disposable source\n'


def test_queued_status_and_cancel_obey_actor_and_current_policy(reader, wiki, django_user_model, settings):
    from django.test import Client
    from wiki.models import MovePreviewJob
    (wiki / 'From.md').write_text('# Disposable source\n')
    operation_id = reader.post('/tools/moves/preview/', {'source': 'From.md', 'destination': 'To.md'},
                               content_type='application/json').json()['operation_id']
    other = Client()
    other.force_login(django_user_model.objects.create_user(username='other-preview-owner'))
    denied = other.get('/tools/moves/get/', {'operation_id': operation_id})
    assert denied.status_code == 404 and b'From.md' not in denied.content
    assert other.post('/tools/moves/rollback/', {'operation_id': operation_id},
                      content_type='application/json').status_code == 404
    settings.BACKSTORY_EXCLUSIONS = ['To.md']
    denied = reader.get('/tools/moves/get/', {'operation_id': operation_id})
    assert denied.status_code == 404 and b'From.md' not in denied.content
    assert reader.post('/tools/moves/rollback/', {'operation_id': operation_id},
                       content_type='application/json').status_code == 404
    assert MovePreviewJob.objects.get(pk=operation_id).state == 'queued'
    assert (wiki / 'From.md').read_text() == '# Disposable source\n'
