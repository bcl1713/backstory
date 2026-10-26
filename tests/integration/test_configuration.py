"""Exercise settings in fresh processes, without an operator's configuration."""
import json
import os
import subprocess
import sys

import pytest


NUMBERS = {
    'BACKSTORY_INDEX_BATCH_SIZE': 20,
    'BACKSTORY_INDEX_YIELD_SECONDS': 1.0,
    'BACKSTORY_INDEX_INCREMENTAL_SECONDS': 300,
    'BACKSTORY_INDEX_VERIFY_SECONDS': 86400,
    'BACKSTORY_INDEX_QUEUE_LIMIT': 1000,
    'BACKSTORY_REVISION_QUOTA_BYTES': 67108864,
}


def load(tmp_path, changes=None):
    env = {key: value for key, value in os.environ.items()
           if not key.startswith(('BACKSTORY_', 'DJANGO_'))}
    values = {
        'BACKSTORY_WIKI_ROOT': str(tmp_path / 'wiki'),
        'BACKSTORY_DATA_DIR': str(tmp_path / 'data'),
        'BACKSTORY_COOKIE_MODE': 'localhost',
        'BACKSTORY_ALLOWED_HOSTS': 'localhost,127.0.0.1',
        **(changes or {}),
    }
    env.update({key: value for key, value in values.items() if value is not None})
    # Catch settings errors at the same boundary as a command-line entrypoint;
    # print only their public diagnostic, never environment contents.
    script = '''
import json
from django.core.exceptions import ImproperlyConfigured
try:
    from backstory import settings
except ImproperlyConfigured as error:
    raise SystemExit(str(error)) from None
print(json.dumps({name: getattr(settings, name) for name in %r}))
''' % list(NUMBERS)
    return subprocess.run([sys.executable, '-c', script], env=env,
                          text=True, capture_output=True, timeout=30)


def test_native_defaults_need_only_roots_and_local_security_choice(tmp_path):
    result = load(tmp_path)
    assert result.returncode == 0, result.stderr
    assert json.loads(result.stdout) == NUMBERS
    assert (tmp_path / 'data' / 'application-secret').is_file()
    assert not (tmp_path / 'wiki').exists()


@pytest.mark.parametrize('name', NUMBERS)
@pytest.mark.parametrize('value', ['', 'not-a-number-secret-canary', '0', '-1', 'NaN', 'inf', '1e10000'])
def test_bad_maintenance_values_are_named_redacted_and_precede_state_creation(tmp_path, name, value):
    result = load(tmp_path, {name: value})
    assert result.returncode != 0
    assert name in result.stderr
    assert 'must be' in result.stderr
    assert 'not-a-number-secret-canary' not in result.stderr
    assert 'ValueError' not in result.stderr
    assert not (tmp_path / 'data').exists()


@pytest.mark.parametrize('name', [name for name in NUMBERS if name != 'BACKSTORY_INDEX_YIELD_SECONDS'])
def test_integer_settings_reject_fractional_values(tmp_path, name):
    result = load(tmp_path, {name: '1.5'})
    assert result.returncode != 0
    assert name in result.stderr and 'integer' in result.stderr
    assert not (tmp_path / 'data').exists()


def test_positive_overrides_and_fractional_worker_delay(tmp_path):
    overrides = {name: '7' for name in NUMBERS}
    overrides['BACKSTORY_INDEX_YIELD_SECONDS'] = '1.5'
    result = load(tmp_path, overrides)
    assert result.returncode == 0, result.stderr
    assert json.loads(result.stdout) == {name: float(value) for name, value in overrides.items()}


def test_worker_delay_rejects_silently_clamped_subsecond_value(tmp_path):
    result = load(tmp_path, {'BACKSTORY_INDEX_YIELD_SECONDS': '0.5'})
    assert result.returncode != 0
    assert 'BACKSTORY_INDEX_YIELD_SECONDS' in result.stderr
    assert not (tmp_path / 'data').exists()


@pytest.mark.parametrize('name', ['BACKSTORY_WIKI_ROOT', 'BACKSTORY_DATA_DIR', 'BACKSTORY_ALLOWED_HOSTS'])
@pytest.mark.parametrize('value', [None, ''])
def test_missing_required_settings_identify_remedy(tmp_path, name, value):
    result = load(tmp_path, {name: value})
    assert result.returncode != 0
    assert name in result.stderr
    assert 'must' in result.stderr
    assert not (tmp_path / 'data').exists()


@pytest.mark.parametrize('name,value', [
    ('BACKSTORY_WIKI_ROOT', 'relative-secret-canary'),
    ('BACKSTORY_DATA_DIR', 'relative-secret-canary'),
    ('BACKSTORY_ALLOWED_HOSTS', 'https://host-secret-canary.invalid'),
    ('BACKSTORY_ALLOWED_HOSTS', '.host-secret-canary.invalid'),
    ('BACKSTORY_ALLOWED_HOSTS', 'host-secret-canary.invalid:8000'),
    ('BACKSTORY_CSRF_TRUSTED_ORIGINS', 'http://host-secret-canary.invalid'),
    ('BACKSTORY_CSRF_TRUSTED_ORIGINS', 'https://host-secret-canary.invalid/'),
])
def test_invalid_paths_and_https_inputs_fail_early_without_echo(tmp_path, name, value):
    result = load(tmp_path, {
        'BACKSTORY_COOKIE_MODE': 'https', 'BACKSTORY_ALLOWED_HOSTS': 'wiki.example.test',
        name: value,
    })
    assert result.returncode != 0
    assert name in result.stderr and 'must' in result.stderr
    assert 'secret-canary' not in result.stderr
    assert not (tmp_path / 'data').exists()


@pytest.mark.parametrize('name,value,related', [
    ('BACKSTORY_PROXY_MODE', 'invalid-secret-canary', 'BACKSTORY_PROXY_MODE'),
    ('BACKSTORY_TRUSTED_PROXY_IPS', '', 'BACKSTORY_TRUSTED_PROXY_IPS'),
    ('BACKSTORY_TRUSTED_PROXY_IPS', '0.0.0.0/0', 'BACKSTORY_TRUSTED_PROXY_IPS'),
    ('BACKSTORY_CSRF_TRUSTED_ORIGINS', '', 'BACKSTORY_CSRF_TRUSTED_ORIGINS'),
    ('BACKSTORY_PROXY_CLIENT_IP_HEADER', 'invalid-secret-canary', 'BACKSTORY_PROXY_CLIENT_IP_HEADER'),
])
def test_proxy_diagnostics_name_the_setting_and_remedy(tmp_path, name, value, related):
    result = load(tmp_path, {
        'BACKSTORY_COOKIE_MODE': 'https', 'BACKSTORY_ALLOWED_HOSTS': 'wiki.example.test',
        'BACKSTORY_PROXY_MODE': 'trusted', 'BACKSTORY_TRUSTED_PROXY_IPS': '192.0.2.20/32',
        'BACKSTORY_CSRF_TRUSTED_ORIGINS': 'https://wiki.example.test', name: value,
    })
    assert result.returncode != 0
    assert related in result.stderr and 'must' in result.stderr
    assert 'secret-canary' not in result.stderr
    assert not (tmp_path / 'data').exists()


def test_unusable_data_directory_has_redacted_ownership_remedy(tmp_path):
    target = tmp_path / 'private-path-secret-canary'
    target.write_text('not a directory')
    result = load(tmp_path, {'BACKSTORY_DATA_DIR': str(target)})
    assert result.returncode != 0
    assert 'BACKSTORY_DATA_DIR' in result.stderr
    assert 'UID/GID' in result.stderr
    assert 'private-path-secret-canary' not in result.stderr


def test_invalid_saved_secret_has_restore_remedy_without_echo(tmp_path):
    data = tmp_path / 'data'
    data.mkdir()
    (data / 'application-secret').write_text('secret-canary')
    result = load(tmp_path)
    assert result.returncode != 0
    assert 'BACKSTORY_DATA_DIR' in result.stderr
    assert 'restore' in result.stderr.lower()
    assert 'secret-canary' not in result.stderr


@pytest.mark.skipif(os.geteuid() == 0, reason='root can write mode-500 directories')
def test_existing_secret_does_not_hide_unwritable_private_data(tmp_path):
    data = tmp_path / 'private-path-secret-canary'
    data.mkdir()
    secret = data / 'application-secret'
    secret.write_text('synthetic-secret-canary-' * 4)
    data.chmod(0o500)
    try:
        result = load(tmp_path, {'BACKSTORY_DATA_DIR': str(data)})
        assert result.returncode != 0
        assert 'BACKSTORY_DATA_DIR' in result.stderr and 'UID/GID' in result.stderr
        assert 'secret-canary' not in result.stderr
        assert secret.read_text() == 'synthetic-secret-canary-' * 4
    finally:
        data.chmod(0o700)
