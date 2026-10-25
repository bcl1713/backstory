"""Read-only storage identity diagnostics, safe for status pages and operators."""
import hashlib
import hmac
from pathlib import Path

from django.conf import settings
from django.utils import timezone

from .contracts import Readiness, StorageError


def check_readiness() -> Readiness:
    from .storage import read_regular
    checked_at = timezone.now()
    wiki = Path(settings.BACKSTORY_WIKI_ROOT).resolve()
    data = Path(settings.BACKSTORY_DATA_DIR).resolve()
    if wiki.is_relative_to(data) or data.is_relative_to(wiki):
        return Readiness("unavailable", "roots_overlap", checked_at)
    try:
        raw = read_regular(
            settings.BACKSTORY_IDENTITY_PATH,
            purpose="identity",
            max_bytes=min(settings.BACKSTORY_IDENTITY_MAX_BYTES, 65536),
            too_large_code="identity_too_large",
        )
    except StorageError as error:
        if error.reason_code == "not_found":
            reason = "identity_missing" if wiki.is_dir() else "root_missing"
        elif error.reason_code == "identity_too_large":
            reason = "identity_too_large"
        else:
            reason = "identity_unreadable"
        return Readiness("unavailable", reason, checked_at)
    if not hmac.compare_digest(hashlib.sha256(raw).hexdigest(), settings.BACKSTORY_IDENTITY_SHA256):
        return Readiness("unavailable", "identity_mismatch", checked_at)
    return Readiness("ready", "identity_verified", checked_at)
