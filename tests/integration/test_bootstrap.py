"""Contracts: root isolation, fixture safety, persistent state and auth boundaries."""
import importlib
import json
import os
from pathlib import Path
import subprocess
import sys

import pytest


def module(name):
    try:
        return importlib.import_module(name)
    except ImportError:
        pytest.fail(f"Required runtime module {name} is missing")


def test_fixture_refuses_existing_destination(tmp_path):
    generate = module("tests.fixtures.generate").generate_fixture
    destination = tmp_path / "existing"
    destination.mkdir()
    sentinel = destination / "keep.txt"
    sentinel.write_text("keep")
    with pytest.raises(FileExistsError):
        generate(destination, "small")
    assert sentinel.read_text() == "keep"
    assert list(destination.iterdir()) == [sentinel]


def test_fixture_manifest_is_outside_wiki(tmp_path):
    fixture = module("tests.fixtures.generate").generate_fixture(tmp_path / "fixture", "small")
    assert fixture.wiki_root.is_dir()
    for directory in ["notes", "projects/active", "projects/archive", "reference", "templates", "daily/2026", "attachments"]:
        assert (fixture.wiki_root / directory).is_dir()
    assert fixture.identity_path == "Home.md"
    assert fixture.config_path.is_file()
    assert not fixture.config_path.is_relative_to(fixture.wiki_root)
    manifest = json.loads(fixture.manifest_path.read_text())
    assert manifest["profile"] == "small"
    assert len(list(fixture.wiki_root.rglob("*.md"))) >= 5


def check_runtime(wiki, data, **extra):
    env = dict(os.environ, BACKSTORY_WIKI_ROOT=str(wiki), BACKSTORY_DATA_DIR=str(data), **extra)
    return subprocess.run([sys.executable, "manage.py", "check"], env=env, text=True, capture_output=True, timeout=30)


@pytest.mark.parametrize("relationship", ["equal", "data_inside", "wiki_inside"])
def test_roots_must_not_overlap(tmp_path, relationship):
    wiki = tmp_path / "wiki"
    data = {"equal": wiki, "data_inside": wiki / "data", "wiki_inside": tmp_path}[relationship]
    result = check_runtime(wiki, data)
    assert result.returncode != 0
    assert "must not overlap" in result.stderr
    assert not wiki.exists()


def test_missing_wiki_never_created_and_secret_survives_restart(tmp_path):
    wiki, data = tmp_path / "absent", tmp_path / "data"
    first = check_runtime(wiki, data)
    assert first.returncode == 0, first.stderr
    assert not wiki.exists()
    secret = (data / "application-secret").read_bytes()
    second = check_runtime(wiki, data)
    assert second.returncode == 0, second.stderr
    assert (data / "application-secret").read_bytes() == secret
    assert (data / "application-secret").stat().st_mode & 0o077 == 0
    assert not wiki.exists()


def test_missing_wiki_configuration_fails_closed(tmp_path):
    env = dict(os.environ, BACKSTORY_DATA_DIR=str(tmp_path / "data"))
    env.pop("BACKSTORY_WIKI_ROOT", None)
    result = subprocess.run([sys.executable, "manage.py", "check"], env=env, text=True, capture_output=True, timeout=30)
    assert result.returncode != 0
    assert "BACKSTORY_WIKI_ROOT" in result.stderr
    assert not (tmp_path / "data").exists()


@pytest.mark.django_db
def test_account_bootstrap_login_logout(monkeypatch):
    module("accounts.views")
    from django.contrib.auth import get_user_model
    from django.core.management import call_command
    from django.test import Client

    answers = iter(["synthetic-reader"])
    monkeypatch.setattr("builtins.input", lambda prompt: next(answers))
    monkeypatch.setattr("getpass.getpass", lambda prompt: "Synthetic-only password 473!")
    call_command("create_account")
    user = get_user_model().objects.get(username="synthetic-reader")
    assert user.password.startswith("argon2$")
    assert user.check_password("Synthetic-only password 473!")

    client = Client(enforce_csrf_checks=True)
    assert client.get("/").status_code == 302
    assert client.post("/accounts/login/", {"username": user.username, "password": "bad"}).status_code == 403
    client.get("/accounts/login/")
    token = client.cookies["csrftoken"].value
    bad = client.post("/accounts/login/", {"username": user.username, "password": "wrong", "csrfmiddlewaretoken": token})
    other = client.post("/accounts/login/", {"username": "nonexistent", "password": "wrong", "csrfmiddlewaretoken": token})
    assert bad.context["form"].non_field_errors() == other.context["form"].non_field_errors()
    login = client.post("/accounts/login/", {"username": user.username, "password": "Synthetic-only password 473!", "csrfmiddlewaretoken": token})
    assert login.status_code == 302
    assert client.get("/").status_code == 200
    assert client.get("/")["Cache-Control"] == "no-store"
    from django.contrib.sessions.models import Session
    session_key = client.session.session_key
    resumed = Client(enforce_csrf_checks=True)
    resumed.cookies["sessionid"] = client.cookies["sessionid"].value
    assert resumed.get("/").status_code == 200
    assert client.get("/accounts/logout/").status_code == 405
    assert client.post("/accounts/logout/").status_code == 403
    token = client.cookies["csrftoken"].value
    assert client.post("/accounts/logout/", {"csrfmiddlewaretoken": token}).status_code == 302
    assert not Session.objects.filter(session_key=session_key).exists()
    assert resumed.get("/").status_code == 302


@pytest.mark.django_db
def test_account_password_cli_argument_is_rejected():
    module("accounts.views")
    from django.core.management import call_command
    with pytest.raises(TypeError):
        call_command("create_account", password="do-not-accept-cli-passwords")


def test_https_mode_uses_secure_cookies_and_redirects(tmp_path):
    env = dict(os.environ, BACKSTORY_DATA_DIR=str(tmp_path / "data"), BACKSTORY_COOKIE_MODE="https", BACKSTORY_ALLOWED_HOSTS="wiki.example.invalid")
    result = subprocess.run([sys.executable, "manage.py", "check", "--deploy", "--fail-level", "WARNING"], env=env, text=True, capture_output=True, timeout=30)
    assert result.returncode == 0, result.stderr


def test_localhost_cookie_mode_rejects_public_hosts(tmp_path):
    result = check_runtime(tmp_path / "wiki", tmp_path / "data", BACKSTORY_ALLOWED_HOSTS="wiki.example.invalid")
    assert result.returncode != 0
    assert "loopback hosts" in result.stderr


@pytest.mark.django_db
def test_login_rejects_forged_origin():
    from django.test import Client
    client = Client(enforce_csrf_checks=True)
    client.get("/accounts/login/")
    response = client.post("/accounts/login/", {"username": "synthetic", "password": "bad", "csrfmiddlewaretoken": client.cookies["csrftoken"].value}, HTTP_ORIGIN="https://attacker.example.invalid")
    assert response.status_code == 403
