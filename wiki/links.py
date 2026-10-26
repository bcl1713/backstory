"""Exact paths followed by bounded, policy-checked indexed identifiers.

Markdown destinations are URLs decoded once. Wikilinks are literal wiki paths
(percent signs remain filenames). Wiki paths prefer the root, then the source
directory, and permit an omitted .md. No directory scans or content reads occur.
"""
import os
import posixpath
import re
import stat
from typing import Literal
from urllib.parse import quote, unquote_to_bytes, urlencode, urlsplit

from django.urls import reverse

from .contracts import LinkResult, StorageError
from .policy import validate_path
from .storage import open_directory, require_ready


def heading_slug(text: str, *, plain=False) -> str:
    """Lowercase Unicode word characters; remove punctuation, spaces -> hyphens.

    Rendered heading IDs have a preview- prefix to isolate them from app controls.
    Duplicate IDs append -1, -2, ...; link fragments use the same slug convention.
    Inline markup is removed; existing underscores remain word characters.
    """
    from markdown_it import MarkdownIt
    tokens = MarkdownIt('commonmark', {'html': False}).parseInline(text) if not plain else []
    def plain_text(items):
        return ''.join(plain_text(token.children) if token.children else token.content if token.type in {'text', 'code_inline', 'image'} else '' for token in items)
    text = plain_text(tokens) if not plain else text
    return re.sub(r"\s+", "-", re.sub(r"[^\w\s-]", "", text.lower()).strip()) or "section"



def _decoded(value):
    if re.search(r"%(?![0-9a-fA-F]{2})", value):
        raise ValueError("invalid encoding")
    return unquote_to_bytes(value).decode("utf-8", errors="strict")


def _entry_kind(path):
    parent, _, name = path.rpartition("/")
    with open_directory(parent) as directory:
        try:
            info = os.stat(name, dir_fd=directory, follow_symlinks=False)
        except FileNotFoundError:
            return "missing"
    if stat.S_ISDIR(info.st_mode):
        return "directory"
    if not stat.S_ISREG(info.st_mode):
        raise StorageError("path_denied", 404)
    return "file"


def _regular(path):
    return _entry_kind(path) == "file"


def resolve_link(source_path: str, target: str, kind: Literal["markdown", "wiki"]) -> LinkResult:
    unavailable = LinkResult("unavailable", None, "Unavailable link")
    try:
        validate_path(source_path, "content")
        if kind not in {"markdown", "wiki"} or not isinstance(target, str) or len(target) > 4096:
            return unavailable
        if any(ord(char) < 32 or ord(char) == 127 for char in target) or "\\" in target:
            return unavailable
        raw, separator, label = target.partition("|") if kind == "wiki" else (target, "", target)
        if not separator:
            label = raw
        if kind == 'wiki':
            path, _, fragment = raw.partition('#')
        else:
            parsed = urlsplit(raw)
            if parsed.scheme or parsed.netloc:
                if parsed.scheme.lower() not in {"http", "https", "mailto", ""}:
                    return unavailable
                href = "https:" + raw if not parsed.scheme else raw
                return LinkResult("external", href, label)
            if parsed.query:
                return unavailable
            path, fragment = _decoded(parsed.path), _decoded(parsed.fragment)
        suffix = "#" + quote("preview-" + heading_slug(fragment), safe="-_") if fragment else ""
        if not path:
            return LinkResult("resolved", suffix or "#", label)
        rooted = kind == "wiki" and path.startswith("/") and not path.startswith("//")
        if path.startswith("/") and not rooted:
            return LinkResult("missing", None, label)
        if rooted:
            path = path[1:]
        relative = posixpath.normpath(posixpath.join(posixpath.dirname(source_path), path))
        root_path = posixpath.normpath(path)
        # A parent-relative wikilink has no valid root-relative interpretation;
        # apply it to its source directory before enforcing the final policy.
        root_candidate = kind == "wiki" and root_path != ".." and not root_path.startswith("../")
        bases = [root_path] if rooted else [root_path, relative] if root_candidate else [relative]
        require_ready()
        visited = set()
        create_paths = []
        blocked_creation = False
        for base in bases:
            candidates = [base, base + ".md"] if kind == "wiki" and not base.lower().endswith(".md") else [base]
            for candidate in candidates:
                if candidate in visited:
                    continue
                visited.add(candidate)
                try:
                    validate_path(candidate, "content")
                except StorageError:
                    blocked_creation = True
                    continue  # excluded paths never offer creation
                try:
                    entry_kind = _entry_kind(candidate)
                except StorageError as error:
                    if error.reason_code == "not_found":
                        continue
                    raise
                if entry_kind == "directory":
                    blocked_creation = True
                if entry_kind == "missing" and candidate.lower().endswith(".md"):
                    create_paths.append(candidate)
                if entry_kind == "file":
                    route = "wiki:note" if candidate.lower().endswith(".md") else "wiki:attachment"
                    return LinkResult("resolved", reverse(route, args=[candidate]) + suffix, label)
        if kind == 'wiki':
            from indexing.search import resolve_indexed_name
            from django.db import OperationalError
            try:
                state, paths = resolve_indexed_name(path)
            except OperationalError:
                return unavailable
            # A leading slash selects a path in the wiki root, never a global alias.
            if rooted and state != 'unavailable':
                state, paths = 'missing', ()
            if state == 'resolved':
                return LinkResult(state, reverse('wiki:note', args=[paths[0]]) + suffix, label)
            action = '/new/link/' + '?' + urlencode({'source': source_path, 'target': target})
            if state == 'ambiguous':
                return LinkResult(state, None, label, action_href=action, choices=paths)
            parsed = urlsplit(path)
            note_target = not parsed.scheme and not parsed.netloc and posixpath.splitext(path)[1].lower() in {'', '.md'}
            if state == 'missing' and create_paths and not blocked_creation and note_target:
                return LinkResult(state, None, label, action_href=action, create_path=create_paths[0])
            return LinkResult(state, None, label)
        return LinkResult("missing", None, label)
    except (StorageError, OSError, ValueError, UnicodeError):
        return unavailable


from dataclasses import dataclass


@dataclass(frozen=True)
class LinkEdge:
    target: str
    kind: str
    fragment: str
    position: tuple[int, int]


def extract_links(source: str) -> list[LinkEdge]:
    """Syntax tokens only; code is deliberately absent from the edge stream.

    Positions point to the containing source line for reference destinations,
    which may be declared elsewhere. Tokens retain literal wiki spelling.
    """
    from .markdown import _parser
    parser = _parser()
    parser.validateLink = lambda value: True
    tokens = parser.parse(source, {})
    edges = []
    count = 0

    def walk(items, line=1, content=''):
        nonlocal count
        for token in items:
            count += 1
            if count > 100000:
                raise ValueError('link_structure_limit')
            current = token.map[0] + 1 if token.map else line
            target = None
            if token.type == 'wiki_link':
                target, kind = token.content.partition('|')[0], 'wiki'
            elif token.type in {'link_open', 'image'}:
                target, kind = token.attrGet('href' if token.type == 'link_open' else 'src'), 'markdown'
            if target is not None:
                path, _, fragment = target.partition('#')
                # Column is advisory for normalized/reference Markdown tokens.
                column = max(1, content.find(target) + 1)
                edges.append(LinkEdge(path, kind, fragment, (current, column)))
            if token.children:
                walk(token.children, current, token.content)
    walk(tokens)
    return edges
