import pytest
from django.test import Client
from datetime import datetime, timezone
from tests.integration.test_browsing import reader

pytestmark = pytest.mark.django_db


def test_unset_and_environment_precedence(settings):
    from wiki.timezones import timezone_state, change_timezone
    settings.BACKSTORY_WIKI_TIMEZONE = ''
    assert timezone_state() == {'timezone': 'UTC', 'source': 'fallback'}
    change_timezone('America/Chicago', initialize=True)
    assert timezone_state() == {'timezone': 'America/Chicago', 'source': 'saved'}
    change_timezone('Asia/Tokyo', initialize=True)
    assert timezone_state()['timezone'] == 'America/Chicago'
    settings.BACKSTORY_WIKI_TIMEZONE = 'Europe/London'
    assert timezone_state() == {'timezone': 'Europe/London', 'source': 'environment'}


def test_owner_initialization_override_and_stale_settings(reader, settings):
    from django.contrib.auth import get_user_model
    settings.BACKSTORY_WIKI_TIMEZONE = ''
    user = get_user_model().objects.get(username='synthetic-reader')
    user.is_staff = True; user.save()
    first = reader.post('/settings/timezone/', {'timezone': 'America/Chicago', 'action': 'initialize'}, HTTP_ACCEPT='application/json')
    assert first.status_code == 200
    assert first.json()['timezone'] == 'America/Chicago'
    assert reader.post('/settings/timezone/', {'timezone': 'Asia/Tokyo', 'action': 'initialize'}, HTTP_ACCEPT='application/json').json()['timezone'] == 'America/Chicago'
    fields = {'timezone': 'Europe/London', 'action': 'override', 'expected_timezone': 'America/Chicago'}
    assert reader.post('/settings/timezone/', fields).status_code == 302
    assert reader.post('/settings/timezone/', fields).status_code == 409
    assert reader.get('/settings/timezone/?format=json').json()['timezone'] == 'Europe/London'


def test_permissions_and_bad_zones(reader, client, settings):
    from django.contrib.auth import get_user_model
    settings.BACKSTORY_WIKI_TIMEZONE = ''
    assert Client().post('/settings/timezone/', {'timezone':'Asia/Tokyo'}).status_code == 302
    assert reader.post('/settings/timezone/', {'timezone':'Asia/Tokyo'}).status_code == 403
    assert reader.get('/settings/timezone/?format=json').json()['can_change'] is False
    user = get_user_model().objects.get(username='synthetic-reader'); user.is_staff=True; user.save()
    for zone in ['CDT', '../UTC', 'Not/AZone', '', 'A'*200]:
        assert reader.post('/settings/timezone/', {'timezone':zone,'action':'initialize'}, HTTP_ACCEPT='application/json').status_code == 400
    settings.BACKSTORY_WIKI_TIMEZONE = 'America/Chicago'
    assert reader.post('/settings/timezone/', {'timezone':'Asia/Tokyo','action':'initialize'}, HTTP_ACCEPT='application/json').status_code == 409


def test_headless_date_uses_saved_zone_and_explicit_environment(settings):
    from wiki.timezones import change_timezone
    from wiki.save_metadata import wiki_date
    settings.BACKSTORY_WIKI_TIMEZONE = ''
    now = datetime(2026, 10, 30, 2, tzinfo=timezone.utc)
    assert wiki_date(now) == '2026-10-30'
    change_timezone('America/Chicago', initialize=True)
    assert wiki_date(now) == '2026-10-29'
    settings.BACKSTORY_WIKI_TIMEZONE = 'Asia/Tokyo'
    assert wiki_date(now) == '2026-10-30'


def test_ordinary_reader_sees_fallback_and_csrf_protects_owner(reader, settings):
    from django.contrib.auth import get_user_model
    settings.BACKSTORY_WIKI_TIMEZONE = ''
    page = reader.get('/settings/timezone/')
    assert page.status_code == 200 and b'UTC' in page.content and b'owner' in page.content
    user = get_user_model().objects.get(username='synthetic-reader'); user.is_staff = True; user.save()
    browser = Client(enforce_csrf_checks=True); browser.force_login(user)
    assert browser.post('/settings/timezone/', {'timezone': 'Asia/Tokyo', 'action': 'initialize'}).status_code == 403
