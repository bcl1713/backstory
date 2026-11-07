import re
import pytest
from django.contrib.auth import get_user_model
from django.test import Client

pytestmark = pytest.mark.django_db
ORIGIN = 'http://127.0.0.1:8765'

@pytest.fixture
def enabled(settings):
    settings.BACKSTORY_VEGA_LITE_PARENT_ORIGIN = ORIGIN
    client = Client(HTTP_HOST='127.0.0.1:8765')
    client.force_login(get_user_model().objects.create_user('vega_lite-test'))
    return client

def test_vega_lite_policy_is_exact_and_opaque(enabled, settings):
    response = enabled.get('/renderers/vega-lite-frame/')
    assert response.status_code == 200
    csp = response['Content-Security-Policy']
    nonce = re.search(r'nonce="([\w-]+)"', response.content.decode())[1]
    assert f"script-src 'nonce-{nonce}'" in csp
    assert 'wasm-unsafe-eval' not in csp
    assert "worker-src blob:" in csp
    assert 'allow-same-origin' not in csp and "'unsafe-eval'" not in csp
    assert f'frame-ancestors {ORIGIN}' in csp
    assert 'sandbox allow-scripts' in csp and 'X-Frame-Options' not in response
    for resource in ['img','connect','font','media','object','frame']:
        assert f"{resource}-src 'none'" in csp
    settings.BACKSTORY_MERMAID_PARENT_ORIGIN = ORIGIN
    mermaid = enabled.get('/renderers/mermaid-frame/')['Content-Security-Policy']
    assert 'wasm-unsafe-eval' not in mermaid and "worker-src 'none'" in mermaid
    assert 'wasm-unsafe-eval' not in enabled.get('/health/')['Content-Security-Policy']

@pytest.mark.parametrize('method,path',[('head','/renderers/vega-lite-frame/'),('post','/renderers/vega-lite-frame/'),('get','/renderers/vega-lite-frame/?source=x'),('get','/renderers/vega-lite-frame/extra')])
def test_vega_lite_non_shell_keeps_denial(enabled,method,path):
    response=getattr(enabled,method)(path)
    assert response.status_code != 200
    assert response['X-Frame-Options']=='DENY'
    assert "frame-ancestors 'none'" in response['Content-Security-Policy']

def test_vega_lite_defaults_disabled_and_other_renderer_optins_do_not_enable_it(enabled,settings):
    settings.BACKSTORY_MERMAID_PARENT_ORIGIN=ORIGIN
    settings.BACKSTORY_GRAPHVIZ_PARENT_ORIGIN=ORIGIN
    for origin in ['', 'https://evil.invalid', 'http://localhost:8765']:
        settings.BACKSTORY_VEGA_LITE_PARENT_ORIGIN=origin
        response=enabled.get('/renderers/vega-lite-frame/')
        assert response.status_code==404 and response['X-Frame-Options']=='DENY'

def test_vega_lite_session_revocation_and_invalid_manifest(enabled,settings,tmp_path):
    from accounts.models import SessionDevice
    from django.utils import timezone
    settings.BASE_DIR=tmp_path
    response=enabled.get('/renderers/vega-lite-frame/')
    assert response.status_code==404 and response['X-Frame-Options']=='DENY'
    SessionDevice.objects.update(revoked_at=timezone.now())
    response=enabled.get('/renderers/vega-lite-frame/')
    assert response.status_code==302 and response['X-Frame-Options']=='DENY'
    assert Client().get('/renderers/vega-lite-frame/')['X-Frame-Options']=='DENY'

@pytest.mark.parametrize('origin',['https://evil.invalid','http://localhost:080','http://localhost:8765/private-canary'])
def test_bad_vega_lite_setting_fails_before_private_state(tmp_path,origin):
    from tests.integration.test_configuration import load
    result=load(tmp_path,{'BACKSTORY_VEGA_LITE_PARENT_ORIGIN':origin})
    assert result.returncode != 0 and 'BACKSTORY_VEGA_LITE_PARENT_ORIGIN' in result.stderr
    assert origin not in result.stderr and not (tmp_path/'data').exists()

def test_vega_lite_invalid_host_and_inactive_user_keep_denial(enabled):
    response=enabled.get('/renderers/vega-lite-frame/',HTTP_HOST='evil.invalid')
    assert response.status_code==400 and response['X-Frame-Options']=='DENY'
    get_user_model().objects.filter(username='vega_lite-test').update(is_active=False)
    response=enabled.get('/renderers/vega-lite-frame/')
    assert response.status_code==302 and response['X-Frame-Options']=='DENY'
