import pytest
from tests.integration.test_storage import wiki
from wiki.formatting import format_source, compare_preservation


@pytest.mark.parametrize('configured', [False, True])
def test_real_corpus_features_preserve_types_destinations_and_fixed_point(wiki, configured):
    if configured:
        (wiki / '.prettierrc').write_text('{"proseWrap":"preserve","printWidth":100}')
        (wiki / '.markdownlint-cli2.jsonc').write_text('{"config":{"MD013":false}}')
    source = '---\ntitle: Café\nunknown: {nested: [1, true, null, "1", 1.5]}\ndate: "2026-10-25"\naliases: [Other]\n---\n# Café\n\n[[Other|label]] [relative](../Other.md#heading) ![missing](absent.png)\n\n| a | b |\n| - | - |\n| x | y |\n\n- [ ] task\n  - nested\n\n```md\n[[literal]]\n```\n'
    first = format_source('notes/corpus.md', source, None)
    assert first.outcome == 'ok' and not compare_preservation(source, first.source)
    second = format_source('notes/corpus.md', first.source, None)
    assert second.outcome == 'ok' and second.source == first.source


def test_malformed_corpus_recovers_exact_source(wiki):
    source = '---\nbroken: [\n---\n# Café\r\n[[Other]]\n'
    result = format_source('note.md', source, None)
    assert result.outcome == 'failed' and result.source == source
    assert result.diagnostics[0].line == 3


@pytest.mark.parametrize('configured', [False, True])
def test_generated_representative_samples_real_helper(tmp_path, settings, configured):
    from tests.fixtures.generate import generate_fixture
    from wiki.storage import read_note
    from wiki.metadata import project_note
    fixture = generate_fixture(tmp_path / 'corpus', 'representative')
    settings.BACKSTORY_WIKI_ROOT = fixture.wiki_root
    settings.BACKSTORY_DATA_DIR = fixture.data_dir
    settings.BACKSTORY_IDENTITY_PATH = fixture.identity_path
    if configured:
        (fixture.wiki_root / '.prettierrc').write_text('{"printWidth":96,"proseWrap":"always"}')
        (fixture.wiki_root / '.markdownlint-cli2.jsonc').write_text('{"config":{"MD013":false}}')
    for index in [0, 1, 2, 3, 4, 5, 6, 8, 9, 10]:
        path = f'notes/Note {index:04}.md'
        snapshot = read_note(path)
        projection = project_note(snapshot)
        assert projection.path == path and projection.title
        assert all('false-positive' not in edge.target for edge in projection.edges)
        result = format_source(path, snapshot.source, snapshot)
        if index in {5, 6, 8, 9, 10}:
            assert result.outcome == 'failed' and result.source == snapshot.source and result.diagnostics
        else:
            assert result.outcome == 'ok' and not compare_preservation(snapshot.source, result.source)
            again = format_source(path, result.source, snapshot)
            assert again.outcome == 'ok' and again.source == result.source
        assert read_note(path).raw_bytes == snapshot.raw_bytes
    large = read_note('reference/Large.md')
    assert len(large.raw_bytes) == 699000 and project_note(large).title
