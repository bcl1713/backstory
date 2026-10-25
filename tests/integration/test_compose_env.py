"""Evaluate Compose itself: .env settings must reach the intended mounts/process."""
import json
import os
from pathlib import Path
import shutil
import subprocess

import pytest
import yaml

REPO = Path(__file__).resolve().parents[2]
KEYS = (
    'COMPOSE_FILE', 'COMPOSE_PROJECT_NAME', 'BACKSTORY_UID', 'BACKSTORY_GID',
    'BACKSTORY_IMAGE', 'BACKSTORY_PORT', 'BACKSTORY_WIKI_ROOT',
    'BACKSTORY_IDENTITY_PATH', 'BACKSTORY_IDENTITY_SHA256',
    'BACKSTORY_DATA_HOST_PATH', 'BACKSTORY_WIKI_READ_ONLY',
    'BACKSTORY_EXCLUSIONS', 'BACKSTORY_REVISION_QUOTA_BYTES',
)


def config(tmp_path, *, files='compose.yaml', **values):
    if not shutil.which('docker'):
        pytest.skip('Docker Compose unavailable; packaging gate remains open')
    env = {key: value for key, value in os.environ.items() if key not in KEYS}
    dotenv = tmp_path / 'installation.env'
    settings = {
        'COMPOSE_PROJECT_NAME': 'backstory-env-test',
        'COMPOSE_FILE': ':'.join(str(REPO / name) for name in files.split(':')),
        'BACKSTORY_WIKI_ROOT': str(tmp_path / 'wiki'),
        'BACKSTORY_IDENTITY_PATH': 'Storage identity.txt',
        'BACKSTORY_IDENTITY_SHA256': 'a' * 64,
        **values,
    }
    dotenv.write_text('\n'.join(f'{key}={value}' for key, value in settings.items() if value is not None))
    result = subprocess.run(
        ['docker', 'compose', '--env-file', str(dotenv), 'config', '--format', 'json'],
        cwd=REPO, env=env, text=True, capture_output=True, timeout=30,
    )
    return result


def web_config(result):
    assert result.returncode == 0, result.stderr
    return json.loads(result.stdout)['services']['web']


def test_default_keeps_private_named_data_and_nonroot_image_user(tmp_path):
    web = web_config(config(tmp_path))
    assert web['user'] == '10001:10001'
    assert web['image'] == 'backstory:local'
    assert web['ports'][0]['host_ip'] == '127.0.0.1'
    assert web['ports'][0]['published'] == '8000'
    data = next(m for m in web['volumes'] if m['target'] == '/var/lib/backstory')
    assert data['type'] == 'volume' and data['source'] == 'backstory-data'
    wiki = next(m for m in web['volumes'] if m['target'] == '/wiki')
    assert wiki.get('read_only', False) is False


@pytest.mark.parametrize('readonly', ['true', 'false'])
def test_dotenv_selects_user_hostdata_and_forwards_storage_options(tmp_path, readonly):
    web = web_config(config(
        tmp_path, files='compose.yaml:compose.host-data.yaml',
        BACKSTORY_UID='1000', BACKSTORY_GID='1000',
        BACKSTORY_DATA_HOST_PATH=str(tmp_path / 'private data'),
        BACKSTORY_WIKI_READ_ONLY=readonly, BACKSTORY_PORT='8123',
        BACKSTORY_IMAGE='backstory:fixture', BACKSTORY_EXCLUSIONS='private,work/*.md',
        BACKSTORY_REVISION_QUOTA_BYTES='123456',
    ))
    assert web['user'] == '1000:1000'
    assert web['image'] == 'backstory:fixture'
    assert web['ports'][0]['host_ip'] == '127.0.0.1'
    assert web['ports'][0]['published'] == '8123'
    mounts = {m['target']: m for m in web['volumes']}
    assert mounts['/wiki'].get('read_only', False) is (readonly == 'true')
    data = mounts['/var/lib/backstory']
    assert data['type'] == 'bind' and data['source'] == str(tmp_path / 'private data')
    assert data.get('read_only', False) is False
    for target in ['/wiki', '/var/lib/backstory']:
        assert mounts[target].get('bind', {}).get('create_host_path', False) is False
    assert web['environment']['BACKSTORY_EXCLUSIONS'] == 'private,work/*.md'
    assert web['environment']['BACKSTORY_REVISION_QUOTA_BYTES'] == '123456'
    assert web['environment']['BACKSTORY_WIKI_ROOT'] == '/wiki'
    assert web['environment']['BACKSTORY_DATA_DIR'] == '/var/lib/backstory'
    assert web['environment']['BACKSTORY_COOKIE_MODE'] == 'localhost'
    assert web['environment']['BACKSTORY_ALLOWED_HOSTS'] == 'localhost,127.0.0.1'
    assert web['environment']['BACKSTORY_PROXY_MODE'] == 'off'


@pytest.mark.parametrize('key', ['BACKSTORY_WIKI_ROOT', 'BACKSTORY_DATA_HOST_PATH'])
def test_hostdata_requires_explicit_bind_paths(tmp_path, key):
    values = {'BACKSTORY_DATA_HOST_PATH': str(tmp_path / 'data'), key: None}
    result = config(tmp_path, files='compose.yaml:compose.host-data.yaml', **values)
    assert result.returncode != 0
    assert key in result.stderr


def test_all_host_binds_explicitly_refuse_path_creation():
    for name in ['compose.yaml', 'compose.host-data.yaml', 'compose.portainer.yaml']:
        source = yaml.safe_load((REPO / name).read_text())
        for mount in source['services']['web']['volumes']:
            if mount['type'] == 'bind':
                assert mount['bind']['create_host_path'] is False, (name, mount)


def test_portainer_standalone_is_build_free_with_same_hostdata_settings(tmp_path):
    values = dict(
        BACKSTORY_UID='1000', BACKSTORY_GID='1000',
        BACKSTORY_DATA_HOST_PATH=str(tmp_path / 'private data'),
        BACKSTORY_WIKI_READ_ONLY='true', BACKSTORY_PORT='8123',
        BACKSTORY_IMAGE='backstory:fixture', BACKSTORY_EXCLUSIONS='private',
        BACKSTORY_REVISION_QUOTA_BYTES='123456',
    )
    standalone = web_config(config(tmp_path, files='compose.portainer.yaml', **values))
    local = web_config(config(tmp_path, files='compose.yaml:compose.host-data.yaml', **values))
    assert 'build' not in standalone
    assert {key: value for key, value in local.items() if key != 'build'} == standalone


def test_plain_compose_discovers_dotenv_and_selects_hostdata(tmp_path):
    if not shutil.which('docker'):
        pytest.skip('Docker Compose unavailable; packaging gate remains open')
    for name in ['compose.yaml', 'compose.host-data.yaml']:
        shutil.copyfile(REPO / name, tmp_path / name)
    # Use auto-discovery, exactly as the documented ordinary Compose command.
    (tmp_path / '.env').write_text('\n'.join([
        'COMPOSE_PROJECT_NAME=backstory-plain-test',
        'COMPOSE_FILE=compose.yaml:compose.host-data.yaml',
        'BACKSTORY_UID=1000', 'BACKSTORY_GID=1000',
        f"BACKSTORY_WIKI_ROOT='{tmp_path / 'wiki'}'",
        f"BACKSTORY_DATA_HOST_PATH='{tmp_path / 'private data'}'",
        'BACKSTORY_IDENTITY_PATH=identity.txt',
        'BACKSTORY_IDENTITY_SHA256=' + 'b' * 64,
        'BACKSTORY_WIKI_READ_ONLY=true', 'BACKSTORY_EXCLUSIONS=private',
    ]))
    env = {key: value for key, value in os.environ.items() if key not in KEYS}
    result = subprocess.run(['docker', 'compose', 'config', '--format', 'json'],
                            cwd=tmp_path, env=env, text=True, capture_output=True, timeout=30)
    web = web_config(result)
    assert web['user'] == '1000:1000'
    mounts = {m['target']: m for m in web['volumes']}
    assert mounts['/var/lib/backstory']['type'] == 'bind'
    assert mounts['/var/lib/backstory']['source'] == str(tmp_path / 'private data')
    assert mounts['/wiki']['read_only'] is True
    assert web['environment']['BACKSTORY_EXCLUSIONS'] == 'private'
