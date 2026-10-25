"""Durable maintenance using real SQLite and caller-owned storage."""
import importlib
import os
import pytest
from tests.integration.test_storage import wiki
from tests.integration.test_browsing import reader

pytestmark = pytest.mark.django_db(transaction=True)


def api():
    try:
        return importlib.import_module('indexing.worker')
    except ImportError:
        pytest.fail('durable indexing worker missing')


def drain(worker, cap=1000):
    for _ in range(cap):
        result = worker.run_batch(now=10000000000 + _ * 400)
        if not result.pending:
            return
    pytest.fail('worker did not finish bounded corpus')


def test_initial_build_resumes(wiki):
    w = api()
    from indexing.models import IndexedNote, ScanState
    for n in range(43):
        (wiki / f'n{n}.md').write_text(f'# Note {n}\n[[target]]')
    first = w.run_batch()
    assert first.processed <= 20 and first.pending
    checkpoint = ScanState.objects.get(pk=1).checkpoint
    assert checkpoint
    importlib.reload(w)
    drain(w)
    assert IndexedNote.objects.filter(generation__state='active').count() == 43
    assert w.index_status().state == 'ready'


def test_saved_note_preempts_bulk(wiki):
    w = api()
    from indexing.queue import enqueue_note
    from indexing.models import IndexedNote
    from wiki.storage import read_note
    for n in range(60):
        (wiki / f'n{n}.md').write_text('# old')
    w.run_batch()
    (wiki / 'urgent.md').write_text('# Fresh priority')
    enqueue_note('urgent.md', read_note('urgent.md').revision)
    result = w.run_batch()
    assert result.priority == 1
    assert IndexedNote.objects.filter(path='urgent.md', title='Fresh priority').exists()
    drain(w)
    assert IndexedNote.objects.filter(generation__state='active', path='urgent.md', title='Fresh priority').exists()


def test_queue_coalesces_and_bounds(wiki, settings):
    api()
    from indexing.queue import enqueue_note
    from indexing.models import IndexJob, ScanState
    settings.BACKSTORY_INDEX_QUEUE_LIMIT = 2
    for revision in ['a', 'b', 'c']:
        enqueue_note('one.md', revision)
    assert IndexJob.objects.count() == 1 and IndexJob.objects.get().revision == 'c'
    enqueue_note('two.md', 'd')
    enqueue_note('three.md', 'e')
    assert IndexJob.objects.count() == 2 and ScanState.objects.get(pk=1).reconcile_needed


def test_scheduler_uses_configured_defaults(wiki):
    w = api()
    from indexing.models import ScanState
    w.run_batch(now=1000)
    state = ScanState.objects.get(pk=1)
    assert state.next_incremental == 1300 and state.next_verify == 87400
    assert w.BATCH_SIZE == 20 and w.YIELD_SECONDS == 1


def test_failed_scan_keeps_generation(wiki):
    w = api()
    from indexing.queue import request_scan
    from indexing.models import IndexedNote, IndexGeneration
    (wiki / 'keep.md').write_text('# Keep')
    drain(w)
    original = IndexGeneration.objects.get(state='active').pk
    request_scan('rebuild')
    (wiki / 'Identity.txt').unlink()
    w.run_batch()
    assert IndexGeneration.objects.get(state='active').pk == original
    assert IndexedNote.objects.filter(generation_id=original, path='keep.md').exists()
    assert w.index_status().state in {'backoff', 'unavailable'}


def test_daily_verification_catches_same_stat_edit(wiki):
    w = api()
    from indexing.queue import request_scan
    from indexing.models import IndexedNote
    path = wiki / 'note.md'
    path.write_text('# One')
    drain(w)
    info = path.stat()
    path.write_text('# Two')
    os.utime(path, ns=(info.st_atime_ns, info.st_mtime_ns))
    request_scan('verify')
    drain(w)
    assert IndexedNote.objects.get(generation__state='active', path='note.md').title == 'Two'


def test_note_read_never_waits_for_worker(wiki, monkeypatch):
    api()
    from django.test import RequestFactory
    from django.contrib.auth import get_user_model
    from wiki import views, metadata
    from indexing import queue, worker
    from django.db import connection
    (wiki / 'note.md').write_text('---\nbroken: [\n---\n# Current')
    def forbidden(*args, **kwargs):
        pytest.fail('direct note request waited for index/parsing')
    monkeypatch.setattr(worker, 'run_batch', forbidden)
    monkeypatch.setattr(queue, 'enqueue_note', forbidden)
    monkeypatch.setattr(metadata, 'project_note', forbidden)
    request = RequestFactory().get('/notes/note.md')
    request.user = get_user_model()(username='synthetic', is_active=True)
    with connection.execute_wrapper(lambda execute, sql, params, many, context: forbidden()):
        assert views.note(request, 'note.md').status_code == 200
        assert views.source(request, 'note.md').status_code == 200


def test_scan_reconciles_deletion_only_when_complete_and_readable(wiki, monkeypatch):
    w = api()
    from indexing.queue import request_scan
    from indexing.models import IndexedNote
    from wiki.contracts import StorageError
    (wiki / 'keep.md').write_text('# Keep')
    (wiki / 'gone.md').write_text('# Gone')
    drain(w)
    (wiki / 'gone.md').unlink()
    original = w.read_note
    def fail(path):
        if path == 'keep.md':
            raise StorageError('storage_io_error', 503)
        return original(path)
    monkeypatch.setattr(w, 'read_note', fail)
    request_scan('verify')
    w.run_batch()
    assert IndexedNote.objects.filter(generation__state='active', path='gone.md').exists()
    monkeypatch.setattr(w, 'read_note', original)
    drain(w)
    assert not IndexedNote.objects.filter(generation__state='active', path='gone.md').exists()


def test_incremental_does_not_read_unchanged_note_bodies(wiki, monkeypatch):
    w = api()
    from indexing.queue import request_scan
    (wiki / 'note.md').write_text('# Stable')
    drain(w)
    monkeypatch.setattr(w, 'read_note', lambda path: pytest.fail('unchanged incremental reread body'))
    request_scan('incremental')
    drain(w)


def test_save_disk_success_survives_queue_failure_and_maintenance_repairs(wiki, reader, monkeypatch):
    w = api()
    from wiki import saves
    from wiki.storage import read_note
    from indexing.queue import request_scan
    from indexing.models import IndexedNote
    (wiki / 'note.md').write_text('# Original\n')
    base = read_note('note.md').revision
    def broken(*args):
        raise RuntimeError('synthetic queue failure')
    monkeypatch.setattr(saves, 'enqueue_note', broken)
    from django.contrib.auth import get_user_model
    result = saves.save_note(get_user_model().objects.get(username='synthetic-reader'), 'note.md', '# Saved\n', base)
    assert result.state == 'saved_index_delayed'
    assert read_note('note.md').source == '# Saved\n'
    request_scan('verify')
    drain(w)
    assert IndexedNote.objects.get(generation__state='active', path='note.md').revision == result.revision


def test_index_controls_require_authentication_and_csrf(wiki, reader):
    api()
    from django.test import Client
    assert Client().get('/index/status/').status_code == 302
    assert reader.get('/index/status/').status_code == 200
    assert reader.get('/index/schedule/').status_code == 405
    strict = Client(enforce_csrf_checks=True)
    strict.cookies = reader.cookies
    assert strict.post('/index/schedule/', {'kind': 'rebuild'}).status_code == 403
    assert reader.post('/index/schedule/', {'kind': 'rebuild'}).status_code == 302
    (wiki / 'Identity.txt').unlink()
    assert reader.get('/status/').status_code == 200
    assert reader.get('/index/status/').json()['state'] == 'unavailable'


def test_overflow_is_repaired_by_persistent_reconciliation(wiki, settings):
    w = api()
    from indexing.queue import enqueue_note
    from indexing.models import IndexedNote
    from wiki.storage import read_note
    settings.BACKSTORY_INDEX_QUEUE_LIMIT = 1
    (wiki / 'old.md').write_text('# Old')
    drain(w)
    for n in range(3):
        path = f'new{n}.md'
        (wiki / path).write_text(f'# New {n}')
        enqueue_note(path, read_note(path).revision)
    drain(w)
    assert IndexedNote.objects.filter(generation__state='active').count() == 4


def test_bulk_revision_change_cannot_replace_saved_revision(wiki, monkeypatch):
    w = api()
    from indexing.queue import enqueue_note, request_scan
    from indexing.models import IndexedNote
    from wiki.storage import read_note
    (wiki / 'note.md').write_text('# Old')
    drain(w)
    request_scan('rebuild')
    original = w.project_note
    changed = False
    def external_change(snapshot):
        nonlocal changed
        projection = original(snapshot)
        if snapshot.path == 'note.md' and not changed:
            changed = True
            (wiki / 'note.md').write_text('# Fresh saved')
            enqueue_note('note.md', read_note('note.md').revision)
        return projection
    monkeypatch.setattr(w, 'project_note', external_change)
    w.run_batch(now=10000010000)
    drain(w)
    note = IndexedNote.objects.get(generation__state='active', path='note.md')
    assert note.title == 'Fresh saved' and note.revision == read_note('note.md').revision


def test_final_identity_failure_blocks_candidate_promotion(wiki, monkeypatch):
    w = api()
    from indexing.models import IndexGeneration
    from indexing.queue import request_scan
    from wiki.contracts import StorageUnavailable
    (wiki / 'note.md').write_text('# Original')
    drain(w)
    original_id = IndexGeneration.objects.get(state='active').pk
    request_scan('rebuild')
    original = w._finish
    def uncertain(*args):
        (wiki / 'Identity.txt').unlink()
        return original(*args)
    monkeypatch.setattr(w, '_finish', uncertain)
    for n in range(10):
        if w.run_batch(now=10000010000 + n).state == 'backoff':
            break
    assert IndexGeneration.objects.get(state='active').pk == original_id
