"""Real packaged helper and independent OS writers; no fake filesystem."""
import json
import os
from pathlib import Path
import subprocess
import sys
import pytest
from tests.integration.test_browsing import reader
from tests.integration.test_storage import wiki
from tests.integration.test_saves import save, revision

pytestmark = pytest.mark.django_db


def external_write(target, raw):
    subprocess.run([sys.executable, '-c', 'import pathlib,sys; pathlib.Path(sys.argv[1]).write_bytes(bytes.fromhex(sys.argv[2]))', str(target), raw.hex()], check=True, timeout=10)


def test_real_helper_staging_barrier_external_process_edit(reader, wiki, monkeypatch):
    import wiki.formatting as formatting
    import wiki.saves as saves
    target = wiki / 'note.md'; target.write_bytes(b'# Original\n')
    original_format = formatting.format_source
    original_backup = saves.store_required_backup
    called = []
    def helper(*args):
        result = original_format(*args)
        called.append(result.outcome)
        return result
    def barrier(*args):
        original_backup(*args)
        # The real packaged helper has completed and the sibling was fsynced.
        assert list(wiki.glob('.backstory-tmp-*'))
        external_write(target, b'# Independent writer\n')
    monkeypatch.setattr(saves, 'format_source', helper)
    monkeypatch.setattr(saves, 'store_required_backup', barrier)
    result = save(reader, '# Draft\n', revision(b'# Original\n'))
    assert called == ['ok']
    assert result.status_code == 412
    assert result.json()['revision'] == revision(b'# Independent writer\n')
    assert target.read_bytes() == b'# Independent writer\n'
    assert not list(wiki.glob('.backstory-tmp-*'))


def test_source_recovery_original_base_external_process(reader, wiki):
    target = wiki / 'note.md'; target.write_bytes(b'# Original\n')
    base = revision(target.read_bytes()); draft = '---\nx: [\n---\n'
    grant = save(reader, draft, base)
    assert grant.status_code == 422
    external_write(target, b'# Independent writer\n')
    response = save(reader, draft, base, mode='source_recovery', token=grant.json()['recovery_token'])
    assert response.status_code == 412
    assert target.read_bytes() == b'# Independent writer\n'


def test_parent_symlink_swap_after_staging(reader, wiki, monkeypatch):
    import wiki.saves as saves
    parent = wiki / 'notes'; parent.mkdir(); target = parent / 'note.md'; target.write_bytes(b'# Original\n')
    original = saves.store_required_backup
    moved = wiki / 'moved'
    def swap(*args):
        original(*args)
        parent.rename(moved); parent.symlink_to(moved, target_is_directory=True)
    monkeypatch.setattr(saves, 'store_required_backup', swap)
    result = save(reader, '# Draft\n', revision(b'# Original\n'), path='notes/note.md')
    assert result.status_code in {404, 422}
    assert (moved / 'note.md').read_bytes() == b'# Original\n'
    assert not list(moved.glob('.backstory-tmp-*'))


@pytest.mark.django_db(transaction=True)
@pytest.mark.parametrize('creating', [False, True])
def test_two_application_processes_one_winner(wiki, settings, tmp_path, creating):
    from django.contrib.auth import get_user_model
    from django.core.management import call_command
    from django.db import connection
    # Independent processes require a real disposable SQLite database.
    data = settings.BACKSTORY_DATA_DIR; data.mkdir(exist_ok=True)
    db = data / 'process.sqlite3'
    with connection.cursor() as cursor:
        cursor.execute('PRAGMA database_list')
        assert cursor.fetchone()
    import sqlite3
    destination = sqlite3.connect(db)
    connection.connection.backup(destination); destination.close()
    target = wiki / 'note.md'
    if not creating: target.write_bytes(b'# Original\n')
    base = None if creating else revision(b'# Original\n')
    env = dict(os.environ, DJANGO_SETTINGS_MODULE='backstory.settings', BACKSTORY_WIKI_ROOT=str(wiki), BACKSTORY_DATA_DIR=str(data), BACKSTORY_IDENTITY_PATH=settings.BACKSTORY_IDENTITY_PATH)
    script = '''import django; django.setup()
from django.conf import settings
settings.DATABASES['default']['NAME'] = __import__('sys').argv[1]
from django.contrib.auth import get_user_model
from wiki.saves import save_note
u,_=get_user_model().objects.get_or_create(username='process')
import pathlib,sys,time,json
pathlib.Path(sys.argv[2]).write_text('ready')
while not pathlib.Path(sys.argv[3]).exists(): time.sleep(.01)
r=save_note(u,'note.md',sys.argv[4],json.loads(sys.argv[5]))
print(r.status)
'''
    gate = tmp_path / 'go'; processes=[]
    for index in range(2):
        ready = tmp_path / f'ready{index}'
        processes.append((subprocess.Popen([sys.executable, '-c', script, str(db), str(ready), str(gate), f'# Process {index}\n', json.dumps(base)], env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True), ready))
    import time
    deadline = time.monotonic() + 10
    while not all(path.exists() for _,path in processes) and time.monotonic()<deadline: time.sleep(.01)
    assert all(path.exists() for _,path in processes)
    gate.write_text('go')
    statuses=[]
    for process,_ in processes:
        out,err=process.communicate(timeout=20)
        assert process.returncode == 0, err
        statuses.append(int(out.strip()))
    assert sorted(statuses) == [200,412]
    if creating:
        from tests.integration.test_saves import assert_created_note
        from wiki.metadata import parse_front_matter
        body = parse_front_matter(target.read_text()).body.lstrip('\n')
        assert body in ['# Process 0\n', '# Process 1\n']
        assert_created_note(target.read_text(), body, body.strip('# \n').lower().replace(' ', '-'))
    else:
        assert target.read_bytes() in [b'# Process 0\n', b'# Process 1\n']


@pytest.mark.django_db(transaction=True)
@pytest.mark.parametrize('point', ['before_replace', 'after_replace_before_enqueue', 'after_commit_before_response'])
def test_process_interruption_preserves_authoritative_bytes_and_recovery(wiki, settings, tmp_path, point):
    import sqlite3
    from django.db import connection
    from wiki.staging import cleanup_staged_saves
    data=settings.BACKSTORY_DATA_DIR; data.mkdir(exist_ok=True)
    db=data/'crash.sqlite3'
    destination=sqlite3.connect(db); connection.ensure_connection(); connection.connection.backup(destination); destination.close()
    target=wiki/'note.md'; target.write_bytes(b'# Original\n')
    env=dict(os.environ,DJANGO_SETTINGS_MODULE='backstory.settings',BACKSTORY_WIKI_ROOT=str(wiki),BACKSTORY_DATA_DIR=str(data),BACKSTORY_IDENTITY_PATH=settings.BACKSTORY_IDENTITY_PATH)
    script='''import django; django.setup()
import sys,os,json
from django.conf import settings
settings.DATABASES['default']['NAME']=sys.argv[1]
from django.contrib.auth import get_user_model
import wiki.saves as saves
u,_=get_user_model().objects.get_or_create(username='crash')
point=sys.argv[2]
def interrupt(*args,**kwargs): os._exit(17)
if point=='before_replace': saves.os.replace=interrupt
if point=='after_replace_before_enqueue': saves.enqueue_note=interrupt
r=saves.save_note(u,'note.md','# Committed\\n',json.loads(sys.argv[3]))
assert r.status==200
os._exit(17)
'''
    result=subprocess.run([sys.executable,'-c',script,str(db),point,json.dumps(revision(b'# Original\n'))],env=env,capture_output=True,text=True,timeout=20)
    assert result.returncode==17, result.stderr
    expected=b'# Original\n' if point=='before_replace' else b'# Committed\n'
    assert target.read_bytes()==expected
    with sqlite3.connect(db) as protected:
        rows=protected.execute('SELECT original,submitted FROM wiki_savedrevision').fetchall()
    assert rows==[(b'# Original\n',b'# Committed\n')]
    cleanup_staged_saves()
    assert not list(wiki.glob('.backstory-tmp-*'))
    assert target.read_bytes()==expected


def test_external_create_after_staging_never_overwrites(reader,wiki,monkeypatch):
    import wiki.saves as saves
    target=wiki/'note.md'; original=saves.store_required_backup
    def barrier(*args):
        original(*args)
        external_write(target,b'# External creator\n')
    monkeypatch.setattr(saves,'store_required_backup',barrier)
    response=save(reader,'# My create\n',create=True)
    assert response.status_code==412
    assert target.read_bytes()==b'# External creator\n'


def test_source_recovery_final_hash_detects_external_writer(reader,wiki,monkeypatch):
    import wiki.saves as saves
    target=wiki/'note.md'; target.write_bytes(b'# Original\n')
    draft='---\nx: [\n---\n'; base=revision(target.read_bytes())
    token=save(reader,draft,base).json()['recovery_token']
    original=saves.store_required_backup
    def barrier(*args):
        original(*args)
        external_write(target,b'# Final external writer\n')
    monkeypatch.setattr(saves,'store_required_backup',barrier)
    response=save(reader,draft,base,mode='source_recovery',token=token)
    assert response.status_code==412
    assert target.read_bytes()==b'# Final external writer\n'
