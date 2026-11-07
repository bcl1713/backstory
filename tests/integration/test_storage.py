"""Real disposable filesystem contracts for identity and bounded direct reads."""
import hashlib
import importlib
import os

import pytest


def module(name):
    try:
        return importlib.import_module(name)
    except ImportError:
        pytest.fail(f"Task 2 module {name} is missing")


@pytest.fixture
def wiki(tmp_path, settings):
    root = tmp_path / "wiki"
    root.mkdir()
    (root / ".backstory-marker").write_bytes(b"synthetic storage identity\n")
    settings.BACKSTORY_WIKI_ROOT = root
    settings.BACKSTORY_DATA_DIR = tmp_path / "data"
    settings.BACKSTORY_IDENTITY_PATH = ".backstory-marker"
    settings.BACKSTORY_EXCLUSIONS = []
    return root


def test_identity_is_not_directory_existence(wiki, settings):
    readiness = module("wiki.readiness")
    storage = module("wiki.storage")
    (wiki / "note.md").write_text("synthetic note")
    assert readiness.check_readiness().state == "ready"
    (wiki / ".backstory-marker").unlink()
    assert readiness.check_readiness().reason_code == "marker_missing"
    with pytest.raises(storage.StorageUnavailable):
        storage.read_note("note.md")
    wiki.rename(wiki.with_name("original"))
    wiki.mkdir()
    assert readiness.check_readiness().state == "unavailable"
    wiki.rmdir()
    assert readiness.check_readiness().reason_code == "root_missing"
    assert not wiki.exists()


def test_marker_unreadable_is_unavailable(wiki, monkeypatch):
    readiness = module("wiki.readiness")
    original = os.open
    def deny_marker(path, *args, **kwargs):
        if path == ".backstory-marker":
            raise PermissionError("synthetic inaccessible marker")
        return original(path, *args, **kwargs)
    monkeypatch.setattr(os, "open", deny_marker)
    result = readiness.check_readiness()
    assert result.reason_code == "marker_unreadable"
    assert str(wiki) not in str(result)


@pytest.mark.parametrize("destination", ["inside", "outside"])
def test_no_follow_each_component(wiki, tmp_path, destination):
    storage = module("wiki.storage")
    target = wiki / "real" if destination == "inside" else tmp_path / "outside"
    target.mkdir()
    (target / "note.md").write_text("must not be returned")
    (wiki / "linked").symlink_to(target, target_is_directory=True)
    (wiki / "note.md").symlink_to(target / "note.md")
    for value in ["linked/note.md", "note.md"]:
        with pytest.raises(storage.StorageError):
            storage.read_note(value)
    (wiki / "parent").mkdir()
    (wiki / "parent/note.md").write_text("before replacement")
    (wiki / "parent").rename(wiki / "old-parent")
    (wiki / "parent").symlink_to(target, target_is_directory=True)
    with pytest.raises(storage.StorageError):
        storage.read_note("parent/note.md")
    os.mkfifo(wiki / "pipe.md")
    with pytest.raises(storage.StorageError):
        storage.read_note("pipe.md")


def test_utf8_read_is_lossless(wiki, settings):
    storage = module("wiki.storage")
    raw = b"\xef\xbb\xbf# Synthetic\r\n" + "日本語\r\n".encode()
    (wiki / "note.md").write_bytes(raw)
    snapshot = storage.read_note("note.md")
    assert snapshot.raw_bytes == raw
    assert snapshot.source == "# Synthetic\r\n日本語\r\n"
    assert snapshot.bom is True
    assert snapshot.newline == "\r\n"
    assert snapshot.revision == '"' + hashlib.sha256(raw).hexdigest() + '"'
    (wiki / "note.md").write_bytes(b"\xff")
    with pytest.raises(storage.StorageError, match="invalid_utf8"):
        storage.read_note("note.md")
    settings.BACKSTORY_NOTE_MAX_BYTES = 8
    (wiki / "note.md").write_bytes(b"a" * 9)
    with pytest.raises(storage.StorageError, match="note_too_large"):
        storage.read_note("note.md")


def test_folder_pages_are_bounded(wiki):
    storage = module("wiki.storage")
    (wiki / "folder").mkdir()
    for n in range(215):
        (wiki / "folder" / f"note-{n}.md").write_text("synthetic")
    (wiki / "folder/deeper").mkdir()
    (wiki / "folder/deeper/never-enumerated.md").write_text("synthetic")
    (wiki / "folder/.hidden").write_text("synthetic")
    (wiki / "folder/link").symlink_to(wiki / "folder/deeper", target_is_directory=True)
    cursor = None
    found = []
    for _ in range(10):
        page = storage.list_folder("folder", cursor, 50)
        assert len(page.entries) <= 50
        found.extend(entry.path for entry in page.entries)
        cursor = page.next_cursor
        if cursor is None:
            break
    assert cursor is None
    assert len(found) == 216
    assert len(set(found)) == 216
    assert "folder/deeper" in found
    assert all("never-enumerated" not in item and ".hidden" not in item and "/link" not in item for item in found)
    page = storage.list_folder("folder", limit=1)
    (wiki / "folder/added.md").write_text("synthetic")
    with pytest.raises(storage.CursorInvalid):
        storage.list_folder("folder", page.next_cursor, 1)
    page = storage.list_folder("folder", limit=1)
    with pytest.raises(storage.CursorInvalid):
        storage.list_folder("", page.next_cursor, 1)


def test_folder_pages_sort_directories_first_then_names_across_pages(wiki):
    storage = module("wiki.storage")
    # Create in an order that differs from alphabetical order, including case ties.
    for name in ["zebra.md", "Beta.md", "apple.md", "Apple.md", "日本語.md"]:
        (wiki / name).write_text("synthetic")
    for name in ["zoo", "beta", "Alpha"]:
        (wiki / name).mkdir()
    (wiki / "Alpha/never-enumerated.md").write_text("synthetic")
    (wiki / ".hidden").mkdir()
    (wiki / "linked").symlink_to(wiki / "Alpha", target_is_directory=True)
    cursor = None
    names = []
    for _ in range(10):
        page = storage.list_folder("", cursor, 2)
        names.extend(entry.name for entry in page.entries)
        cursor = page.next_cursor
        if cursor is None:
            break
    assert cursor is None
    assert names == ["Alpha", "beta", "zoo", "Apple.md", "apple.md", "Beta.md", "zebra.md", "日本語.md"]


def test_policy_changes_invalidate_cursor(wiki, settings):
    storage = module("wiki.storage")
    (wiki / "a.md").write_text("synthetic")
    page = storage.list_folder("", limit=1)
    settings.BACKSTORY_EXCLUSIONS = ["a.md"]
    with pytest.raises(storage.CursorInvalid):
        storage.list_folder("", page.next_cursor, 1)
