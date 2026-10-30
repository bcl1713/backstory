"""Bounded read-only deployment observations; never probes by writing."""
from dataclasses import asdict
from django.utils import timezone
from django.conf import settings
from indexing.worker import index_status
from indexing.models import ScanState
from .models import MoveOperation
from .readiness import check_readiness
from .timezones import timezone_state


def _index():
    result = asdict(index_status())
    # Only machine codes, never raw exception messages from older deployments.
    safe_codes = {'index_database_busy', 'index_database_error', 'index_storage_error',
                  'index_io_error', 'index_enqueue_error', 'index_revision_changed',
                  'scan_directory_changed', 'not_found', 'path_denied', 'storage_io_error',
                  'invalid_utf8', 'note_too_large', 'marker_missing', 'marker_unreadable',
                  'root_missing', 'roots_overlap'}
    if result.get('reason_code') and result['reason_code'] not in safe_codes:
        result['reason_code'] = 'index_error'
    state = ScanState.objects.filter(pk=1).values('backoff_until').first()
    result['backoff_until'] = state['backoff_until'] if state else 0
    return result


def status_snapshot():
    observed_at = timezone.now().isoformat()
    result = {'state': 'ok', 'observed_at': observed_at,
              'application': {'name': 'Backstory', 'build': 'unknown', 'version': 'unknown'},
              'capabilities': {'contract_version': 1, 'note_max_bytes': settings.BACKSTORY_NOTE_MAX_BYTES,
                               'list_max_items': 100, 'folder_creation': True,
                               'read_many_max_paths': 8, 'read_many_max_source_bytes': 4194304,
                               'read_many_between_read_seconds': 2, 'save_serialization_scope': 'document'}}
    components = {
        'storage': lambda: asdict(check_readiness()),
        'recovery': lambda: {'writes_paused': MoveOperation.objects.filter(state__in=['applying', 'recovery_required']).exists()},
        'index': _index,
        'timezone': timezone_state,
    }
    for name, read in components.items():
        try:
            result[name] = {**read(), 'observed_at': timezone.now().isoformat()}
        except Exception:
            # Components may fail independently; diagnostics must not leak paths,
            # settings, note text, or another actor's recovery details.
            result[name] = {'state': 'unavailable', 'reason_code': 'component_unavailable',
                            'observed_at': timezone.now().isoformat()}
            result['state'] = 'partial'
    return result
