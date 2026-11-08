"""Synthetic traversal checks: bounded work, linear enumeration, safe resume."""
import copy

import pytest

from tests.integration.test_storage import wiki
from wiki.contracts import StorageError


def count_entries(monkeypatch):
    from indexing import scanner
    original = scanner.os.scandir
    counts = {'entries': 0, 'opened': 0, 'closed': 0}

    class Counted:
        def __init__(self, descriptor):
            self.iterator = original(descriptor)
            counts['opened'] += 1
            self.closed = False

        def __iter__(self):
            return self

        def __next__(self):
            item = next(self.iterator)
            counts['entries'] += 1
            return item

        def close(self):
            if not self.closed:
                self.closed = True
                self.iterator.close()
                counts['closed'] += 1

        def __enter__(self):
            return self

        def __exit__(self, *args):
            self.close()

    monkeypatch.setattr(scanner.os, 'scandir', Counted)
    return counts


def test_wide_directory_enumerates_each_entry_once(wiki, monkeypatch):
    from indexing import scanner
    for number in range(101):
        (wiki / f'note-{number}.md').write_text('# Synthetic')
    counts = count_entries(monkeypatch)
    checkpoint = {'token': 'wide-synthetic'}
    paths = []
    for _ in range(100):
        batch, complete = scanner.next_paths(checkpoint, limit=7, entry_limit=9)
        paths.extend(batch)
        if complete:
            break
    assert complete
    assert len(paths) == len(set(paths)) == 101
    assert counts['entries'] == 102  # Notes plus excluded identity marker.
    assert counts['closed'] == counts['opened']


def test_lost_cursor_replay_obeys_entry_budget(wiki, monkeypatch):
    from indexing import scanner
    for number in range(40):
        (wiki / f'note-{number}.md').write_text('# Synthetic')
    checkpoint = {'token': 'restart-synthetic'}
    first, complete = scanner.next_paths(checkpoint, limit=30, entry_limit=35)
    assert len(first) == 30 and not complete
    scanner.clear_cursors()
    checkpoint = copy.deepcopy(checkpoint)  # Simulate a persisted restart.
    counts = count_entries(monkeypatch)
    paths = first[:]
    for _ in range(100):
        before = counts['entries']
        batch, complete = scanner.next_paths(checkpoint, limit=3, entry_limit=5)
        assert counts['entries'] - before <= 5
        paths.extend(batch)
        if complete:
            break
    assert complete
    assert len(paths) == len(set(paths)) == 40
    assert counts['closed'] == counts['opened']


def test_changed_directory_cannot_complete_retained_cursor(wiki):
    from indexing import scanner
    (wiki / 'first.md').write_text('# First')
    (wiki / 'second.md').write_text('# Second')
    checkpoint = {'token': 'change-synthetic'}
    assert not scanner.next_paths(checkpoint, limit=1)[1]
    (wiki / 'new.md').write_text('# New')
    with pytest.raises(StorageError, match='scan_directory_changed'):
        scanner.next_paths(checkpoint, limit=20)


def test_deep_walk_bounds_open_iterators_and_returns_every_note(wiki, monkeypatch):
    from indexing import scanner
    directory = wiki
    for _ in range(45):
        (directory / 'note.md').write_text('# Synthetic')
        directory = directory / 'd'
        directory.mkdir()
    counts = count_entries(monkeypatch)
    checkpoint = {'token': 'deep-synthetic'}
    paths = []
    for _ in range(1000):
        batch, complete = scanner.next_paths(checkpoint, limit=1, entry_limit=5)
        paths.extend(batch)
        assert counts['opened'] - counts['closed'] <= 32
        if complete:
            break
    assert complete
    assert len(paths) == len(set(paths)) == 45
    assert counts['closed'] == counts['opened']
