"""Privacy-safe failure evidence, independent of the failing index database.

Never log exception messages, tracebacks, paths, SQL, revisions or note content.
Deployment log retention keeps historical evidence separate from current health.
"""
from datetime import datetime, timezone
import json
import logging
import re
import sqlite3
import uuid

from django.db import OperationalError
from wiki.contracts import StorageError

logger = logging.getLogger('backstory.index')


class RedactIndexDiagnostic(logging.Filter):
    """Only the fixed diagnostic schema reaches this dedicated log handler."""
    def filter(self, record):
        source = getattr(record, 'index_event', None)
        event = {}
        if isinstance(source, dict):
            choices = {
                'operation': {'enqueue', 'worker', 'worker_failure_state', 'search', 'resolve'},
                'reason_code': {'index_database_busy', 'index_database_error', 'index_storage_error',
                                'index_io_error', 'index_enqueue_error', 'search_budget_exceeded'},
                'exception_class': {'OperationalError', 'Error', 'StorageError', 'OSError',
                                    'RuntimeError', 'ValueError', 'TypeError', 'Exception'},
            }
            for key, allowed in choices.items():
                value = source.get(key)
                event[key] = value if isinstance(value, str) and value in allowed else 'unknown'
            event['event_id'] = source.get('event_id') if isinstance(source.get('event_id'), str) and re.fullmatch(r'[0-9a-f]{32}', source['event_id']) else None
            stamp = source.get('timestamp')
            event['timestamp'] = stamp if isinstance(stamp, str) and re.fullmatch(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}\+00:00', stamp) else None
            code, name = source.get('sqlite_errorcode'), source.get('sqlite_errorname')
            valid = type(code) is int and isinstance(name, str) and name.startswith('SQLITE_') and getattr(sqlite3, name, None) == code
            event['sqlite_errorcode'] = code if valid else None
            event['sqlite_errorname'] = name if valid else None
            event['budget_triggered'] = source.get('budget_triggered') is True
        record.msg = json.dumps(event, sort_keys=True)
        record.args = ()
        record.exc_info = record.exc_text = record.stack_info = None
        record.index_event = event
        for key in ('request', 'status_code'):
            record.__dict__.pop(key, None)
        return True


def sqlite_details(error):
    # Django wraps the original SQLite exception in __cause__.
    for _ in range(4):
        if isinstance(error, sqlite3.Error):
            code = getattr(error, 'sqlite_errorcode', None)
            name = getattr(error, 'sqlite_errorname', None)
            if (type(code) is int and isinstance(name, str)
                    and name.startswith('SQLITE_') and getattr(sqlite3, name, None) == code):
                return code, name
        error = getattr(error, '__cause__', None)
        if error is None:
            break
    return None, None


def failure_reason(error):
    code, _ = sqlite_details(error)
    if code is not None and code & 255 in (sqlite3.SQLITE_BUSY, sqlite3.SQLITE_LOCKED):
        return 'index_database_busy'
    if isinstance(error, (OperationalError, sqlite3.Error)):
        return 'index_database_error'
    if isinstance(error, StorageError):
        return 'index_storage_error'
    if isinstance(error, OSError):
        return 'index_io_error'
    return 'index_enqueue_error'


def record_failure(operation, error, *, budget_triggered=False):
    """Emit bounded, structured evidence; never compromise a completed save."""
    code, name = sqlite_details(error)
    reason = 'search_budget_exceeded' if budget_triggered else failure_reason(error)
    # Fixed classes avoid trusting names from application-defined exceptions.
    exception_class = next((kind.__name__ for kind in
                            (OperationalError, sqlite3.Error, StorageError, OSError,
                             RuntimeError, ValueError, TypeError)
                            if isinstance(error, kind)), 'Exception')
    event = dict(operation=operation, timestamp=datetime.now(timezone.utc).isoformat(timespec='microseconds'),
                 event_id=uuid.uuid4().hex, reason_code=reason,
                 exception_class=exception_class, sqlite_errorcode=code,
                 sqlite_errorname=name, budget_triggered=bool(budget_triggered))
    try:
        logger.warning('index_failure', extra={'index_event': event})
    except Exception:
        # A broken logging sink cannot invalidate already-published content or
        # suppress the worker's existing backoff/reconciliation path.
        pass
    return reason
