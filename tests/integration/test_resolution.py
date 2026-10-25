import pytest
from tests.integration.test_storage import wiki
from tests.integration.test_indexing import drain
from wiki.links import resolve_link

pytestmark = pytest.mark.django_db(transaction=True)


def build(wiki, files):
    from indexing import worker
    for path, source in files.items():
        target = wiki / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(source)
    drain(worker)


def test_wiki_root_relative_identifier_alias_basename_precedence(wiki):
    build(wiki, {'target.md': '# Root', 'folder/target.md': '# Relative', 'folder/source.md': '# Source',
                 'deep/named.md': '---\nid: custom-id\naliases: [Friendly]\n---\n# Named'})
    assert resolve_link('folder/source.md', 'target', 'wiki').href == '/notes/target.md'
    (wiki / 'target.md').unlink()
    assert resolve_link('folder/source.md', 'target', 'wiki').href == '/notes/folder/target.md'
    for name in ['custom-id', 'Friendly', 'named', 'named.md']:
        result = resolve_link('folder/source.md', name, 'wiki')
        assert result.state == 'resolved' and result.href == '/notes/deep/named.md'
    assert resolve_link('folder/source.md', 'Friendly', 'markdown').state == 'missing'


def test_duplicates_never_arbitrary_and_excluded_candidates_do_not_disclose(wiki, settings):
    build(wiki, {'source.md': '# Source', 'a/one.md': '---\nid: shared\naliases: [Alias]\n---\n# One',
                 'b/one.md': '---\nid: shared\naliases: [Alias]\n---\n# Two'})
    for name in ['shared', 'Alias', 'one']:
        assert resolve_link('source.md', name, 'wiki').state == 'ambiguous'
    settings.BACKSTORY_EXCLUSIONS = ['b/**']
    assert resolve_link('source.md', 'shared', 'wiki').href == '/notes/a/one.md'
    settings.BACKSTORY_EXCLUSIONS = ['a/**', 'b/**']
    assert resolve_link('source.md', 'shared', 'wiki').state == 'missing'
    assert resolve_link('source.md', 'a/one.md', 'wiki').state == 'missing'


def test_markdown_relative_unicode_percent_fragments_and_code_literals(wiki):
    build(wiki, {'folder/source.md': '# Source', 'space café%.md': '# **Café** heading\n\n# Café heading\n',
                 'folder/relative.md': '# Relative'})
    result = resolve_link('folder/source.md', '../space%20caf%C3%A9%25.md#Café%20heading-1', 'markdown')
    assert result.state == 'resolved' and 'preview-caf%C3%A9-heading-1' in result.href
    assert resolve_link('folder/source.md', '../space café%.md#Café heading', 'wiki').state == 'resolved'
    assert resolve_link('folder/source.md', '../outside/../../escape.md', 'markdown').state == 'missing'
    from wiki.markdown import render_preview
    preview = render_preview('# **Café** heading\n\n# Café heading\n\n`[[shared]]`\n\n```\n[[Alias]]\n```', 'folder/source.md')
    assert 'id="preview-café-heading"' in preview.html and 'id="preview-café-heading-1"' in preview.html
    assert 'link-ambiguous' not in preview.html


def test_partial_index_never_resolves_identifier_arbitrarily(wiki):
    from indexing import worker
    from indexing.queue import request_scan
    build(wiki, {'source.md': '# Source', 'one.md': '---\nid: unique-id\n---\n# One'})
    request_scan('rebuild')
    (wiki / 'two.md').write_text('---\nid: unique-id\n---\n# Two')
    worker.run_batch()
    assert resolve_link('source.md', 'unique-id', 'wiki').state == 'unavailable'


def test_excluded_root_is_missing_for_precedence_and_identifier_names_are_not_paths(wiki, settings):
    build(wiki, {'target.md': '# Excluded root', 'folder/source.md': '# Source',
                 'folder/target.md': '# Allowed relative', 'deep/identified.md': '---\nid: key\n---\n# Identified'})
    settings.BACKSTORY_EXCLUSIONS = ['target.md']
    assert resolve_link('folder/source.md', 'target', 'wiki').href == '/notes/folder/target.md'
    assert resolve_link('folder/source.md', 'key', 'wiki').href == '/notes/deep/identified.md'
