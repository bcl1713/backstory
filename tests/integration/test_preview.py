"""HTTP preview remains authenticated, bounded and independent of stored source."""
import json

import pytest

from tests.integration.test_browsing import reader
from tests.integration.test_storage import wiki


@pytest.mark.django_db
def test_preview_requires_authentication_and_csrf(reader, wiki):
    from django.test import Client
    (wiki / "note.md").write_text("synthetic")
    assert Client().get("/preview/note.md").status_code == 302
    strict = Client(enforce_csrf_checks=True)
    strict.cookies = reader.cookies
    assert strict.post("/preview/note.md", data=json.dumps({"source": "synthetic"}), content_type="application/json").status_code == 403


@pytest.mark.django_db
def test_preview_never_changes_source_bytes_and_note_keeps_malformed_source(reader, wiki):
    source = b'\xef\xbb\xbf---\r\nbroken: [\r\n---\r\n<script>evil</script>\r\n[[missing\r\n'
    (wiki / "note.md").write_bytes(source)
    before = (wiki / "note.md").stat()
    response = reader.post("/preview/note.md", data=json.dumps({"source": "# Unsaved\n![pixel](https://example.invalid/p.png)"}), content_type="application/json")
    assert response.status_code == 200
    assert "Unsaved" in response.json()["html"]
    assert "External image blocked" in response.json()["html"]
    assert response["Cache-Control"] == "no-store"
    assert "object-src 'none'" in response["Content-Security-Policy"]
    assert "img-src 'self'" in response["Content-Security-Policy"]
    assert (wiki / "note.md").read_bytes() == source
    assert (wiki / "note.md").stat().st_mtime_ns == before.st_mtime_ns
    assert reader.get("/source/note.md").content == source[3:]
    note = reader.get("/notes/note.md")
    assert note.status_code == 200
    assert b"broken: [" in note.content
    assert b"&lt;script&gt;evil&lt;/script&gt;" in note.content
    assert reader.get("/preview/note.md").status_code == 200


@pytest.mark.django_db
def test_preview_rejects_bad_json_oversize_exclusions_and_unavailable_storage(reader, wiki, settings):
    for value in ["[]", '{"source": 4}', "{"]:
        assert reader.post("/preview/note.md", data=value, content_type="application/json").status_code == 400
    settings.BACKSTORY_NOTE_MAX_BYTES = 8
    assert reader.post("/preview/note.md", data=json.dumps({"source": "synthetic too large"}), content_type="application/json").status_code == 413
    assert reader.get("/preview/AGENTS.md").status_code == 404
    (wiki / ".backstory-marker").unlink()
    assert reader.post("/preview/note.md", data='{"source":"draft"}', content_type="application/json").status_code == 503


@pytest.mark.django_db
def test_preview_parse_failure_keeps_source_visible(reader, wiki, monkeypatch):
    from wiki import markdown
    (wiki / "note.md").write_text("synthetic original source")
    def broken_parser(*args, **kwargs):
        raise ValueError("synthetic parser failure")
    monkeypatch.setattr(markdown, "_parser", broken_parser)
    response = reader.get("/notes/note.md")
    assert response.status_code == 200
    assert b"synthetic original source" in response.content
    assert reader.get("/source/note.md").content == b"synthetic original source"
    secondary = reader.get("/preview/note.md")
    assert secondary.status_code == 200
    assert b"preview_unavailable" in secondary.content


@pytest.mark.django_db
def test_attachment_http_auth_policy_range_and_folder_navigation(reader, wiki):
    from django.test import Client
    (wiki / "image.png").write_bytes(b"\x89PNG\r\n\x1a\nsynthetic")
    (wiki / "active.svg").write_text("<svg />")
    assert Client().get("/attachments/image.png").status_code == 302
    response = reader.get("/attachments/image.png", HTTP_RANGE="bytes=0-3")
    assert response.status_code == 206
    assert response["Content-Type"] == "image/png"
    assert response["X-Content-Type-Options"] == "nosniff"
    assert b"".join(response.streaming_content) == b"\x89PNG"
    response.close()
    assert reader.get("/attachments/AGENTS.md").status_code == 404
    invalid_range = reader.get("/attachments/image.png", HTTP_RANGE="bytes=0-1,3-4")
    assert invalid_range.status_code == 416
    assert invalid_range["Content-Range"] == "bytes */17"
    active = reader.get("/attachments/active.svg")
    assert active["Content-Type"] == "application/octet-stream"
    assert active["Content-Disposition"].startswith("attachment;")
    active.close()
    assert b'href="/attachments/image.png"' in reader.get("/").content


@pytest.mark.django_db
def test_note_open_does_not_render_secondary_preview(reader, wiki, monkeypatch):
    from wiki import views
    (wiki / "note.md").write_bytes(b"# Synthetic source\n")
    monkeypatch.setattr(views, "render_preview", lambda *args: pytest.fail("opening source rendered the secondary preview"))
    response = reader.get("/notes/note.md")
    assert response.status_code == 200
    assert b"Synthetic source" in response.content
    assert b"/preview/note.md" in response.content
