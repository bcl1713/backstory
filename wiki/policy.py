"""Shared default-deny filesystem policy.

All hidden components, agent rules, dependency/backup/sync directories and known
credential/key/config names are denied, regardless of a Markdown extension.
Admin exclusions add denies (root-relative glob patterns or directory prefixes).
A separate config purpose admits only approved data files; content/identity
purposes can never use that exception. No URL unquoting occurs here: Django has
already decoded the request path once. Literal percent sequences are filenames.
"""
import fnmatch
import hashlib
import json
import re
from urllib.parse import unquote_to_bytes

from django.conf import settings
from django.core.exceptions import PermissionDenied

from .contracts import PathDenied

_DENIED_NAMES = {
    "agents.md", "claude.md", "gemini.md", "skill.md", "agents", "agent-rules",
    "node_modules", "vendor", "venv", "env", "__pycache__", "bower_components",
    "backups", "backup", "lost+found", "system volume information", "$recycle.bin",
    "syncthing", "sync", "sync-conflicts", "credentials", "secrets", "config",
    "id_rsa", "id_dsa", "id_ecdsa", "id_ed25519", "authorized_keys", "known_hosts",
    "ssh_config", "sshd_config", "passwd", "shadow", "npmrc", "netrc",
}
_DENIED_PATTERNS = (
    "credentials.*", "credential.*", "secrets.*", "secret.*", "password*",
    "config.*", "auth.*", "authentication.*", "token.*", "tokens.*", "key.*", "keys.*",
    "api-key*", "api_key*", "service-account*", "service_account*", "*.key", "*.pem", "*.p12", "*.pfx", "*.keystore", "*.kdbx",
    "*.bak", "*.backup", "*sync-conflict*", "syncthing*",
)
CONFIG_NAMES = frozenset({
    ".prettierrc", ".markdownlint-cli2.jsonc", ".prettierignore", ".markdownlintignore",
    ".editorconfig", ".gitignore",
})
_POLICY_VERSION = "1"


def policy_version():
    return hashlib.sha256(json.dumps([_POLICY_VERSION, list(settings.BACKSTORY_EXCLUSIONS)], ensure_ascii=True).encode()).hexdigest()


def validate_path(path: str, purpose: str):
    if purpose not in {"content", "folder", "identity", "config"}:
        raise PathDenied()
    if not isinstance(path, str) or len(path) > 4096:
        raise PathDenied()
    try:
        path.encode("utf-8", errors="strict")
    except UnicodeError:
        raise PathDenied() from None
    if not path:
        if purpose == "folder":
            return path
        raise PathDenied()
    parts = path.split("/")
    if any(part in {"", ".", ".."} for part in parts) or "\\" in path or any(ord(char) < 32 or ord(char) == 127 for char in path):
        raise PathDenied()
    if purpose == "config":
        if path not in CONFIG_NAMES:
            raise PathDenied()
        return path
    for part in parts:
        lowered = part.casefold()
        if part.startswith(".") or lowered in _DENIED_NAMES or any(fnmatch.fnmatchcase(lowered, pattern) for pattern in _DENIED_PATTERNS):
            raise PathDenied()
    for pattern in settings.BACKSTORY_EXCLUSIONS:
        pattern = pattern.rstrip("/")
        if pattern and (path == pattern or path.startswith(pattern + "/") or fnmatch.fnmatchcase(path, pattern)):
            raise PathDenied()
    return path


def authorize_content(request, path, purpose="content"):
    """Every later route must call this before any content operation."""
    if not request.user.is_authenticated or not request.user.is_active:
        raise PermissionDenied
    # Gunicorn retains the original spelling. Validate its encoding separately:
    # Django may repair invalid UTF-8 bytes into percent-spelled path characters.
    # Never use this decoded raw URI as a filesystem path or decode `path` again.
    raw_uri = request.META.get("RAW_URI", request.META.get("REQUEST_URI"))
    if raw_uri is not None:
        raw_path = raw_uri.split("?", 1)[0]
        if re.search(r"%(?![0-9a-fA-F]{2})", raw_path):
            raise PathDenied()
        try:
            unquote_to_bytes(raw_path).decode("utf-8", errors="strict")
        except UnicodeError:
            raise PathDenied() from None
    return validate_path(path, purpose)
