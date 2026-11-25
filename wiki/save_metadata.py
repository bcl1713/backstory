"""Surgical save metadata changes; never serialize unrelated YAML or note bodies."""
from datetime import datetime, timezone
import json
import re
import unicodedata
from zoneinfo import ZoneInfo

import yaml
from yaml.nodes import MappingNode, ScalarNode, SequenceNode
from yaml.tokens import AliasToken, AnchorToken, FlowEntryToken, FlowMappingEndToken, FlowSequenceEndToken, ScalarToken, TagToken

from .metadata import MetadataError, RestrictedLoader, parse_front_matter


def wiki_date(now=None, zone=None):
    if zone is None:
        from .timezones import timezone_state
        zone = timezone_state()["timezone"]
    return (now or datetime.now(timezone.utc)).astimezone(ZoneInfo(zone)).date().isoformat()


def _header(source):
    matter = parse_front_matter(source)  # Enforce bounded, duplicate-free safe YAML first.
    if not matter.present:
        return None
    prefix = 1 if source.startswith('\ufeff') else 0
    lines = source[prefix:].splitlines(keepends=True)
    start = prefix + len(lines[0])
    end = start
    for line in lines[1:]:
        if line.rstrip('\r\n') in {'---', '...'}:
            break
        end += len(line)
    text = source[start:end]
    root = yaml.compose(text, Loader=RestrictedLoader)
    fields = {key.value: (key, value) for key, value in root.value} if isinstance(root, MappingNode) else {}
    return start, end, text, root, fields


def _string(fields, name):
    pair = fields.get(name)
    node = pair[1] if pair else None
    return node.value if isinstance(node, ScalarNode) and node.tag.endswith(':str') else None


def _title(source, fields):
    title = _string(fields, 'title')
    if title:
        return title
    from .markdown import _parser, _plain_heading
    tokens = _parser().parse(parse_front_matter(source).body, {})
    for index, token in enumerate(tokens[:-1]):
        if token.type == 'heading_open':
            return _plain_heading(tokens[index + 1].children or [])
    return None


def _slug(title):
    text = unicodedata.normalize('NFKC', title).lower()
    return re.sub(r'[^\w]+', '-', text, flags=re.UNICODE).replace('_', '-').strip('-')


def literal_edit_context(previous, start, end, replacement, today):
    """Approved exterior slices with one existing scalar, or no allowance.

    Deliberately accept only a plain block key and one unwrapped single-line
    string token. References anywhere in the header fail closed. The caller
    cannot touch the field's whole line, including its key/comment/newline.
    """
    header = _header(previous)
    if header is None:
        return None
    offset, _, text, root, fields = header
    if not isinstance(root, MappingNode) or root.flow_style or 'modified' not in fields:
        return None
    key, node = fields['modified']
    if (key.tag != 'tag:yaml.org,2002:str' or key.style is not None
            or text[key.start_mark.index:key.end_mark.index] != 'modified'
            or not isinstance(node, ScalarNode) or node.tag != 'tag:yaml.org,2002:str'
            or node.style not in {None, "'", '"'} or not node.value
            or key.end_mark.line != node.start_mark.line or node.start_mark.line != node.end_mark.line):
        return None
    tokens = list(yaml.scan(text, Loader=RestrictedLoader))
    if any(isinstance(token, (AnchorToken, AliasToken, TagToken)) for token in tokens):
        return None
    if not any(isinstance(token, ScalarToken) and token.start_mark.index == node.start_mark.index
               and token.end_mark.index == node.end_mark.index for token in tokens):
        return None  # Tags/wrappers are not part of an eligible scalar value.
    line_start = offset + text.rfind('\n', 0, key.start_mark.index) + 1
    newline = text.find('\n', node.end_mark.index)
    line_end = offset + (newline + 1 if newline >= 0 else len(text))
    if not (end <= line_start or start >= line_end):
        return None
    submitted = previous[:start] + replacement + previous[end:]
    changed = _header(submitted)
    if changed is None or not isinstance(changed[3], MappingNode) or changed[3].flow_style:
        return None
    new_offset, _, new_text, _, new_fields = changed
    shift = len(replacement) - (end - start) if end <= line_start else 0
    new_pair = new_fields.get('modified')
    if (new_pair is None or new_offset + new_pair[0].start_mark.index != offset + key.start_mark.index + shift
            or new_offset + new_pair[1].start_mark.index != offset + node.start_mark.index + shift
            or new_offset + new_pair[1].end_mark.index != offset + node.end_mark.index + shift):
        return None  # Do not bind a caller-created/moved/reinterpreted field.
    if any(isinstance(token, (AnchorToken, AliasToken, TagToken))
           for token in yaml.scan(new_text, Loader=RestrictedLoader)):
        return None
    for name in ('title', 'alias', 'aliases'):
        old_pair, pair = fields.get(name), new_fields.get(name)
        old_value = text[old_pair[0].start_mark.index:old_pair[1].end_mark.index] if old_pair else None
        value = new_text[pair[0].start_mark.index:pair[1].end_mark.index] if pair else None
        if value != old_value:
            return None
    if _title(previous, fields) != _title(submitted, new_fields):
        return None
    value = json.dumps(today) if node.style == '"' else "'" + today + "'" if node.style == "'" else today
    left, right = offset + node.start_mark.index, offset + node.end_mark.index
    if right <= start:
        return previous[:left] + value + previous[right:start], previous[end:]
    if left >= end:
        return previous[:start], previous[end:left] + value + previous[right:]
    return None


def literal_edit_with_modified(previous, start, end, replacement, today):
    """Exact original-position splice plus the same eligible existing scalar."""
    context = literal_edit_context(previous, start, end, replacement, today)
    return context[0] + replacement + context[1] if context is not None else None


def prepare_save_metadata(source, previous, today):
    header = _header(source)
    newline = '\r\n' if '\r\n' in source else '\n'
    if header is None:
        if previous is not None:
            return source
        prefix = '\ufeff' if source.startswith('\ufeff') else ''
        fields = [f'created: {today}', f'modified: {today}']
        title = _title(source, {})
        if title and (identifier := _slug(title)):
            fields.append('id: ' + json.dumps(identifier, ensure_ascii=False))
        return prefix + newline.join(['---', *fields, '---', '']) + source[len(prefix):]
    start, end, text, root, fields = header
    if root is not None and not isinstance(root, MappingNode):
        if previous is not None:
            return source
        raise MetadataError('metadata_mapping_required')
    edits = []
    additions = []
    tokens = list(yaml.scan(text, Loader=RestrictedLoader))

    def flow_separator(node):
        relevant = [token for token in tokens if node.start_mark.index <= token.start_mark.index < node.end_mark.index
                    and not (token.start_mark.index == node.end_mark.index - 1
                             and isinstance(token, (FlowMappingEndToken, FlowSequenceEndToken)))]
        return '' if relevant and isinstance(relevant[-1], FlowEntryToken) else ', '

    def safe_node(name):
        key, node = fields[name]
        # An alias points back to its anchor's node marks. Never edit that target.
        next_key = min((k.start_mark.index for k, _ in fields.values()
                        if k.start_mark.index > key.start_mark.index), default=len(text))
        if node.start_mark.index < key.end_mark.index or any(
                isinstance(token, (AnchorToken, AliasToken))
                and key.end_mark.index <= token.start_mark.index < next_key for token in tokens):
            raise MetadataError('metadata_automatic_field_reference')
        return node

    def replace_scalar(name, value, *, quote=False):
        node = safe_node(name)
        if not isinstance(node, ScalarNode) or node.style in {'|', '>'}:
            raise MetadataError('metadata_automatic_field_type')
        replacement = json.dumps(value, ensure_ascii=False) if quote or node.style == '"' else (
            "'" + value.replace("'", "''") + "'" if node.style == "'" else value)
        if node.start_mark.index == node.end_mark.index and text[:node.start_mark.index].endswith(':'):
            replacement = ' ' + replacement
        edits.append((node.start_mark.index, node.end_mark.index, replacement))

    if 'modified' in fields:
        replace_scalar('modified', today)
    elif previous is None:
        additions.append(f'modified: {today}')
    if previous is None:
        if 'created' not in fields:
            additions.insert(0, f'created: {today}')
        elif isinstance(fields['created'][1], ScalarNode) and not fields['created'][1].value:
            replace_scalar('created', today)
        title = _title(source, fields)
        if title and (identifier := _slug(title)):
            if 'id' not in fields:
                additions.append('id: ' + json.dumps(identifier, ensure_ascii=False))
            elif isinstance(fields['id'][1], ScalarNode) and not fields['id'][1].value:
                replace_scalar('id', identifier, quote=True)
    else:
        try:
            old_header = _header(previous)
        except MetadataError:
            old_header = None  # A corrected note must not be trapped by old invalid YAML.
        old_title = _title(previous, old_header[4]) if old_header else None
        new_title = _title(source, fields)
        if old_title and new_title and old_title != new_title:
            aliases = []
            for name in ('alias', 'aliases'):
                if name in fields:
                    node = fields[name][1]
                    nodes = node.value if isinstance(node, SequenceNode) else [node]
                    if not all(isinstance(n, ScalarNode) and n.tag.endswith(':str') for n in nodes):
                        raise MetadataError('metadata_automatic_field_type')
                    aliases.extend(n.value for n in nodes)
            if old_title.casefold() not in {value.casefold() for value in aliases}:
                name = 'aliases' if 'aliases' in fields else ('alias' if 'alias' in fields else None)
                quoted = json.dumps(old_title, ensure_ascii=False)
                if name is None:
                    additions.append('aliases: [' + quoted + ']')
                else:
                    node = safe_node(name)
                    if isinstance(node, ScalarNode):
                        original = json.dumps(node.value, ensure_ascii=False)
                        if node.style in {'|', '>'}:
                            raise MetadataError('metadata_automatic_field_type')
                        edits.append((node.start_mark.index, node.end_mark.index, '[' + original + ', ' + quoted + ']'))
                    elif node.flow_style:
                        at = node.end_mark.index - 1
                        edits.append((at, at, (flow_separator(node) if node.value else '') + quoted))
                    else:
                        at = node.end_mark.index
                        line_start = text.rfind('\n', 0, at) + 1
                        if not text[line_start:at].strip():
                            at = line_start
                        indent = node.start_mark.column
                        edits.append((at, at, ' ' * indent + '- ' + quoted + newline))
    if additions:
        if root and root.flow_style:
            at = root.end_mark.index - 1
            edits.append((at, at, (flow_separator(root) if fields else '') + ', '.join(additions)))
        else:
            at = len(text)
            edits.append((at, at, (newline if text and not text.endswith(('\n', '\r')) else '') + newline.join(additions) + newline))
    for left, right, value in sorted(edits, reverse=True):
        text = text[:left] + value + text[right:]
    result = source[:start] + text + source[end:]
    before = parse_front_matter(source)
    after = parse_front_matter(result)
    allowed = {'modified', 'created', 'id', 'alias', 'aliases'}
    def untouched(tree):
        if tree is None:
            return frozenset()
        if tree[0] != 'mapping':
            raise MetadataError('metadata_mapping_required')
        return frozenset((key, value) for key, value in tree[1] if key[2] not in allowed)
    if before.body != after.body or untouched(before.tree) != untouched(after.tree):
        raise MetadataError('metadata_automatic_preservation_failed')
    return result
