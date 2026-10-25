"""Snapshot approved data; run the packaged formatter without live wiki access."""
from dataclasses import dataclass
import difflib
import hashlib
import json
import os
from pathlib import Path
import posixpath
import re
import selectors
import shutil
import signal
import subprocess
import tempfile
import time

from django.conf import settings

from .contracts import Diagnostic, FormatResult, StorageError
from .metadata import MetadataError, parse_front_matter, yaml_data
from .policy import CONFIG_NAMES, validate_path
from .storage import read_regular, require_ready

_HELPER_COMMAND = (shutil.which("node") or "/usr/bin/node", "--max-old-space-size=256", str(Path(__file__).resolve().parent.parent / "formatter/main.mjs"))
_TIMEOUT = 10
_OUTPUT_LIMIT = 8 * 1024 * 1024
_CONFIG_BYTES = 65536
_CONFIG_FILES = 32
_UNSAFE_SUFFIXES = (".js", ".cjs", ".mjs", ".ts", ".cts", ".mts", ".json5")
_PLAIN_FILES = {".prettierignore", ".markdownlintignore", ".gitignore", ".editorconfig"}


class FormatFailure(Exception):
    def __init__(self, code):
        self.code = code
        super().__init__(code)


def _jsonc(text):
    """Strip JSONC comments/trailing commas without touching string contents."""
    chars = list(text)
    index = 0
    quoted = False
    while index < len(chars):
        char = chars[index]
        if quoted:
            if char == "\\":
                index += 2
                continue
            if char == '"':
                quoted = False
        elif char == '"':
            quoted = True
        elif char == "/" and index + 1 < len(chars) and chars[index + 1] in {"/", "*"}:
            block = chars[index + 1] == "*"
            end = text.find("*/", index + 2) if block else text.find("\n", index + 2)
            if end == -1:
                if block:
                    raise FormatFailure("config_parse_error")
                end = len(chars)
            else:
                end += 2 if block else 0
            for offset in range(index, end):
                if chars[offset] not in "\r\n":
                    chars[offset] = " "
            index = end
            continue
        index += 1
    text = "".join(chars)
    quoted = False
    index = 0
    while index < len(chars):
        if quoted:
            if chars[index] == "\\":
                index += 2
                continue
            if chars[index] == '"':
                quoted = False
        elif chars[index] == '"':
            quoted = True
        elif chars[index] == "," and re.match(r"\s*[}\]]", text[index + 1:]):
            chars[index] = " "
        index += 1
    return json.loads("".join(chars), object_pairs_hook=_unique_pairs)


def _unique_pairs(pairs):
    result = {}
    for key, value in pairs:
        if key in result or key in {"__proto__", "prototype", "constructor"}:
            raise FormatFailure("config_unsafe")
        result[key] = value
    return result


def _read_config(path):
    purpose = "config" if posixpath.basename(path) in CONFIG_NAMES else "config-reference"
    try:
        return read_regular(path, purpose=purpose, max_bytes=_CONFIG_BYTES, too_large_code="config_size_limit")
    except StorageError as error:
        if error.reason_code == "not_found":
            return None
        raise FormatFailure("config_unsafe" if error.reason_code == "path_denied" else "config_unavailable") from None


@dataclass(frozen=True)
class ConfigSnapshot:
    files: dict[str, str]
    observations: dict[str, bytes | None]
    digest: str

    def revalidate(self):
        try:
            return all(_read_config(path) == raw for path, raw in self.observations.items())
        except FormatFailure:
            return False


def snapshot_config(path):
    validate_path(path, "content")
    parts = path.split("/")[:-1]
    if len(parts) > 16:
        raise FormatFailure("config_ancestry_limit")
    files = {}
    observations = {}
    completed = set()

    def visit(candidate, stack=()):
        if len(stack) >= 8:
            raise FormatFailure("config_reference_depth")
        if candidate in stack:
            raise FormatFailure("config_reference_cycle")
        if candidate in completed:
            return
        if candidate not in observations:
            observations[candidate] = _read_config(candidate)
        raw = observations[candidate]
        if raw is None:
            if stack:
                raise FormatFailure("config_reference_missing")
            return
        if candidate.endswith(_UNSAFE_SUFFIXES):
            raise FormatFailure("config_executable_denied")
        if len(files) >= _CONFIG_FILES:
            raise FormatFailure("config_file_limit")
        try:
            text = raw.decode("utf-8-sig", errors="strict")
        except UnicodeError:
            raise FormatFailure("config_encoding") from None
        files[candidate] = text
        if posixpath.basename(candidate) not in _PLAIN_FILES:
            try:
                is_yaml = candidate.endswith((".yaml", ".yml")) or (posixpath.basename(candidate) == ".prettierrc" and not text.lstrip().startswith(("{", "[", "/")))
                data = yaml_data(text) if is_yaml else _jsonc(text)
            except (ValueError, RecursionError):
                raise FormatFailure("config_parse_error") from None
            if not isinstance(data, dict):
                raise FormatFailure("config_data_required")

            def references(value, depth=0):
                if depth > 32:
                    raise FormatFailure("config_structure_limit")
                if isinstance(value, list):
                    for item in value:
                        yield from references(item, depth + 1)
                elif isinstance(value, dict):
                    for key, item in value.items():
                        if key in {"extends", "configFile"}:
                            refs = item if isinstance(item, list) else [item]
                            for ref in refs:
                                if not isinstance(ref, str) or not ref.startswith(("./", "../")) or "\\" in ref or len(ref) > 4096:
                                    raise FormatFailure("config_reference_denied")
                                resolved = posixpath.normpath(posixpath.join(posixpath.dirname(candidate), ref))
                                try:
                                    validate_path(resolved, "config-reference")
                                except StorageError:
                                    raise FormatFailure("config_reference_denied") from None
                                yield resolved
                        else:
                            yield from references(item, depth + 1)
            for ref in references(data):
                visit(ref, (*stack, candidate))
        completed.add(candidate)

    for depth in range(len(parts) + 1):
        parent = "/".join(parts[:depth])
        for name in sorted(CONFIG_NAMES):
            visit(parent + "/" + name if parent else name)
    digest = hashlib.sha256()
    for candidate, raw in sorted(observations.items()):
        digest.update(candidate.encode("utf-8") + b"\0")
        digest.update(b"absent\0" if raw is None else b"present\0" + hashlib.sha256(raw).digest())
    return ConfigSnapshot(files, observations, digest.hexdigest())


def _run_helper(payload):
    """Bound stdout while it arrives; stderr is discarded, never surfaced/logged."""
    encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    settings.BACKSTORY_DATA_DIR.mkdir(mode=0o700, parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="formatter-", dir=settings.BACKSTORY_DATA_DIR) as scratch, tempfile.TemporaryFile(dir=scratch) as incoming:
        incoming.write(encoded)
        incoming.seek(0)
        with subprocess.Popen(_HELPER_COMMAND, stdin=incoming, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
                              cwd=scratch, env={"PATH": os.defpath, "LANG": "C.UTF-8", "TMPDIR": scratch}, start_new_session=True) as process:
            output = bytearray()
            deadline = time.monotonic() + _TIMEOUT
            selector = selectors.DefaultSelector()
            selector.register(process.stdout, selectors.EVENT_READ)
            try:
                while selector.get_map():
                    remaining = deadline - time.monotonic()
                    if remaining <= 0:
                        raise FormatFailure("formatter_timeout")
                    for key, _ in selector.select(remaining):
                        chunk = os.read(key.fd, 65536)
                        if not chunk:
                            selector.unregister(key.fileobj)
                            break
                        output.extend(chunk)
                        if len(output) > _OUTPUT_LIMIT:
                            raise FormatFailure("formatter_output_limit")
                try:
                    process.wait(timeout=max(0.001, deadline - time.monotonic()))
                except subprocess.TimeoutExpired:
                    raise FormatFailure("formatter_timeout") from None
                if process.returncode:
                    raise FormatFailure("formatter_process_failed")
            finally:
                selector.close()
                if process.poll() is None:
                    os.killpg(process.pid, signal.SIGKILL)
                    process.wait()
    try:
        return json.loads(output)
    except (ValueError, UnicodeError, RecursionError):
        raise FormatFailure("formatter_protocol") from None


def _destinations(body):
    from .markdown import _parser
    parser = _parser()
    parser.validateLink = lambda value: True
    env = {}
    tokens = parser.parse(body, env)
    result = []
    visited = 0
    def walk(items):
        nonlocal visited
        for token in items:
            visited += 1
            if visited > 100000:
                raise FormatFailure("preservation_structure_limit")
            if token.type == "link_open":
                result.append(("link", token.attrGet("href")))
            elif token.type == "image":
                result.append(("image", token.attrGet("src")))
            elif token.type == "wiki_link":
                result.append(("wiki", token.content.partition("|")[0]))
            if token.children:
                walk(token.children)
    walk(tokens)
    return result


def compare_preservation(before, after):
    try:
        original = parse_front_matter(before)
        formatted = parse_front_matter(after)
        diagnostics = []
        if original.present != formatted.present or original.tree != formatted.tree:
            diagnostics.append(Diagnostic("metadata_changed", "Formatting changed front matter meaning or scalar tags."))
        if _destinations(original.body) != _destinations(formatted.body):
            diagnostics.append(Diagnostic("link_destination_changed", "Formatting changed a parsed link destination."))
        return diagnostics
    except MetadataError as error:
        return [error.diagnostic]
    except (ValueError, RecursionError, FormatFailure):
        return [Diagnostic("preservation_parse_failed", "Link preservation could not be checked safely.")]


def _diagnostics(value):
    if not isinstance(value, list) or len(value) > 200:
        raise FormatFailure("formatter_diagnostic_limit")
    result = []
    for item in value:
        if not isinstance(item, dict) or not isinstance(item.get("code"), str) or not re.fullmatch(r"[A-Za-z0-9_-]{1,80}", item["code"]):
            raise FormatFailure("formatter_protocol")
        if item.get("severity") not in {"info", "warning", "error"} or not isinstance(item.get("message"), str) or len(item["message"]) > 512:
            raise FormatFailure("formatter_protocol")
        positions = {}
        for name in ("line", "column"):
            number = item.get(name)
            if number is not None and (type(number) is not int or not 1 <= number <= 10_000_000):
                raise FormatFailure("formatter_protocol")
            positions[name] = number
        message = "".join(char for char in item["message"] if ord(char) >= 32 and ord(char) != 127)
        result.append(Diagnostic(item["code"], message, item["severity"], **positions))
    return tuple(result)


def format_source(path, source, original=None):
    validate_path(path, "content")
    require_ready()
    digest = ""
    candidate = source
    try:
        if not isinstance(source, str) or len(source.encode("utf-8")) > settings.BACKSTORY_NOTE_MAX_BYTES:
            raise FormatFailure("note_too_large")
        parse_front_matter(source)
        snapshot = snapshot_config(path)
        digest = snapshot.digest
        result = _run_helper({"path": path, "source": source, "files": snapshot.files})
        if not isinstance(result, dict) or result.get("outcome") not in {"ok", "skipped", "failed"} or not isinstance(result.get("source"), str):
            raise FormatFailure("formatter_protocol")
        candidate = result["source"]
        if len(candidate.encode("utf-8")) > settings.BACKSTORY_NOTE_MAX_BYTES:
            raise FormatFailure("formatter_output_limit")
        diagnostics = _diagnostics(result.get("diagnostics"))
        outcome = result["outcome"]
        # NoteSnapshot.source excludes the on-disk BOM. Retain that representation
        # for the writer; an explicitly submitted BOM remains in returned text.
        if source.startswith("\ufeff") and not candidate.startswith("\ufeff"):
            candidate = "\ufeff" + candidate
        if not source.startswith("\ufeff") and candidate.startswith("\ufeff"):
            candidate = candidate[1:]
        preservation = compare_preservation(source, candidate)
        diagnostics += tuple(preservation)
        if not snapshot.revalidate():
            diagnostics += (Diagnostic("config_changed", "Formatting configuration changed. Retry formatting or recover the submitted source."),)
            outcome = "failed"
        if preservation or any(item.severity == "error" for item in diagnostics):
            outcome = "failed"
        diff = "".join(difflib.unified_diff(source.splitlines(keepends=True), candidate.splitlines(keepends=True), fromfile="submitted", tofile="formatted"))
        return FormatResult(source if outcome == "failed" else candidate, diagnostics, diff, outcome, digest)
    except MetadataError as error:
        return FormatResult(source, (error.diagnostic,), "", "failed", digest)
    except (FormatFailure, OSError, UnicodeError) as error:
        code = error.code if isinstance(error, FormatFailure) else "formatter_unavailable"
        return FormatResult(source, (Diagnostic(code, "Formatting was not accepted. Submitted source remains available."),), "", "failed", digest)
