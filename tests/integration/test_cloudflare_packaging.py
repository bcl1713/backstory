"""Render the optional tunnel installation without starting a tunnel or reading a wiki."""
import json
import os
from pathlib import Path
import shutil
import subprocess

import pytest

REPO = Path(__file__).resolve().parents[2]


def config(tmp_path, *, portainer=False, **overrides):
    if not shutil.which('docker'):
        pytest.skip('Docker Compose unavailable; tunnel packaging gate remains open')
    # A developer's installation and pytest's app settings must never supply inputs.
    env = {key: value for key, value in os.environ.items()
           if not key.startswith(('BACKSTORY_', 'CLOUDFLARE_', 'COMPOSE_', 'TUNNEL_'))}
    values = {
        'COMPOSE_PROJECT_NAME': 'backstory-tunnel-test',
        'COMPOSE_FILE': str(REPO / 'compose.cloudflare.yaml'),
        'BACKSTORY_IMAGE': 'backstory:fixture',
        'BACKSTORY_UID': '1000', 'BACKSTORY_GID': '1000',
        'BACKSTORY_WIKI_ROOT': str(tmp_path / 'wiki'),
        'BACKSTORY_DATA_HOST_PATH': str(tmp_path / 'private data'),
        'BACKSTORY_IDENTITY_PATH': '.backstory-marker',
        'BACKSTORY_ALLOWED_HOSTS': 'wiki.example.test',
        'BACKSTORY_CSRF_TRUSTED_ORIGINS': 'https://wiki.example.test',
        'BACKSTORY_TUNNEL_SUBNET': '172.30.241.0/29',
        'BACKSTORY_TUNNEL_CONNECTOR_IP': '172.30.241.3',
        'CLOUDFLARE_TUNNEL_TOKEN_FILE': str(tmp_path / 'private token'),
        **overrides,
    }
    dotenv = tmp_path / 'installation.env'
    dotenv.write_text('\n'.join(f"{key}='{value}'" for key, value in values.items()
                                if value is not None))
    command = ['docker', 'compose', '--env-file', str(dotenv)]
    if portainer:
        # Uploading the manifest does not depend on COMPOSE_FILE discovery.
        command += ['-f', str(REPO / 'compose.cloudflare.yaml')]
    return subprocess.run(command + ['config', '--format', 'json'], cwd=REPO,
                          env=env, text=True, capture_output=True, timeout=30)


def rendered(result):
    assert result.returncode == 0, result.stderr
    return json.loads(result.stdout)


@pytest.mark.parametrize('portainer', [False, True])
def test_tunnel_origin_has_no_host_ports_or_egress_and_only_connector_can_forward(tmp_path, portainer):
    deployment = rendered(config(tmp_path, portainer=portainer))
    assert set(deployment['services']) == {'web', 'cloudflared'}
    web, connector = (deployment['services'][name] for name in ['web', 'cloudflared'])
    for service in [web, connector]:
        assert not service.get('ports')
        assert 'build' not in service
        assert service['user'] == '1000:1000'
        assert service['cap_drop'] == ['ALL']
        assert 'no-new-privileges:true' in service['security_opt']
    assert set(web['networks']) == {'origin'}
    assert set(connector['networks']) == {'origin', 'egress'}
    assert deployment['networks']['origin']['internal'] is True
    assert not deployment['networks']['egress'].get('internal', False)
    assert not any(network.get('external', False) for network in deployment['networks'].values())
    assert deployment['networks']['origin']['ipam']['config'] == [{'subnet': '172.30.241.0/29'}]
    assert connector['networks']['origin']['ipv4_address'] == '172.30.241.3'
    assert web['environment']['BACKSTORY_TRUSTED_PROXY_IPS'] == '172.30.241.3/32'
    assert web['environment']['BACKSTORY_PROXY_MODE'] == 'trusted'
    assert web['environment']['BACKSTORY_COOKIE_MODE'] == 'https'
    assert web['environment']['BACKSTORY_ALLOWED_HOSTS'] == 'wiki.example.test'
    assert web['environment']['BACKSTORY_CSRF_TRUSTED_ORIGINS'] == 'https://wiki.example.test'
    assert web['environment']['BACKSTORY_PROXY_CLIENT_IP_HEADER'] == 'none'


def test_tunnel_mounts_preserve_storage_policy_and_keep_token_out_of_web(tmp_path):
    deployment = rendered(config(tmp_path, BACKSTORY_WIKI_READ_ONLY='true',
                                 BACKSTORY_EXCLUSIONS='private,work/*.md',
                                 BACKSTORY_REVISION_QUOTA_BYTES='123456'))
    web = deployment['services']['web']
    mounts = {mount['target']: mount for mount in web['volumes']}
    assert set(mounts) == {'/wiki', '/var/lib/backstory'}
    assert mounts['/wiki']['source'] == str(tmp_path / 'wiki')
    assert mounts['/wiki']['read_only'] is True
    assert mounts['/var/lib/backstory']['source'] == str(tmp_path / 'private data')
    assert not mounts['/var/lib/backstory'].get('read_only', False)
    for mount in mounts.values():
        assert mount['type'] == 'bind'
        assert not mount.get('bind', {}).get('create_host_path', False)
    expected = {
        'BACKSTORY_WIKI_ROOT': '/wiki', 'BACKSTORY_DATA_DIR': '/var/lib/backstory',
        'BACKSTORY_IDENTITY_PATH': '.backstory-marker',
        'BACKSTORY_EXCLUSIONS': 'private,work/*.md', 'BACKSTORY_REVISION_QUOTA_BYTES': '123456',
    }
    assert all(web['environment'][key] == value for key, value in expected.items())
    connector = deployment['services']['cloudflared']
    assert len(connector['volumes']) == 1
    token = connector['volumes'][0]
    assert token['type'] == 'bind'
    assert token['source'] == str(tmp_path / 'private token')
    assert token['target'] == '/run/secrets/cloudflare_tunnel_token'
    assert token['read_only'] is True
    assert not token.get('bind', {}).get('create_host_path', False)
    assert connector['read_only'] is True
    assert not connector.get('environment')
    assert connector['command'] == ['tunnel', '--no-autoupdate', 'run', '--token-file',
                                     '/run/secrets/cloudflare_tunnel_token']
    assert connector['image'].startswith('cloudflare/cloudflared:2026.10.3')
    assert all('TOKEN' not in key for key in web['environment'])


@pytest.mark.parametrize('key', [
    'BACKSTORY_IMAGE', 'BACKSTORY_WIKI_ROOT', 'BACKSTORY_DATA_HOST_PATH',
    'BACKSTORY_ALLOWED_HOSTS', 'BACKSTORY_CSRF_TRUSTED_ORIGINS',
    'BACKSTORY_TUNNEL_SUBNET', 'BACKSTORY_TUNNEL_CONNECTOR_IP',
    'CLOUDFLARE_TUNNEL_TOKEN_FILE',
])
@pytest.mark.parametrize('missing', [None, ''])
def test_tunnel_requires_explicit_storage_public_origin_and_private_token_path(tmp_path, key, missing):
    result = config(tmp_path, **{key: missing})
    assert result.returncode != 0
    assert key in result.stderr


def test_tunnel_trust_tracks_operator_selected_network_and_ignores_generic_overrides(tmp_path):
    deployment = rendered(config(tmp_path, BACKSTORY_TUNNEL_SUBNET='192.168.250.0/28',
        BACKSTORY_TUNNEL_CONNECTOR_IP='192.168.250.10', BACKSTORY_UID='1234', BACKSTORY_GID='2345',
        BACKSTORY_TRUSTED_PROXY_IPS='0.0.0.0/0', BACKSTORY_PROXY_MODE='off',
        BACKSTORY_COOKIE_MODE='localhost', BACKSTORY_PROXY_CLIENT_IP_HEADER='x-forwarded-for'))
    web, connector = (deployment['services'][name] for name in ['web', 'cloudflared'])
    assert web['user'] == connector['user'] == '1234:2345'
    assert connector['networks']['origin']['ipv4_address'] == '192.168.250.10'
    assert deployment['networks']['origin']['ipam']['config'] == [{'subnet': '192.168.250.0/28'}]
    assert web['environment']['BACKSTORY_TRUSTED_PROXY_IPS'] == '192.168.250.10/32'
    assert web['environment']['BACKSTORY_COOKIE_MODE'] == 'https'
    assert web['environment']['BACKSTORY_PROXY_MODE'] == 'trusted'
    assert web['environment']['BACKSTORY_PROXY_CLIENT_IP_HEADER'] == 'none'


def test_example_dotenv_selects_tunnel_manifest_with_plain_compose(tmp_path):
    if not shutil.which('docker'):
        pytest.skip('Docker Compose unavailable; tunnel packaging gate remains open')
    shutil.copyfile(REPO / 'compose.cloudflare.yaml', tmp_path / 'compose.cloudflare.yaml')
    example = (REPO / 'cloudflare.env.example').read_text()
    (tmp_path / '.env').write_text(example)
    env = {key: value for key, value in os.environ.items()
           if not key.startswith(('BACKSTORY_', 'CLOUDFLARE_', 'COMPOSE_', 'TUNNEL_'))}
    result = subprocess.run(['docker', 'compose', 'config', '--format', 'json'],
                            cwd=tmp_path, env=env, text=True, capture_output=True, timeout=30)
    deployment = rendered(result)
    assert set(deployment['services']) == {'web', 'cloudflared'}
    web, connector = (deployment['services'][name] for name in ['web', 'cloudflared'])
    assert web['image'] == 'ghcr.io/bcl1713/backstory:1.0.0'
    assert web['user'] == connector['user'] == '1000:1000'
    assert web['environment']['BACKSTORY_IDENTITY_PATH'] == '.backstory-marker'
    assert web['environment']['BACKSTORY_ALLOWED_HOSTS'] == 'wiki.example.test'
    assert next(m for m in web['volumes'] if m['target'] == '/wiki')['read_only'] is True
    assert connector['volumes'][0]['source'] == '/absolute/private/path/cloudflare-tunnel-token'
    assert not web.get('ports')

@pytest.mark.parametrize('portainer', [False, True])
@pytest.mark.parametrize('origin', [None, '', 'https://wiki.example.test'])
def test_self_contained_tunnel_transports_optional_renderer_origin_without_new_trust(tmp_path, portainer, origin):
    deployment = rendered(config(tmp_path, portainer=portainer, BACKSTORY_MERMAID_PARENT_ORIGIN=origin))
    web = deployment['services']['web']
    assert web['environment']['BACKSTORY_MERMAID_PARENT_ORIGIN'] == (origin or '')
    assert web['environment']['BACKSTORY_COOKIE_MODE'] == 'https'
    assert web['environment']['BACKSTORY_PROXY_MODE'] == 'trusted'
    assert web['environment']['BACKSTORY_CSRF_TRUSTED_ORIGINS'] == 'https://wiki.example.test'
    assert web['environment']['BACKSTORY_TRUSTED_PROXY_IPS'] == '172.30.241.3/32'
    assert web['environment']['BACKSTORY_PROXY_CLIENT_IP_HEADER'] == 'none'
    assert not web.get('ports') and set(web['networks']) == {'origin'}
    assert not deployment['services']['cloudflared'].get('environment')
