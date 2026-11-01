"""Only inert, escaped Mermaid fence placeholders; no Python diagram rendering."""
from html import escape
from markdown_it.renderer import RendererHTML


def _units(value):
    return sum(2 if ord(char) > 0xffff else 1 for char in value)


def _fence(self, tokens, index, options, env):
    token = tokens[index]
    # Presentation only for complete, top-level column-zero explicit fences.
    if (token.info.strip() != 'mermaid' or token.level or not token.meta.get('mermaid_complete')):
        return RendererHTML.fence(self, tokens, index, options, env)
    if _units(token.content) > 8192 or token.meta.get('mermaid_source_units', 0) > 8292 or env.get('mermaid_count', 0) >= 32:
        env['diagnostics'].setdefault('preview_mermaid_limit', None)
        return RendererHTML.fence(self, tokens, index, options, env)
    env['mermaid_count'] = env.get('mermaid_count', 0) + 1
    return ('<pre class="lp-diagram-preview" data-mermaid-source="' + escape(token.content, quote=True)
            + '"><code>' + escape(token.content) + '</code>'
            + '<span class="lp-diagram-status">Mermaid source; local rendering requires JavaScript and explicit configuration.</span></pre>\n')


def mark_complete_fences(tokens, source):
    lines = source.replace('\r\n', '\n').replace('\r', '\n').split('\n')
    for token in tokens:
        if token.type != 'fence' or token.info.strip() != 'mermaid' or not token.map or token.level:
            continue
        start, end = token.map
        if start >= len(lines) or end > len(lines) or end - start < 2:
            continue
        opening, closing = lines[start], lines[end - 1]
        marker = token.markup
        # Markdown parser already owns fence matching; require a real closing
        # source line and column-zero opening to match the editor's initial scope.
        ending = closing.lstrip(' ').rstrip(' \t')
        if (opening.startswith(marker) and ending.startswith(marker)
                and len(closing) - len(closing.lstrip(' ')) <= 3
                and not ending.strip(marker[0])):
            token.meta['mermaid_complete'] = True
            token.meta['mermaid_source_units'] = sum(_units(line) + 1 for line in lines[start:end]) - 1


def install_diagrams(parser):
    parser.add_render_rule('fence', _fence)
