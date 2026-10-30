#!/usr/bin/env python3
"""Conservative release test-evidence reuse. Uncertainty is a cache miss, not a pass."""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import io
import json
import os
from pathlib import Path
import re
import subprocess
import zipfile

SCHEMA = 1
MAX_RECEIPT = 65536
MAX_ARCHIVE = 131072
MAX_AGE_SECONDS = 24 * 60 * 60
PROFILES = {'python': 'python', 'formatter': 'formatter', **{
    f'browser-{i}': 'browser' for i in range(1, 5)}}
EXPECTED_JOBS = {'branch-policy', 'python', 'formatter', 'container', 'correctness', *{
    f'browser ({i})' for i in range(1, 5)}}
POLICY_PATHS = ('.github', 'scripts/ci_evidence.py')
SHA = re.compile(r'[0-9a-f]{40}\Z')


class EvidenceMismatch(ValueError):
    """A fixed, non-sensitive policy reason suitable for the workflow summary."""


def require(condition, message):
    if not condition:
        raise EvidenceMismatch(message)


def timestamp(value):
    result = datetime.fromisoformat(value.replace('Z', '+00:00'))
    require(result.tzinfo is not None, 'timestamp has no timezone')
    return result


def validate_bundle(*, repo, release, branch, parents, tree, tested_parents,
                    tested_tree, policy_unchanged, workflow, pr, run, jobs,
                    receipts, environment, now):
    """Validate independent API/git observations and non-executable receipts together."""
    require(branch in {'dev', 'main'}, 'not a release branch')
    require(policy_unchanged, 'CI/evidence policy changed')
    require(len(parents) == 2, 'not a two-parent merge')
    require(tested_parents == parents and tested_tree == tree, 'tested source differs')
    require(pr['merged'] is True and pr['state'] == 'closed', 'PR is not merged')
    require(pr['merge_commit_sha'] == release, 'different merge commit')
    require(pr['author_association'] in {'OWNER', 'MEMBER', 'COLLABORATOR'}, 'untrusted PR author')
    require(pr['base']['ref'] == branch and pr['base']['sha'] == parents[0], 'different PR base')
    require(pr['head']['sha'] == parents[1], 'different PR head')
    require(pr['base']['repo']['full_name'] == repo and
            pr['head']['repo']['full_name'] == repo and
            pr['head']['repo']['fork'] is False, 'fork or different repository')
    require(workflow['state'] == 'active' and workflow['path'] == '.github/workflows/ci.yml',
            'unexpected CI workflow')
    require(run['workflow_id'] == workflow['id'] and run['path'] == workflow['path'],
            'different workflow run')
    require(run['event'] == 'pull_request' and run['run_attempt'] == 1,
            'only original PR runs are reusable')
    require(run['status'] == 'completed' and run['conclusion'] == 'success', 'CI not successful')
    require(run['repository']['full_name'] == repo and
            run['head_repository']['full_name'] == repo and
            run['head_repository']['fork'] is False, 'different run repository')
    require(run['head_sha'] == parents[1], 'run head differs')
    require([p['number'] for p in run['pull_requests']] == [pr['number']], 'ambiguous run PR')
    age = (now - timestamp(run['created_at'])).total_seconds()
    require(0 <= age <= MAX_AGE_SECONDS, 'evidence is stale or future-dated')
    require(timestamp(run['created_at']) <= timestamp(run['updated_at']) <= now,
            'invalid completion time')
    require(len(jobs) == len(EXPECTED_JOBS) and {j['name'] for j in jobs} == EXPECTED_JOBS,
            'missing, duplicate or unexpected jobs')
    require(all(j['run_id'] == run['id'] and
                j['status'] == 'completed' and j['conclusion'] == 'success' for j in jobs),
            'job is not an original-attempt success')
    for job in jobs:
        if job['name'] in {'python', 'formatter'} or job['name'].startswith('browser ('):
            for name in ('Record application-test environment', 'Retain bounded test evidence'):
                steps = [step for step in job['steps'] if step['name'] == name]
                require(len(steps) == 1 and steps[0]['conclusion'] == 'success',
                        'receipt steps did not succeed')
    require(set(receipts) == set(PROFILES), 'missing or unexpected receipts')
    sources = {r['source'] for r in receipts.values()}
    require(len(sources) == 1 and all(SHA.fullmatch(s) for s in sources), 'inconsistent tested commits')
    for key, profile in PROFILES.items():
        receipt = receipts[key]
        require(receipt['schema'] == SCHEMA and receipt['repository'] == repo and
                receipt['run_id'] == run['id'] and receipt['attempt'] == 1 and
                receipt['job'] == key and receipt['profile'] == profile and
                receipt['tree'] == tree, 'receipt identity differs')
        require(bool(environment[profile]) and receipt['environment'] == environment[profile],
                'test environment differs')
    return run['id']


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, 'duplicate JSON key')
        result[key] = value
    return result


def read_receipt(data):
    """Read one fixed JSON member without extracting files or accepting ZIP bombs."""
    require(len(data) <= MAX_ARCHIVE, 'oversized archive')
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            entries = archive.infolist()
            require(len(entries) == 1, 'unexpected archive members')
            entry = entries[0]
            require(entry.filename == 'receipt.json' and not entry.is_dir() and
                    entry.file_size <= MAX_RECEIPT and not entry.flag_bits & 1,
                    'invalid receipt member')
            with archive.open(entry) as source:
                raw = source.read(MAX_RECEIPT + 1)
            require(len(raw) <= MAX_RECEIPT, 'oversized receipt')
            value = json.loads(raw, object_pairs_hook=unique_object)
            require(isinstance(value, dict), 'receipt is not an object')
            return value
    except (zipfile.BadZipFile, UnicodeError, json.JSONDecodeError, RuntimeError) as exc:
        raise ValueError('invalid receipt archive') from exc


def command(args, *, limit=2_000_000, timeout=60, binary=False):
    """Bound both output and elapsed time; never interpolate evidence into a shell."""
    import select
    import time
    with subprocess.Popen(args, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL) as process:
        output = bytearray()
        deadline = time.monotonic() + timeout
        try:
            while True:
                remaining = deadline - time.monotonic()
                if remaining <= 0 or not select.select([process.stdout], [], [], remaining)[0]:
                    raise subprocess.TimeoutExpired(args, timeout)
                part = os.read(process.stdout.fileno(), min(65536, limit + 1 - len(output)))
                if not part:
                    break
                output.extend(part)
                require(len(output) <= limit, 'command output too large')
            returncode = process.wait(timeout=max(.01, deadline - time.monotonic()))
            if returncode:
                raise subprocess.CalledProcessError(returncode, args)
        except BaseException:
            process.kill()
            process.wait()
            raise
    return bytes(output) if binary else output.decode().strip()


def git(*args):
    return command(['git', *args])


def api(repo, suffix, *, binary=False, limit=2_000_000):
    require(re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+', repo), 'invalid repository')
    data = command(['gh', 'api', '-H', 'Accept: application/vnd.github+json',
                    f'repos/{repo}/{suffix}'], binary=binary, limit=limit)
    return data if binary else json.loads(data, object_pairs_hook=unique_object)


def page(repo, suffix, key):
    result = api(repo, suffix + ('&' if '?' in suffix else '?') + 'per_page=100')
    require(result['total_count'] == len(result[key]) and len(result[key]) <= 100,
            'incomplete or oversized metadata page')
    return result[key]


def latest_run(runs):
    require(bool(runs), 'no candidate run')
    # Never search backwards past a newer failed/incomplete/re-run candidate.
    return max(runs, key=lambda run: (timestamp(run['created_at']), run['id']))


def fingerprint(profile):
    require(profile in set(PROFILES.values()), 'unknown environment profile')
    required_env = ('ImageOS', 'ImageVersion', 'RUNNER_OS', 'RUNNER_ARCH')
    result = {key: os.environ[key] for key in required_env}
    require(all(result.values()), 'runner identity unavailable')
    result['inputs'] = {key: os.environ.get(key, '') for key in (
        'CI', 'TZ', 'LANG', 'LC_ALL', 'NODE_ENV', 'NODE_OPTIONS', 'PYTHONHASHSEED',
        'PYTHONPATH', 'PYTHONWARNINGS', 'PLAYWRIGHT_BROWSERS_PATH')}
    result['node'] = command(['node', '--version'])
    result['npm'] = command(['npm', '--version'])
    result['npm_packages'] = hashlib.sha256(command(
        ['npm', 'ls', '--all', '--json'], binary=True).strip()).hexdigest()
    result['os_packages'] = hashlib.sha256(command(
        ['dpkg-query', '-W', '-f=${binary:Package}=${Version}\n'], binary=True)).hexdigest()
    if profile != 'formatter':
        result['python'] = command(['.venv/bin/python', '-VV'])
        result['uv'] = command(['uv', '--version'])
        result['python_packages'] = hashlib.sha256(command(
            ['uv', 'pip', 'freeze', '--python', '.venv/bin/python'], binary=True)).hexdigest()
    if profile == 'browser':
        binaries = sorted(path for path in (Path.home() / '.cache/ms-playwright').glob('**/*')
                          if path.is_file() and path.name in {'headless_shell', 'chrome-headless-shell'})
        require(len(binaries) == 1, 'ambiguous or missing browser binary')
        with binaries[0].open('rb') as stream:
            result['browser_binary'] = hashlib.file_digest(stream, 'sha256').hexdigest()
    return result


def collect(job, destination):
    profile = PROFILES[job]
    # A receipt must describe the checkout, not tracked files modified by setup.
    git('diff', '--exit-code', 'HEAD', '--')
    source = git('rev-parse', 'HEAD')
    require(SHA.fullmatch(source), 'invalid checkout')
    receipt = dict(schema=SCHEMA, repository=os.environ['GITHUB_REPOSITORY'],
                   run_id=int(os.environ['GITHUB_RUN_ID']), attempt=int(os.environ['GITHUB_RUN_ATTEMPT']),
                   job=job, profile=profile, source=source, tree=git('rev-parse', 'HEAD^{tree}'),
                   environment=fingerprint(profile))
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(receipt, sort_keys=True))


def verify():
    repo, release, branch = (os.environ[k] for k in ('GITHUB_REPOSITORY', 'GITHUB_SHA', 'GITHUB_REF_NAME'))
    require(os.environ['GITHUB_EVENT_NAME'] == 'push', 'only push releases reuse evidence')
    require(SHA.fullmatch(release), 'invalid release commit')
    parents = git('show', '-s', '--format=%P', release).split()
    require(len(parents) == 2 and all(SHA.fullmatch(p) for p in parents), 'not a merge release')
    policy_unchanged = not git('diff', '--name-only', parents[0], release, '--', *POLICY_PATHS)
    require(policy_unchanged, 'CI/evidence policy changed')
    pulls = api(repo, f'commits/{release}/pulls?per_page=100')
    require(isinstance(pulls, list) and len(pulls) < 100, 'incomplete PR associations')
    matching = [p for p in pulls if p.get('merge_commit_sha') == release]
    require(len(matching) == 1, 'ambiguous merged PR')
    number = matching[0]['number']
    require(type(number) is int and number > 0, 'invalid PR identity')
    pr = api(repo, f'pulls/{number}')
    workflow = api(repo, 'actions/workflows/ci.yml')
    runs = page(repo, f'actions/workflows/ci.yml/runs?event=pull_request&head_sha={parents[1]}', 'workflow_runs')
    run = latest_run(runs)
    run_id = run['id']
    require(type(run_id) is int and run_id > 0, 'invalid run identity')
    # Fail before downloads for a newer failed/retried run.
    require(run['status'] == 'completed' and run['conclusion'] == 'success' and run['run_attempt'] == 1,
            'latest run is not an original success')
    jobs = page(repo, f'actions/runs/{run_id}/attempts/1/jobs', 'jobs')
    artifacts = page(repo, f'actions/runs/{run_id}/artifacts', 'artifacts')
    receipts = {}
    now = datetime.now(timezone.utc)
    for key in PROFILES:
        name = f'ci-evidence-{key}-{run_id}-1'
        matches = [a for a in artifacts if a['name'] == name]
        require(len(matches) == 1, 'missing or duplicate evidence artifact')
        artifact = matches[0]
        require(artifact['expired'] is False and 0 < artifact['size_in_bytes'] <= MAX_ARCHIVE and
                artifact['workflow_run']['id'] == run_id and
                artifact['workflow_run']['head_sha'] == parents[1] and
                artifact['workflow_run']['repository_id'] == artifact['workflow_run']['head_repository_id'] and
                timestamp(artifact['expires_at']) > now, 'invalid artifact provenance')
        artifact_id = artifact['id']
        require(type(artifact_id) is int and artifact_id > 0, 'invalid artifact identity')
        raw = api(repo, f'actions/artifacts/{artifact_id}/zip', binary=True, limit=MAX_ARCHIVE)
        require(artifact['digest'] == 'sha256:' + hashlib.sha256(raw).hexdigest(), 'artifact digest differs')
        receipts[key] = read_receipt(raw)
    tested = receipts['python']['source']
    require(SHA.fullmatch(tested), 'invalid tested commit')
    # Fetch only a validated object ID from this checkout's origin, never an artifact URL/ref.
    git('fetch', '--no-tags', 'origin', tested)
    tested_parents = git('show', '-s', '--format=%P', tested).split()
    tested_tree = git('rev-parse', f'{tested}^{{tree}}')
    environment = json.loads(Path(os.environ['CI_PROBE_FILE']).read_text(), object_pairs_hook=unique_object)
    result = validate_bundle(repo=repo, release=release, branch=branch, parents=parents,
                             tree=git('rev-parse', f'{release}^{{tree}}'), tested_parents=tested_parents,
                             tested_tree=tested_tree, policy_unchanged=policy_unchanged,
                             workflow=workflow, pr=pr, run=run, jobs=jobs, receipts=receipts,
                             environment=environment, now=now)
    # Reject a rerun started while evidence was being inspected.
    latest_candidate = latest_run(page(repo, f'actions/workflows/ci.yml/runs?event=pull_request&head_sha={parents[1]}', 'workflow_runs'))
    require(latest_candidate['id'] == run_id, 'newer run appeared during verification')
    latest = api(repo, f'actions/runs/{run_id}')
    require(latest['run_attempt'] == 1 and latest['status'] == 'completed' and
            latest['conclusion'] == 'success', 'run changed during verification')
    return result


def decide():
    run_id = ''
    try:
        run_id = str(verify())
        message = f'Reusing verified application checks from CI run {run_id}; container checks still run.'
    except EvidenceMismatch as exc:
        message = f'Full correctness suite selected: {exc}.'
    except Exception:
        # Do not copy API bodies, credentials, local paths or arbitrary exception text into logs.
        message = 'Prior application checks could not be fully verified; running the complete correctness suite.'
    with open(os.environ['GITHUB_OUTPUT'], 'a') as output:
        output.write(f'reuse={str(bool(run_id)).lower()}\nrun_id={run_id}\n')
    print(message)
    if summary := os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(summary, 'a') as output:
            output.write(message + '\n')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=['collect', 'probe', 'decide'])
    parser.add_argument('--job', choices=PROFILES)
    parser.add_argument('--profile', choices=sorted(set(PROFILES.values())))
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    if args.mode == 'collect':
        collect(args.job, args.output)
    elif args.mode == 'probe':
        existing = json.loads(args.output.read_text()) if args.output.exists() else {}
        existing[args.profile] = fingerprint(args.profile)
        args.output.write_text(json.dumps(existing, sort_keys=True))
    else:
        decide()


if __name__ == '__main__':
    main()
