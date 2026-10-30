"""Bounded YAML node projection. Never construct objects or serialize note text."""
from dataclasses import dataclass

import yaml
from yaml.events import AliasEvent, CollectionStartEvent, CollectionEndEvent
from yaml.nodes import ScalarNode, SequenceNode, MappingNode

from .contracts import Diagnostic

_PREFIX = "tag:yaml.org,2002:"
_TAGS = {_PREFIX + name for name in ("str", "null", "bool", "int", "float", "seq", "map")}


class RestrictedLoader(yaml.SafeLoader):
    pass


RestrictedLoader.yaml_implicit_resolvers = {
    key: [(tag, pattern) for tag, pattern in values if tag != _PREFIX + "timestamp"]
    for key, values in yaml.SafeLoader.yaml_implicit_resolvers.items()
}


class MetadataError(ValueError):
    def __init__(self, code, line=None, column=None):
        self.diagnostic = Diagnostic(code, "Front matter cannot be safely compared.", line=line, column=column)
        super().__init__(code)


def yaml_tree(text, *, max_bytes=256 * 1024):
    """Return hashable typed nodes, retaining scalar tags and mapping keys."""
    if len(text.encode("utf-8")) > max_bytes:
        raise MetadataError("metadata_size_limit")
    try:
        depth = aliases = events = 0
        for event in yaml.parse(text, Loader=RestrictedLoader):
            events += 1
            aliases += isinstance(event, AliasEvent)
            if isinstance(event, CollectionStartEvent):
                depth += 1
            if depth > 32 or aliases > 50 or events > 50000:
                raise MetadataError("metadata_structure_limit")
            if isinstance(event, CollectionEndEvent):
                depth -= 1
        root = yaml.compose(text, Loader=RestrictedLoader)
        active = set()
        visited = 0

        def project(node, depth=0):
            nonlocal visited
            visited += 1
            if depth > 32 or visited > 50000:
                raise MetadataError("metadata_structure_limit")
            if id(node) in active:
                raise MetadataError("metadata_cycle")
            if node.tag not in _TAGS:
                raise MetadataError("metadata_unsupported_tag", node.start_mark.line + 1, node.start_mark.column + 1)
            if isinstance(node, ScalarNode):
                return ("scalar", node.tag, node.value)
            active.add(id(node))
            try:
                if isinstance(node, SequenceNode):
                    return ("sequence", tuple(project(child, depth + 1) for child in node.value))
                if not isinstance(node, MappingNode):
                    raise MetadataError("metadata_unsupported_node")
                pairs = []
                keys = set()
                for key, value in node.value:
                    projected_key = project(key, depth + 1)
                    if projected_key[0] != "scalar":
                        raise MetadataError("metadata_unsupported_key")
                    if projected_key in keys:
                        raise MetadataError("metadata_duplicate_key", key.start_mark.line + 1, key.start_mark.column + 1)
                    keys.add(projected_key)
                    pairs.append((projected_key, project(value, depth + 1)))
                return ("mapping", frozenset(pairs))
            finally:
                active.remove(id(node))

        return project(root) if root else None
    except yaml.YAMLError as error:
        mark = getattr(error, "problem_mark", None)
        raise MetadataError("metadata_parse_error", mark.line + 1 if mark else None, mark.column + 1 if mark else None) from None


def yaml_data(text, *, max_bytes=65536):
    """Data-only config conversion from the same restricted nodes."""
    def convert(tree):
        if tree is None:
            return None
        if tree[0] == "sequence":
            return [convert(item) for item in tree[1]]
        if tree[0] == "mapping":
            result = {}
            for key, value in tree[1]:
                if key[1] != _PREFIX + "str":
                    raise MetadataError("metadata_unsupported_key")
                result[key[2]] = convert(value)
            return result
        _, tag, value = tree
        if tag == _PREFIX + "str":
            return value
        if tag == _PREFIX + "null":
            return None
        if tag == _PREFIX + "bool":
            return value.lower() in {"true", "yes", "on"}
        # Only references are consumed here; preserve numbers as plain values.
        return value
    return convert(yaml_tree(text, max_bytes=max_bytes))


@dataclass(frozen=True)
class FrontMatter:
    tree: object
    body: str
    present: bool


def parse_front_matter(source):
    text = source.removeprefix("\ufeff")
    lines = text.splitlines(keepends=True)
    if not lines or lines[0].rstrip("\r\n") != "---":
        return FrontMatter(None, text, False)
    length = 0
    for index, line in enumerate(lines[1:], 1):
        length += len(line.encode("utf-8"))
        if length > 256 * 1024:
            raise MetadataError("metadata_size_limit")
        if line.rstrip("\r\n") in {"---", "..."}:
            try:
                tree = yaml_tree("".join(lines[1:index]))
            except MetadataError as error:
                diagnostic = error.diagnostic
                raise MetadataError(diagnostic.code, diagnostic.line + 1 if diagnostic.line else None, diagnostic.column) from None
            return FrontMatter(tree, "".join(lines[index + 1:]), True)
    raise MetadataError("metadata_unclosed")


@dataclass(frozen=True)
class ProjectionFailure:
    """Safe categories only: never store exception text or source snippets."""
    phase: str
    reason: str


@dataclass(frozen=True)
class NoteProjection:
    path: str
    revision: str
    title: str
    ids: tuple[str, ...]
    aliases: tuple[str, ...]
    tags: tuple[str, ...]
    typed_metadata: object
    edges: tuple
    diagnostics: tuple
    body: str
    projection_failure: ProjectionFailure | None = None


def project_note(snapshot):
    """Disposable projection only: no serializer, constructors or save path."""
    from pathlib import PurePosixPath
    from .links import LinkStructureLimit, extract_links
    from .markdown import _parser, _plain_heading
    diagnostics = []
    tree = None
    body = snapshot.source.removeprefix('\ufeff')
    try:
        matter = parse_front_matter(snapshot.source)
        tree, body = matter.tree, matter.body
    except MetadataError as error:
        diagnostics.append(error.diagnostic)
        # Locate a closing delimiter independently of YAML parse/size success.
        lines = body.splitlines(keepends=True)
        for index, line in enumerate(lines[1:], 1):
            if line.rstrip('\r\n') in {'---', '...'}:
                body = ''.join(lines[index + 1:])
                break
    values = {}
    if tree and tree[0] == 'mapping':
        values = {key[2]: value for key, value in tree[1] if key[1] == _PREFIX + 'str'}

    def strings(name):
        node = values.get(name)
        nodes = node[1] if node and node[0] == 'sequence' else [node]
        return tuple(value[2] for value in nodes if value and value[0] == 'scalar' and value[1] == _PREFIX + 'str')

    title = next(iter(strings('title')), '')
    failure = None
    phase = 'title'
    try:
        if not title:
            tokens = _parser().parse(body, {})
            for index, token in enumerate(tokens[:-1]):
                if token.type == 'heading_open':
                    title = _plain_heading(tokens[index + 1].children or [])
                    break
        phase = 'links'
        edges = tuple(extract_links(body))
        offset = snapshot.source.count('\n') - body.count('\n')
        from dataclasses import replace
        edges = tuple(replace(edge, position=(edge.position[0] + offset, edge.position[1])) for edge in edges)
    except (ValueError, RecursionError) as error:
        reason = ('link_structure_limit' if isinstance(error, LinkStructureLimit)
                  else 'projection_recursion_limit' if isinstance(error, RecursionError)
                  else 'projection_parse_failed')
        failure = ProjectionFailure(phase, reason)
        edges = ()
        diagnostics.append(Diagnostic('projection_parse_failed', 'Body projection unavailable. Source remains available.'))
    return NoteProjection(snapshot.path, snapshot.revision, title or PurePosixPath(snapshot.path).stem,
                          strings('id') + strings('ids'), strings('aliases') + strings('alias'),
                          strings('tags'), tree, edges, tuple(diagnostics), body, failure)
