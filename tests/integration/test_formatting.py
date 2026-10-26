"""Formatting runs on synthetic drafts, never on live wiki files."""
import importlib
import json
import sys

import pytest

from tests.integration.test_browsing import reader
from tests.integration.test_storage import wiki


def formatter():
    try:
        return importlib.import_module("wiki.formatting")
    except ImportError:
        pytest.fail("Task 4 formatting boundary is missing")


def test_real_helper_formats_draft_and_is_exact_fixed_point(wiki):
    f = formatter()
    draft = "# Synthetic\n\n* one\n* two"
    (wiki / "note.md").write_text("original synthetic")
    first = f.format_source("note.md", draft, None)
    assert first.outcome == "ok"
    assert first.source != draft
    assert first.diff and len(first.config_digest) == 64
    assert f.format_source("note.md", first.source, None).source == first.source
    assert (wiki / "note.md").read_text() == "original synthetic"


def test_real_helper_optional_data_configs_overrides_and_editorconfig(wiki):
    (wiki / "folder").mkdir()
    (wiki / "style.yaml").write_text("printWidth: 24\nproseWrap: always\n")
    (wiki / "folder/.prettierrc").write_text('{"extends":"../style.yaml","overrides":[{"files":"*.md","options":{"printWidth":28}}]}')
    (wiki / ".editorconfig").write_text("root = true\n[*.md]\nend_of_line = crlf\n")
    source = "# Synthetic\n\none two three four five six seven eight nine ten eleven twelve thirteen fourteen"
    result = formatter().format_source("folder/note.md", source, None)
    assert result.outcome == "ok"
    assert "\r\n" in result.source and "\n" not in result.source.replace("\r\n", "")
    assert max(map(len, result.source.splitlines()[2:])) <= 28


def test_real_helper_ignored_note_stays_editable_and_tools_skip_independently(wiki):
    source = "# Synthetic\n\ntext   \n"
    (wiki / ".prettierignore").write_text("note.md\n")
    (wiki / ".markdownlintignore").write_text("note.md\n")
    skipped = formatter().format_source("note.md", source, None)
    assert skipped.outcome == "skipped" and skipped.source == source
    (wiki / ".markdownlintignore").unlink()
    linted = formatter().format_source("note.md", source, None)
    assert linted.outcome == "ok" and linted.source != source
    assert any(d.severity == "info" for d in linted.diagnostics)


def test_real_helper_lint_warnings_are_accepted_with_existing_config(wiki):
    (wiki / ".prettierrc").write_text('{"proseWrap":"preserve"}')
    (wiki / ".markdownlint-cli2.jsonc").write_text('{"config":{"default":false,"MD013":{"line_length":20}}}')
    result = formatter().format_source("note.md", "# Synthetic\n\na synthetic paragraph that deliberately exceeds twenty columns\n", None)
    assert result.outcome == "ok"
    assert any(d.severity == "warning" for d in result.diagnostics)


def test_real_helper_configured_gitignore_and_root_globs_never_touch_second_note(wiki):
    (wiki / ".markdownlint-cli2.jsonc").write_text('{"gitignore":true,"globs":["**/*.md"]}')
    (wiki / ".gitignore").write_text("note.md\n")
    (wiki / ".prettierignore").write_text("note.md\n")
    (wiki / "second.md").write_text("# untouched synthetic   ")
    result = formatter().format_source("note.md", "# Synthetic   ", None)
    assert result.outcome == "skipped" and result.source == "# Synthetic   "
    assert (wiki / "second.md").read_text() == "# untouched synthetic   "


def test_real_helper_root_gitignore_skips_prettier_independently_of_lint(wiki):
    (wiki / ".gitignore").write_text("note.md\n")
    (wiki / ".markdownlint-cli2.jsonc").write_text('{"config":{"default":false}}')
    source = "* Synthetic"
    result = formatter().format_source("note.md", source, None)
    assert result.outcome == "ok" and result.source == source
    assert [d.code for d in result.diagnostics] == ["prettier-skipped"]


@pytest.mark.parametrize("before,after,code", [
    ("---\nx: true\n---\n", "---\nx: 1\n---\n", "metadata_changed"),
    ("---\nx: 2026-10-25\n---\n", '---\nx: "2026-10-25"\n---\n', None),
    ("---\nunknown: {nested: [1, false, null]}\n---\n", "---\nunknown:\n  nested: [1, false, null]\n---\n", None),
    ("[label](one.md) [[Two|label]] ![image](image.png)", "[label](other.md) [[Two|label]] ![image](image.png)", "link_destination_changed"),
    ("`[fake](one.md)`\n\n```\n[[Fake]]\n```", "`[fake](two.md)`\n\n```\n[[Other]]\n```", None),
    ("[[One|alias]]", "[[Two|alias]]", "link_destination_changed"),
    ("[reference][id]\n\n[id]: one.md", "[reference][id]\n\n[id]: two.md", "link_destination_changed"),
])
def test_preservation_compares_typed_yaml_and_syntax_links(before, after, code):
    diagnostics = formatter().compare_preservation(before, after)
    assert [d.code for d in diagnostics] == ([code] if code else [])


def test_metadata_diagnostic_position_refers_to_note_line():
    source = "---\nx: !!python/object:unsafe {}\n---\n"
    diagnostic = formatter().compare_preservation(source, source)[0]
    assert diagnostic.line == 2 and diagnostic.column == 4
    assert "unsafe" not in diagnostic.message


@pytest.mark.parametrize("yaml", ["x: [", "x: 1\nx: 2", "x: !!python/object:unsafe {}", "x: &a [*a]", "x: " + "[" * 34 + "0" + "]" * 34, "x: &a 1\ny: [" + ",".join(["*a"] * 51) + "]", "x: " + "a" * (256 * 1024)])
def test_malformed_or_unbounded_front_matter_fails_without_transforming(wiki, yaml):
    source = "---\n" + yaml + "\n---\n# Synthetic"
    result = formatter().format_source("note.md", source, None)
    assert result.outcome == "failed"
    assert result.source == source
    assert result.diagnostics[0].code.startswith("metadata_")


def test_approved_nested_config_data_refs_and_absence_are_revalidated(wiki):
    f = formatter()
    (wiki / "folder").mkdir()
    (wiki / ".prettierrc").write_text('{"extends":"./style.json"}')
    (wiki / "style.json").write_text('{"printWidth":42}')
    snap = f.snapshot_config("folder/note.md")
    assert snap.files["style.json"] == '{"printWidth":42}'
    assert snap.revalidate()
    (wiki / "folder/.prettierrc").write_text('{}')
    assert not snap.revalidate()


@pytest.mark.parametrize("nested", [False, True])
def test_package_config_references_are_rejected_before_any_reader_call(wiki, monkeypatch, nested):
    f = formatter()
    if nested:
        (wiki / "styles").mkdir()
        (wiki / ".prettierrc").write_text('{"extends":"./styles/base.json"}')
        (wiki / "styles/base.json").write_text('{"extends":"./package.json"}')
        forbidden = "styles/package.json"
    else:
        (wiki / ".prettierrc").write_text('{"extends":"./package.json"}')
        forbidden = "package.json"
    (wiki / forbidden).write_text('{}')
    attempted = []
    real_reader = f.read_regular
    def observed_reader(path, **kwargs):
        attempted.append(path)
        return real_reader(path, **kwargs)
    monkeypatch.setattr(f, "read_regular", observed_reader)
    source = "# Synthetic\r\n* draft\nlast"
    result = f.format_source("note.md", source, None)
    assert forbidden not in attempted
    assert result.outcome == "failed" and result.source == source
    assert result.diagnostics[0].code == "config_reference_denied"


def test_real_helper_editorconfig_unset_restores_defaults_and_prettier_precedence(wiki):
    (wiki / "nested").mkdir()
    (wiki / ".editorconfig").write_text("root=true\n[*.md]\nend_of_line=crlf\nmax_line_length=24\n")
    (wiki / "nested/.editorconfig").write_text("[*.md]\nend_of_line=unset\nmax_line_length=unset\n")
    source = "# Synthetic\n\none two three four five six seven eight nine ten eleven twelve thirteen fourteen"
    result = formatter().format_source("nested/note.md", source, None)
    assert result.outcome == "ok"
    assert "\r" not in result.source
    assert result.source.splitlines()[2] == "one two three four five six seven eight nine ten eleven twelve thirteen fourteen"
    (wiki / ".prettierrc").write_text('{"endOfLine":"crlf","printWidth":30,"proseWrap":"always"}')
    explicit = formatter().format_source("nested/note.md", source, None)
    assert explicit.outcome == "ok" and "\r\n" in explicit.source
    assert max(map(len, explicit.source.splitlines()[2:])) <= 30


def test_yaml_prettierrc_is_data_and_reference_bytes_are_revalidated(wiki):
    (wiki / ".prettierrc").write_text("extends: ./style.yaml\n")
    (wiki / "style.yaml").write_text("printWidth: 42\n")
    snap = formatter().snapshot_config("note.md")
    assert snap.revalidate()
    (wiki / "style.yaml").write_text("printWidth: 43\n")
    assert not snap.revalidate()


def test_config_reference_depth_and_present_file_counts_are_bounded(wiki):
    f = formatter()
    (wiki / ".prettierrc").write_text('{"extends":"./style-1.json"}')
    for n in range(1, 9):
        (wiki / f"style-{n}.json").write_text(json.dumps({"extends":f"./style-{n+1}.json"}) if n < 8 else '{}')
    with pytest.raises(f.FormatFailure, match="config_reference_depth"):
        f.snapshot_config("note.md")
    for n in range(32):
        (wiki / f"style-{n}.json").write_text('{}')
    (wiki / ".prettierrc").write_text(json.dumps({"extends":[f"./style-{n}.json" for n in range(32)]}))
    with pytest.raises(f.FormatFailure, match="config_file_limit"):
        f.snapshot_config("note.md")


def test_real_helper_preserves_unknown_yaml_types_and_parsed_links(wiki):
    source = '---\nunknown: {nested: [1, true, null, "1", 1.5]}\ndate: 2026-10-25\n---\n# Synthetic\n\n[label](a%20b.md#heading) [[Two|alias]] ![image](image.png)\n'
    result = formatter().format_source("note.md", source, None)
    assert result.outcome == "ok"
    assert formatter().compare_preservation(source, result.source) == []


@pytest.mark.parametrize("replacement,code", [
    ('---\nx: "1"\n---\n# Synthetic\n', "metadata_changed"),
    ('---\nx: 1\n---\n# Synthetic\n\n[link](other.md)\n', "link_destination_changed"),
])
def test_helper_preservation_conflicts_keep_submitted_source_and_proposed_diff(wiki, monkeypatch, replacement, code):
    f = formatter()
    source = "---\nx: 1\n---\n# Synthetic\n\n[link](one.md)\n"
    monkeypatch.setattr(f, "_run_helper", lambda payload: {"source":replacement,"outcome":"ok","diagnostics":[]})
    result = f.format_source("note.md", source, None)
    assert result.outcome == "failed" and result.source == source and result.diff
    assert code in [d.code for d in result.diagnostics]


def test_helper_diagnostic_flood_is_rejected(wiki, monkeypatch):
    f = formatter()
    monkeypatch.setattr(f, "_run_helper", lambda payload: {"source":payload["source"],"outcome":"ok","diagnostics":[{"code":"warning","message":"synthetic","severity":"warning"}] * 201})
    result = f.format_source("note.md", "# Synthetic", None)
    assert result.outcome == "failed" and result.source == "# Synthetic"
    assert result.diagnostics[0].code == "formatter_diagnostic_limit"


@pytest.mark.parametrize("config", ['{"extends":"../outside.json"}', '{"extends":"some-module"}', '{"extends":"./.env"}', '{"extends":"./loop.json"}'])
def test_unsafe_reference_graph_retains_source(wiki, config):
    (wiki / ".prettierrc").write_text(config)
    (wiki / "loop.json").write_text('{"extends":"./.prettierrc"}')
    result = formatter().format_source("note.md", "# Synthetic", None)
    assert result.outcome == "failed"
    assert result.source == "# Synthetic"


def test_config_symlink_fifo_and_oversize_are_denied(wiki):
    import os
    (wiki / "data.json").write_text('{}')
    (wiki / ".prettierrc").symlink_to(wiki / "data.json")
    assert formatter().format_source("note.md", "# Synthetic", None).outcome == "failed"
    (wiki / ".prettierrc").unlink()
    os.mkfifo(wiki / ".prettierrc")
    assert formatter().format_source("note.md", "# Synthetic", None).outcome == "failed"
    (wiki / ".prettierrc").unlink()
    (wiki / ".prettierrc").write_bytes(b" " * 65537)
    assert formatter().format_source("note.md", "# Synthetic", None).outcome == "failed"


@pytest.mark.django_db
def test_executable_formatter_config_is_rejected_and_never_served_as_content(reader, wiki):
    (wiki / "prettier.config.js").write_text('throw new Error("synthetic executable must never run")')
    result = formatter().format_source("note.md", "# Synthetic", None)
    assert result.outcome == "failed" and result.diagnostics[0].code == "config_executable_denied"
    assert reader.get("/source/prettier.config.js").status_code == 404


def test_config_change_during_helper_rejects_result(wiki, monkeypatch):
    f = formatter()
    real = f._run_helper
    def changed(payload):
        result = real(payload)
        (wiki / ".prettierrc").write_text('{}')
        return result
    monkeypatch.setattr(f, "_run_helper", changed)
    result = f.format_source("note.md", "# Synthetic", None)
    assert result.source == "# Synthetic"
    assert result.outcome == "failed"
    assert result.diagnostics[-1].code == "config_changed"


@pytest.mark.parametrize("program,code", [
    ("import time; time.sleep(2)", "formatter_timeout"),
    ("import sys; sys.stdout.write('x'*100000)", "formatter_output_limit"),
    ("print('not json with synthetic private contents')", "formatter_protocol"),
])
def test_process_limits_and_errors_never_echo_process_output(wiki, monkeypatch, program, code):
    f = formatter()
    monkeypatch.setattr(f, "_HELPER_COMMAND", (sys.executable, "-c", program))
    monkeypatch.setattr(f, "_TIMEOUT", 0.1)
    monkeypatch.setattr(f, "_OUTPUT_LIMIT", 4096)
    source = "# Synthetic\r\n* draft\nlast"
    result = f.format_source("note.md", source, None)
    assert result.source == source and result.outcome == "failed"
    assert result.diagnostics[0].code == code
    assert "private" not in str(result.diagnostics)


def test_helper_uses_private_application_scratch_and_cleans_it(wiki, settings, monkeypatch):
    f = formatter()
    program = (
        "import json,os,pathlib,stat,sys; "
        "data=json.load(sys.stdin); here=pathlib.Path.cwd(); "
        f"assert here.parent == pathlib.Path({str(settings.BACKSTORY_DATA_DIR)!r}); "
        "assert stat.S_IMODE(here.stat().st_mode) == 0o700; "
        "assert pathlib.Path(os.environ['TMPDIR']) == here; "
        "assert pathlib.Path(os.readlink('/proc/self/fd/0')).parent == here; "
        "print(json.dumps({'source':data['source']+'\\n','outcome':'ok','diagnostics':[]}))"
    )
    monkeypatch.setattr(f, "_HELPER_COMMAND", (sys.executable, "-c", program))
    result = f.format_source("note.md", "# Synthetic", None)
    assert result.outcome == "ok"
    assert list(settings.BACKSTORY_DATA_DIR.iterdir()) == []


@pytest.mark.parametrize("source", ["# Synthetic\nlast", "# Synthetic\r\nlast\r\n", "# Synthetic\r\n\nlast", "\ufeff# Synthetic\nlast"])
def test_bom_and_newline_formatting_returns_visible_diff(wiki, source):
    result = formatter().format_source("note.md", source, None)
    assert result.outcome == "ok"
    assert result.source.startswith("\ufeff") == source.startswith("\ufeff")
    assert result.diff


@pytest.mark.django_db
def test_format_http_is_authenticated_csrf_protected_and_never_writes(reader, wiki, monkeypatch):
    from django.test import Client
    f = formatter()
    (wiki / "note.md").write_text("original synthetic")
    assert Client().post("/format/note.md").status_code == 302
    strict = Client(enforce_csrf_checks=True)
    strict.cookies = reader.cookies
    assert strict.post("/format/note.md", data='{"source":"# Synthetic"}', content_type="application/json").status_code == 403
    response = reader.post("/format/note.md", data='{"source":"# Synthetic"}', content_type="application/json")
    assert response.status_code == 200
    assert response.json()["outcome"] == "ok"
    assert (wiki / "note.md").read_text() == "original synthetic"
    assert response["Cache-Control"] == "no-store"
    assert reader.get("/format/note.md").status_code == 405
    assert reader.post("/format/.prettierrc", data='{"source":"text"}', content_type="application/json").status_code == 404
    monkeypatch.setattr(f, "_run_helper", lambda payload: pytest.fail("opening/preview invoked formatter"))
    assert reader.get("/notes/note.md").status_code == 200
    assert reader.post("/preview/note.md", data='{"source":"draft"}', content_type="application/json").status_code == 200


@pytest.mark.django_db
def test_format_http_validates_size_json_and_readiness(reader, wiki, settings):
    for body in ["[]", "{}", "{", '{"source":3}']:
        assert reader.post("/format/note.md", data=body, content_type="application/json").status_code == 400
    settings.BACKSTORY_NOTE_MAX_BYTES = 8
    assert reader.post("/format/note.md", data=json.dumps({"source":"long synthetic"}), content_type="application/json").status_code == 413
    (wiki / ".backstory-marker").unlink()
    assert reader.post("/format/note.md", data='{"source":"draft"}', content_type="application/json").status_code == 503
