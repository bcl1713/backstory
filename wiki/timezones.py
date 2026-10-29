"""Persisted wiki dates, independent of an editor's current travel timezone."""
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from django.conf import settings
from .contracts import StorageError
from .models import WikiSettings
from .relocations import wiki_write_lock


def valid_timezone(value):
    if not isinstance(value, str) or not value or len(value) > 128 or (value != 'UTC' and '/' not in value):
        raise StorageError('invalid_wiki_timezone')
    try:
        ZoneInfo(value)
    except (ZoneInfoNotFoundError, ValueError):
        raise StorageError('invalid_wiki_timezone') from None
    return value


def timezone_state():
    explicit = settings.BACKSTORY_WIKI_TIMEZONE
    if explicit:
        return {'timezone': valid_timezone(explicit), 'source': 'environment'}
    saved = WikiSettings.objects.filter(pk=1).values_list('timezone', flat=True).first()
    return {'timezone': valid_timezone(saved), 'source': 'saved'} if saved else {'timezone': 'UTC', 'source': 'fallback'}


def change_timezone(value, *, initialize=False, expected=None):
    value = valid_timezone(value)
    # Same global lock as saves: a successful save uses one zone snapshot,
    # and concurrent browser initialization is first-writer-wins.
    with wiki_write_lock():
        current = timezone_state()
        if current['source'] == 'environment':
            raise StorageError('wiki_timezone_environment_locked', 409)
        if initialize and current['source'] == 'saved':
            return current
        if not initialize and expected != current['timezone']:
            raise StorageError('wiki_timezone_changed', 409)
        WikiSettings.objects.update_or_create(pk=1, defaults={'timezone': value})
        return timezone_state()
