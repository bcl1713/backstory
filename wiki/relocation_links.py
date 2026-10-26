"""Repair parsed destination spans without serializing Markdown source.

The CommonMark rules decide which syntax is a link. Their destination helper
provides the exact spelling and bounds; line maps recover offsets after block
prefixes and newline normalization. Only proven contiguous spans are edited.
"""
from bisect import bisect_right
from dataclasses import dataclass
import posixpath
import re
from types import SimpleNamespace
from urllib.parse import quote, unquote, urlsplit

from markdown_it.common.utils import unescapeAll

from .contracts import StorageError
from .markdown import _parser


@dataclass
class _Destination:
    raw: str
    target: str
    kind: str
    offsets: list[int] | None


def _body_source(source):
    """Hide YAML front matter from the Markdown parser, keeping all offsets."""
    lines = source.splitlines(keepends=True)
    if not lines or lines[0].removeprefix('\ufeff').strip() != '---':
        return source
    for index in range(1, len(lines)):
        if lines[index].strip() in {'---', '...'}:
            prefix = ''.join(lines[:index + 1])
            return re.sub(r'[^\r\n]', ' ', prefix) + ''.join(lines[index + 1:])
    # An unterminated front matter region has no safely identifiable body.
    return re.sub(r'[^\r\n]', ' ', source)


def _destinations(source):
    parser = _parser()
    parser.validateLink = lambda value: True
    # Helpers are normally a shared module. Give this parser its own namespace.
    parser.helpers = SimpleNamespace(**vars(parser.helpers))
    original_destination = parser.helpers.parseLinkDestination
    destinations = []
    contexts = []
    normalized = []
    original_offsets = []
    index = 0
    while index < len(source):
        char = source[index]
        normalized.append('\n' if char == '\r' else '\ufffd' if char == '\0' else char)
        original_offsets.append(index)
        index += 2 if char == '\r' and source[index:index + 2] == '\r\n' else 1
    text = ''.join(normalized)
    lines = text.splitlines(keepends=True)
    line_offsets = []
    cursor = 0
    for line in lines:
        line_offsets.append(cursor)
        cursor += len(line)
    used = {}
    root = {'content': '', 'offsets': None}

    def map_content(content, start, end, *, consume=False):
        """Align parser lines with their original lines, including block prefixes."""
        result = []
        next_line = start
        for part in content.splitlines(keepends=True):
            value = part.removesuffix('\n')
            found = False
            for number in range(next_line, min(end, len(lines))):
                offset = lines[number].find(value, used.get(number, 0) if consume else 0)
                if offset < 0:
                    continue
                result.extend(line_offsets[number] + offset + char for char in range(len(value)))
                if part.endswith('\n'):
                    result.append(line_offsets[number] + len(lines[number]) - 1)
                if consume:
                    used[number] = offset + len(value)
                next_line = number + 1
                found = True
                break
            if not found:
                return None
        return result if len(result) == len(content) else None

    def inline_map(content):
        for context in reversed(contexts):
            if context['type'] != 'inline':
                continue
            if content == context['src']:
                return context['offsets']
            offset = context['src'].find(content, context['start'])
            if offset >= 0 and context['offsets'] is not None:
                return context['offsets'][offset:offset + len(content)]
        if content == root['content']:
            return root['offsets']
        return None

    def destination(value, start, maximum):
        result = original_destination(value, start, maximum)
        if result.ok and contexts:
            context = contexts[-1]
            first, last = start, result.pos
            if value[first:first + 1] == '<':
                first += 1
                last -= 1
            if context['type'] == 'block':
                offsets = map_content(value, context['start'], context['end'])
            else:
                offsets = inline_map(value)
            context['events'].append(_Destination(
                value[first:last], parser.normalizeLink(result.str), 'markdown',
                offsets[first:last] if offsets is not None else None,
            ))
        return result

    parser.helpers.parseLinkDestination = destination

    def wrap_inline(rule, *, wiki=False):
        def wrapped(state, silent):
            start = state.pos
            offsets = inline_map(state.src)
            context = {'type': 'inline', 'src': state.src, 'start': start,
                       'offsets': offsets, 'events': []}
            contexts.append(context)
            try:
                success = rule(state, silent)
            finally:
                contexts.pop()
            if success and not silent:
                if wiki:
                    first, last = start + 2, state.pos - 2
                    raw = state.src[first:last]
                    destinations.append(_Destination(raw, raw, 'wiki', offsets[first:last] if offsets is not None else None))
                else:
                    destinations.extend(context['events'])
            return success
        return wrapped

    for name in ('link', 'image', 'wiki_link'):
        rule = next(rule.fn for rule in parser.inline.ruler.__rules__ if rule.name == name)
        parser.inline.ruler.at(name, wrap_inline(rule, wiki=name == 'wiki_link'))

    reference_rule = next(rule.fn for rule in parser.block.ruler.__rules__ if rule.name == 'reference')

    def reference(state, start, end, silent):
        context = {'type': 'block', 'start': start, 'end': end, 'events': []}
        contexts.append(context)
        try:
            success = reference_rule(state, start, end, silent)
        finally:
            contexts.pop()
        if success and not silent:
            destinations.extend(context['events'])
        return success

    parser.block.ruler.at('reference', reference)

    def inline(state):
        for token in state.tokens:
            if token.type != 'inline':
                continue
            root['content'] = token.content
            root['offsets'] = map_content(token.content, *token.map, consume=True) if token.map else None
            if token.children is None:
                token.children = []
            state.md.inline.parse(token.content, state.md, state.env, token.children)

    parser.core.ruler.at('inline', inline)
    parser.parse(_body_source(source), {})
    for item in destinations:
        if item.offsets is not None:
            item.offsets = [original_offsets[offset] for offset in item.offsets]
    return destinations


def _raw_fragment(raw):
    # CommonMark decodes entities and punctuation escapes before URL parsing.
    # Keep the entire raw spelling of the fragment marker as well as its text.
    for token in re.finditer(r'\\.|&(?:#[xX][0-9a-fA-F]+|#[0-9]+|[a-zA-Z][a-zA-Z0-9]+);|.', raw, re.S):
        if unescapeAll(token.group()) == '#':
            return raw[token.start():]
    return ''


def _replacement(item, old_path, new_path, relocated, resolve):
    target = resolve(old_path, item.target, item.kind)
    if target is None:
        return None
    expected = relocated.get(target, target)
    if item.kind == 'wiki':
        raw_path, anchor, fragment = item.raw.partition('|')[0].partition('#')
        alias = item.raw[len(item.raw.partition('|')[0]):]
        if not raw_path:
            return None
        if target == expected and (old_path == new_path or resolve(new_path, item.target, 'wiki') == expected):
            return None
        path = expected
        if not raw_path.lower().endswith('.md') and path.endswith('.md'):
            omitted = path[:-3]
            collision = resolve(new_path, omitted, 'wiki')
            if collision is None or relocated.get(collision, collision) == expected:
                path = omitted
        if any(char in path for char in '#|[]\\\r\n'):
            raise StorageError('unsupported_link_rewrite', 409)
        return path + (anchor + fragment if anchor else '') + alias
    parsed = urlsplit(item.target)
    if not parsed.path or parsed.scheme or parsed.netloc:
        return None
    # Keep the original destination when its existing relative spelling still
    # denotes the desired path. This also retains optional ./ and URL spelling.
    current = posixpath.normpath(posixpath.join(posixpath.dirname(new_path), unquote(parsed.path)))
    if current == expected:
        return None
    path = posixpath.relpath(expected, posixpath.dirname(new_path) or '.')
    # Preserve the raw fragment exactly, including escape and percent spelling.
    fragment = _raw_fragment(item.raw)
    return quote(path, safe='/-._~') + fragment


def rewrite_links(source: str, old_path: str, new_path: str,
                  relocated: dict[str, str], resolve) -> tuple[str, list[dict]]:
    """Repair links using a resolver over the pre-move namespace.

    ``resolve(source_path, target, kind)`` returns a canonical path or None for
    missing, ambiguous, or external destinations. Unavailability must raise a
    StorageError. Positions in the result identify the original destination.
    """
    changes = []
    edits = {}
    line_offsets = [0] + [match.end() for match in re.finditer(r'\r\n|\r|\n', source)]
    for item in _destinations(source):
        after = _replacement(item, old_path, new_path, relocated, resolve)
        if after is None or after == item.raw:
            continue
        offsets = item.offsets
        if not offsets or any(right != left + 1 for left, right in zip(offsets, offsets[1:])):
            raise StorageError('unsupported_link_rewrite', 409)
        start, end = offsets[0], offsets[-1] + 1
        if source[start:end] != item.raw:
            raise StorageError('unsupported_link_rewrite', 409)
        if (start, end) in edits:
            continue
        edits[start, end] = after
        line = bisect_right(line_offsets, start)
        changes.append({'before': item.raw, 'after': after,
                        'kind': item.kind,
                        'position': (line, start - line_offsets[line - 1] + 1)})
    ordered = sorted(edits)
    if any(left[1] > right[0] for left, right in zip(ordered, ordered[1:])):
        raise StorageError('unsupported_link_rewrite', 409)
    for start, end in reversed(ordered):
        source = source[:start] + edits[start, end] + source[end:]
    changes.sort(key=lambda change: change['position'])
    return source, changes
