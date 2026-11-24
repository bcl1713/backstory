"""Explicit contained-hop mode: no backend client credentials or TLS stand-ins."""
import os
from pathlib import Path
import subprocess
import sys

import pytest

pytest.importorskip('mcp', reason='optional native-mcp runtime required')
REPO = Path(__file__).resolve().parents[2]


def arguments(tmp_path, endpoint='https://client.test.invalid/mcp'):
    wiki, data = tmp_path / 'wiki', tmp_path / 'data'
    wiki.mkdir()
    data.mkdir()
    (data / 'backstory.sqlite3').touch()
    return ['--proxy-only', '--wiki-root', str(wiki), '--data-dir', str(data), '--bind-ip', '192.168.80.3',
            '--port', '8001', '--npm-ip', '192.168.80.2', '--endpoint', endpoint]


@pytest.mark.parametrize('endpoint', ['https://client.test.invalid/mcp', 'https://client.test.invalid:9443/mcp'])
def test_explicit_proxy_accepts_external_authority_independent_of_backend(tmp_path, endpoint):
    from backstory.native_https import parse_settings

    selected = parse_settings(arguments(tmp_path, endpoint))
    assert selected.bind_ip == '192.168.80.3' and selected.npm_ip == '192.168.80.2'
    assert selected.port == 8001 and selected.endpoint == endpoint
    assert not any(hasattr(selected, name) for name in ('token_file', 'cert_file', 'key_file', 'forge_ip', 'lan_cidr'))


@pytest.mark.parametrize('extra', [['--https'], ['--forge-ip', '192.168.80.2'],
    ['--lan-cidr', '192.168.80.0/24'], ['--token-file', '/not/read'],
    ['--tls-cert', '/not/read'], ['--tls-key', '/not/read']])
def test_proxy_refuses_direct_mode_or_secret_selectors(tmp_path, extra):
    from backstory.native_https import parse_settings
    with pytest.raises(SystemExit) as error:
        parse_settings([*arguments(tmp_path), *extra])
    assert error.value.code == 2


@pytest.mark.parametrize('flag,value', [('--bind-ip', '0.0.0.0'), ('--bind-ip', '8.8.8.8'),
    ('--npm-ip', '192.168.80.3'), ('--npm-ip', '192.168.80.0/24'), ('--npm-ip', '8.8.8.8'),
    ('--endpoint', 'http://client.test.invalid/mcp'), ('--endpoint', 'https://client.test.invalid:443/mcp'),
    ('--endpoint', 'https://*.test.invalid/mcp'), ('--endpoint', 'https://client.test.invalid/mcp/'),
    ('--endpoint', 'https://client.test.invalid/mcp?q=1')])
def test_proxy_refuses_unsafe_network_or_authority(tmp_path, flag, value):
    from backstory.native_https import parse_settings
    args = arguments(tmp_path)
    args[args.index(flag) + 1] = value
    with pytest.raises(SystemExit) as error:
        parse_settings(args)
    assert error.value.code == 2


def test_proxy_sdk_and_shared_guards_without_listener(tmp_path):
    wiki = tmp_path / 'wiki'
    wiki.mkdir()
    (wiki / '.backstory-marker').touch()
    env = {**os.environ, 'BACKSTORY_WIKI_ROOT': str(wiki), 'BACKSTORY_DATA_DIR': str(tmp_path / 'data'),
           'DJANGO_SETTINGS_MODULE': 'backstory.settings', 'BACKSTORY_ALLOWED_HOSTS': 'localhost',
           'BACKSTORY_COOKIE_MODE': 'localhost', 'BACKSTORY_PROXY_PROOF_SCRATCH': str(tmp_path)}
    migrated = subprocess.run([sys.executable, 'manage.py', 'migrate', '--noinput'], cwd=REPO,
                             env=env, capture_output=True, text=True)
    assert migrated.returncode == 0, migrated.stderr
    result = subprocess.run([sys.executable, '-m', 'tests.native.proxy_proof'], cwd=REPO,
                            env=env, capture_output=True, text=True, timeout=45)
    assert result.returncode == 0, result.stderr
    print(result.stdout.strip())
