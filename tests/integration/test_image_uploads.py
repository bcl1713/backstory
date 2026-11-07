"""Synthetic raster uploads, real storage and session boundaries."""
import hashlib
import struct
import zlib
from urllib.parse import urlencode

import pytest
from tests.integration.test_storage import wiki
from tests.integration.test_browsing import reader

pytestmark = pytest.mark.django_db(transaction=True)


def png(width=2, height=2):
    def chunk(kind, data):
        return struct.pack('!I', len(data)) + kind + data + struct.pack('!I', zlib.crc32(kind + data))
    return (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('!2I5B', width, height, 8, 2, 0, 0, 0))
            + chunk(b'IDAT', zlib.compress((b'\0' + b'\xff\0\0' * width) * height)) + chunk(b'IEND', b''))


def upload(reader, raw=None, filename='sample.png', mime='image/png', note='note.md'):
    return reader.post('/tools/images/?' + urlencode({'note': note, 'filename': filename}),
                       data=png() if raw is None else raw, content_type=mime)


@pytest.fixture
def assets(wiki):
    (wiki / 'assets').mkdir()
    (wiki / 'note.md').write_bytes(b'# Draft\r\n')
    return wiki / 'assets'


def test_upload_and_identical_retry_leave_note_unchanged(reader, wiki, assets):
    response = upload(reader)
    assert response.status_code == 201
    result = response.json()
    assert result['state'] == 'created' and result['authoritative']
    data = (wiki / result['path']).read_bytes()
    assert hashlib.sha256(data).hexdigest() == result['sha256']
    assert result['markdown'] == '![](assets/' + result['path'].split('/')[-1] + ')'
    assert (wiki / 'note.md').read_bytes() == b'# Draft\r\n'
    again = upload(reader)
    assert again.status_code == 200 and again.json()['state'] == 'already_exists'
    assert list(assets.iterdir()) == [wiki / result['path']]


@pytest.mark.parametrize('filename,mime,raw', [
    ('bad.svg', 'image/svg+xml', b'<svg/>'), ('bad.html', 'image/png', b'<html/>'),
    ('sample.jpg', 'image/jpeg', png()), ('sample.png', 'image/jpeg', png()),
    ('sample.png', 'image/png', b'not an image'), ('sample.png', 'image/png', png()[:35]),
    ('../sample.png', 'image/png', png()), ('a/b.png', 'image/png', png()),
    ('a\\b.png', 'image/png', png()), ('.hidden.png', 'image/png', png()),
    ('a..png', 'image/png', png()), ('a)![x](x.png', 'image/png', png()),
])
def test_rejects_hostile_input_without_writes(reader, assets, filename, mime, raw):
    assert upload(reader, raw, filename, mime).status_code in {400, 404}
    assert not list(assets.iterdir())


def test_nested_markdown_and_metadata_stripping(reader, wiki, assets):
    from io import BytesIO
    from PIL import Image, PngImagePlugin
    (wiki / 'Nested').mkdir()
    (wiki / 'Nested/note.md').write_text('# Nested')
    stream = BytesIO()
    metadata = PngImagePlugin.PngInfo()
    metadata.add_text('private', 'discard this metadata')
    Image.new('RGB', (3, 4), 'red').save(stream, format='PNG', pnginfo=metadata)
    response = upload(reader, stream.getvalue() + b'<script>trailing</script>', note='Nested/note.md')
    assert response.status_code == 201
    result = response.json()
    assert result['markdown'].startswith('![](../assets/upload-')
    stored = (wiki / result['path']).read_bytes()
    assert b'discard this metadata' not in stored and b'<script>' not in stored
    with Image.open(BytesIO(stored)) as image:
        image.load()
        assert image.size == (3, 4)


@pytest.mark.parametrize('kind', ['assets_symlink', 'target_symlink', 'note_symlink', 'missing_assets', 'excluded'])
def test_filesystem_policy(reader, wiki, assets, tmp_path, settings, kind):
    if kind == 'assets_symlink':
        assets.rmdir()
        outside = tmp_path / 'outside'
        outside.mkdir()
        assets.symlink_to(outside)
    elif kind == 'target_symlink':
        result = upload(reader).json()
        target = wiki / result['path']
        target.unlink()
        outside = tmp_path / 'outside.png'
        outside.write_bytes(b'outside')
        target.symlink_to(outside)
    elif kind == 'note_symlink':
        (wiki / 'note.md').unlink()
        (wiki / 'note.md').symlink_to(tmp_path / 'outside.md')
    elif kind == 'missing_assets':
        assets.rmdir()
    else:
        settings.BACKSTORY_EXCLUSIONS = ['assets']
    assert upload(reader).status_code in {404, 503}
    if kind == 'target_symlink':
        assert outside.read_bytes() == b'outside'


def test_auth_csrf_and_revoked_session(reader, wiki, assets):
    from django.test import Client
    from accounts.models import SessionDevice
    from django.utils import timezone
    assert upload(Client()).status_code == 401
    secured = Client(enforce_csrf_checks=True)
    secured.cookies = reader.cookies
    assert upload(secured).status_code == 403
    SessionDevice.objects.update(revoked_at=timezone.now())
    assert upload(reader).status_code == 401
    assert not list(assets.iterdir())


def test_caps_dimensions_bytes_animation_and_quota(reader, assets, monkeypatch):
    from io import BytesIO
    from PIL import Image
    from wiki import image_uploads as module
    assert upload(reader, png(4097, 1)).status_code == 413
    assert upload(reader, b'x' * (module.MAX_BYTES + 1)).status_code == 413
    stream = BytesIO()
    Image.new('RGB', (2, 2), 'red').save(stream, 'PNG', save_all=True,
        append_images=[Image.new('RGB', (2, 2), 'blue')], duration=100, loop=0)
    assert upload(reader, stream.getvalue()).status_code == 400
    monkeypatch.setattr(module, 'MAX_FILES', 0)
    assert upload(reader).status_code == 413
    assert not list(assets.iterdir())


def test_lost_fsync_acknowledgement_is_uncertain_then_retry_confirms(reader, wiki, assets, monkeypatch):
    import os
    import stat
    from wiki import image_uploads as module
    original = os.fsync
    def fail_published_directory(fd):
        if stat.S_ISDIR(os.fstat(fd).st_mode) and list(assets.glob('upload-*')):
            raise OSError('synthetic lost acknowledgement')
        return original(fd)
    with monkeypatch.context() as patch:
        patch.setattr(module.os, 'fsync', fail_published_directory)
        response = upload(reader)
    assert response.status_code == 409
    assert response.json()['state'] == 'uncertain' and not response.json()['authoritative']
    response = upload(reader)
    assert response.status_code == 200 and response.json()['state'] == 'already_exists'
    assert len(list(assets.iterdir())) == 1


def test_note_must_be_existing_markdown(reader, wiki, assets):
    (wiki / 'plain.txt').write_text('not a note')
    assert upload(reader, note='plain.txt').status_code == 404
    assert upload(reader, note='missing.md').status_code == 404
    assert not list(assets.iterdir())


def test_phone_orientation_is_applied_before_metadata_removal(reader, wiki, assets):
    from io import BytesIO
    from PIL import Image
    stream = BytesIO()
    image = Image.new('RGB', (3, 2), 'red')
    metadata = Image.Exif()
    metadata[274] = 6
    image.save(stream, 'JPEG', exif=metadata)
    response = upload(reader, stream.getvalue(), 'phone.jpg', 'image/jpeg')
    assert response.status_code == 201
    result = response.json()
    assert (result['width'], result['height']) == (2, 3)
    with Image.open(wiki / result['path']) as stored:
        assert stored.size == (2, 3)
        assert not stored.getexif()


@pytest.mark.parametrize('format,mime,filename', [('JPEG', 'image/jpeg', 'sample.jpeg'), ('WEBP', 'image/webp', 'sample.webp')])
def test_supported_rasters_are_decoded_and_served(reader, wiki, assets, format, mime, filename):
    from io import BytesIO
    from PIL import Image
    stream = BytesIO()
    Image.new('RGB', (7, 5), '#4488cc').save(stream, format)
    response = upload(reader, stream.getvalue(), filename, mime)
    assert response.status_code == 201
    result = response.json()
    served = reader.get(result['href'])
    assert served.status_code == 200 and served['Content-Type'] == mime
    assert b''.join(served.streaming_content) == (wiki / result['path']).read_bytes()
    served.close()


def test_serialized_decoder_refuses_concurrent_work(reader, assets):
    from wiki.revisions import application_lock
    with application_lock('image-upload'):
        assert upload(reader).status_code == 503
    assert not list(assets.iterdir())


def test_existing_file_never_overwritten_even_at_matching_digest_name(reader, wiki, assets):
    result = upload(reader).json()
    target = wiki / result['path']
    target.write_bytes(b'external replacement')
    assert upload(reader).status_code == 409
    assert target.read_bytes() == b'external replacement'


def test_total_storage_and_directory_work_are_bounded(reader, assets, monkeypatch):
    from wiki import image_uploads as module
    with monkeypatch.context() as patch:
        patch.setattr(module, 'MAX_STORAGE_BYTES', 1)
        assert upload(reader).status_code == 413
    (assets / 'unrelated.txt').write_text('retain')
    with monkeypatch.context() as patch:
        patch.setattr(module, 'MAX_ENTRIES', 0)
        assert upload(reader).status_code == 413
    assert (assets / 'unrelated.txt').read_text() == 'retain'


@pytest.mark.parametrize('query', ['note=note.md&filename=%FF.png', 'note=note.md&filename=%ZZ.png',
    'note=note.md&note=other.md&filename=a.png', 'note=note.md&filename=a.png&destination=elsewhere'])
def test_strict_query_boundary(reader, assets, query):
    assert reader.post('/tools/images/?' + query, data=png(), content_type='image/png').status_code in {400, 404}
    assert not list(assets.iterdir())
