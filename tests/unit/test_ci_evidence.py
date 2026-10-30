"""Fail-closed release evidence policy, using GitHub-shaped bounded fixtures."""
import copy
from datetime import datetime, timezone
import importlib.util
import io
import json
import subprocess
from pathlib import Path
import zipfile

import pytest

PATH = Path(__file__).resolve().parents[2] / 'scripts/ci_evidence.py'


def module():
    spec = importlib.util.spec_from_file_location('ci_evidence', PATH)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


@pytest.fixture
def bundle():
    now = datetime(2026, 10, 30, 20, 0, tzinfo=timezone.utc)
    repo = 'bcl1713/backstory'
    base, head, release, tested, tree = [c * 40 for c in 'abcde']
    profiles = {'python': 'python', 'formatter': 'formatter', **{
        f'browser-{i}': 'browser' for i in range(1, 5)}}
    run = dict(id=12, run_attempt=1, event='pull_request', status='completed',
               conclusion='success', workflow_id=3, path='.github/workflows/ci.yml',
               head_sha=head, head_repository={'full_name': repo, 'fork': False},
               repository={'full_name': repo}, created_at='2026-10-30T19:00:00Z',
               updated_at='2026-10-30T19:10:00Z', pull_requests=[{'number': 53}])
    pr = dict(number=53, merged=True, merge_commit_sha=release, state='closed',
              author_association='OWNER', base={'sha': base, 'ref': 'dev', 'repo': {'full_name': repo}},
              head={'sha': head, 'repo': {'full_name': repo, 'fork': False}})
    job_names = ['branch-policy', 'python', 'formatter', 'container', 'correctness'] + [
        f'browser ({i})' for i in range(1, 5)]
    jobs = [dict(id=i, name=name, run_id=12, run_attempt=1, status='completed',
                 conclusion='success', steps=[
                     {'name': n, 'conclusion': 'success'} for n in (
                         'Record application-test environment', 'Retain bounded test evidence')])
            for i, name in enumerate(job_names, 1)]
    environment = {p: {'image': '20261025.353.1', 'tools': p} for p in set(profiles.values())}
    receipts = {key: dict(schema=1, repository=repo, run_id=12, attempt=1,
                         job=key, profile=p, source=tested, tree=tree,
                         environment=environment[p]) for key, p in profiles.items()}
    return dict(repo=repo, release=release, branch='dev', parents=[base, head], tree=tree,
                tested_parents=[base, head], tested_tree=tree, policy_unchanged=True,
                workflow={'id': 3, 'path': '.github/workflows/ci.yml', 'state': 'active'},
                pr=pr, run=run, jobs=jobs, receipts=receipts, environment=environment, now=now)


def test_valid_original_run_is_reusable(bundle):
    assert PATH.exists(), 'the release evidence verifier is not implemented'
    assert module().validate_bundle(**bundle) == 12


@pytest.mark.parametrize('change', [
    lambda b: b.update(policy_unchanged=False),
    lambda b: b.update(parents=['f' * 40]),
    lambda b: b.update(tested_tree='f' * 40),
    lambda b: b.update(tested_parents=list(reversed(b['parents']))),
    lambda b: b['pr'].update(merged=False),
    lambda b: b['pr'].update(author_association='NONE'),
    lambda b: b['pr']['head']['repo'].update(fork=True),
    lambda b: b['pr']['head']['repo'].update(full_name='attacker/backstory'),
    lambda b: b['run'].update(event='workflow_dispatch'),
    lambda b: b['run'].update(run_attempt=2),
    lambda b: b['run'].update(conclusion='failure'),
    lambda b: b['run'].update(status='in_progress'),
    lambda b: b['run'].update(workflow_id=999),
    lambda b: b['run'].update(head_sha='f' * 40),
    lambda b: b['run'].update(created_at='2026-10-29T18:59:00Z'),
    lambda b: b['run'].update(created_at='2026-10-31T00:00:00Z'),
    lambda b: b['run'].update(pull_requests=[]),
    lambda b: b['jobs'].pop(),
    lambda b: b['jobs'].append(copy.deepcopy(b['jobs'][0])),
    lambda b: b['jobs'][0].update(conclusion='skipped'),
    lambda b: b['jobs'][0].update(run_id=99),
    lambda b: b['receipts']['python'].update(source='f' * 40),
    lambda b: b['receipts']['python'].update(tree='f' * 40),
    lambda b: b['receipts']['python'].update(run_id=99),
    lambda b: b['receipts']['python'].update(attempt=2),
    lambda b: b['receipts']['python'].update(job='formatter'),
    lambda b: b['receipts']['python'].update(environment={'image': 'new'}),
    lambda b: b['receipts'].pop('browser-4'),
    lambda b: b['environment'].update(python={}),
])
def test_unproven_evidence_is_rejected(bundle, change):
    change(bundle)
    with pytest.raises((ValueError, KeyError)):
        module().validate_bundle(**bundle)


def archive(entries):
    output = io.BytesIO()
    with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as zipped:
        for name, body in entries:
            zipped.writestr(name, body)
    return output.getvalue()


def test_receipt_archive_only_reads_one_bounded_json_file():
    assert module().read_receipt(archive([('receipt.json', '{"schema":1}')])) == {'schema': 1}


@pytest.mark.parametrize('entries', [
    [('../receipt.json', '{}')], [('nested/receipt.json', '{}')],
    [('receipt.json', '{}'), ('extra', '')], [('receipt.json', '[]')],
    [('receipt.json', 'broken')], [('receipt.json', '{"x":1,"x":2}')],
    [('receipt.json', ' ' * 70000)],
])
def test_receipt_archive_rejects_ambiguous_or_unsafe_payloads(entries):
    with pytest.raises(ValueError):
        module().read_receipt(archive(entries))


def test_api_failure_produces_false_not_success(tmp_path, monkeypatch, capsys):
    m = module()
    def denied(*args, **kwargs):
        raise RuntimeError('HTTP 403 secret must not appear')
    monkeypatch.setattr(m, 'verify', denied, raising=False)
    output = tmp_path / 'outputs'
    monkeypatch.setenv('GITHUB_OUTPUT', str(output))
    m.decide()
    assert output.read_text() == 'reuse=false\nrun_id=\n'
    assert 'secret' not in capsys.readouterr().out


def test_bounded_command_rejects_large_output_and_failure():
    m = module()
    with pytest.raises(ValueError):
        m.command(['python3', '-c', 'print("x"*100)'], limit=20)
    with pytest.raises(subprocess.CalledProcessError):
        m.command(['python3', '-c', 'raise SystemExit(2)'])


def test_only_latest_run_is_considered():
    m = module()
    assert m.latest_run([{'id': 1, 'created_at': '2026-10-30T19:00:00Z'},
                         {'id': 2, 'created_at': '2026-10-30T20:00:00Z'}])['id'] == 2
    with pytest.raises(ValueError):
        m.latest_run([])


def test_workflow_keeps_pr_full_and_container_unconditional():
    import yaml
    root = PATH.parents[1]
    ci = yaml.safe_load((root / '.github/workflows/ci.yml').read_text())
    inputs = ci.get('on', ci.get(True))['workflow_call']['inputs']
    assert inputs['reuse_application']['default'] is False
    for name in ['python', 'formatter', 'browser']:
        assert ci['jobs'][name]['if'] == '${{ !inputs.reuse_application }}'
    assert 'if' not in ci['jobs']['container']
    assert 'if' not in ci['jobs']['branch-policy']
    release = yaml.safe_load((root / '.github/workflows/release.yml').read_text())
    assert release['jobs']['evidence']['permissions'] == {'contents': 'read', 'actions': 'read', 'pull-requests': 'read'}
    assert release['jobs']['correctness']['if'].startswith('${{ always()')
    assert release['jobs']['correctness']['with']['reuse_application'] == "${{ needs.evidence.result == 'success' && needs.evidence.outputs.reuse == 'true' }}"
    assert release['jobs']['publish']['needs'] == 'correctness'


@pytest.fixture
def verifier_setup(bundle, monkeypatch, tmp_path):
    """External GitHub/git boundaries are controlled; real verifier/ZIP/digests run."""
    import hashlib
    m = module()
    probe = tmp_path / 'probe.json'
    probe.write_text(json.dumps(bundle['environment']))
    for key, value in {'GITHUB_REPOSITORY': bundle['repo'], 'GITHUB_SHA': bundle['release'],
                       'GITHUB_REF_NAME': bundle['branch'], 'GITHUB_EVENT_NAME': 'push',
                       'CI_PROBE_FILE': str(probe)}.items():
        monkeypatch.setenv(key, value)
    monkeypatch.setattr(m, 'datetime', type('Clock', (), {'now': lambda tz: bundle['now'],
                                                       'fromisoformat': datetime.fromisoformat}))
    responses = {
        f"commits/{bundle['release']}/pulls?per_page=100": [bundle['pr']],
        'pulls/53': bundle['pr'], 'actions/workflows/ci.yml': bundle['workflow'],
        f"actions/workflows/ci.yml/runs?event=pull_request&head_sha={bundle['parents'][1]}&per_page=100": {
            'total_count': 1, 'workflow_runs': [bundle['run']]},
        'actions/runs/12/attempts/1/jobs?per_page=100': {'total_count': 9, 'jobs': bundle['jobs']},
        'actions/runs/12': bundle['run'],
    }
    artifacts = []
    for i, (key, receipt) in enumerate(bundle['receipts'].items(), 1):
        raw = archive([('receipt.json', json.dumps(receipt))])
        artifacts.append(dict(id=i, name=f'ci-evidence-{key}-12-1', expired=False,
                              size_in_bytes=len(raw), digest='sha256:' + hashlib.sha256(raw).hexdigest(),
                              expires_at='2026-11-01T00:00:00Z', workflow_run={
                                  'id': 12, 'head_sha': bundle['parents'][1],
                                  'repository_id': 1, 'head_repository_id': 1}))
        responses[f'actions/artifacts/{i}/zip'] = raw
    responses['actions/runs/12/artifacts?per_page=100'] = {'total_count': 6, 'artifacts': artifacts}
    def fake_api(repo, suffix, **kwargs):
        assert repo == bundle['repo']
        return responses[suffix]
    def fake_git(*args):
        if args[:3] == ('show', '-s', '--format=%P'):
            return ' '.join(bundle['parents'])
        if args[0] == 'rev-parse':
            return bundle['tree']
        if args[0] in {'diff', 'fetch'}:
            return ''
        raise AssertionError(args)
    monkeypatch.setattr(m, 'api', fake_api)
    monkeypatch.setattr(m, 'git', fake_git)
    return m, responses


def test_verifier_checks_real_bundle_and_artifact_digests(verifier_setup):
    m, _ = verifier_setup
    assert m.verify() == 12


@pytest.mark.parametrize('mutation', [
    lambda r: r['actions/runs/12/artifacts?per_page=100']['artifacts'][0].update(expired=True),
    lambda r: r['actions/runs/12/artifacts?per_page=100']['artifacts'][0].update(digest='sha256:wrong'),
    lambda r: r['actions/runs/12/artifacts?per_page=100']['artifacts'][0]['workflow_run'].update(head_sha='wrong'),
    lambda r: r['actions/runs/12/artifacts?per_page=100']['artifacts'][0]['workflow_run'].update(head_repository_id=2),
    lambda r: r['actions/runs/12/artifacts?per_page=100'].update(total_count=101),
    lambda r: r['actions/runs/12/attempts/1/jobs?per_page=100'].update(total_count=10),
    lambda r: r.update({'actions/artifacts/1/zip': b'corrupt'}),
])
def test_verifier_rejects_invalid_external_metadata(verifier_setup, mutation):
    m, responses = verifier_setup
    mutation(responses)
    with pytest.raises(ValueError):
        m.verify()


def test_new_rerun_during_verification_is_rejected(verifier_setup):
    m, responses = verifier_setup
    responses['actions/runs/12'] = {**responses['actions/runs/12'], 'run_attempt': 2}
    with pytest.raises(ValueError, match='changed during'):
        m.verify()


def test_aggregate_only_accepts_skips_for_verified_release(monkeypatch):
    import yaml
    ci = yaml.safe_load((PATH.parents[1] / '.github/workflows/ci.yml').read_text())
    shell = ci['jobs']['correctness']['steps'][0]['run']
    good = {name: {'result': 'success'} for name in ['branch-policy', 'container']}
    good.update({name: {'result': 'skipped'} for name in ['python', 'formatter', 'browser']})
    import os
    env = {**os.environ, 'RESULTS': json.dumps(good), 'REUSE': 'true', 'EVIDENCE_RUN': '12',
           'GITHUB_EVENT_NAME': 'push', 'GITHUB_REF': 'refs/heads/dev'}
    assert subprocess.run(['bash', '-e', '-c', shell], env=env, capture_output=True).returncode == 0
    for change in [{'GITHUB_EVENT_NAME': 'pull_request'}, {'REUSE': 'false'}, {'EVIDENCE_RUN': ''},
                   {'RESULTS': json.dumps({**good, 'container': {'result': 'skipped'}})},
                   {'RESULTS': json.dumps({**good, 'python': {'result': 'failure'}})}]:
        assert subprocess.run(['bash', '-e', '-c', shell], env={**env, **change},
                              capture_output=True).returncode != 0


def test_reusable_actions_are_pinned_including_upload():
    import re
    import yaml
    ci = yaml.safe_load((PATH.parents[1] / '.github/workflows/ci.yml').read_text())
    for job in ('python', 'formatter', 'browser'):
        for step in ci['jobs'][job]['steps']:
            if 'uses' in step:
                assert re.search(r'@[0-9a-f]{40}$', step['uses'])


def test_command_timeout_is_bounded():
    with pytest.raises(subprocess.TimeoutExpired):
        module().command(['python3', '-c', 'import time; time.sleep(5)'], timeout=.05)


def test_failed_receipt_step_cannot_reuse_otherwise_green_job(bundle):
    job = next(j for j in bundle['jobs'] if j['name'] == 'python')
    job['steps'] = [{'name': 'Record application-test environment', 'conclusion': 'failure'},
                    {'name': 'Retain bounded test evidence', 'conclusion': 'success'}]
    with pytest.raises(ValueError, match='receipt steps'):
        module().validate_bundle(**bundle)


def test_collector_refuses_dirty_checkout(tmp_path, monkeypatch):
    m = module()
    def dirty(*args):
        raise subprocess.CalledProcessError(1, ['git', *args])
    monkeypatch.setattr(m, 'git', dirty)
    output = tmp_path / 'receipt.json'
    with pytest.raises(subprocess.CalledProcessError):
        m.collect('python', output)
    assert not output.exists()


def test_fingerprint_requires_runner_identity(monkeypatch):
    m = module()
    monkeypatch.delenv('ImageVersion', raising=False)
    with pytest.raises(KeyError):
        m.fingerprint('python')


def test_probe_failure_is_optional_but_correctness_is_not():
    import yaml
    jobs = yaml.safe_load((PATH.parents[1] / '.github/workflows/release.yml').read_text())['jobs']
    assert jobs['evidence']['continue-on-error'] is True
    assert jobs['correctness'].get('continue-on-error', False) is False
