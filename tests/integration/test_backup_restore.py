import json
import os
from pathlib import Path
import shutil
import sqlite3
import subprocess
import sys

import pytest
from tests.integration.test_restart import seed, run, VERIFY


def backup(env, output, *options):
    return subprocess.run([sys.executable, 'manage.py', 'backup_data', str(output), *options], env=env, capture_output=True, text=True, timeout=120)


def test_online_backup_restores_into_fresh_data_and_separate_wiki(tmp_path):
    fixture, env = seed(tmp_path)
    output = tmp_path / 'protected-backup'
    result = backup(env, output, '--include-secret')
    assert result.returncode == 0, result.stderr
    assert (output.stat().st_mode & 0o777) == 0o700
    manifest = json.loads((output / 'manifest.json').read_text())
    assert manifest['external_blobs'] == []
    assert manifest['recovery_storage'] == 'sqlite-inline-blobs'
    assert manifest['application_secret'] == 'included'
    for name in ['backstory.sqlite3', 'manifest.json', 'application-secret']:
        assert ((output / name).stat().st_mode & 0o777) == 0o600
    with sqlite3.connect(output / 'backstory.sqlite3') as db:
        assert db.execute('pragma integrity_check').fetchone()[0] == 'ok'
        assert db.execute('select count(*) from wiki_savedrevision').fetchone()[0] == 1
        assert db.execute('select count(*) from wiki_recoverydraft').fetchone()[0] == 1
    restored = tmp_path / 'fresh-data'; restored.mkdir(mode=0o700)
    restored_wiki = tmp_path / 'separate-restored-wiki'
    shutil.copytree(fixture.wiki_root, restored_wiki)
    for name in ['backstory.sqlite3', 'application-secret']:
        shutil.copy2(output / name, restored / name)
    # Test-only session/checkpoint expectations are not part of a backup.
    shutil.copy2(fixture.data_dir / 'test-state.json', restored / 'test-state.json')
    restored_env = {**env, 'BACKSTORY_DATA_DIR': str(restored), 'BACKSTORY_WIKI_ROOT': str(restored_wiki)}
    run(VERIFY, restored_env)
    assert (restored / 'application-secret').read_bytes() == (fixture.data_dir / 'application-secret').read_bytes()
    run('''import django; django.setup()
from django.test import Client
from wiki.models import SavedRevision
c=Client(); assert c.post('/accounts/login/',{'username':'human','password':'synthetic-restart-password'}).status_code==302
r=c.get('/notes/notes/Recovery.md'); assert r.status_code==200
row=SavedRevision.objects.get()
s=c.post(f'/restore/{row.pk}/',data='{}',content_type='application/json',HTTP_IF_MATCH=r['ETag']); assert s.status_code==200
from django.conf import settings
assert (settings.BACKSTORY_WIKI_ROOT/'notes/Recovery.md').read_bytes()==b'\\xef\\xbb\\xbf# Original\\r\\n'
''', restored_env)
    assert (fixture.wiki_root / 'notes/Recovery.md').read_bytes() == b'\xef\xbb\xbf# Changed\r\n'


def test_secret_export_is_explicit_and_existing_output_is_never_overwritten(tmp_path):
    fixture, env = seed(tmp_path)
    output = tmp_path / 'no-secret'
    result = backup(env, output)
    assert result.returncode == 0, result.stderr
    assert not (output / 'application-secret').exists()
    assert json.loads((output / 'manifest.json').read_text())['application_secret'] == 'required-separately'
    before = (output / 'backstory.sqlite3').read_bytes()
    assert backup(env, output, '--include-secret').returncode != 0
    assert (output / 'backstory.sqlite3').read_bytes() == before
    assert not (output / 'application-secret').exists()


@pytest.mark.parametrize('destination', ['wiki', 'data', 'symlink'])
def test_backup_refuses_storage_overlap_or_symlink_output(tmp_path, destination):
    fixture, env = seed(tmp_path)
    if destination == 'symlink':
        path = tmp_path / 'link'; path.symlink_to(fixture.data_dir, target_is_directory=True)
    else:
        path = (fixture.wiki_root if destination == 'wiki' else fixture.data_dir) / 'backup'
    assert backup(env, path, '--include-secret').returncode != 0
    assert not (fixture.wiki_root / 'backup').exists()
    assert not (fixture.data_dir / 'backup').exists()
