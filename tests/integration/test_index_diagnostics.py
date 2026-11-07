"""Synthetic failure boundaries: no production note data or database used."""
import json
import logging
import sqlite3

import pytest
from django.db import connection, OperationalError
from tests.integration.test_storage import wiki
from tests.integration.test_browsing import reader
from tests.integration.test_indexing import drain

pytestmark = pytest.mark.django_db(transaction=True)


@pytest.fixture(autouse=True)
def capture_index_log(caplog):
    logger = logging.getLogger("backstory.index")
    logger.addHandler(caplog.handler)
    try:
        yield
    finally:
        logger.removeHandler(caplog.handler)


def events(caplog):
    return [json.loads(record.getMessage()) for record in caplog.records
            if record.name == 'backstory.index']


def test_saved_bytes_survive_failed_enqueue_with_redacted_diagnostic(wiki, reader, monkeypatch, caplog):
    from wiki import saves
    from wiki.storage import read_note
    from django.contrib.auth import get_user_model
    (wiki / 'secret-path.md').write_text('# Before\n')
    def fail(*args):
        raise RuntimeError('/private/secret-path.md password=secret')
    monkeypatch.setattr(saves, 'enqueue_note', fail)
    result = saves.save_note(get_user_model().objects.get(username='synthetic-reader'),
                             'secret-path.md', '# After\n', read_note('secret-path.md').revision)
    assert result.state == 'saved_index_delayed'
    assert read_note('secret-path.md').revision == result.revision
    event, = events(caplog)
    assert event['operation'] == 'enqueue' and event['reason_code'] == 'index_enqueue_error'
    assert event['exception_class'] == 'RuntimeError'
    assert event['event_id'] and event['timestamp']
    assert 'secret' not in json.dumps(event) and 'After' not in json.dumps(event)


@pytest.mark.parametrize('error,reason', [(OSError('private/path'), 'index_io_error'),
                                           (OperationalError('secret sql'), 'index_database_error')])
def test_worker_preserves_safe_failure_evidence_after_recovery(wiki, monkeypatch, caplog, error, reason):
    from indexing import worker
    original = worker._run
    def fail(*args):
        raise error
    monkeypatch.setattr(worker, '_run', fail)
    assert worker.run_batch(now=100).state == 'backoff'
    from indexing.models import ScanState
    assert ScanState.objects.get(pk=1).last_error == reason
    event, = events(caplog)
    assert event['operation'] == 'worker' and event['reason_code'] == reason
    assert 'private' not in json.dumps(event) and 'secret' not in json.dumps(event)
    monkeypatch.setattr(worker, '_run', original)
    (wiki / 'note.md').write_text('# Healthy')
    drain(worker)
    assert worker.index_status().state == 'ready'
    assert worker.index_status().errors == 0
    assert events(caplog)[0] == event


def test_search_budget_has_specific_reason_and_clears_on_recovery(wiki, monkeypatch, caplog):
    from indexing import worker, search
    (wiki / 'note.md').write_text('# Example\nneedle')
    drain(worker)
    with monkeypatch.context() as patch:
        patch.setattr(search, 'SQLITE_VM_STEPS', 1)
        page = search.search_notes('needle')
    assert page.items == () and page.freshness.limited
    assert page.freshness.reason_code == 'search_budget_exceeded'
    event, = events(caplog)
    assert event['budget_triggered'] is True
    assert event['sqlite_errorcode'] == sqlite3.SQLITE_INTERRUPT
    assert event['sqlite_errorname'] == 'SQLITE_INTERRUPT'
    page = search.search_notes('needle')
    assert len(page.items) == 1 and not page.freshness.limited
    assert page.freshness.reason_code == ''


def test_search_database_failure_is_not_budget_exhaustion(wiki, caplog):
    from indexing import worker, search
    (wiki / 'note.md').write_text('# Example\nneedle')
    drain(worker)
    def fail_query(execute, sql, params, many, context):
        if 'SELECT n.path,substr' in sql:
            # Real SQLite error, wrapped as Django does, without changing data.
            try:
                connection.connection.execute('SELECT * FROM nonexistent_synthetic_table')
            except sqlite3.OperationalError as cause:
                raise OperationalError('private query') from cause
        return execute(sql, params, many, context)
    with connection.execute_wrapper(fail_query):
        page = search.search_notes('needle')
    assert page.items == () and page.freshness.limited
    assert page.freshness.reason_code == 'index_database_error'
    event, = events(caplog)
    assert event['budget_triggered'] is False
    assert event['sqlite_errorcode'] == sqlite3.SQLITE_ERROR
    assert 'private' not in json.dumps(event) and 'nonexistent' not in json.dumps(event)


@pytest.fixture
def file_database(tmp_path):
    """Copy the disposable test schema; restore Django's test connection afterward."""
    connection.ensure_connection()
    destination = tmp_path / 'concurrency.sqlite3'
    raw = sqlite3.connect(destination)
    connection.connection.backup(raw)
    raw.execute('PRAGMA journal_mode=WAL')
    raw.close()
    original = connection.settings_dict['NAME']
    # Django deliberately leaves an in-memory DB open on close(); swap wrappers'
    # raw connection instead, preserving it for the fixture teardown/flush.
    original_connection = connection.connection
    connection.connection = None
    connection.settings_dict['NAME'] = str(destination)
    try:
        connection.ensure_connection()
        yield destination
    finally:
        connection.close()
        connection.connection = original_connection
        connection.settings_dict['NAME'] = original


def test_enqueue_serializes_before_snapshot_reads(wiki, file_database):
    """A worker commit at the first queue SELECT must not strand a saved revision."""
    from indexing.models import ScanState, IndexJob, IndexedNote
    from indexing.queue import enqueue_note
    from indexing import worker
    from wiki.storage import read_note
    ScanState.objects.create(pk=1)
    competitor = sqlite3.connect(file_database, timeout=0, isolation_level=None)
    attempted = []
    def worker_commit(execute, sql, params, many, context):
        result = execute(sql, params, many, context)
        if not attempted and sql.lstrip().upper().startswith('SELECT'):
            try:
                competitor.execute('UPDATE indexing_scanstate SET processed=processed+1 WHERE id=1')
                attempted.append('committed')
            except sqlite3.OperationalError as error:
                assert error.sqlite_errorcode & 255 == sqlite3.SQLITE_BUSY
                attempted.append('serialized')
        return result
    try:
        (wiki / 'note.md').write_text('# New revision')
        revision = read_note('note.md').revision
        with connection.execute_wrapper(worker_commit):
            enqueue_note('note.md', revision)
        assert attempted == ['serialized']
        # The competing worker can write immediately after the tiny queue txn.
        competitor.execute('UPDATE indexing_scanstate SET processed=processed+1 WHERE id=1')
        assert IndexJob.objects.get(path='note.md').revision == revision
        drain(worker)
        assert IndexedNote.objects.get(path='note.md', generation__state='active').revision == revision
    finally:
        competitor.close()


def test_failure_state_write_error_does_not_hide_original_worker_error(wiki, monkeypatch, caplog):
    from indexing import worker
    from indexing.models import ScanState
    def fail(*args):
        raise OSError('sensitive filesystem failure')
    def fail_state(*args, **kwargs):
        raise OperationalError('sensitive sql')
    monkeypatch.setattr(worker, '_run', fail)
    monkeypatch.setattr(ScanState.objects, 'get_or_create', fail_state)
    assert worker.run_batch().state == 'backoff'
    assert [(e['operation'], e['reason_code']) for e in events(caplog)] == [
        ('worker', 'index_io_error'), ('worker_failure_state', 'index_database_error')]
    assert 'sensitive' not in caplog.text


def test_logging_sink_failure_cannot_fail_durable_save(wiki, reader, monkeypatch):
    from wiki import saves
    from indexing import diagnostics
    from django.contrib.auth import get_user_model
    from wiki.storage import read_note
    def fail(*args, **kwargs):
        raise RuntimeError('synthetic failure')
    monkeypatch.setattr(saves, 'enqueue_note', fail)
    monkeypatch.setattr(diagnostics.logger, 'warning', fail)
    result = saves.save_note(get_user_model().objects.get(username='synthetic-reader'),
                             'note.md', '# Published\n', None)
    assert result.state == 'saved_index_delayed'
    assert read_note('note.md').revision == result.revision


def test_real_sqlite_busy_is_classified_without_exception_message(wiki, file_database, caplog):
    from indexing.queue import enqueue_note
    from indexing.diagnostics import record_failure
    from indexing.models import ScanState
    ScanState.objects.create(pk=1)
    competitor = sqlite3.connect(file_database, isolation_level=None)
    competitor.execute('BEGIN IMMEDIATE')
    connection.connection.execute('PRAGMA busy_timeout=1')
    try:
        with pytest.raises(OperationalError) as failure:
            enqueue_note('private-note.md', 'private-revision')
        assert record_failure('enqueue', failure.value) == 'index_database_busy'
        event, = events(caplog)
        assert event['sqlite_errorname'] == 'SQLITE_BUSY'
        assert event['sqlite_errorcode'] == sqlite3.SQLITE_BUSY
        assert 'private' not in caplog.text
    finally:
        competitor.rollback()
        competitor.close()


def test_search_database_failure_shows_retry_not_narrow_query(wiki, reader):
    from indexing import worker
    (wiki / 'note.md').write_text('# Example\nneedle')
    drain(worker)
    def fail_query(execute, sql, params, many, context):
        if 'SELECT n.path,substr' in sql:
            raise OperationalError('sensitive sql')
        return execute(sql, params, many, context)
    with connection.execute_wrapper(fail_query):
        response = reader.get('/search/', {'q': 'needle'})
        tool = reader.get('/tools/search/', {'query': 'needle'})
    assert response.status_code == 200
    assert b'Try a narrower query' not in response.content
    assert b'Retry the search' in response.content
    assert tool.json()['state'] == 'incomplete'
    assert tool.json()['freshness']['reason_code'] == 'index_database_error'


def test_index_logger_rejects_raw_messages_and_untrusted_fields(caplog):
    logger = logging.getLogger('backstory.index')
    logger.warning('password=secret /private/file.md', extra={'index_event': {
        'operation': 'secret', 'reason_code': 'secret', 'event_id': 'secret',
        'timestamp': 'secret', 'exception_class': 'secret',
        'sqlite_errorname': 'secret', 'sqlite_errorcode': 'secret',
        'body': 'secret'}})
    assert 'secret' not in caplog.text
    assert 'private' not in caplog.text


def test_child_index_logger_cannot_bypass_redaction(caplog):
    # Descendant loggers skip ancestor logger filters, so handlers also sanitize.
    from io import StringIO
    logger = logging.getLogger('backstory.index')
    handler = logger.handlers[0]
    stream = StringIO()
    original = handler.setStream(stream)
    try:
        logging.getLogger('backstory.index.child').warning('secret /private/path')
        assert 'secret' not in stream.getvalue()
        assert 'private' not in stream.getvalue()
    finally:
        handler.setStream(original)


def test_diagnostic_timestamp_survives_exact_second(monkeypatch, caplog):
    from datetime import datetime, timezone
    from types import SimpleNamespace
    from indexing import diagnostics
    stamp = datetime(2026, 10, 30, 19, 0, 0, tzinfo=timezone.utc)
    monkeypatch.setattr(diagnostics, 'datetime', SimpleNamespace(now=lambda tz: stamp))
    diagnostics.record_failure('enqueue', RuntimeError('not logged'))
    event, = events(caplog)
    assert event['timestamp'] == '2026-10-30T19:00:00.000000+00:00'
