"""Disposable configuration; never consult a developer's wiki or credentials."""
import importlib.util
import os
from pathlib import Path
import shutil
import tempfile

_runtime = Path(tempfile.mkdtemp(prefix="backstory-tests-"))
_wiki = _runtime / "wiki"
_wiki.mkdir()
os.environ.update(
    BACKSTORY_WIKI_ROOT=str(_wiki),
    BACKSTORY_DATA_DIR=str(_runtime / "data"),
    BACKSTORY_IDENTITY_PATH="Storage identity.txt",
    BACKSTORY_IDENTITY_SHA256="0" * 64,
    BACKSTORY_COOKIE_MODE="localhost",
    BACKSTORY_ALLOWED_HOSTS="localhost,127.0.0.1,testserver",
)
if importlib.util.find_spec("backstory.settings"):
    os.environ["DJANGO_SETTINGS_MODULE"] = "backstory.settings"
    import django
    django.setup()
    from django.conf import settings
    settings.STATIC_ROOT = _runtime / "staticfiles"
    settings.STATIC_ROOT.mkdir()


def pytest_unconfigure(config):
    shutil.rmtree(_runtime, ignore_errors=True)
