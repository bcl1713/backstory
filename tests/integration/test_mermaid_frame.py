from datetime import timedelta
import re
import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from django.utils import timezone

pytestmark = pytest.mark.django_db
ORIGIN = 'http://127.0.0.1:8765'

@pytest.fixture
def enabled(settings):
    settings.BACKSTORY_MERMAID_PARENT_ORIGIN = ORIGIN
    client = Client(HTTP_HOST='127.0.0.1:8765')
    client.force_login(get_user_model().objects.create_user('private-user-canary'))
    return client

def test_shell_is_fixed_authenticated_nonce_only_and_route_scoped(enabled):
    response = enabled.get('/renderers/mermaid-frame/')
    assert response.status_code == 200
    csp = response['Content-Security-Policy']
    assert "default-src 'none'" in csp
    assert f'frame-ancestors {ORIGIN}' in csp
    assert 'sandbox allow-scripts' in csp
    assert "style-src 'unsafe-inline'" in csp
    assert 'X-Frame-Options' not in response
    assert response['Referrer-Policy'] == 'no-referrer'
    body = response.content.decode()
    assert 'private-user-canary' not in body and 'csrf' not in body
    nonce = re.search(r'nonce="([\w-]+)"', body)[1]
    assert f"script-src 'nonce-{nonce}'" in csp
    assert nonce not in enabled.get('/renderers/mermaid-frame/').content.decode()
    assert re.search(r'/static/renderers/mermaid-frame-[A-Z0-9]+\.js', body)
    for resource in ['img', 'connect', 'font', 'media', 'object', 'frame', 'worker']:
        assert f"{resource}-src 'none'" in csp
    ordinary = enabled.get('/health/')
    assert ordinary['X-Frame-Options'] == 'DENY'
    assert "frame-ancestors 'none'" in ordinary['Content-Security-Policy']
    assert "'unsafe-inline'" not in ordinary['Content-Security-Policy']

@pytest.mark.parametrize('path,method', [('/renderers/mermaid-frame/', 'head'), ('/renderers/mermaid-frame/', 'post'), ('/renderers/mermaid-frame/extra', 'get'), ('/renderers/mermaid-frame/?source=private-canary', 'get')])
def test_non_shell_responses_stay_denied(enabled, path, method):
    response = getattr(enabled, method)(path)
    assert response.status_code != 200
    assert response['X-Frame-Options'] == 'DENY'
    assert "frame-ancestors 'none'" in response['Content-Security-Policy']

def test_disabled_and_mismatched_origin_fail_closed(enabled, settings):
    for origin in ['', 'https://evil.invalid', 'http://testserver:9999']:
        settings.BACKSTORY_MERMAID_PARENT_ORIGIN = origin
        response = enabled.get('/renderers/mermaid-frame/')
        assert response.status_code == 404
        assert response['X-Frame-Options'] == 'DENY'

def test_missing_expired_revoked_sessions_keep_login_denied(enabled):
    from accounts.models import SessionDevice
    for state in ['revoked', 'expired']:
        device = SessionDevice.objects.get(revoked_at=None)
        if state == 'revoked': device.revoked_at = timezone.now()
        else: device.absolute_expires_at = timezone.now() - timedelta(seconds=1)
        device.save()
        response = enabled.get('/renderers/mermaid-frame/')
        assert response.status_code == 302
        assert response['X-Frame-Options'] == 'DENY'
        enabled.force_login(get_user_model().objects.get(username='private-user-canary'))
    assert Client().get('/renderers/mermaid-frame/')['X-Frame-Options'] == 'DENY'

def test_origin_validation_is_canonical_exact_and_independent_of_csrf():
    import backstory.checks as checks
    assert hasattr(checks, 'exact_renderer_origin'), 'renderer origin validator not implemented'
    valid = ['http://localhost:8765', 'http://127.0.0.1:8765', 'http://[::1]:1234']
    for origin in valid:
        assert checks.exact_renderer_origin(origin, ['localhost', '127.0.0.1', '[::1]'], 'localhost')
    for origin in ['', 'http://localhost', 'http://localhost:080', 'http://LOCALHOST:8765', 'http://localhost:8765/', 'http://localhost:8765?', 'http://u@localhost:8765', 'http://localhost:8765#x', 'http://localhost:0', 'http://localhost:80', 'http://localhost:8765\\x', 'http://evil.invalid:8765', 'https://*.invalid', 'https://localhost:443']:
        assert not checks.exact_renderer_origin(origin, ['localhost'], 'localhost'), origin
    assert checks.exact_renderer_origin('https://wiki.example', ['wiki.example'], 'https')
    assert not checks.exact_renderer_origin('https://wiki.example:443', ['wiki.example'], 'https')
    assert not checks.exact_renderer_origin('http://wiki.example:80', ['wiki.example'], 'https')

def test_shell_errors_invalid_host_proxy_and_inactive_user_keep_default_policy(enabled, settings, monkeypatch):
    response = enabled.get('/renderers/mermaid-frame/', HTTP_HOST='evil.invalid')
    assert response.status_code == 400 and response['X-Frame-Options'] == 'DENY'
    settings.BACKSTORY_PROXY_MODE = 'trusted'
    settings.BACKSTORY_TRUSTED_PROXY_IPS = ('192.0.2.1',)
    proxy_client = Client(HTTP_HOST='127.0.0.1:8765')
    proxy_client.cookies = enabled.cookies
    response = proxy_client.get('/renderers/mermaid-frame/')
    assert response.status_code == 400 and response['X-Frame-Options'] == 'DENY'
    settings.BACKSTORY_PROXY_MODE = 'off'
    def fail(*args, **kwargs):
        raise RuntimeError('synthetic-shell-error')
    monkeypatch.setattr('backstory.renderers.render_to_string', fail)
    enabled.raise_request_exception = False
    response = enabled.get('/renderers/mermaid-frame/')
    assert response.status_code == 500 and response['X-Frame-Options'] == 'DENY'
    get_user_model().objects.filter(username='private-user-canary').update(is_active=False)
    response = enabled.get('/renderers/mermaid-frame/')
    assert response.status_code == 302 and response['X-Frame-Options'] == 'DENY'

@pytest.mark.parametrize('origin', ['http://localhost:8765/private-origin-canary', 'https://evil.invalid', 'http://localhost:080'])
def test_invalid_renderer_setting_fails_before_private_state_creation(tmp_path, origin):
    from tests.integration.test_configuration import load
    result = load(tmp_path, {'BACKSTORY_MERMAID_PARENT_ORIGIN': origin})
    assert result.returncode != 0
    assert 'BACKSTORY_MERMAID_PARENT_ORIGIN' in result.stderr
    assert origin not in result.stderr
    assert not (tmp_path / 'data').exists()

def test_valid_renderer_setting_does_not_copy_csrf_or_change_secure_defaults(tmp_path):
    from tests.integration.test_configuration import load
    result = load(tmp_path, {'BACKSTORY_MERMAID_PARENT_ORIGIN': 'http://localhost:8765'})
    assert result.returncode == 0, result.stderr

def test_public_classic_bundle_served_by_real_whitenoise_boundary(settings, tmp_path):
    import json
    import shutil
    manifest = json.loads((settings.BASE_DIR / 'static/renderers/manifest.json').read_text())
    target = tmp_path / 'public' / 'renderers'
    target.mkdir(parents=True)
    shutil.copyfile(settings.BASE_DIR / 'static/renderers' / manifest['frame'], target / manifest['frame'])
    settings.STATIC_ROOT = target.parent
    response = Client().get(f"/static/renderers/{manifest['frame']}")
    assert response.status_code == 200
    assert 'javascript' in response['Content-Type']
    assert response['X-Content-Type-Options'] == 'nosniff'
    assert response.get('Cross-Origin-Resource-Policy') != 'same-origin'
    assert response.get('Cross-Origin-Embedder-Policy') != 'require-corp'
    assert 'private-user-canary' not in b''.join(response.streaming_content).decode()

def test_missing_or_bad_build_manifest_is_an_ordinary_denied_error(enabled, settings, tmp_path):
    settings.BASE_DIR = tmp_path
    response = enabled.get('/renderers/mermaid-frame/')
    assert response.status_code == 404 and response['X-Frame-Options'] == 'DENY'
    manifest = tmp_path / 'static/renderers/manifest.json'
    manifest.parent.mkdir(parents=True)
    manifest.write_text('{"frame":"https://evil.invalid/script.js"}')
    response = enabled.get('/renderers/mermaid-frame/')
    assert response.status_code == 404 and response['X-Frame-Options'] == 'DENY'

def test_shared_origin_fixtures_match_backend_canonical_host_validation():
    import json
    from pathlib import Path
    from backstory.checks import exact_renderer_origin
    fixtures = json.loads((Path(__file__).parents[1] / 'fixtures/mermaid-origins.json').read_text())
    for fixture in fixtures:
        assert exact_renderer_origin(fixture['origin'], [fixture['host']], fixture['mode']) is fixture['accepted'], fixture['origin']
