"""Read-only storage marker diagnostics, safe for status pages and operators."""
from pathlib import Path

from django.conf import settings
from django.utils import timezone

from .contracts import Readiness, StorageError


def check_readiness() -> Readiness:
    from .storage import check_marker
    checked_at = timezone.now()
    wiki = Path(settings.BACKSTORY_WIKI_ROOT).resolve()
    data = Path(settings.BACKSTORY_DATA_DIR).resolve()
    if wiki.is_relative_to(data) or data.is_relative_to(wiki):
        return Readiness("unavailable", "roots_overlap", checked_at)
    try:
        check_marker()
    except StorageError as error:
        if error.reason_code == "not_found":
            reason = "marker_missing" if wiki.is_dir() else "root_missing"
        else:
            reason = "marker_unreadable"
        return Readiness("unavailable", reason, checked_at)
    return Readiness("ready", "marker_present", checked_at)
