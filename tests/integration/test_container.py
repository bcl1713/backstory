"""Packaging contracts; exact built-image lifecycle is also a release walkthrough."""
import json
import os
from pathlib import Path
import shutil
import subprocess

import pytest
import yaml
from tests.fixtures.generate import generate_fixture
from tests.integration.test_storage import wiki
from tests.integration.test_worker_lifecycle import (
    test_supervisor_propagates_failure_and_terminates_sibling,
    test_supervisor_sigterm_stops_children,
)


@pytest.mark.parametrize('omit_false', [False, True], ids=['native-config', 'omitted-false-config'])
def test_compose_is_loopback_and_never_creates_host_wiki(tmp_path, omit_false):
    if not shutil.which('docker'):
        pytest.skip('Docker Compose unavailable; exact container gate remains open')
    fixture = generate_fixture(tmp_path / 'container-fixture', 'small', for_containers=True)
    env = {**os.environ, 'BACKSTORY_WIKI_ROOT': str(fixture.wiki_root),
        'BACKSTORY_IDENTITY_PATH': fixture.identity_path}
    result = subprocess.run(['docker', 'compose', 'config', '--format', 'json'], env=env, capture_output=True, text=True, timeout=30)
    assert result.returncode == 0, result.stderr
    web = json.loads(result.stdout)['services']['web']
    assert all(port['host_ip'] == '127.0.0.1' for port in web['ports'])
    bind = next(m for m in web['volumes'] if m['type'] == 'bind')
    assert bind['source'] == str(fixture.wiki_root)
    # Exercise the hosted Compose serializer's omission of a literal false.
    # Never remove a true value: that would hide a real configuration failure.
    if omit_false and bind.get('bind', {}).get('create_host_path') is False:
        del bind['bind']['create_host_path']
    # Source policy is explicit: Compose defaults must never enable creation.
    source = yaml.safe_load(Path('compose.yaml').read_text())
    source_bind = next(m for m in source['services']['web']['volumes']
                       if m['type'] == 'bind' and m['target'] == '/wiki')
    assert source_bind.get('bind', {}).get('create_host_path') is False
    # Some Compose versions omit false in normalized JSON. Source policy above
    # makes that omission safe to accept; an explicit normalized true still fails.
    assert bind.get('bind', {}).get('create_host_path', False) is False
    assert 'no-new-privileges:true' in web['security_opt'] and web['cap_drop'] == ['ALL']


@pytest.mark.django_db
def test_public_health_reports_web_process_without_storage_or_index(wiki, monkeypatch):
    from django.test import Client
    import wiki.readiness
    import wiki.views
    import indexing.worker
    def forbidden(*args, **kwargs):
        raise AssertionError('public health must not read private storage/index state')
    # Load consumers before patching so first URL import cannot retain a test
    # replacement after monkeypatch restores the defining module.
    monkeypatch.setattr(wiki.readiness, 'check_readiness', forbidden)
    monkeypatch.setattr(wiki.views, 'check_readiness', forbidden)
    monkeypatch.setattr(indexing.worker, 'index_status', forbidden)
    response = Client().get('/health/')
    assert response.status_code == 200
    assert response.json() == {'web': 'ok'}
    assert response['Cache-Control'] == 'no-store'
    assert response['X-Content-Type-Options'] == 'nosniff'
    assert response['X-Frame-Options'] == 'DENY'
    assert "default-src 'self'" in response['Content-Security-Policy']
    assert not response.cookies
