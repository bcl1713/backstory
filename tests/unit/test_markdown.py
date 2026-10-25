"""Preview tests catch executable output and syntax-blind link rewriting."""
import importlib
from html.parser import HTMLParser

import pytest

from tests.integration.test_storage import wiki


def module(name):
    try:
        return importlib.import_module(name)
    except ImportError:
        pytest.fail(f"Task 3 module {name} is missing")


class Elements(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.elements = []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        self.elements.append((tag, dict(attrs)))


def test_preview_escapes_active_html_and_unsafe_schemes(wiki):
    render = module("wiki.markdown").render_preview
    source = '<script>alert(1)</script>\n<svg onload="alert(2)"></svg>\n<img src=x onerror="alert(3)">\n\n[bad](javascript:alert(4)) [bad](data:text/html,boom)\n'
    preview = render(source, "note.md")
    elements = Elements(preview.html).elements
    assert not any(tag in {"script", "svg", "iframe", "object"} for tag, attrs in elements)
    assert not any(key.startswith("on") for tag, attrs in elements for key in attrs)
    assert not any(attrs.get("href", "").startswith(("javascript:", "data:")) for tag, attrs in elements)
    assert "&lt;script&gt;" in preview.html


def test_code_and_escaped_wikilinks_are_not_rewritten(wiki):
    (wiki / "target.md").write_text("synthetic")
    render = module("wiki.markdown").render_preview
    source = '`[[target]] [label](target.md)`\n\n```md\n[[target]]\n[label](target.md)\n```\n\n\\[[target]]\n'
    preview = render(source, "note.md")
    assert not any(tag == "a" for tag, attrs in Elements(preview.html).elements)
    assert "[[target]]" in preview.html
    assert "[label](target.md)" in preview.html


def test_links_use_exact_paths_optional_extension_and_fragments(wiki):
    (wiki / "folder").mkdir()
    (wiki / "target.md").write_text("# Hello, World!\n# Hello, World!\n")
    (wiki / "folder/target.md").write_text("source-relative synthetic")
    resolve = module("wiki.links").resolve_link
    assert resolve("folder/note.md", "../target.md#Hello%2C%20World!", "markdown").href == "/notes/target.md#preview-hello-world"
    assert resolve("folder/note.md", "target.md", "markdown").href == "/notes/folder/target.md"
    assert resolve("folder/note.md", "target#hello-world-1|label", "wiki").href == "/notes/target.md#preview-hello-world-1"
    assert resolve("folder/note.md", "target|label", "wiki").label == "label"
    assert resolve("folder/note.md", "../target", "wiki").href == "/notes/target.md"
    assert resolve("folder/note.md", "#Hello World!", "markdown").href == "#preview-hello-world"
    preview = module("wiki.markdown").render_preview("# Hello, World!\n# Hello, World!\n[[target|<img src=x onerror=evil>]]", "note.md")
    elements = Elements(preview.html).elements
    assert ("h1", {"id": "preview-hello-world"}) in elements
    assert ("h1", {"id": "preview-hello-world-1"}) in elements
    assert not any(tag == "img" for tag, attrs in elements)
    assert "&lt;img" in preview.html


def test_blocked_paths_never_disclose_candidates(wiki, settings, tmp_path):
    (wiki / "folder").mkdir()
    (wiki / "AGENTS.md").write_text("synthetic excluded")
    (wiki / "private.md").write_text("synthetic excluded")
    (wiki / "alias.md").symlink_to(wiki / "private.md")
    settings.BACKSTORY_EXCLUSIONS = ["private.md"]
    resolve = module("wiki.links").resolve_link
    for target in ["../../outside.md", "/absolute.md", "../AGENTS.md", "../private.md", "../alias.md"]:
        result = resolve("folder/note.md", target, "markdown")
        assert result.state == "unavailable"
        assert result.href is None
        assert result.label == "Unavailable link"
        assert target not in repr(result)
    missing = resolve("folder/note.md", "missing.md", "markdown")
    assert missing.state == "missing"
    assert missing.href is None


def test_markdown_links_decode_once_and_wiki_paths_keep_literal_percent(wiki):
    (wiki / "%2e%2e.md").write_text("synthetic percent")
    (wiki / "100%.md").write_text("synthetic percent")
    resolve = module("wiki.links").resolve_link
    assert resolve("note.md", "%252e%252e.md", "markdown").href == "/notes/%252e%252e.md"
    assert resolve("note.md", "100%.md", "wiki").href == "/notes/100%25.md"
    assert resolve("note.md", "%FF.md", "markdown").state == "unavailable"


def test_images_are_local_raster_only_and_never_fetch_network(wiki, monkeypatch):
    import socket
    def reject_network(*args, **kwargs):
        raise AssertionError("Preview attempted a network connection")
    monkeypatch.setattr(socket.socket, "connect", reject_network)
    (wiki / "image.png").write_bytes(b"\x89PNG\r\n\x1a\nsynthetic")
    (wiki / "active.svg").write_text("<svg onload=evil />")
    render = module("wiki.markdown").render_preview
    preview = render('![remote](https://example.invalid/pixel.png) ![protocol](//example.invalid/pixel.png) ![local](image.png) ![active](active.svg) ![missing](missing.png)', "note.md")
    images = [attrs for tag, attrs in Elements(preview.html).elements if tag == "img"]
    assert len(images) == 1
    assert images[0]["src"] == "/attachments/image.png"
    assert "External image blocked" in preview.html
    assert "Image unavailable" in preview.html
    assert preview.diagnostics


def test_gfm_rendering_retains_tables_strikethrough_tasks_and_external_links(wiki):
    preview = module("wiki.markdown").render_preview("| A | B |\n| - | - |\n| 1 | 2 |\n\n~~old~~\n\n- [x] done\n\nhttps://example.invalid\n", "note.md")
    elements = Elements(preview.html).elements
    assert any(tag == "table" for tag, attrs in elements)
    assert any(tag == "s" for tag, attrs in elements)
    assert any(tag == "input" and "disabled" in attrs for tag, attrs in elements)
    assert any(tag == "a" and attrs.get("href") == "https://example.invalid" for tag, attrs in elements)
