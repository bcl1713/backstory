"""Paths are literal Unicode strings; sensitive policy never depends on extension."""
import importlib

import pytest


def policy():
    try:
        return importlib.import_module("wiki.policy")
    except ImportError:
        pytest.fail("Task 2 shared path policy is missing")


@pytest.mark.parametrize("path", ["/note.md", "../note.md", "a/../note.md", "a//b.md", "a/./b.md", "a\\b.md", "a\x00b.md", "bad\udcff.md"])
def test_reject_noncanonical_or_malformed_paths(path):
    p = policy()
    with pytest.raises(p.PathDenied):
        p.validate_path(path, "content")


@pytest.mark.parametrize("path", [".private/note.md", "notes/.env", ".silverbullet.auth.json", "AGENTS.md", "notes/CLAUDE.md", "GEMINI.md", "SKILL.md", "node_modules/a.md", "venv/a.md", "backups/a.md", "credentials.json", "auth.json", "token.txt", "key.json", "ssh_config", "api-key.json", "service-account.json", "private.key", "id_rsa", "config.yaml", "notes/.backstory-tmp-123.md", ".prettierrc", ".markdownlint-cli2.jsonc"])
def test_sensitive_names_are_denied_as_strings(path):
    p = policy()
    with pytest.raises(p.PathDenied):
        p.validate_path(path, "content")


def test_decode_once(settings):
    p = policy()
    for value in ["100%.md", "hash#name.md", "é/日本語.md", "%2e%2e.md", "%ZZ.md"]:
        assert p.validate_path(value, "content") == value
    settings.BACKSTORY_EXCLUSIONS = ["private", "drafts/*.md"]
    for value in ["private/a.md", "drafts/a.md"]:
        with pytest.raises(p.PathDenied):
            p.validate_path(value, "content")
    with pytest.raises(p.PathDenied):
        p.validate_path(".prettierrc", "identity")
    assert p.validate_path(".prettierrc", "config") == ".prettierrc"
    with pytest.raises(p.PathDenied):
        p.validate_path(".private", "config")


@pytest.mark.parametrize("purpose", ["content", "identity", "folder"])
@pytest.mark.parametrize("name", ["secret", "credential", "auth", "authentication", "token", "tokens", "key", "keys"])
def test_bare_sensitive_families_are_denied_as_strings(name, purpose):
    p = policy()
    # No credential fixtures: each spelling exercises the shared string policy.
    for path in [name, name.upper(), f"notes/{name}", f"notes/{name.upper()}/note.md"]:
        with pytest.raises(p.PathDenied):
            p.validate_path(path, purpose)


def test_existing_formatting_config_policy_exceptions_are_preserved():
    p = policy()
    for path in [".prettierrc", "notes/.prettierrc.yaml", "notes/prettier.config.js", "notes/.markdownlint-cli2.jsonc"]:
        assert p.validate_path(path, "config") == path
        assert p.validate_path(path, "config-reference") == path
        for purpose in ["content", "identity", "folder"]:
            with pytest.raises(p.PathDenied):
                p.validate_path(path, purpose)
    for path in ["formatting/options.json", "formatting/options.jsonc", "formatting/options.yaml", "formatting/options.yml"]:
        assert p.validate_path(path, "config-reference") == path
