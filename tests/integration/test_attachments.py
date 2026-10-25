"""Real synthetic filesystem checks for bounded authenticated attachment streams."""
import hashlib
import importlib
import os
from types import SimpleNamespace

from django.contrib.auth.models import AnonymousUser
from django.core.exceptions import PermissionDenied
from django.test import RequestFactory
import pytest

from wiki.contracts import StorageError

# response.close() emits request_finished, which runs Django DB cleanup even
# for a RequestFactory response after earlier authenticated route tests.
pytestmark = pytest.mark.django_db


@pytest.fixture
def attachment_wiki(tmp_path, settings):
    root = tmp_path / "wiki"
    root.mkdir()
    identity = b"synthetic attachment storage identity\n"
    (root / "Home.md").write_bytes(identity)
    (root / "attachments").mkdir()
    settings.BACKSTORY_WIKI_ROOT = root
    settings.BACKSTORY_DATA_DIR = tmp_path / "data"
    settings.BACKSTORY_IDENTITY_PATH = "Home.md"
    settings.BACKSTORY_IDENTITY_SHA256 = hashlib.sha256(identity).hexdigest()
    settings.BACKSTORY_EXCLUSIONS = []
    return root


def delivery():
    try:
        return importlib.import_module("wiki.attachments")
    except ImportError:
        pytest.fail("Bounded attachment delivery is not implemented")


def request(*, header=None, method="GET", authenticated=True):
    result = RequestFactory().generic(method, "/attachments/attachments/sample.png", **({"HTTP_RANGE": header} if header is not None else {}))
    result.user = SimpleNamespace(is_authenticated=True, is_active=True) if authenticated else AnonymousUser()
    return result


def body(response):
    try:
        return b"".join(response.streaming_content) if response.streaming else response.content
    finally:
        response.close()


@pytest.mark.parametrize("name,mime,inline", [
    ("sample.png", "image/png", True), ("sample.JPG", "image/jpeg", True),
    ("sample.gif", "image/gif", True), ("sample.webp", "image/webp", True),
    ("sample.pdf", "application/pdf", True), ("active.svg", "application/octet-stream", False),
    ("active.html", "application/octet-stream", False), ("unknown.bin", "application/octet-stream", False),
])
def test_attachment_types_and_download_boundary(attachment_wiki, name, mime, inline):
    raw = b"synthetic inert attachment bytes"
    (attachment_wiki / "attachments" / name).write_bytes(raw)
    module = delivery()
    response = module.serve_attachment(request(), "attachments/" + name)
    assert module.safe_attachment_type(name) == (mime, inline)
    assert response.status_code == 200
    assert response["Content-Type"] == mime
    assert response["Content-Disposition"].startswith("inline;" if inline else "attachment;")
    assert response["Content-Length"] == str(len(raw))
    assert response["X-Content-Type-Options"] == "nosniff"
    assert response["Cache-Control"] == "no-store"
    assert body(response) == raw


def test_attachment_requires_auth_before_storage_access(attachment_wiki):
    (attachment_wiki / "Home.md").unlink()
    with pytest.raises(PermissionDenied):
        delivery().serve_attachment(request(authenticated=False), "attachments/missing.png")
    disabled = request()
    disabled.user.is_active = False
    with pytest.raises(PermissionDenied):
        delivery().serve_attachment(disabled, "attachments/missing.png")


@pytest.mark.parametrize("path", ["../outside.png", "/absolute.png", ".hidden.png", "attachments/AGENTS.md", "attachments/.env", "attachments/a\\b.png"])
def test_attachment_reuses_sensitive_path_policy(attachment_wiki, path):
    with pytest.raises(StorageError) as error:
        delivery().serve_attachment(request(), path)
    assert error.value.status == 404
    assert error.value.reason_code == "path_denied"


def test_attachment_fails_when_storage_identity_is_missing(attachment_wiki):
    (attachment_wiki / "attachments/sample.png").write_bytes(b"inert")
    (attachment_wiki / "Home.md").unlink()
    with pytest.raises(StorageError) as error:
        delivery().serve_attachment(request(), "attachments/sample.png")
    assert error.value.status == 503
    assert error.value.reason_code == "identity_missing"


@pytest.mark.parametrize("kind", ["file_link", "parent_link", "directory", "fifo"])
def test_attachment_rejects_symlinks_and_special_files(attachment_wiki, tmp_path, kind):
    target = tmp_path / "outside"
    target.mkdir()
    (target / "sample.png").write_bytes(b"must not be returned")
    path = "attachments/sample.png"
    if kind == "file_link":
        (attachment_wiki / path).symlink_to(target / "sample.png")
    elif kind == "parent_link":
        (attachment_wiki / "linked").symlink_to(target, target_is_directory=True)
        path = "linked/sample.png"
    elif kind == "directory":
        (attachment_wiki / path).mkdir()
    else:
        os.mkfifo(attachment_wiki / path)
    with pytest.raises(StorageError) as error:
        delivery().serve_attachment(request(), path)
    assert error.value.status == 404


@pytest.mark.parametrize("header,want,content_range", [
    ("bytes=2-5", b"2345", "bytes 2-5/10"),
    ("bytes=7-", b"789", "bytes 7-9/10"),
    ("bytes=-3", b"789", "bytes 7-9/10"),
    ("bytes=7-999", b"789", "bytes 7-9/10"),
    ("bytes=-999", b"0123456789", "bytes 0-9/10"),
])
def test_single_ranges_have_exact_payloads(attachment_wiki, header, want, content_range):
    (attachment_wiki / "attachments/sample.pdf").write_bytes(b"0123456789")
    response = delivery().serve_attachment(request(header=header), "attachments/sample.pdf")
    assert response.status_code == 206
    assert response["Content-Range"] == content_range
    assert response["Content-Length"] == str(len(want))
    assert response["Accept-Ranges"] == "bytes"
    assert body(response) == want


@pytest.mark.parametrize("header", ["bytes=", "bytes=-", "bytes=-0", "bytes=5-2", "bytes=10-", "bytes=0-1,4-5", "items=0-1", "bytes=x-y", "bytes=0-1 garbage", "bytes=" + "9" * 300 + "-"])
def test_invalid_and_multiple_ranges_are_rejected(attachment_wiki, header):
    (attachment_wiki / "attachments/sample.png").write_bytes(b"0123456789")
    with pytest.raises(StorageError) as error:
        delivery().serve_attachment(request(header=header), "attachments/sample.png")
    assert error.value.status == 416
    assert error.value.content_range == "bytes */10"


def test_total_and_range_sizes_are_capped(attachment_wiki, settings):
    path = attachment_wiki / "attachments/sample.png"
    path.write_bytes(b"0123456789")
    settings.BACKSTORY_ATTACHMENT_MAX_BYTES = 9
    with pytest.raises(StorageError) as error:
        delivery().serve_attachment(request(), "attachments/sample.png")
    assert error.value.status == 413
    settings.BACKSTORY_ATTACHMENT_MAX_BYTES = 10
    settings.BACKSTORY_ATTACHMENT_RANGE_MAX_BYTES = 3
    with pytest.raises(StorageError) as error:
        delivery().serve_attachment(request(header="bytes=0-3"), "attachments/sample.png")
    assert error.value.status == 416
    response = delivery().serve_attachment(request(header="bytes=0-2"), "attachments/sample.png")
    assert body(response) == b"012"


def target_descriptors(path):
    descriptors = []
    for entry in os.listdir("/proc/self/fd"):
        try:
            if os.readlink("/proc/self/fd/" + entry) == str(path):
                descriptors.append(entry)
        except FileNotFoundError:
            pass
    return descriptors


@pytest.mark.parametrize("consume", [False, True])
def test_closing_unstarted_or_cancelled_stream_releases_descriptor(attachment_wiki, consume):
    path = attachment_wiki / "attachments/sample.png"
    path.write_bytes(b"x" * 150000)
    response = delivery().serve_attachment(request(), "attachments/sample.png")
    assert target_descriptors(path)
    if consume:
        chunk = next(iter(response.streaming_content))
        assert 0 < len(chunk) <= 65536
    response.close()
    assert not target_descriptors(path)


def test_attachment_pins_open_file_across_name_replacement(attachment_wiki, tmp_path):
    path = attachment_wiki / "attachments/sample.png"
    path.write_bytes(b"original inert attachment")
    response = delivery().serve_attachment(request(), "attachments/sample.png")
    path.rename(path.with_name("original.png"))
    outside = tmp_path / "outside.png"
    outside.write_bytes(b"outside must not be streamed")
    path.symlink_to(outside)
    assert body(response) == b"original inert attachment"


def test_head_has_headers_without_open_stream(attachment_wiki):
    path = attachment_wiki / "attachments/sample.png"
    path.write_bytes(b"0123456789")
    response = delivery().serve_attachment(request(method="HEAD"), "attachments/sample.png")
    assert response.status_code == 200
    assert response["Content-Length"] == "10"
    assert body(response) == b""
    assert not target_descriptors(path)


def test_stream_growth_never_exceeds_advertised_length(attachment_wiki):
    path = attachment_wiki / "attachments/sample.png"
    path.write_bytes(b"before")
    response = delivery().serve_attachment(request(), "attachments/sample.png")
    with path.open("ab") as stream:
        stream.write(b"must not extend response")
    assert body(response) == b"before"
    assert not target_descriptors(path)


def test_stream_truncation_is_reported_and_closes_descriptor(attachment_wiki):
    path = attachment_wiki / "attachments/sample.png"
    path.write_bytes(b"before")
    response = delivery().serve_attachment(request(), "attachments/sample.png")
    path.write_bytes(b"")
    with pytest.raises(StorageError) as error:
        body(response)
    assert error.value.reason_code == "attachment_changed"
    assert not target_descriptors(path)


def test_stream_io_error_is_sanitized_and_closes_descriptor(attachment_wiki, monkeypatch):
    path = attachment_wiki / "attachments/sample.png"
    path.write_bytes(b"before")
    response = delivery().serve_attachment(request(), "attachments/sample.png")
    def failed_read(descriptor, amount):
        raise OSError("sensitive local path must not enter diagnostics")
    monkeypatch.setattr(os, "read", failed_read)
    with pytest.raises(StorageError) as error:
        body(response)
    assert error.value.reason_code == "storage_io_error"
    assert error.value.status == 503
    assert "sensitive" not in str(error.value)
    assert not target_descriptors(path)


@pytest.mark.parametrize("range_header", ["bytes=bad", "bytes=0-3"])
def test_rejected_ranges_do_not_leave_open_files(attachment_wiki, settings, range_header):
    path = attachment_wiki / "attachments/sample.png"
    path.write_bytes(b"0123456789")
    settings.BACKSTORY_ATTACHMENT_RANGE_MAX_BYTES = 3
    with pytest.raises(StorageError):
        delivery().serve_attachment(request(header=range_header), "attachments/sample.png")
    assert not target_descriptors(path)


def test_empty_attachment_and_head_range_are_bounded(attachment_wiki):
    path = attachment_wiki / "attachments/sample.png"
    path.write_bytes(b"")
    response = delivery().serve_attachment(request(), "attachments/sample.png")
    assert response["Content-Length"] == "0"
    assert body(response) == b""
    with pytest.raises(StorageError) as error:
        delivery().serve_attachment(request(header="bytes=0-"), "attachments/sample.png")
    assert error.value.status == 416
    path.write_bytes(b"0123")
    response = delivery().serve_attachment(request(method="HEAD", header="bytes=1-2"), "attachments/sample.png")
    assert response.status_code == 200
    assert response["Content-Length"] == "4"
    assert body(response) == b""
    assert not target_descriptors(path)


def test_sized_file_limit_has_a_hard_ceiling(attachment_wiki, settings):
    path = attachment_wiki / "attachments/sample.png"
    with path.open("wb") as stream:
        stream.truncate(64 * 1024 * 1024 + 1)
    settings.BACKSTORY_ATTACHMENT_MAX_BYTES = 1024 * 1024 * 1024
    with pytest.raises(StorageError) as error:
        delivery().serve_attachment(request(), "attachments/sample.png")
    assert error.value.status == 413
    assert not target_descriptors(path)


def test_download_filename_handles_unicode_without_header_injection(attachment_wiki):
    path = attachment_wiki / "attachments/日本語 #1.html"
    path.write_bytes(b"inert synthetic active-type text")
    response = delivery().serve_attachment(request(), "attachments/日本語 #1.html")
    assert response["Content-Disposition"].startswith("attachment; filename*=utf-8''")
    assert "%E6%97%A5" in response["Content-Disposition"]
    assert body(response) == b"inert synthetic active-type text"
