"""Creation entry point validates folders without creating files or listing trees."""
import json

import pytest
from django.http import HttpResponse
from django.test import Client

from tests.integration.test_browsing import reader
from tests.integration.test_storage import wiki

pytestmark = pytest.mark.django_db


@pytest.fixture
def draft_context(monkeypatch):
    from wiki import views
    contexts = []
    original = views.render
    def capture(request, template, context=None, **kwargs):
        if template == "wiki/note.html":
            contexts.append(context)
            return HttpResponse("synthetic empty draft")
        return original(request, template, context, **kwargs)
    monkeypatch.setattr(views, "render", capture)
    return contexts


def test_new_existing_folder_get_only_prepares_empty_draft(reader, wiki, monkeypatch, draft_context):
    from wiki import views
    (wiki / "Notes").mkdir()
    (wiki / "Notes/existing.md").write_bytes(b"keep synthetic note")
    before = {path.relative_to(wiki): path.stat().st_mtime_ns for path in wiki.rglob("*")}
    monkeypatch.setattr(views, "list_folder", lambda *args: pytest.fail("new draft listed storage"))
    monkeypatch.setattr(views, "render_preview", lambda *args: pytest.fail("new draft rendered preview"))
    response = reader.get("/new/?folder=Notes")
    assert response.status_code == 200
    assert response["Cache-Control"] == "no-store"
    assert "ETag" not in response
    assert draft_context == [{"is_new": True, "folder": "Notes", "note": {"path": "", "source": "", "newline": "\n", "revision": None}}]
    assert {path.relative_to(wiki): path.stat().st_mtime_ns for path in wiki.rglob("*")} == before
    assert reader.get("/new/").status_code == 200
    assert draft_context[-1]["folder"] == ""


def test_new_requires_authentication_and_get(reader, wiki, draft_context):
    assert Client().get("/new/").status_code == 302
    assert reader.post("/new/").status_code == 405
    assert reader.get("/new/").status_code == 200
    assert not (wiki / "note.md").exists()


def test_new_rejects_denied_malformed_missing_and_symlink_folders(reader, wiki, draft_context):
    (wiki / "real").mkdir()
    (wiki / "linked").symlink_to(wiki / "real", target_is_directory=True)
    (wiki / "file.md").write_bytes(b"synthetic regular file")
    for query in ["folder=missing", "folder=.hidden", "folder=AGENTS.md", "folder=%2e%2e", "folder=%2fabsolute", "folder=%FF", "folder=%ZZ", "folder=linked", "folder=file.md"]:
        assert reader.get("/new/?" + query).status_code == 404
    assert draft_context == []
    assert not (wiki / "missing").exists()


def test_new_requires_ready_storage(reader, wiki, draft_context):
    (wiki / "Identity.txt").unlink()
    assert reader.get("/new/").status_code == 503
    assert draft_context == []
    assert list(wiki.iterdir()) == []


def test_new_draft_still_requires_guarded_create_save(reader, wiki, draft_context):
    (wiki / "Notes").mkdir()
    assert reader.get("/new/?folder=Notes").status_code == 200
    target = wiki / "Notes/new.md"
    body = json.dumps({"source": "# New synthetic\n", "mode": "formatted"})
    assert not target.exists()
    assert reader.post("/save/Notes/new.md", data=body, content_type="application/json").status_code == 428
    strict = Client(enforce_csrf_checks=True)
    strict.cookies = reader.cookies
    assert strict.post("/save/Notes/new.md", data=body, content_type="application/json", HTTP_IF_NONE_MATCH="*").status_code == 403
    assert not target.exists()
    saved = reader.post("/save/Notes/new.md", data=body, content_type="application/json", HTTP_IF_NONE_MATCH="*")
    assert saved.status_code == 200
    assert target.read_bytes() == b"# New synthetic\n"
    assert reader.post("/save/Notes/new.md", data=body, content_type="application/json", HTTP_IF_NONE_MATCH="*").status_code == 412
