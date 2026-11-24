"""Real SDK HTTP/TLS proof in a child configured before application setup."""
import json
import os
from pathlib import Path
import subprocess
import sys

import pytest

pytest.importorskip('mcp', reason='optional native-mcp runtime is required')

REPO = Path(__file__).resolve().parents[2]


def test_bearer_bound_includes_padding(tmp_path):
    from backstory.native_https import token_digest

    token = tmp_path / 'synthetic-token'
    token.write_bytes(b'a' * 32 + b'=' * 225)
    token.chmod(0o600)
    with pytest.raises(ValueError):
        token_digest(token)


def test_https_refuses_default_startup_without_selectors(tmp_path):
    env = {**os.environ, 'BACKSTORY_WIKI_ROOT': str(tmp_path / 'unselected-wiki'),
           'BACKSTORY_DATA_DIR': str(tmp_path / 'unselected-data')}
    result = subprocess.run([sys.executable, '-m', 'backstory.native_https'], cwd=REPO,
                            env=env, capture_output=True, text=True)
    assert result.returncode == 2 and 'required' in result.stderr
    assert not (tmp_path / 'unselected-data').exists()
    assert 'Traceback' not in result.stderr


def test_authenticated_https_without_bound_listener(tmp_path):
    wiki = tmp_path / 'wiki'
    wiki.mkdir()
    (wiki / '.backstory-marker').touch()
    env = {**os.environ, 'BACKSTORY_WIKI_ROOT': str(wiki),
           'BACKSTORY_DATA_DIR': str(tmp_path / 'data'),
           'BACKSTORY_ALLOWED_HOSTS': 'localhost', 'BACKSTORY_COOKIE_MODE': 'localhost',
           'DJANGO_SETTINGS_MODULE': 'backstory.settings',
           'BACKSTORY_HTTPS_PROOF_SCRATCH': str(tmp_path)}
    migrated = subprocess.run([sys.executable, 'manage.py', 'migrate', '--noinput'],
                              cwd=REPO, env=env, capture_output=True, text=True)
    assert migrated.returncode == 0, migrated.stderr
    result = subprocess.run([sys.executable, '-m', 'tests.native.https_proof'],
                            cwd=REPO, env=env, capture_output=True, text=True, timeout=90)
    assert result.returncode == 0, result.stderr
    if not env.get('BACKSTORY_TEST_HERMES_TOOLS'):
        assert json.loads(result.stdout)['hermes_source'] is None
    print(result.stdout.strip())


@pytest.mark.parametrize('cidr', ['0.0.0.0/0', '*', '8.8.8.0/24', '127.0.0.0/8',
    '169.254.0.0/16', '10.0.0.0/7', '172.0.0.0/8', '192.168.0.0/15', '::/0',
    '192.168.50.21/24', '192.168.50.0', '192.168.50.0/255.255.255.0',
    '192.168.50.0/025', '192.168.51.0/24'])
def test_lan_selector_refuses_unsafe_or_mismatched_subnet(tmp_path, cidr):
    from backstory.native_https import HttpsSettings

    wiki, data = tmp_path / 'wiki', tmp_path / 'data'
    wiki.mkdir()
    data.mkdir()
    (data / 'backstory.sqlite3').touch()
    with pytest.raises(ValueError):
        HttpsSettings(wiki, data, '192.168.50.10', 9443, 'https://backstory.test.invalid:9443/mcp',
                      None, tmp_path / 'token', tmp_path / 'cert', tmp_path / 'key', lan_cidr=cidr).validate()


def test_https_peer_selector_is_explicit_and_exclusive(tmp_path):
    from backstory.native_https import parse_settings

    wiki, data = tmp_path / 'wiki', tmp_path / 'data'
    wiki.mkdir()
    data.mkdir()
    (data / 'backstory.sqlite3').touch()
    args = ['--https', '--wiki-root', str(wiki), '--data-dir', str(data), '--bind-ip', '192.168.50.10',
            '--port', '9443', '--endpoint', 'https://backstory.test.invalid:9443/mcp',
            '--token-file', str(tmp_path / 'token'), '--tls-cert', str(tmp_path / 'cert'), '--tls-key', str(tmp_path / 'key')]
    for selector in ([], ['--forge-ip', '192.168.50.20', '--lan-cidr', '192.168.50.0/24']):
        with pytest.raises(SystemExit) as error:
            parse_settings([*args, *selector])
        assert error.value.code == 2
    assert parse_settings([*args, '--forge-ip', '192.168.50.20']).forge_ip == '192.168.50.20'
    selected = parse_settings([*args, '--lan-cidr', '192.168.50.0/24'])
    assert selected.lan_cidr == '192.168.50.0/24' and selected.forge_ip is None


def test_authenticated_lan_peers_without_bound_listener(tmp_path):
    wiki = tmp_path / 'wiki'
    wiki.mkdir()
    (wiki / '.backstory-marker').touch()
    env = {**os.environ, 'BACKSTORY_WIKI_ROOT': str(wiki), 'BACKSTORY_DATA_DIR': str(tmp_path / 'data'),
           'BACKSTORY_ALLOWED_HOSTS': 'localhost', 'BACKSTORY_COOKIE_MODE': 'localhost',
           'DJANGO_SETTINGS_MODULE': 'backstory.settings', 'BACKSTORY_HTTPS_PROOF_SCRATCH': str(tmp_path)}
    migrated = subprocess.run([sys.executable, 'manage.py', 'migrate', '--noinput'],
                             cwd=REPO, env=env, capture_output=True, text=True)
    assert migrated.returncode == 0, migrated.stderr
    result = subprocess.run([sys.executable, '-m', 'tests.native.lan_proof'], cwd=REPO,
                            env=env, capture_output=True, text=True, timeout=45)
    assert result.returncode == 0, result.stderr
    print(result.stdout.strip())
