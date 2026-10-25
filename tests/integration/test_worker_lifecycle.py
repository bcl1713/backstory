import importlib
import os
from pathlib import Path
import signal
import subprocess
import sys
import time

import pytest
from tests.integration.test_storage import wiki


def test_supervisor_propagates_failure_and_terminates_sibling(tmp_path):
    path = Path('docker/supervise.py')
    assert path.exists(), 'web and worker supervisor missing'
    spec = importlib.util.spec_from_file_location('supervise', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    marker = tmp_path / 'sibling-pid'
    child = [sys.executable, '-c', f'import os,time,pathlib; pathlib.Path({str(marker)!r}).write_text(str(os.getpid())); time.sleep(30)']
    assert module.supervise([child, [sys.executable, '-c', 'import time; time.sleep(.3); raise SystemExit(7)']]) == 7
    pid = int(marker.read_text())
    with pytest.raises(ProcessLookupError):
        os.kill(pid, 0)


def test_supervisor_sigterm_stops_children(tmp_path):
    path = Path('docker/supervise.py')
    assert path.exists(), 'web and worker supervisor missing'
    script = tmp_path / 'runner.py'
    marker = tmp_path / 'child'
    script.write_text(f'import runpy,sys; m=runpy.run_path({str(path.absolute())!r}); sys.exit(m["supervise"]([[sys.executable,"-c", "import os,time,pathlib; pathlib.Path({str(marker)!r}).write_text(str(os.getpid())); time.sleep(30)"]]))')
    process = subprocess.Popen([sys.executable, str(script)])
    try:
        for _ in range(100):
            if marker.exists():
                break
            time.sleep(.02)
        assert marker.exists()
        process.terminate()
        assert process.wait(timeout=5) == 0
        with pytest.raises(ProcessLookupError):
            os.kill(int(marker.read_text()), 0)
    finally:
        if process.poll() is None:
            process.kill()
            process.wait()


def test_real_process_restart_resumes_full_representative_corpus(tmp_path):
    import hashlib
    import sqlite3
    from tests.fixtures.generate import generate_fixture
    fixture = generate_fixture(tmp_path / 'process-corpus', 'representative')
    env = {**os.environ, 'DJANGO_SETTINGS_MODULE': 'backstory.settings',
           'BACKSTORY_WIKI_ROOT': str(fixture.wiki_root), 'BACKSTORY_DATA_DIR': str(fixture.data_dir),
           'BACKSTORY_IDENTITY_PATH': fixture.identity_path, 'BACKSTORY_IDENTITY_SHA256': fixture.identity_sha256,
           'BACKSTORY_COOKIE_MODE': 'localhost', 'BACKSTORY_ALLOWED_HOSTS': 'localhost'}
    subprocess.run([sys.executable, 'manage.py', 'migrate', '--noinput'], env=env, capture_output=True, check=True, timeout=30)
    first = 'import django,os; django.setup(); from indexing.worker import run_batch; from indexing.schema import enable_wal; enable_wal(); [run_batch(now=10000000000+n) for n in range(3)]; os._exit(23)'
    assert subprocess.run([sys.executable, '-c', first], env=env, capture_output=True, timeout=30).returncode == 23
    database = fixture.data_dir / 'backstory.sqlite3'
    with sqlite3.connect(database) as db:
        checkpoint = db.execute('SELECT checkpoint FROM indexing_scanstate').fetchone()[0]
        assert 'offset' in checkpoint
        assert 0 < db.execute('SELECT count(*) FROM indexing_indexednote').fetchone()[0] < 1000
    second = 'import django; django.setup(); from indexing.worker import run_batch\nfor n in range(300):\n r=run_batch(now=10000010000+n*400)\n if not r.pending: break\nelse: raise SystemExit(9)\n'
    subprocess.run([sys.executable, '-c', second], env=env, capture_output=True, check=True, timeout=120)
    with sqlite3.connect(database) as db:
        assert db.execute("SELECT count(*) FROM indexing_indexednote n JOIN indexing_indexgeneration g ON n.generation_id=g.id WHERE g.state='active'").fetchone()[0] == 1000
        assert db.execute('PRAGMA journal_mode').fetchone()[0] == 'wal'
        assert db.execute('SELECT count(*) FROM indexing_linkedge').fetchone()[0] > 1000
