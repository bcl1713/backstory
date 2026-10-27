"""Conflict-safe publication on disposable files; no live content."""
import hashlib
import importlib
import json
import os
import re

import pytest
from django.test import Client

from tests.integration.test_browsing import reader
from tests.integration.test_storage import wiki

pytestmark = pytest.mark.django_db


def revision(raw):
    return '"' + hashlib.sha256(raw).hexdigest() + '"'


def save(reader, source, base=None, *, path="note.md", mode="formatted", token=None, create=False):
    headers = {"HTTP_IF_NONE_MATCH": "*"} if create else ({"HTTP_IF_MATCH": base} if base else {})
    return reader.post("/save/" + path, data=json.dumps({"source": source, "mode": mode, "recovery_token": token}), content_type="application/json", **headers)


def backend():
    return importlib.import_module("wiki.saves")


def test_two_editors_get_412(reader, wiki):
    (wiki / "note.md").write_bytes(b"# Original\n")
    base = revision(b"# Original\n")
    first = save(reader, "# First\n", base)
    assert first.status_code == 200
    second = save(reader, "# Second\n", base)
    assert second.status_code == 412
    assert second.json()["revision"] == revision(b"# First\n")
    assert (wiki / "note.md").read_bytes() == b"# First\n"


@pytest.mark.parametrize("condition", [
    'W/"' + 'a' * 64 + '"', '*', '"short"', '"' + 'a' * 64 + '", "' + 'b' * 64 + '"',
])
def test_save_requires_one_strong_application_revision(reader, wiki, condition):
    target = wiki / "note.md"
    target.write_bytes(b"# Original\n")
    response = save(reader, "# Rejected\n", condition)
    assert response.status_code == 400
    assert response.json()["reason_code"] == "invalid_precondition"
    assert target.read_bytes() == b"# Original\n"


def test_create_never_overwrites(reader, wiki):
    first = save(reader, "# New\n", create=True)
    assert first.status_code == 200
    assert save(reader, "# Other\n", create=True).status_code == 412
    assert (wiki / "note.md").read_bytes() == b"# New\n"
    assert save(reader, "# Nested\n", path="absent/note.md", create=True).status_code == 404
    assert not (wiki / "absent").exists()


def test_noop_preserves_mtime(reader, wiki):
    from django.apps import apps
    target = wiki / "note.md"
    target.write_bytes(b"# Same\n")
    before = target.stat()
    response = save(reader, "# Same\n", revision(b"# Same\n"))
    assert response.status_code == 200 and response.json()["state"] == "noop"
    assert target.stat().st_mtime_ns == before.st_mtime_ns
    assert target.stat().st_ino == before.st_ino
    assert apps.get_model("wiki", "SavedRevision").objects.count() == 0


def test_failure_requires_explicit_source_recovery(reader, wiki, monkeypatch):
    (wiki / "note.md").write_bytes(b"\xef\xbb\xbf# Original\r\n")
    base = revision((wiki / "note.md").read_bytes())
    draft = "---\nx: [\n---\n# Draft\r\nmixed\n"
    failure = save(reader, draft, base)
    assert failure.status_code == 422
    data = failure.json()
    assert data["source"] == draft and data["diagnostics"] and data["recovery_token"]
    assert (wiki / "note.md").read_bytes() == b"\xef\xbb\xbf# Original\r\n"
    assert save(reader, draft, base, mode="source_recovery").status_code == 400
    monkeypatch.setattr(backend(), "format_source", lambda *args: pytest.fail("recovery ran formatter"))
    recovered = save(reader, draft, base, mode="source_recovery", token=data["recovery_token"])
    assert recovered.status_code == 200
    assert recovered.json()["state"] == "saved_source"
    assert recovered.json()["diagnostics"] == data["diagnostics"]
    assert (wiki / "note.md").read_bytes() == b"\xef\xbb\xbf" + draft.encode()


def test_recovery_keeps_original_base(reader, wiki):
    target = wiki / "note.md"
    target.write_bytes(b"original")
    base = revision(b"original")
    draft = "---\nx: [\n---\n"
    token = save(reader, draft, base).json()["recovery_token"]
    target.write_bytes(b"external")
    assert save(reader, draft, base, mode="source_recovery", token=token).status_code == 412
    assert save(reader, draft, revision(b"external"), mode="source_recovery", token=token).status_code == 400
    assert target.read_bytes() == b"external"


def test_backup_failure_refuses_write(reader, wiki, settings):
    target = wiki / "note.md"
    target.write_bytes(b"# Original\n")
    settings.BACKSTORY_REVISION_QUOTA_BYTES = 1
    response = save(reader, "# Draft\n", revision(b"# Original\n"))
    assert response.status_code == 503
    assert response.json()["reason_code"] == "backup_quota_exceeded"
    assert target.read_bytes() == b"# Original\n"


def test_uncertain_replace_rereads_disk(reader, wiki, monkeypatch):
    target = wiki / "note.md"
    target.write_bytes(b"# Original\n")
    real_replace = os.replace
    def uncertain(*args, **kwargs):
        real_replace(*args, **kwargs)
        raise OSError("synthetic lost acknowledgement")
    monkeypatch.setattr(os, "replace", uncertain)
    response = save(reader, "# Saved\n", revision(b"# Original\n"))
    assert response.status_code == 200
    assert response.json()["revision"] == revision(b"# Saved\n")
    assert target.read_bytes() == b"# Saved\n"
    assert not list(wiki.glob(".backstory-tmp-*"))


def test_http_guards_and_identity_are_immutable(reader, wiki, settings):
    target = wiki / "note.md"
    target.write_bytes(b"original")
    assert save(reader, "draft").status_code == 428
    strict = Client(enforce_csrf_checks=True)
    strict.cookies = reader.cookies
    assert strict.post("/save/note.md", data='{"source":"draft"}', content_type="application/json", HTTP_IF_MATCH=revision(b"original")).status_code == 403
    assert Client().post("/save/note.md").status_code == 302
    assert save(reader, "draft", revision(b"original"), path="AGENTS.md").status_code == 404
    assert save(reader, "draft", revision((wiki / ".backstory-marker").read_bytes()), path=".backstory-marker").status_code == 404
    settings.BACKSTORY_NOTE_MAX_BYTES = 8
    assert save(reader, "a" * 9, revision(b"original")).status_code == 413
    (wiki / ".backstory-marker").unlink()
    assert save(reader, "draft", revision(b"original")).status_code == 503
    assert target.read_bytes() == b"original"


def test_final_hash_and_config_recheck_refuse_staged_write(reader, wiki, monkeypatch):
    target = wiki / "note.md"
    target.write_bytes(b"# Original\n")
    f = importlib.import_module("wiki.formatting")
    original = f.format_source
    def external_edit(*args):
        result = original(*args)
        target.write_bytes(b"external writer")
        return result
    monkeypatch.setattr(backend(), "format_source", external_edit)
    assert save(reader, "# Draft\n", revision(b"# Original\n")).status_code == 412
    assert target.read_bytes() == b"external writer"
    target.write_bytes(b"# Original\n")
    def config_edit(*args):
        result = original(*args)
        (wiki / ".prettierrc").write_text('{}')
        return result
    monkeypatch.setattr(backend(), "format_source", config_edit)
    response = save(reader, "# Draft\n", revision(b"# Original\n"))
    assert response.status_code == 422 and response.json()["recovery_token"]
    assert target.read_bytes() == b"# Original\n"


def test_explicit_failed_format_can_grant_bound_recovery(reader, wiki):
    target = wiki / "note.md"
    target.write_bytes(b"original")
    draft = "---\nx: [\n---\n"
    response = reader.post("/format/note.md", data=json.dumps({"source":draft}), content_type="application/json", HTTP_IF_MATCH=revision(b"original"))
    assert response.status_code == 200
    token = response.json()["recovery_token"]
    assert token
    assert save(reader, draft + "changed", revision(b"original"), mode="source_recovery", token=token).status_code == 400
    assert save(reader, draft, revision(b"original"), mode="source_recovery", token=token).status_code == 200


def test_backups_capture_exact_original_and_submitted_and_mode(reader, wiki):
    from django.apps import apps
    target = wiki / "note.md"
    target.write_bytes(b"\xef\xbb\xbf# Original\r\n")
    target.chmod(0o640)
    original = target.read_bytes()
    response = save(reader, "# Draft\r\n", revision(original))
    assert response.status_code == 200
    backup = apps.get_model("wiki", "SavedRevision").objects.get()
    assert bytes(backup.original) == original
    assert bytes(backup.submitted) == b"# Draft\r\n"
    assert target.stat().st_mode & 0o777 == 0o640
    assert target.read_bytes().startswith(b"\xef\xbb\xbf")
    assert not list(wiki.glob(".backstory-tmp-*"))


def test_create_publication_collision_during_link_never_overwrites(reader, wiki, monkeypatch):
    real_link = os.link
    def competing_link(src, dst, **kwargs):
        (wiki / "note.md").write_bytes(b"external winner")
        return real_link(src, dst, **kwargs)
    monkeypatch.setattr(os, "link", competing_link)
    response = save(reader, "# New\n", create=True)
    assert response.status_code == 412
    assert (wiki / "note.md").read_bytes() == b"external winner"
    assert not list(wiki.glob(".backstory-tmp-*"))


def test_create_hardlink_unsupported_refuses_with_actionable_reason(reader, wiki, monkeypatch):
    import errno
    def unsupported(*args, **kwargs):
        raise OSError(errno.EOPNOTSUPP, "synthetic filesystem")
    monkeypatch.setattr(os, "link", unsupported)
    response = save(reader, "# New\n", create=True)
    assert response.status_code == 503
    assert response.json()["reason_code"] == "create_link_unsupported"
    assert not (wiki / "note.md").exists()


def test_durability_error_rereads_without_replay(reader, wiki, monkeypatch):
    target = wiki / "note.md"
    target.write_bytes(b"# Original\n")
    real_sync = os.fsync
    def fail_directory(fd):
        import stat
        info = os.fstat(fd)
        if stat.S_ISDIR(info.st_mode) and (info.st_dev, info.st_ino) == (wiki.stat().st_dev, wiki.stat().st_ino):
            raise OSError("synthetic directory durability")
        return real_sync(fd)
    monkeypatch.setattr(os, "fsync", fail_directory)
    response = save(reader, "# Saved\n", revision(b"# Original\n"))
    assert response.status_code == 200
    assert response.json()["revision"] == revision(b"# Saved\n")
    assert "durability_uncertain" in [d["code"] for d in response.json()["diagnostics"]]
    assert target.read_bytes() == b"# Saved\n"


def test_final_readiness_after_staging_cannot_be_bypassed(reader, wiki, monkeypatch):
    target = wiki / "note.md"
    target.write_bytes(b"# Original\n")
    original_store = backend().store_required_backup
    def lose_mount(*args):
        original_store(*args)
        (wiki / ".backstory-marker").unlink()
    monkeypatch.setattr(backend(), "store_required_backup", lose_mount)
    response = save(reader, "# Saved\n", revision(b"# Original\n"))
    assert response.status_code == 503
    assert target.read_bytes() == b"# Original\n"
    assert not list(wiki.glob(".backstory-tmp-*"))


def test_recovery_actor_expiry_and_guards(reader, wiki, django_user_model, settings):
    from datetime import timedelta
    from django.apps import apps
    from django.utils import timezone
    target = wiki / "note.md"
    target.write_bytes(b"original")
    draft = "---\nx: [\n---\n"
    token = save(reader, draft, revision(b"original")).json()["recovery_token"]
    other = Client()
    other.force_login(django_user_model.objects.create_user(username="other-synthetic"))
    assert save(other, draft, revision(b"original"), mode="source_recovery", token=token).status_code == 400
    settings.BACKSTORY_REVISION_QUOTA_BYTES = 0
    assert save(reader, draft, revision(b"original"), mode="source_recovery", token=token).status_code == 503
    settings.BACKSTORY_REVISION_QUOTA_BYTES = 10000
    apps.get_model("wiki", "FormatRecovery").objects.update(expires_at=timezone.now() - timedelta(seconds=1))
    assert save(reader, draft, revision(b"original"), mode="source_recovery", token=token).status_code == 400
    assert target.read_bytes() == b"original"


def test_index_failure_is_successful_disk_save(reader, wiki, monkeypatch):
    def queue_failure(*args):
        raise OSError("synthetic unavailable queue")
    monkeypatch.setattr(backend(), "enqueue_note", queue_failure)
    response = save(reader, "# New\n", create=True)
    assert response.status_code == 200
    assert response.json()["state"] == "saved_index_delayed"
    assert (wiki / "note.md").read_bytes() == b"# New\n"


def test_precondition_is_checked_before_formatting(reader, wiki, monkeypatch):
    (wiki / "note.md").write_bytes(b"current")
    monkeypatch.setattr(backend(), "format_source", lambda *args: pytest.fail("formatted stale input"))
    assert save(reader, "# Draft\n", revision(b"stale")).status_code == 412


def test_source_recovery_rechecks_size_path_and_readiness(reader, wiki, settings):
    target = wiki / "note.md"
    target.write_bytes(b"original")
    draft = "---\nx: [\n---\n"
    token = save(reader, draft, revision(b"original")).json()["recovery_token"]
    settings.BACKSTORY_NOTE_MAX_BYTES = 1
    assert save(reader, draft, revision(b"original"), mode="source_recovery", token=token).status_code == 413
    settings.BACKSTORY_NOTE_MAX_BYTES = 2000
    assert save(reader, draft, revision(b"original"), path=".hidden.md", mode="source_recovery", token=token).status_code == 404
    (wiki / ".backstory-marker").unlink()
    assert save(reader, draft, revision(b"original"), mode="source_recovery", token=token).status_code == 503
    assert target.read_bytes() == b"original"


def test_codemirror_style_nonce_is_unique_without_inline_permission(reader, wiki):
    from django.http import HttpResponse
    from django.test import RequestFactory
    from backstory.middleware import ResponsePolicyMiddleware
    def page(request):
        return HttpResponse(request.csp_style_nonce)
    middleware = ResponsePolicyMiddleware(page)
    first = middleware(RequestFactory().get("/"))
    second = middleware(RequestFactory().get("/"))
    nonce = first.content.decode()
    assert len(nonce) >= 24 and nonce != second.content.decode()
    assert f"style-src 'self' 'nonce-{nonce}'" in first["Content-Security-Policy"]
    assert "script-src 'self';" in first["Content-Security-Policy"]
    assert "unsafe-inline" not in first["Content-Security-Policy"]
    assert first["Cache-Control"] == "no-store"
    (wiki / "note.md").write_bytes(b"# Synthetic nonce bootstrap\n")
    note = reader.get("/notes/note.md")
    bootstrap_nonce = re.search(rb'data-style-nonce="([A-Za-z0-9_-]+)"', note.content).group(1).decode()
    assert f"'nonce-{bootstrap_nonce}'" in note["Content-Security-Policy"]
    assert "unsafe-inline" not in note["Content-Security-Policy"]


def test_cleanup_error_cannot_turn_published_create_into_failed_save(reader, wiki, monkeypatch):
    real_unlink = os.unlink
    def fail_temp_cleanup(name, **kwargs):
        if str(name).startswith(".backstory-tmp-"):
            raise PermissionError("synthetic cleanup unavailable")
        return real_unlink(name, **kwargs)
    monkeypatch.setattr(os, "unlink", fail_temp_cleanup)
    response = save(reader, "# New\n", create=True)
    assert response.status_code == 200
    assert (wiki / "note.md").read_bytes() == b"# New\n"


def test_application_lock_is_shared_by_independent_processes(wiki, settings):
    import subprocess
    import sys
    from wiki.revisions import application_lock
    with application_lock("note:note.md"):
        locks = list((settings.BACKSTORY_DATA_DIR / "locks").glob("*.lock"))
        assert len(locks) == 1
        code = "import fcntl,os,sys; fd=os.open(sys.argv[1],os.O_RDWR);\ntry: fcntl.flock(fd,fcntl.LOCK_EX|fcntl.LOCK_NB)\nexcept BlockingIOError: sys.exit(0)\nsys.exit(7)"
        result = subprocess.run([sys.executable, "-c", code, str(locks[0])], timeout=10, check=False)
        assert result.returncode == 0


def test_startup_cleanup_removes_only_registered_reserved_siblings(wiki, settings):
    from wiki.staging import cleanup_staged_saves, register_stage
    from wiki.revisions import application_lock
    settings.BACKSTORY_DATA_DIR.mkdir(mode=0o700, exist_ok=True)
    temp = ".backstory-tmp-" + "a" * 32
    (wiki / temp).write_bytes(b"staged synthetic")
    (wiki / "note.md").write_bytes(b"keep note")
    register_stage("note.md", temp)
    cleanup_staged_saves()
    assert not (wiki / temp).exists()
    assert (wiki / "note.md").read_bytes() == b"keep note"
    (wiki / temp).write_bytes(b"active synthetic")
    register_stage("note.md", temp)
    with application_lock("note:note.md"):
        cleanup_staged_saves()
        assert (wiki / temp).exists()
    cleanup_staged_saves()
    assert not (wiki / temp).exists()


def test_new_notes_default_to_private_basic_mode(reader, wiki):
    previous = os.umask(0o077)
    try:
        response = save(reader, "# New\n", create=True)
    finally:
        os.umask(previous)
    assert response.status_code == 200
    assert (wiki / "note.md").stat().st_mode & 0o777 == 0o600


def test_startup_cleanup_rereads_registration_under_writer_lock(wiki, settings, monkeypatch):
    from contextlib import contextmanager
    from wiki import staging
    from wiki.revisions import application_lock
    original_temp = ".backstory-tmp-" + "a" * 32
    later_temp = ".backstory-tmp-" + "b" * 32
    (wiki / original_temp).write_bytes(b"old staged")
    staging.register_stage("note.md", original_temp)
    @contextmanager
    def writer_finished_before_lock(key, **kwargs):
        # Another process finished/crashed after startup read, before lock entry.
        (wiki / original_temp).unlink()
        staging.finish_stage("note.md")
        (wiki / later_temp).write_bytes(b"later staged")
        staging.register_stage("note.md", later_temp)
        with application_lock(key, **kwargs):
            yield
    monkeypatch.setattr(staging, "application_lock", writer_finished_before_lock)
    staging.cleanup_staged_saves()
    assert not (wiki / later_temp).exists()
    assert not list((settings.BACKSTORY_DATA_DIR / "pending-saves").iterdir())


@pytest.mark.parametrize("established_bom", [False, True])
@pytest.mark.parametrize("uncertain_ack", [False, True])
def test_source_recovery_preserves_leading_editable_feff(reader, wiki, monkeypatch, established_bom, uncertain_ack):
    target = wiki / "note.md"
    prefix = b"\xef\xbb\xbf" if established_bom else b""
    target.write_bytes(prefix + b"# Original\n")
    original = target.read_bytes()
    draft = "\ufeff---\nx: [\n---\n# Recovery\r\nmixed\n"
    failed = save(reader, draft, revision(original))
    assert failed.status_code == 422
    token = failed.json()["recovery_token"]
    if uncertain_ack:
        replace = os.replace
        def uncertain(*args, **kwargs):
            replace(*args, **kwargs)
            raise OSError("synthetic lost acknowledgement")
        monkeypatch.setattr(os, "replace", uncertain)
    recovered = save(reader, draft, revision(original), mode="source_recovery", token=token)
    assert recovered.status_code == 200
    assert recovered.json()["source"] == draft
    expected = prefix + draft.encode("utf-8")
    assert target.read_bytes() == expected
    assert recovered.json()["revision"] == revision(expected)


def test_noop_with_encoding_bom_and_editable_feff_preserves_bytes_and_history(reader, wiki):
    from django.apps import apps
    target = wiki / "note.md"
    raw = b"\xef\xbb\xbf\xef\xbb\xbf# Same\r\nmixed\n"
    target.write_bytes(raw)
    # Ignore both transforms so normal save must preserve the exact source.
    (wiki / ".prettierignore").write_text("note.md\n")
    (wiki / ".markdownlintignore").write_text("note.md\n")
    before = target.stat()
    response = save(reader, "\ufeff# Same\r\nmixed\n", revision(raw))
    assert response.status_code == 200
    assert response.json()["state"] == "noop"
    assert response.json()["source"] == "\ufeff# Same\r\nmixed\n"
    assert response.json()["revision"] == revision(raw)
    assert target.read_bytes() == raw
    assert target.stat().st_mtime_ns == before.st_mtime_ns
    assert target.stat().st_ino == before.st_ino
    assert apps.get_model("wiki", "SavedRevision").objects.count() == 0


@pytest.mark.parametrize("mode", [[], {}, 3, None])
def test_invalid_mode_json_is_rejected_without_writing(reader, wiki, mode):
    target = wiki / "note.md"
    original = b"# Original\n"
    target.write_bytes(original)
    response = save(reader, "# Changed\n", revision(original), mode=mode)
    assert response.status_code == 400
    assert response.json()["reason_code"] == "invalid_save_mode"
    assert target.read_bytes() == original


def test_wiki_parent_permission_error_is_actionable_and_preserves_disk(reader, wiki, monkeypatch):
    import errno
    import os
    from wiki.storage import read_note
    (wiki / 'note.md').write_text('# Original\n')
    base = read_note('note.md').revision
    original = os.open
    def denied(path, flags, *args, **kwargs):
        if isinstance(path, str) and path.startswith('.backstory-tmp-'):
            raise PermissionError(errno.EACCES, 'synthetic parent write denied')
        return original(path, flags, *args, **kwargs)
    monkeypatch.setattr(os, 'open', denied)
    response = save(reader, '# Edited\n', base)
    assert response.status_code == 503 and response.json()['reason_code'] == 'wiki_write_denied'
    assert (wiki / 'note.md').read_text() == '# Original\n'
