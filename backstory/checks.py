import sqlite3
from django.core.checks import Error, register


@register()
def sqlite_fts5(app_configs, **kwargs):
    try:
        with sqlite3.connect(":memory:") as connection:
            connection.execute("CREATE VIRTUAL TABLE fts_check USING fts5(content)")
    except sqlite3.DatabaseError:
        return [Error("SQLite FTS5 support is required", id="backstory.E001")]
    return []


@register()
def deployment_security(app_configs, **kwargs):
    from django.conf import settings
    if settings.BACKSTORY_COOKIE_MODE == 'localhost':
        return []
    unsafe = (not settings.SESSION_COOKIE_SECURE or not settings.CSRF_COOKIE_SECURE
        or not settings.SESSION_COOKIE_HTTPONLY or not settings.CSRF_COOKIE_HTTPONLY
        or settings.SESSION_COOKIE_SAMESITE != 'Lax' or settings.CSRF_COOKIE_SAMESITE != 'Lax'
        or not settings.SECURE_SSL_REDIRECT or not settings.ALLOWED_HOSTS
        or any('*' in host for host in settings.ALLOWED_HOSTS)
        or any(not origin.startswith('https://') or '*' in origin for origin in settings.CSRF_TRUSTED_ORIGINS)
        or settings.SECURE_PROXY_SSL_HEADER is not None or settings.USE_X_FORWARDED_HOST
        or settings.BACKSTORY_PROXY_MODE != 'off')
    return [Error('Insecure production cookie/host/origin/proxy configuration', id='backstory.E002')] if unsafe else []
