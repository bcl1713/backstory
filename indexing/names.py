from pathlib import PurePosixPath


def note_names(path, title, ids, aliases):
    path_name = PurePosixPath(path)
    resolvable = {item.casefold() for item in [path, path_name.name, path_name.stem, *ids, *aliases] if item}
    all_names = resolvable | ({title.casefold()} if title else set())
    return [(name, name in resolvable) for name in sorted(all_names)]
