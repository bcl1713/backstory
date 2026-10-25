"""Transport trust must precede HTTPS, authentication and throttle decisions."""
import json
import os
import subprocess
import sys

import pytest
from django.test import Client
from tests.integration.test_storage import wiki
from tests.integration.test_saves import revision


@pytest.fixture
def trusted(settings):
    settings.BACKSTORY_PROXY_MODE = 'trusted'
    settings.BACKSTORY_TRUSTED_PROXY_IPS = ('192.0.2.10/32', '2001:db8::/64')
    settings.BACKSTORY_PROXY_CLIENT_IP_HEADER = 'none'
    settings.BACKSTORY_COOKIE_MODE = 'https'
    settings.ALLOWED_HOSTS = ['notes.example.invalid']
    settings.CSRF_TRUSTED_ORIGINS = ['https://notes.example.invalid']
    settings.SESSION_COOKIE_SECURE = settings.CSRF_COOKIE_SECURE = True
    settings.SECURE_SSL_REDIRECT = True
    return settings


def browser(**kwargs):
    return Client(REMOTE_ADDR='192.0.2.10', HTTP_HOST='notes.example.invalid',
                  HTTP_X_FORWARDED_PROTO='https', **kwargs)


def startup(tmp_path, changes):
    env = dict(os.environ, BACKSTORY_WIKI_ROOT=str(tmp_path / 'wiki'),
        BACKSTORY_DATA_DIR=str(tmp_path / 'data'), BACKSTORY_COOKIE_MODE='https',
        BACKSTORY_ALLOWED_HOSTS='notes.example.invalid',
        BACKSTORY_CSRF_TRUSTED_ORIGINS='https://notes.example.invalid',
        BACKSTORY_PROXY_MODE='trusted', BACKSTORY_TRUSTED_PROXY_IPS='192.0.2.10/32,2001:db8::/64',
        BACKSTORY_PROXY_CLIENT_IP_HEADER='none')
    env.update(changes)
    return subprocess.run([sys.executable, 'manage.py', 'check'], env=env,
                          capture_output=True, text=True, timeout=30)


def test_trusted_configuration_starts(tmp_path):
    result = startup(tmp_path, {})
    assert result.returncode == 0, result.stderr


@pytest.mark.parametrize('changes', [
    {'BACKSTORY_PROXY_MODE': 'unknown'}, {'BACKSTORY_TRUSTED_PROXY_IPS': ''},
    {'BACKSTORY_TRUSTED_PROXY_IPS': '*'}, {'BACKSTORY_TRUSTED_PROXY_IPS': '0.0.0.0/0'},
    {'BACKSTORY_TRUSTED_PROXY_IPS': '::/0'}, {'BACKSTORY_TRUSTED_PROXY_IPS': '192.0.2.0/24,garbage'},
    {'BACKSTORY_TRUSTED_PROXY_IPS': '192.0.2.0/24,'},
    {'BACKSTORY_TRUSTED_PROXY_IPS': 'fe80::1%eth0'},
    {'BACKSTORY_COOKIE_MODE': 'localhost', 'BACKSTORY_ALLOWED_HOSTS': 'localhost'},
    {'BACKSTORY_ALLOWED_HOSTS': '.example.invalid'}, {'BACKSTORY_ALLOWED_HOSTS': '*.example.invalid'},
    {'BACKSTORY_ALLOWED_HOSTS': 'https://notes.example.invalid'},
    {'BACKSTORY_CSRF_TRUSTED_ORIGINS': ''}, {'BACKSTORY_CSRF_TRUSTED_ORIGINS': 'http://notes.example.invalid'},
    {'BACKSTORY_CSRF_TRUSTED_ORIGINS': 'https://*.example.invalid'},
    {'BACKSTORY_CSRF_TRUSTED_ORIGINS': 'https://notes.example.invalid/path'},
    {'BACKSTORY_CSRF_TRUSTED_ORIGINS': 'https://user@notes.example.invalid'},
    {'BACKSTORY_CSRF_TRUSTED_ORIGINS': 'https://other.example.invalid'},
    {'BACKSTORY_PROXY_CLIENT_IP_HEADER': 'cf-connecting-ip'},
])
def test_invalid_proxy_configuration_fails_before_service(tmp_path, changes):
    assert startup(tmp_path, changes).returncode != 0


def test_deploy_check_accepts_valid_trust(trusted):
    from backstory.checks import deployment_security
    assert deployment_security(None) == []


@pytest.mark.parametrize('change', [
    {'BACKSTORY_TRUSTED_PROXY_IPS': ()}, {'BACKSTORY_TRUSTED_PROXY_IPS': ('0.0.0.0/0',)},
    {'BACKSTORY_COOKIE_MODE': 'localhost'}, {'SESSION_COOKIE_SECURE': False},
    {'CSRF_TRUSTED_ORIGINS': []}, {'ALLOWED_HOSTS': ['.example.invalid']},
    {'SECURE_PROXY_SSL_HEADER': ('HTTP_X_FORWARDED_PROTO', 'https')},
    {'USE_X_FORWARDED_HOST': True}, {'BACKSTORY_PROXY_CLIENT_IP_HEADER': 'unknown'},
])
def test_deploy_check_rejects_changed_unsafe_trust(trusted, change):
    from backstory.checks import deployment_security
    for key, value in change.items():
        setattr(trusted, key, value)
    assert deployment_security(None)


def test_guard_order_is_checked(trusted):
    from backstory.checks import deployment_security
    trusted.MIDDLEWARE = [entry for entry in trusted.MIDDLEWARE if entry != 'backstory.middleware.TrustedProxyMiddleware']
    assert deployment_security(None)


@pytest.mark.django_db
def test_trusted_https_reaches_app_without_redirect_and_ignores_identity(trusted):
    client = browser()
    response = client.get('/accounts/login/', HTTP_X_FORWARDED_HOST='evil.invalid', HTTP_X_FORWARDED_SSL='off')
    assert response.status_code == 200
    assert response.wsgi_request.is_secure()
    assert client.get('/', HTTP_CF_ACCESS_AUTHENTICATED_USER_EMAIL='owner@example.invalid', HTTP_REMOTE_USER='owner').status_code == 302


@pytest.mark.django_db
@pytest.mark.parametrize('headers', [
    {'REMOTE_ADDR': '192.0.2.11'}, {'REMOTE_ADDR': ''}, {'REMOTE_ADDR': 'broken'},
    {'REMOTE_ADDR': '192.0.2.10:80'}, {'REMOTE_ADDR': 'fe80::1%eth0'},
    {'HTTP_X_FORWARDED_PROTO': ''}, {'HTTP_X_FORWARDED_PROTO': 'http'},
    {'HTTP_X_FORWARDED_PROTO': 'HTTPS'}, {'HTTP_X_FORWARDED_PROTO': 'https,http'},
    {'HTTP_X_FORWARDED_PROTO': 'https, https'}, {'HTTP_X_FORWARDED_PROTO': ' https'},
    {'HTTP_X_FORWARDED_PROTO': 'https\n'},
])
def test_invalid_transport_rejected_before_auth_and_redirect(trusted, headers, caplog):
    response = browser().get('/private-canary?secret-canary', **headers)
    assert response.status_code == 400
    assert response.content in {b'untrusted_proxy', b'invalid_proxy_scheme'}
    assert response['Cache-Control'] == 'no-store'
    assert 'Content-Security-Policy' in response
    assert 'Location' not in response
    assert 'canary' not in caplog.text


@pytest.mark.django_db
def test_missing_scheme_rejected_even_if_wsgi_already_secure(trusted):
    response = Client(REMOTE_ADDR='192.0.2.10', HTTP_HOST='notes.example.invalid').get('/accounts/login/', secure=True)
    assert response.status_code == 400


@pytest.mark.django_db
def test_off_mode_ignores_forwarding_headers(settings):
    response = Client().get('/accounts/login/', HTTP_X_FORWARDED_PROTO='https', HTTP_X_FORWARDED_SSL='on',
                            HTTP_X_FORWARDED_FOR='203.0.113.8', HTTP_X_REAL_IP='203.0.113.9')
    assert response.status_code == 200
    assert not response.wsgi_request.is_secure()
    from backstory.middleware import client_ip
    assert client_ip(response.wsgi_request) == '127.0.0.1'


@pytest.mark.django_db
@pytest.mark.parametrize('selection,header', [('x-forwarded-for', 'HTTP_X_FORWARDED_FOR'), ('x-real-ip', 'HTTP_X_REAL_IP')])
def test_optional_ip_header_uses_single_normalized_literal(trusted, selection, header):
    from backstory.middleware import client_ip
    trusted.BACKSTORY_PROXY_CLIENT_IP_HEADER = selection
    response = browser().get('/accounts/login/', **{header: '2001:0db8:0:0::1'})
    assert response.status_code == 200
    assert client_ip(response.wsgi_request) == '2001:db8::1'
    assert client_ip(browser().get('/accounts/login/').wsgi_request) == '192.0.2.10'


@pytest.mark.django_db
@pytest.mark.parametrize('value', ['', '192.0.2.3, 192.0.2.4', 'unknown', '192.0.2.3:80', '[::1]', 'fe80::1%eth0', ' 192.0.2.3', '192.0.2.3\n'])
def test_selected_forwarded_ip_rejects_ambiguous_values(trusted, value):
    trusted.BACKSTORY_PROXY_CLIENT_IP_HEADER = 'x-forwarded-for'
    response = browser().get('/accounts/login/', HTTP_X_FORWARDED_FOR=value)
    assert response.status_code == 400 and response.content == b'invalid_proxy_client_ip'


@pytest.mark.django_db
def test_trusted_login_secure_cookies_csrf_save_and_revocation(trusted, wiki):
    from django.contrib.auth import get_user_model
    from accounts.sessions import revoke_sessions
    user = get_user_model().objects.create_user('proxy-reader', password='Synthetic password 928!')
    client = browser(enforce_csrf_checks=True)
    assert client.get('/accounts/login/').status_code == 200
    token = client.cookies['csrftoken'].value
    response = client.post('/accounts/login/', {'username': user.username, 'password': 'Synthetic password 928!', 'csrfmiddlewaretoken': token}, HTTP_ORIGIN='https://notes.example.invalid')
    assert response.status_code == 302
    for key in ['csrftoken', 'sessionid']:
        cookie = client.cookies[key]
        assert cookie['secure'] and cookie['httponly'] and cookie['samesite'] == 'Lax'
    target = wiki / 'note.md'; target.write_bytes(b'# Original\n')
    payload = json.dumps({'source': '# Changed\n', 'mode': 'formatted'})
    headers = {'HTTP_X_CSRFTOKEN': client.cookies['csrftoken'].value,
               'HTTP_IF_MATCH': revision(b'# Original\n'), 'HTTP_ORIGIN': 'https://notes.example.invalid'}
    assert client.post('/save/note.md', payload, content_type='application/json', **dict(headers, HTTP_ORIGIN='https://evil.invalid')).status_code == 403
    assert client.post('/save/note.md', payload, content_type='application/json', **dict(headers, HTTP_X_CSRFTOKEN='')).status_code == 403
    assert client.post('/save/note.md', payload, content_type='application/json', **dict(headers, HTTP_HOST='evil.invalid')).status_code == 400
    assert target.read_bytes() == b'# Original\n'
    assert client.post('/save/note.md', payload, content_type='application/json', **headers).status_code == 200
    assert target.read_bytes() == b'# Changed\n'
    revoke_sessions(user)
    assert client.get('/status/').status_code == 302
    client.force_login(user)
    user.is_active = False; user.save()
    assert client.get('/status/').status_code == 302


@pytest.mark.django_db
@pytest.mark.parametrize('selection', ['none', 'x-forwarded-for'])
def test_trusted_throttle_preserves_independent_account_and_ip_limits(trusted, selection):
    trusted.BACKSTORY_PROXY_CLIENT_IP_HEADER = selection
    client = browser()
    for number in range(5):
        response = client.post('/accounts/login/', {'username': 'locked', 'password': 'wrong'},
            HTTP_X_FORWARDED_FOR='203.0.113.8' if selection != 'none' else f'203.0.113.{number}',
            HTTP_X_REAL_IP=f'198.51.100.{number}')
    assert response.status_code == 429
    assert client.post('/accounts/login/', {'username': 'locked', 'password': 'wrong'}, HTTP_X_FORWARDED_FOR='203.0.113.9').status_code == 429
    assert client.post('/accounts/login/', {'username': 'different', 'password': 'wrong'}, HTTP_X_FORWARDED_FOR='203.0.113.8').status_code == 429


def test_packaged_gunicorn_disables_inherited_forwarding(monkeypatch):
    import runpy
    from gunicorn.app.wsgiapp import WSGIApplication
    module = runpy.run_path('docker/supervise.py')
    # Inspect the actual packaged command through Gunicorn's configuration loader.
    assert 'web_command' in module
    command = module['web_command']()
    monkeypatch.setenv('FORWARDED_ALLOW_IPS', '*')
    monkeypatch.setenv('GUNICORN_CMD_ARGS', '--forwarded-allow-ips=* --proxy-protocol=auto --forwarder-headers=*')
    monkeypatch.setattr(sys, 'argv', command)
    app = WSGIApplication()
    assert app.cfg.forwarded_allow_ips == []
    assert app.cfg.forwarder_headers == []
    assert app.cfg.proxy_protocol == 'off'


@pytest.mark.parametrize('address', ['0.0.0.0', '::', '192.0.2.20', '2001:db8::20', 'hostname.invalid', '127.0.0.1:8000', 'fe80::1%eth0'])
def test_localhost_cookie_mode_rejects_nonloopback_or_invalid_origin_bind(tmp_path, address):
    result = startup(tmp_path, {'BACKSTORY_PROXY_MODE':'off', 'BACKSTORY_COOKIE_MODE':'localhost',
        'BACKSTORY_ALLOWED_HOSTS':'localhost', 'BACKSTORY_BIND_ADDRESS':address})
    assert result.returncode != 0


@pytest.mark.parametrize('address', ['127.0.0.1', '::1'])
def test_localhost_cookie_mode_accepts_literal_loopback_bind(tmp_path, address):
    result = startup(tmp_path, {'BACKSTORY_PROXY_MODE':'off', 'BACKSTORY_COOKIE_MODE':'localhost',
        'BACKSTORY_ALLOWED_HOSTS':'localhost', 'BACKSTORY_BIND_ADDRESS':address})
    assert result.returncode == 0, result.stderr


def test_deploy_check_catches_unsafe_localhost_bind(settings):
    from backstory.checks import deployment_security
    settings.BACKSTORY_BIND_ADDRESS = '0.0.0.0'
    assert deployment_security(None)


@pytest.mark.parametrize('address', ['192.0.2.20', '0.0.0.0', '2001:db8::20', '::'])
def test_https_explicit_origin_bind_is_configurable(tmp_path, address):
    result = startup(tmp_path, {'BACKSTORY_BIND_ADDRESS':address})
    assert result.returncode == 0, result.stderr


def test_deploy_check_requires_peer_guard_before_authentication(trusted):
    from backstory.checks import deployment_security
    middleware = list(trusted.MIDDLEWARE)
    auth = 'django.contrib.auth.middleware.AuthenticationMiddleware'
    middleware.remove(auth)
    middleware.insert(1, auth)
    trusted.MIDDLEWARE = middleware
    assert deployment_security(None)


@pytest.mark.parametrize('peers', ['0.0.0.0/1,128.0.0.0/1', '::/1,8000::/1'])
def test_split_universal_trust_is_rejected(tmp_path, peers):
    assert startup(tmp_path, {'BACKSTORY_TRUSTED_PROXY_IPS':peers}).returncode != 0


@pytest.mark.django_db
def test_ipv6_peer_in_explicit_network_is_accepted(trusted):
    assert browser().get('/accounts/login/', REMOTE_ADDR='2001:db8::123').status_code == 200
    assert browser().get('/accounts/login/', REMOTE_ADDR='2001:db9::123').status_code == 400


@pytest.mark.django_db
def test_off_mode_never_selects_configured_forwarded_ip(settings):
    from backstory.middleware import client_ip
    settings.BACKSTORY_PROXY_CLIENT_IP_HEADER = 'x-forwarded-for'
    response = Client().get('/accounts/login/', HTTP_X_FORWARDED_FOR='203.0.113.8')
    assert response.status_code == 200
    assert client_ip(response.wsgi_request) == '127.0.0.1'
