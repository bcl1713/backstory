"""Packaging contracts; exact built-image lifecycle is also a release walkthrough."""
import json
import os
import shutil
import subprocess

import pytest
from tests.fixtures.generate import generate_fixture
from tests.integration.test_storage import wiki
from tests.integration.test_worker_lifecycle import (
    test_supervisor_propagates_failure_and_terminates_sibling,
    test_supervisor_sigterm_stops_children,
)


def test_compose_is_loopback_and_never_creates_host_wiki(tmp_path):
    if not shutil.which('docker'):
        pytest.skip('Docker Compose unavailable; exact container gate remains open')
    fixture = generate_fixture(tmp_path / 'container-fixture', 'small', for_containers=True)
    env = {**os.environ, 'BACKSTORY_WIKI_ROOT': str(fixture.wiki_root),
        'BACKSTORY_IDENTITY_PATH': fixture.identity_path, 'BACKSTORY_IDENTITY_SHA256': fixture.identity_sha256}
    result = subprocess.run(['docker', 'compose', 'config', '--format', 'json'], env=env, capture_output=True, text=True, timeout=30)
    assert result.returncode == 0, result.stderr
    web = json.loads(result.stdout)['services']['web']
    assert all(port['host_ip'] == '127.0.0.1' for port in web['ports'])
    bind = next(m for m in web['volumes'] if m['type'] == 'bind')
    assert bind['source'] == str(fixture.wiki_root)
    assert bind['bind']['create_host_path'] is False
    assert 'no-new-privileges:true' in web['security_opt'] and web['cap_drop'] == ['ALL']


@pytest.mark.django_db
def test_public_health_reports_web_process_without_storage_or_index(wiki, monkeypatch):
    from django.test import Client
    import wiki.readiness
    import indexing.worker
    def forbidden(*args, **kwargs):
        raise AssertionError('public health must not read private storage/index state')
    monkeypatch.setattr(wiki.readiness, 'check_readiness', forbidden)
    monkeypatch.setattr(indexing.worker, 'index_status', forbidden)
    response = Client().get('/health/')
    assert response.status_code == 200
    assert response.json() == {'web': 'ok'}
    assert response['Cache-Control'] == 'no-store'
    assert response['X-Content-Type-Options'] == 'nosniff'
    assert response['X-Frame-Options'] == 'DENY'
    assert "default-src 'self'" in response['Content-Security-Policy']
    assert not response.cookies
