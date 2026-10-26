"""Repairs touch parser-recognized destination spans, preserving source bytes."""
import posixpath
from urllib.parse import unquote, urlsplit

import pytest

from wiki.contracts import StorageError


def resolver(paths):
    def resolve(source, target, kind):
        raw = target.partition('|')[0]
        if kind == 'markdown':
            parsed = urlsplit(raw)
            if parsed.scheme or parsed.netloc:
                return None
            raw = unquote(parsed.path)
        else:
            raw = raw.partition('#')[0]
        if not raw:
            return source
        relative = posixpath.normpath(posixpath.join(posixpath.dirname(source), raw))
        for base in ([posixpath.normpath(raw), relative] if kind == 'wiki' else [relative]):
            for candidate in ([base, base + '.md'] if kind == 'wiki' else [base]):
                if candidate in paths:
                    return candidate
        return None
    return resolve


def rewrite(source, old='note.md', new='note.md', moved=None, paths=()):
    from wiki.relocation_links import rewrite_links
    return rewrite_links(source, old, new, moved or {'old.md': 'new.md'}, resolver(paths or {'old.md', old}))


def test_repairs_only_syntactic_links_and_retains_alias_anchor_and_prose():
    source = ('---\r\ntitle: "[[old]]"\r\n---\r\n'
              'old.md [[old#Raw Anchor|shown]] [shown](old.md#Raw%20Anchor "title")\r\n'
              '`[[old]] [shown](old.md)` \\[[old]] \\[shown](old.md)\r\n'
              '```markdown\r\n[[old]] [shown](old.md)\r\n```\r\n')
    expected = source.replace('[[old#Raw Anchor|shown]]', '[[new#Raw Anchor|shown]]').replace('(old.md#Raw%20Anchor "title")', '(new.md#Raw%20Anchor "title")')
    updated, changes = rewrite(source)
    assert updated == expected
    assert len(changes) == 2
    assert all(change['position'][0] == 4 for change in changes)


def test_moved_source_recomputes_outgoing_assets_and_keeps_unrelated_links():
    source = '![pic](img/a%20b.png) [self](#here) [[keep]] [remote](https://example.test/old.md) [missing](missing.md)\n'
    updated, changes = rewrite(source, 'folder/note.md', 'other/note.md', {'folder/note.md': 'other/note.md'}, {'folder/note.md', 'folder/img/a b.png', 'keep.md'})
    assert updated == source.replace('img/a%20b.png', '../folder/img/a%20b.png')
    assert len(changes) == 1


@pytest.mark.parametrize('source,expected', [
    ('[x](old(1).md)', '[x](new%281%29.md)'),
    ('[x](old\\(1\\).md)', '[x](new%281%29.md)'),
    ('[x](<old(1).md> "title")', '[x](<new%281%29.md> "title")'),
    ('> [x](\n>   old(1).md\n>   "title"\n> )\n', '> [x](\n>   new%281%29.md\n>   "title"\n> )\n'),
    ('[x][ref]\n\n[ref]:\n  old(1).md\n  "title"\n', '[x][ref]\n\n[ref]:\n  new%281%29.md\n  "title"\n'),
    ('![ref][]\n\n[ref]: <old(1).md>\n', '![ref][]\n\n[ref]: <new%281%29.md>\n'),
])
def test_balanced_escaped_multiline_and_reference_destinations(source, expected):
    updated, changes = rewrite(source, moved={'old(1).md': 'new(1).md'}, paths={'old(1).md'})
    assert updated == expected
    assert len(changes) == 1


def test_reference_position_points_at_definition_destination():
    source = '[old.md][ref]\r\n\r\n[ref]: old.md "old.md"\r\n'
    updated, changes = rewrite(source)
    assert updated == source.replace('[ref]: old.md', '[ref]: new.md')
    assert changes[0]['position'] == (3, 8)


def test_storage_errors_from_resolution_propagate():
    from wiki.relocation_links import rewrite_links
    def unavailable(*args):
        raise StorageError('storage_unavailable', 503)
    with pytest.raises(StorageError, match='storage_unavailable'):
        rewrite_links('[[old]]', 'note.md', 'note.md', {'old.md': 'new.md'}, unavailable)


def test_percent_literal_wiki_and_once_encoded_markdown():
    source = '[[100%#raw|a]] [x](100%25.md#raw%20anchor)\n'
    updated, _ = rewrite(source, moved={'100%.md': 'folder/200%.md'}, paths={'100%.md'})
    assert updated == '[[folder/200%#raw|a]] [x](folder/200%25.md#raw%20anchor)\n'


def test_repeated_table_cells_have_distinct_spans():
    source = '| A | B |\n| - | - |\n| [x](old.md) | [x](old.md) |\n'
    updated, changes = rewrite(source)
    assert updated == source.replace('(old.md)', '(new.md)')
    assert len(changes) == 2
    assert changes[0]['position'] != changes[1]['position']


@pytest.mark.parametrize('fragment', ['#raw%20Anchor', '\\#raw', '&#35;raw', '&num;raw', '&#x23;raw'])
def test_markdown_raw_fragment_spelling_is_preserved(fragment):
    source = '[x](old.md' + fragment + ')'
    updated, _ = rewrite(source)
    assert updated == '[x](new.md' + fragment + ')'


def test_relative_wiki_link_is_repaired_after_source_move():
    source = '[[near#raw|shown]] [[root|root]]'
    updated, changes = rewrite(source, 'folder/note.md', 'elsewhere/note.md', {'folder/note.md': 'elsewhere/note.md'}, {'folder/near.md', 'root.md'})
    assert updated == '[[folder/near#raw|shown]] [[root|root]]'
    assert len(changes) == 1


def test_unsafe_wiki_destination_blocks_instead_of_corrupting_syntax():
    with pytest.raises(StorageError, match='unsupported_link_rewrite'):
        rewrite('[[old|label]]', moved={'old.md': 'new#name.md'})


def test_unmappable_required_span_blocks_and_unrelated_spans_remain_untouched():
    # GFM removes the table cell escape before passing source to inline rules.
    source = '| Header |\n| - |\n| [a\\|b](old.md) |\n'
    with pytest.raises(StorageError, match='unsupported_link_rewrite'):
        rewrite(source)
    updated, changes = rewrite(source, moved={'elsewhere.md': 'new.md'})
    assert updated == source
    assert changes == []


def test_omitted_wiki_extension_is_retained_only_without_shadowing():
    updated, _ = rewrite('[[old]]', paths={'old.md', 'new'})
    assert updated == '[[new.md]]'


def test_source_move_that_preserves_relative_meaning_keeps_destination_bytes():
    source = '[x](./old%2emd#raw)'
    updated, changes = rewrite(source, 'folder/note.md', 'moved/note.md', {'folder/old.md': 'moved/old.md'}, {'folder/old.md'})
    assert updated == source
    assert changes == []


def test_uppercase_markdown_extension_cannot_use_lowercase_optional_lookup():
    updated, _ = rewrite('[[old]]', moved={'old.md': 'new.MD'})
    assert updated == '[[new.MD]]'
