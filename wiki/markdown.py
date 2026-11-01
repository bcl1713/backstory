"""Independent CommonMark/GFM preview. Never serialize HTML back into source."""
from html import escape
from pathlib import PurePosixPath
from urllib.parse import unquote, urlsplit

from markdown_it import MarkdownIt
from markdown_it.rules_block import html_block
from markdown_it.rules_inline import html_inline
from mdit_py_plugins.tasklists import tasklists_plugin
import nh3

from .attachments import INLINE_RASTER_SUFFIXES
from .contracts import Preview
from .links import heading_slug, resolve_link
from .diagram_preview import install_diagrams, mark_complete_fences
from .math_preview import install_math, preserve_table_math_source

_LINK_LIMIT = 200
_TAGS = {
    "p", "a", "img", "span", "h1", "h2", "h3", "h4", "h5", "h6", "br", "hr",
    "em", "strong", "s", "blockquote", "pre", "code", "ul", "ol", "li", "table",
    "thead", "tbody", "tr", "th", "td", "input",
}
_ATTRIBUTES = {
    "a": {"href", "title", "class", "aria-label"}, "img": {"src", "alt", "title", "loading"},
    "span": {"class", "data-math-source", "data-math-expression", "data-math-display"}, "input": {"checked", "disabled"},
    "pre": {"class", "data-mermaid-source"}, "ol": {"start"}, **{f"h{level}": {"id"} for level in range(1, 7)},
}


def _diagnose(env, code):
    env["diagnostics"].setdefault(code, None)


def _resolve(env, target, kind):
    key = (kind, target)
    if key not in env["links"]:
        if len(env["links"]) >= _LINK_LIMIT:
            _diagnose(env, "preview_link_limit")
            return None
        env["links"][key] = resolve_link(env["source_path"], target, kind)
    result = env["links"][key]
    if result.state in {"missing", "unavailable"}:
        _diagnose(env, "link_" + result.state)
    return result


def _wiki_rule(state, silent):
    # Runs in the inline parser: fences, code spans and backslash escapes have
    # already consumed their own syntax. Never search/replace the source string.
    if state.linkLevel or not state.src.startswith("[[", state.pos):
        return False
    end = state.src.find("]]", state.pos + 2, state.posMax)
    if end == -1 or "\n" in state.src[state.pos + 2:end]:
        return False
    if not silent:
        token = state.push("wiki_link", "", 0)
        token.content = state.src[state.pos + 2:end]
    state.pos = end + 2
    return True


def _wiki_render(self, tokens, index, options, env):
    result = _resolve(env, tokens[index].content, "wiki")
    if result is None:
        return '<span class="link-unavailable">Unavailable link</span>'
    label = escape(result.label)
    if result.action_href:
        description = f"Create note: {result.create_path}" if result.create_path else "Choose note destination"
        return (f'<a class="link-{result.state}" href="{escape(result.action_href, quote=True)}" '
                f'aria-label="{escape(result.label + " — " + description, quote=True)}">{label}</a>')
    if result.href is None:
        return f'<span class="link-{result.state}">{label}</span>'
    return f'<a href="{escape(result.href, quote=True)}">{label}</a>'


def _image_render(self, tokens, index, options, env):
    token = tokens[index]
    target = token.attrGet("src") or ""
    result = _resolve(env, target, "markdown")
    if result and result.state == "external":
        _diagnose(env, "external_image_blocked")
        return '<span class="image-placeholder">External image blocked</span>'
    if result and result.href and result.href.startswith("/attachments/"):
        path = unquote(urlsplit(result.href).path)
        if PurePosixPath(path).suffix.lower() in INLINE_RASTER_SUFFIXES:
            alt = escape(token.content, quote=True)
            return f'<img src="{escape(result.href, quote=True)}" alt="{alt}" loading="lazy">'
    _diagnose(env, "image_unavailable")
    return '<span class="image-placeholder">Image unavailable</span>'


def _rewrite_links(tokens, env):
    stack = []
    for token in tokens:
        if token.type == "link_open":
            result = _resolve(env, token.attrGet("href") or "", "markdown")
            blocked = result is None or result.href is None
            stack.append(blocked)
            if blocked:
                token.tag = "span"
                token.attrs = {"class": "link-unavailable" if result is None else "link-" + result.state}
            else:
                token.attrSet("href", result.href)
        elif token.type == "link_close" and stack:
            if stack.pop():
                token.tag = "span"
        if token.children:
            _rewrite_links(token.children, env)


def _plain_heading(tokens):
    return "".join((token.content.partition("|")[2] or token.content.partition("|")[0]) if token.type == "wiki_link" else token.content for token in tokens if token.type in {"text", "code_inline", "image", "wiki_link"})


def _literal_html_inline(state, silent):
    # Recognize a complete source tag before math/Markdown can reinterpret its
    # attributes, but never let a source token reach the raw-HTML renderer.
    # Inert <a> text must not acquire Markdown link-label parser state either.
    link_level = state.linkLevel
    matched = html_inline(state, silent)
    state.linkLevel = link_level
    if matched and not silent:
        state.tokens[-1].type = "text"
    return matched


def _literal_html_block(state, start, end, silent):
    matched = html_block(state, start, end, silent)
    if matched and not silent:
        state.tokens[-1].type = "backstory_literal_html"
    return matched


def _literal_html_render(self, tokens, index, options, env):
    return escape(tokens[index].content)


def _parser():
    # HTML grammar is structural only. Source HTML is immediately converted to
    # escaped literal tokens; app-generated task checkboxes retain their own
    # existing renderer. This does not admit ordinary raw HTML to the output.
    parser = MarkdownIt("gfm-like", {"html": True, "maxNesting": 32}).use(tasklists_plugin)
    parser.inline.ruler.at("html_inline", _literal_html_inline)
    parser.block.ruler.at("html_block", _literal_html_block)
    parser.add_render_rule("backstory_literal_html", _literal_html_render)
    parser.inline.ruler.before("link", "wiki_link", _wiki_rule)
    parser.add_render_rule("wiki_link", _wiki_render)
    parser.add_render_rule("image", _image_render)
    install_math(parser)
    install_diagrams(parser)
    return parser


def _attribute_filter(tag, attribute, value):
    if tag == "img" and attribute == "src" and not value.startswith("/attachments/"):
        return None
    return value


def render_preview(source: str, source_path: str) -> Preview:
    env = {"source_path": source_path, "diagnostics": {}, "links": {}}
    try:
        parser = _parser()
        tokens = parser.parse(source, env)
        preserve_table_math_source(tokens)
        mark_complete_fences(tokens, source)
        counts = {}
        used = set()
        for index, token in enumerate(tokens):
            if token.type == "heading_open" and index + 1 < len(tokens):
                slug = heading_slug(_plain_heading(tokens[index + 1].children or []), plain=True)
                count = counts.get(slug, 0)
                candidate = slug + (f"-{count}" if count else "")
                while candidate in used:
                    count += 1
                    candidate = f"{slug}-{count}"
                counts[slug] = count + 1
                used.add(candidate)
                token.attrSet("id", "preview-" + candidate)
        _rewrite_links(tokens, env)
        html = parser.renderer.render(tokens, parser.options, env)
        html = nh3.clean(html, tags=_TAGS, attributes=_ATTRIBUTES,
                         attribute_filter=_attribute_filter,
                         url_schemes={"http", "https", "mailto"},
                         tag_attribute_values={"input": {"type": {"checkbox"}}})
        return Preview(html, tuple(env["diagnostics"]))
    except Exception:
        # A parser/plugin failure must never prevent access to the original
        # source or expose its text through exception diagnostics/logs.
        return Preview('<p class="preview-error">Preview unavailable. Original source remains available.</p>', ("preview_unavailable",))
