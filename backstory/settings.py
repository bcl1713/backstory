"""Explicit storage and secure deployment defaults; never initialize wiki storage."""
import os
from pathlib import Path
import secrets
import tempfile

from django.core.exceptions import ImproperlyConfigured

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
    return path.resolve()


BACKSTORY_WIKI_ROOT = root("BACKSTORY_WIKI_ROOT")
BACKSTORY_DATA_DIR = root("BACKSTORY_DATA_DIR")
if BACKSTORY_WIKI_ROOT.is_relative_to(BACKSTORY_DATA_DIR) or BACKSTORY_DATA_DIR.is_relative_to(BACKSTORY_WIKI_ROOT):
    raise ImproperlyConfigured("Wiki and application data roots must not overlap")
BACKSTORY_IDENTITY_PATH = required("BACKSTORY_IDENTITY_PATH")
BACKSTORY_IDENTITY_SHA256 = required("BACKSTORY_IDENTITY_SHA256").lower()
if len(BACKSTORY_IDENTITY_SHA256) != 64 or any(c not in "0123456789abcdef" for c in BACKSTORY_IDENTITY_SHA256):
    raise ImproperlyConfigured("BACKSTORY_IDENTITY_SHA256 must be a SHA-256 hex digest")
_identity = Path(BACKSTORY_IDENTITY_PATH)
if _identity.is_absolute() or ".." in _identity.parts or not _identity.parts:
    raise ImproperlyConfigured("BACKSTORY_IDENTITY_PATH must be a wiki-relative file path")

BACKSTORY_COOKIE_MODE = os.environ.get("BACKSTORY_COOKIE_MODE", "https")
if BACKSTORY_COOKIE_MODE not in {"https", "localhost"}:
    raise ImproperlyConfigured("BACKSTORY_COOKIE_MODE must be https or localhost")
_local = BACKSTORY_COOKIE_MODE == "localhost"
ALLOWED_HOSTS = [host.strip() for host in required("BACKSTORY_ALLOWED_HOSTS").split(",") if host.strip()]
if not ALLOWED_HOSTS or "*" in ALLOWED_HOSTS:
    raise ImproperlyConfigured("Explicit BACKSTORY_ALLOWED_HOSTS are required")
if _local and any(host not in {"localhost", "127.0.0.1", "[::1]", "testserver"} for host in ALLOWED_HOSTS):
    raise ImproperlyConfigured("localhost cookie mode requires loopback hosts")

BACKSTORY_DATA_DIR.mkdir(mode=0o700, parents=True, exist_ok=True)


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
        raise ImproperlyConfigured("Application secret is invalid; restore protected application state")
    return value


SECRET_KEY = persistent_secret()
DEBUG = False
INSTALLED_APPS = [
    "django.contrib.auth", "django.contrib.contenttypes", "django.contrib.sessions",
    "django.contrib.staticfiles", "backstory.apps.BackstoryConfig", "accounts", "wiki", "indexing",
]
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware", "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware", "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware", "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware", "backstory.middleware.ResponsePolicyMiddleware",
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

# Content and identity reads are bounded independently; exclusions only add denies.
BACKSTORY_NOTE_MAX_BYTES = 2 * 1024 * 1024
BACKSTORY_ATTACHMENT_MAX_BYTES = 64 * 1024 * 1024
BACKSTORY_ATTACHMENT_RANGE_MAX_BYTES = 8 * 1024 * 1024
# JSON can escape each source byte as six ASCII bytes; both source and transport
# remain bounded. Preview also enforces the decoded UTF-8 note limit.
DATA_UPLOAD_MAX_MEMORY_SIZE = BACKSTORY_NOTE_MAX_BYTES * 6 + 1024
BACKSTORY_IDENTITY_MAX_BYTES = 64 * 1024
BACKSTORY_EXCLUSIONS = tuple(filter(None, (item.strip() for item in os.environ.get("BACKSTORY_EXCLUSIONS", "").split(","))))

# Background maintenance defaults; requests never start scans.
BACKSTORY_INDEX_BATCH_SIZE = int(os.environ.get("BACKSTORY_INDEX_BATCH_SIZE", "20"))
BACKSTORY_INDEX_YIELD_SECONDS = float(os.environ.get("BACKSTORY_INDEX_YIELD_SECONDS", "1"))
BACKSTORY_INDEX_INCREMENTAL_SECONDS = int(os.environ.get("BACKSTORY_INDEX_INCREMENTAL_SECONDS", "300"))
BACKSTORY_INDEX_VERIFY_SECONDS = int(os.environ.get("BACKSTORY_INDEX_VERIFY_SECONDS", "86400"))
BACKSTORY_INDEX_QUEUE_LIMIT = int(os.environ.get("BACKSTORY_INDEX_QUEUE_LIMIT", "1000"))
