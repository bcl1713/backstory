"""Public synthetic relationship corpora; refuses existing destinations."""
from pathlib import Path


def generate_graph_fixture(destination, count=100):
    if type(count) is not int or not 12 <= count <= 10000:
        raise ValueError('Graph fixture size must be 12–10000 notes')
    root = Path(destination)
    root.mkdir(parents=True, exist_ok=False)
    wiki = root / 'wiki'
    wiki.mkdir()
    (wiki / '.backstory-marker').touch()
    (root / 'data').mkdir()
    for index in range(count):
        neighbors = set()
        # Two dense triangles with a single bridge, then a chain, a hub and
        # isolated notes. Remaining notes form small explicit-link groups.
        if index < 6:
            group = range(0, 3) if index < 3 else range(3, 6)
            neighbors.update(n for n in group if n != index)
            if index == 2:
                neighbors.add(3)
        elif 6 <= index < 9:
            neighbors.add(index + 1)
        elif index == 9:
            neighbors.update(range(12, min(count, 112)))
        elif index >= 12:
            start = index // 10 * 10
            neighbors.update(n for n in (index + 1, index + 2) if n < min(count, start + 10))
        source = f'---\ntags: [synthetic, group-{index // 10}]\n---\n# Synthetic graph note {index:05}\n\n'
        source += '\n'.join(f'[[n{n:05}.md]]' for n in sorted(neighbors)) + '\n'
        (wiki / f'n{index:05}.md').write_text(source)
    return wiki, root / 'data'


def populate_two_hop_hub(wiki):
    """93 members / 278 pairs plus a raw-heavy final layer, in synthetic storage."""
    from indexing.models import IndexedNote, LinkEdge, RelationState, ResolvedRelation
    from indexing.queue import request_scan
    from indexing.worker import run_batch

    files = {'Population Root.md': ' '.join(f'[[branch{i}]]' for i in range(7))}
    files.update({f'branch{i}.md': ' '.join(f'[[leaf{j:02}]]' for j in range(i, 85, 7))
                  for i in range(7)})
    files.update({f'leaf{i:02}.md': '[[Population Root]] [[branch0]]'
                  + (' [[branch1]]' if i < 16 else '') for i in range(85)})
    files['outside.md'] = '# Outside'
    for path, source in files.items():
        (Path(wiki) / path).write_text(source)
    request_scan('verify')
    for tick in range(4000):
        if not run_batch(now=10000000000 + tick).pending:
            break
    else:
        raise RuntimeError('Synthetic population fixture did not finish indexing')
    # Repeated occurrences use the real worker schema, bypassing repetitive
    # resolver work. This fixture measures graph reads, not index ingestion.
    state = RelationState.objects.get(generation__state='active')
    source = IndexedNote.objects.get(generation=state.generation, path='leaf84.md')
    raw = LinkEdge.objects.bulk_create([
        LinkEdge(note=source, target='outside', kind='wiki', position=[1, 1]) for _ in range(12000)])
    ResolvedRelation.objects.bulk_create([
        ResolvedRelation(occurrence=edge, generation=state.generation, epoch=state.epoch,
                         source=source.path, destination='outside.md', state='resolved', resource_type='note')
        for edge in raw])
