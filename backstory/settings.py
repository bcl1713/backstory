"""Explicit storage and secure deployment defaults; never initialize wiki storage."""
import os
from pathlib import Path
import secrets
import tempfile

from django.core.exceptions import ImproperlyConfigured
from backstory.configuration import positive_integer, positive_seconds, PROXY_REMEDIES
from backstory.checks import (
    exact_host, exact_https_origin, host_source_configuration_errors,
    proxy_configuration_errors, safe_origin_bind,
)

BASE_DIR = Path(__file__).resolve().parent.parent


def required(name):
    value = os.environ.get(name, "").strip()
    if not value:
        raise ImproperlyConfigured(f"{name} must be explicitly configured")
    return value


def root(name):
    path = Path(required(name))
    if not path.is_absolute():
        raise ImproperlyConfigured(f"{name} must be an absolute path")
    try:
        return path.resolve()
    except (OSError, ValueError, RuntimeError):
        raise ImproperlyConfigured(f"{name} must be a resolvable absolute path; check the mount and directory access") from None


BACKSTORY_WIKI_ROOT = root("BACKSTORY_WIKI_ROOT")
BACKSTORY_DATA_DIR = root("BACKSTORY_DATA_DIR")
if BACKSTORY_WIKI_ROOT.is_relative_to(BACKSTORY_DATA_DIR) or BACKSTORY_DATA_DIR.is_relative_to(BACKSTORY_WIKI_ROOT):
    raise ImproperlyConfigured("BACKSTORY_WIKI_ROOT and BACKSTORY_DATA_DIR must not overlap; choose separate roots")
# Host bind sources are provenance, not paths accessible inside this container.
# Validate before creating private application state at the separate mount target.
BACKSTORY_STORAGE_SOURCE_MODE = os.environ.get('BACKSTORY_STORAGE_SOURCE_MODE', 'native')
BACKSTORY_WIKI_HOST_SOURCE = os.environ.get('BACKSTORY_WIKI_HOST_SOURCE')
BACKSTORY_DATA_HOST_SOURCE = os.environ.get('BACKSTORY_DATA_HOST_SOURCE')
_source_errors = host_source_configuration_errors(BACKSTORY_STORAGE_SOURCE_MODE,
    BACKSTORY_WIKI_HOST_SOURCE, BACKSTORY_DATA_HOST_SOURCE)
if _source_errors:
    raise ImproperlyConfigured('Invalid BACKSTORY host storage sources: ' + ', '.join(_source_errors)
        + '; BACKSTORY_STORAGE_SOURCE_MODE must be native without host metadata, or host-bind with '
        'BACKSTORY_WIKI_HOST_SOURCE and BACKSTORY_DATA_HOST_SOURCE set to disjoint canonical absolute '
        'host paths; use the supplied manifest to derive them from the bind sources')

# Administrative root marker: contents and legacy SHA-256 configuration are unused.
BACKSTORY_IDENTITY_PATH = os.environ.get("BACKSTORY_IDENTITY_PATH", ".backstory-marker")
if (not BACKSTORY_IDENTITY_PATH or "/" in BACKSTORY_IDENTITY_PATH
        or "\\" in BACKSTORY_IDENTITY_PATH or BACKSTORY_IDENTITY_PATH in {".", ".."}
        or any(ord(c) < 32 or ord(c) == 127 for c in BACKSTORY_IDENTITY_PATH)):
    raise ImproperlyConfigured("BACKSTORY_IDENTITY_PATH must be a filename in the wiki root")

BACKSTORY_COOKIE_MODE = os.environ.get("BACKSTORY_COOKIE_MODE", "https")
if BACKSTORY_COOKIE_MODE not in {"https", "localhost"}:
    raise ImproperlyConfigured("BACKSTORY_COOKIE_MODE must be https or localhost")
_local = BACKSTORY_COOKIE_MODE == "localhost"
ALLOWED_HOSTS = [host.strip() for host in required("BACKSTORY_ALLOWED_HOSTS").split(",") if host.strip()]
if not ALLOWED_HOSTS or not all(exact_host(host) for host in ALLOWED_HOSTS):
    raise ImproperlyConfigured("BACKSTORY_ALLOWED_HOSTS must contain exact hostnames or IPs without schemes, ports or wildcards")
if _local and any(host not in {"localhost", "127.0.0.1", "[::1]", "testserver"} for host in ALLOWED_HOSTS):
    raise ImproperlyConfigured("BACKSTORY_ALLOWED_HOSTS must contain only loopback hosts in BACKSTORY_COOKIE_MODE=localhost")

# Trust is explicit and applies only to the actual TCP peer. Never use Django's
# independent forwarding switches: the middleware validates before setting HTTPS.
BACKSTORY_PROXY_MODE = os.environ.get('BACKSTORY_PROXY_MODE', 'off')
BACKSTORY_TRUSTED_PROXY_IPS = tuple(value.strip() for value in os.environ.get(
    'BACKSTORY_TRUSTED_PROXY_IPS', '').split(',')) if os.environ.get('BACKSTORY_TRUSTED_PROXY_IPS') else ()
BACKSTORY_PROXY_CLIENT_IP_HEADER = os.environ.get('BACKSTORY_PROXY_CLIENT_IP_HEADER', 'none')
CSRF_TRUSTED_ORIGINS = [value.strip() for value in os.environ.get('BACKSTORY_CSRF_TRUSTED_ORIGINS', '').split(',') if value.strip()]
if not _local and not all(exact_https_origin(origin, ALLOWED_HOSTS) for origin in CSRF_TRUSTED_ORIGINS):
    raise ImproperlyConfigured("BACKSTORY_CSRF_TRUSTED_ORIGINS must contain exact HTTPS origins matching BACKSTORY_ALLOWED_HOSTS, without paths or trailing slashes")
SECURE_PROXY_SSL_HEADER = None
USE_X_FORWARDED_HOST = False
USE_X_FORWARDED_PORT = False
BACKSTORY_BIND_ADDRESS = os.environ.get('BACKSTORY_BIND_ADDRESS', '127.0.0.1')
if not safe_origin_bind(BACKSTORY_BIND_ADDRESS, BACKSTORY_COOKIE_MODE):
    raise ImproperlyConfigured('BACKSTORY_BIND_ADDRESS must be a literal IP; localhost cookies require a loopback bind')
_proxy_errors = proxy_configuration_errors(BACKSTORY_PROXY_MODE, BACKSTORY_COOKIE_MODE,
    ALLOWED_HOSTS, CSRF_TRUSTED_ORIGINS, BACKSTORY_TRUSTED_PROXY_IPS, BACKSTORY_PROXY_CLIENT_IP_HEADER)
if _proxy_errors:
    raise ImproperlyConfigured('Invalid BACKSTORY proxy configuration: '
        + '; '.join(f'{code}: {PROXY_REMEDIES[code]}' for code in _proxy_errors))

# Parse maintenance configuration before creating any private state.
BACKSTORY_INDEX_BATCH_SIZE = positive_integer("BACKSTORY_INDEX_BATCH_SIZE", 20)
BACKSTORY_INDEX_YIELD_SECONDS = positive_seconds("BACKSTORY_INDEX_YIELD_SECONDS", 1)
BACKSTORY_INDEX_INCREMENTAL_SECONDS = positive_integer("BACKSTORY_INDEX_INCREMENTAL_SECONDS", 300)
BACKSTORY_INDEX_VERIFY_SECONDS = positive_integer("BACKSTORY_INDEX_VERIFY_SECONDS", 86400)
BACKSTORY_INDEX_QUEUE_LIMIT = positive_integer("BACKSTORY_INDEX_QUEUE_LIMIT", 1000)
BACKSTORY_REVISION_QUOTA_BYTES = positive_integer("BACKSTORY_REVISION_QUOTA_BYTES", 64 * 1024 * 1024)


def persistent_secret():
    """Publish a complete secret atomically; concurrent startups keep the winner."""
    target = BACKSTORY_DATA_DIR / "application-secret"
    if not target.exists():
        fd, temporary = tempfile.mkstemp(prefix=".secret-", dir=BACKSTORY_DATA_DIR)
        try:
            with os.fdopen(fd, "w") as stream:
                stream.write(secrets.token_urlsafe(64))
                stream.flush()
                os.fsync(stream.fileno())
            try:
                os.link(temporary, target)
            except FileExistsError:
                pass
        finally:
            os.unlink(temporary)
    fd = os.open(target, os.O_RDONLY | os.O_NOFOLLOW)
    with os.fdopen(fd) as stream:
        value = stream.read(256)
    if len(value) < 64:
        raise ImproperlyConfigured("BACKSTORY_DATA_DIR application-secret is invalid; restore protected application state from backup")
    return value


try:
    BACKSTORY_DATA_DIR.mkdir(mode=0o700, parents=True, exist_ok=True)
    # A readable existing secret alone cannot establish that SQLite, drafts and
    # recovery state will be writable. Catch common UID/GID/mount errors early.
    if not os.access(BACKSTORY_DATA_DIR, os.R_OK | os.W_OK | os.X_OK):
        raise PermissionError
    SECRET_KEY = persistent_secret()
except (OSError, UnicodeError):
    raise ImproperlyConfigured("BACKSTORY_DATA_DIR must be a writable private directory with a readable application-secret; "
        "check its mount and effective UID/GID ownership; restore existing protected state from backup if damaged") from None
DEBUG = False
INSTALLED_APPS = [
    "django.contrib.auth", "django.contrib.contenttypes", "django.contrib.sessions",
    "django.contrib.staticfiles", "backstory.apps.BackstoryConfig", "accounts.apps.AccountsConfig", "axes", "wiki", "indexing",
]
MIDDLEWARE = [
    "backstory.middleware.ResponsePolicyMiddleware",
    "backstory.middleware.TrustedProxyMiddleware",
    "django.middleware.security.SecurityMiddleware", "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware", "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware", "django.contrib.auth.middleware.AuthenticationMiddleware",
    "accounts.middleware.SessionPolicyMiddleware", "django.middleware.clickjacking.XFrameOptionsMiddleware", "axes.middleware.AxesMiddleware",
]
ROOT_URLCONF = "backstory.urls"
TEMPLATES = [{"BACKEND": "django.template.backends.django.DjangoTemplates", "DIRS": [BASE_DIR / "templates"], "APP_DIRS": True,
              "OPTIONS": {"context_processors": ["django.template.context_processors.request", "django.contrib.auth.context_processors.auth"]}}]
WSGI_APPLICATION = "backstory.wsgi.application"
DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": BACKSTORY_DATA_DIR / "backstory.sqlite3", "OPTIONS": {"timeout": 10}}}
PASSWORD_HASHERS = ["django.contrib.auth.hashers.Argon2PasswordHasher"]
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 12}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]
LOGIN_URL = "/accounts/login/"
LOGIN_REDIRECT_URL = "/"
LOGOUT_REDIRECT_URL = LOGIN_URL
SESSION_ENGINE = "django.contrib.sessions.backends.db"
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_SECURE = not _local
SESSION_COOKIE_AGE = 12 * 60 * 60
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SECURE = not _local
SECURE_SSL_REDIRECT = not _local
SECURE_HSTS_SECONDS = 31536000 if not _local else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = not _local
SECURE_HSTS_PRELOAD = not _local
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
USE_TZ = True
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]
STORAGES = {"default": {"BACKEND": "django.core.files.storage.FileSystemStorage"}, "staticfiles": {"BACKEND": "whitenoise.storage.CompressedStaticFilesStorage"}}

# Content reads are bounded; exclusions only add denies.
BACKSTORY_NOTE_MAX_BYTES = 2 * 1024 * 1024
BACKSTORY_ATTACHMENT_MAX_BYTES = 64 * 1024 * 1024
BACKSTORY_ATTACHMENT_RANGE_MAX_BYTES = 8 * 1024 * 1024
# JSON can escape each source byte as six ASCII bytes; both source and transport
# remain bounded. Preview also enforces the decoded UTF-8 note limit.
DATA_UPLOAD_MAX_MEMORY_SIZE = BACKSTORY_NOTE_MAX_BYTES * 6 + 1024
BACKSTORY_EXCLUSIONS = tuple(filter(None, (item.strip() for item in os.environ.get("BACKSTORY_EXCLUSIONS", "").split(","))))

BACKSTORY_SESSION_IDLE_SECONDS = 12 * 3600
BACKSTORY_SESSION_ABSOLUTE_SECONDS = 24 * 3600
BACKSTORY_REMEMBERED_IDLE_SECONDS = 14 * 86400
BACKSTORY_REMEMBERED_ABSOLUTE_SECONDS = 90 * 86400
AUTHENTICATION_BACKENDS = ['axes.backends.AxesStandaloneBackend', 'django.contrib.auth.backends.ModelBackend']
AXES_LOCKOUT_PARAMETERS = ['username', 'ip_address']
AXES_FAILURE_LIMIT = 5
from datetime import timedelta
AXES_COOLOFF_TIME = timedelta(minutes=30)
AXES_RESET_ON_SUCCESS = False
AXES_CLIENT_IP_CALLABLE = 'backstory.middleware.client_ip'
AXES_LOCKOUT_CALLABLE = 'backstory.middleware.lockout'
AXES_ENABLE_ACCESS_FAILURE_LOG = False
AXES_DISABLE_ACCESS_LOG = True
AXES_VERBOSE = False
LOGGING = {
    'version': 1, 'disable_existing_loggers': False,
    'filters': {'redact': {'()': 'backstory.logging.RedactRequest'}},
    'handlers': {'safe': {'class': 'logging.StreamHandler', 'filters': ['redact']}},
    'root': {'handlers': ['safe'], 'level': 'WARNING'},
    'loggers': {name: {'handlers': ['safe'], 'filters': ['redact'], 'propagate': False, 'level': 'WARNING'} for name in ['django', 'django.request', 'django.security', 'django.security.DisallowedHost', 'django.security.csrf', 'axes', 'gunicorn.error', 'gunicorn.access']},
}

BACKSTORY_REVISION_RETENTION_DAYS = 30
