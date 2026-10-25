"""Generated corpus contracts use only caller-owned disposable directories."""
from collections import Counter
from datetime import date
import hashlib
import json

import pytest

from tests.fixtures.generate import generate_fixture


def test_representative_layout_counts_and_exact_large_note(tmp_path):
    fixture = generate_fixture(tmp_path / "representative", "representative")
    notes = list(fixture.wiki_root.rglob("*.md"))
    assert len(notes) == 1000
    assert Counter(path.parent.relative_to(fixture.wiki_root).as_posix() for path in notes) == {
        ".": 1, "notes": 300, "projects/active": 150, "projects/archive": 100,
        "reference": 100, "templates": 50, "daily/2026": 299,
    }
    daily = sorted((fixture.wiki_root / "daily/2026").glob("*.md"))
    assert len(daily) == 299
    assert all(date.fromisoformat(path.stem).year == 2026 for path in daily)
    assert len((fixture.wiki_root / "reference/Large.md").read_bytes()) == 699000


def test_manifest_records_reproducible_owned_files_outside_wiki(tmp_path):
    first = generate_fixture(tmp_path / "first", "representative")
    second = generate_fixture(tmp_path / "second", "representative")
    manifest = json.loads(first.manifest_path.read_text())
    other = json.loads(second.manifest_path.read_text())
    assert not first.manifest_path.is_relative_to(first.wiki_root)
    assert manifest["note_count"] == 1000
    assert manifest["daily_count"] == 299
    assert manifest["files"] == other["files"]
    records = {record["path"]: record for record in manifest["files"]}
    actual = {path.relative_to(first.wiki_root).as_posix(): path
              for path in first.wiki_root.rglob("*") if path.is_file()}
    assert set(records) == set(actual)
    for path, file in actual.items():
        raw = file.read_bytes()
        assert records[path]["bytes"] == len(raw)
        assert records[path]["sha256"] == hashlib.sha256(raw).hexdigest()
    assert manifest["identity_path"] == first.identity_path == "Home.md"
    assert records["Home.md"]["sha256"] == first.identity_sha256


def test_corpus_contains_source_and_metadata_preservation_cases(tmp_path):
    fixture = generate_fixture(tmp_path / "cases", "representative")
    root = fixture.wiki_root
    rich = (root / "notes/Note 0000.md").read_text()
    for token in ["unknown_fixture:", "enabled: true", "count: 7", "ratio: 1.25", "absent: null",
                  'date_text: "2026-01-02"', "aliases:", "tags:", "東京", "café", "- [ ]",
                  "| Column", "  - Nested", "[[notes/Note 0001#synthetic-heading|Synthetic alias]]",
                  "[relative](../reference/Note%200000.md#synthetic-heading)",
                  "![missing](../attachments/missing.png)", "`[[inline-false-positive]]`",
                  "[[fenced-false-positive]]"]:
        assert token in rich
    crlf = (root / "notes/Note 0001.md").read_bytes()
    assert b"\r\n" in crlf and b"\n" not in crlf.replace(b"\r\n", b"")
    assert (root / "notes/Note 0002.md").read_bytes().startswith(b"\xef\xbb\xbf")
    mixed = (root / "notes/Note 0003.md").read_bytes()
    assert b"\r\n" in mixed and b"\n" in mixed.replace(b"\r\n", b"")
    assert not (root / "notes/Note 0004.md").read_bytes().endswith(b"\n")
    assert "broken: [unterminated" in (root / "notes/Note 0005.md").read_text()
    assert "duplicate_key: first\nduplicate_key: second" in (root / "notes/Note 0006.md").read_text()
    counterpart = (root / "notes/Note 0007.md").read_text()
    assert "id: synthetic-duplicate" in rich and "id: synthetic-duplicate" in counterpart
    assert "Shared synthetic alias" in rich and "Shared synthetic alias" in counterpart
    assert (root / "attachments/sample.png").read_bytes().startswith(b"\x89PNG\r\n\x1a\n")
    assert (root / "attachments/sample.pdf").read_bytes().startswith(b"%PDF-1.4")


def test_small_profile_keeps_twelve_notes_and_stable_identity(tmp_path):
    fixture = generate_fixture(tmp_path / "small", "small")
    assert len(list(fixture.wiki_root.rglob("*.md"))) == 12
    original = (fixture.wiki_root / "Home.md").read_bytes()
    assert original == b"# Home\n\nBackstory disposable synthetic storage, version 1.\n"
    note = fixture.wiki_root / "notes/Note 0000.md"
    note.write_bytes(note.read_bytes() + b"\nAn explicit synthetic edit.\n")
    assert (fixture.wiki_root / "Home.md").read_bytes() == original
    assert hashlib.sha256(original).hexdigest() == fixture.identity_sha256


@pytest.mark.parametrize("kind", ["empty", "nonempty", "file", "symlink", "dangling"])
def test_existing_destinations_are_never_reused(tmp_path, kind):
    destination = tmp_path / "existing"
    if kind in {"empty", "nonempty"}:
        destination.mkdir()
        if kind == "nonempty":
            (destination / "keep.txt").write_text("synthetic sentinel")
    elif kind == "file":
        destination.write_text("synthetic sentinel")
    else:
        target = tmp_path / "target"
        if kind == "symlink":
            target.mkdir()
        destination.symlink_to(target, target_is_directory=True)
    with pytest.raises(FileExistsError):
        generate_fixture(destination, "representative")
    assert not (destination / "wiki").exists()
