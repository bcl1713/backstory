from datetime import timedelta
import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from django.utils import timezone

pytestmark = pytest.mark.django_db


def test_exact_idle_and_absolute_lifecycle(monkeypatch):
    from accounts.models import SessionDevice
    from accounts.sessions import revoke_sessions
    now = timezone.now()
    monkeypatch.setattr('accounts.sessions.now', lambda: now)
    user = get_user_model().objects.create_user('assistant', password='Synthetic password 928!')
    client = Client()
    client.force_login(user)
    device = SessionDevice.objects.get(user=user)
    assert device.absolute_expires_at == now + timedelta(hours=24)
    now += timedelta(hours=11)
    assert client.get('/status/').status_code == 200
    device.refresh_from_db()
    assert device.last_seen_at == now
    now += timedelta(hours=12)
    assert client.get('/status/').status_code == 302
    client.force_login(user)
    assert revoke_sessions(user) == 1
    assert client.get('/status/').status_code == 302


def test_remembered_absolute_cap_and_rotation(monkeypatch):
    from accounts.models import SessionDevice
    now = timezone.now()
    monkeypatch.setattr('accounts.sessions.now', lambda: now)
    user = get_user_model().objects.create_user('human', password='Synthetic password 928!')
    client = Client()
    prior = client.session.session_key
    assert client.post('/accounts/login/', {'username': user.username, 'password': 'Synthetic password 928!', 'remember': 'on'}).status_code == 302
    assert client.session.session_key != prior
    device = SessionDevice.objects.get(user=user)
    assert device.remembered
    assert device.absolute_expires_at == now + timedelta(days=90)
    for days in [13, 26, 39, 52, 65, 78, 89]:
        now = device.created_at + timedelta(days=days)
        assert client.get('/status/').status_code == 200
    now = device.absolute_expires_at
    assert client.get('/status/').status_code == 302


def test_owner_device_revocation_and_other_accounts():
    from accounts.models import SessionDevice
    from accounts.sessions import revoke_sessions
    clients = []
    for name in ['first', 'second', 'assistant']:
        user = get_user_model().objects.create_user(name)
        client = Client(); client.force_login(user); clients.append((user, client))
    user, client = clients[2]
    revoke_sessions(user)
    assert client.get('/status/').status_code == 302
    assert all(c.get('/status/').status_code == 200 for _, c in clients[:2])
    first, browser = clients[0]
    foreign = SessionDevice.objects.get(user=clients[1][0])
    assert browser.post('/accounts/devices/', {'device': str(foreign.pk)}).status_code == 404
    assert browser.get('/accounts/devices/').status_code == 200
    assert browser.post('/accounts/logout/').status_code == 302
    assert browser.get('/status/').status_code == 302


def test_cleanup_and_interactive_disable(monkeypatch):
    from accounts.models import SessionDevice
    from django.core.management import call_command
    user = get_user_model().objects.create_user('assistant')
    client = Client(); client.force_login(user)
    answers = iter(['assistant', 'disable'])
    monkeypatch.setattr('builtins.input', lambda _: next(answers))
    call_command('revoke_sessions')
    user.refresh_from_db(); assert not user.is_active
    assert client.get('/status/').status_code == 302
    SessionDevice.objects.update(absolute_expires_at=timezone.now() - timedelta(seconds=1))
    call_command('cleanup_sessions')
    assert not SessionDevice.objects.exists()


@pytest.mark.parametrize('first_remembered,second_remembered', [(False,False),(False,True),(True,False),(True,True)])
def test_repeated_same_account_credentials_rotate_and_revoke_each_device(monkeypatch, caplog, first_remembered, second_remembered):
    """F3-001: actual LoginView posts must rotate even if Django reuses the key."""
    from accounts.models import SessionDevice
    from accounts.sessions import digest
    from django.contrib.sessions.models import Session
    now = timezone.now()
    monkeypatch.setattr('accounts.sessions.now',lambda:now)
    password = 'Synthetic login-secret-canary 928!'
    user = get_user_model().objects.create_user('repeat-reader',password=password)
    client = Client(raise_request_exception=False)
    previous = None
    for remembered in [first_remembered,second_remembered,second_remembered]:
        payload = {'username':user.username,'password':password}
        if remembered: payload['remember']='on'
        response = client.post('/accounts/login/',payload)
        assert response.status_code==302
        current = client.session.session_key
        assert current != previous
        row = SessionDevice.objects.get(session_key_digest=digest(current))
        assert row.remembered == remembered
        assert row.absolute_expires_at == now + timedelta(days=90 if remembered else 1)
        assert client.session.get_expiry_age() <= (14*86400 if remembered else 12*3600)
        if previous is not None:
            assert not Session.objects.filter(session_key=previous).exists()
            assert SessionDevice.objects.get(session_key_digest=digest(previous)).revoked_at is not None
            old_browser=Client(); old_browser.cookies['sessionid']=previous
            assert old_browser.get('/status/').status_code==302
        assert SessionDevice.objects.filter(user=user,revoked_at=None).count()==1
        previous=current
        now += timedelta(seconds=1)
    assert client.post('/accounts/devices/',{'device':str(row.pk)}).status_code==302
    assert client.get('/status/').status_code==302
    assert 'login-secret-canary' not in caplog.text
    assert previous not in caplog.text
