#!/usr/bin/env python3
"""Watch release branches and publish retained exact-candidate evidence locally."""
import argparse
from contextlib import contextmanager
from datetime import datetime, timezone
import fcntl
import json
import logging
import os
from pathlib import Path
import signal
import subprocess
import sys
import tempfile
import threading
import time

from local_ci import ROOT, run_process

REPOSITORY_URL = 'https://github.com/bcl1713/backstory.git'
CHANNELS = {'dev': 'dev', 'main': 'stable'}


@contextmanager
def publisher_lock(directory):
    directory = Path(directory)
    directory.mkdir(mode=0o700, parents=True, exist_ok=True)
    with (directory / 'publisher.lock').open('a') as lock:
        fcntl.flock(lock.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        yield


class Publisher:
    def __init__(self, state_dir, *, port=19493, retry_delay=300):
        self.state_dir = Path(state_dir).resolve()
        if self.state_dir == ROOT or ROOT in self.state_dir.parents:
            raise ValueError('Publisher state must be outside the controller checkout.')
        self.state_dir.mkdir(mode=0o700, parents=True, exist_ok=True)
        self.mirror = self.state_dir / 'repository.git'
        self.state_path = self.state_dir / 'state.json'
        self.state = json.loads(self.state_path.read_text()) if self.state_path.exists() else {'schema': 1, 'channels': {}}
        if self.state.get('schema') != 1 or not isinstance(self.state.get('channels'), dict):
            raise ValueError('Unrecognized publisher state; refusing to reset publication history.')
        self.port, self.retry_delay = port, retry_delay
        self.stopping = threading.Event()

    def save(self):
        temporary = self.state_path.with_suffix('.tmp')
        with temporary.open('w') as stream:
            json.dump(self.state, stream, indent=2)
            stream.write('\n')
            stream.flush()
            os.fsync(stream.fileno())
        temporary.replace(self.state_path)

    def git(self, *args):
        return subprocess.check_output(['git', '--git-dir', str(self.mirror), *args],
                                       text=True, timeout=120,
                                       env={**os.environ, 'GIT_TERMINAL_PROMPT': '0'}).strip()

    def fetch(self):
        # This mirror belongs only to this publisher; no developer checkout is reset.
        subprocess.run(['git', 'init', '--bare', '--quiet', str(self.mirror)], check=True)
        self.git('config', 'remote.origin.url', REPOSITORY_URL)
        self.git('fetch', '--quiet', 'origin', '--tags',
                 '+refs/heads/dev:refs/heads/dev', '+refs/heads/main:refs/heads/main')

    def baseline(self, branches):
        self.fetch()
        for branch in branches:
            if branch not in CHANNELS or self.state['channels'].get(branch):
                raise ValueError('Baseline is only for an uninitialized release branch.')
            self.state['channels'][branch] = {
                'baseline_sha': self.git('rev-parse', 'refs/heads/' + branch),
                'status': 'baseline',
            }
        self.save()

    def attempt(self, branch, sha, record):
        jobs = self.state_dir / 'jobs'
        jobs.mkdir(mode=0o700, exist_ok=True)
        job = Path(tempfile.mkdtemp(prefix=branch + '-' + sha[:12] + '-', dir=jobs))
        record.update(source_sha=sha, job=str(job), status='validating')
        self.save()
        logging.info('Publishing %s %s with retained candidate evidence; attempt: %s', branch, sha, job)
        # Import lazily: the candidate controller shares this module's lock.
        from local_candidate import validate_evidence
        candidate_path = self.state_dir / 'candidates' / sha / 'candidate.json'
        candidate = json.loads(candidate_path.read_text())
        if (branch not in candidate.get('landed_branches', []) or candidate.get('source_sha') != sha
                or candidate.get('status') not in ('landing', 'landed')
                or candidate.get('reviewed_candidate') != sha):
            raise ValueError('Release branch needs reviewed exact-candidate evidence; no post-merge gate fallback.')
        receipt_path = validate_evidence(candidate_path, candidate)
        source = candidate_path.parent / 'source'
        record.update(candidate=str(candidate_path), receipt=str(receipt_path), status='publishing')
        self.save()
        with (job / 'pipeline.log').open('w') as log:
            self.fetch()
            if self.git('rev-parse', 'refs/heads/' + branch) != sha:
                record['status'] = 'superseded'
                self.save()
                return 'superseded'
            # The source runner independently validates provenance, every gate,
            # origin, current branch, image digest and the AMD64 release platform.
            run_process([sys.executable, 'scripts/local_release.py', '--receipt', str(receipt_path),
                         '--channel', CHANNELS[branch], '--assets', str(job / 'release-assets'), '--publish'],
                        cwd=source, stdout=log, stderr=subprocess.STDOUT, timeout=7200)
        record.update(status='published', published_sha=sha,
                      published_at=datetime.now(timezone.utc).isoformat())
        record.pop('failed_sha', None)
        record.pop('retry_after', None)
        record.pop('error', None)
        self.save()
        logging.info('Published %s %s', branch, sha)
        return 'published'

    def poll(self):
        self.fetch()
        heads = {branch: self.git('rev-parse', 'refs/heads/' + branch) for branch in CHANNELS}
        outcomes = {}
        for branch, sha in heads.items():
            if self.stopping.is_set():
                break
            record = self.state['channels'].setdefault(branch, {})
            if sha in (record.get('published_sha'), record.get('baseline_sha')):
                outcomes[branch] = 'unchanged'
            elif record.get('failed_sha') == sha and time.time() < record.get('retry_after', 0):
                outcomes[branch] = 'waiting'
            else:
                try:
                    outcomes[branch] = self.attempt(branch, sha, record)
                except Exception as error:
                    record.update(status='failed', failed_sha=sha,
                                  retry_after=time.time() + self.retry_delay, error=str(error))
                    self.save()
                    logging.exception('Publication attempt failed for %s %s; see %s', branch, sha, record.get('job'))
                    outcomes[branch] = 'failed'
        return outcomes


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state-dir', type=Path, required=True)
    parser.add_argument('--interval', type=int, default=30)
    parser.add_argument('--retry-delay', type=int, default=300)
    parser.add_argument('--port', type=int, default=19493)
    parser.add_argument('--once', action='store_true')
    parser.add_argument('--status', action='store_true')
    parser.add_argument('--baseline-current', action='append', choices=list(CHANNELS), default=[])
    args = parser.parse_args()
    if args.interval < 1 or args.retry_delay < 1 or not 1024 <= args.port <= 65535:
        parser.error('Use positive polling/retry intervals and a non-privileged port.')
    if args.status:
        print((args.state_dir / 'state.json').read_text())
        return
    os.umask(0o077)
    logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
    with publisher_lock(args.state_dir):
        worker = Publisher(args.state_dir, port=args.port, retry_delay=args.retry_delay)
        if args.baseline_current:
            worker.baseline(args.baseline_current)
            return
        # systemd sends TERM only to this controller first (KillMode=mixed).
        # Drain the current attempt, including uploads, before leaving the loop.
        for sig in (signal.SIGTERM, signal.SIGINT):
            signal.signal(sig, lambda signum, frame: worker.stopping.set())
        while not worker.stopping.is_set():
            try:
                result = worker.poll()
                if args.once:
                    raise SystemExit(1 if 'failed' in result.values() else 0)
            except Exception:
                logging.exception('Cannot poll release branches')
                if args.once:
                    raise
            worker.stopping.wait(args.interval)


if __name__ == '__main__':
    main()
