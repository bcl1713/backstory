from wiki import links


def test_syntax_edges_ignore_code_and_keep_spelling_and_positions():
    extract = getattr(links, 'extract_links', None)
    assert extract is not None, 'syntax edge extraction is missing'
    source = '# Heading\n\n[[Café%20 name#Part|label]] [link](a%20b.md#x)\n`[[Fake]] [fake](no.md)`\n\n```md\n[[Fake]]\n```\n'
    edges = extract(source)
    assert [(e.target, e.kind, e.fragment) for e in edges] == [('Café%20 name', 'wiki', 'Part'), ('a%20b.md', 'markdown', 'x')]
    assert all(e.position[0] == 3 and e.position[1] >= 1 for e in edges)


def test_occurrence_classification_keeps_markdown_syntax_and_advisory_positions():
    edges = links.extract_links('[note][ref] ![image](picture.png) [[Target#Part]]\n\n[ref]: Other.md\n')
    assert [(e.kind, e.occurrence_kind) for e in edges] == [
        ('markdown', 'link'), ('markdown', 'image'), ('wiki', 'link')]
    assert all(e.position_precision == 'advisory' for e in edges)
