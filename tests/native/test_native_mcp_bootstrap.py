"""Fail closed before application setup and bound native transport input."""
import asyncio
import io
import os
import subprocess
import sys

import pytest

from backstory import native_mcp


def test_missing_opt_in_refuses_before_setup_or_data_access(tmp_path):
    data = tmp_path / 'must-not-be-created'
    env = {**os.environ, 'BACKSTORY_DATA_DIR': str(data), 'BACKSTORY_WIKI_ROOT': str(tmp_path / 'missing')}
    result = subprocess.run([sys.executable, '-m', 'backstory.native_mcp'], env=env, capture_output=True)
    assert result.returncode == 2 and not data.exists()
    assert b'required' in result.stderr and b'Traceback' not in result.stderr


def test_explicit_arguments_override_inherited_roots_before_setup(tmp_path, monkeypatch):
    wiki = tmp_path / 'wiki'
    wiki.mkdir()
    monkeypatch.setenv('BACKSTORY_WIKI_ROOT', str(tmp_path / 'other'))
    monkeypatch.setenv('BACKSTORY_DATA_DIR', str(tmp_path / 'other-data'))
    monkeypatch.setenv('DJANGO_SETTINGS_MODULE', 'untrusted.settings')
    for name in ('BACKSTORY_WIKI_ROOT', 'BACKSTORY_DATA_DIR', 'DJANGO_SETTINGS_MODULE',
                 'BACKSTORY_ALLOWED_HOSTS', 'BACKSTORY_COOKIE_MODE'):
        monkeypatch.setenv(name, os.environ.get(name, ''))
    native_mcp.configure(['--stdio', '--wiki-root', str(wiki), '--data-dir', str(tmp_path / 'data')])
    assert os.environ['BACKSTORY_WIKI_ROOT'] == str(wiki)
    assert os.environ['BACKSTORY_DATA_DIR'] == str(tmp_path / 'data')
    assert os.environ['DJANGO_SETTINGS_MODULE'] == 'backstory.settings'
    assert not (tmp_path / 'data').exists()


def test_frame_limit_precedes_sdk_json_parsing(monkeypatch):
    pytest.importorskip('anyio')
    monkeypatch.setattr(native_mcp, 'MAX_FRAME_CHARS', 8)
    async def check():
        reader = native_mcp.BoundedInput(io.StringIO('{}\n123456789\n'))
        assert await anext(reader) == '{}\n'
        with pytest.raises(ValueError, match='frame exceeds'):
            await anext(reader)
    asyncio.run(check())
