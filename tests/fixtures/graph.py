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
