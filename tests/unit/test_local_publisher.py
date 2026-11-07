"""Exercise automatic release scheduling against a real disposable Git origin."""
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
from types import SimpleNamespace

import pytest

ROOT = Path(__file__).resolve().parents[2]


def module():
    sys.path.insert(0, str(ROOT / 'scripts'))
    spec = importlib.util.spec_from_file_location('local_publisher', ROOT / 'scripts/local_publisher.py')
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


@pytest.fixture
def origin(tmp_path, monkeypatch):
    bare, source = tmp_path / 'origin.git', tmp_path / 'source'
    subprocess.run(['git', 'init', '--bare', '-q', str(bare)], check=True)
    subprocess.run(['git', 'init', '-q', '-b', 'dev', str(source)], check=True)
    def git(*args):
        return subprocess.check_output(['git', *args], cwd=source, text=True).strip()
    (source / 'scripts').mkdir()
    (source / 'payload.txt').write_text('initial\n')
    (source / 'scripts/local_ci.py').write_text('''import argparse,json,os,pathlib,subprocess
p=argparse.ArgumentParser();p.add_argument('--report');p.add_argument('--base');a,_=p.parse_known_args()
git=lambda ref:subprocess.check_output(['git','rev-parse',ref],text=True).strip()
sha=git('HEAD')
with open(os.environ['TEST_PUBLISH_MARKER'],'a') as f:f.write('gate:'+a.base+':'+sha+'\\n')
mode=os.environ.get('TEST_GATE_MODE','')
if os.environ.get('TEST_BUILDER_SPLIT') and os.environ.get('BUILDX_BUILDER'):raise SystemExit(23)
if mode=='fail':raise SystemExit(13)
if mode=='missing':raise SystemExit(0)
report=pathlib.Path(a.report);report.mkdir()
if mode=='dirty':pathlib.Path('payload.txt').write_text('untested edit')
receipt=dict(schema=1,source_sha='0'*40 if mode=='wrong-sha' else sha,source_tree=git('HEAD^{tree}'),gates={'synthetic':'failed' if mode=='failed-receipt' else 'passed'})
(report/'receipt.json').write_text(json.dumps(receipt))
''')
    (source / 'scripts/local_release.py').write_text('''import argparse,os,subprocess
p=argparse.ArgumentParser();p.add_argument('--channel');a,_=p.parse_known_args()
sha=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
if os.environ.get('TEST_BUILDER_SPLIT') and os.environ.get('BUILDX_BUILDER')!='publication-only':raise SystemExit(24)
with open(os.environ['TEST_PUBLISH_MARKER'],'a') as f:f.write('publish:'+a.channel+':'+sha+'\\n')
if os.environ.get('TEST_RELEASE_FAILURE'):raise SystemExit(17)
''')
    git('add', '.')
    git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'initial')
    git('branch', 'main')
    git('remote', 'add', 'origin', str(bare))
    git('push', '-q', 'origin', 'dev', 'main')
    marker = tmp_path / 'operations'
    monkeypatch.setenv('TEST_PUBLISH_MARKER', str(marker))
    def advance(branch):
        git('switch', '-q', branch)
        (source / 'payload.txt').write_text(git('rev-parse', 'HEAD') + '\n')
        git('add', 'payload.txt')
        git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'next')
        git('push', '-q', 'origin', branch)
        return git('rev-parse', 'HEAD')
    return SimpleNamespace(url=str(bare), sha=git('rev-parse', 'HEAD'), advance=advance,
                           operations=lambda: marker.read_text().splitlines() if marker.exists() else [])


def publisher(tmp_path, monkeypatch, origin):
    m = module()
    monkeypatch.setattr(m, 'REPOSITORY_URL', origin.url)
    worker = m.Publisher(tmp_path / 'publisher', retry_delay=300)
    worker.baseline(['main'])
    return m, worker


def test_new_dev_commit_is_tested_and_published_automatically_once_across_restart(tmp_path, monkeypatch, origin):
    m, worker = publisher(tmp_path, monkeypatch, origin)
    assert worker.poll() == {'dev': 'published', 'main': 'unchanged'}
    restarted = m.Publisher(worker.state_dir)
    assert restarted.poll() == {'dev': 'unchanged', 'main': 'unchanged'}
    assert origin.operations() == ['gate:dev:' + origin.sha, 'publish:dev:' + origin.sha]
    state = json.loads((worker.state_dir / 'state.json').read_text())
    assert state['channels']['dev']['published_sha'] == origin.sha
    assert state['channels']['main']['baseline_sha'] == origin.sha
    assert 'published_sha' not in state['channels']['main']


def test_main_advancement_uses_stable_channel(tmp_path, monkeypatch, origin):
    _, worker = publisher(tmp_path, monkeypatch, origin)
    worker.poll()
    sha = origin.advance('main')
    assert worker.poll() == {'dev': 'unchanged', 'main': 'published'}
    assert origin.operations()[-2:] == ['gate:main:' + sha, 'publish:stable:' + sha]


def test_gate_failure_blocks_upload_and_retries_after_backoff(tmp_path, monkeypatch, origin):
    m, worker = publisher(tmp_path, monkeypatch, origin)
    monkeypatch.setattr(m.time, 'time', lambda: 1000)
    monkeypatch.setenv('TEST_GATE_MODE', 'fail')
    assert worker.poll()['dev'] == 'failed'
    monkeypatch.delenv('TEST_GATE_MODE')
    assert worker.poll()['dev'] == 'waiting'
    assert origin.operations() == ['gate:dev:' + origin.sha]
    monkeypatch.setattr(m.time, 'time', lambda: 1301)
    assert worker.poll()['dev'] == 'published'
    assert origin.operations()[-1] == 'publish:dev:' + origin.sha


@pytest.mark.parametrize('mode', ['missing', 'wrong-sha', 'failed-receipt', 'dirty'])
def test_receipt_or_source_errors_block_publication(tmp_path, monkeypatch, origin, mode):
    _, worker = publisher(tmp_path, monkeypatch, origin)
    monkeypatch.setenv('TEST_GATE_MODE', mode)
    assert worker.poll()['dev'] == 'failed'
    assert origin.operations() == ['gate:dev:' + origin.sha]


def test_upload_failure_is_not_recorded_as_published_and_another_channel_can_run(tmp_path, monkeypatch, origin):
    _, worker = publisher(tmp_path, monkeypatch, origin)
    monkeypatch.setenv('TEST_RELEASE_FAILURE', '1')
    assert worker.poll()['dev'] == 'failed'
    state = json.loads((worker.state_dir / 'state.json').read_text())
    assert 'published_sha' not in state['channels']['dev']
    monkeypatch.delenv('TEST_RELEASE_FAILURE')
    sha = origin.advance('main')
    assert worker.poll() == {'dev': 'waiting', 'main': 'published'}
    assert origin.operations()[-1] == 'publish:stable:' + sha


def test_branch_advancement_after_gate_supersedes_work_before_upload(tmp_path, monkeypatch, origin):
    m, worker = publisher(tmp_path, monkeypatch, origin)
    original = m.run_process
    def run(args, **kwargs):
        original(args, **kwargs)
        if args[1] == 'scripts/local_ci.py':
            origin.advance('dev')
    monkeypatch.setattr(m, 'run_process', run)
    assert worker.poll()['dev'] == 'superseded'
    assert origin.operations() == ['gate:dev:' + origin.sha]


def test_only_one_publisher_can_hold_the_state_lock(tmp_path):
    m = module()
    with m.publisher_lock(tmp_path / 'publisher'):
        with pytest.raises(BlockingIOError):
            with m.publisher_lock(tmp_path / 'publisher'):
                pass


def test_stop_drains_current_publication_without_starting_another_channel(tmp_path, monkeypatch, origin):
    m, worker = publisher(tmp_path, monkeypatch, origin)
    origin.advance('main')
    original = m.run_process
    def run(args, **kwargs):
        original(args, **kwargs)
        if args[1] == 'scripts/local_ci.py':
            worker.stopping.set()
    monkeypatch.setattr(m, 'run_process', run)
    assert worker.poll() == {'dev': 'published'}
    assert origin.operations() == ['gate:dev:' + origin.sha, 'publish:dev:' + origin.sha]


def test_new_commit_does_not_wait_for_failed_revisions_backoff(tmp_path, monkeypatch, origin):
    _, worker = publisher(tmp_path, monkeypatch, origin)
    monkeypatch.setenv('TEST_GATE_MODE', 'fail')
    assert worker.poll()['dev'] == 'failed'
    monkeypatch.delenv('TEST_GATE_MODE')
    sha = origin.advance('dev')
    assert worker.poll()['dev'] == 'published'
    assert origin.operations()[-1] == 'publish:dev:' + sha


def test_correctness_uses_local_docker_while_publication_keeps_multiarch_builder(tmp_path, monkeypatch, origin):
    _, worker = publisher(tmp_path, monkeypatch, origin)
    monkeypatch.setenv('BUILDX_BUILDER', 'publication-only')
    monkeypatch.setenv('TEST_BUILDER_SPLIT', '1')
    assert worker.poll()['dev'] == 'published'
    assert origin.operations() == ['gate:dev:' + origin.sha, 'publish:dev:' + origin.sha]
