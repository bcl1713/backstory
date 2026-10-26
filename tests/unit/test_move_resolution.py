"""Fresh relocation planning must retain actual link resolution semantics."""
import base64
import os

import pytest

from tests.integration.test_browsing import reader
from tests.integration.test_storage import wiki
from tests.integration.test_relocations import actor
from wiki.contracts import StorageError
from wiki.links import resolve_link
from wiki.relocations import preview_move

pytestmark = pytest.mark.django_db


def output(plan, path):
    change = next(row for row in plan['changes'] if row['path'] == path)
    return base64.b64decode(change['after'])


@pytest.mark.parametrize('blocked_kind', ['symlink', 'fifo'])
def test_denied_wiki_candidate_never_becomes_a_resolved_repaired_link(reader, wiki, blocked_kind):
    (wiki / 'old.md').write_text('# Synthetic\n')
    (wiki / 'Home.md').write_text('[[old|Shown]]\n')
    if blocked_kind == 'symlink':
        (wiki / 'old').symlink_to(wiki / 'old.md')
    else:
        os.mkfifo(wiki / 'old')
    assert resolve_link('Home.md', 'old', 'wiki').state == 'unavailable'
    with pytest.raises(StorageError):
        preview_move(actor(reader), 'old.md', 'new.md')
    assert (wiki / 'Home.md').read_text() == '[[old|Shown]]\n'
    assert not (wiki / 'new.md').exists()


@pytest.mark.parametrize('parent_kind', ['file', 'symlink', 'fifo'])
def test_denied_parent_cannot_fall_through_to_metadata_alias(reader, wiki, parent_kind):
    (wiki / 'old.md').write_text('---\nid: blocked/name\n---\n# Synthetic\n')
    (wiki / 'Home.md').write_text('[[blocked/name|Shown]]\n')
    if parent_kind == 'file':
        (wiki / 'blocked').write_bytes(b'ordinary attachment')
    elif parent_kind == 'symlink':
        (wiki / 'blocked').symlink_to(wiki / 'old.md')
    else:
        os.mkfifo(wiki / 'blocked')
    assert resolve_link('Home.md', 'blocked/name', 'wiki').state == 'unavailable'
    with pytest.raises(StorageError):
        preview_move(actor(reader), 'old.md', 'new.md')
    assert (wiki / 'Home.md').read_text() == '[[blocked/name|Shown]]\n'
    assert not (wiki / 'new.md').exists()


@pytest.mark.parametrize('original', ['[[new]]', '[x](new.md)'])
def test_move_that_would_resolve_a_missing_link_is_refused(reader, wiki, original):
    (wiki / 'old.md').write_text('# Synthetic\n')
    (wiki / 'Home.md').write_text(original)
    with pytest.raises(StorageError, match='link_resolution_changed'):
        preview_move(actor(reader), 'old.md', 'new.md')
    assert (wiki / 'Home.md').read_text() == original
    assert not (wiki / 'new.md').exists()


def test_move_that_would_disambiguate_a_basename_is_refused(reader, wiki):
    for folder in ['a', 'b']:
        (wiki / folder).mkdir()
        (wiki / folder / 'same.md').write_text('# Same\n')
    (wiki / 'Home.md').write_text('[[same|Shown]]')
    with pytest.raises(StorageError, match='link_resolution_changed'):
        preview_move(actor(reader), 'a/same.md', 'a/other.md')
    assert (wiki / 'a/same.md').exists()
    assert not (wiki / 'a/other.md').exists()


def test_new_root_path_cannot_shadow_an_existing_source_relative_link(reader, wiki):
    (wiki / 'folder').mkdir()
    (wiki / 'folder/old.md').write_text('# Original\n')
    (wiki / 'folder/Home.md').write_text('[[old|Keep original]]')
    (wiki / 'incoming.md').write_text('# Incoming\n')
    with pytest.raises(StorageError, match='link_resolution_changed'):
        preview_move(actor(reader), 'incoming.md', 'old.md')
    assert (wiki / 'folder/Home.md').read_text() == '[[old|Keep original]]'


def test_ids_aliases_and_raw_anchors_rewrite_without_frontmatter_changes(reader, wiki):
    original = b'---\r\nid: stable-id\r\naliases: [nickname]\r\n---\r\n# Original\r\n'
    (wiki / 'old.md').write_bytes(original)
    source = b'---\r\ntitle: "[[stable-id]]"\r\n---\r\n[[stable-id#Raw Anchor|Shown]] [[nickname|Alias]]\r\n'
    (wiki / 'Home.md').write_bytes(source)
    plan = preview_move(actor(reader), 'old.md', 'new.md').plan
    assert output(plan, 'Home.md') == source.replace(b'[[stable-id#Raw Anchor|Shown]]', b'[[new#Raw Anchor|Shown]]').replace(b'[[nickname|Alias]]', b'[[new|Alias]]')
    assert not any(row['path'] == 'old.md' for row in plan['changes'])
    assert (wiki / 'old.md').read_bytes() == original


def test_source_move_repairs_reference_destinations_and_keeps_labels(reader, wiki):
    (wiki / 'folder').mkdir()
    (wiki / 'archive').mkdir()
    source = b'[old.md][ref]\r\n\r\n[ref]: old.md#Raw%20Anchor "old.md"\r\n'
    (wiki / 'folder/Home.md').write_bytes(source)
    (wiki / 'folder/old.md').write_text('# Target\n')
    plan = preview_move(actor(reader), 'folder/Home.md', 'archive/Home.md').plan
    assert output(plan, 'folder/Home.md') == source.replace(b'[ref]: old.md', b'[ref]: ../folder/old.md')
