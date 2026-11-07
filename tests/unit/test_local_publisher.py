"""Publish retained candidate evidence, never rerun application gates on retry."""
import importlib.util
import json
from pathlib import Path
import subprocess
import sys

import pytest

ROOT = Path(__file__).resolve().parents[2]


def module():
    sys.path.insert(0, str(ROOT / 'scripts'))
    spec = importlib.util.spec_from_file_location('local_publisher', ROOT / 'scripts/local_publisher.py')
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


@pytest.fixture
def publication(tmp_path, monkeypatch):
    m = module()
    import local_ci
    monkeypatch.setattr(local_ci, 'runtime_inputs', lambda root: {'toolchain': 'test'})
    bare, source = tmp_path / 'origin.git', tmp_path / 'work'
    subprocess.run(['git', 'init', '--bare', '-q', str(bare)], check=True)
    subprocess.run(['git', 'init', '-qb', 'dev', str(source)], check=True)
    def git(*args):
        return subprocess.check_output(['git', *args], cwd=source, text=True).strip()
    git('config', 'user.name', 'Test')
    git('config', 'user.email', 'test@example.invalid')
    (source / 'scripts').mkdir()
    (source / 'scripts/local_release.py').write_text('''import os,pathlib,sys
with open(os.environ['TEST_PUBLISH_MARKER'],'a') as f:f.write('publish:'+sys.argv[sys.argv.index('--channel')+1]+'\\n')
assert '--receipt' in sys.argv
if os.environ.get('TEST_RELEASE_FAILURE'):raise SystemExit(17)
''')
    (source / 'scripts/local_ci.py').write_text("raise RuntimeError('Publisher must never run CI')\n")
    git('add', '.')
    git('commit', '-qm', 'base')
    base = git('rev-parse', 'HEAD')
    git('branch', 'main')
    git('switch', '-qc', 'feature')
    (source / 'feature').write_text('feature')
    git('add', '.')
    git('commit', '-qm', 'feature')
    head = git('rev-parse', 'HEAD')
    git('switch', '-q', 'dev')
    git('merge', '-q', '--no-ff', '-m', 'candidate', 'feature')
    sha, tree = git('rev-parse', 'HEAD'), git('rev-parse', 'HEAD^{tree}')
    git('remote', 'add', 'origin', str(bare))
    git('push', '-q', 'origin', 'dev', 'main', 'feature')
    monkeypatch.setattr(m, 'REPOSITORY_URL', str(bare))
    worker = m.Publisher(tmp_path / 'state', retry_delay=1)
    worker.baseline(['main'])
    job = worker.state_dir / 'candidates' / sha
    job.mkdir(parents=True)
    subprocess.run(['git', 'clone', '-q', str(bare), str(job / 'source')], check=True)
    subprocess.run(['git', 'checkout', '-q', '--detach', sha], cwd=job / 'source', check=True)
    from local_ci import build_plan, RECEIPT_SCHEMA
    record = dict(schema=1, status='landed', source_sha=sha, source_tree=tree,
                  base='dev', head='feature', base_sha=base, head_sha=head,
                  reviewed_candidate=sha, landed_branches=['dev'], reviews=[{'state': 'APPROVED'}],
                  local_review=dict(source_sha=sha, status='approved', reviewer='independent reviewer', summary='Reviewed.'))
    evidence = job / 'evidence'
    evidence.mkdir()
    receipt = evidence / 'receipt.json'
    receipt.write_text(json.dumps(dict(schema=RECEIPT_SCHEMA, inputs={'toolchain': 'test'}, source_sha=sha, source_tree=tree,
        gates={step['name']: 'passed' for step in build_plan(evidence, 18765)})))
    from local_candidate import receipt_digest
    record['receipt_sha256'] = receipt_digest(receipt)
    path = job / 'candidate.json'
    path.write_text(json.dumps(record))
    marker = tmp_path / 'operations'
    monkeypatch.setenv('TEST_PUBLISH_MARKER', str(marker))
    return m, worker, path, record, marker, git


def test_exact_candidate_publishes_once_and_survives_restart(publication):
    m, worker, path, record, marker, git = publication
    assert worker.poll() == {'dev': 'published', 'main': 'unchanged'}
    restarted = m.Publisher(worker.state_dir)
    assert restarted.poll() == {'dev': 'unchanged', 'main': 'unchanged'}
    assert marker.read_text().splitlines() == ['publish:dev']


@pytest.mark.parametrize('problem', ['missing', 'failed', 'wrong-sha', 'wrong-tree', 'changed-receipt', 'dirty', 'unreviewed', 'wrong-policy'])
def test_invalid_or_missing_evidence_blocks_upload(publication, problem):
    m, worker, path, record, marker, git = publication
    if problem == 'missing':
        path.unlink()
    elif problem == 'dirty':
        (path.parent / 'source/feature').write_text('untested')
    elif problem == 'changed-receipt':
        with (path.parent / 'evidence/receipt.json').open('a') as stream:
            stream.write(' ')
    else:
        record[{'failed': 'status', 'wrong-sha': 'source_sha', 'wrong-tree': 'source_tree',
                'unreviewed': 'reviewed_candidate', 'wrong-policy': 'base'}[problem]] = 'invalid'
        path.write_text(json.dumps(record))
    assert worker.poll()['dev'] == 'failed'
    assert not marker.exists()


def test_upload_failure_reuses_receipt_after_restart_without_ci(publication, monkeypatch):
    m, worker, path, record, marker, git = publication
    monkeypatch.setenv('TEST_RELEASE_FAILURE', '1')
    monkeypatch.setattr(m.time, 'time', lambda: 1000)
    assert worker.poll()['dev'] == 'failed'
    first_job = worker.state['channels']['dev']['job']
    receipt_bytes = (path.parent / 'evidence/receipt.json').read_bytes()
    monkeypatch.delenv('TEST_RELEASE_FAILURE')
    restarted = m.Publisher(worker.state_dir)
    assert restarted.poll()['dev'] == 'waiting'
    monkeypatch.setattr(m.time, 'time', lambda: 1301)
    assert restarted.poll()['dev'] == 'published'
    assert restarted.state['channels']['dev']['job'] != first_job
    assert (path.parent / 'evidence/receipt.json').read_bytes() == receipt_bytes
    assert marker.read_text().splitlines() == ['publish:dev', 'publish:dev']


def test_branch_advancement_before_upload_supersedes_candidate(publication, monkeypatch):
    m, worker, path, record, marker, git = publication
    original = worker.fetch
    calls = 0
    def fetch():
        nonlocal calls
        calls += 1
        if calls == 2:
            (Path(git('rev-parse', '--show-toplevel')) / 'new').write_text('new')
            git('add', '.')
            git('commit', '-qm', 'new')
            git('push', '-q', 'origin', 'dev')
        original()
    monkeypatch.setattr(worker, 'fetch', fetch)
    assert worker.poll()['dev'] == 'superseded'
    assert not marker.exists()


def test_only_one_publisher_can_hold_the_state_lock(tmp_path):
    m = module()
    with m.publisher_lock(tmp_path / 'publisher'):
        with pytest.raises(BlockingIOError):
            with m.publisher_lock(tmp_path / 'publisher'):
                pass


def test_atomic_main_promotion_publishes_both_channels_with_exact_shared_evidence(publication):
    m, worker, path, record, marker, git = publication
    record.update(base='main', head='dev', landed_branches=['dev', 'main'])
    path.write_text(json.dumps(record))
    git('push', '-q', 'origin', record['source_sha'] + ':refs/heads/main')
    assert worker.poll() == {'dev': 'published', 'main': 'published'}
    assert marker.read_text().splitlines() == ['publish:dev', 'publish:stable']
    assert worker.state['channels']['dev']['published_sha'] == record['source_sha']
    assert worker.state['channels']['main']['published_sha'] == record['source_sha']
    assert worker.poll() == {'dev': 'unchanged', 'main': 'unchanged'}
