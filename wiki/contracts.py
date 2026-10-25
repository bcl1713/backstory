"""Small immutable boundaries shared by storage and later editing/indexing code."""
from dataclasses import dataclass
from datetime import datetime


class StorageError(Exception):
    """Public diagnostics carry fixed reason codes, never OS messages or paths."""
    def __init__(self, reason_code, status=400):
        self.reason_code = reason_code
        self.status = status
        super().__init__(reason_code)


class PathDenied(StorageError):
    def __init__(self):
        super().__init__("path_denied", 404)


class StorageUnavailable(StorageError):
    def __init__(self, reason_code):
        super().__init__(reason_code, 503)


class CursorInvalid(StorageError):
    def __init__(self):
        super().__init__("cursor_invalid", 409)


@dataclass(frozen=True)
class Readiness:
    state: str
    reason_code: str
    checked_at: datetime


@dataclass(frozen=True)
class NoteSnapshot:
    path: str
    source: str
    raw_bytes: bytes
    revision: str
    bom: bool
    newline: str


@dataclass(frozen=True)
class FolderEntry:
    path: str
    name: str
    kind: str


@dataclass(frozen=True)
class FolderPage:
    path: str
    entries: tuple[FolderEntry, ...]
    next_cursor: str | None
