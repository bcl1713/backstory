import pytest
from django.contrib.auth import get_user_model
from django.test import Client

ROUTES = [('get', p) for p in ['/', '/new/', '/folders/', '/folders/notes', '/notes/a.md', '/source/a.md', '/attachments/a.png', '/search/?q=canary', '/resolve/?source=a.md&target=a', '/index/status/', '/status/', '/history/a.md', '/drafts/', '/drafts/1/', '/drafts/1/download/', '/revisions/1/', '/accounts/devices/']] + [('post', p) for p in ['/new/', '/save/a.md', '/format/a.md', '/preview/a.md', '/index/schedule/', '/drafts/', '/restore/1/']]

@pytest.mark.django_db
@pytest.mark.parametrize('method,path', ROUTES)
@pytest.mark.parametrize('state', ['anonymous', 'disabled', 'revoked'])
def test_every_content_route_is_guarded(method, path, state):
    client = Client()
    if state != 'anonymous':
        user = get_user_model().objects.create_user('reader')
        client.force_login(user)
        if state == 'disabled':
            user.is_active = False; user.save()
        else:
            from accounts.sessions import revoke_sessions
            revoke_sessions(user)
    response = getattr(client, method)(path, HTTP_CF_ACCESS_AUTHENTICATED_USER_EMAIL='owner@example.invalid', HTTP_X_FORWARDED_FOR='127.0.0.2')
    assert response.status_code == 302
    assert response['Cache-Control'] == 'no-store'

@pytest.mark.django_db
def test_forged_headers_cannot_evade_account_or_ip_throttle():
    user = get_user_model().objects.create_user('reader', password='Synthetic password 928!')
    client = Client()
    for i in range(5):
        response = client.post('/accounts/login/', {'username': user.username, 'password': 'wrong'}, HTTP_X_FORWARDED_FOR=f'192.0.2.{i}', REMOTE_ADDR='192.0.2.99')
    assert response.status_code == 429
    assert client.post('/accounts/login/', {'username': user.username, 'password': 'Synthetic password 928!'}, REMOTE_ADDR='192.0.2.100').status_code == 429
    assert client.post('/accounts/login/', {'username': 'other', 'password': 'wrong'}, REMOTE_ADDR='192.0.2.99').status_code == 429
