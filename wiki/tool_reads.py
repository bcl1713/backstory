"""Small explicit batches of per-note observations, not a snapshot/export API."""
import time
from django.urls import reverse
from django.utils import timezone
from .contracts import PathDenied, StorageError
from .policy import authorize_content
from .storage import read_note

MAX_PATHS = 8
MAX_TOTAL_BYTES = 4 * 1024 * 1024
MAX_SECONDS = 2


def read_many(request, paths):
    if (not isinstance(paths, list) or not 1 <= len(paths) <= MAX_PATHS
            or any(not isinstance(path, str) or not 1 <= len(path) <= 4096 for path in paths)
            or len(set(paths)) != len(paths)):
        raise StorageError('invalid_read_many_request')
    started = time.monotonic()
    results, total, stopped = [], 0, None
    for path in paths:
        if stopped is None and time.monotonic() - started >= MAX_SECONDS:
            stopped = 'time_budget'
        if stopped:
            results.append({'path': path, 'state': 'unprocessed', 'reason_code': stopped})
            continue
        try:
            authorize_content(request, path)
            if not path.lower().endswith('.md'):
                raise PathDenied()
            note = read_note(path)
            size = len(note.raw_bytes)
            if total + size > MAX_TOTAL_BYTES:
                stopped = 'byte_budget'
                results.append({'path': path, 'state': 'unprocessed', 'reason_code': stopped})
                continue
            total += size
            results.append({'state': 'ok', 'path': path, 'href': reverse('wiki:note', args=[path]),
                            'source': note.source, 'revision': note.revision, 'bom': note.bom,
                            'newline': note.newline, 'authoritative': True,
                            'observed_at': timezone.now().isoformat()})
        except StorageError as error:
            state = {'not_found': 'missing', 'path_denied': 'denied', 'note_too_large': 'oversized'}.get(error.reason_code, 'unreadable')
            results.append({'path': path, 'state': state, 'reason_code': error.reason_code})
    return {'state': 'complete' if all(item['state'] == 'ok' for item in results) else 'partial',
            'results': results, 'atomic_snapshot': False, 'source_bytes': total,
            'processed': sum(item['state'] != 'unprocessed' for item in results)}
