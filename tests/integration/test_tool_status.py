"""Status observes independent components without initializing or scheduling."""
import pytest
from tests.integration.test_storage import wiki
from tests.integration.test_browsing import reader
pytestmark = pytest.mark.django_db


def test_status_is_private_read_only_and_reports_unknown_build(reader, wiki):
    from wiki.models import WikiSettings
    from indexing.models import IndexJob
    response = reader.get('/tools/status/')
    assert response.status_code == 200
    body = response.json()
    assert body['application']['build'] == 'unknown'
    assert body['storage']['state'] == 'ready'
    assert body['timezone']['source'] == 'fallback'
    assert body['timezone']['timezone'] == 'UTC'
    assert body['recovery']['writes_paused'] is False
    assert body['capabilities']['contract_version'] == 1
    assert not WikiSettings.objects.exists()
    assert not IndexJob.objects.exists()
    assert response['Cache-Control'] == 'no-store'
    assert str(wiki) not in response.content.decode()


def test_status_component_failure_does_not_hide_other_results(reader, wiki, monkeypatch):
    import wiki.tool_status as status
    def broken():
        raise RuntimeError('/secret/path and credentials')
    monkeypatch.setattr(status, 'index_status', broken)
    result = reader.get('/tools/status/').json()
    assert result['state'] == 'partial'
    assert result['index']['reason_code'] == 'component_unavailable'
    assert result['storage']['state'] == 'ready'
    assert '/secret' not in str(result)


def test_status_unavailable_storage_and_configured_timezone(reader, wiki, settings):
    settings.BACKSTORY_WIKI_TIMEZONE = 'America/Chicago'
    (wiki / '.backstory-marker').unlink()
    result = reader.get('/tools/status/').json()
    assert result['storage']['state'] == 'unavailable'
    assert result['timezone']['timezone'] == 'America/Chicago'
    assert result['timezone']['source'] == 'environment'
    reader.logout()
    assert reader.get('/tools/status/').status_code == 401


@pytest.mark.parametrize('index_state', ['ready', 'stale', 'partial', 'backoff', 'unavailable'])
def test_status_preserves_index_states(reader, wiki, monkeypatch, index_state):
    import wiki.tool_status as status
    from dataclasses import make_dataclass
    Snapshot = make_dataclass('Snapshot', [('state', str), ('reason_code', str), ('pending_jobs', int)])
    monkeypatch.setattr(status, 'index_status', lambda: Snapshot(index_state, 'index_database_busy', 4))
    result = reader.get('/tools/status/').json()
    assert result['index']['state'] == index_state
    assert result['index']['pending_jobs'] == 4
    assert result['index']['observed_at']


def test_status_redacts_recovery_and_raw_index_failures(reader, wiki, monkeypatch):
    from django.contrib.auth import get_user_model
    from wiki.models import MoveOperation
    from dataclasses import make_dataclass
    import wiki.tool_status as status
    actor = get_user_model().objects.get(username='synthetic-reader')
    MoveOperation.objects.create(actor=actor, source='private-source', destination='private-destination', state='recovery_required', plan={'secret': 'private-plan'})
    Snapshot = make_dataclass('Snapshot', [('state', str), ('reason_code', str)])
    monkeypatch.setattr(status, 'index_status', lambda: Snapshot('backoff', 'privatefilename'))
    response = reader.get('/tools/status/')
    assert response.json()['recovery']['writes_paused'] is True
    assert response.json()['index']['reason_code'] == 'index_error'
    assert b'private-' not in response.content and b'privatefilename' not in response.content


@pytest.mark.parametrize('end_session', ['revoke', 'disable', 'expire'])
def test_status_requires_current_session(reader, wiki, end_session):
    from accounts.models import SessionDevice
    from django.contrib.auth import get_user_model
    from django.utils import timezone
    from datetime import timedelta
    if end_session == 'disable':
        get_user_model().objects.filter(username='synthetic-reader').update(is_active=False)
    elif end_session == 'revoke':
        SessionDevice.objects.update(revoked_at=timezone.now())
    else:
        SessionDevice.objects.update(absolute_expires_at=timezone.now() - timedelta(seconds=1))
    assert reader.get('/tools/status/').status_code == 401


def test_status_reads_real_index_backoff_without_resetting_diagnostics(reader, wiki):
    import time
    from indexing.models import ScanState
    until = time.time() + 60
    ScanState.objects.create(pk=1, backoff_until=until, errors=2,
                             last_error='index_database_busy', last_completed=123)
    result = reader.get('/tools/status/').json()
    assert result['index']['state'] == 'backoff'
    assert result['index']['reason_code'] == 'index_database_busy'
    assert result['index']['backoff_until'] == until
    assert result['index']['last_completed'] == 123
    state = ScanState.objects.get(pk=1)
    assert state.errors == 2 and state.last_error == 'index_database_busy'
    assert state.backoff_until == until
