"""Shared explicit math syntax and inert, non-forgeable preview placeholders."""
import json
from pathlib import Path
import pytest
from tests.integration.test_storage import wiki
from tests.unit.test_markdown import Elements
from wiki.markdown import render_preview

FIXTURES = json.loads((Path(__file__).parents[1] / "fixtures/math-delimiters.json").read_text())

@pytest.mark.parametrize("fixture", FIXTURES)
def test_math_shared_parser_fixtures(fixture, wiki):
    result = render_preview(fixture["source"], "note.md")
    placeholders = [attrs for tag, attrs in Elements(result.html).elements if attrs.get("data-math-source") is not None]
    assert [{"expression": attrs["data-math-expression"], "display": attrs["data-math-display"] == "true"} for attrs in placeholders] == fixture["math"]
    assert not any(tag in {"math", "svg", "script"} for tag, attrs in Elements(result.html).elements)

def test_math_placeholders_are_only_application_generated_and_escaped(wiki):
    source = '<span data-math-source="evil" data-math-expression="evil" data-math-display="true">fake</span>\n\n\\(<img src=x onerror=evil>\\)'
    result = render_preview(source, "note.md")
    placeholders = [attrs for tag, attrs in Elements(result.html).elements if "data-math-source" in attrs]
    assert len(placeholders) == 1
    assert placeholders[0]["data-math-expression"] == '<img src=x onerror=evil>'
    assert not any(tag == "img" for tag, attrs in Elements(result.html).elements)
    assert "&lt;img" in result.html

def test_math_preview_caps_expression_count(wiki):
    result = render_preview("\\(x\\)\n\n" * 300, "note.md")
    assert sum("data-math-source" in attrs for tag, attrs in Elements(result.html).elements) == 100
    assert "preview_math_limit" in result.diagnostics


def test_ordinary_markdown_sanitizer_still_rejects_mathml_and_raw_placeholder_markup(wiki):
    source = '<math xmlns="http://www.w3.org/1998/Math/MathML"><mtext>raw</mtext></math>\n\n<svg><text>raw</text></svg>\n\n<span data-math-source="\\(evil\\)" data-math-expression="evil" data-math-display="true">raw</span>'
    result = render_preview(source, "note.md")
    assert not any(tag in {"math", "svg"} or "data-math-source" in attrs for tag, attrs in Elements(result.html).elements)
    assert "&lt;math" in result.html


def test_over_budget_delimiter_ranges_remain_literal_without_placeholder_amplification(wiki):
    for source in ["Before\n\n$$" + "x" * 8192 + "$$", "Before\n\n$$\n" + "x" * 8187 + "\n$$", "Before\n\n\\(" + "x" * 8189 + "\\)"]:
        result = render_preview(source, "note.md")
        assert not any("data-math-source" in attrs for tag, attrs in Elements(result.html).elements)
        assert not result.diagnostics


@pytest.mark.parametrize("source", [
    '<script data-x="\\(attribute\\)">\\(body\\)</script>',
    '<!-- \\(comment\\)\nunterminated',
    '<script \\(unterminated attribute\\)',
    'Prefix <span\n title="\\(multiline attribute\\)">literal</span>',
    '<math><annotation-xml encoding="text/html"><img src=/private onerror=evil></annotation-xml></math>',
    '<span data-math-source="&quot; onmouseover=&quot;evil" data-math-expression="x">literal</span>',
])
def test_source_html_tokens_are_always_escaped_and_cannot_forge_math_or_resources(source, wiki):
    result = render_preview(source, "note.md")
    elements = Elements(result.html).elements
    assert not any(tag in {"script", "img", "svg", "math", "annotation-xml"} or "data-math-source" in attrs or any(name.startswith("on") for name in attrs) for tag, attrs in elements)
    assert "&lt;" in result.html


def test_literal_html_policy_keeps_application_generated_task_checkboxes(wiki):
    result = render_preview('- [ ] Plain \\(x\\)\n- [x] Checked\n\n<input type="checkbox" checked>\n', "note.md")
    inputs = [attrs for tag, attrs in Elements(result.html).elements if tag == "input"]
    assert len(inputs) == 2
    assert all(attrs.get("type") == "checkbox" and "disabled" in attrs for attrs in inputs)
    assert 'checked' not in inputs[0] and 'checked' in inputs[1]
    assert '&lt;input' in result.html
