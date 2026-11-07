"""Candidate orchestration uses real disposable Git histories; no hosted writes."""
import importlib.util
import json
from pathlib import Path
import subprocess
import sys

import pytest

ROOT = Path(__file__).resolve().parents[2]


def module():
    sys.path.insert(0, str(ROOT / 'scripts'))
    spec = importlib.util.spec_from_file_location('local_candidate', ROOT / 'scripts/local_candidate.py')
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


@pytest.fixture
def candidate(tmp_path, monkeypatch):
    m = module()
    import local_ci
    monkeypatch.setattr(local_ci, 'runtime_inputs', lambda root: {'toolchain': 'test'})
    origin, work = tmp_path / 'origin.git', tmp_path / 'work'
    subprocess.run(['git', 'init', '--bare', '-q', str(origin)], check=True)
    subprocess.run(['git', 'init', '-qb', 'dev', str(work)], check=True)
    def git(*args):
        return subprocess.check_output(['git', *args], cwd=work, text=True).strip()
    git('config', 'user.name', 'Test')
    git('config', 'user.email', 'test@example.invalid')
    (work / 'base').write_text('base')
    git('add', '.')
    git('commit', '-qm', 'base')
    git('switch', '-qc', 'feature')
    (work / 'feature').write_text('feature')
    git('add', '.')
    git('commit', '-qm', 'fix: feature')
    git('remote', 'add', 'origin', str(origin))
    git('push', '-q', 'origin', 'dev', 'feature')
    pr = dict(number=12, state='OPEN', isDraft=False, baseRefName='dev', headRefName='feature',
              baseRefOid=git('rev-parse', 'dev'), headRefOid=git('rev-parse', 'feature'),
              headRepositoryOwner={'login': 'bcl1713'}, headRepository={'name': 'backstory'},
              author={'login': 'author'}, reviews=[dict(state='APPROVED', user={'login': 'reviewer'}, commit_id=git('rev-parse', 'feature'))])
    monkeypatch.setattr(m, 'REPOSITORY_URL', str(origin))
    monkeypatch.setattr(m, 'pull_request', lambda number: dict(pr))
    controller = m.Candidates(tmp_path / 'state')
    return m, controller, pr, work, git


def ready(candidate, monkeypatch):
    m, controller, pr, work, git = candidate
    path = controller.prepare(12)
    # The full runner is separately tested; synthesize its API at this boundary.
    def gate(source, report, base, head, port):
        report.mkdir()
        sha, tree = m.source_identity(source)
        from local_ci import build_plan, RECEIPT_SCHEMA
        (report / 'receipt.json').write_text(json.dumps(dict(schema=RECEIPT_SCHEMA, inputs={'toolchain': 'test'}, source_sha=sha,
            source_tree=tree, gates={step['name']: 'passed' for step in build_plan(report, port)})))
    monkeypatch.setattr(m, 'run_gate', gate)
    controller.test(path)
    return path


def test_prepares_two_parent_merge_and_lands_exact_tested_commit(candidate, monkeypatch):
    m, controller, pr, work, git = candidate
    path = ready(candidate, monkeypatch)
    record = json.loads(path.read_text())
    parents = subprocess.check_output(['git', 'show', '-s', '--format=%P', record['source_sha']],
                                      cwd=path.parent / 'source', text=True).strip().split()
    assert parents == [pr['baseRefOid'], pr['headRefOid']]
    review = path.parent / 'review.json'
    review.write_text(json.dumps(dict(source_sha=record['source_sha'], status='approved', reviewer='independent reviewer', summary='Code and test evidence reviewed.')))
    controller.land(path, record['source_sha'], review)
    assert git('ls-remote', 'origin', 'refs/heads/dev').split()[0] == record['source_sha']
    assert json.loads(path.read_text())['status'] == 'landed'


@pytest.mark.parametrize('change', ['head', 'base', 'unapproved', 'draft', 'closed'])
def test_stale_or_unreviewed_candidate_cannot_land(candidate, monkeypatch, change):
    m, controller, pr, work, git = candidate
    path = ready(candidate, monkeypatch)
    record = json.loads(path.read_text())
    if change in ('head', 'base'):
        branch = 'feature' if change == 'head' else 'dev'
        git('switch', '-q', branch)
        (work / ('new-' + change)).write_text('changed')
        git('add', '.')
        git('commit', '-qm', 'advance')
        git('push', '-q', 'origin', branch)
        pr[change + 'RefOid'] = git('rev-parse', branch)
    elif change == 'unapproved':
        pr['reviews'][0]['state'] = 'CHANGES_REQUESTED'
    elif change == 'draft':
        pr['isDraft'] = True
    else:
        pr['state'] = 'CLOSED'
    with pytest.raises(ValueError):
        controller.land(path, record['source_sha'])
    assert git('ls-remote', 'origin', 'refs/heads/dev').split()[0] != record['source_sha']


def test_failed_gate_and_missing_review_ack_never_land(candidate, monkeypatch):
    m, controller, pr, work, git = candidate
    path = controller.prepare(12)
    def fail(*args):
        raise RuntimeError('gate failed')
    monkeypatch.setattr(m, 'run_gate', fail)
    with pytest.raises(RuntimeError):
        controller.test(path)
    assert json.loads(path.read_text())['status'] == 'failed'
    with pytest.raises(ValueError):
        controller.land(path, 'wrong')


def test_tested_candidate_requires_exact_review_ack_and_receipt(candidate, monkeypatch):
    m, controller, pr, work, git = candidate
    path = ready(candidate, monkeypatch)
    record = json.loads(path.read_text())
    with pytest.raises(ValueError, match='review'):
        controller.land(path, 'wrong')
    receipt = path.parent / 'evidence/receipt.json'
    data = json.loads(receipt.read_text())
    data['source_sha'] = '0' * 40
    receipt.write_text(json.dumps(data))
    with pytest.raises(ValueError, match='receipt'):
        controller.land(path, record['source_sha'])


def review_file(path, sha):
    review = path.parent / 'independent-review.json'
    review.write_text(json.dumps(dict(source_sha=sha, status='approved',
        reviewer='independent agent', summary='Reviewed candidate merge result and retained evidence.')))
    return review


def test_local_review_allowed_when_github_has_no_required_review_decision(candidate, monkeypatch):
    m, controller, pr, work, git = candidate
    path = ready(candidate, monkeypatch)
    record = json.loads(path.read_text())
    pr.update(reviews=[], reviewDecision=None)
    controller.land(path, record['source_sha'], review_file(path, record['source_sha']))
    assert json.loads(path.read_text())['status'] == 'landed'


@pytest.mark.parametrize('problem', ['missing-local', 'wrong-local-sha', 'required-github', 'changes-requested'])
def test_missing_local_or_required_github_review_blocks_landing(candidate, monkeypatch, problem):
    m, controller, pr, work, git = candidate
    path = ready(candidate, monkeypatch)
    record = json.loads(path.read_text())
    review = review_file(path, 'wrong' if problem == 'wrong-local-sha' else record['source_sha'])
    if problem == 'required-github':
        pr['reviewDecision'] = 'REVIEW_REQUIRED'
    if problem == 'changes-requested':
        pr['reviews'][0]['state'] = 'CHANGES_REQUESTED'
    with pytest.raises(ValueError, match='review'):
        controller.land(path, record['source_sha'], None if problem == 'missing-local' else review)


def test_concurrent_target_update_fails_compare_and_swap(candidate, monkeypatch):
    m, controller, pr, work, git = candidate
    path = ready(candidate, monkeypatch)
    record = json.loads(path.read_text())
    original = m.git
    def racing(source, *args):
        if args[0] == 'push':
            git('switch', '-q', 'dev')
            (work / 'concurrent').write_text('new base')
            git('add', '.')
            git('commit', '-qm', 'concurrent merge')
            git('push', '-q', 'origin', 'dev')
        return original(source, *args)
    monkeypatch.setattr(m, 'git', racing)
    with pytest.raises(subprocess.CalledProcessError):
        controller.land(path, record['source_sha'], review_file(path, record['source_sha']))
    assert git('ls-remote', 'origin', 'refs/heads/dev').split()[0] != record['source_sha']


def test_crash_after_push_can_finish_without_retesting_or_repeating_push(candidate, monkeypatch):
    m, controller, pr, work, git = candidate
    path = ready(candidate, monkeypatch)
    record = json.loads(path.read_text())
    original = m.save
    def crash(path, record):
        if record['status'] == 'landed':
            raise RuntimeError('crash after push')
        original(path, record)
    monkeypatch.setattr(m, 'save', crash)
    with pytest.raises(RuntimeError):
        controller.land(path, record['source_sha'], review_file(path, record['source_sha']))
    assert json.loads(path.read_text())['status'] == 'landing'
    monkeypatch.setattr(m, 'save', original)
    controller.land(path, record['source_sha'])
    assert json.loads(path.read_text())['status'] == 'landed'


def test_evidence_validation_uses_candidate_runtime_root(candidate, monkeypatch):
    m, controller, pr, work, git = candidate
    path = ready(candidate, monkeypatch)
    roots = []
    monkeypatch.setattr(m, 'validate_receipt', lambda receipt, sha, tree, root: roots.append(root))
    m.validate_evidence(path, json.loads(path.read_text()))
    assert roots == [path.parent / 'source']


def test_concurrent_feature_update_rejects_entire_atomic_landing(candidate, monkeypatch):
    m, controller, pr, work, git = candidate
    path = ready(candidate, monkeypatch)
    record = json.loads(path.read_text())
    original = m.git
    def racing(source, *args):
        if args[0] == 'push':
            git('switch', '-q', 'feature')
            (work / 'concurrent').write_text('new feature')
            git('add', '.')
            git('commit', '-qm', 'concurrent feature')
            git('push', '-q', 'origin', 'feature')
        return original(source, *args)
    monkeypatch.setattr(m, 'git', racing)
    with pytest.raises(subprocess.CalledProcessError):
        controller.land(path, record['source_sha'], review_file(path, record['source_sha']))
    assert git('ls-remote', 'origin', 'refs/heads/dev').split()[0] == record['base_sha']


def test_main_promotion_synchronizes_dev_and_main_to_same_tested_merge(candidate, monkeypatch):
    m, controller, pr, work, git = candidate
    git('branch', 'main', pr['baseRefOid'])
    git('push', '-q', 'origin', 'main')
    git('switch', '-q', 'dev')
    git('merge', '-q', '--ff-only', 'feature')
    git('push', '-q', 'origin', 'dev')
    pr.update(baseRefName='main', headRefName='dev', headRefOid=git('rev-parse', 'dev'))
    path = ready(candidate, monkeypatch)
    record = json.loads(path.read_text())
    controller.land(path, record['source_sha'], review_file(path, record['source_sha']))
    assert json.loads(path.read_text())['landed_branches'] == ['dev', 'main']
    assert git('ls-remote', 'origin', 'refs/heads/dev').split()[0] == record['source_sha']
    assert git('ls-remote', 'origin', 'refs/heads/main').split()[0] == record['source_sha']


def test_remote_without_atomic_push_support_fails_closed(candidate, monkeypatch):
    m, controller, pr, work, git = candidate
    path = ready(candidate, monkeypatch)
    record = json.loads(path.read_text())
    git('--git-dir', str(work.parent / 'origin.git'), 'config', 'receive.advertiseAtomic', 'false')
    with pytest.raises(subprocess.CalledProcessError):
        controller.land(path, record['source_sha'], review_file(path, record['source_sha']))
    assert git('ls-remote', 'origin', 'refs/heads/dev').split()[0] == record['base_sha']
    assert git('ls-remote', 'origin', 'refs/heads/feature').split()[0] == record['head_sha']
