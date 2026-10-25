"""Host bind provenance must reject private data overlap before any state write."""
import os
import subprocess
import sys

import pytest

from tests.integration.test_compose_env import config, web_config
from tests.integration.test_cloudflare_packaging import config as tunnel_config, rendered

SOURCE_KEYS = ('BACKSTORY_STORAGE_SOURCE_MODE', 'BACKSTORY_WIKI_HOST_SOURCE', 'BACKSTORY_DATA_HOST_SOURCE')


def start(tmp_path, *, mode='host-bind', wiki='/generated/wiki', data='/generated/private data', extra=None):
    env = {key: value for key, value in os.environ.items() if key not in SOURCE_KEYS}
    values = dict(zip(SOURCE_KEYS, (mode, wiki, data)))
    values.update(extra or {})
    env.update({key: value for key, value in values.items() if value is not None})
    # Simulate the distinct container targets; provenance refers to host sources,
    # which must never be resolved or opened in this process's filesystem.
    env.update(BACKSTORY_WIKI_ROOT=str(tmp_path / 'wiki-target'),
               BACKSTORY_DATA_DIR=str(tmp_path / 'data-target'))
    return subprocess.run([sys.executable, 'manage.py', 'check'], env=env,
                          text=True, capture_output=True, timeout=30)


@pytest.mark.parametrize('wiki,data', [
    ('/generated/wiki', '/generated/wiki'),
    ('/generated/wiki', '/generated/wiki/app-data'),
    ('/generated/data/wiki', '/generated/data'),
    ('/', '/generated/data'),
])
@pytest.mark.parametrize('existing_data', [False, True])
def test_overlapping_host_sources_fail_before_any_private_state(tmp_path, wiki, data, existing_data):
    if existing_data:
        (tmp_path / 'data-target').mkdir()
    result = start(tmp_path, wiki=wiki, data=data)
    assert result.returncode != 0
    assert 'host_source_overlap' in result.stderr
    if existing_data:
        assert list((tmp_path / 'data-target').iterdir()) == []
    else:
        assert not (tmp_path / 'data-target').exists()
    assert not (tmp_path / 'wiki-target').exists()


@pytest.mark.parametrize('wiki,data', [
    (None, None), (None, '/generated/data'), ('/generated/wiki', None),
    ('', '/generated/data'), ('/generated/wiki', ''),
    ('relative/wiki', '/generated/data'), ('/generated/wiki', 'relative/data'),
    ('/generated/wiki/', '/generated/wiki'), ('/generated//wiki', '/generated/data'),
    ('/generated/./wiki', '/generated/data'), ('/generated/wiki/../data', '/generated/data'),
    ('/generated/wiki', '/generated/data/../wiki'), ('//generated/wiki', '/generated/data'),
    ('C:\\wiki', '/generated/data'), ('/generated/wiki', '/generated/da\\ta'),
    ('/generated/wiki\n', '/generated/data'), ('/generated/wiki', '/generated/data\t'),
])
def test_missing_or_noncanonical_host_metadata_refuses_initialization(tmp_path, wiki, data):
    result = start(tmp_path, wiki=wiki, data=data)
    assert result.returncode != 0
    assert 'invalid_host_source_metadata' in result.stderr
    assert not (tmp_path / 'data-target').exists()


@pytest.mark.parametrize('mode,wiki,data', [
    ('unknown', None, None), ('', None, None),
    ('native', '/generated/wiki', '/generated/data'),
    (None, '/generated/wiki', None), (None, None, '/generated/data'),
])
def test_metadata_cannot_silently_disable_host_guard(tmp_path, mode, wiki, data):
    result = start(tmp_path, mode=mode, wiki=wiki, data=data)
    assert result.returncode != 0
    assert not (tmp_path / 'data-target').exists()


@pytest.mark.parametrize('wiki,data', [
    ('/generated/wiki', '/generated/private data'),
    ('/generated/wiki', '/generated/wiki-copy'),
])
def test_fresh_disjoint_host_sources_start_without_consulting_host_paths(tmp_path, wiki, data):
    result = start(tmp_path, wiki=wiki, data=data)
    assert result.returncode == 0, result.stderr
    assert (tmp_path / 'data-target' / 'application-secret').is_file()
    assert not (tmp_path / 'wiki-target').exists()


def test_native_and_named_volume_default_need_no_host_provenance(tmp_path):
    result = start(tmp_path, mode=None, wiki=None, data=None)
    assert result.returncode == 0, result.stderr
    assert (tmp_path / 'data-target' / 'application-secret').is_file()


@pytest.mark.parametrize('mode,wiki,data,valid', [
    ('host-bind', '/generated/wiki', '/generated/data', True),
    ('host-bind', '/generated/wiki', '/generated/wiki/data', False),
    ('host-bind', '/generated/data/wiki', '/generated/data', False),
    ('host-bind', '/generated/wiki', '/generated/wiki', False),
    ('host-bind', '/generated/wiki', None, False),
    ('host-bind', '/generated/wiki', '/generated/wiki/../data', False),
    ('native', None, None, True), ('native', '/generated/wiki', '/generated/data', False),
])
def test_deployment_check_uses_same_host_source_boundary(settings, mode, wiki, data, valid):
    from backstory.checks import deployment_security
    for key, value in zip(SOURCE_KEYS, (mode, wiki, data)):
        setattr(settings, key, value)
    errors = deployment_security(None)
    assert ('backstory.E003' not in {error.id for error in errors}) is valid


@pytest.mark.parametrize('entrypoint', ['host-data', 'portainer', 'cloudflare'])
@pytest.mark.parametrize('overlap', [False, True])
def test_every_host_data_manifest_derives_guard_values_from_actual_mounts(tmp_path, entrypoint, overlap):
    data = str(tmp_path / 'wiki' / 'app-data') if overlap else str(tmp_path / 'private data')
    values = dict(BACKSTORY_DATA_HOST_PATH=data, BACKSTORY_IMAGE='backstory:fixture',
        # Operators cannot override generated provenance through ordinary .env inputs.
        BACKSTORY_STORAGE_SOURCE_MODE='native', BACKSTORY_WIKI_HOST_SOURCE='/other/wiki',
        BACKSTORY_DATA_HOST_SOURCE='/other/data')
    if entrypoint == 'cloudflare':
        web = rendered(tunnel_config(tmp_path, **values))['services']['web']
    else:
        files = 'compose.portainer.yaml' if entrypoint == 'portainer' else 'compose.yaml:compose.host-data.yaml'
        web = web_config(config(tmp_path, files=files, **values))
    mounts = {mount['target']: mount for mount in web['volumes']}
    env = web['environment']
    assert env.get('BACKSTORY_STORAGE_SOURCE_MODE') == 'host-bind'
    assert env.get('BACKSTORY_WIKI_HOST_SOURCE') == mounts['/wiki']['source']
    assert env.get('BACKSTORY_DATA_HOST_SOURCE') == mounts['/var/lib/backstory']['source']
    result = start(tmp_path, extra=env)
    assert (result.returncode == 0) is not overlap, result.stderr
    assert (tmp_path / 'data-target' / 'application-secret').exists() is not overlap
