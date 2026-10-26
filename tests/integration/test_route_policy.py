import logging
import pytest
from django.test import Client
ROUTES = [("post", p) for p in ["/new/", "/save/a.md", "/format/a.md", "/preview/a.md", "/index/schedule/", "/drafts/", "/restore/1/"]]

@pytest.mark.django_db
@pytest.mark.parametrize('method,path', [r for r in ROUTES if r[0] == 'post'])
def test_mutations_require_csrf_origin_host(method, path):
    from django.contrib.auth import get_user_model
    client = Client(enforce_csrf_checks=True)
    client.force_login(get_user_model().objects.create_user('reader'))
    assert client.post(path).status_code == 403
    client.get('/accounts/login/')
    token = client.cookies['csrftoken'].value
    assert client.post(path, HTTP_X_CSRFTOKEN=token, HTTP_ORIGIN='https://evil.invalid').status_code == 403
    assert client.post(path, HTTP_X_CSRFTOKEN=token, HTTP_HOST='evil.invalid').status_code == 400

@pytest.mark.django_db
@pytest.mark.parametrize('path', ['/unknown/private-canary?q=secret-canary', '/source/private-canary', '/accounts/login/'])
def test_errors_have_headers_and_logs_are_redacted(path, caplog):
    caplog.set_level(logging.DEBUG)
    client = Client()
    response = client.get(path, HTTP_HOST='evil.invalid', HTTP_COOKIE='secret-canary')
    assert response['Cache-Control'] == 'no-store'
    assert response['X-Content-Type-Options'] == 'nosniff'
    assert 'Content-Security-Policy' in response
    assert 'canary' not in caplog.text

@pytest.mark.parametrize('change', [{'SESSION_COOKIE_SECURE': False}, {'CSRF_COOKIE_SECURE': False}, {'ALLOWED_HOSTS': ['*']}, {'CSRF_TRUSTED_ORIGINS': ['http://evil.invalid']}, {'SECURE_PROXY_SSL_HEADER': ('HTTP_X_FORWARDED_PROTO', 'https')}])
def test_production_settings_fail_closed(settings, change):
    from backstory.checks import deployment_security
    settings.BACKSTORY_COOKIE_MODE = 'https'
    for key, value in change.items():
        setattr(settings, key, value)
    assert deployment_security(None)


def test_gunicorn_redacts_malformed_request_and_exception():
    from backstory.logging import RedactRequest
    record = logging.LogRecord('gunicorn.error', logging.ERROR, '', 1, 'Malformed private-canary %s', ('secret-canary',), (ValueError, ValueError('secret-canary'), None))
    RedactRequest().filter(record)
    assert 'canary' not in logging.Formatter().format(record)
