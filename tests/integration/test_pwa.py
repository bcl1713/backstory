"""Install metadata remains public; private pages keep their existing policy."""
import json
import struct
from pathlib import Path

import pytest
from django.conf import settings
from django.contrib.staticfiles import finders

from tests.integration.test_browsing import reader
from tests.integration.test_storage import wiki


def test_manifest_has_stable_root_launch_and_real_maskable_icons():
    path = finders.find('manifest.webmanifest')
    assert path, 'Public install manifest is required'
    manifest = json.loads(Path(path).read_text())
    assert manifest['id'] == manifest['start_url'] == manifest['scope'] == '/'
    assert manifest['name'] == manifest['short_name'] == 'Backstory'
    assert manifest['display'] == 'standalone'
    assert manifest['prefer_related_applications'] is False
    assert manifest['theme_color'] == manifest['background_color'] == '#1a1b26'
    for size in (192, 512):
        icon = next(icon for icon in manifest['icons'] if icon['sizes'] == f'{size}x{size}')
        assert icon['type'] == 'image/png'
        assert set(icon['purpose'].split()) == {'any', 'maskable'}
        assert icon['src'].startswith(settings.STATIC_URL)
        raw = Path(finders.find(icon['src'].removeprefix(settings.STATIC_URL))).read_bytes()
        assert raw[:8] == b'\x89PNG\r\n\x1a\n'
        assert struct.unpack('>II', raw[16:24]) == (size, size)


@pytest.mark.django_db
def test_install_metadata_on_login_and_authenticated_pages(client, reader, wiki):
    (wiki / 'pwa.md').write_text('# Private note')
    for route in ['/accounts/login/', '/', '/notes/pwa.md', '/search/', '/accounts/devices/']:
        response = reader.get(route)
        assert response.status_code == 200
        assert b'rel="manifest"' in response.content, route
        assert b'/static/manifest.webmanifest' in response.content
        assert b'name="theme-color"' in response.content
        assert response['Cache-Control'] == 'no-store'
