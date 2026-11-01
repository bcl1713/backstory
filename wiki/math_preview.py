"""Explicit math tokenization only; rendering stays in the local DOM renderer.

Raw note HTML output is disabled in the caller. Only these application-generated
escaped placeholders survive the existing ordinary-Markdown sanitizer.
"""
from html import escape

from markdown_it import MarkdownIt

# Syntax-only oracle for the same paragraph boundary contract as the editor's
# display leaf. No renderer, HTML mounting, link resolution, or recursive math.
_plain_blocks = MarkdownIt("gfm-like", {"html": True, "maxNesting": 32})


def _inline(state, silent):
    if state.linkLevel or not state.src.startswith(r"\(", state.pos):
        return False
    start = state.pos
    at = start + 2
    while at < min(state.posMax, start + 8192):
        if state.src[at] in "\r\n":
            return False
        if state.src[at] != "\\":
            at += 1
            continue
        if state.src.startswith(r"\)", at):
            if at == start + 2 or at + 2 > start + 8192:
                return False
            if not silent:
                token = state.push("backstory_math", "", 0)
                token.content = state.src[start:at + 2]
                token.meta = {"display": False}
            state.pos = at + 2
            return True
        at += 2
    return False


def _line(state, line):
    return state.src[state.bMarks[line]:state.eMarks[line]]


def _single_display(text, close):
    if len(text) > 8192:
        return False
    at = 2
    while at < len(text):
        if text.startswith(close, at):
            return at > 2 and at + 2 == len(text)
        at += 2 if text[at] == "\\" else 1
    return False


def _block(state, start, end, silent):
    # Top-level, column-zero display blocks only. Lists/quotes/tables own their
    # own presentation, and neither delimiter may span an internal blank line.
    if state.level or state.blkIndent or state.tShift[start] != 0:
        return False
    text = _line(state, start)
    close = "$$" if text.startswith("$$") else r"\]" if text.startswith(r"\[") else None
    if close is None:
        return False
    stop = start
    if _single_display(text, close):
        pass
    elif text in {"$$", r"\["}:
        for stop in range(start + 1, end):
            part = _line(state, stop)
            if not part or state.eMarks[stop] - state.bMarks[start] > 8192:
                return False
            if part == close:
                break
        else:
            return False
    else:
        return False
    content = state.src[state.bMarks[start]:state.eMarks[stop]]
    if stop > start and [token.type for token in _plain_blocks.parse(content)] != ["paragraph_open", "inline", "paragraph_close"]:
        return False
    if silent:
        return True
    token = state.push("backstory_math", "", 0)
    token.block = True
    token.map = [start, stop + 1]
    token.content = content
    token.meta = {"display": True}
    state.line = stop + 1
    return True


def _front_matter(state, start, end, silent):
    if start != 0 or _line(state, start) != "---":
        return False
    if silent:
        return True
    stop = start + 1
    while stop < end and _line(state, stop) not in {"---", "..."}:
        stop += 1
    stop = min(stop + 1, end)
    token = state.push("fence", "code", 0)
    token.content = state.src[state.bMarks[start]:state.eMarks[stop - 1]] + "\n"
    token.map = [start, stop]
    state.line = stop
    return True


def _render(self, tokens, index, options, env):
    token = tokens[index]
    if env.get("math_count", 0) >= 100:
        env["diagnostics"].setdefault("preview_math_limit", None)
        return "<code>" + escape(token.content) + "</code>"
    env["math_count"] = env.get("math_count", 0) + 1
    source = escape(token.content, quote=True)
    expression = escape(token.content[2:-2].strip(), quote=True)
    display = "true" if token.meta["display"] else "false"
    return (f'<span class="lp-math-preview" data-math-source="{source}" '
            f'data-math-expression="{expression}" data-math-display="{display}">'
            f'<code>{escape(token.content)}</code>'
            '<span class="lp-math-status"> Math source; local rendering requires JavaScript.</span></span>')


def install_math(parser):
    parser.block.ruler.before("hr", "backstory_front_matter", _front_matter)
    parser.block.ruler.before("paragraph", "backstory_math", _block)
    parser.inline.ruler.before("escape", "backstory_math", _inline)
    parser.add_render_rule("backstory_math", _render)


def preserve_table_math_source(tokens):
    depth = 0
    for token in tokens:
        if token.type == "table_open":
            depth += 1
        if depth and token.children:
            for child in token.children:
                if child.type == "backstory_math":
                    child.type = "text"
        if token.type == "table_close":
            depth -= 1
