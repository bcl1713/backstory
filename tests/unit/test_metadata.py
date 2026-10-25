import pytest
from wiki import metadata
from wiki.contracts import NoteSnapshot


def snapshot(source):
    return NoteSnapshot('folder/fallback.md', source, source.encode(), '"revision"', False, '\n')


def test_projection_retains_types_unknown_fields_and_names():
    project = getattr(metadata, 'project_note', None)
    assert project is not None, 'typed note projection is missing'
    source = '---\ntitle: Café\nid: key\naliases: [Other, More]\ntags: [one]\nunknown: {nested: [true, 1, null, "1"]}\ndate: 2026-10-25\n---\n# Heading\n[[Target|label]]'
    note = project(snapshot(source))
    assert note.title == 'Café' and note.ids == ('key',) and note.aliases == ('Other', 'More')
    assert note.tags == ('one',) and note.revision == '"revision"'
    assert note.typed_metadata == metadata.parse_front_matter(source).tree
    assert len(note.edges) == 1 and not note.diagnostics


@pytest.mark.parametrize('yaml,code', [('x: [', 'metadata_parse_error'), ('x: 1\nx: 2', 'metadata_duplicate_key'), ('x: &a [*a]', 'metadata_cycle'), ('x: !!python/object:unsafe {}', 'metadata_unsupported_tag'), ('x: ' + 'a' * (256 * 1024), 'metadata_size_limit')])
def test_projection_failure_keeps_body_and_title_available(yaml, code):
    project = getattr(metadata, 'project_note', None)
    assert project is not None, 'typed note projection is missing'
    source = '---\n' + yaml + '\n---\n# Available\n[[Target]]'
    note = project(snapshot(source))
    assert note.title == 'Available' and note.body.endswith('[[Target]]')
    assert note.diagnostics[0].code == code
    assert note.edges[0].target == 'Target'
