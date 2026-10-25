"""Exact disk links only; indexed name fallback can extend this boundary later.

Markdown destinations are URLs decoded once. Wikilinks are literal wiki paths
(percent signs remain filenames). Wiki paths prefer the root, then the source
directory, and permit an omitted .md. No directory scans or content reads occur.
"""
import os
import posixpath
import re
import stat
from typing import Literal
from urllib.parse import quote, unquote_to_bytes, urlsplit

from django.urls import reverse

from .contracts import LinkResult, StorageError
from .policy import validate_path
from .storage import open_directory, require_ready


def heading_slug(text: str) -> str:
    """Lowercase Unicode word characters; remove punctuation, spaces -> hyphens.

    Rendered heading IDs have a preview- prefix to isolate them from app controls.
    Duplicate IDs append -1, -2, ...; link fragments use the same slug convention.
    """
    return re.sub(r"\s+", "-", re.sub(r"[^\w\s-]", "", text.lower()).strip()) or "section"


def _decoded(value):
    if re.search(r"%(?![0-9a-fA-F]{2})", value):
        raise ValueError("invalid encoding")
    return unquote_to_bytes(value).decode("utf-8", errors="strict")


def _regular(path):
    parent, _, name = path.rpartition("/")
    with open_directory(parent) as directory:
        try:
            info = os.stat(name, dir_fd=directory, follow_symlinks=False)
        except FileNotFoundError:
            return False
    if stat.S_ISDIR(info.st_mode):
        return False
    if not stat.S_ISREG(info.st_mode):
        raise StorageError("path_denied", 404)
    return True


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
        parsed = urlsplit(raw)
        if parsed.scheme or parsed.netloc:
            if kind != "markdown":
                return unavailable
            if parsed.scheme.lower() not in {"http", "https", "mailto", ""}:
                return unavailable
            href = "https:" + raw if not parsed.scheme else raw
            return LinkResult("external", href, label)
        if parsed.query:
            return unavailable
        path = _decoded(parsed.path) if kind == "markdown" else parsed.path
        fragment = _decoded(parsed.fragment) if kind == "markdown" else parsed.fragment
        suffix = "#" + quote("preview-" + heading_slug(fragment), safe="-_") if fragment else ""
        if not path:
            return LinkResult("resolved", suffix or "#", label)
        if path.startswith("/"):
            return unavailable
        relative = posixpath.normpath(posixpath.join(posixpath.dirname(source_path), path))
        root_path = posixpath.normpath(path)
        # A parent-relative wikilink has no valid root-relative interpretation;
        # apply it to its source directory before enforcing the final policy.
        root_candidate = kind == "wiki" and root_path != ".." and not root_path.startswith("../")
        bases = [root_path, relative] if root_candidate else [relative]
        require_ready()
        visited = set()
        for base in bases:
            candidates = [base, base + ".md"] if kind == "wiki" and not base.lower().endswith(".md") else [base]
            for candidate in candidates:
                if candidate in visited:
                    continue
                visited.add(candidate)
                validate_path(candidate, "content")
                try:
                    exists = _regular(candidate)
                except StorageError as error:
                    if error.reason_code == "not_found":
                        continue
                    raise
                if exists:
                    route = "wiki:note" if candidate.lower().endswith(".md") else "wiki:attachment"
                    return LinkResult("resolved", reverse(route, args=[candidate]) + suffix, label)
        return LinkResult("missing", None, label)
    except (StorageError, OSError, ValueError, UnicodeError):
        return unavailable
