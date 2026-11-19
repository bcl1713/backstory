"""Issue 160: synthetic exact-byte attachments through the real shared API."""
import hashlib
import base64
from urllib.parse import urlencode

import pytest

from tests.integration.test_storage import wiki
from tests.integration.test_browsing import reader

pytestmark = pytest.mark.django_db(transaction=True)


@pytest.fixture
def assets(wiki):
    (wiki / 'assets').mkdir()
    return wiki / 'assets'


def identity(raw, filename='sample.bin', **extra):
    return {'filename': filename, 'sha256': hashlib.sha256(raw).hexdigest(), **extra}


def upload(reader, raw=b'\x00\xffexact\r\n', filename='sample.bin', **extra):
    return reader.post('/tools/files/?' + urlencode(identity(raw, filename, **extra)),
                       data=raw, content_type='application/octet-stream', CONTENT_TYPE='application/octet-stream')


def test_exact_upload_download_without_note(reader, wiki, assets):
    raw = b'\x00\xffexact\r\n'
    filename = '日本語 100% ([x])!.pdf'
    response = upload(reader, raw, filename)
    assert response.status_code == 201
    result = response.json()
    assert result['state'] == 'created' and result['authoritative'] is True
    assert result['original_filename'] == filename
    assert result['bytes'] == len(raw)
    assert result['sha256'] == hashlib.sha256(raw).hexdigest()
    assert result['path'].startswith('assets/file-') and result['path'].endswith('.attachment')
    assert (wiki / result['path']).read_bytes() == raw
    served = reader.get(result['href'])
    assert served.status_code == 200
    assert served['Content-Type'] == 'application/octet-stream'
    assert served['Content-Disposition'].startswith('attachment;')
    assert served['X-Content-Type-Options'] == 'nosniff'
    assert served['Cache-Control'] == 'private, no-store'
    assert b''.join(served.streaming_content) == raw
    served.close()
    inspected = reader.get('/tools/files/inspect/?' + urlencode(identity(raw, filename))).json()
    assert inspected['state'] == 'confirmed' and inspected['authoritative'] is True
    assert inspected['path'] == result['path']
    assert len(list(assets.iterdir())) == 1


@pytest.mark.parametrize('filename,raw', [
    ('paper.pdf', b'%PDF-1.7\nsynthetic'), ('archive.zip', b'PK\x03\x04\x00\xff'),
    ('audio.mp3', b'ID3\x00\xff'), ('video.mp4', b'\x00\x00\x00\x18ftypmp42'),
    ('source.py', b'print("inert")\r\n'), ('plain.txt', b'\xef\xbb\xbftext\r\n'),
    ('active.svg', b'<svg onload="alert(1)"/>'), ('active.html', b'<script>alert(1)</script>'),
    ('forged.png', b'<html>not pixels</html>'), ('unknown.weird', b'\x00\xff'),
    ('extensionless', b'\xff\x00'), ('empty', b''), ('AGENTS.md', b'# inert instructions'),
    ('.prettierrc', b'{"plugins":["inert"]}'),
])
def test_representative_roundtrips_stay_attachments(reader, wiki, assets, filename, raw):
    result = upload(reader, raw, filename).json()
    assert result['state'] == 'created'
    served = reader.get(result['href'])
    assert served['Content-Type'] == 'application/octet-stream'
    assert served['Content-Disposition'].startswith('attachment;')
    assert b''.join(served.streaming_content) == raw
    served.close()
    for prefix in ['/notes/', '/source/', '/preview/']:
        assert reader.get(prefix + result['path']).status_code == 404
    assert reader.post('/preview/' + result['path'], data={'source': '# inert'}, content_type='application/json').status_code == 404
    assert (wiki / result['path']).read_bytes() == raw


def test_retry_names_and_nested_escaped_links(reader, wiki, assets):
    from wiki.markdown import render_preview
    (wiki / 'Nested').mkdir()
    (wiki / 'Nested/note.md').write_text('# Original')
    raw, filename = b'exact', '日本語 %2e [a](b)*_!.md'
    first = upload(reader, raw, filename, note='Nested/note.md').json()
    assert first['markdown'].startswith('[日本語 %2e \\[a\\]\\(b\\)')
    assert '](../assets/' in first['markdown']
    rendered = render_preview(first['markdown'], 'Nested/note.md')
    assert first['href'] in rendered.html
    assert '<img' not in rendered.html
    assert upload(reader, raw, filename).json()['state'] == 'already_exists'
    second = upload(reader, b'different', filename).json()
    assert first['path'] != second['path']
    assert (wiki / first['path']).read_bytes() == raw
    assert (wiki / 'Nested/note.md').read_text() == '# Original'


def test_auth_csrf_revocation_and_expiry(reader, wiki, assets):
    from django.test import Client
    from accounts.models import SessionDevice
    from django.utils import timezone
    assert upload(Client()).status_code == 401
    secured = Client(enforce_csrf_checks=True)
    secured.cookies = reader.cookies
    assert upload(secured).status_code == 403
    assert not list(assets.iterdir())
    SessionDevice.objects.update(absolute_expires_at=timezone.now())
    assert upload(reader).status_code == 401


@pytest.mark.parametrize('filename', ['../x', 'a/b', 'a\\b', '', '.', 'bad\nname', 'é' * 61])
def test_display_name_bounds(reader, assets, filename):
    assert upload(reader, filename=filename).status_code in {400, 404}
    assert not list(assets.iterdir())


def test_shared_raster_and_file_quota(reader, wiki, assets, monkeypatch):
    from wiki import file_uploads, image_uploads
    from tests.integration.test_image_uploads import upload as image_upload
    (wiki / 'note.md').write_text('# Raster context')
    assert upload(reader, b'x').status_code == 201
    monkeypatch.setattr(image_uploads, 'MAX_FILES', 1)
    assert image_upload(reader).status_code == 413
    monkeypatch.setattr(file_uploads, 'MAX_STORAGE_BYTES', 1)
    assert upload(reader, b'y', 'other').status_code == 413
    assert upload(reader, b'x').json()['state'] == 'already_exists'


def test_caps_digest_and_staging_cleanup(reader, assets, monkeypatch):
    from wiki import file_uploads as service
    monkeypatch.setattr(service, 'MAX_BYTES', 3)
    assert upload(reader, b'four').status_code == 413
    assert not list(assets.iterdir())
    response = reader.post('/tools/files/?' + urlencode(identity(b'expected')), data=b'bad', content_type='application/octet-stream')
    assert response.status_code == 409
    assert not list(assets.iterdir())
    monkeypatch.setattr(service, 'MAX_ENTRIES', 0)
    (assets / 'retain.txt').write_bytes(b'never deleted')
    assert upload(reader, b'x').status_code == 413
    assert (assets / 'retain.txt').read_bytes() == b'never deleted'


@pytest.mark.parametrize('boundary', ['symlink_parent', 'symlink_target', 'fifo_target', 'excluded', 'missing', 'recovery', 'parent_replaced'])
def test_reachable_storage_boundaries(reader, wiki, assets, settings, monkeypatch, tmp_path, boundary):
    import os
    from wiki import file_uploads as service
    target = assets / service.asset_name('sample.bin', hashlib.sha256(b'x').hexdigest())
    if boundary == 'symlink_parent':
        assets.rmdir(); assets.symlink_to(tmp_path)
    elif boundary == 'symlink_target':
        outside = tmp_path / 'retain'; outside.write_bytes(b'never deleted'); target.symlink_to(outside)
    elif boundary == 'fifo_target':
        os.mkfifo(target)
    elif boundary == 'excluded':
        settings.BACKSTORY_EXCLUSIONS = ['assets']
    elif boundary == 'missing':
        assets.rmdir()
    elif boundary == 'recovery':
        def pause():
            from wiki.contracts import StorageError
            raise StorageError('move_recovery_required', 409)
        monkeypatch.setattr('wiki.relocations.assert_writes_available', pause)
    else:
        original = service._receive
        def replace(*args, **kwargs):
            result = original(*args, **kwargs)
            assets.rename(wiki / 'old-assets'); assets.mkdir()
            return result
        monkeypatch.setattr(service, '_receive', replace)
    assert upload(reader, b'x').status_code in {404, 409, 503}
    if boundary == 'parent_replaced':
        assert not list(assets.iterdir())
        assert not list((wiki / 'old-assets').iterdir())


def test_uncertain_publication_inspected_without_reupload(reader, assets, monkeypatch):
    import os
    import stat
    from wiki import file_uploads as service
    original = os.fsync
    def lose_ack(fd):
        if stat.S_ISDIR(os.fstat(fd).st_mode) and list(assets.glob('file-*')):
            raise OSError('synthetic lost directory acknowledgement')
        return original(fd)
    with monkeypatch.context() as patch:
        patch.setattr(service.os, 'fsync', lose_ack)
        response = upload(reader, b'x')
    assert response.status_code == 409
    assert response.json()['state'] == 'uncertain'
    result = reader.get('/tools/files/inspect/?' + urlencode(identity(b'x'))).json()
    assert result['state'] == 'confirmed' and result['bytes'] == 1
    assert len(list(assets.iterdir())) == 1
    (assets / result['path'].split('/')[-1]).write_bytes(b'external replacement')
    assert upload(reader, b'x').status_code == 409
    assert (assets / result['path'].split('/')[-1]).read_bytes() == b'external replacement'


def test_receiver_concurrency_is_not_queued(reader, assets):
    from wiki.revisions import application_lock
    with application_lock('file-upload'):
        assert upload(reader, b'x').status_code == 503
        assert reader.get('/tools/files/inspect/?' + urlencode(identity(b'x'))).status_code == 503
    assert not list(assets.iterdir())


def test_receive_revocation_stops_publication(reader, assets, monkeypatch):
    from accounts.models import SessionDevice
    from django.utils import timezone
    from wiki import file_uploads as service
    original = service._receive
    def revoke(*args, **kwargs):
        result = original(*args, **kwargs)
        SessionDevice.objects.update(revoked_at=timezone.now())
        return result
    monkeypatch.setattr(service, '_receive', revoke)
    assert upload(reader, b'x').status_code == 401
    assert not list(assets.iterdir())


def test_completed_deadline_cannot_interrupt_reused_connection(monkeypatch):
    from types import SimpleNamespace
    from wiki import file_uploads as service
    callbacks, interrupted = [], []
    class Timer:
        def __init__(self, seconds, callback): callbacks.append(callback)
        def start(self): pass
        def cancel(self): pass
    monkeypatch.setattr(service.threading, 'Timer', Timer)
    request = SimpleNamespace(META={'gunicorn.socket': SimpleNamespace(shutdown=interrupted.append)})
    with service._receive_deadline(request) as check:
        check()
    callbacks[0]()
    assert interrupted == []


@pytest.mark.parametrize('declared', [None, '1', '99999999'])
def test_framed_stream_bounds_independent_of_content_length(reader, assets, monkeypatch, declared):
    from io import BytesIO
    from wiki import file_uploads as service
    from django.test import RequestFactory
    raw = b'abcdef'
    request = RequestFactory().post('/tools/files/?' + urlencode(identity(raw)), data=b'', content_type='application/octet-stream')
    request.META['CONTENT_TYPE'] = 'application/octet-stream'
    request.content_type = 'application/octet-stream'
    request.META['wsgi.input_terminated'] = True
    request.META['wsgi.input'] = BytesIO(raw)
    if declared is None:
        request.META.pop('CONTENT_LENGTH', None)
    else:
        request.META['CONTENT_LENGTH'] = declared
    # This focused test enters the shared receiver after the normal session
    # boundary (already covered by authenticated HTTP integration above).
    monkeypatch.setattr(service, 'MAX_BYTES', 3)
    with service.open_directory('assets') as directory, pytest.raises(service.StorageError) as caught:
        service._receive(request, directory, '.temporary-test', 3)
    assert caught.value.status == 413


def test_encoded_transport_uses_same_identity_and_inspection(reader, wiki, assets):
    raw = b'\x00\xffencoded\r\n'
    values = {**identity(raw, 'agent.svg'), 'data_base64': base64.b64encode(raw).decode()}
    response = reader.post('/tools/files/encoded/', data=values, content_type='application/json')
    assert response.status_code == 201
    result = response.json()
    assert (wiki / result['path']).read_bytes() == raw
    assert upload(reader, raw, 'agent.svg').json()['state'] == 'already_exists'
    inspected = reader.get('/tools/files/inspect/?' + urlencode(identity(raw, 'agent.svg'))).json()
    assert inspected['state'] == 'confirmed'
    assert inspected['path'] == result['path']


@pytest.mark.parametrize('encoded', ['AA===', 'AA', ' Zg==', '!!!!', 'Zm9=', 'A' * 349532], ids=['padding', 'truncated', 'whitespace', 'alphabet', 'noncanonical', 'oversize'])
def test_encoded_transport_is_strict_and_bounded(reader, assets, encoded):
    response = reader.post('/tools/files/encoded/', data={**identity(b'x'), 'data_base64': encoded}, content_type='application/json')
    assert response.status_code in {400, 413}
    assert not list(assets.iterdir())


def test_other_wiki_writer_does_not_queue_an_upload(reader, assets):
    from concurrent.futures import ThreadPoolExecutor, wait
    from wiki.revisions import application_lock
    # Release the held lock before executor teardown even when the assertion
    # fails; this reproduces blocked admission without leaving a test thread.
    with ThreadPoolExecutor(max_workers=1) as pool:
        with application_lock('wiki-write'):
            pending = pool.submit(upload, reader, b'x')
            wait([pending], timeout=1)
            finished = pending.done()
        result = pending.result(timeout=5)
    assert finished and result.status_code == 503
    assert not list(assets.iterdir())


def test_socket_deadline_interrupts_blocked_receive(assets, monkeypatch):
    import socket
    from types import SimpleNamespace
    from wiki import file_uploads as service
    monkeypatch.setattr(service, 'RECEIVE_SECONDS', .05)
    receiver, sender = socket.socketpair()
    try:
        with receiver.makefile('rb') as stream, service.open_directory('assets') as directory:
            request = SimpleNamespace(META={'gunicorn.socket': receiver})
            with pytest.raises(service.StorageError) as caught:
                service._receive(request, directory, '.deadline-test', 1024, source=stream)
            assert caught.value.reason_code == 'file_receive_timeout'
    finally:
        receiver.close(); sender.close()


def test_download_configuration_lowers_accepted_upload_size(reader, assets, settings):
    settings.BACKSTORY_ATTACHMENT_MAX_BYTES = 4
    result = upload(reader, b'four').json()
    assert result['state'] == 'created'
    response = reader.get(result['href'])
    assert b''.join(response.streaming_content) == b'four'
    response.close()
    assert upload(reader, b'five!').status_code == 413
    assert len(list(assets.iterdir())) == 1
