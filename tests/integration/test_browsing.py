"""Authenticated routes preserve literal URL spelling and hide storage details."""
from io import StringIO
from urllib.parse import quote

import pytest

from tests.integration.test_storage import wiki


@pytest.fixture
def reader(client, django_user_model):
    user = django_user_model.objects.create_user(username="synthetic-reader")
    client.force_login(user)
    return client


@pytest.mark.django_db
def test_content_routes_require_authentication(client):
    for route in ["/", "/folders/", "/notes/test.md", "/source/test.md", "/status/"]:
        assert client.get(route).status_code == 302


@pytest.mark.django_db
def test_literal_paths_browsing_and_source(reader, wiki):
    for name in ["100%.md", "hash#name.md", "日本語.md", "%2e%2e.md", "%ZZ.md"]:
        (wiki / name).write_text("synthetic: " + name)
        route = quote(name, safe="")
        response = reader.get("/source/" + route)
        assert response.status_code == 200
        assert response.content.decode() == "synthetic: " + name
        assert response["Cache-Control"] == "no-store"
        assert response["ETag"].startswith('"')
    response = reader.get("/notes/" + quote("hash#name.md", safe=""))
    assert response.status_code == 200
    assert b"synthetic: hash#name.md" in response.content
    folders = reader.get("/folders/?limit=2")
    assert folders.status_code == 200
    assert len(folders.json()["entries"]) <= 2
    assert folders["Cache-Control"] == "no-store"
    for route in ["/source/.prettierrc", "/notes/AGENTS.md", "/source/%2e%2e/outside.md"]:
        assert reader.get(route).status_code == 404


@pytest.mark.django_db
def test_unavailable_storage_keeps_shell_status_and_login(reader, wiki):
    from django.core.management import call_command
    (wiki / "Identity.txt").unlink()
    for route in ["/", "/status/", "/accounts/login/"]:
        assert reader.get(route).status_code == 200
    response = reader.get("/source/note.md")
    assert response.status_code == 503
    assert b"identity_missing" in response.content
    assert str(wiki).encode() not in response.content
    assert b"Storage unavailable" in reader.get("/").content
    output = StringIO()
    call_command("storage_status", stdout=output)
    assert "identity_missing" in output.getvalue()
    assert str(wiki) not in output.getvalue()


@pytest.mark.django_db
def test_http_cursor_mutation_and_limits(reader, wiki):
    for n in range(3):
        (wiki / f"note-{n}.md").write_text("synthetic")
    page = reader.get("/folders/?limit=1").json()
    (wiki / "new.md").write_text("synthetic")
    response = reader.get("/folders/", {"limit": 1, "cursor": page["next_cursor"]})
    assert response.status_code == 409
    assert response.json()["reason_code"] == "cursor_invalid"
    assert reader.get("/folders/?limit=101").status_code == 400
    assert reader.get("/folders/?limit=bad").status_code == 400


@pytest.mark.django_db
def test_malformed_raw_encoding_is_distinct_from_literal_percent(reader, wiki):
    # Gunicorn supplies RAW_URI, before Django repairs invalid UTF-8 in PATH_INFO.
    # A percent-spelled filename must remain addressable by its correctly quoted URL.
    (wiki / "%FF.md").write_text("synthetic literal percent")
    assert reader.get("/source/%25FF.md", RAW_URI="/source/%25FF.md").status_code == 200
    for raw in ["/source/%FF.md", "/source/%ZZ.md", "/source/trailing%.md"]:
        assert reader.get(raw, RAW_URI=raw).status_code == 404
