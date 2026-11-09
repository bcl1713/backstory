"""Actual relocation service versus a concurrent session writer, disposable WAL."""
import sqlite3

import pytest
from django.db import connection
from django.utils import timezone
from tests.integration.test_browsing import reader
from tests.integration.test_storage import wiki
from tests.integration.test_index_diagnostics import file_database

pytestmark = pytest.mark.django_db(transaction=True)


@pytest.mark.parametrize('phase', ['start', 'finish'])
def test_move_serializes_history_transactions_before_reads(reader, wiki, file_database, monkeypatch, phase):
    from django.contrib.auth import get_user_model
    from accounts.models import SessionDevice
    from wiki import relocations
    from wiki.models import MoveOperation, SavedRevision
    actor = get_user_model().objects.get(username='synthetic-reader')
    timestamp = timezone.now()
    device = SessionDevice.objects.create(user=actor, session_key_digest='synthetic-digest',
        created_at=timestamp, last_seen_at=timestamp, absolute_expires_at=timestamp + timezone.timedelta(days=1), remembered=False)
    (wiki / 'From.md').write_text('# From\n')
    (wiki / 'Home.md').write_text('[[From]]\n')
    operation = relocations.preview_move(actor, 'From.md', 'To.md')
    expected_backups = len(operation.plan['changes'])
    original_start = relocations._start
    active_phase = 'start'
    def start(record):
        nonlocal active_phase
        original_start(record)
        active_phase = 'finish'
    monkeypatch.setattr(relocations, '_start', start)
    competitor = sqlite3.connect(file_database, timeout=0, isolation_level=None)
    attempts = []
    def concurrent_session(execute, sql, params, many, context):
        result = execute(sql, params, many, context)
        if (not attempts and active_phase == phase and connection.in_atomic_block
                and sql.lstrip().upper().startswith('SELECT') and 'wiki_savedrevision' in sql):
            try:
                competitor.execute('UPDATE accounts_sessiondevice SET last_seen_at=? WHERE id=?',
                                   ('2026-10-30 20:00:00', device.pk))
                attempts.append('committed')
            except sqlite3.OperationalError as error:
                assert error.sqlite_errorcode & 255 == sqlite3.SQLITE_BUSY
                attempts.append('serialized')
        return result
    try:
        with connection.execute_wrapper(concurrent_session):
            result = relocations.commit_move(actor, operation.pk)
        assert attempts == ['serialized']
        assert result['state'] == 'completed'
        assert MoveOperation.objects.get(pk=operation.pk).state == 'completed'
        assert not (wiki / 'From.md').exists()
        assert (wiki / 'To.md').read_text() == '# From\n'
        assert (wiki / 'Home.md').read_text() == '[[To]]\n'
        assert SavedRevision.objects.count() == expected_backups
        # The session writer proceeds immediately after the short transactions.
        competitor.execute('UPDATE accounts_sessiondevice SET last_seen_at=? WHERE id=?',
                           ('2026-10-30 20:01:00', device.pk))
        assert relocations.commit_move(actor, operation.pk)['state'] == 'completed'
        assert SavedRevision.objects.count() == expected_backups
    finally:
        competitor.close()


def test_busy_start_preserves_preview_and_bytes_until_explicit_retry(reader, wiki, file_database):
    from django.contrib.auth import get_user_model
    from django.db import OperationalError
    from wiki import relocations
    from wiki.models import MoveOperation, SavedRevision
    actor = get_user_model().objects.get(username='synthetic-reader')
    (wiki / 'From.md').write_text('# From\n')
    (wiki / 'Home.md').write_text('[[From]]\n')
    operation = relocations.preview_move(actor, 'From.md', 'To.md')
    backups = len(operation.plan['changes'])
    competitor = sqlite3.connect(file_database, timeout=0, isolation_level=None)
    competitor.execute('BEGIN IMMEDIATE')
    connection.connection.execute('PRAGMA busy_timeout=1')
    try:
        with pytest.raises(OperationalError):
            relocations.commit_move(actor, operation.pk)
        assert MoveOperation.objects.get(pk=operation.pk).state == 'preview'
        assert SavedRevision.objects.count() == 0
        assert (wiki / 'From.md').read_text() == '# From\n'
        assert (wiki / 'Home.md').read_text() == '[[From]]\n'
        assert not (wiki / 'To.md').exists()
    finally:
        competitor.rollback()
        competitor.close()
    # Only an explicit caller retry after inspecting the persisted state proceeds.
    assert relocations.commit_move(actor, operation.pk)['state'] == 'completed'
    assert SavedRevision.objects.count() == backups


@pytest.mark.parametrize('kind', ['move', 'note_removal', 'folder_removal'])
@pytest.mark.parametrize('journal', ['WAL', 'DELETE'])
def test_preview_serializes_quota_before_reads(reader, wiki, file_database, kind, journal):
    """An unrelated session commit cannot invalidate a preview's quota snapshot."""
    from django.contrib.auth import get_user_model
    from accounts.models import SessionDevice
    from wiki import relocations, removals
    from wiki.models import MoveOperation, RemovalOperation
    from wiki.storage import read_note
    actor = get_user_model().objects.get(username='synthetic-reader')
    timestamp = timezone.now()
    device = SessionDevice.objects.create(user=actor, session_key_digest='preview-synthetic-digest',
        created_at=timestamp, last_seen_at=timestamp,
        absolute_expires_at=timestamp + timezone.timedelta(days=1), remembered=False)
    (wiki / 'From.md').write_text('# From\n')
    revision = read_note('From.md').revision
    connection.connection.execute('PRAGMA journal_mode=' + journal)
    competitor = sqlite3.connect(file_database, timeout=0, isolation_level=None)
    (wiki / 'Empty').mkdir()
    attempts = []

    def concurrent_session(execute, sql, params, many, context):
        result = execute(sql, params, many, context)
        if (not attempts and connection.in_atomic_block
                and sql.lstrip().upper().startswith('SELECT') and 'wiki_savedrevision' in sql):
            try:
                competitor.execute('BEGIN IMMEDIATE')
                competitor.execute('UPDATE accounts_sessiondevice SET last_seen_at=? WHERE id=?',
                                   ('2026-11-08 23:00:00', device.pk))
                if journal == 'WAL':
                    competitor.commit()
                attempts.append('committed' if journal == 'WAL' else 'writer_started')
            except sqlite3.OperationalError as error:
                assert error.sqlite_errorcode & 255 == sqlite3.SQLITE_BUSY
                attempts.append('serialized')
        return result

    try:
        with connection.execute_wrapper(concurrent_session):
            if kind == 'move':
                result = relocations.preview_move(actor, 'From.md', 'To.md')
                assert result.state == 'preview'
                assert MoveOperation.objects.filter(pk=result.pk, state='preview').exists()
            else:
                result = (removals.preview_removal(actor, 'From.md', 'note', revision)
                    if kind == 'note_removal' else removals.preview_removal(actor, 'Empty', 'folder'))
                assert result['state'] == 'preview' and result['authoritative']
                assert RemovalOperation.objects.filter(pk=result['operation_id'], state='preview').exists()
        assert attempts == ['serialized']
        assert (wiki / 'From.md').read_text() == '# From\n'
        assert not (wiki / 'To.md').exists()
        assert (wiki / 'Empty').is_dir()
        competitor.execute('UPDATE accounts_sessiondevice SET last_seen_at=? WHERE id=?',
                           ('2026-11-08 23:01:00', device.pk))
    finally:
        competitor.close()
