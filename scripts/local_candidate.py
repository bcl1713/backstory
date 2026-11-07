#!/usr/bin/env python3
"""Prepare, test, review and land an exact merge commit without hosted Actions."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

from local_ci import ROOT, branch_policy, run_process, source_identity, validate_receipt
from local_publisher import REPOSITORY_URL, publisher_lock

REPOSITORY = 'bcl1713/backstory'


def git(source, *args):
    return subprocess.check_output(['git', *args], cwd=source, text=True, timeout=120,
                                   env={**os.environ, 'GIT_TERMINAL_PROMPT': '0'}).strip()


def pull_request(number):
    endpoint = f'repos/{REPOSITORY}/pulls/{number}'
    def snapshot():
        data = json.loads(subprocess.check_output(
            ['gh', 'api', '--hostname', 'github.com', endpoint], text=True, timeout=120))
        head_repo = data['head'].get('repo') or {}
        # Pull-request base.sha can remain the PR's old base snapshot. Prepare
        # against the live target ref, then compare it again after review reads.
        target = json.loads(subprocess.check_output(
            ['gh', 'api', '--hostname', 'github.com',
             f'repos/{REPOSITORY}/git/ref/heads/' + data['base']['ref']],
            text=True, timeout=120))
        return dict(number=data['number'], state=data['state'].upper(), isDraft=data['draft'],
                    baseRefName=data['base']['ref'], baseRefOid=target['object']['sha'],
                    headRefName=data['head']['ref'], headRefOid=data['head']['sha'],
                    headRepository={'name': head_repo.get('name')},
                    headRepositoryOwner={'login': head_repo.get('owner', {}).get('login')},
                    author={'login': data['user']['login']})
    # baseRefOid is a GraphQL field but is not exposed by installed gh pr view.
    # REST supplies PR identity and the live target ref; retain gh's supported
    # reviewDecision and bind it to that same PR/head before accepting evidence.
    pr = snapshot()
    fields = 'number,state,isDraft,baseRefName,headRefName,headRefOid,reviewDecision'
    view = json.loads(subprocess.check_output(
        ['gh', 'pr', 'view', str(number), '--repo', 'github.com/' + REPOSITORY,
         '--json', fields], text=True, timeout=120))
    if any(view[key] != pr[key] for key in fields.split(',') if key != 'reviewDecision'):
        raise ValueError('PR metadata changed between REST and review decision observations.')
    pages = json.loads(subprocess.check_output(
        ['gh', 'api', '--hostname', 'github.com', '--paginate', '--slurp',
         endpoint + '/reviews'], text=True, timeout=120))
    if snapshot() != pr:
        raise ValueError('PR head/base metadata changed while reading review evidence.')
    pr['reviewDecision'] = view['reviewDecision']
    pr['reviews'] = [review for page in pages for review in page]
    return pr


def check_pr(pr, *, reviewed=False):
    if (pr.get('state') != 'OPEN' or pr.get('isDraft')
            or pr.get('baseRefName') not in ('dev', 'main')
            or pr.get('headRepositoryOwner', {}).get('login') != 'bcl1713'
            or pr.get('headRepository', {}).get('name') != 'backstory'):
        raise ValueError('Candidate needs an open, non-draft same-repository release PR.')
    branch_policy(pr['baseRefName'], pr['headRefName'])
    if reviewed:
        # Latest decisive review per person; comments do not revoke an approval.
        latest = {}
        for review in pr.get('reviews', []):
            if review['state'] in ('APPROVED', 'CHANGES_REQUESTED', 'DISMISSED'):
                latest[review['user']['login']] = review
        if (any(r['state'] == 'CHANGES_REQUESTED' for r in latest.values())
                or pr.get('reviewDecision') in ('CHANGES_REQUESTED', 'REVIEW_REQUIRED')):
            raise ValueError('Outstanding or required PR code review blocks candidate landing.')


def save(path, record):
    temporary = path.with_suffix('.tmp')
    with temporary.open('w') as stream:
        json.dump(record, stream, indent=2)
        stream.write('\n')
        stream.flush()
        os.fsync(stream.fileno())
    temporary.replace(path)


def receipt_digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def validate_evidence(path, record):
    """Shared by landing and publication; never trust a status field alone."""
    source = path.parent / 'source'
    if record.get('schema') != 1 or record.get('status') not in ('tested', 'landing', 'landed'):
        raise ValueError('Successful tested candidate evidence is required.')
    sha, tree = source_identity(source)
    if (sha, tree) != (record.get('source_sha'), record.get('source_tree')):
        raise ValueError('Candidate source identity changed.')
    receipt_path = path.parent / 'evidence/receipt.json'
    receipt = json.loads(receipt_path.read_text())
    validate_receipt(receipt, sha, tree, root=source)
    if receipt_digest(receipt_path) != record.get('receipt_sha256'):
        raise ValueError('Candidate receipt changed after testing.')
    parents = git(source, 'show', '-s', '--format=%P', sha).split()
    if parents != [record.get('base_sha'), record.get('head_sha')]:
        raise ValueError('Candidate is not the recorded two-parent merge result.')
    if record.get('base') not in ('dev', 'main') or record.get('head') == record.get('base'):
        raise ValueError('Invalid candidate release branch policy.')
    branch_policy(record['base'], record['head'])
    if record['status'] in ('landing', 'landed'):
        review = record.get('local_review', {})
        expected = sorted({record['base'], record['head']} & {'dev', 'main'})
        if (record.get('landed_branches') != expected
                or record.get('reviewed_candidate') != sha
                or review.get('source_sha') != sha or review.get('status') != 'approved'
                or not review.get('reviewer') or not review.get('summary')):
            raise ValueError('Landed candidate needs exact independent review and release branch evidence.')
    return receipt_path


def run_gate(source, report, base, head, port):
    env = dict(os.environ)
    env.pop('BUILDX_BUILDER', None)
    with (source.parent / 'gate.log').open('w') as log:
        run_process([sys.executable, 'scripts/local_ci.py', '--base', base, '--head', head,
                     '--report', str(report), '--port', str(port)], cwd=source, env=env,
                    stdout=log, stderr=subprocess.STDOUT, timeout=7200)


class Candidates:
    def __init__(self, state_dir):
        self.state_dir = Path(state_dir).resolve()
        if self.state_dir == ROOT or ROOT in self.state_dir.parents:
            raise ValueError('Candidate state must be outside the controller checkout.')
        self.directory = self.state_dir / 'candidates'
        self.directory.mkdir(mode=0o700, parents=True, exist_ok=True)

    def prepare(self, number):
        pr = pull_request(number)
        check_pr(pr)
        job = Path(tempfile.mkdtemp(prefix='prepare-', dir=self.directory))
        source = job / 'source'
        subprocess.run(['git', 'clone', '--quiet', REPOSITORY_URL, str(source)], check=True)
        git(source, 'fetch', 'origin', 'refs/heads/' + pr['baseRefName'], 'refs/heads/' + pr['headRefName'])
        if (git(source, 'rev-parse', 'origin/' + pr['baseRefName']) != pr['baseRefOid']
                or git(source, 'rev-parse', 'origin/' + pr['headRefName']) != pr['headRefOid']):
            raise ValueError('PR changed during preparation; prepare a new candidate.')
        git(source, 'checkout', '--detach', pr['baseRefOid'])
        # Never use GitHub's independently generated merge SHA or squash/rebase.
        git(source, '-c', 'user.name=Backstory merge queue', '-c', 'user.email=merge-queue@localhost',
            'merge', '--no-ff', '--no-edit', '-m', f'Merge PR #{number}: {pr["headRefName"]}', pr['headRefOid'])
        sha, tree = source_identity(source)
        if git(source, 'show', '-s', '--format=%P', sha).split() != [pr['baseRefOid'], pr['headRefOid']]:
            raise ValueError('Candidate must be a new two-parent merge; no changes remain to merge.')
        job = job.rename(self.directory / sha)
        path = job / 'candidate.json'
        save(path, dict(schema=1, status='prepared', pr=number, base=pr['baseRefName'],
                        head=pr['headRefName'], base_sha=pr['baseRefOid'], head_sha=pr['headRefOid'],
                        source_sha=sha, source_tree=tree))
        return path

    def read(self, path):
        path = Path(path).resolve()
        if path.parent.parent != self.directory or path.name != 'candidate.json':
            raise ValueError('Use a candidate.json in this controller candidate store.')
        return path, json.loads(path.read_text())

    def fresh(self, source, record, *, reviewed=False):
        pr = pull_request(record['pr'])
        check_pr(pr, reviewed=reviewed)
        if any(pr[key] != record[value] for key, value in (
                ('baseRefName', 'base'), ('headRefName', 'head'),
                ('baseRefOid', 'base_sha'), ('headRefOid', 'head_sha'))):
            raise ValueError('Candidate head/base is stale; prepare and test a new candidate.')
        heads = dict(line.split()[::-1] for line in git(source, 'ls-remote', 'origin',
                     'refs/heads/' + record['base'], 'refs/heads/' + record['head']).splitlines())
        if any(heads.get('refs/heads/' + record[branch]) != record[sha]
               for branch, sha in (('base', 'base_sha'), ('head', 'head_sha'))):
            raise ValueError('Remote head/base changed; prepare and test a new candidate.')
        return pr

    def test(self, path, port=19493):
        path, record = self.read(path)
        if record['status'] != 'prepared':
            raise ValueError('Only a fresh prepared candidate may start the full gate.')
        self.fresh(path.parent / 'source', record)
        record['status'] = 'testing'
        save(path, record)
        try:
            run_gate(path.parent / 'source', path.parent / 'evidence', record['base'], record['head'], port)
            record.update(status='tested', receipt_sha256=receipt_digest(path.parent / 'evidence/receipt.json'))
            validate_evidence(path, record)
            self.fresh(path.parent / 'source', record)
        except BaseException:
            record['status'] = 'failed'
            save(path, record)
            raise
        save(path, record)

    def land(self, path, reviewed_candidate, review_record=None):
        path, record = self.read(path)
        if reviewed_candidate != record['source_sha']:
            raise ValueError('Explicit review acknowledgement of the exact tested candidate is required.')
        validate_evidence(path, record)
        source = path.parent / 'source'
        # A crash after push leaves durable validated evidence for the publisher.
        # Recovery observes the remote exact SHA instead of retesting or repushing.
        remote = dict(line.split()[::-1] for line in git(source, 'ls-remote', 'origin',
                      'refs/heads/' + record['base'], 'refs/heads/' + record['head']).splitlines())
        if record['status'] == 'landing' and all(remote.get('refs/heads/' + record[key]) == record['source_sha']
                                                  for key in ('base', 'head')):
            record['status'] = 'landed'
            save(path, record)
            return
        pr = self.fresh(source, record, reviewed=True)
        if review_record is None:
            raise ValueError('An independent local review record is required.')
        review = json.loads(Path(review_record).read_text())
        if (review.get('source_sha') != record['source_sha'] or review.get('status') != 'approved'
                or not review.get('reviewer') or not review.get('summary')):
            raise ValueError('Independent review record must approve this exact candidate with reviewer and summary.')
        record.update(status='landing', reviewed_candidate=reviewed_candidate,
                      reviewed_at=datetime.now(timezone.utc).isoformat(), reviews=pr['reviews'], local_review=review,
                      landed_branches=sorted({record['base'], record['head']} & {'dev', 'main'}))
        save(path, record)
        # Both refs really advance, so both leases participate in Git's atomic
        # remote transaction. A compare-only no-op head ref would not be sent.
        # Each advance is a fast-forward to the same already tested merge.
        git(source, 'push', '--porcelain', '--atomic',
            '--force-with-lease=refs/heads/' + record['base'] + ':' + record['base_sha'],
            '--force-with-lease=refs/heads/' + record['head'] + ':' + record['head_sha'],
            'origin', record['source_sha'] + ':refs/heads/' + record['base'],
            record['source_sha'] + ':refs/heads/' + record['head'])
        record['status'] = 'landed'
        save(path, record)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state-dir', type=Path, required=True)
    commands = parser.add_subparsers(dest='action', required=True)
    prepare = commands.add_parser('prepare')
    prepare.add_argument('--pr', type=int, required=True)
    test = commands.add_parser('test')
    test.add_argument('--candidate', type=Path, required=True)
    test.add_argument('--port', type=int, default=19493)
    land = commands.add_parser('land')
    land.add_argument('--candidate', type=Path, required=True)
    land.add_argument('--reviewed-candidate', required=True)
    land.add_argument('--review-record', type=Path, required=True)
    args = parser.parse_args()
    os.umask(0o077)
    # Separate queue lock; publisher can consume a landed candidate concurrently.
    with publisher_lock(Path(args.state_dir) / 'queue-lock'):
        controller = Candidates(args.state_dir)
        if args.action == 'prepare':
            print(controller.prepare(args.pr))
        elif args.action == 'test':
            controller.test(args.candidate, args.port)
        else:
            controller.land(args.candidate, args.reviewed_candidate, args.review_record)


if __name__ == '__main__':
    main()
