"""Real worker transactions versus a second writer on disposable WAL storage."""
import sqlite3

import pytest
from django.db import connection
from tests.integration.test_browsing import reader
from tests.integration.test_storage import wiki
from tests.integration.test_index_diagnostics import file_database
from tests.integration.test_indexing import drain

pytestmark = pytest.mark.django_db(transaction=True)


@pytest.mark.parametrize('phase', ['projection', 'finish'])
def test_worker_reserves_writer_before_dependent_reads(wiki, file_database, phase):
    from indexing import worker
    from indexing.models import IndexGeneration, ScanState, IndexedNote
    from wiki.storage import read_note
    (wiki / 'note.md').write_text('# Before\n')
    drain(worker)
    generation = IndexGeneration.objects.get(state='active')
    state = ScanState.objects.get(pk=1)
    state.checkpoint = {'token': 'test-token'}
    state.save(update_fields=['checkpoint'])
    IndexedNote.objects.update(seen='test-token')
    (wiki / 'note.md').write_text('# After\n')
    competitor = sqlite3.connect(file_database, timeout=0, isolation_level=None)
    attempts = []
    def concurrent_write(execute, sql, params, many, context):
        result = execute(sql, params, many, context)
        target = 'indexing_indexednote' if phase == 'projection' else 'indexing_indexjob'
        if (not attempts and connection.in_atomic_block and sql.lstrip().upper().startswith('SELECT') and target in sql):
            try:
                competitor.execute('UPDATE indexing_scanstate SET errors=errors+1 WHERE id=1')
                attempts.append('committed')
            except sqlite3.OperationalError as error:
                assert error.sqlite_errorcode & 255 == sqlite3.SQLITE_BUSY
                attempts.append('serialized')
        return result
    try:
        with connection.execute_wrapper(concurrent_write):
            if phase == 'projection':
                worker._commit_projection(read_note('note.md'), worker.file_stat('note.md'), [generation], 'test-token')
            else:
                assert worker._finish(state, generation, 2000000000)
        assert attempts == ['serialized']
        if phase == 'projection':
            assert IndexedNote.objects.get(path='note.md').revision == read_note('note.md').revision
        else:
            assert ScanState.objects.get(pk=1).checkpoint == {}
        competitor.execute('UPDATE indexing_scanstate SET errors=errors+1 WHERE id=1')
    finally:
        competitor.close()


@pytest.mark.parametrize('phase', ['projection', 'finish'])
def test_busy_worker_transaction_preserves_rows_until_explicit_retry(wiki, file_database, phase):
    from django.db import OperationalError
    from indexing import worker
    from indexing.models import IndexGeneration, ScanState, IndexedNote
    from wiki.storage import read_note
    (wiki / 'note.md').write_text('# Before\n')
    drain(worker)
    generation = IndexGeneration.objects.get(state='active')
    state = ScanState.objects.get(pk=1)
    state.checkpoint = {'token': 'test-token'}
    state.save(update_fields=['checkpoint'])
    IndexedNote.objects.update(seen='test-token')
    original_revision = IndexedNote.objects.get(path='note.md').revision
    (wiki / 'note.md').write_text('# After\n')
    def operation():
        if phase == 'projection':
            return worker._commit_projection(read_note('note.md'), worker.file_stat('note.md'), [generation], 'test-token')
        return worker._finish(state, generation, 2000000000)
    competitor = sqlite3.connect(file_database, timeout=0, isolation_level=None)
    competitor.execute('BEGIN IMMEDIATE')
    connection.connection.execute('PRAGMA busy_timeout=1')
    try:
        with pytest.raises(OperationalError) as caught:
            operation()
        assert caught.value.__cause__.sqlite_errorcode & 255 == sqlite3.SQLITE_BUSY
        assert IndexedNote.objects.get(path='note.md').revision == original_revision
        assert ScanState.objects.get(pk=1).checkpoint == {'token': 'test-token'}
        assert (wiki / 'note.md').read_text() == '# After\n'
    finally:
        competitor.rollback()
        competitor.close()
    operation()
    if phase == 'projection':
        assert IndexedNote.objects.get(path='note.md').revision == read_note('note.md').revision
    else:
        assert ScanState.objects.get(pk=1).checkpoint == {}


@pytest.mark.parametrize('journal', ['WAL', 'DELETE'])
@pytest.mark.parametrize('existing', [False, True])
def test_scan_request_reserves_writer_before_reading_priority(reader, wiki, file_database, journal, existing):
    from django.contrib.auth import get_user_model
    from django.utils import timezone
    from accounts.models import SessionDevice
    from indexing.models import ScanState
    from indexing.queue import request_scan

    ScanState.objects.all().delete()
    if existing:
        ScanState.objects.create(pk=1, requested='incremental')
    actor = get_user_model().objects.get(username='synthetic-reader')
    timestamp = timezone.now()
    device = SessionDevice.objects.create(user=actor, session_key_digest='scan-request-competitor',
        created_at=timestamp, last_seen_at=timestamp,
        absolute_expires_at=timestamp + timezone.timedelta(days=1), remembered=False)
    connection.connection.execute('PRAGMA journal_mode=' + journal)
    competitor = sqlite3.connect(file_database, timeout=0, isolation_level=None)
    attempts = []

    def session_update(execute, sql, params, many, context):
        result = execute(sql, params, many, context)
        if (not attempts and connection.in_atomic_block
                and sql.lstrip().upper().startswith('SELECT') and 'indexing_scanstate' in sql):
            try:
                competitor.execute('BEGIN IMMEDIATE')
                competitor.execute('UPDATE accounts_sessiondevice SET last_seen_at=? WHERE id=?',
                                   ('2026-11-09 01:20:00', device.pk))
                if journal == 'WAL':
                    competitor.commit()
                attempts.append('committed' if journal == 'WAL' else 'writer_started')
            except sqlite3.OperationalError as error:
                assert error.sqlite_errorcode & 255 == sqlite3.SQLITE_BUSY
                attempts.append('serialized')
        return result

    try:
        with connection.execute_wrapper(session_update):
            assert request_scan('verify').state == 'queued'
        assert attempts == ['serialized']
        assert ScanState.objects.get(pk=1).requested == 'verify'
        # Lower-priority requests cannot downgrade a retained stronger request.
        request_scan('incremental')
        assert ScanState.objects.get(pk=1).requested == 'verify'
        competitor.execute('UPDATE accounts_sessiondevice SET last_seen_at=? WHERE id=?',
                           ('2026-11-09 01:21:00', device.pk))
    finally:
        competitor.close()
